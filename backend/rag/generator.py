import google.genai as genai
import os


def generate_answer(query, contexts):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "API key not configured. Please check your environment settings."

        client = genai.Client(api_key=api_key)

        has_context = contexts and len(contexts) > 0

        if has_context:
            query_lower = query.lower()
            is_comprehensive = any(
                word in query_lower
                for word in [
                    "all", "list", "complete", "every", "total", "entire",
                    "every single", "all the", "complete list", "full list",
                    "everything", "all information", "comprehensive",
                ]
            )

            max_contexts = 15 if is_comprehensive else 8
            top_contexts = contexts[:max_contexts]

            context_parts = [c["metadata"]["text"] for c in top_contexts]
            context = "\n\n".join(context_parts)

            print(f"[DEBUG] Query: {query}")
            print(f"[DEBUG] Context length: {len(context)} chars from {len(top_contexts)} sources")

            prompt = f"""
You are a conversational AI assistant integrated with a Retrieval-Augmented Generation (RAG) system.
You have access to verified internal information retrieved from a Vector Database.
This information is your ONLY source of truth for this question.

------------------------------------------------------------
RETRIEVED REFERENCE INFORMATION (DO NOT OUTPUT DIRECTLY)
------------------------------------------------------------
{context}

------------------------------------------------------------
USER QUESTION
------------------------------------------------------------
{query}

------------------------------------------------------------
CRITICAL RESPONSE INSTRUCTIONS (VERY IMPORTANT)
------------------------------------------------------------
1. SOURCE OF TRUTH (MANDATORY):
• Use ONLY the retrieved information above
• Do NOT invent, assume, or hallucinate any facts
• If the information is missing or incomplete, clearly say so

2. HUMAN-LIKE CONVERSATION MODE:
• Respond as if you are chatting with a human, not dumping database records
• NEVER expose raw database structure, lists, JSON, or field-style formatting
• NEVER say things like "according to the database" or "stored data shows"

3. REPHRASING & EXPLANATION (MANDATORY):
• DO NOT copy-paste sentences from the retrieved content
• Read, understand, and EXPLAIN the information in your own words
• Summarize where possible
• Convert structured or technical content into simple, natural language

4. NAME & TERM SAFETY:
• Preserve ALL proper names, company names, technical terms, and spellings EXACTLY
• Do NOT rename, shorten, or rephrase names

5. ANSWER QUALITY:
• Be clear, friendly, and professional
• Use paragraphs or bullet points ONLY when it improves readability

6. WHEN INFORMATION IS PARTIAL:
• Clearly explain what is known
• Clearly state what is not available
• Do NOT fill gaps with assumptions

Think before answering.
Your goal is to HELP the user understand the information, not to display stored content.
"""
        else:
            print(f"[DEBUG] Query: {query}")
            print("[DEBUG] No context from vector DB, using general AI knowledge")

            prompt = f"""
You are an AI Assistant integrated with a Retrieval-Augmented Generation (RAG) system.

User Question:
{query}

------------------------------------------------------------
NORMAL AI ASSISTANT MODE
------------------------------------------------------------
The Vector Database has no relevant stored information for this query.

Instructions:
• Answer naturally like a helpful AI assistant
• Be clear, concise, and professional
• Do NOT reference internal databases or documents
• If unsure, say so honestly

Answer the question in a friendly and helpful way.
"""

        print("[DEBUG] Calling Gemini API...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.3,
                "top_p": 0.8,
                "top_k": 40,
            },
        )

        answer = response.text
        print("[DEBUG] Answer received")
        return answer

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return "I couldn't process that request. Please try rephrasing your question."


def stream_generate_answer(query, contexts):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            yield "API key not configured. Please check your environment settings."
            return

        client = genai.Client(api_key=api_key)

        has_context = contexts and len(contexts) > 0

        if has_context:
            query_lower = query.lower()
            is_comprehensive = any(
                word in query_lower
                for word in [
                    "all", "list", "complete", "every", "total", "entire",
                    "every single", "all the", "complete list", "full list",
                    "everything", "all information", "comprehensive",
                ]
            )

            max_contexts = 15 if is_comprehensive else 8
            top_contexts = contexts[:max_contexts]

            context_parts = [c["metadata"]["text"] for c in top_contexts]
            context = "\n\n".join(context_parts)

            prompt = f"""
You are a conversational AI assistant integrated with a Retrieval-Augmented Generation (RAG) system.

------------------------------------------------------------
RETRIEVED REFERENCE INFORMATION
------------------------------------------------------------
{context}

USER QUESTION:
{query}
"""
        else:
            prompt = f"""
User Question:
{query}

Answer naturally like a helpful AI assistant.
"""

        response = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.3,
                "top_p": 0.8,
                "top_k": 40,
            },
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception:
        yield "I couldn't process that request. Please try rephrasing your question."
