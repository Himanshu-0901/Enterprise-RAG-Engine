import { AccountSecurityPanel } from "@/features/admin/AccountSecurityPanel";
import { AdminOverview } from "@/features/admin/AdminOverview";
import { AnalyticsPanel } from "@/features/admin/AnalyticsPanel";
import { BillingPanel } from "@/features/admin/BillingPanel";
import { DevSessionPanel } from "@/features/admin/DevSessionPanel";
import { MembersPanel } from "@/features/admin/MembersPanel";
import { PlatformAdminPanel } from "@/features/admin/PlatformAdminPanel";
import { ProfilePanel } from "@/features/admin/ProfilePanel";
import { SettingsPanel } from "@/features/admin/SettingsPanel";
import { TenantDangerZone } from "@/features/admin/TenantDangerZone";
import type { AdminView } from "@/features/admin/admin-view";
import { BrandingEditor } from "@/features/branding/BrandingEditor";
import { ApiChatWorkspace } from "@/features/chat/ApiChatWorkspace";
import { DocumentIngestionPanel } from "@/features/documents/DocumentIngestionPanel";
import type { ApiFeedbackInsights } from "@/lib/feedback-client";
import type {
  AnalyticsUsage,
  ApiDocument,
  ApiMember,
  ApiSession,
  ApiTenantBranding,
  ApiTenantSettings,
  AuditLog,
  ShardRoute
} from "@/lib/api-client";

type RenderActiveViewInput = {
  activeView: AdminView;
  auditLogs: AuditLog[];
  branding: ApiTenantBranding | null;
  documents: ApiDocument[];
  feedbackInsights: ApiFeedbackInsights | null;
  members: ApiMember[];
  onLogout?: () => void;
  refresh: () => Promise<void>;
  saveSession: (session: ApiSession) => void;
  session: ApiSession;
  settings: ApiTenantSettings | null;
  setActiveView: (view: AdminView) => void;
  shardRoute: ShardRoute | null;
  usage: AnalyticsUsage | null;
};

export function renderActiveView(input: RenderActiveViewInput) {
  if (input.activeView === "overview") {
    return (
      <AdminOverview
        auditLogs={input.auditLogs}
        branding={input.branding}
        documents={input.documents}
        feedbackInsights={input.feedbackInsights}
        members={input.members}
        settings={input.settings}
        shardRoute={input.shardRoute}
        usage={input.usage}
        onViewChange={input.setActiveView}
      />
    );
  }

  if (input.activeView === "documents") {
    return (
      <DocumentIngestionPanel
        documents={input.documents}
        onChanged={input.refresh}
        session={input.session}
      />
    );
  }

  if (input.activeView === "chat") {
    return (
      <ApiChatWorkspace
        allowAnswerExport={input.settings?.allowAnswerExport ?? false}
        allowSourceDownload={input.settings?.allowSourceDownload ?? false}
        onAnswered={input.refresh}
        session={input.session}
      />
    );
  }

  if (input.activeView === "users") {
    return (
      <MembersPanel
        members={input.members}
        onChanged={input.refresh}
        session={input.session}
      />
    );
  }

  if (input.activeView === "billing") {
    return <BillingPanel onChanged={input.refresh} session={input.session} />;
  }

  if (input.activeView === "platform") {
    return <PlatformAdminPanel session={input.session} />;
  }

  if (input.activeView === "branding") {
    return (
      <BrandingEditor
        branding={input.branding}
        onChanged={input.refresh}
        session={input.session}
      />
    );
  }

  if (input.activeView === "settings") {
    return (
      <div className="grid gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage account security, active sessions, and tenant policies.
          </p>
        </div>
        {!input.session.token ? (
          <DevSessionPanel
            session={input.session}
            onSessionChange={input.saveSession}
          />
        ) : null}
        {input.session.token ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <ProfilePanel session={input.session} />
            <AccountSecurityPanel session={input.session} />
          </div>
        ) : null}
        <SettingsPanel
          onChanged={input.refresh}
          session={input.session}
          settings={input.settings}
        />
        <TenantDangerZone session={input.session} onDeleted={input.onLogout} />
      </div>
    );
  }

  return (
    <AnalyticsPanel
      auditLogs={input.auditLogs}
      feedbackInsights={input.feedbackInsights}
      usage={input.usage}
    />
  );
}
