from fastapi import APIRouter
from models.schemas import PriorityInput, PriorityResponse
from services.clustering import compute_priority_score

router = APIRouter()


SCORE_LABELS = [
    (90, "CRITICAL — Immediate Action Required"),
    (75, "HIGH — Urgent Intervention Needed"),
    (60, "MEDIUM — Scheduled Action Recommended"),
    (0, "LOW — Monitor and Plan"),
]


@router.post("/priority", response_model=PriorityResponse)
async def compute_priority(payload: PriorityInput):
    """
    Deterministic priority scoring for a hotspot.
    No LLM involved — pure algorithm based on:
      30% citizen demand, 20% severity, 15% population,
      15% persistence, 10% vulnerable pop, 10% infra gap
    """
    result = compute_priority_score(
        report_count=payload.report_count,
        avg_severity=payload.avg_severity,
        affected_population=payload.affected_population,
        persistence_days=payload.persistence_days,
        vulnerable_fraction=payload.vulnerable_fraction,
        infrastructure_gap=payload.infrastructure_gap,
    )

    score = result["score"]
    label = next(lbl for threshold, lbl in SCORE_LABELS if score >= threshold)

    return PriorityResponse(
        hotspot_id=payload.hotspot_id,
        score=score,
        breakdown={
            "citizen_demand": result["citizen_demand"],
            "severity": result["severity"],
            "population_affected": result["population_affected"],
            "persistence": result["persistence"],
            "vulnerable_population": result["vulnerable_population"],
            "infrastructure_gap": result["infrastructure_gap"],
        },
        label=label,
    )
