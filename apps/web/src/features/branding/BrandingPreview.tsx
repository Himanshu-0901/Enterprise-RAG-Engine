import { ExternalLink, Palette } from "lucide-react";
import type { TenantBranding } from "@rag-llm/shared";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";

type BrandingPreviewProps = {
  branding: TenantBranding;
};

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  return (
    <SectionPanel
      title="White-label branding"
      description="Tenant-owned identity applied across login, portal, email, and chat."
      action={
        <Button type="button" variant="ghost">
          <ExternalLink aria-hidden className="h-4 w-4" />
          Preview
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-zinc-200 p-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-lg text-lg font-semibold text-white"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.logoInitials}
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-950">
            {branding.portalName}
          </h3>
          <p className="mt-2 text-sm text-zinc-500">{branding.welcomeMessage}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
            <Palette aria-hidden className="h-4 w-4 text-zinc-500" />
            Theme tokens
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ColorSwatch label="Primary" value={branding.primaryColor} />
            <ColorSwatch label="Accent" value={branding.accentColor} />
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}

type ColorSwatchProps = {
  label: string;
  value: string;
};

function ColorSwatch({ label, value }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
      <span
        aria-hidden
        className="h-9 w-9 rounded-md border border-black/10"
        style={{ backgroundColor: value }}
      />
      <div>
        <p className="text-sm font-medium text-zinc-950">{label}</p>
        <p className="font-mono text-xs text-zinc-500">{value}</p>
      </div>
    </div>
  );
}
