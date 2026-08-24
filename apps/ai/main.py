from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import analyze, similar, cluster, priority, voice
from services.embeddings import EmbeddingService

embedding_service: EmbeddingService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_service
    print("Loading embedding model (paraphrase-multilingual-MiniLM-L12-v2)...")
    embedding_service = EmbeddingService()
    embedding_service.load()
    app.state.embeddings = embedding_service
    print("Embedding model ready")
    yield
    print("Shutting down AI service")


app = FastAPI(
    title="NASMR AI Service",
    description="NLP, embedding, clustering, and priority scoring for civic reports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(analyze.router, prefix="/ai")
app.include_router(similar.router, prefix="/ai")
app.include_router(cluster.router, prefix="/ai")
app.include_router(priority.router, prefix="/ai")
app.include_router(voice.router, prefix="/ai")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": app.state.embeddings is not None,
    }
