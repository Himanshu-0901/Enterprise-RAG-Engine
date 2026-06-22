import {
  deleteTenantConversationsOlderThan,
  findTenantSettings,
  listTenants,
  recordAuditLog,
  type Database
} from "@rag-llm/db";

const cutoffFor = (retentionDays: number): Date =>
  new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

export const runRetentionCleanup = async (db: Database): Promise<void> => {
  const tenantRows = await listTenants(db);

  for (const tenant of tenantRows) {
    const settings = await findTenantSettings(db, tenant.id);
    const cutoff = cutoffFor(settings.dataRetentionDays);
    const deletedConversations = await deleteTenantConversationsOlderThan(
      db,
      tenant.id,
      cutoff
    );

    if (deletedConversations === 0) {
      continue;
    }

    await recordAuditLog(db, {
      action: "retention.conversations_deleted",
      metadata: {
        cutoff: cutoff.toISOString(),
        deletedConversations,
        retentionDays: settings.dataRetentionDays
      },
      targetId: tenant.id,
      targetType: "tenant",
      tenantId: tenant.id
    });
  }
};
