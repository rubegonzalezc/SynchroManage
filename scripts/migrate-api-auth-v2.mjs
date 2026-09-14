import fs from 'node:fs'
import path from 'node:path'

const AUTH_BLOCK =
  /const (supabase(?:Server)?) = await createServerClient\(\)\s*\n\s*const \{\s*(?:data:\s*)?\{?\s*user\s*\}?\s*(?:,|\})[^}]*\} = await \1\.auth\.getUser\(\)/g

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    else if (entry.name === 'route.ts') migrateFile(fullPath)
  }
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content
  const match = content.match(/^(import[\s\S]*?\n)(?!\s*import)/)
  if (!match) return `${importLine}\n${content}`
  return `${match[1]}${importLine}\n${content.slice(match[1].length)}`
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('createServerClient') || !content.includes('.auth.getUser')) return

  const original = content

  content = content.replace(AUTH_BLOCK, 'const user = await getApiUser()')

  if (!content.includes('getApiUser')) return

  content = ensureImport(content, "import { getApiUser } from '@/lib/auth/server'")

  const needsAdmin =
    /\bsupabaseServer\b/.test(content) ||
    /await supabase\./.test(content) ||
    /await supabase\n/.test(content)

  if (needsAdmin) {
    content = ensureImport(content, "import { createAdminClient } from '@/lib/supabase/admin'")

    if (!content.includes('function getRouteAdmin()')) {
      const match = content.match(/^(import[\s\S]*?\n)(?!\s*import)/)
      const imports = match?.[1] ?? ''
      const rest = content.slice(imports.length)
      content = `${imports}\nfunction getRouteAdmin() {\n  return createAdminClient()\n}\n${rest}`
    }

    content = content.replace(/\bsupabaseServer\b/g, 'getRouteAdmin()')
    content = content.replace(/\bawait getRouteAdmin\(\)\./g, 'await getRouteAdmin().')
    content = content.replace(/([^a-zA-Z])supabase(\s*\.)/g, '$1getRouteAdmin()$2')
  }

  content = content.replace(
    /async function getRole\(getRouteAdmin\(\): [^,]+,/,
    'async function getRole(supabaseAdmin: ReturnType<typeof createAdminClient>,'
  )
  content = content.replace(
    /const role = await getRole\(getRouteAdmin\(\),/g,
    'const role = await getRole(getRouteAdmin(),'
  )

  if (!content.includes('createServerClient')) {
    content = content.replace(
      /import \{ createClient as createServerClient \} from '@\/lib\/supabase\/server'\n/,
      ''
    )
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    console.log('migrated', path.relative(process.cwd(), filePath))
  }
}

walk(path.join(process.cwd(), 'src', 'app', 'api', 'dashboard'))
