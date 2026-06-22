import assert from "node:assert/strict";
import test from "node:test";
import {
  createTestServer,
  deleteTenantById,
  expectData,
  expectError,
  jsonRequest,
  signupTenant,
  type TestSession
} from "./api-test-client";

test("signup, login, session listing, revoke others, and logout work", async () => {
  const server = createTestServer();
  const signup = await signupTenant(server, "auth-session");

  try {
    const profile = await expectData<{ email: string; role: string }>(
      await jsonRequest(server, "/auth/profile", { session: signup.session })
    );
    assert.equal(profile.role, "admin");
    assert.equal(profile.email, signup.user.email);

    const login = await expectData<{ session: TestSession }>(
      await jsonRequest(server, "/auth/login", {
        body: {
          email: signup.user.email,
          password: "password123",
          tenantSlug: signup.tenant.slug
        },
        method: "POST"
      })
    );
    assert.notEqual(login.session.token, signup.session.token);

    const sessions = await expectData<Array<{ isCurrent: boolean }>>(
      await jsonRequest(server, "/auth/profile/sessions", {
        session: login.session
      })
    );
    assert.ok(sessions.length >= 2);
    assert.ok(sessions.some((session) => session.isCurrent));

    await expectData<{ revoked: boolean }>(
      await jsonRequest(server, "/auth/profile/sessions/revoke-others", {
        method: "POST",
        session: login.session
      })
    );
    await expectError(
      await jsonRequest(server, "/auth/profile", { session: signup.session }),
      401
    );

    await expectData<{ revoked: boolean }>(
      await jsonRequest(server, "/auth/logout", {
        method: "POST",
        session: login.session
      })
    );
    await expectError(
      await jsonRequest(server, "/auth/profile", { session: login.session }),
      401
    );
  } finally {
    await deleteTenantById(signup.tenant.id);
    await server.close();
  }
});
