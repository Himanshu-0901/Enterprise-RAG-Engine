"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import type {
  ChatMessage,
  KnowledgeDocument,
  Tenant,
  TenantBranding
} from "@rag-llm/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";

const buildPreviewAnswer = (
  question: string,
  documents: KnowledgeDocument[]
): ChatMessage => {
  const readyDocument = documents.find((document) => document.status === "ready");

  if (!readyDocument) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "I do not have enough indexed source material for this tenant yet. Upload and index documents before asking production questions.",
      createdAt: new Date().toISOString(),
      citations: []
    };
  }

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: `The API will answer "${question}" from indexed tenant chunks and attach citations to the source passages.`,
    createdAt: new Date().toISOString(),
    citations: [
      {
        id: `citation-${readyDocument.id}`,
        chunkId: `${readyDocument.id}-preview-chunk`,
        documentId: readyDocument.id,
        documentName: readyDocument.name,
        pageNumber: 1,
        snippet: "Preview citation for the admin UI shell."
      }
    ]
  };
};

type ChatWorkspaceProps = {
  tenant: Tenant;
  branding: TenantBranding;
  documents: KnowledgeDocument[];
  initialMessages: ChatMessage[];
};

export function ChatWorkspace({
  branding,
  documents,
  initialMessages
}: ChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");

  const readyDocumentCount = useMemo(
    () => documents.filter((document) => document.status === "ready").length,
    [documents]
  );

  const askQuestion = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
      citations: []
    };

    const answer = buildPreviewAnswer(trimmedQuestion, documents);

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      answer
    ]);
    setQuestion("");
  };

  return (
    <SectionPanel
      title="End-user chat"
      description="A tenant-branded assistant with grounded answers and source citations."
      action={<Badge tone="success">{readyDocumentCount} indexed sources</Badge>}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50">
          <header className="flex items-center gap-3 border-b border-zinc-200 bg-white p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {branding.logoInitials}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                {branding.portalName}
              </h3>
              <p className="text-xs text-zinc-500">Tenant-scoped knowledge only</p>
            </div>
          </header>

          <div className="flex h-[430px] flex-col gap-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>

          <div className="border-t border-zinc-200 bg-white p-4">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="chat-question">
                Ask a question
              </label>
              <input
                id="chat-question"
                className="h-10 min-w-0 flex-1 rounded-md border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="Ask about onboarding, support, or policies..."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    askQuestion();
                  }
                }}
              />
              <Button type="button" onClick={askQuestion}>
                <Send aria-hidden className="h-4 w-4" />
                Ask
              </Button>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-950">MVP behavior</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600">
            <li>Retrieval is scoped by tenant ID.</li>
            <li>Answers refuse when no source material is indexed.</li>
            <li>Citations include document, page, and chunk IDs.</li>
            <li>The next phase replaces the mock answer with a real API call.</li>
          </ul>
        </aside>
      </div>
    </SectionPanel>
  );
}

type ChatBubbleProps = {
  message: ChatMessage;
};

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article className={isUser ? "ml-auto max-w-[82%]" : "mr-auto max-w-[88%]"}>
      <div
        className={
          isUser
            ? "rounded-lg bg-zinc-950 px-4 py-3 text-sm text-white"
            : "rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm"
        }
      >
        {!isUser ? (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <MessageSquare aria-hidden className="h-3.5 w-3.5" />
            Assistant
          </div>
        ) : null}
        <p>{message.content}</p>
      </div>

      {message.citations.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.citations.map((citation) => (
            <Badge key={citation.id} tone="info">
              {citation.documentName}, p. {citation.pageNumber}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}
