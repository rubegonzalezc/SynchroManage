import fs from 'node:fs'
import path from 'node:path'

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    else if (entry.name === 'route.ts') {
      let content = fs.readFileSync(fullPath, 'utf8')
      const original = content
      content = content.replaceAll('@/lib/supabaseAdmin/admin', '@/lib/supabase/admin')
      content = content.replace(
        /import \{ createClient as createServerClient \} from '@\/lib\/supabase\/server'\n/g,
        ''
      )
      if (content !== original) fs.writeFileSync(fullPath, content)
    }
  }
}

walk(path.join(process.cwd(), 'src', 'app', 'api'))
