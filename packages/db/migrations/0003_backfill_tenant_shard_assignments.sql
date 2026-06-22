INSERT INTO tenant_shard_assignments (tenant_id, shard_key, bucket)
SELECT tenants.id, 'primary', 0
FROM tenants
WHERE NOT EXISTS (
  SELECT 1
  FROM tenant_shard_assignments
  WHERE tenant_shard_assignments.tenant_id = tenants.id
);
