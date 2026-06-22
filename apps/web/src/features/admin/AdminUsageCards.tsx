import type { Users } from "lucide-react";
import type { AnalyticsUsage } from "@/lib/api-client";

export function PlanUsage({ usage }: { usage: AnalyticsUsage | null }) {
  const metrics = [
    {
      label: "Documents",
      max: usage?.quota.documentLimit ?? 0,
      value: usage?.quota.activeDocumentCount ?? 0
    },
    {
      label: "Queries / mo",
      max: usage?.quota.monthlyQueryLimit ?? 0,
      value: usage?.quota.queryCountThisMonth ?? 0
    },
    {
      label: "Events",
      max: Math.max(usage?.events.length ?? 0, 1),
      value: usage?.events.length ?? 0
    }
  ];

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-950">Plan usage</h2>
        <p className="text-xs text-zinc-500">Current tenant quotas and activity</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {metrics.map((metric) => (
          <UsageMeter key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}

export function SystemCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <Icon aria-hidden className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-zinc-950">{value}</p>
    </article>
  );
}

function UsageMeter({
  metric
}: {
  metric: { label: string; max: number; value: number };
}) {
  const percent =
    metric.max > 0 ? Math.min(100, Math.round((metric.value / metric.max) * 100)) : 0;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-normal text-zinc-400">
        {metric.label}
      </p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-sm font-semibold">
          {metric.value.toLocaleString()}
        </span>
        <span className="font-mono text-xs text-zinc-400">
          / {metric.max.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-zinc-950" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
