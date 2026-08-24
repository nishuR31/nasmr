import { useState } from 'react';
import type { Recommendation } from '@nasmr/types';
import { ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
}

const STATUS_CONFIG = {
  OPEN:        { icon: AlertTriangle, color: 'text-amber-400', label: 'Open' },
  ACCEPTED:    { icon: CheckCircle,   color: 'text-blue-400',  label: 'Accepted' },
  IN_PROGRESS: { icon: Clock,         color: 'text-brand-400', label: 'In Progress' },
  DONE:        { icon: CheckCircle,   color: 'text-green-400', label: 'Done' },
};

export function RecommendationCard({ recommendation: rec, rank }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[rec.status];
  const StatusIcon = cfg.icon;

  const scoreColor =
    rec.priorityScore >= 85 ? 'text-red-400' :
    rec.priorityScore >= 70 ? 'text-orange-400' :
    rec.priorityScore >= 55 ? 'text-amber-400' :
                              'text-brand-400';

  return (
    <div className="glass glass-hover rounded-xl overflow-hidden animate-slide-in border border-dark-border">
      {/* Header */}
      <div
        className="p-5 cursor-pointer flex items-start justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-sm">#{rank}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{rec.title}</h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={clsx('flex items-center gap-1 text-xs font-medium', cfg.color)}>
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
              <span className={clsx('text-sm font-bold', scoreColor)}>
                {Math.round(rec.priorityScore)}/100
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-dark-border/50 pt-4 space-y-4">
          <p className="text-sm text-gray-400 leading-relaxed">{rec.description}</p>

          {/* Evidence grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Reports', value: rec.evidence.reportCount.toLocaleString() },
              { label: 'Communities', value: rec.evidence.affectedCommunities },
              { label: 'Avg Severity', value: `${Math.round(rec.evidence.avgSeverity * 100)}%` },
              { label: 'Persistence', value: `${rec.evidence.persistenceDays}d` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/3 rounded-lg p-3 border border-dark-border">
                <p className="text-xs text-gray-600">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Recommended action */}
          <div className="bg-brand-500/5 border border-brand-500/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1.5">
              Recommended Action
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{rec.action}</p>
          </div>
        </div>
      )}
    </div>
  );
}
