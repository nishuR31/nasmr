import { useQuery } from '@tanstack/react-query';
import { MapLibreMap } from '../components/MapLibreMap';
import { api } from '../lib/api';
import type { MapLayers, Hotspot } from '@nasmr/types';
import { Layers, MapPin } from 'lucide-react';

const CATEGORY_DOT: Record<string, string> = {
  WATER: 'bg-civic-water', ROAD: 'bg-civic-road',
  ELECTRICITY: 'bg-civic-electricity', SANITATION: 'bg-civic-sanitation',
  HEALTHCARE: 'bg-civic-healthcare', EDUCATION: 'bg-civic-education',
  TRANSPORT: 'bg-civic-transport', OTHER: 'bg-gray-400',
};

export function MapView() {
  const { data: mapLayers } = useQuery<MapLayers>({
    queryKey: ['map-layers'],
    queryFn: () => api.get('/api/map/layers'),
    staleTime: 60_000,
  });

  const { data: hotspots } = useQuery<Hotspot[]>({
    queryKey: ['hotspots'],
    queryFn: () => api.get('/api/hotspots'),
  });

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-72 glass border-r border-dark-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h1 className="font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Live Civic Map
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Ranchi, Jharkhand</p>
        </div>

        {/* Legend */}
        <div className="p-4 border-b border-dark-border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(CATEGORY_DOT).map(([cat, dot]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-xs text-gray-400">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot list */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Hotspots ({(hotspots ?? []).length})
          </p>
          <div className="space-y-1.5">
            {(hotspots ?? []).map((h) => (
              <div key={h.id} className="glass rounded-lg p-3 border border-dark-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[h.category]}`} />
                  <span className="text-xs font-medium text-white truncate">{h.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{h.reportCount} reports</span>
                  <span className="text-xs font-bold text-brand-400">{Math.round(h.priorityScore)}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats footer */}
        <div className="p-4 border-t border-dark-border grid grid-cols-2 gap-2">
          {[
            { label: 'Reports', value: mapLayers?.reports.features.length ?? 0, icon: MapPin },
            { label: 'Hotspots', value: (hotspots ?? []).length, icon: Layers },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="w-3.5 h-3.5 text-brand-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{value}</p>
              <p className="text-xs text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full-screen map */}
      <div className="flex-1">
        <MapLibreMap layers={mapLayers} zoom={11} className="rounded-none" />
      </div>
    </div>
  );
}
