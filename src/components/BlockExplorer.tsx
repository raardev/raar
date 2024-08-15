import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createPublicClient, formatEther, http } from 'viem'
import { mainnet } from 'viem/chains'
import AddressInfo from './AddressInfo'
import BlockInfo from './BlockInfo'
import TransactionInfo from './TransactionInfo'

const chains = [
  { id: '1', name: 'Ethereum Mainnet', rpcUrl: 'https://eth.llamarpc.com' },
  {
    id: '5',
    name: 'Goerli Testnet',
    rpcUrl: 'https://rpc.ankr.com/eth_goerli',
  },
]

const BlockExplorer: React.FC = () => {
  const [chainId, setChainId] = useState('1')
  const [searchType, setSearchType] = useState('block')
  const [searchValue, setSearchValue] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const selectedChain = chains.find((chain) => chain.id === chainId)
      if (!selectedChain) {
        throw new Error('Invalid chain selected')
      }

      const client = createPublicClient({
        chain: mainnet,
        transport: http(selectedChain.rpcUrl),
      })

      let data
      switch (searchType) {
        case 'block':
          data = await client.getBlock({ blockNumber: BigInt(searchValue) })
          break
        case 'tx':
          data = await client.getTransaction({
            hash: searchValue as `0x${string}`,
          })
          break
        case 'address':
          const balance = await client.getBalance({
            address: searchValue as `0x${string}`,
          })
          const code = await client.getBytecode({
            address: searchValue as `0x${string}`,
          })
          const txCount = await client.getTransactionCount({
            address: searchValue as `0x${string}`,
          })
          data = {
            address: searchValue,
            balance: formatEther(balance),
            isContract: code !== '0x',
            transactionCount: txCount,
          }
          break
        default:
          throw new Error('Invalid search type')
      }

      setResult(data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error fetching data. Please check your input and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Block Explorer</h2>
      <div className="flex space-x-2">
        <Select onValueChange={setChainId} value={chainId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select chain" />
          </SelectTrigger>
          <SelectContent>
            {chains.map((chain) => (
              <SelectItem key={chain.id} value={chain.id}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSearchType} value={searchType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select search type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="block">Block</SelectItem>
            <SelectItem value="tx">Transaction</SelectItem>
            <SelectItem value="address">Address</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={`Enter ${searchType}`}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      {result && (
        <div className="bg-muted p-4 rounded overflow-auto max-h-[60vh]">
          {searchType === 'block' && <BlockInfo block={result} />}
          {searchType === 'tx' && <TransactionInfo transaction={result} />}
          {searchType === 'address' && <AddressInfo addressData={result} />}
        </div>
      )}
    </div>
  )
}

export default BlockExplorer
