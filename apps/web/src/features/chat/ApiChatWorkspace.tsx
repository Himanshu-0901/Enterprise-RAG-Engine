"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { ChatBubble, type ChatEntry } from "@/features/chat/ChatBubble";
import { ChatHeader } from "@/features/chat/ChatHeader";
import { ConversationList } from "@/features/chat/ConversationList";
import { SourcePreview } from "@/features/chat/SourcePreview";
import {
  apiClient,
  type ApiCitation,
  type ApiConversation,
  type ApiSession
} from "@/lib/api-client";
import { exportConversation } from "@/lib/conversation-export-client";
import { getCitationSource } from "@/lib/source-client";

type ApiChatWorkspaceProps = {
  allowAnswerExport: boolean;
  allowSourceDownload: boolean;
  onAnswered: () => Promise<void>;
  session: ApiSession;
};

export function ApiChatWorkspace({
  allowAnswerExport,
  allowSourceDownload,
  onAnswered,
  session
}: ApiChatWorkspaceProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<ApiCitation | null>(null);
  const [sourceContent, setSourceContent] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ) ?? null,
    [activeConversationId, conversations]
  );

  const loadConversations = useCallback(async () => {
    const nextConversations = await apiClient.listConversations(session);
    setConversations(nextConversations);
  }, [session]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      setIsLoadingHistory(true);
      setEditingTitle(false);
      try {
        const detail = await apiClient.getConversation(session, conversationId);
        setActiveConversationId(detail.conversation.id);
        setDraftTitle(detail.conversation.title);
        setExportError(null);
        setSelectedCitation(null);
        setSourceContent(null);
        setSourceError(null);
        setMessages(detail.messages as ChatEntry[]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [session]
  );

  useEffect(() => {
    setActiveConversationId(null);
    setMessages([]);
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!allowSourceDownload) {
      setSourceContent(null);
      setSourceError(null);
      setIsLoadingSource(false);
    }
  }, [allowSourceDownload]);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setDraftTitle("");
    setEditingTitle(false);
    setExportError(null);
    setMessages([]);
    setSelectedCitation(null);
    setSourceContent(null);
    setSourceError(null);
  };

  const askQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    setIsAsking(true);
    setQuestion("");
    setMessages((current) => [
      ...current,
      { content: trimmed, id: `user-${Date.now()}`, role: "user" }
    ]);

    try {
      const response = await apiClient.askQuestion(
        session,
        trimmed,
        activeConversationId ?? undefined
      );
      setActiveConversationId(response.conversationId);
      setMessages((current) => [...current, response.message]);
      await Promise.all([loadConversations(), onAnswered()]);
    } finally {
      setIsAsking(false);
    }
  };

  const renameActiveConversation = async () => {
    const trimmed = draftTitle.trim();
    if (!activeConversationId || !trimmed) {
      return;
    }

    await apiClient.renameConversation(session, activeConversationId, trimmed);
    setEditingTitle(false);
    await loadConversations();
  };

  const exportActiveConversation = async () => {
    if (!activeConversationId || !allowAnswerExport) {
      return;
    }

    setExportError(null);

    try {
      const exported = await exportConversation(session, activeConversationId);
      const url = URL.createObjectURL(
        new Blob([exported.content], { type: exported.contentType })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = exported.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setExportError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to export conversation"
      );
    }
  };

  const deleteActiveConversation = async () => {
    if (!activeConversationId) {
      return;
    }

    await apiClient.deleteConversation(session, activeConversationId);
    startNewConversation();
    await loadConversations();
  };

  const selectCitation = async (citation: ApiCitation) => {
    setSelectedCitation(citation);
    setSourceContent(null);
    setSourceError(null);
    setIsLoadingSource(allowSourceDownload);

    try {
      await apiClient.recordCitationClick(session, citation.id);

      if (allowSourceDownload) {
        const source = await getCitationSource(session, citation.id);
        setSourceContent(source.content);
      }

      await onAnswered();
    } catch (caughtError) {
      setSourceError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load source content"
      );
    } finally {
      setIsLoadingSource(false);
    }
  };

  return (
    <SectionPanel
      title="End-user chat"
      description="Ask questions against the indexed tenant corpus and inspect returned citations."
    >
      <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <ConversationList
          activeConversationId={activeConversationId}
          conversations={conversations}
          onNew={startNewConversation}
          onOpen={(conversationId) => void openConversation(conversationId)}
        />
        <section className="flex min-w-0 flex-col">
          <ChatHeader
            activeTitle={activeConversation?.title ?? "New conversation"}
            allowAnswerExport={allowAnswerExport}
            draftTitle={draftTitle}
            editingTitle={editingTitle}
            hasConversation={Boolean(activeConversationId)}
            onCancel={() => {
              setDraftTitle(activeConversation?.title ?? "");
              setEditingTitle(false);
            }}
            onDelete={() => void deleteActiveConversation()}
            onDraftTitleChange={setDraftTitle}
            onEdit={() => setEditingTitle(true)}
            onExport={() => void exportActiveConversation()}
            onRename={() => void renameActiveConversation()}
          />
          <div className="flex h-[480px] flex-col gap-3 overflow-y-auto bg-[#fbfbfa] p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                {isLoadingHistory
                  ? "Loading conversation..."
                  : "Ask a question after indexing a document."}
              </div>
            ) : (
              messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onCitationClick={(citation) => void selectCitation(citation)}
                  session={session}
                />
              ))
            )}
          </div>
          <div className="border-t border-zinc-200 bg-white p-4">
            {exportError ? (
              <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {exportError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="api-chat-question">
                Ask a question
              </label>
              <input
                id="api-chat-question"
                className="h-10 min-w-0 flex-1 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
                placeholder="Ask what the uploaded documents say..."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void askQuestion();
                  }
                }}
              />
              <Button type="button" disabled={isAsking} onClick={askQuestion}>
                <Send aria-hidden className="h-4 w-4" />
                {isAsking ? "Asking..." : "Ask"}
              </Button>
            </div>
          </div>
        </section>
        <SourcePreview
          allowSourceDownload={allowSourceDownload}
          citation={selectedCitation}
          content={sourceContent}
          error={sourceError}
          isLoading={isLoadingSource}
        />
      </div>
    </SectionPanel>
  );
}
