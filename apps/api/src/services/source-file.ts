import { badRequest } from "../lib/api-error";

type SourceFormat = "docx" | "html" | "md" | "pdf" | "txt";

type SourceFile = {
  content: string;
  contentType: string;
  format: SourceFormat;
  name: string;
  bytes: Uint8Array;
};

const allowedFormats: Record<string, SourceFormat> = {
  ".docx": "docx",
  ".html": "html",
  ".htm": "html",
  ".md": "md",
  ".pdf": "pdf",
  ".txt": "txt"
};

const contentTypes: Record<SourceFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  html: "text/html",
  md: "text/markdown",
  pdf: "application/pdf",
  txt: "text/plain"
};

const getFileExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
};

export const sanitizeFileName = (fileName: string): string =>
  fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

export const readSourceFile = async (file: File): Promise<SourceFile> => {
  const name = sanitizeFileName(file.name);
  const extension = getFileExtension(name);
  const format = allowedFormats[extension];

  if (!format) {
    throw badRequest("Only PDF, DOCX, HTML, Markdown, and text uploads are supported");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (bytes.length === 0) {
    throw badRequest("Uploaded file is empty");
  }

  return {
    bytes,
    content: format === "pdf" || format === "docx" ? "" : new TextDecoder().decode(bytes),
    contentType: file.type || contentTypes[format],
    format,
    name
  };
};
