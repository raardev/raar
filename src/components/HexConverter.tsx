import { Textarea } from '@/components/ui/textarea'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const HexConverter: React.FC = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<React.ReactNode[]>([])

  const convertHexToNumber = useMemo(
    () => (match: string) => {
      const num = Number.parseInt(match, 16)
      return Number.isNaN(num) ? match : num.toString()
    },
    [],
  )

  const convertNumberToHex = useMemo(
    () => (match: string) => {
      const num = Number.parseInt(match)
      return Number.isNaN(num) ? match : `0x${num.toString(16)}`
    },
    [],
  )

  const convertAndHighlight = useCallback(
    (text: string, reverse = false) => {
      const hexRegex = /\b0x[a-fA-F0-9]+\b(?![\w-])/g
      const numberRegex = /\b\d+\b/g
      const ethereumRegex = /\b(0x[a-fA-F0-9]{40})\b|\b(0x[a-fA-F0-9]{64})\b/g

      const parts: React.ReactNode[] = []
      let lastIndex = 0

      const processMatch = (match: string, index: number) => {
        if (index > lastIndex) {
          parts.push(text.slice(lastIndex, index))
        }
        if (ethereumRegex.test(match)) {
          parts.push(match)
        } else {
          const converted = reverse
            ? convertNumberToHex(match)
            : convertHexToNumber(match)
          if (match === converted) {
            parts.push(match)
          } else {
            parts.push(
              <span key={index} className="highlight">
                {match} ({converted})
              </span>,
            )
          }
        }
        lastIndex = index + match.length
      }

      const regex = reverse ? numberRegex : hexRegex
      let match: RegExpExecArray | null
      while ((match = regex.exec(text)) !== null) {
        processMatch(match[0], match.index)
      }

      if (!reverse) {
        while ((match = numberRegex.exec(text)) !== null) {
          processMatch(match[0], match.index)
        }
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      return parts
    },
    [convertHexToNumber, convertNumberToHex],
  )

  useEffect(() => {
    setOutput(convertAndHighlight(input))
  }, [input, convertAndHighlight])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleOutputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newOutput = e.currentTarget.innerText
    setOutput(convertAndHighlight(newOutput, true))
    setInput(newOutput)
  }

  const commonStyles =
    'w-1/2 h-full p-4 font-mono text-sm leading-relaxed overflow-auto whitespace-pre-wrap outline-none border-none focus:ring-0 focus:outline-none'

  return (
    <div className="flex w-full h-full">
      <Textarea
        value={input}
        onChange={handleInputChange}
        className={`${commonStyles} resize-none`}
        placeholder="Enter hex values, numbers, or any text..."
      />
      <div className="w-px bg-gray-200" />
      <div
        className={commonStyles}
        contentEditable
        onInput={handleOutputChange}
        suppressContentEditableWarning
      >
        {output}
      </div>
      <style>{`
        .highlight {
          background-color: #ffff00;
        }
        .flex.w-full.h-full {
          height: 100vh;
        }
      `}</style>
    </div>
  )
}

export default HexConverter
