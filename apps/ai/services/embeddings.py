from sentence_transformers import SentenceTransformer
import numpy as np


class EmbeddingService:
    MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
    _model: SentenceTransformer | None = None

    def load(self):
        self._model = SentenceTransformer(self.MODEL_NAME)

    def encode(self, text: str) -> list[float]:
        if self._model is None:
            raise RuntimeError("Embedding model not loaded. Call .load() first.")
        embedding = self._model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        if self._model is None:
            raise RuntimeError("Embedding model not loaded.")
        embeddings = self._model.encode(texts, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist()

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        va = np.array(a)
        vb = np.array(b)
        return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-10))


# Global singleton — accessed via app.state.embeddings from FastAPI
_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    global _service
    if _service is None:
        _service = EmbeddingService()
        _service.load()
    return _service
