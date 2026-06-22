import { FileText, Upload } from "lucide-react";
import type { IngestionStep, KnowledgeDocument } from "@rag-llm/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";

type DocumentLibraryProps = {
  documents: KnowledgeDocument[];
  ingestionSteps: IngestionStep[];
};

const statusTone = {
  queued: "neutral",
  parsing: "warning",
  indexing: "warning",
  ready: "success",
  failed: "danger"
} as const;

export function DocumentLibrary({
  documents,
  ingestionSteps
}: DocumentLibraryProps) {
  return (
    <SectionPanel
      title="Documents"
      description="Upload, parse, chunk, embed, and index tenant-owned knowledge sources."
      action={
        <Button type="button" variant="secondary">
          <Upload aria-hidden className="h-4 w-4" />
          Upload
        </Button>
      }
    >
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Pages</th>
              <th className="px-4 py-3 font-medium">Chunks</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText aria-hidden className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-950">{document.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[document.status]}>{document.status}</Badge>
                </td>
                <td className="px-4 py-3 text-zinc-600">{document.pageCount}</td>
                <td className="px-4 py-3 text-zinc-600">{document.chunkCount}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {ingestionSteps.map((step) => (
          <div key={step.label} className="rounded-lg border border-zinc-200 p-3">
            <Badge tone={step.status === "complete" ? "success" : "neutral"}>
              {step.status}
            </Badge>
            <p className="mt-3 text-sm font-medium text-zinc-950">{step.label}</p>
          </div>
        ))}
      </div>
    </SectionPanel>
  );
}
