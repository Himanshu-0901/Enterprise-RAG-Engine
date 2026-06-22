import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type StoredSession = {
  tenantId: string;
  token?: string;
  userId: string;
};

const authStorageKey = "rag-llm-auth-session";
const apiUrl = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:4000";

test("admin can sign up, invite, upload, chat, and update settings", async ({
  page,
  request
}) => {
  const slug = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${slug}@example.com`;

  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Signup" }).click();
    await page.getByLabel("Tenant slug").fill(slug);
    await page.getByLabel("Tenant name").fill("E2E Smoke Tenant");
    await page.getByLabel("Name", { exact: true }).fill("E2E Admin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Onboarding", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Users" }).click();
    await page.getByPlaceholder("Name").fill("Invited Client");
    await page.getByPlaceholder("Email").fill(`client-${email}`);
    await page.getByRole("button", { name: "Invite" }).click();
    await expect(page.getByText(/Invite ready for/)).toBeVisible();

    await page.getByRole("button", { name: /Documents/ }).click();
    await page.getByPlaceholder("Paste document content...").fill(
      "The support policy requires citation-backed answers for every factual claim."
    );
    await page.getByRole("button", { name: "Index content" }).click();
    await expect(page.getByText("Product Notes.md", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Chat" }).click();
    await page
      .getByPlaceholder("Ask what the uploaded documents say...")
      .fill("What does the support policy require?");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(page.getByText("What does the support policy require?")).toBeVisible();

    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByLabel("Data retention days").fill("180");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
  } finally {
    await cleanupTenant(page, request, slug);
  }
});

const cleanupTenant = async (
  page: Page,
  request: APIRequestContext,
  slug: string
): Promise<void> => {
  const session = await readStoredSession(page);

  if (!session?.token) {
    return;
  }

  await request.delete(`${apiUrl}/settings/current`, {
    data: { confirmation: slug },
    headers: {
      authorization: `Bearer ${session.token}`,
      "content-type": "application/json",
      "x-tenant-id": session.tenantId,
      "x-user-id": session.userId
    }
  });
};

const readStoredSession = async (page: Page): Promise<StoredSession | null> => {
  const rawSession = await page.evaluate((key) => localStorage.getItem(key), authStorageKey);

  if (!rawSession) {
    return null;
  }

  return JSON.parse(rawSession) as StoredSession;
};
