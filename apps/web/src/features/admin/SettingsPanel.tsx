"use client";

import { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import {
  apiClient,
  type ApiSession,
  type ApiTenantSettings
} from "@/lib/api-client";

type SettingsPanelProps = {
  onChanged: () => Promise<void>;
  session: ApiSession;
  settings: ApiTenantSettings | null;
};

type SettingsDraft = {
  allowAnswerExport: boolean;
  allowSourceDownload: boolean;
  dataRetentionDays: number;
  requireCitations: boolean;
};

const defaultDraft: SettingsDraft = {
  allowAnswerExport: true,
  allowSourceDownload: false,
  dataRetentionDays: 365,
  requireCitations: true
};

const toDraft = (settings: ApiTenantSettings | null): SettingsDraft => ({
  allowAnswerExport: settings?.allowAnswerExport ?? defaultDraft.allowAnswerExport,
  allowSourceDownload:
    settings?.allowSourceDownload ?? defaultDraft.allowSourceDownload,
  dataRetentionDays: settings?.dataRetentionDays ?? defaultDraft.dataRetentionDays,
  requireCitations: settings?.requireCitations ?? defaultDraft.requireCitations
});

export function SettingsPanel({
  onChanged,
  session,
  settings
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<SettingsDraft>(() => toDraft(settings));
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toDraft(settings));
  }, [settings]);

  const updateDraft = <Key extends keyof SettingsDraft>(
    key: Key,
    value: SettingsDraft[Key]
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const saveSettings = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await apiClient.updateTenantSettings(session, draft);
      await onChanged();
      setStatus("Settings saved");
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    setIsExporting(true);
    setStatus(null);
    try {
      const payload = await apiClient.exportTenantData(session);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json"
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `tenant-export-${session.tenantId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Tenant export generated");
      await onChanged();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SectionPanel
      title="Tenant settings"
      description="Configure retention, source access, answer export, and citation policy."
      action={
        <Button type="button" variant="secondary" onClick={() => void exportData()}>
          <Download aria-hidden className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export data"}
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <label
            className="text-sm font-medium text-zinc-700"
            htmlFor="retention-days"
          >
            Data retention days
          </label>
          <input
            id="retention-days"
            className="mt-2 h-9 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
            max={3650}
            min={30}
            type="number"
            value={draft.dataRetentionDays}
            onChange={(event) =>
              updateDraft("dataRetentionDays", Number(event.target.value))
            }
          />
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            The worker removes conversations older than this policy and records
            a retention audit event.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3">
            <SettingsToggle
              checked={draft.allowSourceDownload}
              label="Allow source downloads"
              onChange={(value) => updateDraft("allowSourceDownload", value)}
            />
            <SettingsToggle
              checked={draft.allowAnswerExport}
              label="Allow answer export"
              onChange={(value) => updateDraft("allowAnswerExport", value)}
            />
            <SettingsToggle
              checked={draft.requireCitations}
              label="Require citations for answers"
              onChange={(value) => updateDraft("requireCitations", value)}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
            <p className="text-sm text-zinc-500">{status ?? "Policy draft"}</p>
            <Button type="button" disabled={isSaving} onClick={saveSettings}>
              <Save aria-hidden className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}

function SettingsToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50/50 px-3 py-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 accent-zinc-950"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
