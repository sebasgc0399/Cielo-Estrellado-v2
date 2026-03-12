import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'

const envFiles = ['.env.local', '.env']

for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile)
  if (existsSync(envPath)) {
    config({ path: envPath, quiet: true })
  }
}
