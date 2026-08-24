import type { AnalyzeReportRequest, AnalyzeReportResponse } from '@nasmr/types';

const AI_BASE = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';

async function aiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AI_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI service error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Analyze a report ────────────────────────────────────────
export async function analyzeReport(
  payload: AnalyzeReportRequest
): Promise<AnalyzeReportResponse> {
  return aiPost<AnalyzeReportResponse>('/ai/analyze-report', payload);
}

// ─── Find similar reports ────────────────────────────────────
export async function findSimilarReports(
  embedding: number[],
  limit = 10
): Promise<Array<{ reportId: string; similarity: number }>> {
  return aiPost('/ai/similar', { embedding, limit });
}

// ─── Trigger clustering ──────────────────────────────────────
export async function runClustering(): Promise<
  Array<{
    category: string;
    centerLat: number;
    centerLng: number;
    reportCount: number;
    reportIds: string[];
    boundary: unknown;
  }>
> {
  return aiPost('/ai/cluster', {});
}

// ─── Transcribe voice ────────────────────────────────────────
export async function transcribeAudio(
  audioBase64: string,
  language = 'hi'
): Promise<{ text: string; language: string }> {
  return aiPost('/ai/voice', { audio_base64: audioBase64, language });
}
