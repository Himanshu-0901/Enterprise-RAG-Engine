"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { AdminShell } from "@/features/admin/AdminShell";
import { renderActiveView } from "@/features/admin/AdminViewRenderer";
import type { AdminView } from "@/features/admin/admin-view";
import {
  listFeedbackInsights,
  type ApiFeedbackInsights
} from "@/lib/feedback-client";
import {
  apiClient,
  type AnalyticsUsage,
  type ApiDocument,
  type ApiMember,
  type ApiSession,
  type ApiTenantBranding,
  type ApiTenantSettings,
  type AuditLog,
  type ShardRoute
} from "@/lib/api-client";
import { memberClient } from "@/lib/member-client";

const defaultSession: ApiSession = {
  tenantId: "e4aa1e75-fb92-462f-abbe-a6f366556c2a",
  userId: "876c4449-1c1d-43c8-8031-35845e95313f"
};

const sessionStorageKey = "rag-llm-dev-session";

type AdminDashboardProps = {
  initialSession?: ApiSession;
  onLogout?: () => void;
};

export function AdminDashboard({ initialSession, onLogout }: AdminDashboardProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branding, setBranding] = useState<ApiTenantBranding | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [feedbackInsights, setFeedbackInsights] =
    useState<ApiFeedbackInsights | null>(null);
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [session, setSession] = useState<ApiSession>(
    initialSession ?? defaultSession
  );
  const [settings, setSettings] = useState<ApiTenantSettings | null>(null);
  const [shardRoute, setShardRoute] = useState<ShardRoute | null>(null);
  const [usage, setUsage] = useState<AnalyticsUsage | null>(null);

  useEffect(() => {
    if (initialSession) {
      return;
    }

    const stored = window.localStorage.getItem(sessionStorageKey);
    if (stored) {
      setSession(JSON.parse(stored) as ApiSession);
    }
  }, [initialSession]);

  const saveSession = (nextSession: ApiSession) => {
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        nextDocuments,
        nextMembers,
        nextUsage,
        nextAuditLogs,
        nextShardRoute,
        nextBranding,
        nextSettings,
        nextFeedbackInsights
      ] =
        await Promise.all([
          apiClient.listDocuments(session),
          memberClient.list(session),
          apiClient.listUsage(session),
          apiClient.listAuditLogs(session),
          apiClient.getShardRoute(session),
          apiClient.getTenantBranding(session),
          apiClient.getTenantSettings(session),
          listFeedbackInsights(session)
        ]);
      setDocuments(nextDocuments);
      setMembers(nextMembers);
      setUsage(nextUsage);
      setAuditLogs(nextAuditLogs);
      setShardRoute(nextShardRoute);
      setBranding(nextBranding);
      setSettings(nextSettings);
      setFeedbackInsights(nextFeedbackInsights);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to load data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminShell
      activeView={activeView}
      branding={branding}
      documentCount={documents.length}
      isLoading={isLoading}
      memberCount={members.length}
      members={members}
      onLogout={onLogout}
      session={session}
      onViewChange={setActiveView}
    >
      <div className="grid gap-5">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            <AlertCircle aria-hidden className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {renderActiveView({
          activeView,
          auditLogs,
          branding,
          documents,
          feedbackInsights,
          members,
          onLogout,
          refresh,
          saveSession,
          session,
          settings,
          setActiveView,
          shardRoute,
          usage
        })}
      </div>
    </AdminShell>
  );
}
