import { GoogleAuth } from "google-auth-library";
import type { DocumentParser, ParsedBlock, ParsedDocument, ParseDocumentInput } from "./types";

type GoogleDocumentAiConfig = {
  location: string;
  processorId: string;
  projectId: string;
};

type TextSegment = {
  endIndex?: string | number;
  startIndex?: string | number;
};

type TextAnchor = {
  textSegments?: TextSegment[];
};

type Layout = {
  textAnchor?: TextAnchor;
};

type LayoutElement = {
  layout?: Layout;
};

type GooglePage = {
  blocks?: LayoutElement[];
  pageNumber?: number;
  paragraphs?: LayoutElement[];
  tables?: LayoutElement[];
};

type GoogleChunk = {
  content?: string;
  pageSpan?: {
    pageEnd?: number | string;
    pageStart?: number | string;
  };
};

type GoogleDocument = {
  chunkedDocument?: {
    chunks?: GoogleChunk[];
  };
  pages?: GooglePage[];
  text?: string;
};

type GoogleProcessResponse = {
  document?: GoogleDocument;
};

const base64Encode = (bytes: Uint8Array): string => {
  let binary = "";
  const chunkSize = 32_768;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

const segmentText = (sourceText: string, anchor?: TextAnchor): string => {
  const segments = anchor?.textSegments ?? [];

  return segments
    .map((segment) => {
      const start = Number(segment.startIndex ?? 0);
      const end = Number(segment.endIndex ?? start);
      return sourceText.slice(start, end);
    })
    .join("")
    .trim();
};

const parsePageNumber = (value: number | string | undefined, fallback: number): number => {
  const pageNumber = Number(value ?? fallback);
  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : fallback;
};

const chunkBlocks = (document: GoogleDocument): ParsedBlock[] => {
  const chunks = document.chunkedDocument?.chunks ?? [];

  return chunks
    .map((chunk, index) => ({
      pageNumber: parsePageNumber(chunk.pageSpan?.pageStart, index + 1),
      text: chunk.content?.trim() ?? "",
      type: "paragraph" as const
    }))
    .filter((block) => block.text.length > 0);
};

const pageBlocks = (document: GoogleDocument): ParsedBlock[] => {
  const sourceText = document.text ?? "";
  const pages = document.pages ?? [];

  return pages.flatMap((page, pageIndex) => {
    const pageNumber = page.pageNumber ?? pageIndex + 1;
    const elements = page.paragraphs?.length
      ? page.paragraphs
      : [...(page.blocks ?? []), ...(page.tables ?? [])];

    return elements
      .map((element) => segmentText(sourceText, element.layout?.textAnchor))
      .filter(Boolean)
      .map((text) => ({
        pageNumber,
        text,
        type: text.length < 120 && !/[.!?]$/.test(text) ? "heading" : "paragraph"
      }));
  });
};

export class GoogleDocumentAiLayoutParser implements DocumentParser {
  private readonly auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });

  constructor(private readonly config: GoogleDocumentAiConfig) {}

  async parse(input: ParseDocumentInput): Promise<ParsedDocument> {
    const client = await this.auth.getClient();
    const url =
      `https://${this.config.location}-documentai.googleapis.com/v1/` +
      `projects/${this.config.projectId}/locations/${this.config.location}/` +
      `processors/${this.config.processorId}:process`;

    const response = await client.request<GoogleProcessResponse>({
      data: {
        rawDocument: {
          content: base64Encode(input.bytes),
          mimeType: input.contentType
        }
      },
      method: "POST",
      url
    });

    const document = response.data.document;

    if (!document) {
      throw new Error("Google Document AI response did not include a document");
    }

    const blocks = chunkBlocks(document);
    const fallbackBlocks = blocks.length > 0 ? blocks : pageBlocks(document);

    if (fallbackBlocks.length === 0) {
      throw new Error("Google Document AI did not return readable layout text");
    }

    return {
      blocks: fallbackBlocks,
      pageCount: Math.max(document.pages?.length ?? 0, 1),
      parser: "google-document-ai",
      warnings: []
    };
  }
}

export type { GoogleDocumentAiConfig };
