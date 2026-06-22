"use client";

import { useEffect, useState } from "react";
import { LogOut, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApiChatWorkspace } from "@/features/chat/ApiChatWorkspace";
import type { ApiSession } from "@/lib/api-client";
import { getPortalConfig, type ApiPortalConfig } from "@/lib/portal-client";

type EndUserPortalProps = {
  onLogout: () => void;
  session: ApiSession;
};

export function EndUserPortal({ onLogout, session }: EndUserPortalProps) {
  const [config, setConfig] = useState<ApiPortalConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortalConfig(session)
      .then((nextConfig) => {
        setConfig(nextConfig);
        setError(null);
      })
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error ? caughtError.message : "Portal load failed"
        );
      });
  }, [session]);

  return (
    <main className="min-h-screen bg-[#fbfbfa] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: config?.branding.primaryColor ?? "#18181b" }}
            >
              {initials(config?.branding.portalName ?? "Tenant assistant")}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-zinc-950">
                {config?.branding.portalName ?? "Tenant assistant"}
              </h1>
              <p className="truncate text-sm text-zinc-500">
                {config?.branding.welcomeMessage ?? "Loading branded portal..."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone="info">{config?.tenant.slug ?? "portal"}</Badge>
            <Button type="button" variant="secondary" onClick={onLogout}>
              <LogOut aria-hidden className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:block">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: config?.branding.primaryColor ?? "#18181b" }}
            type="button"
          >
            <Plus aria-hidden className="h-4 w-4" />
            New chat
          </button>
          <div className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-normal text-zinc-400">
              Portal
            </p>
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
                <MessageSquare aria-hidden className="h-4 w-4 text-zinc-500" />
                Grounded answers
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Answers use tenant documents and expose citations for review.
              </p>
            </div>
          </div>
        </aside>
        <section className="min-w-0">
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <ApiChatWorkspace
          allowAnswerExport={config?.settings.allowAnswerExport ?? false}
          allowSourceDownload={config?.settings.allowSourceDownload ?? false}
          onAnswered={async () => undefined}
          session={session}
        />
        </section>
      </div>
    </main>
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
