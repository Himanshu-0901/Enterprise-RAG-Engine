"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ApiSession } from "@/lib/api-client";
import { getViewerCitationSource, type ApiCitationSource } from "@/lib/source-client";

const authStorageKey = "rag-llm-auth-session";

export function DocumentViewer() {
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [source, setSource] = useState<ApiCitationSource | null>(null);
  const citationId = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("citationId") ?? "",
    []
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(authStorageKey);
    setSession(stored ? (JSON.parse(stored) as ApiSession) : null);
  }, []);

  useEffect(() => {
    if (!session || !citationId) {
      return;
    }

    getViewerCitationSource(session, citationId)
      .then((nextSource) => {
        setSource(nextSource);
        setError(null);
      })
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error ? caughtError.message : "Source load failed"
        );
      });
  }, [citationId, session]);

  return (
    <main className="min-h-screen bg-[#fbfbfa] p-4 text-zinc-950 sm:p-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-zinc-950 text-white">
              <FileText aria-hidden className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-zinc-950">
                {source?.fileName ?? "Source viewer"}
              </h1>
              <p className="font-mono text-xs text-zinc-500">
                Citation deep link {citationId || "missing"}
              </p>
            </div>
          </div>
          <Badge tone={source?.canOpenSource ? "success" : "warning"}>
            {source?.canOpenSource ? "Source available" : "Preview only"}
          </Badge>
        </div>

        <div className="p-5">
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {!session ? (
            <p className="text-sm text-zinc-500">
              Sign in before opening source viewer links.
            </p>
          ) : null}
          {source ? <ViewerBody source={source} /> : null}
        </div>
      </section>
    </main>
  );
}

function ViewerBody({ source }: { source: ApiCitationSource }) {
  if (!source.canOpenSource) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex items-center gap-2 font-medium">
          <Lock aria-hidden className="h-4 w-4" />
          Source download is disabled by tenant policy
        </div>
        <p className="mt-3 leading-6">{source.citation.snippet}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">Page {source.citation.pageNumber ?? 1}</Badge>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500">
            <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            {source.fileName}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          {source.citation.snippet}
        </p>
      </div>
      <pre className="max-h-[70vh] overflow-auto rounded-lg border border-zinc-200 bg-white p-5 font-mono text-sm leading-6 text-zinc-800 shadow-sm">
        {highlightSnippet(source.content ?? "", source.citation.snippet)}
      </pre>
    </div>
  );
}

const highlightSnippet = (content: string, snippet: string) => {
  const index = content.toLowerCase().indexOf(snippet.toLowerCase());

  if (index < 0) {
    return content;
  }

  return `${content.slice(0, index)}\n\n>>> ${content.slice(
    index,
    index + snippet.length
  )} <<<\n\n${content.slice(index + snippet.length)}`;
};
