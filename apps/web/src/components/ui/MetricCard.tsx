import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { UsageMetric } from "@rag-llm/shared";

type MetricCardProps = {
  metric: UsageMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
        <TrendIcon aria-hidden className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-normal text-zinc-950">
        {metric.value}
      </p>
      <p className="mt-1 text-sm text-zinc-500">{metric.helper}</p>
    </article>
  );
}
