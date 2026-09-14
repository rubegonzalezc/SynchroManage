import fs from 'node:fs'
import path from 'node:path'

const apiDir = path.join(process.cwd(), 'src', 'app', 'api')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    if (entry.name === 'route.ts') return [fullPath]
    return []
  })
}

const authPatterns = [
  /const supabase(?:Server)? = await createServerClient\(\)\s*\n\s*const \{\s*data:\s*\{\s*user\s*\}\s*\} = await supabase(?:Server)?\.auth\.getUser\(\)/g,
  /const supabase = await createServerClient\(\)\s*\n\s*const \{\s*data:\s*\{\s*user\s*\},?\s*\} = await supabase\.auth\.getUser\(\)/g,
]

for (const file of walk(apiDir)) {
  if (file.includes('api\\auth\\') || file.includes('api/auth/')) continue

  let content = fs.readFileSync(file, 'utf8')
  const original = content

  for (const pattern of authPatterns) {
    content = content.replace(pattern, 'const user = await getApiUser()')
  }

  if (content === original) continue

  if (!content.includes("from '@/lib/auth/server'")) {
    content = content.replace(
      /^(import .+\n)+/,
      (imports) => `${imports}import { getApiUser } from '@/lib/auth/server'\n`
    )
  }

  content = content.replace(
    /import \{ createClient as createServerClient \} from '@\/lib\/supabase\/server'\n/g,
    ''
  )

  fs.writeFileSync(file, content)
  console.log('updated', path.relative(process.cwd(), file))
}
