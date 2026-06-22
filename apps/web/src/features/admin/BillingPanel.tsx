"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, ReceiptText, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type { ApiSession } from "@/lib/api-client";
import {
  billingClient,
  type BillingOverview,
  type TenantPlan
} from "@/lib/billing-client";

type BillingPanelProps = {
  onChanged: () => Promise<void>;
  session: ApiSession;
};

const planOptions: TenantPlan[] = ["starter", "pro", "enterprise"];

export function BillingPanel({ onChanged, session }: BillingPanelProps) {
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setBilling(await billingClient.getOverview(session));
  }, [session]);

  useEffect(() => {
    void load().catch((caught) =>
      setError(caught instanceof Error ? caught.message : "Failed to load billing")
    );
  }, [load]);

  const changePlan = async (plan: TenantPlan) => {
    setIsBusy(true);
    setError(null);
    try {
      await billingClient.checkout(session, plan);
      await Promise.all([load(), onChanged()]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update plan");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SectionPanel
      title="Billing"
      description="Plan, quota, subscription records, and invoice history for this tenant."
      action={<Badge tone={billing?.tenant.status === "suspended" ? "danger" : "success"}>
        {billing?.billing.billingStatus ?? "Loading"}
      </Badge>}
    >
      {error ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <BillingMetric
          icon={CreditCard}
          label="Current plan"
          value={billing?.tenant.plan ?? "Loading"}
        />
        <BillingMetric
          icon={TrendingUp}
          label="Queries"
          state={billing?.quota.queryUsageState}
          value={`${billing?.quota.queryCountThisMonth ?? 0} / ${
            billing?.quota.monthlyQueryLimit ?? 0
          }`}
        />
        <BillingMetric
          icon={ReceiptText}
          label="Documents"
          state={billing?.quota.documentUsageState}
          value={`${billing?.quota.activeDocumentCount ?? 0} / ${
            billing?.quota.documentLimit ?? 0
          }`}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {planOptions.map((plan) => (
          <article
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            key={plan}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold capitalize text-zinc-950">{plan}</h3>
              {billing?.tenant.plan === plan ? <Badge tone="info">Current</Badge> : null}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{planCopy[plan]}</p>
            <Button
              className="mt-4 w-full"
              disabled={isBusy || billing?.tenant.plan === plan}
              variant={billing?.tenant.plan === plan ? "secondary" : "primary"}
              onClick={() => void changePlan(plan)}
            >
              {billing?.tenant.plan === plan ? "Selected" : "Change plan"}
            </Button>
          </article>
        ))}
      </div>

      <InvoiceTable billing={billing} />
    </SectionPanel>
  );
}

const planCopy: Record<TenantPlan, string> = {
  enterprise: "High-volume tenants, SAML readiness, custom domains, and larger quotas.",
  pro: "Growing teams with larger document libraries and heavier chat usage.",
  starter: "Small teams validating a branded RAG portal with basic limits."
};

function BillingMetric({
  icon: Icon,
  label,
  state,
  value
}: {
  icon: typeof CreditCard;
  label: string;
  state?: "hard_limit" | "ok" | "soft_warning";
  value: string;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
        {state ? (
          <Badge tone={state === "hard_limit" ? "danger" : state === "soft_warning" ? "warning" : "success"}>
            {state.replace("_", " ")}
          </Badge>
        ) : (
          <Icon aria-hidden className="h-4 w-4 text-zinc-400" />
        )}
      </div>
      <p className="mt-3 font-mono text-lg font-semibold capitalize text-zinc-950">
        {value}
      </p>
    </article>
  );
}

function InvoiceTable({ billing }: { billing: BillingOverview | null }) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">Invoices</h3>
      </div>
      <div className="divide-y divide-zinc-200">
        {billing?.invoices.length ? (
          billing.invoices.map((invoice) => (
            <div className="grid gap-3 px-4 py-3 text-sm md:grid-cols-4" key={invoice.id}>
              <span className="font-medium capitalize text-zinc-950">{invoice.plan}</span>
              <span className="text-zinc-500">{money(invoice.amountPaidCents)}</span>
              <Badge tone={invoice.status === "paid" ? "success" : "warning"}>
                {invoice.status}
              </Badge>
              <a
                className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950"
                href={invoice.hostedInvoiceUrl ?? "#"}
              >
                Invoice <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </a>
            </div>
          ))
        ) : (
          <p className="px-4 py-6 text-sm text-zinc-500">
            No invoices yet. A paid dev invoice is created when the plan changes.
          </p>
        )}
      </div>
    </div>
  );
}

const money = (cents: number): string =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency"
  }).format(cents / 100);
