import { useState } from "react";
import type { ApiSession } from "@/lib/api-client";
import {
  submitMessageFeedback,
  type ApiMessageFeedback
} from "@/lib/feedback-client";

export const useMessageFeedback = (
  session: ApiSession,
  initialFeedback: ApiMessageFeedback | null
) => {
  const [comment, setComment] = useState(initialFeedback?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ApiMessageFeedback | null>(
    initialFeedback
  );

  const submitFeedback = async (
    messageId: string,
    rating: "up" | "down"
  ): Promise<void> => {
    setError(null);

    try {
      const nextFeedback = await submitMessageFeedback(session, {
        comment,
        messageId,
        rating
      });
      setFeedback(nextFeedback);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to save feedback"
      );
    }
  };

  return {
    comment,
    error,
    feedback,
    setComment,
    submitFeedback
  };
};
