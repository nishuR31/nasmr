import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Mic, FileText, TrendingUp, Shield, Zap, ArrowRight, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { DashboardStats, Report } from '@nasmr/types';

const CATEGORY_COLORS: Record<string, string> = {
  WATER: 'text-civic-water', ROAD: 'text-civic-road',
  ELECTRICITY: 'text-civic-electricity', SANITATION: 'text-civic-sanitation',
  HEALTHCARE: 'text-civic-healthcare', EDUCATION: 'text-civic-education',
  TRANSPORT: 'text-civic-transport', OTHER: 'text-gray-400',
};

const CATEGORY_DOT: Record<string, string> = {
  WATER: 'bg-civic-water', ROAD: 'bg-civic-road',
  ELECTRICITY: 'bg-civic-electricity', SANITATION: 'bg-civic-sanitation',
  HEALTHCARE: 'bg-civic-healthcare', EDUCATION: 'bg-civic-education',
  TRANSPORT: 'bg-civic-transport', OTHER: 'bg-gray-400',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function CitizenPortal() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard'),
    refetchInterval: 30_000,
  });

  const recentReports = stats?.recentReports ?? [];

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-6 text-sm">
            <span className="live-dot" />
            <span className="text-brand-300 font-medium">AI-Powered Civic Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4">
            Your Voice,<br />
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-purple-300 bg-clip-text text-transparent">
              Amplified by AI
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Report civic issues in Hindi or English. Our AI transforms thousands of citizen complaints
            into prioritized, actionable recommendations for government officials.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/report" className="btn-brand flex items-center justify-center gap-2 text-base">
              <FileText className="w-4 h-4" />
              Report an Issue
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/dashboard" className="glass border border-dark-border px-6 py-2.5 rounded-xl text-gray-300 font-medium hover:border-brand-500/30 hover:text-white transition-all flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" />
              Government Dashboard
            </Link>
          </div>

          {/* Mini stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { label: 'Reports', value: stats.totalReports.toLocaleString(), icon: FileText },
                { label: 'High Severity', value: stats.highSeverityReports.toLocaleString(), icon: Shield },
                { label: 'Hotspots', value: stats.activeHotspots.toString(), icon: MapPin },
                { label: 'AI Recs', value: stats.aiRecommendations.toString(), icon: Zap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass rounded-xl p-4 border border-dark-border text-center">
                  <Icon className="w-4 h-4 text-brand-400 mx-auto mb-1.5" />
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl font-bold text-white mb-2">How It Works</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          From complaint to government action — powered by AI
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Submit Report',
              desc: 'Type or speak your complaint in Hindi or English. Attach your location.',
              icon: Mic,
              color: 'text-blue-400',
            },
            {
              step: '02',
              title: 'AI Analysis',
              desc: 'Our AI classifies, scores severity, finds similar complaints and detects geographic hotspots.',
              icon: TrendingUp,
              color: 'text-brand-400',
            },
            {
              step: '03',
              title: 'Government Action',
              desc: 'Officials see prioritized recommendations with evidence to allocate resources effectively.',
              icon: Shield,
              color: 'text-green-400',
            },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="glass glass-hover rounded-xl p-6 border border-dark-border">
              <div className="flex items-start gap-4">
                <span className="text-3xl font-black text-dark-muted">{step}</span>
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-white/5 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live feed ────────────────────────────────────────── */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <h2 className="text-lg font-bold text-white">Live Reports</h2>
          </div>
          <Link to="/map" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View on map <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentReports.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border border-dark-border">
              <p className="text-gray-500">No reports yet. Be the first to report an issue.</p>
              <Link to="/report" className="btn-brand mt-4 inline-flex items-center gap-2 text-sm">
                Submit Report
              </Link>
            </div>
          ) : (
            recentReports.map((report: Report, i) => (
              <div
                key={report.id}
                className="glass glass-hover rounded-lg px-4 py-3 flex items-start gap-3 border border-dark-border animate-slide-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${CATEGORY_DOT[report.category] ?? 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 leading-snug line-clamp-2">{report.text}</p>
                  {report.address && (
                    <span className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {report.address}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium ${CATEGORY_COLORS[report.category]}`}>
                    {report.category}
                  </span>
                  <p className="text-xs text-gray-600 mt-0.5">{timeAgo(report.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
