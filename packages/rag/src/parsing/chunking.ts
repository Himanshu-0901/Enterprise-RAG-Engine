import type { ParsedBlock, ParsedDocument, ParsedTextChunk } from "./types";

const DEFAULT_MAX_CHARACTERS = 1_600;

const normalizeText = (value: string): string =>
  value
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const blockText = (block: ParsedBlock): string => {
  const text = normalizeText(block.text);

  if (!text) {
    return "";
  }

  if (block.type === "heading") {
    return text;
  }

  if (block.type === "table") {
    return `Table:\n${text}`;
  }

  return text;
};

export const chunkParsedDocument = (
  document: ParsedDocument,
  maxCharacters = DEFAULT_MAX_CHARACTERS
): ParsedTextChunk[] => {
  const chunks: ParsedTextChunk[] = [];
  let currentContent = "";
  let currentPageNumber = 1;
  let currentSectionTitle: string | undefined;
  let activeSectionTitle: string | undefined;

  const flush = () => {
    const content = normalizeText(currentContent);

    if (!content) {
      currentContent = "";
      return;
    }

    chunks.push({
      chunkIndex: chunks.length,
      content,
      pageNumber: currentPageNumber,
      sectionTitle: currentSectionTitle
    });
    currentContent = "";
  };

  for (const block of document.blocks) {
    const text = blockText(block);

    if (!text) {
      continue;
    }

    if (block.type === "heading") {
      activeSectionTitle = text.slice(0, 240);
    }

    const nextSectionTitle = block.sectionTitle ?? activeSectionTitle;
    const shouldStartNewPage =
      currentContent.length > 0 && block.pageNumber !== currentPageNumber;
    const candidate = currentContent ? `${currentContent}\n\n${text}` : text;

    if (shouldStartNewPage || candidate.length > maxCharacters) {
      flush();
      currentPageNumber = block.pageNumber;
      currentSectionTitle = nextSectionTitle;
      currentContent = text;
      continue;
    }

    currentPageNumber = block.pageNumber;
    currentSectionTitle = currentSectionTitle ?? nextSectionTitle;
    currentContent = candidate;
  }

  flush();
  return chunks;
};
