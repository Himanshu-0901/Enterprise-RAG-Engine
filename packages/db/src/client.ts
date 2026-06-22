import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export type DatabaseClient = {
  db: Database;
  close: () => Promise<void>;
};

export const createDatabaseClient = (databaseUrl: string): DatabaseClient => {
  const client = postgres(databaseUrl, { prepare: false });

  return {
    db: drizzle(client, { schema }),
    close: () => client.end()
  };
};
