import os
import json
from typing import Any

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock")  # groq | openai | mock

ANALYZE_SYSTEM_PROMPT = """You are an AI assistant for a civic intelligence platform in India.
Analyze the given citizen complaint and return a JSON object with:
- category: one of WATER, ROAD, ELECTRICITY, SANITATION, HEALTHCARE, EDUCATION, TRANSPORT, OTHER
- severity: float 0.0-1.0 (how severe is the problem)
- urgency: float 0.0-1.0 (how urgently does it need attention)
- summary: 1 sentence English summary
- entities: list of key entities/keywords mentioned
- confidence: float 0.0-1.0 (your confidence in the classification)

Respond ONLY with valid JSON, no markdown, no explanation."""

ANALYZE_EXAMPLE = """{
  "category": "WATER",
  "severity": 0.87,
  "urgency": 0.81,
  "summary": "Residents report prolonged water supply shortage affecting multiple families.",
  "entities": ["drinking water", "water supply", "shortage"],
  "confidence": 0.94
}"""


async def analyze_with_llm(text: str, latitude: float, longitude: float) -> dict[str, Any]:
    """Call LLM to analyze report text. Falls back to mock on error."""
    if LLM_PROVIDER == "groq" and GROQ_API_KEY:
        return await _groq_analyze(text)
    elif LLM_PROVIDER == "openai" and OPENAI_API_KEY:
        return await _openai_analyze(text)
    else:
        return _mock_analyze(text)


async def _groq_analyze(text: str) -> dict[str, Any]:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this complaint:\n\n{text}"},
        ],
        temperature=0.1,
        max_tokens=400,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


async def _openai_analyze(text: str) -> dict[str, Any]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this complaint:\n\n{text}"},
        ],
        temperature=0.1,
        max_tokens=400,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _mock_analyze(text: str) -> dict[str, Any]:
    """Rule-based fallback when no LLM key is available."""
    text_lower = text.lower()
    category_keywords = {
        "WATER": ["water", "pani", "drinking", "pipeline", "tanker", "supply"],
        "ROAD": ["road", "pothole", "sadak", "street", "highway", "pavement"],
        "ELECTRICITY": ["electricity", "power", "light", "current", "bijli", "transformer"],
        "SANITATION": ["garbage", "drain", "sewage", "kachra", "toilet", "waste", "manhole"],
        "HEALTHCARE": ["hospital", "doctor", "health", "medicine", "clinic", "medical"],
        "EDUCATION": ["school", "college", "teacher", "education", "study"],
        "TRANSPORT": ["bus", "road", "transport", "vehicle", "traffic"],
    }

    best_cat = "OTHER"
    best_score = 0
    for cat, keywords in category_keywords.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > best_score:
            best_score = score
            best_cat = cat

    severity = min(0.9, 0.5 + best_score * 0.1)
    return {
        "category": best_cat,
        "severity": round(severity, 2),
        "urgency": round(severity * 0.9, 2),
        "summary": text[:100] + ("..." if len(text) > 100 else ""),
        "entities": [],
        "confidence": 0.65 if best_cat != "OTHER" else 0.3,
    }
