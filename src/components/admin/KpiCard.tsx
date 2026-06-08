import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Structure: Icon → Value → Label → Trend (a relative-magnitude bar derived
// from the real values in the group — no fabricated deltas).

export interface KpiDef {
  label:        string;
  value:        number | null | undefined;
  icon:         React.ElementType;
  accent:       string;
  isCurrency?:  boolean;
  isPercent?:   boolean;
  placeholder?: boolean;
}

export function KpiCard({
  kpi, index, loading, maxValue, placeholderHint,
}: {
  kpi:             KpiDef;
  index:           number;
  loading:         boolean;
  maxValue:        number;
  placeholderHint: string;
}) {
  const Icon = kpi.icon;
  const trendPct = !kpi.placeholder && maxValue > 0
    ? Math.max(4, Math.round(((kpi.value ?? 0) / maxValue) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 flex flex-col gap-4"
    >
      <span className={cn('inline-flex items-center justify-center size-9 rounded-xl bg-white/5 shrink-0', kpi.accent)}>
        <Icon className="size-4.5" />
      </span>

      <div className="min-w-0">
        <div className="text-2xl font-serif-display tabular-nums text-admin-text leading-tight">
          {loading ? (
            <span className="inline-block w-12 h-6 bg-white/6 rounded animate-pulse" />
          ) : kpi.placeholder ? (
            '—'
          ) : kpi.isCurrency ? (
            `$${(kpi.value ?? 0).toLocaleString()}`
          ) : kpi.isPercent ? (
            `${kpi.value ?? 0}%`
          ) : (
            kpi.value ?? 0
          )}
        </div>
        <p className="text-[11px] text-admin-text-muted font-arabic leading-snug mt-1.5 truncate">{kpi.label}</p>

        {kpi.placeholder && !loading ? (
          <p className="text-[9px] text-admin-text-muted/60 font-arabic mt-2">{placeholderHint}</p>
        ) : (
          <div className="h-1 mt-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: loading ? 0 : `${trendPct}%` }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={cn('h-full rounded-full', kpi.accent.replace('text-', 'bg-'))}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function KpiGrid({
  title, titleIcon: TitleIcon, kpis, loading, placeholderHint, columns,
}: {
  title:            string;
  titleIcon?:       React.ElementType;
  kpis:             KpiDef[];
  loading:          boolean;
  placeholderHint:  string;
  columns:          string;
}) {
  const maxValue = Math.max(...kpis.filter((k) => !k.placeholder).map((k) => k.value ?? 0), 1);

  return (
    <div className="mb-6">
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-3 font-arabic flex items-center gap-2">
        {TitleIcon && <TitleIcon className="size-3 text-admin-text-muted/50" />}
        {title}
      </p>
      <div className={cn('grid gap-3', columns)}>
        {kpis.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} loading={loading} maxValue={maxValue} placeholderHint={placeholderHint} />
        ))}
      </div>
    </div>
  );
}
