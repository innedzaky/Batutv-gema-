import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres.zweyhvisdntwtnmnfdzl:%23bragasan2019@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  },
});
