import type { TenantRecord } from "@rag-llm/db";

export type TenantPlan = TenantRecord["plan"];

export type PlanLimit = {
  documentLimit: number;
  monthlyQueryLimit: number;
};

export const planLimits: Record<TenantPlan, PlanLimit> = {
  enterprise: { documentLimit: 5000, monthlyQueryLimit: 100000 },
  pro: { documentLimit: 1000, monthlyQueryLimit: 10000 },
  starter: { documentLimit: 100, monthlyQueryLimit: 1000 }
};

export const getPlanLimits = (plan: TenantPlan): PlanLimit => planLimits[plan];
