import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
const ownerId = process.env.TELEGRAM_OWNER_ID

if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
if (!ownerId) throw new Error('TELEGRAM_OWNER_ID is not set')

const bot = new Bot(token)

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id?.toString()
  if (userId !== ownerId) {
    await ctx.reply('Доступ ограничен')
    return
  }
  await next()
})

bot.command('start', async (ctx) => {
  await ctx.reply('Привет! Я бот штабного календаря.')
})

async function main() {
  const me = await bot.api.getMe()
  console.log(`Bot started: @${me.username}`)
  console.log(`Owner ID: ${ownerId}`)

  await bot.start({
    onStart: (info) => console.log(`Polling started for @${info.username}`),
  })
}

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`)
  bot.stop()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
