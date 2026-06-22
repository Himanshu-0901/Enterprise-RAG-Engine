"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DocumentTableRow } from "@/features/documents/DocumentTableRow";
import { apiClient, type ApiDocument, type ApiSession } from "@/lib/api-client";

type DocumentActionsTableProps = {
  documents: ApiDocument[];
  onChanged: () => Promise<void>;
  session: ApiSession;
};

export function DocumentActionsTable({
  documents,
  onChanged,
  session
}: DocumentActionsTableProps) {
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApiDocument["status"] | "all">("all");
  const statusCounts = useMemo(() => countStatuses(documents), [documents]);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const matchesQuery = document.name
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        const matchesStatus = status === "all" || document.status === status;

        return matchesQuery && matchesStatus;
      }),
    [documents, query, status]
  );

  const runAction = async (
    documentId: string,
    action: () => Promise<ApiDocument>
  ) => {
    setBusyDocumentId(documentId);
    try {
      await action();
      await onChanged();
    } finally {
      setBusyDocumentId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-950">Source library</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {documents.length} documents · {filteredDocuments.length} shown
            </p>
          </div>
          <label className="relative min-w-0 xl:w-80">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400"
            />
            <span className="sr-only">Search documents</span>
            <input
              className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-500"
              placeholder="Search library..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <StatusFilter
            active={status === "all"}
            count={documents.length}
            label="All"
            onClick={() => setStatus("all")}
          />
          {documentStatuses.map((item) => (
            <StatusFilter
              active={status === item}
              count={statusCounts[item] ?? 0}
              key={item}
              label={item}
              onClick={() => setStatus(item)}
            />
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 font-mono text-[11px] uppercase tracking-normal text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Pages</th>
              <th className="px-4 py-3 font-medium">Chunks</th>
              <th className="px-4 py-3 font-medium">Last indexed</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {filteredDocuments.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-zinc-500" colSpan={7}>
                  No documents match the current filters.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((document) => (
                <DocumentTableRow
                  key={document.id}
                  busyDocumentId={busyDocumentId}
                  document={document}
                  onDelete={() =>
                    runAction(document.id, () =>
                      apiClient.deleteDocument(session, document.id)
                    )
                  }
                  onReindex={() =>
                    runAction(document.id, () =>
                      apiClient.reindexDocument(session, document.id)
                    )
                  }
                  onRestore={() =>
                    runAction(document.id, () =>
                      apiClient.restoreDocument(session, document.id)
                    )
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const documentStatuses: ApiDocument["status"][] = [
  "ready",
  "queued",
  "parsing",
  "indexing",
  "failed",
  "deleted"
];

function countStatuses(documents: ApiDocument[]) {
  return documents.reduce<Partial<Record<ApiDocument["status"], number>>>(
    (counts, document) => ({
      ...counts,
      [document.status]: (counts[document.status] ?? 0) + 1
    }),
    {}
  );
}

function StatusFilter({
  active,
  count,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={
        active
          ? "shrink-0 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white"
          : "shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      }
      type="button"
      onClick={onClick}
    >
      {label} <span className="font-mono opacity-70">{count}</span>
    </button>
  );
}
