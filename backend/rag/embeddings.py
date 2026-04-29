from sentence_transformers import SentenceTransformer
import os

_model = None

MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2"

)

def _get_model():
    global _model
    if _model is None:
        try:
            _model = SentenceTransformer(
                MODEL_NAME,
                device="cpu"   # ✅ FORCE CPU
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load embedding model: {e}")
    return _model

def create_embedding(texts):
    model = _get_model()

    if isinstance(texts, str):
        return model.encode(texts).tolist()
    else:
        return model.encode(texts).tolist()
