import { createEmailMessage, type Database } from "@rag-llm/db";

type InviteEmailInput = {
  inviteUrl: string;
  recipientEmail: string;
  tenantId: string;
  tenantName: string;
};

export type EmailProvider = {
  sendInviteEmail: (input: InviteEmailInput) => Promise<void>;
};

export const createEmailProvider = (db: Database): EmailProvider => ({
  sendInviteEmail: async (input) => {
    await createEmailMessage(db, {
      body: [
        `You have been invited to ${input.tenantName}.`,
        "",
        `Accept your invite: ${input.inviteUrl}`,
        "",
        "This invite expires in 7 days."
      ].join("\n"),
      provider: "dev_sink",
      recipientEmail: input.recipientEmail,
      subject: `Invitation to ${input.tenantName}`,
      tenantId: input.tenantId
    });
  }
});
