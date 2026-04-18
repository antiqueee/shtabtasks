import { db } from './client.js'
import { users, tags } from './schema.js'
import bcrypt from 'bcrypt'

const email = process.env.AUTH_OWNER_EMAIL
const password = process.env.AUTH_OWNER_PASSWORD

if (!email || !password) {
  throw new Error('AUTH_OWNER_EMAIL and AUTH_OWNER_PASSWORD must be set')
}

const passwordHash = await bcrypt.hash(password, 10)

await db.insert(users).values({ email, passwordHash }).onConflictDoNothing()

const defaultTags = [
  { name: 'Агитация', color: '#ef4444' },
  { name: 'Юристы', color: '#3b82f6' },
  { name: 'Полевая работа', color: '#22c55e' },
  { name: 'Медиа', color: '#a855f7' },
  { name: 'АХО', color: '#f59e0b' },
  { name: 'Аналитика', color: '#06b6d4' },
]

await db.insert(tags).values(defaultTags).onConflictDoNothing()

console.log('Seed completed successfully')
process.exit(0)
