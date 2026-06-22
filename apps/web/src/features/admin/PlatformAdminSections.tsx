"use client";

import { Flag } from "lucide-react";
import type { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type { ApiSession, AuditLog } from "@/lib/api-client";
import type { TenantPlan } from "@/lib/billing-client";
import {
  platformClient,
  type AbuseReview,
  type PlatformTenantRow,
  type PlatformTenantStatus
} from "@/lib/platform-client";

type Mutate = (work: () => Promise<unknown>) => Promise<void>;

export function TenantTable({
  isBusy,
  mutate,
  session,
  tenants
}: {
  isBusy: boolean;
  mutate: Mutate;
  session: ApiSession;
  tenants: PlatformTenantRow[];
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-[860px] w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Tenant</th>
            <th className="px-4 py-3">Usage</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {tenants.map((row) => (
            <tr key={row.tenant.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-950">{row.tenant.name}</p>
                <p className="text-xs text-zinc-500">{row.tenant.slug}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                {row.documents} docs · {row.members} users · {row.queriesThisMonth} queries
              </td>
              <td className="px-4 py-3">
                <PlanSelect
                  disabled={isBusy}
                  value={row.tenant.plan}
                  onChange={(plan) =>
                    mutate(() => platformClient.setTenantPlan(session, row.tenant.id, plan))
                  }
                />
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  disabled={isBusy}
                  value={row.tenant.status}
                  onChange={(status) =>
                    mutate(() =>
                      platformClient.setTenantStatus(session, row.tenant.id, status)
                    )
                  }
                />
              </td>
              <td className="px-4 py-3">
                <Button
                  disabled={isBusy}
                  variant="secondary"
                  onClick={() =>
                    mutate(() =>
                      platformClient.setFeatureFlag(session, row.tenant.id, {
                        enabled: true,
                        key: "beta_retrieval",
                        rolloutPercentage: 100
                      })
                    )
                  }
                >
                  <Flag aria-hidden className="h-4 w-4" /> Enable beta
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AbuseQueue({
  isBusy,
  mutate,
  reviews,
  session
}: {
  isBusy: boolean;
  mutate: Mutate;
  reviews: AbuseReview[];
  session: ApiSession;
}) {
  return (
    <SectionPanel
      title="Abuse review queue"
      description="Flagged content and safety operations that need operator review."
      action={<Badge tone={reviews.length ? "warning" : "success"}>{reviews.length} open</Badge>}
    >
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {reviews.length ? (
          reviews.map((review) => (
            <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]" key={review.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={review.severity === "high" ? "danger" : "warning"}>
                    {review.severity}
                  </Badge>
                  <Badge>{review.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-700">{review.summary}</p>
              </div>
              <Button
                disabled={isBusy || review.status === "resolved"}
                variant="secondary"
                onClick={() =>
                  mutate(() =>
                    platformClient.setAbuseReviewStatus(session, review.id, "resolved")
                  )
                }
              >
                Resolve
              </Button>
            </div>
          ))
        ) : (
          <p className="p-5 text-sm text-zinc-500">No flagged items are waiting.</p>
        )}
      </div>
    </SectionPanel>
  );
}

export function PlatformAudit({ logs }: { logs: AuditLog[] }) {
  return (
    <SectionPanel title="Platform audit" description="Recent operator actions.">
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {logs.slice(0, 8).map((log) => (
          <div className="px-4 py-3 text-sm" key={log.id}>
            <p className="font-medium text-zinc-950">{log.action}</p>
            <p className="text-xs text-zinc-500">
              {log.targetType} {log.targetId} · {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        {!logs.length ? <p className="p-5 text-sm text-zinc-500">No audit events.</p> : null}
      </div>
    </SectionPanel>
  );
}

export function FleetMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-zinc-500">
        <p className="text-xs font-medium uppercase">{label}</p>
        <Icon aria-hidden className="h-4 w-4" />
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold text-zinc-950">
        {value.toLocaleString()}
      </p>
    </article>
  );
}

function PlanSelect({ disabled, onChange, value }: SelectProps<TenantPlan>) {
  return (
    <Select
      disabled={disabled}
      options={["starter", "pro", "enterprise"]}
      value={value}
      onChange={onChange}
    />
  );
}

function StatusSelect({ disabled, onChange, value }: SelectProps<PlatformTenantStatus>) {
  return (
    <Select
      disabled={disabled}
      options={["trialing", "active", "suspended"]}
      value={value}
      onChange={onChange}
    />
  );
}

type SelectProps<T extends string> = {
  disabled: boolean;
  onChange: (value: T) => void;
  value: T;
};

function Select<T extends string>({
  disabled,
  onChange,
  options,
  value
}: SelectProps<T> & { options: T[] }) {
  return (
    <select
      className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm capitalize"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
