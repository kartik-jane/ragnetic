from flask import Blueprint, request, jsonify
from rag.retriever import retrieve, retrieve_comprehensive
from rag.generator import generate_answer
from utils.file_parser import parse_file
from rag.embeddings import create_embedding
from rag.vector_db import get_index
from db.sqlite_handler import SQLiteHandler
from utils.auth import require_auth, require_admin, require_management
import tempfile
import os


rag_bp = Blueprint("rag", __name__)
db = SQLiteHandler()


@rag_bp.route("/ask", methods=["POST"])
def ask():
    user_id = require_auth()
    management_id = require_management()
    admin_id = require_admin()

    if not user_id and not management_id and not admin_id:
        return jsonify({"error": "Authentication required"}), 401

    if admin_id:
        index_type = "both"
        db_user_id = admin_id
    elif management_id:
        index_type = "management"
        db_user_id = management_id
    else:
        index_type = "user"
        db_user_id = user_id

    try:
        query = request.json.get("query")
        conversation_id = request.json.get("conversation_id")
        file_context = request.json.get("file_context")
        conversation_history = request.json.get("conversation_history", [])
        attached_files = request.json.get("attached_files")

        if not query:
            return jsonify({"error": "No query provided"}), 400

        if not conversation_id:
            if admin_id:
                conversation_id = db.create_conversation(query, admin_id=admin_id)
            else:
                conversation_id = db.create_conversation(query, user_id=db_user_id)

        db.add_message(conversation_id, "user", query, attached_files)

        history_context = ""
        if conversation_history and len(conversation_history) > 0:
            history_context = "\n\nConversation History:\n"
            for msg in conversation_history[-6:]:
                role = "User" if msg["role"] == "user" else "Assistant"
                history_context += f"{role}: {msg['content']}\n"

        comprehensive_keywords = [
            "all", "list", "complete", "every", "total", "entire",
            "every single", "all the", "complete list", "full list",
            "everything", "all information", "comprehensive",
        ]

        if file_context:
            query_lower = query.lower()
            is_comprehensive = any(w in query_lower for w in comprehensive_keywords)

            if is_comprehensive:
                db_results = retrieve_comprehensive(query, index_type=index_type)
            else:
                db_results = retrieve(query, index_type=index_type)

            if db_results and len(db_results) > 0:
                is_comprehensive = any(w in query.lower() for w in comprehensive_keywords)
                max_contexts = 15 if is_comprehensive else 8
                db_context = "\n\n".join([r["metadata"]["text"] for r in db_results[:max_contexts]])

                enhanced_query = f"""
Uploaded File Content:
{file_context}

Vector Database Context:
{db_context}
{history_context}

Current User Question: {query}

Instructions:
- You have access to the uploaded file, vector database, and conversation history
- Answer naturally using all sources when relevant
- Maintain context from previous messages in this conversation
- If user asks to compare or check against database, do so
- Provide helpful, accurate responses
"""
                answer = generate_answer(enhanced_query, db_results)
            else:
                answer = generate_answer(
                    f"File content:\n\n{file_context}\n{history_context}\n\nCurrent user question: {query}",
                    [],
                )

        else:
            query_lower = query.lower()
            is_comprehensive = any(w in query_lower for w in comprehensive_keywords)

            if is_comprehensive:
                results = retrieve_comprehensive(query, index_type=index_type)
            else:
                results = retrieve(query, index_type=index_type)

            if history_context:
                contextualized_query = f"{history_context}\n\nCurrent User Question: {query}"
                answer = generate_answer(contextualized_query, results)
            else:
                answer = generate_answer(query, results)

        db.add_message(conversation_id, "assistant", answer)

        return jsonify({"answer": answer, "conversation_id": conversation_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@rag_bp.route("/conversations", methods=["GET"])
def get_conversations():
    user_id = require_auth()
    management_id = require_management()
    admin_id = require_admin()

    if not user_id and not management_id and not admin_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        if admin_id:
            conversations = db.get_conversations(admin_id=admin_id)
        else:
            db_user_id = management_id if management_id else user_id
            conversations = db.get_conversations(user_id=db_user_id)

        return jsonify({"conversations": conversations})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@rag_bp.route("/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    user_id = require_auth()
    management_id = require_management()
    admin_id = require_admin()

    if not user_id and not management_id and not admin_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        messages = db.get_conversation_messages(conversation_id)
        return jsonify({"messages": messages})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@rag_bp.route("/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    user_id = require_auth()
    management_id = require_management()
    admin_id = require_admin()

    if not user_id and not management_id and not admin_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        success = db.delete_conversation(conversation_id)
        if success:
            return jsonify({"message": "Conversation deleted"})
        else:
            return jsonify({"error": "Failed to delete conversation"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@rag_bp.route("/conversations/<int:conversation_id>/rename", methods=["PUT"])
def rename_conversation(conversation_id):
    user_id = require_auth()
    management_id = require_management()
    admin_id = require_admin()

    if not user_id and not management_id and not admin_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        new_title = request.json.get("title")
        if not new_title:
            return jsonify({"error": "Title is required"}), 400

        success = db.update_conversation_title(conversation_id, new_title)

        if success:
            return jsonify({"message": "Conversation renamed"})
        else:
            return jsonify({"error": "Failed to rename conversation"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@rag_bp.route("/admin/upload", methods=["POST"])
def admin_upload():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    index_type = request.form.get("index_type", "user")
    if index_type not in ["user", "management", "both"]:
        return jsonify({"error": "Invalid index type"}), 400

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=os.path.splitext(file.filename)[1],
    ) as tmp:
        file.save(tmp.name)

        try:
            text = parse_file(tmp.name)
            emb = create_embedding(text)

            safe_filename = "".join(c if ord(c) < 128 else "_" for c in file.filename)
            vector_id = safe_filename.replace(" ", "_")

            if index_type == "both":
                user_index = get_index("rag-user")
                management_index = get_index("rag-management")

                user_index.upsert([(vector_id, emb, {"text": text, "source": file.filename})])
                management_index.upsert([(vector_id, emb, {"text": text, "source": file.filename})])

                return jsonify({
                    "message": f"File '{file.filename}' uploaded and indexed successfully to both user and management indexes"
                })

            elif index_type == "management":
                index = get_index("rag-management")
                index.upsert([(vector_id, emb, {"text": text, "source": file.filename})])
                return jsonify({
                    "message": f"File '{file.filename}' uploaded and indexed successfully to management index"
                })

            else:
                index = get_index("rag-user")
                index.upsert([(vector_id, emb, {"text": text, "source": file.filename})])
                return jsonify({
                    "message": f"File '{file.filename}' uploaded and indexed successfully to user index"
                })

        finally:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass
