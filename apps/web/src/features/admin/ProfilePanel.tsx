"use client";

import { useEffect, useState } from "react";
import { KeyRound, Mail, ShieldCheck, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type { ApiSession } from "@/lib/api-client";
import {
  getProfile,
  listAuthSessions,
  revokeOtherSessions,
  type ApiAuthSession,
  type ApiProfile
} from "@/lib/profile-client";

type ProfilePanelProps = {
  session: ApiSession;
};

export function ProfilePanel({ session }: ProfilePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [sessions, setSessions] = useState<ApiAuthSession[]>([]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getProfile(session), listAuthSessions(session)])
      .then(([nextProfile, nextSessions]) => {
        if (isMounted) {
          setProfile(nextProfile);
          setSessions(nextSessions);
          setError(null);
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Profile load failed"
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  return (
    <SectionPanel
      title="Profile"
      description="Signed-in account details for this tenant session."
      action={<Badge tone="info">{profile?.role ?? "loading"}</Badge>}
    >
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <ProfileField
            icon={UserCircle}
            label="Name"
            value={profile?.name ?? "Loading"}
          />
          <ProfileField icon={Mail} label="Email" value={profile?.email ?? "Loading"} />
          <ProfileField
            icon={ShieldCheck}
            label="User ID"
            value={profile?.userId ?? session.userId}
          />
        </div>
      )}
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <KeyRound aria-hidden className="h-4 w-4 text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-950">
              Active sessions: {sessions.length}
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-950 disabled:text-zinc-300"
            disabled={sessions.length <= 1}
            onClick={async () => {
              await revokeOtherSessions(session);
              setSessions(await listAuthSessions(session));
            }}
          >
            Revoke others
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          {sessions.map((authSession) => (
            <p className="text-xs text-zinc-500" key={authSession.id}>
              {authSession.isCurrent ? "Current" : "Other"} session · expires{" "}
              {new Date(authSession.expiresAt).toLocaleString()}
            </p>
          ))}
        </div>
      </div>
    </SectionPanel>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon aria-hidden className="h-4 w-4" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
