from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from flask_cors import CORS
from uploads.routes import uploads_bp
from rag.routes import rag_bp
from login.routes import login_bp
import os


app = Flask(__name__)
app.secret_key = os.getenv(
    "SECRET_KEY",
    "your-secret-key-change-this-in-production"
)

CORS(
    app,
    origins=["https://ragnetic-1.onrender.com"],
    supports_credentials=True
)

# Register blueprints
app.register_blueprint(uploads_bp)
app.register_blueprint(rag_bp)
app.register_blueprint(login_bp)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
