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

type InviteResponse = {
  inviteToken: string;
  membership: { inviteTokenHash?: string; role: string; status: string };
  user: { email: string; id: string; name: string };
};

test("tenant invite acceptance activates end-user session once", async () => {
  const server = createTestServer();
  const signup = await signupTenant(server, "invite-flow");

  try {
    const invited = await expectData<InviteResponse>(
      await jsonRequest(server, "/users", {
        body: {
          email: `invitee-${signup.tenant.slug}@example.com`,
          name: "Invited User",
          role: "end_user"
        },
        method: "POST",
        session: signup.session
      }),
      201
    );

    assert.equal(invited.membership.status, "invited");
    assert.equal(invited.membership.role, "end_user");
    assert.equal(invited.membership.inviteTokenHash, undefined);
    assert.ok(invited.inviteToken.length > 20);

    const accepted = await expectData<{
      membership: { role: string; status: string };
      session: TestSession;
    }>(
      await jsonRequest(server, "/auth/invites/accept", {
        body: {
          name: "Invited User",
          password: "password123",
          token: invited.inviteToken
        },
        method: "POST"
      })
    );
    assert.equal(accepted.membership.status, "active");
    assert.equal(accepted.session.role, "end_user");

    const profile = await expectData<{ email: string; role: string }>(
      await jsonRequest(server, "/auth/profile", { session: accepted.session })
    );
    assert.equal(profile.email, invited.user.email);
    assert.equal(profile.role, "end_user");

    await expectError(
      await jsonRequest(server, "/auth/invites/accept", {
        body: {
          password: "password123",
          token: invited.inviteToken
        },
        method: "POST"
      }),
      401
    );
  } finally {
    await deleteTenantById(signup.tenant.id);
    await server.close();
  }
});
