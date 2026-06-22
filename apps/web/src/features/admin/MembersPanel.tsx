"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MemberAccessRow } from "@/features/admin/MemberAccessRow";
import {
  InviteCard,
  InviteReadyCard,
  type CreatedInvite
} from "@/features/admin/UserInviteCards";
import type {
  ApiMember,
  ApiMemberRole,
  ApiMemberStatus,
  ApiSession
} from "@/lib/api-client";
import { memberClient } from "@/lib/member-client";

type MembersPanelProps = {
  members: ApiMember[];
  onChanged: () => Promise<void>;
  session: ApiSession;
};

export function MembersPanel({ members, onChanged, session }: MembersPanelProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ApiMemberRole>("end_user");
  const [query, setQuery] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [wasCopied, setWasCopied] = useState(false);

  const filteredMembers = useMemo(
    () =>
      members.filter((member) =>
        `${member.name} ${member.email} ${member.role}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ),
    [members, query]
  );
  const activeCount = members.filter((member) => member.status === "active").length;
  const invitedCount = members.filter((member) => member.status === "invited").length;

  const invite = async () => {
    setIsInviting(true);
    try {
      const result = await memberClient.invite(session, { email, name, role });
      const inviteUrl = result.inviteUrl.replace(appOrigin(), window.location.origin);
      setCreatedInvite({ email, token: result.inviteToken, url: inviteUrl });
      setWasCopied(false);
      setEmail("");
      setName("");
      await onChanged();
    } finally {
      setIsInviting(false);
    }
  };

  const updateMember = async (
    userId: string,
    input: { role?: ApiMemberRole; status?: ApiMemberStatus }
  ) => {
    setBusyUserId(userId);
    try {
      await memberClient.update(session, userId, input);
      await onChanged();
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Users
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {activeCount} active · {invitedCount} pending invites · {members.length} total
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <InviteCard
          email={email}
          isInviting={isInviting}
          name={name}
          role={role}
          setEmail={setEmail}
          setName={setName}
          setRole={setRole}
          onInvite={invite}
        />
        <UsersTable
          busyUserId={busyUserId}
          members={filteredMembers}
          query={query}
          setCreatedInvite={setCreatedInvite}
          setQuery={setQuery}
          setWasCopied={setWasCopied}
          session={session}
          totalMembers={members.length}
          onChanged={onChanged}
          onUpdateMember={updateMember}
        />
      </div>

      {createdInvite ? (
        <InviteReadyCard
          invite={createdInvite}
          wasCopied={wasCopied}
          onCopied={() => setWasCopied(true)}
        />
      ) : null}
    </div>
  );
}

const appOrigin = () => "http://localhost:3001";

type UsersTableProps = {
  busyUserId: string | null;
  members: ApiMember[];
  onChanged: () => Promise<void>;
  onUpdateMember: (
    userId: string,
    input: { role?: ApiMemberRole; status?: ApiMemberStatus }
  ) => Promise<void>;
  query: string;
  session: ApiSession;
  setCreatedInvite: (invite: CreatedInvite) => void;
  setQuery: (value: string) => void;
  setWasCopied: (value: boolean) => void;
  totalMembers: number;
};

function UsersTable({
  busyUserId,
  members,
  onChanged,
  onUpdateMember,
  query,
  session,
  setCreatedInvite,
  setQuery,
  setWasCopied,
  totalMembers
}: UsersTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-950">Tenant access</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {totalMembers} users · {members.length} shown
          </p>
        </div>
        <label className="relative min-w-0 xl:w-80">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <span className="sr-only">Search users</span>
          <input
            className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-500"
            placeholder="Search users..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 font-mono text-[11px] uppercase tracking-normal text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
              <th className="px-4 py-3 text-right font-medium">Invite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {members.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-zinc-500" colSpan={6}>
                  No users match the current search.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <MemberAccessRow
                  key={member.id}
                  busyUserId={busyUserId}
                  member={member}
                  onRoleChange={(nextRole) =>
                    void onUpdateMember(member.id, { role: nextRole })
                  }
                  onStatusChange={(nextStatus) =>
                    void onUpdateMember(member.id, { status: nextStatus })
                  }
                  onInviteResend={async () => {
                    const result = await memberClient.resendInvite(session, member.id);
                    setCreatedInvite({
                      email: member.email,
                      token: result.inviteToken,
                      url: result.inviteUrl.replace(appOrigin(), window.location.origin)
                    });
                    setWasCopied(false);
                    await onChanged();
                  }}
                  onInviteRevoke={async () => {
                    await memberClient.revokeInvite(session, member.id);
                    await onChanged();
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
