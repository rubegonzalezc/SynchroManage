import fs from 'node:fs'
import path from 'node:path'

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    else if (entry.name === 'route.ts') processFile(fullPath)
  }
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  if (!content.includes('getSupabaseAdmin') && (content.includes('supabaseAdmin') || content.includes('supabaseServer'))) {
    const importBlock = content.match(/^(import[\s\S]*?\n)(?!\s*import)/)?.[1] ?? ''
    const afterImports = content.slice(importBlock.length)
    if (!afterImports.includes('function getSupabaseAdmin()')) {
      content = `${importBlock}\nfunction getSupabaseAdmin() {\n  return createAdminClient()\n}\n${afterImports}`
    }
  }

  if (content.includes('supabaseServer')) {
    content = content.replace(/\bsupabaseServer\b/g, 'getSupabaseAdmin()')
  }

  if (content.includes('createAdminClient') && !content.includes("from '@/lib/supabase/admin'")) {
    content = content.replace(
      /^(import[\s\S]*?\n)(?=\n|function|export)/,
      (m) => `${m}import { createAdminClient } from '@/lib/supabase/admin'\n`
    )
  }

  // Replace bare supabaseAdmin usage (not declarations or parameters)
  content = content.replace(/\bsupabaseAdmin\b/g, (match, offset) => {
    const before = content.slice(Math.max(0, offset - 40), offset)
    if (before.includes('const ') || before.includes('function ') || before.includes('( ')) {
      return match
    }
    return 'getSupabaseAdmin()'
  })

  content = content.replace(
    /async function getRole\(getSupabaseAdmin\(\): [^,]+, userId: string\)/,
    'async function getRole(supabaseAdmin: ReturnType<typeof createAdminClient>, userId: string)'
  )

  content = content.replace(
    /const role = await getRole\(getSupabaseAdmin\(\), user\.id\)/g,
    'const supabaseAdmin = getSupabaseAdmin()\n    const role = await getRole(supabaseAdmin, user.id)'
  )

  if (content !== original) fs.writeFileSync(file, content)
}

walk(path.join(process.cwd(), 'src', 'app', 'api'))
