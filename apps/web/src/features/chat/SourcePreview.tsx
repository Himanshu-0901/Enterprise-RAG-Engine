import { ExternalLink, FileText, Lock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ApiCitation } from "@/lib/api-client";

type SourcePreviewProps = {
  allowSourceDownload: boolean;
  citation: ApiCitation | null;
  content: string | null;
  error: string | null;
  isLoading: boolean;
};

export function SourcePreview({
  allowSourceDownload,
  citation,
  content,
  error,
  isLoading
}: SourcePreviewProps) {
  return (
    <aside className="border-t border-zinc-200 bg-white p-4 lg:border-l lg:border-t-0">
      <div className="flex items-center gap-2">
        <FileText aria-hidden className="h-4 w-4 text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-950">Source preview</h3>
      </div>
      {citation ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-zinc-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">Page {citation.pageNumber ?? 1}</Badge>
              <p className="truncate text-sm font-medium text-zinc-950">
                {citation.documentName}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {citation.snippet}
            </p>
            <a
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-950"
              href={`/viewer?citationId=${encodeURIComponent(citation.id)}`}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden className="h-4 w-4" />
              Open viewer
            </a>
          </div>

          <SourceContent
            allowSourceDownload={allowSourceDownload}
            content={content}
            error={error}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          Click a citation chip to record source engagement and inspect the cited
          passage.
        </p>
      )}
    </aside>
  );
}

type SourceContentProps = {
  allowSourceDownload: boolean;
  content: string | null;
  error: string | null;
  isLoading: boolean;
};

function SourceContent({
  allowSourceDownload,
  content,
  error,
  isLoading
}: SourceContentProps) {
  if (!allowSourceDownload) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex items-center gap-2 font-medium">
          <Lock aria-hidden className="h-4 w-4" />
          Source downloads disabled
        </div>
        <p className="mt-2 leading-6">
          Tenant policy allows citation previews but blocks opening the underlying
          source file.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        Loading source content...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (content) {
    return (
      <div className="rounded-lg border border-zinc-200">
        <p className="px-4 pt-4 font-mono text-[11px] uppercase tracking-normal text-zinc-500">
          Source file text
        </p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-4 text-xs leading-5 text-zinc-700">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500">
      Source content will appear here when the cited file can be loaded.
    </div>
  );
}
