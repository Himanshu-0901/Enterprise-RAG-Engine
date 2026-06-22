import type { TenantBillingRecord, TenantRecord } from "@rag-llm/db";
import type { ServerEnv } from "@rag-llm/shared";

type CheckoutInput = {
  billing: TenantBillingRecord;
  env: ServerEnv;
  plan: TenantRecord["plan"];
  tenant: TenantRecord;
};

type CheckoutResult = {
  checkoutUrl: string;
  mode: "dev" | "stripe";
};

type StripeCheckoutResponse = {
  error?: { message?: string };
  id?: string;
  url?: string;
};

const priceId = (env: ServerEnv, plan: TenantRecord["plan"]): string => {
  if (plan === "enterprise") {
    return env.STRIPE_ENTERPRISE_PRICE_ID;
  }

  return plan === "pro" ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_STARTER_PRICE_ID;
};

export const createCheckoutSession = async ({
  billing,
  env,
  plan,
  tenant
}: CheckoutInput): Promise<CheckoutResult> => {
  const stripePriceId = priceId(env, plan);

  if (env.STRIPE_SECRET_KEY === "replace-me" || !stripePriceId) {
    return {
      checkoutUrl: `/billing/dev-checkout?tenant=${tenant.id}&plan=${plan}`,
      mode: "dev"
    };
  }

  const form = new URLSearchParams({
    "line_items[0][price]": stripePriceId,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan,
    "metadata[tenant_id]": tenant.id,
    cancel_url: `${env.APP_BASE_URL}/?billing=cancelled`,
    client_reference_id: tenant.id,
    mode: "subscription",
    success_url: `${env.APP_BASE_URL}/?billing=success`
  });

  if (billing.stripeCustomerId && !billing.stripeCustomerId.startsWith("cus_dev_")) {
    form.set("customer", billing.stripeCustomerId);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body: form,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });
  const payload = (await response.json()) as StripeCheckoutResponse;

  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? "Stripe checkout session failed");
  }

  return { checkoutUrl: payload.url, mode: "stripe" };
};
