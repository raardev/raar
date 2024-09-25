import { Input } from '@/components/ui/input'
import { chains } from '@/config/chains'
import { useEffect, useMemo, useRef, useState } from 'react'

interface RPCInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RPCInput: React.FC<RPCInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter RPC URL',
  className = '',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const allRPCs = useMemo(
    () =>
      chains.flatMap((chain) =>
        chain.rpc.map((rpc) => ({ chainId: chain.chainId, rpc })),
      ),
    [],
  )

  const filteredRPCs = useMemo(() => {
    if (!inputValue.trim()) return []

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    const searchPattern = new RegExp(
      `(^|[/.:])${escapeRegExp(inputValue)}`,
      'i',
    )

    return allRPCs.filter((item) => searchPattern.test(item.rpc)).slice(0, 5)
  }, [inputValue, allRPCs])

  const handleRPCChange = (value: string) => {
    setInputValue(value)
    onChange(value)
    setShowSuggestions(true)
  }

  const handleRPCSelect = (rpc: string) => {
    setInputValue(rpc)
    onChange(rpc)
    setShowSuggestions(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleRPCChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        className={`w-full ${className}`}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {showSuggestions && filteredRPCs.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredRPCs.map((item) => (
            <li key={`${item.chainId}-${item.rpc}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleRPCSelect(item.rpc)
                }}
                role="option"
                aria-selected={inputValue === item.rpc}
              >
                {item.rpc}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RPCInput
