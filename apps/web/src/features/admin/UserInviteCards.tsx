import { Clipboard, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RoleSelect } from "@/features/admin/MemberAccessRow";
import type { ApiMemberRole } from "@/lib/api-client";

export type CreatedInvite = {
  email: string;
  token: string;
  url: string;
};

type InviteCardProps = {
  email: string;
  isInviting: boolean;
  name: string;
  onInvite: () => Promise<void>;
  role: ApiMemberRole;
  setEmail: (value: string) => void;
  setName: (value: string) => void;
  setRole: (value: ApiMemberRole) => void;
};

export function InviteCard({
  email,
  isInviting,
  name,
  onInvite,
  role,
  setEmail,
  setName,
  setRole
}: InviteCardProps) {
  return (
    <form
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void onInvite();
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-zinc-950 text-white">
          <UserPlus aria-hidden className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Invite user</h2>
          <p className="text-xs text-zinc-500">Send access to this tenant workspace.</p>
        </div>
      </div>
      <div className="grid gap-3">
        <input
          className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <RoleSelect value={role} onChange={setRole} />
        <Button type="submit" disabled={isInviting || !name || !email}>
          <UserPlus aria-hidden className="h-4 w-4" />
          {isInviting ? "Inviting..." : "Invite"}
        </Button>
      </div>
    </form>
  );
}

export function InviteReadyCard({
  invite,
  onCopied,
  wasCopied
}: {
  invite: CreatedInvite;
  onCopied: () => void;
  wasCopied: boolean;
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-950">
            Invite ready for {invite.email}
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Share this link once. The token expires in 7 days.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(invite.url);
            onCopied();
          }}
        >
          <Clipboard aria-hidden className="h-4 w-4" />
          {wasCopied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <input
        readOnly
        className="mt-3 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-700"
        value={invite.url}
      />
      <p className="mt-2 break-all font-mono text-xs text-emerald-800">
        Token: {invite.token}
      </p>
    </section>
  );
}
