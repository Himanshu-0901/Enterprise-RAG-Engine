import {
  Activity,
  ClipboardList,
  MessageSquare,
  SearchCheck,
  ThumbsDown,
  ThumbsUp,
  Upload,
  UserPlus
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type { AnalyticsUsage, AuditLog } from "@/lib/api-client";
import type { ApiFeedbackInsights } from "@/lib/feedback-client";

type AnalyticsPanelProps = {
  auditLogs: AuditLog[];
  feedbackInsights: ApiFeedbackInsights | null;
  usage: AnalyticsUsage | null;
};

const metricIcon = {
  citation_clicked: Activity,
  document_indexed: Upload,
  end_user_invited: UserPlus,
  message_feedback: MessageSquare,
  query: MessageSquare
};

export function AnalyticsPanel({
  auditLogs,
  feedbackInsights,
  usage
}: AnalyticsPanelProps) {
  const summary = usage?.summary ?? {};
  const entries = Object.entries(summary);
  const recentNegative = feedbackInsights?.recentNegative ?? [];
  const retrievalDiagnostics = latestRetrievalDiagnostics(usage);

  return (
    <SectionPanel
      title="Usage and audit"
      description="Operational events recorded from ingestion, chat, and user management."
      action={<Badge tone="info">{usage?.events.length ?? 0} events</Badge>}
    >
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <QuotaCard
          label="Documents"
          limit={usage?.quota.documentLimit ?? 0}
          used={usage?.quota.activeDocumentCount ?? 0}
        />
        <QuotaCard
          label="Queries this month"
          limit={usage?.quota.monthlyQueryLimit ?? 0}
          used={usage?.quota.queryCountThisMonth ?? 0}
        />
      </div>

      <RetrievalDiagnosticsCard diagnostics={retrievalDiagnostics} />

      <div className="grid gap-4 lg:grid-cols-3">
        {entries.length > 0 ? (
          entries.map(([label, value]) => {
            const Icon = metricIcon[label as keyof typeof metricIcon] ?? Activity;
            return (
              <article
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                key={label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium capitalize text-zinc-500">
                    {label.replaceAll("_", " ")}
                  </p>
                  <Icon aria-hidden className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-zinc-950">
                  {value}
                </p>
              </article>
            );
          })
        ) : (
          <p className="text-sm text-zinc-500">No usage events yet.</p>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-500">Answer feedback</p>
            <MessageSquare aria-hidden className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <FeedbackMetric
              icon={ThumbsUp}
              label="Positive"
              value={feedbackInsights?.summary.up ?? 0}
            />
            <FeedbackMetric
              icon={ThumbsDown}
              label="Negative"
              value={feedbackInsights?.summary.down ?? 0}
            />
          </div>
        </article>

        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
            <ThumbsDown aria-hidden className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-950">
              Recent negative feedback
            </h3>
          </div>
          <div className="divide-y divide-zinc-200">
            {recentNegative.length > 0 ? (
              recentNegative.map((item) => (
                <div className="grid gap-2 px-4 py-3 text-sm" key={item.messageId}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">{item.userEmail}</Badge>
                    <p className="text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-950">
                    {item.conversationTitle}
                  </p>
                  <p className="line-clamp-2 text-zinc-600">
                    {item.comment ?? item.messageContent}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-zinc-500">
                No negative feedback yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
          <ClipboardList aria-hidden className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-950">Audit trail</h3>
        </div>
        <div className="divide-y divide-zinc-200">
          {auditLogs.length > 0 ? (
            auditLogs.slice(0, 8).map((log) => (
              <div className="grid gap-1 px-4 py-3 text-sm" key={log.id}>
                <p className="font-medium text-zinc-950">{log.action}</p>
                <p className="text-zinc-500">
                  {log.targetType} {log.targetId} ·{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-zinc-500">
              No audit records yet.
            </p>
          )}
        </div>
      </div>
    </SectionPanel>
  );
}

type RetrievalDiagnostics = {
  confidence: string;
  fusedMatches: number;
  keywordMatches: number;
  rerankedMatches: number;
  topScore: number;
  vectorMatches: number;
};

function latestRetrievalDiagnostics(
  usage: AnalyticsUsage | null
): RetrievalDiagnostics | null {
  const event = usage?.events.find((item) => item.type === "query");
  const metadata = event?.metadata;

  if (!metadata) {
    return null;
  }

  return {
    confidence: String(metadata.confidence ?? "unknown"),
    fusedMatches: Number(metadata.fusedMatches ?? 0),
    keywordMatches: Number(metadata.keywordMatches ?? 0),
    rerankedMatches: Number(metadata.rerankedMatches ?? 0),
    topScore: Number(metadata.topScore ?? 0),
    vectorMatches: Number(metadata.vectorMatches ?? 0)
  };
}

function RetrievalDiagnosticsCard({
  diagnostics
}: {
  diagnostics: RetrievalDiagnostics | null;
}) {
  return (
    <article className="mb-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SearchCheck aria-hidden className="h-4 w-4 text-zinc-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Retrieval diagnostics
            </h3>
            <p className="text-xs text-zinc-500">
              Latest query: hybrid vector + keyword search with reranking.
            </p>
          </div>
        </div>
        <Badge tone={diagnostics?.confidence === "low" ? "warning" : "success"}>
          {diagnostics?.confidence ?? "No queries"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <RetrievalMetric label="Vector" value={diagnostics?.vectorMatches ?? 0} />
        <RetrievalMetric label="Keyword" value={diagnostics?.keywordMatches ?? 0} />
        <RetrievalMetric label="Fused" value={diagnostics?.fusedMatches ?? 0} />
        <RetrievalMetric label="Reranked" value={diagnostics?.rerankedMatches ?? 0} />
        <RetrievalMetric
          label="Top score"
          value={(diagnostics?.topScore ?? 0).toFixed(4)}
        />
      </div>
    </article>
  );
}

function RetrievalMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function FeedbackMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ThumbsUp;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <Icon aria-hidden className="h-3.5 w-3.5 text-zinc-400" />
      </div>
      <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function QuotaCard({
  label,
  limit,
  used
}: {
  label: string;
  limit: number;
  used: number;
}) {
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <Badge tone={percentage >= 90 ? "warning" : "info"}>{percentage}%</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold text-zinc-950">
        {used}
        <span className="text-sm font-medium text-zinc-500"> / {limit}</span>
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-950"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </article>
  );
}
