import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const rootDir = path.resolve(appDir, '../..')
const generatedDir = path.join(appDir, 'src/generated')

const sources = [
  {
    source: path.join(rootDir, 'packages/db/dist'),
    target: path.join(generatedDir, 'db'),
  },
  {
    source: path.join(rootDir, 'packages/shared/dist'),
    target: path.join(generatedDir, 'shared'),
  },
]

mkdirSync(generatedDir, { recursive: true })

for (const { source, target } of sources) {
  if (!existsSync(source)) {
    throw new Error(`Missing build output: ${source}`)
  }

  rmSync(target, { recursive: true, force: true })
  mkdirSync(path.dirname(target), { recursive: true })
  cpSync(source, target, { recursive: true })
}
