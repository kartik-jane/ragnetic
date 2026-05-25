from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix  # ← ADD THIS
from uploads.routes import uploads_bp
from rag.routes import rag_bp
from login.routes import login_bp
import os

app = Flask(__name__)

# ← ADD THIS RIGHT AFTER app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")

is_production = bool(
    os.getenv("RAILWAY_ENVIRONMENT")
    or os.getenv("RENDER")
    or os.getenv("FLASK_ENV") == "production"
)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None" if is_production else "Lax",
    SESSION_COOKIE_SECURE=is_production,
)

default_origins = [
    "https://ragnetic-1.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in default_origins:
    default_origins.append(frontend_url)

CORS(app, origins=default_origins, supports_credentials=True)

app.register_blueprint(uploads_bp)
app.register_blueprint(rag_bp)
app.register_blueprint(login_bp)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)