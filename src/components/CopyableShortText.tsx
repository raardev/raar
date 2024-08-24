import { Button } from '@/components/ui/button'
import { CopyIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

interface CopyableShortTextProps {
  text: string | undefined
  maxLength?: number
  fullText?: boolean
}

const CopyableShortText: React.FC<CopyableShortTextProps> = ({ text, maxLength = 8, fullText = false }) => {
  const [isCopied, setIsCopied] = useState(false)

  if (!text) return null

  const displayText = fullText ? text : (text.length > maxLength 
    ? `${text.slice(0, maxLength / 2)}...${text.slice(-maxLength / 2)}`
    : text)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    toast.success('Copied to clipboard')
  }

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  return (
    <span className="flex items-center space-x-1">
      <span className="font-mono">{displayText}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0"
        onClick={copyToClipboard}
      >
        {isCopied ? (
          <CheckIcon className="h-3 w-3 text-green-500" />
        ) : (
          <CopyIcon className="h-3 w-3" />
        )}
      </Button>
    </span>
  )
}

export default CopyableShortText