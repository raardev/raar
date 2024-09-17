import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState } from 'react'
import { toHex } from 'viem'
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts'

function KeyConverter() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<
    { address: string; privateKey: string; hdPath: string }[]
  >([])
  const [error, setError] = useState('')
  const [derivationCount, setDerivationCount] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const calculateResults = (startIndex: number, count: number) => {
    if (input.trim().split(/\s+/).length > 1) {
      // Mnemonic logic
      const newResults = []
      for (let i = startIndex; i < startIndex + count; i++) {
        const account = mnemonicToAccount(input, { addressIndex: i })
        const hdPath = `m/44'/60'/0'/0/${i}`
        const privateKey = toHex(account.getHdKey().privateKey!)
        newResults.push({
          address: account.address,
          privateKey,
          hdPath,
        })
      }
      return newResults
    }
    // Private key logic (unchanged)
    const privateKey = input.startsWith('0x') ? input : `0x${input}`
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    return [{ address: account.address, privateKey: privateKey, hdPath: 'N/A' }]
  }

  const handleConvert = async () => {
    setError('')
    setResults([])
    setIsLoading(true)

    try {
      const newResults = calculateResults(0, derivationCount)
      setResults(newResults)
    } catch (err) {
      setError(
        'Invalid input. Please enter a valid mnemonic phrase or private key.',
      )
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    try {
      const newResults = calculateResults(results.length, 10)
      setResults((prevResults) => [...prevResults, ...newResults])
      setDerivationCount((prevCount) => prevCount + 10)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter mnemonic phrase or private key"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button onClick={handleConvert} disabled={isLoading}>
        {isLoading ? 'Converting...' : 'Convert'}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
      {results.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HD Path</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Private Key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={`${result.address}-${index}`}>
                  <TableCell>{result.hdPath}</TableCell>
                  <TableCell>{result.address}</TableCell>
                  <TableCell>{result.privateKey}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {input.trim().split(/\s+/).length > 1 && (
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore || isLoading}
            >
              {isLoadingMore ? 'Loading More...' : 'Load More'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default KeyConverter
