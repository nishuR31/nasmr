from enum import Enum
from pydantic import BaseModel, Field


class ReportCategory(str, Enum):
    WATER = "WATER"
    ROAD = "ROAD"
    ELECTRICITY = "ELECTRICITY"
    SANITATION = "SANITATION"
    HEALTHCARE = "HEALTHCARE"
    EDUCATION = "EDUCATION"
    TRANSPORT = "TRANSPORT"
    OTHER = "OTHER"


# ── Analyze ──────────────────────────────────────────────────
class AnalyzeReportRequest(BaseModel):
    text: str = Field(..., min_length=3)
    latitude: float
    longitude: float


class AnalyzeReportResponse(BaseModel):
    category: ReportCategory
    severity: float = Field(ge=0.0, le=1.0)
    urgency: float = Field(ge=0.0, le=1.0)
    summary: str
    entities: list[str]
    embedding: list[float]
    confidence: float = Field(ge=0.0, le=1.0)


# ── Similar ──────────────────────────────────────────────────
class SimilarRequest(BaseModel):
    embedding: list[float]
    limit: int = Field(default=10, ge=1, le=50)


class SimilarResult(BaseModel):
    report_id: str
    similarity: float


class SimilarResponse(BaseModel):
    results: list[SimilarResult]


# ── Cluster ──────────────────────────────────────────────────
class ClusterRequest(BaseModel):
    min_cluster_size: int = 5
    epsilon_km: float = 1.5


class ClusterPoint(BaseModel):
    category: ReportCategory
    center_lat: float
    center_lng: float
    report_count: int
    report_ids: list[str]
    boundary: dict | None = None


class ClusterResponse(BaseModel):
    clusters: list[ClusterPoint]
    noise_count: int


# ── Priority ─────────────────────────────────────────────────
class PriorityInput(BaseModel):
    hotspot_id: str
    report_count: int
    avg_severity: float
    affected_population: int
    persistence_days: int
    vulnerable_fraction: float = 0.0
    infrastructure_gap: float = 0.5


class PriorityResponse(BaseModel):
    hotspot_id: str
    score: float
    breakdown: dict[str, float]
    label: str


# ── Voice ────────────────────────────────────────────────────
class VoiceRequest(BaseModel):
    audio_base64: str
    language: str = "hi"


class VoiceResponse(BaseModel):
    text: str
    language: str
    confidence: float
