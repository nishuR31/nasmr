import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color?: 'brand' | 'red' | 'amber' | 'green' | 'blue';
  trend?: { value: number; label: string };
  delay?: number;
}

const COLOR_MAP = {
  brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  red:   'text-red-400   bg-red-500/10   border-red-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  green: 'text-green-400 bg-green-500/10 border-green-500/20',
  blue:  'text-blue-400  bg-blue-500/10  border-blue-500/20',
};

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current = setTimeout(() => {
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const interval = setInterval(() => {
        current = Math.min(current + increment, target);
        setCount(Math.floor(current));
        if (current >= target) clearInterval(interval);
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => { if (ref.current) clearTimeout(ref.current); };
  }, [target, duration, delay]);

  return count;
}

export function StatCard({ label, value, suffix = '', icon, color = 'brand', trend, delay = 0 }: StatCardProps) {
  const displayValue = useCountUp(value, 1200, delay);

  return (
    <div className={clsx('glass glass-hover rounded-xl p-5 border animate-count', COLOR_MAP[color].split(' ').slice(2).join(' '))}
         style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-2 rounded-lg border', COLOR_MAP[color])}>
          {icon}
        </div>
        {trend && (
          <span className={clsx('text-xs font-medium', trend.value > 0 ? 'text-green-400' : 'text-red-400')}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-white">
          {displayValue.toLocaleString()}{suffix}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {trend && <p className="text-xs text-gray-600 mt-1">{trend.label}</p>}
      </div>
    </div>
  );
}
