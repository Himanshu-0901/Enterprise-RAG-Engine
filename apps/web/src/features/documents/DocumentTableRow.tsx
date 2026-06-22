import { MoreHorizontal, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ApiDocument } from "@/lib/api-client";

type DocumentTableRowProps = {
  busyDocumentId: string | null;
  document: ApiDocument;
  onDelete: () => void;
  onReindex: () => void;
  onRestore: () => void;
};

const activeStatuses = new Set<ApiDocument["status"]>([
  "indexing",
  "parsing",
  "queued"
]);

const statusTone = {
  deleted: "bg-zinc-100 text-zinc-500",
  failed: "bg-rose-50 text-rose-700",
  indexing: "bg-amber-50 text-amber-700",
  parsing: "bg-amber-50 text-amber-700",
  queued: "bg-zinc-100 text-zinc-600",
  ready: "bg-emerald-50 text-emerald-700"
} as const;

export function DocumentTableRow({
  busyDocumentId,
  document,
  onDelete,
  onReindex,
  onRestore
}: DocumentTableRowProps) {
  const isBusy = busyDocumentId === document.id;
  const isActive = activeStatuses.has(document.status);
  const isDeleted = document.status === "deleted";

  return (
    <tr className="transition hover:bg-zinc-50">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-zinc-200 bg-zinc-50 font-mono text-[10px] uppercase text-zinc-500">
            {document.format}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-950">{document.name}</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-400">
              {document.storageKey}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusPill status={document.status} />
        {document.failureReason ? (
          <p className="mt-1 max-w-40 truncate text-xs text-rose-600">
            {document.failureReason}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3 font-mono text-zinc-600">{document.pageCount}</td>
      <td className="px-4 py-3 font-mono text-zinc-600">{document.chunkCount}</td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
        {formatDate(document.lastIndexedAt)}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
        {formatDate(document.uploadedAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {isDeleted ? (
            <Button
              className="h-8 px-3 text-xs"
              type="button"
              variant="secondary"
              disabled={isBusy}
              onClick={onRestore}
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Restore
            </Button>
          ) : (
            <DocumentActions
              documentName={document.name}
              isActive={isActive}
              isBusy={isBusy}
              onDelete={onDelete}
              onReindex={onReindex}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

function DocumentActions({
  documentName,
  isActive,
  isBusy,
  onDelete,
  onReindex
}: {
  documentName: string;
  isActive: boolean;
  isBusy: boolean;
  onDelete: () => void;
  onReindex: () => void;
}) {
  return (
    <>
      <Button
        className="h-8 px-3 text-xs"
        type="button"
        variant="secondary"
        disabled={isBusy || isActive}
        onClick={onReindex}
      >
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        Re-index
      </Button>
      <Button
        aria-label={`Delete ${documentName}`}
        className="h-8 w-8 px-0"
        type="button"
        variant="ghost"
        disabled={isBusy || isActive}
        onClick={onDelete}
      >
        <Trash2 aria-hidden className="h-3.5 w-3.5" />
      </Button>
      <button
        aria-label={`More actions for ${documentName}`}
        className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
        type="button"
      >
        <MoreHorizontal aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}

function StatusPill({ status }: { status: ApiDocument["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${statusTone[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Never";
}
