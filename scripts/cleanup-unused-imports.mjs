import fs from 'node:fs'
import path from 'node:path'

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    else if (entry.name === 'route.ts') cleanup(fullPath)
  }
}

function cleanup(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const importLine =
    "import { createClient as createServerClient } from '@/lib/supabase/server'\r\n"
  const importLineLf =
    "import { createClient as createServerClient } from '@/lib/supabase/server'\n"

  if (!content.includes('createServerClient')) return
  if (content.includes('createServerClient(')) return

  const next = content.replace(importLine, '').replace(importLineLf, '')
  if (next !== content) {
    fs.writeFileSync(filePath, next)
    console.log('cleaned', path.relative(process.cwd(), filePath))
  }
}

walk(path.join(process.cwd(), 'src', 'app', 'api'))
