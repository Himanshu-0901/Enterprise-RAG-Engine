export type SupportedDocumentFormat = "pdf" | "docx" | "txt" | "md" | "html";

export type ParsedBlockType = "heading" | "paragraph" | "table" | "unknown";

export type ParsedBlock = {
  pageNumber: number;
  sectionTitle?: string;
  text: string;
  type: ParsedBlockType;
};

export type ParsedDocument = {
  blocks: ParsedBlock[];
  pageCount: number;
  parser: "google-document-ai" | "local";
  warnings: string[];
};

export type ParseDocumentInput = {
  bytes: Uint8Array;
  contentType: string;
  documentName: string;
  format: SupportedDocumentFormat;
};

export type DocumentParser = {
  parse(input: ParseDocumentInput): Promise<ParsedDocument>;
};

export type ParsedTextChunk = {
  chunkIndex: number;
  content: string;
  pageNumber: number;
  sectionTitle?: string;
};
