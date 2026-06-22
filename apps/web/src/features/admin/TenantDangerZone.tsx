"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { apiClient, type ApiSession } from "@/lib/api-client";

type TenantDangerZoneProps = {
  onDeleted?: () => void;
  session: ApiSession;
};

export function TenantDangerZone({ onDeleted, session }: TenantDangerZoneProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const deleteTenant = async () => {
    setIsDeleting(true);
    setStatus(null);
    try {
      const result = await apiClient.deleteTenant(session, confirmation);
      window.localStorage.removeItem("rag-llm-auth-session");
      setStatus(
        `Deleted tenant ${result.tenantId}; removed ${result.deletedObjects} stored objects.`
      );
      onDeleted?.();
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Tenant deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SectionPanel
      title="Danger zone"
      description="Permanently delete this tenant, database rows, sessions, and tenant-prefixed stored files."
    >
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <label className="text-sm font-medium text-rose-950" htmlFor="delete-tenant">
          Type the tenant slug to confirm deletion
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className="h-10 flex-1 rounded-md border border-rose-200 bg-white px-3 text-sm outline-none focus:border-rose-400"
            id="delete-tenant"
            placeholder="tenant-slug"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <Button
            className="bg-rose-700 hover:bg-rose-800"
            disabled={isDeleting || confirmation.length < 2}
            type="button"
            onClick={() => void deleteTenant()}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete tenant"}
          </Button>
        </div>
        {status ? <p className="mt-3 text-sm text-rose-800">{status}</p> : null}
      </div>
    </SectionPanel>
  );
}
