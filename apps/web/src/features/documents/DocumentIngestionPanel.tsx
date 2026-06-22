"use client";

import { useState } from "react";
import { FileUp, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DocumentActionsTable } from "@/features/documents/DocumentActionsTable";
import { apiClient, type ApiDocument, type ApiSession } from "@/lib/api-client";

type DocumentIngestionPanelProps = {
  documents: ApiDocument[];
  onChanged: () => Promise<void>;
  session: ApiSession;
};

export function DocumentIngestionPanel({
  documents,
  onChanged,
  session
}: DocumentIngestionPanelProps) {
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"md" | "txt">("md");
  const [name, setName] = useState("Product Notes.md");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.createDocument(session, { content, format, name });
      setContent("");
      await onChanged();
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    try {
      await apiClient.uploadSourceFile(session, selectedFile);
      setSelectedFile(null);
      await onChanged();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Documents
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload, parse, index, and maintain tenant-owned knowledge sources.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onChanged}>
          <RefreshCw aria-hidden className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="grid gap-4 content-start">
          <UploadFileCard
            isUploading={isUploading}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            uploadFile={uploadFile}
          />
          <PasteDocumentCard
            content={content}
            format={format}
            isSubmitting={isSubmitting}
            name={name}
            setContent={setContent}
            setFormat={setFormat}
            setName={setName}
            uploadDocument={uploadDocument}
          />
        </div>
        <DocumentActionsTable
          documents={documents}
          onChanged={onChanged}
          session={session}
        />
      </div>
    </div>
  );
}

function UploadFileCard({
  isUploading,
  selectedFile,
  setSelectedFile,
  uploadFile
}: {
  isUploading: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  uploadFile: () => Promise<void>;
}) {
  return (
    <form
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void uploadFile();
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-zinc-950 text-white">
          <FileUp aria-hidden className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Upload source file</h2>
          <p className="text-xs text-zinc-500">PDF, DOCX, HTML, Markdown, and text.</p>
        </div>
      </div>
      <label className="block cursor-pointer rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center transition hover:border-zinc-500 hover:bg-zinc-100">
        <input
          accept=".pdf,.docx,.html,.htm,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/html,text/markdown,text/plain"
          className="sr-only"
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.item(0) ?? null)}
        />
        <span className="text-sm font-medium text-zinc-950">
          {selectedFile?.name ?? "Choose a file"}
        </span>
        <span className="mt-1 block text-xs text-zinc-500">Queued for tenant-scoped indexing</span>
      </label>
      <Button className="mt-4 w-full" type="submit" disabled={isUploading || !selectedFile}>
        <Upload aria-hidden className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload file"}
      </Button>
    </form>
  );
}

function PasteDocumentCard({
  content,
  format,
  isSubmitting,
  name,
  setContent,
  setFormat,
  setName,
  uploadDocument
}: {
  content: string;
  format: "md" | "txt";
  isSubmitting: boolean;
  name: string;
  setContent: (value: string) => void;
  setFormat: (value: "md" | "txt") => void;
  setName: (value: string) => void;
  uploadDocument: () => Promise<void>;
}) {
  return (
    <form
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void uploadDocument();
      }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-950">Paste and index</h2>
        <p className="text-xs text-zinc-500">Useful for notes, FAQs, and runbooks.</p>
      </div>
      <div className="grid gap-3">
        <input
          className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select
          className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
          value={format}
          onChange={(event) => setFormat(event.target.value as "md" | "txt")}
        >
          <option value="md">Markdown</option>
          <option value="txt">Text</option>
        </select>
        <textarea
          className="min-h-36 resize-y rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          placeholder="Paste document content..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          <Upload aria-hidden className="h-4 w-4" />
          {isSubmitting ? "Indexing..." : "Index content"}
        </Button>
      </div>
    </form>
  );
}
