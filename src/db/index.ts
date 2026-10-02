import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.zweyhvisdntwtnmnfdzl:%23bragasan2019@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

/**
 * PostgreSQL Client for Node.js / Server environments.
 * Configured with SSL and connection pooling parameters suitable for Supabase.
 */
export const client = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Drizzle ORM instance with full schema typing.
 */
export const db = drizzle(client, { schema });

export * from './schema';
export default db;
