from fastapi import APIRouter, Request
from models.schemas import AnalyzeReportRequest, AnalyzeReportResponse
from services.llm import analyze_with_llm

router = APIRouter()


@router.post("/analyze-report", response_model=AnalyzeReportResponse)
async def analyze_report(request: Request, payload: AnalyzeReportRequest):
    """
    Main AI analysis endpoint.
    1. Call LLM to classify, score severity/urgency, extract entities
    2. Generate sentence embedding
    3. Return structured response
    """
    embeddings_service = request.app.state.embeddings

    # Step 1: LLM analysis
    llm_result = await analyze_with_llm(
        payload.text, payload.latitude, payload.longitude
    )

    # Step 2: Generate embedding
    embedding = embeddings_service.encode(payload.text)

    return AnalyzeReportResponse(
        category=llm_result.get("category", "OTHER"),
        severity=float(llm_result.get("severity", 0.5)),
        urgency=float(llm_result.get("urgency", 0.5)),
        summary=llm_result.get("summary", payload.text[:100]),
        entities=llm_result.get("entities", []),
        embedding=embedding,
        confidence=float(llm_result.get("confidence", 0.5)),
    )
