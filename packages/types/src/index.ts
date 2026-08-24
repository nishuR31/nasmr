// ─── Report ─────────────────────────────────────────────────
export type ReportCategory =
  | 'WATER' | 'ROAD' | 'ELECTRICITY' | 'SANITATION'
  | 'HEALTHCARE' | 'EDUCATION' | 'TRANSPORT' | 'OTHER';

export type ReportStatus =
  | 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface Report {
  id: string;
  userId?: string;
  text: string;
  category: ReportCategory;
  severity: number;       // 0–1
  urgency: number;        // 0–1
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AIAnalysis;
}

export interface CreateReportDto {
  text: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  audioBase64?: string;   // for voice input
}

// ─── AI Analysis ────────────────────────────────────────────
export interface AIAnalysis {
  id: string;
  reportId: string;
  category: ReportCategory;
  severity: number;
  urgency: number;
  summary: string;
  entities: string[];
  confidence: number;
  createdAt: string;
}

export interface AnalyzeReportRequest {
  text: string;
  latitude: number;
  longitude: number;
}

export interface AnalyzeReportResponse {
  category: ReportCategory;
  severity: number;
  urgency: number;
  summary: string;
  entities: string[];
  embedding: number[];
  confidence: number;
}

// ─── Hotspot ────────────────────────────────────────────────
export type HotspotSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Hotspot {
  id: string;
  name: string;
  category: ReportCategory;
  severity: HotspotSeverity;
  reportCount: number;
  affectedPop: number;
  centroid: { lat: number; lng: number };
  boundary?: GeoJSON.Polygon;
  priorityScore: number;
  firstSeen: string;
  lastUpdated: string;
}

// ─── Recommendation ─────────────────────────────────────────
export interface Recommendation {
  id: string;
  hotspotId: string;
  title: string;
  description: string;
  action: string;
  priorityScore: number;
  evidence: {
    reportCount: number;
    affectedCommunities: number;
    avgSeverity: number;
    persistenceDays: number;
    categories: ReportCategory[];
  };
  status: 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
}

// ─── Dashboard ──────────────────────────────────────────────
export interface DashboardStats {
  totalReports: number;
  highSeverityReports: number;
  activeHotspots: number;
  aiRecommendations: number;
  resolvedThisMonth: number;
  avgResponseDays: number;
  categoryBreakdown: Record<ReportCategory, number>;
  recentReports: Report[];
}

// ─── Map ────────────────────────────────────────────────────
export interface MapLayers {
  reports: GeoJSON.FeatureCollection;
  hotspots: GeoJSON.FeatureCollection;
  heatmapPoints: Array<{ lat: number; lng: number; weight: number }>;
}

// ─── Priority ───────────────────────────────────────────────
export interface PriorityScore {
  hotspotId: string;
  score: number;
  breakdown: {
    citizenDemand: number;
    severity: number;
    populationAffected: number;
    persistence: number;
    vulnerablePopulation: number;
    infrastructureGap: number;
  };
}

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CITIZEN' | 'OFFICIAL' | 'ADMIN';
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── GeoJSON namespace ──────────────────────────────────────
export namespace GeoJSON {
  export interface Point {
    type: 'Point';
    coordinates: [number, number];
  }
  export interface Polygon {
    type: 'Polygon';
    coordinates: [number, number][][];
  }
  export interface Feature<G = Point | Polygon, P = Record<string, unknown>> {
    type: 'Feature';
    geometry: G;
    properties: P;
  }
  export interface FeatureCollection<G = Point | Polygon, P = Record<string, unknown>> {
    type: 'FeatureCollection';
    features: Feature<G, P>[];
  }
}
