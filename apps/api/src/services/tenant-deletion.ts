import {
  deleteTenant,
  findTenantById,
  recordAuditLog,
  type Database,
  type TenantRecord
} from "@rag-llm/db";
import type { ServerEnv } from "@rag-llm/shared";
import { notFound } from "../lib/api-error";
import { deleteObjectPrefix } from "./object-storage";

type DeleteTenantInput = {
  actorUserId: string;
  db: Database;
  env: ServerEnv;
  tenantId: string;
};

export type DeleteTenantResult = {
  deletedObjects: number;
  tenant: TenantRecord;
};

export const deleteTenantAndPrivateData = async ({
  actorUserId,
  db,
  env,
  tenantId
}: DeleteTenantInput): Promise<DeleteTenantResult> => {
  const tenant = await findTenantById(db, tenantId);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  const deletedObjects = await deleteObjectPrefix(env, `tenants/${tenantId}/`);

  await recordAuditLog(db, {
    action: "tenant.delete_requested",
    actorUserId,
    metadata: {
      deletedObjects,
      slug: tenant.slug
    },
    targetId: tenantId,
    targetType: "tenant"
  });

  const deletedTenant = await deleteTenant(db, tenantId);

  return { deletedObjects, tenant: deletedTenant };
};
