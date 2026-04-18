import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

// Next.js imports server modules during build, so the database client must not
// hard-fail before the first real query. Runtime still requires a valid env var.
const connectionString =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/postgres'

const client = postgres(connectionString)
export const db = drizzle(client, { schema })

export type Database = typeof db
