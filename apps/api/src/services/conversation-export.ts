import type {
  ConversationRecord,
  MessageRecord,
  TenantCitation
} from "@rag-llm/db";

type ConversationMessage = MessageRecord & {
  citations: TenantCitation[];
};

export type ConversationExport = {
  content: string;
  contentType: "text/markdown";
  fileName: string;
};

const formatDate = (date: Date): string => date.toISOString();

const formatCitations = (citations: TenantCitation[]): string[] =>
  citations.map((citation, index) => {
    const page = citation.pageNumber ? `, page ${citation.pageNumber}` : "";
    return `${index + 1}. ${citation.documentName}${page}: ${citation.snippet}`;
  });

const createFileName = (title: string): string => {
  const slug = title
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${slug || "conversation"}.md`;
};

export const createConversationExport = (
  conversation: ConversationRecord,
  messages: ConversationMessage[]
): ConversationExport => {
  const lines = [
    `# ${conversation.title}`,
    "",
    `Exported conversation: ${conversation.id}`,
    `Created: ${formatDate(conversation.createdAt)}`,
    `Updated: ${formatDate(conversation.updatedAt)}`,
    ""
  ];

  for (const message of messages) {
    lines.push(`## ${message.role === "user" ? "User" : "Assistant"}`, "");
    lines.push(message.content, "");

    if (message.citations.length > 0) {
      lines.push("### Sources", "", ...formatCitations(message.citations), "");
    }
  }

  return {
    content: lines.join("\n"),
    contentType: "text/markdown",
    fileName: createFileName(conversation.title)
  };
};
