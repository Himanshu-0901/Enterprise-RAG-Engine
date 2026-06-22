import { GoogleDocumentAiLayoutParser } from "./google-document-ai-parser";
import { LocalDocumentParser } from "./local-parser";
import type {
  DocumentParser,
  ParsedDocument,
  ParseDocumentInput,
  SupportedDocumentFormat
} from "./types";

type DocumentParserMode = "google_document_ai" | "local";

export type DocumentParserConfig = {
  googleDocumentAi?: {
    location?: string;
    processorId?: string;
    projectId?: string;
  };
  mode: DocumentParserMode;
};

const googlePreferredFormats = new Set<SupportedDocumentFormat>([
  "pdf",
  "html"
]);

const isGoogleConfigured = (
  config: DocumentParserConfig["googleDocumentAi"]
): config is { location: string; processorId: string; projectId: string } =>
  Boolean(config?.location && config.processorId && config.projectId);

export class CompositeDocumentParser implements DocumentParser {
  private readonly googleParser?: GoogleDocumentAiLayoutParser;
  private readonly localParser = new LocalDocumentParser();

  constructor(config: DocumentParserConfig) {
    if (config.mode === "google_document_ai" && isGoogleConfigured(config.googleDocumentAi)) {
      this.googleParser = new GoogleDocumentAiLayoutParser(config.googleDocumentAi);
    }
  }

  async parse(input: ParseDocumentInput): Promise<ParsedDocument> {
    if (this.googleParser && googlePreferredFormats.has(input.format)) {
      return this.googleParser.parse(input);
    }

    return this.localParser.parse(input);
  }
}

export const createDocumentParser = (
  config: DocumentParserConfig
): DocumentParser => new CompositeDocumentParser(config);
