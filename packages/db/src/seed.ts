import { db } from './client.js'
import { users, tags } from './schema.js'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'

const email = process.env.AUTH_OWNER_EMAIL
const password = process.env.AUTH_OWNER_PASSWORD

if (!email || !password) {
  throw new Error('AUTH_OWNER_EMAIL and AUTH_OWNER_PASSWORD must be set')
}

const passwordHash = await bcrypt.hash(password, 10)

await db
  .insert(users)
  .values({ email, passwordHash })
  .onConflictDoUpdate({ target: users.email, set: { passwordHash } })

console.log(`User upserted: ${email}`)

const defaultTags = [
  { name: 'Агитация', color: '#ef4444' },
  { name: 'Юристы', color: '#3b82f6' },
  { name: 'Полевая работа', color: '#22c55e' },
  { name: 'Медиа', color: '#a855f7' },
  { name: 'АХО', color: '#f59e0b' },
  { name: 'Аналитика', color: '#06b6d4' },
  { name: 'Финансы', color: '#10b981' },
]

for (const tag of defaultTags) {
  const existing = await db.select().from(tags).where(eq(tags.name, tag.name)).limit(1)
  if (existing.length === 0) {
    await db.insert(tags).values(tag)
    console.log(`Tag created: ${tag.name}`)
  }
}

console.log('Seed completed successfully')
process.exit(0)
