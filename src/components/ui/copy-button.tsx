'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  value: string
  disabled?: boolean
}

export function CopyButton({ value, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
          Copiado
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled || !value}
        onClick={handleCopy}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  )
}
