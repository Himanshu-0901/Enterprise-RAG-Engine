"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import type { ApiSession } from "@/lib/api-client";

type DevSessionPanelProps = {
  onSessionChange: (session: ApiSession) => void;
  session: ApiSession;
};

export function DevSessionPanel({
  onSessionChange,
  session
}: DevSessionPanelProps) {
  return (
    <SectionPanel
      title="Development auth"
      description="Local fallback for seeded demo data. Real sessions use bearer tokens."
    >
      <form
        className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSessionChange({
            tenantId: String(formData.get("tenantId")),
            userId: String(formData.get("userId"))
          });
        }}
      >
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Tenant ID
          <input
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            defaultValue={session.tenantId}
            name="tenantId"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          User ID
          <input
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            defaultValue={session.userId}
            name="userId"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit">
            <Save aria-hidden className="h-4 w-4" />
            Save
          </Button>
        </div>
      </form>
    </SectionPanel>
  );
}
