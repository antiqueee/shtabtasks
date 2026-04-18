import cron from 'node-cron'

console.log('Scheduler started')

// Placeholder: runs every 5 minutes — will be filled in Phase 5 (recurring tasks) and Phase 6 (reminders)
cron.schedule('*/5 * * * *', () => {
  console.log(`[${new Date().toISOString()}] scheduler tick`)
})

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down scheduler...`)
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
