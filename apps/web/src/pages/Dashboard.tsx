import { useQuery } from '@tanstack/react-query';
import {
  FileText, AlertTriangle, MapPin, Zap, CheckCircle, Clock,
  BarChart2, RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatCard } from '../components/StatCard';
import { PriorityList } from '../components/PriorityList';
import { RecommendationCard } from '../components/RecommendationCard';
import { MapLibreMap } from '../components/MapLibreMap';
import { api } from '../lib/api';
import type { DashboardStats, Hotspot, Recommendation, MapLayers } from '@nasmr/types';

const CATEGORY_CHART_COLORS: Record<string, string> = {
  WATER:       '#3b9eff',
  ROAD:        '#f59e0b',
  ELECTRICITY: '#8b5cf6',
  SANITATION:  '#ef4444',
  HEALTHCARE:  '#10b981',
  EDUCATION:   '#06b6d4',
  TRANSPORT:   '#f97316',
  OTHER:       '#6b7280',
};

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard'),
    refetchInterval: 30_000,
  });

  const { data: hotspotsData, isLoading: hotspotsLoading } = useQuery<Hotspot[]>({
    queryKey: ['hotspots'],
    queryFn: () => api.get('/api/hotspots'),
  });

  const { data: recommendations } = useQuery<Recommendation[]>({
    queryKey: ['recommendations'],
    queryFn: () => api.get('/api/recommendations?limit=6'),
  });

  const { data: mapLayers } = useQuery<MapLayers>({
    queryKey: ['map-layers'],
    queryFn: () => api.get('/api/map/layers'),
    staleTime: 60_000,
  });

  const hotspots = hotspotsData ?? [];
  const recs = recommendations ?? [];

  const categoryChartData = stats
    ? Object.entries(stats.categoryBreakdown).map(([name, count]) => ({ name, count }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Government Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time civic intelligence · Ranchi, Jharkhand
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="glass border border-dark-border px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:border-brand-500/30 flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 h-28 animate-pulse border border-dark-border" />
          ))
        ) : stats ? (
          <>
            <StatCard label="Total Reports" value={stats.totalReports} icon={<FileText className="w-4 h-4" />} color="brand" delay={0} trend={{ value: 12, label: 'vs last month' }} />
            <StatCard label="High Severity" value={stats.highSeverityReports} icon={<AlertTriangle className="w-4 h-4" />} color="red" delay={80} />
            <StatCard label="Active Hotspots" value={stats.activeHotspots} icon={<MapPin className="w-4 h-4" />} color="amber" delay={160} />
            <StatCard label="AI Recommendations" value={stats.aiRecommendations} icon={<Zap className="w-4 h-4" />} color="green" delay={240} />
          </>
        ) : null}
      </div>

      {/* ── Secondary stats ─────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-4 border border-dark-border flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-white">{stats.resolvedThisMonth}</p>
              <p className="text-xs text-gray-500">Resolved this month</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 border border-dark-border flex items-center gap-3">
            <Clock className="w-8 h-8 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-white">{stats.avgResponseDays}d</p>
              <p className="text-xs text-gray-500">Avg response time</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Map + Priority ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Live Map */}
        <div className="lg:col-span-2 glass rounded-xl border border-dark-border overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-border flex items-center gap-2">
            <span className="live-dot" />
            <h2 className="font-semibold text-white text-sm">Live Civic Map</h2>
            <span className="text-xs text-gray-600 ml-auto">Ranchi, Jharkhand</span>
          </div>
          <div className="h-80">
            <MapLibreMap layers={mapLayers} />
          </div>
        </div>

        {/* Priority List */}
        <div className="glass rounded-xl border border-dark-border flex flex-col">
          <div className="px-4 py-3 border-b border-dark-border">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Priority Hotspots
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <PriorityList hotspots={hotspots.slice(0, 6)} isLoading={hotspotsLoading} />
          </div>
        </div>
      </div>

      {/* ── Category Chart + Recommendations ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="glass rounded-xl border border-dark-border p-4">
          <h2 className="font-semibold text-white text-sm mb-4">Report Categories</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryChartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#18181f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                labelStyle={{ color: '#e0e0f0' }}
                itemStyle={{ color: '#9898b0' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryChartData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_CHART_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendations */}
        <div className="glass rounded-xl border border-dark-border flex flex-col">
          <div className="px-4 py-3 border-b border-dark-border">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              AI Recommendations
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {recs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recommendations yet</p>
            ) : (
              recs.map((rec, i) => (
                <RecommendationCard key={rec.id} recommendation={rec} rank={i + 1} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
