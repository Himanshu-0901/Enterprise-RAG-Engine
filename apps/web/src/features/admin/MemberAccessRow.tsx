import type {
  ApiMember,
  ApiMemberRole,
  ApiMemberStatus
} from "@/lib/api-client";

type MemberAccessRowProps = {
  busyUserId: string | null;
  member: ApiMember;
  onInviteResend: () => void;
  onInviteRevoke: () => void;
  onRoleChange: (role: ApiMemberRole) => void;
  onStatusChange: (status: ApiMemberStatus) => void;
};

const statusTone = {
  active: "bg-emerald-50 text-emerald-700",
  disabled: "bg-rose-50 text-rose-700",
  invited: "bg-amber-50 text-amber-700"
} as const;

export function MemberAccessRow({
  busyUserId,
  member,
  onInviteResend,
  onInviteRevoke,
  onRoleChange,
  onStatusChange
}: MemberAccessRowProps) {
  const isBusy = busyUserId === member.id;
  const role = member.role === "platform_admin" ? "admin" : member.role;

  return (
    <tr className="transition hover:bg-zinc-50">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c4574b] text-xs font-semibold text-white">
            {initials(member.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-950">{member.name}</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-500">
              {member.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleSelect
          disabled={isBusy || member.role === "platform_admin"}
          value={role}
          onChange={onRoleChange}
        />
      </td>
      <td className="px-4 py-3">
        <StatusSelect disabled={isBusy} value={member.status} onChange={onStatusChange} />
      </td>
      <td className="px-4 py-3">
        <StatusPill status={member.status} />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
        {member.lastSeenAt ? new Date(member.lastSeenAt).toLocaleString() : "Never"}
      </td>
      <td className="px-4 py-3 text-right">
        {member.status === "invited" ? (
          <div className="flex justify-end gap-3">
            <button
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950"
              type="button"
              onClick={onInviteResend}
            >
              Resend
            </button>
            <button
              className="text-xs font-medium text-rose-600 hover:text-rose-800"
              type="button"
              onClick={onInviteRevoke}
            >
              Revoke
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">No invite</span>
        )}
      </td>
    </tr>
  );
}

export function RoleSelect({
  disabled,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (role: ApiMemberRole) => void;
  value: ApiMemberRole;
}) {
  return (
    <select
      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-50 disabled:text-zinc-400"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as ApiMemberRole)}
    >
      <option value="end_user">End user</option>
      <option value="editor">Editor</option>
      <option value="admin">Admin</option>
    </select>
  );
}

function StatusSelect({
  disabled,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (status: ApiMemberStatus) => void;
  value: ApiMemberStatus;
}) {
  return (
    <select
      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-50 disabled:text-zinc-400"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as ApiMemberStatus)}
    >
      <option value="invited">Invited</option>
      <option value="active">Active</option>
      <option value="disabled">Disabled</option>
    </select>
  );
}

function StatusPill({ status }: { status: ApiMemberStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${statusTone[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
