import fs from 'node:fs'
import path from 'node:path'

const apiDir = path.join(process.cwd(), 'src', 'app', 'api')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    if (entry.name === 'route.ts') return [fullPath]
    return []
  })
}

const authBlock = /const supabase(?:Server)? = await createServerClient\(\)\s*\n\s*const \{\s*\n?\s*data:\s*\{\s*user\s*\},?\s*\n?\s*\} = await supabase(?:Server)?\.auth\.getUser\(\)/g

for (const file of walk(apiDir)) {
  if (file.includes(`${path.sep}auth${path.sep}`)) continue

  let content = fs.readFileSync(file, 'utf8')
  const original = content

  content = content.replace(authBlock, 'const user = await getApiUser()')

  if (content.includes('getApiUser()') && !content.includes("from '@/lib/auth/server'")) {
    const firstImportEnd = content.indexOf('\n', content.indexOf('import '))
    content = `${content.slice(0, firstImportEnd + 1)}import { getApiUser } from '@/lib/auth/server'\n${content.slice(firstImportEnd + 1)}`
  }

  if (content.includes('getApiUser()') && content.includes('await supabase') && !content.includes('createAdminClient')) {
    if (!content.includes("from '@/lib/supabase/admin'")) {
      content = content.replace(
        /import \{ getApiUser \} from '@\/lib\/auth\/server'\n/,
        "import { getApiUser } from '@/lib/auth/server'\nimport { createAdminClient } from '@/lib/supabase/admin'\n"
      )
    }
    content = content.replace(/\bsupabase\b/g, (match, offset) => {
      const before = content.slice(Math.max(0, offset - 80), offset)
      if (before.includes('createClient') || before.includes('getSupabaseAdmin') || before.includes('supabaseAdmin')) {
        return match
      }
      return 'supabaseAdmin'
    })
    if (content.includes('supabaseAdmin') && !content.includes('const supabaseAdmin = createAdminClient()')) {
      content = content.replace(
        /try \{\n/,
        'try {\n    const supabaseAdmin = createAdminClient()\n'
      )
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content)
    console.log('fixed', path.relative(process.cwd(), file))
  }
}
