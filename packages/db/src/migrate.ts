import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') })
console.log('Migrations applied successfully')
await client.end()
