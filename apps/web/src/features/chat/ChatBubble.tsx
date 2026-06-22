import type { ReactElement } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useMessageFeedback } from "@/features/chat/useMessageFeedback";
import type { ApiCitation, ApiSession } from "@/lib/api-client";
import type { ApiMessageFeedback } from "@/lib/feedback-client";

export type ChatEntry = {
  citations?: ApiCitation[];
  content: string;
  feedback?: ApiMessageFeedback | null;
  id: string;
  role: "assistant" | "user";
};

export function ChatBubble({
  message,
  onCitationClick,
  session
}: {
  message: ChatEntry;
  onCitationClick: (citation: ApiCitation) => void;
  session: ApiSession;
}) {
  const isUser = message.role === "user";
  const { comment, error, feedback, setComment, submitFeedback } =
    useMessageFeedback(session, message.feedback ?? null);
  const selectedRating = feedback?.rating;

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
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-normal text-zinc-500">
            <MessageSquare aria-hidden className="h-3.5 w-3.5" />
            Assistant
          </div>
        ) : null}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      {!isUser && message.citations?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.citations.map((citation) => (
            <button
              key={citation.id}
              type="button"
              className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              onClick={() => onCitationClick(citation)}
            >
              <Badge tone="info">
                {citation.documentName}, p. {citation.pageNumber ?? 1}
              </Badge>
            </button>
          ))}
        </div>
      ) : null}
      {!isUser ? (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <FeedbackButton
              active={selectedRating === "up"}
              label="Good answer"
              onClick={() => void submitFeedback(message.id, "up")}
            >
              <ThumbsUp />
            </FeedbackButton>
            <FeedbackButton
              active={selectedRating === "down"}
              label="Bad answer"
              onClick={() => void submitFeedback(message.id, "down")}
            >
              <ThumbsDown />
            </FeedbackButton>
            <input
              className="h-8 min-w-0 flex-1 rounded-md border border-zinc-200 px-2 text-xs outline-none focus:border-zinc-500"
              placeholder="Optional feedback"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && selectedRating) {
                  void submitFeedback(message.id, selectedRating);
                }
              }}
            />
          </div>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </div>
      ) : null}
    </article>
  );
}

function FeedbackButton({
  active,
  children,
  label,
  onClick
}: {
  active: boolean;
  children: ReactElement;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-950 text-white"
          : "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
      }
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
