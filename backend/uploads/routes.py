from flask import Blueprint, request, jsonify, session
from utils.file_parser import parse_file
from rag.generator import generate_answer
import tempfile
import os

uploads_bp = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt'}

def require_auth():
    """Check if user is authenticated (regular user or management)"""
    if 'user_id' in session:
        return session['user_id']
    elif 'management_id' in session:
        return session['management_id']
    return None

@uploads_bp.route("/upload-chat-file", methods=["POST"])
def upload_chat_file():
    """Handle file uploads from chat interface for natural conversation"""
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Validate file extension before attempting to parse
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": f"Unsupported file type '{ext}'. Please upload a PDF, DOCX, or TXT file."
            }), 400

        # Parse the uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            file.save(tmp.name)
            try:
                file_content = parse_file(tmp.name)

                # Guard against empty parsed content
                if not file_content or not file_content.strip():
                    return jsonify({
                        "error": f"No readable text could be extracted from '{file.filename}'. The file may be empty, scanned, or image-based."
                    }), 422

                # Return parsed content to frontend
                return jsonify({
                    "success": True,
                    "filename": file.filename,
                    "content": file_content,
                    "message": f"File '{file.filename}' processed successfully"
                })

            except ValueError as ve:
                return jsonify({"error": str(ve)}), 400

            finally:
                try:
                    os.unlink(tmp.name)
                except OSError:
                    pass

    except Exception as e:
        return jsonify({"error": str(e)}), 500