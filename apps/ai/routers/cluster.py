import os
import asyncpg
from fastapi import APIRouter
from models.schemas import ClusterRequest, ClusterResponse, ClusterPoint
from services.clustering import run_dbscan

router = APIRouter()
DB_URL = os.getenv("DATABASE_URL", "")


@router.post("/cluster", response_model=ClusterResponse)
async def cluster_reports(payload: ClusterRequest):
    """
    Fetch all analyzed reports from DB, run DBSCAN spatial clustering,
    and return hotspot clusters with GeoJSON boundaries.
    """
    if not DB_URL:
        return ClusterResponse(clusters=[], noise_count=0)

    try:
        conn = await asyncpg.connect(DB_URL)
        rows = await conn.fetch(
            """
            SELECT r.id, r.latitude, r.longitude, r.category
            FROM reports r
            WHERE r.status IN ('ANALYZED', 'IN_PROGRESS')
            ORDER BY r.created_at DESC
            LIMIT 5000
            """
        )
        await conn.close()

        if len(rows) < payload.min_cluster_size:
            return ClusterResponse(clusters=[], noise_count=len(rows))

        coords = [(float(r["latitude"]), float(r["longitude"])) for r in rows]
        report_ids = [str(r["id"]) for r in rows]
        categories = [str(r["category"]) for r in rows]

        clusters_raw, noise_count = run_dbscan(
            coords=coords,
            report_ids=report_ids,
            categories=categories,
            epsilon_km=payload.epsilon_km,
            min_samples=payload.min_cluster_size,
        )

        clusters = [
            ClusterPoint(
                category=c["category"],
                center_lat=c["center_lat"],
                center_lng=c["center_lng"],
                report_count=c["report_count"],
                report_ids=c["report_ids"][:50],  # truncate for response
                boundary=c["boundary"],
            )
            for c in clusters_raw
        ]

        return ClusterResponse(clusters=clusters, noise_count=noise_count)

    except Exception as e:
        print(f"Clustering failed: {e}")
        return ClusterResponse(clusters=[], noise_count=0)
