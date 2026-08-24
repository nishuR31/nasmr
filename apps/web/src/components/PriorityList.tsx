import type { Hotspot } from '@nasmr/types';
import clsx from 'clsx';

interface PriorityListProps {
  hotspots: Hotspot[];
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  WATER:       'bg-civic-water/20 text-civic-water border-civic-water/30',
  ROAD:        'bg-civic-road/20 text-civic-road border-civic-road/30',
  ELECTRICITY: 'bg-civic-electricity/20 text-civic-electricity border-civic-electricity/30',
  SANITATION:  'bg-civic-sanitation/20 text-civic-sanitation border-civic-sanitation/30',
  HEALTHCARE:  'bg-civic-healthcare/20 text-civic-healthcare border-civic-healthcare/30',
  EDUCATION:   'bg-civic-education/20 text-civic-education border-civic-education/30',
  TRANSPORT:   'bg-civic-transport/20 text-civic-transport border-civic-transport/30',
  OTHER:       'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-400',
  MEDIUM:   'bg-amber-400',
  LOW:      'bg-green-400',
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? 'from-red-500 to-orange-400' :
    score >= 70 ? 'from-orange-400 to-amber-400' :
    score >= 55 ? 'from-amber-400 to-yellow-300' :
                  'from-brand-500 to-brand-400';

  return (
    <div className="score-bar mt-2">
      <div
        className={clsx('score-bar-fill bg-gradient-to-r', color)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function PriorityList({ hotspots, isLoading }: PriorityListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
            <div className="h-3 bg-white/5 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {hotspots.map((h, idx) => (
        <div
          key={h.id}
          className="glass glass-hover rounded-lg p-4 cursor-pointer animate-slide-in"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg font-bold text-dark-muted w-6 flex-shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx('cat-badge border', CATEGORY_COLORS[h.category])}>
                    {h.category}
                  </span>
                  <span className={clsx('severity-dot', SEVERITY_DOT[h.severity])} />
                </div>
                <p className="text-sm font-medium text-white truncate">{h.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {h.reportCount.toLocaleString()} reports · {h.affectedPop.toLocaleString()} affected
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-white">{Math.round(h.priorityScore)}</p>
              <p className="text-xs text-gray-600">/100</p>
            </div>
          </div>
          <ScoreBar score={h.priorityScore} />
        </div>
      ))}
    </div>
  );
}
