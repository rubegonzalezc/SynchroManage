import fs from 'node:fs'
import path from 'node:path'

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    else if (entry.name === 'route.ts') fixFile(fullPath)
  }
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('import {\nimport { getApiUser')) return

  const original = content

  content = content.replace(
    /import \{\nimport \{ getApiUser \} from '@\/lib\/auth\/server'\n(?:import \{ createAdminClient \} from '@\/lib\/supabase\/admin'\n\nfunction getRouteAdmin\(\) \{\n  return createAdminClient\(\)\n\}\n)?/g,
    "import { getApiUser } from '@/lib/auth/server'\nimport { createAdminClient } from '@/lib/supabase/admin'\n\nfunction getRouteAdmin() {\n  return createAdminClient()\n}\n\nimport {\n"
  )

  content = content.replace(
    /import type \{\nimport \{ getApiUser \} from '@\/lib\/auth\/server'\nimport \{ createAdminClient \} from '@\/lib\/supabase\/admin'\n\nfunction getRouteAdmin\(\) \{\n  return createAdminClient\(\)\n\}\n/g,
    "import { getApiUser } from '@/lib/auth/server'\nimport { createAdminClient } from '@/lib/supabase/admin'\n\nfunction getRouteAdmin() {\n  return createAdminClient()\n}\n\nimport type {\n"
  )

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    console.log('fixed', path.relative(process.cwd(), filePath))
  }
}

walk(path.join(process.cwd(), 'src', 'app', 'api'))
