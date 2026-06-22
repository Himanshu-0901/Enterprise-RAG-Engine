import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Palette,
  Settings,
  Upload,
  UserPlus
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type {
  AnalyticsUsage,
  ApiDocument,
  ApiMember,
  ApiTenantBranding,
  ApiTenantSettings
} from "@/lib/api-client";

type TenantOverviewProps = {
  branding: ApiTenantBranding | null;
  documents: ApiDocument[];
  members: ApiMember[];
  settings: ApiTenantSettings | null;
  usage: AnalyticsUsage | null;
};

type OnboardingStep = {
  description: string;
  done: boolean;
  icon: typeof Upload;
  label: string;
  metric: string;
};

export function TenantOverview({
  branding,
  documents,
  members,
  settings,
  usage
}: TenantOverviewProps) {
  const readyDocuments = documents.filter((item) => item.status === "ready").length;
  const invitedEndUsers = members.filter((item) => item.role === "end_user").length;
  const queryCount = usage?.summary.query ?? 0;
  const steps: OnboardingStep[] = [
    {
      description: "Portal name, welcome copy, and colors are available.",
      done: Boolean(branding?.portalName && branding.primaryColor),
      icon: Palette,
      label: "Brand the portal",
      metric: branding?.portalName ?? "Not configured"
    },
    {
      description: "Upload source material and wait for at least one ready index.",
      done: readyDocuments > 0,
      icon: Upload,
      label: "Upload knowledge",
      metric: `${readyDocuments}/${documents.length} ready`
    },
    {
      description: "Invite a client or teammate to activate the end-user flow.",
      done: invitedEndUsers > 0,
      icon: UserPlus,
      label: "Invite end users",
      metric: `${invitedEndUsers} invited`
    },
    {
      description: "Run a real query and verify the citation experience.",
      done: queryCount > 0,
      icon: MessageSquare,
      label: "Validate answers",
      metric: `${queryCount} queries`
    },
    {
      description: "Confirm export, source download, retention, and citation rules.",
      done: Boolean(settings),
      icon: Settings,
      label: "Review policies",
      metric: settings ? `${settings.dataRetentionDays} day retention` : "Pending"
    }
  ];
  const completeSteps = steps.filter((step) => step.done).length;
  const progress = Math.round((completeSteps / steps.length) * 100);

  return (
    <SectionPanel
      title="Tenant onboarding"
      description="Activation path for a tenant workspace that is ready for real users."
      action={<Badge tone={progress === 100 ? "success" : "info"}>{progress}%</Badge>}
    >
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-950"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {steps.map((step) => (
          <OnboardingStepCard key={step.label} step={step} />
        ))}
      </div>
    </SectionPanel>
  );
}

function OnboardingStepCard({ step }: { step: OnboardingStep }) {
  const Icon = step.icon;
  const StatusIcon = step.done ? CheckCircle2 : Circle;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon aria-hidden className="h-4 w-4 text-zinc-500" />
        <StatusIcon
          aria-hidden
          className={step.done ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-zinc-300"}
        />
      </div>
      <p className="mt-4 text-sm font-semibold text-zinc-950">{step.label}</p>
      <p className="mt-2 min-h-12 text-sm leading-5 text-zinc-500">
        {step.description}
      </p>
      <p className="mt-3 truncate text-xs font-medium text-zinc-400">
        {step.metric}
      </p>
    </article>
  );
}
