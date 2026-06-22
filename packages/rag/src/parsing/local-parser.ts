import mammoth from "mammoth";
import type {
  DocumentParser,
  ParsedBlock,
  ParsedDocument,
  ParseDocumentInput
} from "./types";

const textDecoder = new TextDecoder("utf-8", { fatal: false });

const binaryFormats = new Set(["pdf"]);

const bytesToArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

const isMostlyReadableText = (value: string): boolean => {
  if (!value.trim()) {
    return false;
  }

  const inspected = value.slice(0, 4_000);
  const printable = [...inspected].filter((character) => {
    const code = character.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
  }).length;

  return printable / inspected.length > 0.85;
};

const stripHtml = (value: string): string =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(p|div|section|article|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const textToDocument = (
  text: string,
  parser: ParsedDocument["parser"],
  warnings: string[]
): ParsedDocument => {
  const pages = text.split(/\f|\n-{3,}\s*page\s+\d+\s*-{3,}\n/i);
  const blocks: ParsedBlock[] = pages.flatMap((pageText, pageIndex) =>
    pageText
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => ({
        pageNumber: pageIndex + 1,
        text: block,
        type: block.length < 120 && !/[.!?]$/.test(block) ? "heading" : "paragraph"
      }))
  );

  return {
    blocks,
    pageCount: Math.max(pages.length, 1),
    parser,
    warnings
  };
};

export class LocalDocumentParser implements DocumentParser {
  async parse(input: ParseDocumentInput): Promise<ParsedDocument> {
    if (input.format === "docx") {
      const result = await mammoth.extractRawText({
        arrayBuffer: bytesToArrayBuffer(input.bytes)
      });

      return textToDocument(
        result.value,
        "local",
        result.messages.map((message) => message.message)
      );
    }

    const decoded = textDecoder.decode(input.bytes);

    if (binaryFormats.has(input.format) && !isMostlyReadableText(decoded)) {
      throw new Error(
        "Google Document AI Layout Parser is required for binary PDF parsing"
      );
    }

    const text = input.format === "html" ? stripHtml(decoded) : decoded;

    if (!text.trim()) {
      throw new Error("Parsed document did not contain readable text");
    }

    return textToDocument(text, "local", []);
  }
}
