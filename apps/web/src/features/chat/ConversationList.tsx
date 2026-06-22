import { Plus } from "lucide-react";
import type { ApiConversation } from "@/lib/api-client";

type ConversationListProps = {
  activeConversationId: string | null;
  conversations: ApiConversation[];
  onNew: () => void;
  onOpen: (conversationId: string) => void;
};

export function ConversationList({
  activeConversationId,
  conversations,
  onNew,
  onOpen
}: ConversationListProps) {
  return (
    <aside className="border-b border-zinc-200 bg-[#f4f4f2] lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-zinc-200 p-3">
        <p className="font-mono text-[11px] uppercase tracking-normal text-zinc-500">
          Conversations
        </p>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-white hover:text-zinc-950"
          onClick={onNew}
          aria-label="Start new conversation"
        >
          <Plus aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[430px] overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-500">
            No saved conversations yet.
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={
                conversation.id === activeConversationId
                  ? "mb-1 w-full rounded-md bg-white px-3 py-2 text-left text-sm font-medium text-zinc-950 shadow-sm"
                  : "mb-1 w-full rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-white hover:text-zinc-950"
              }
              onClick={() => onOpen(conversation.id)}
            >
              <span className="line-clamp-2">{conversation.title}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
