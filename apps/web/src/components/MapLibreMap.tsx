import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { MapLayers } from '@nasmr/types';

interface MapLibreMapProps {
  layers?: MapLayers;
  center?: [number, number];
  zoom?: number;
  onReportClick?: (id: string) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  WATER:       '#3b9eff',
  ROAD:        '#f59e0b',
  ELECTRICITY: '#8b5cf6',
  SANITATION:  '#ef4444',
  HEALTHCARE:  '#10b981',
  EDUCATION:   '#06b6d4',
  TRANSPORT:   '#f97316',
  OTHER:       '#6b7280',
};

// Ranchi center
const DEFAULT_CENTER: [number, number] = [85.3096, 23.3441];
const DEFAULT_ZOOM = 11;

export function MapLibreMap({
  layers,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onReportClick,
  className = '',
}: MapLibreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [webglError, setWebglError] = useState(false);

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        // Free OpenFreeMap style — no token needed
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center,
        zoom,
        attributionControl: false,
      });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // ── Reports layer ──────────────────────────────────────
      map.addSource('reports', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40,
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'reports',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'],
            '#6C63FF', 10, '#f59e0b', 30, '#ef4444'],
          'circle-radius': ['step', ['get', 'point_count'],
            18, 10, 24, 30, 32],
          'circle-opacity': 0.85,
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'reports',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual report dots
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'reports',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'category'],
            'WATER',       CATEGORY_COLORS.WATER,
            'ROAD',        CATEGORY_COLORS.ROAD,
            'ELECTRICITY', CATEGORY_COLORS.ELECTRICITY,
            'SANITATION',  CATEGORY_COLORS.SANITATION,
            'HEALTHCARE',  CATEGORY_COLORS.HEALTHCARE,
            'EDUCATION',   CATEGORY_COLORS.EDUCATION,
            'TRANSPORT',   CATEGORY_COLORS.TRANSPORT,
            CATEGORY_COLORS.OTHER,
          ],
          'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 0, 5, 1, 10],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
      });

      // ── Hotspots layer ─────────────────────────────────────
      map.addSource('hotspots', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'hotspot-points',
        type: 'circle',
        source: 'hotspots',
        paint: {
          'circle-color': 'rgba(239,68,68,0)',
          'circle-radius': ['interpolate', ['linear'], ['get', 'reportCount'], 0, 20, 500, 60],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ef4444',
          'circle-opacity': 0.15,
        },
      });

      map.addLayer({
        id: 'hotspot-labels',
        type: 'symbol',
        source: 'hotspots',
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans SemiBold'],
          'text-size': 11,
          'text-offset': [0, 1.5],
        },
        paint: { 'text-color': '#ef4444', 'text-halo-color': 'rgba(0,0,0,0.8)', 'text-halo-width': 2 },
      });

      // Click handler for individual reports
      map.on('click', 'unclustered-point', (e) => {
        if (!e.features?.length) return;
        const { id, text, category, severity } = e.features[0].properties as Record<string, unknown>;
        const coords = (e.features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;

        new maplibregl.Popup({ closeButton: false, maxWidth: '260px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;padding:4px">
              <span style="font-size:10px;font-weight:600;color:#6C63FF;text-transform:uppercase;letter-spacing:0.05em">${category}</span>
              <p style="font-size:12px;color:#e0e0f0;margin:6px 0;line-height:1.5">${String(text).slice(0, 120)}…</p>
              <div style="font-size:11px;color:#6b6b80">Severity: ${Math.round(Number(severity) * 100)}%</div>
            </div>
          `)
          .addTo(map);

        if (onReportClick && id) onReportClick(String(id));
      });

      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;
    } catch (error: any) {
      console.warn('MapLibre WebGL not supported or failed to initialize:', error?.message || error);
      setWebglError(true);
    }
  }, [center, zoom, onReportClick]);

  useEffect(() => {
    initMap();
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [initMap]);

  // Update layers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers || !map.isStyleLoaded()) return;

    const src = map.getSource('reports') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(layers.reports as never);

    const hSrc = map.getSource('hotspots') as maplibregl.GeoJSONSource | undefined;
    if (hSrc) hSrc.setData(layers.hotspots as never);
  }, [layers]);

  if (webglError) {
    return (
      <div className={`map-container flex flex-col items-center justify-center bg-gray-800 text-gray-400 p-8 text-center rounded-lg border border-gray-700 ${className}`}>
        <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-200 mb-2">Interactive Map Unavailable</h3>
        <p className="max-w-sm text-sm">
          Your browser or device does not support WebGL, which is required to render the interactive map. 
          Please enable hardware acceleration or try a different browser.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`map-container ${className}`} />
  );
}
