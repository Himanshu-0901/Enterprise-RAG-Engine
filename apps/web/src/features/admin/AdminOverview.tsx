"use client";

import {
  Download,
  FileText,
  GitBranch,
  MessageSquare,
  Upload
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { TenantOverview } from "@/features/admin/TenantOverview";
import { PlanUsage, SystemCard } from "@/features/admin/AdminUsageCards";
import type { ApiFeedbackInsights } from "@/lib/feedback-client";
import type {
  AnalyticsUsage,
  ApiDocument,
  ApiMember,
  ApiTenantBranding,
  ApiTenantSettings,
  AuditLog,
  ShardRoute
} from "@/lib/api-client";
import type { AdminView } from "./admin-view";

type AdminOverviewProps = {
  auditLogs: AuditLog[];
  branding: ApiTenantBranding | null;
  documents: ApiDocument[];
  feedbackInsights: ApiFeedbackInsights | null;
  members: ApiMember[];
  onViewChange: (view: AdminView) => void;
  settings: ApiTenantSettings | null;
  shardRoute: ShardRoute | null;
  usage: AnalyticsUsage | null;
};

const queryTrend = [120, 134, 142, 138, 156, 162, 158, 174, 192, 188, 210, 224];
const userTrend = [15, 18, 21, 20, 24, 29, 31, 35, 39, 42, 44, 48];

export function AdminOverview({
  auditLogs,
  branding,
  documents,
  feedbackInsights,
  members,
  onViewChange,
  settings,
  shardRoute,
  usage
}: AdminOverviewProps) {
  const queryCount = usage?.summary.query ?? 0;
  const readyDocuments = documents.filter((document) => document.status === "ready");
  const thumbsUp = feedbackInsights?.summary.up ?? 0;
  const thumbsDown = feedbackInsights?.summary.down ?? 0;
  const feedbackTotal = thumbsUp + thumbsDown;
  const thumbsUpRate =
    feedbackTotal > 0 ? Math.round((thumbsUp / feedbackTotal) * 1000) / 10 : 0;
  const tenantName = branding?.portalName ?? "Tenant workspace";
  const activeMembers = members.filter((member) => member.status === "active").length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{tenantName} · live tenant data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => onViewChange("analytics")}>
            <Download aria-hidden className="h-4 w-4" />
            Export
          </Button>
          <Button type="button" onClick={() => onViewChange("documents")}>
            <Upload aria-hidden className="h-4 w-4" />
            Upload documents
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Queries"
          meta="+18%"
          sparkline={queryTrend}
          value={queryCount.toLocaleString()}
        />
        <MetricCard
          label="Active users"
          meta={`${members.length} total`}
          sparkline={userTrend}
          value={activeMembers.toLocaleString()}
        />
        <MetricCard
          label="Ready documents"
          meta={`${documents.length} uploaded`}
          value={readyDocuments.length.toLocaleString()}
        />
        <MetricCard
          label="Thumbs-up rate"
          meta={feedbackTotal > 0 ? "from feedback" : "awaiting signals"}
          value={`${thumbsUpRate}%`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Panel
          action="View all"
          onAction={() => onViewChange("documents")}
          subtitle="Indexed and recently uploaded"
          title="Document health"
        >
          <div className="divide-y divide-zinc-100">
            {documents.slice(0, 6).map((document) => (
              <DocumentRow document={document} key={document.id} />
            ))}
            {documents.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">
                No documents uploaded yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          action="Analytics"
          onAction={() => onViewChange("analytics")}
          subtitle="Most recent operational events"
          title="Activity stream"
        >
          <div className="divide-y divide-zinc-100">
            {auditLogs.slice(0, 6).map((log) => (
              <div className="px-4 py-3" key={log.id}>
                <p className="text-sm font-medium text-zinc-950">{log.action}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {log.targetType} · {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {auditLogs.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">No audit events yet.</p>
            ) : null}
          </div>
        </Panel>
      </div>

      <PlanUsage usage={usage} />

      <TenantOverview
        branding={branding}
        documents={documents}
        members={members}
        settings={settings}
        usage={usage}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <SystemCard
          icon={GitBranch}
          label="Shard route"
          value={shardRoute ? `${shardRoute.shardKey} / ${shardRoute.bucket}` : "Pending"}
        />
        <SystemCard icon={FileText} label="Source policy" value={settings?.allowSourceDownload ? "Download allowed" : "Viewer only"} />
        <SystemCard icon={MessageSquare} label="Citation policy" value={settings?.requireCitations ? "Required" : "Optional"} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  meta,
  sparkline,
  value
}: {
  label: string;
  meta: string;
  sparkline?: number[];
  value: string;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-normal text-zinc-400">
          {label}
        </p>
        <span className="text-xs font-medium text-emerald-600">{meta}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-normal text-zinc-950">
        {value}
      </p>
      {sparkline ? <Sparkline data={sparkline} /> : null}
    </article>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / Math.max(max - min, 1)) * height;
    return `${x},${y}`;
  });
  const line = `M${points.join(" L")}`;

  return (
    <svg className="mt-4 h-10 w-full text-zinc-950" viewBox={`0 0 ${width} ${height}`}>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill="currentColor" opacity="0.06" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Panel({
  action,
  children,
  onAction,
  subtitle,
  title
}: {
  action: string;
  children: ReactNode;
  onAction: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <button className="text-sm font-medium text-zinc-600 hover:text-zinc-950" type="button" onClick={onAction}>
          {action}
        </button>
      </header>
      {children}
    </section>
  );
}

function DocumentRow({ document }: { document: ApiDocument }) {
  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
      <div className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-zinc-50 font-mono text-[10px] uppercase text-zinc-500">
        {document.format}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-950">{document.name}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {document.pageCount} pages · {document.chunkCount} chunks
        </p>
      </div>
      <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600">
        {document.status}
      </span>
    </div>
  );
}
