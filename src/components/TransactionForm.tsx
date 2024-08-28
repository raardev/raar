import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { chains } from '@/config/chains'
import { useEffect, useMemo, useRef, useState } from 'react'

interface TransactionFormProps {
  txHash: string
  onTxHashChange: (hash: string) => void
  onTrace: (hash: string) => void
  isLoading: boolean
  customRPC: string
  onRPCChange: (rpc: string) => void
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  txHash,
  onTxHashChange,
  onTrace,
  isLoading,
  customRPC,
  onRPCChange,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(customRPC)
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
    onRPCChange(value)
    setShowSuggestions(true)
  }

  const handleRPCSelect = (rpc: string) => {
    setInputValue(rpc)
    onRPCChange(rpc)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onTrace(txHash)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="rpc-input">RPC URL</Label>
        <div className="relative">
          <Input
            id="rpc-input"
            ref={inputRef}
            placeholder="Enter RPC URL"
            value={inputValue}
            onChange={(e) => handleRPCChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="w-full"
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="tx-hash-input">Transaction Hash</Label>
        <div className="flex space-x-4">
          <Input
            id="tx-hash-input"
            placeholder="Enter transaction hash"
            value={txHash}
            onChange={(e) => onTxHashChange(e.target.value.toLowerCase())}
            className="flex-grow"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <Button type="submit" disabled={isLoading} className="w-24">
            {isLoading ? 'Tracing...' : 'Trace'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default TransactionForm
