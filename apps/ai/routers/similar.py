import os
import numpy as np
import asyncpg
from fastapi import APIRouter, Request
from models.schemas import SimilarRequest, SimilarResponse, SimilarResult

router = APIRouter()
DB_URL = os.getenv("DATABASE_URL", "")


@router.post("/similar", response_model=SimilarResponse)
async def find_similar(request: Request, payload: SimilarRequest):
    """
    Find similar reports using pgvector cosine similarity.
    Queries the ai_analyses table for nearest embedding neighbors.
    """
    if not DB_URL:
        return SimilarResponse(results=[])

    embedding_str = "[" + ",".join(str(x) for x in payload.embedding) + "]"

    try:
        conn = await asyncpg.connect(DB_URL)
        rows = await conn.fetch(
            """
            SELECT report_id, 1 - (embedding <=> $1::vector) as similarity
            FROM ai_analyses
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2
            """,
            embedding_str,
            payload.limit,
        )
        await conn.close()

        results = [
            SimilarResult(report_id=str(row["report_id"]), similarity=float(row["similarity"]))
            for row in rows
        ]
        return SimilarResponse(results=results)

    except Exception as e:
        print(f"Similar query failed: {e}")
        return SimilarResponse(results=[])
