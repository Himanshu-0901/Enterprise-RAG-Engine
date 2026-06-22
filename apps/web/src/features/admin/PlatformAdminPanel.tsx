"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldAlert, SlidersHorizontal, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type { ApiSession, AuditLog } from "@/lib/api-client";
import {
  platformClient,
  type AbuseReview,
  type PlatformTenantRow
} from "@/lib/platform-client";
import {
  AbuseQueue,
  FleetMetric,
  PlatformAudit,
  TenantTable
} from "./PlatformAdminSections";

type PlatformAdminPanelProps = {
  session: ApiSession;
};

export function PlatformAdminPanel({ session }: PlatformAdminPanelProps) {
  const [abuseReviews, setAbuseReviews] = useState<AbuseReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState<PlatformTenantRow[]>([]);

  const load = useCallback(async () => {
    setError(null);
    const [nextTenants, nextReviews, nextAudit] = await Promise.all([
      platformClient.listTenants(session, query),
      platformClient.listAbuseReviews(session),
      platformClient.listAudit(session)
    ]);
    setTenants(nextTenants);
    setAbuseReviews(nextReviews);
    setAuditLogs(nextAudit);
  }, [query, session]);

  useEffect(() => {
    void load().catch((caught) =>
      setError(caught instanceof Error ? caught.message : "Failed to load platform admin")
    );
  }, [load]);

  const totals = useMemo(
    () => ({
      documents: tenants.reduce((sum, row) => sum + row.documents, 0),
      queries: tenants.reduce((sum, row) => sum + row.queriesThisMonth, 0),
      suspended: tenants.filter((row) => row.tenant.status === "suspended").length
    }),
    [tenants]
  );

  const mutate = async (work: () => Promise<unknown>) => {
    setIsBusy(true);
    setError(null);
    try {
      await work();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Platform action failed");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="grid gap-5">
      <SectionPanel
        title="Platform admin"
        description="Fleet-wide tenant operations, feature flags, and safety review."
        action={<Badge tone="info">{tenants.length} tenants</Badge>}
      >
        {error ? (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <FleetMetric icon={Users} label="Documents" value={totals.documents} />
          <FleetMetric icon={SlidersHorizontal} label="Monthly queries" value={totals.queries} />
          <FleetMetric icon={ShieldAlert} label="Suspended" value={totals.suspended} />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            className="h-10 flex-1 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="Search tenants..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button disabled={isBusy} variant="secondary" onClick={() => void load()}>
            Search
          </Button>
        </div>
        <TenantTable isBusy={isBusy} mutate={mutate} session={session} tenants={tenants} />
      </SectionPanel>
      <AbuseQueue isBusy={isBusy} mutate={mutate} reviews={abuseReviews} session={session} />
      <PlatformAudit logs={auditLogs} />
    </div>
  );
}
