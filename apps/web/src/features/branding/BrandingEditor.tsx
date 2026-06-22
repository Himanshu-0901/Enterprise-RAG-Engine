"use client";

import { useEffect, useMemo, useState } from "react";
import { Palette, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { BrandColorField, BrandSwatch } from "@/features/branding/BrandColorField";
import {
  apiClient,
  type ApiSession,
  type ApiTenantBranding
} from "@/lib/api-client";

type BrandingEditorProps = {
  branding: ApiTenantBranding | null;
  onChanged: () => Promise<void>;
  session: ApiSession;
};

type BrandingDraft = {
  accentColor: string;
  portalName: string;
  primaryColor: string;
  welcomeMessage: string;
};

const fallbackDraft: BrandingDraft = {
  accentColor: "#3b82f6",
  portalName: "Tenant Assistant",
  primaryColor: "#0f172a",
  welcomeMessage: "Ask a question about your documents."
};

const toDraft = (branding: ApiTenantBranding | null): BrandingDraft => ({
  accentColor: branding?.accentColor ?? fallbackDraft.accentColor,
  portalName: branding?.portalName ?? fallbackDraft.portalName,
  primaryColor: branding?.primaryColor ?? fallbackDraft.primaryColor,
  welcomeMessage: branding?.welcomeMessage ?? fallbackDraft.welcomeMessage
});

const initialsFromName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "TA";

export function BrandingEditor({
  branding,
  onChanged,
  session
}: BrandingEditorProps) {
  const [draft, setDraft] = useState<BrandingDraft>(() => toDraft(branding));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const logoInitials = useMemo(
    () => initialsFromName(draft.portalName),
    [draft.portalName]
  );

  useEffect(() => {
    setDraft(toDraft(branding));
  }, [branding]);

  const updateDraft = (key: keyof BrandingDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetDraft = () => {
    setDraft(toDraft(branding));
    setStatus(null);
  };

  const saveBranding = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await apiClient.updateTenantBranding(session, draft);
      await onChanged();
      setStatus("Branding saved");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionPanel
      title="White-label branding"
      description="Control the tenant-owned identity used across the hosted portal and chat experience."
      action={
        <Button type="button" variant="secondary" onClick={resetDraft}>
          <RotateCcw aria-hidden className="h-4 w-4" />
          Reset
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <BrandingPreview draft={draft} logoInitials={logoInitials} />

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-950">Identity</h3>
            <p className="text-xs text-zinc-500">
              Controls the hosted portal header, email labels, and chat welcome.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Portal name"
              value={draft.portalName}
              onChange={(value) => updateDraft("portalName", value)}
            />
            <BrandColorField
              label="Primary color"
              value={draft.primaryColor}
              onChange={(value) => updateDraft("primaryColor", value)}
            />
            <BrandColorField
              label="Accent color"
              value={draft.accentColor}
              onChange={(value) => updateDraft("accentColor", value)}
            />
            <div className="sm:col-span-2">
              <label
                className="text-sm font-medium text-zinc-700"
                htmlFor="branding-welcome"
              >
                Welcome message
              </label>
              <textarea
                id="branding-welcome"
                className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                value={draft.welcomeMessage}
                onChange={(event) =>
                  updateDraft("welcomeMessage", event.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
            <p className="text-sm text-zinc-500">{status ?? "Unsaved form state"}</p>
            <Button type="button" disabled={isSaving} onClick={saveBranding}>
              <Save aria-hidden className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save branding"}
            </Button>
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}

function BrandingPreview({
  draft,
  logoInitials
}: {
  draft: BrandingDraft;
  logoInitials: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-[#f4f4f2] shadow-sm">
      <div
        className="h-2"
        style={{ backgroundColor: draft.primaryColor }}
        aria-hidden
      />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-white"
            style={{ backgroundColor: draft.primaryColor }}
          >
            {logoInitials}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-zinc-950">
              {draft.portalName}
            </h3>
            <p className="mt-1 text-sm leading-5 text-zinc-600">
              {draft.welcomeMessage}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
            <Palette aria-hidden className="h-4 w-4 text-zinc-500" />
            Theme tokens
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BrandSwatch label="Primary" value={draft.primaryColor} />
            <BrandSwatch label="Accent" value={draft.accentColor} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = `branding-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <label className="text-sm font-medium text-zinc-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="mt-2 h-9 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
