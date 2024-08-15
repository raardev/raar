import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'

interface Chain {
  name: string
  chainId: number
  rpc: string[]
}

interface RPCStatus {
  url: string
  status: 'healthy' | 'unhealthy' | 'checking'
  latency?: number
}

const chains: Chain[] = [
  {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpc: [
      'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
      'https://rpc.ankr.com/eth',
    ],
  },
  {
    name: 'Binance Smart Chain',
    chainId: 56,
    rpc: [
      'https://bsc-dataseed.binance.org/',
      'https://bsc-dataseed1.defibit.io/',
    ],
  },
  // Add more chains here
]

const CHECK_INTERVAL = 60000 // 1 minute

const ChainList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredChains, setFilteredChains] = useState<Chain[]>(chains)
  const [rpcStatuses, setRpcStatuses] = useState<{ [key: string]: RPCStatus }>(
    {},
  )
  const [nextCheckIn, setNextCheckIn] = useState(CHECK_INTERVAL / 1000)

  useEffect(() => {
    const filtered = chains.filter(
      (chain) =>
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.chainId.toString().includes(searchTerm),
    )
    setFilteredChains(filtered)
  }, [searchTerm])

  useEffect(() => {
    const checkAllRPCs = async () => {
      const newStatuses: { [key: string]: RPCStatus } = {}
      for (const chain of chains) {
        for (const rpc of chain.rpc) {
          newStatuses[rpc] = { url: rpc, status: 'checking' }
          setRpcStatuses((prev) => ({ ...prev, [rpc]: newStatuses[rpc] }))

          try {
            const startTime = Date.now()
            const response = await fetch(rpc, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1,
              }),
            })
            const endTime = Date.now()
            const data = await response.json()
            if (data.result) {
              newStatuses[rpc] = {
                url: rpc,
                status: 'healthy',
                latency: endTime - startTime,
              }
            } else {
              newStatuses[rpc] = { url: rpc, status: 'unhealthy' }
            }
          } catch (error) {
            newStatuses[rpc] = { url: rpc, status: 'unhealthy' }
          }
          setRpcStatuses((prev) => ({ ...prev, [rpc]: newStatuses[rpc] }))
        }
      }
      setNextCheckIn(CHECK_INTERVAL / 1000)
    }

    checkAllRPCs()
    const interval = setInterval(checkAllRPCs, CHECK_INTERVAL)

    const ticker = setInterval(() => {
      setNextCheckIn((prev) => (prev > 0 ? prev - 1 : CHECK_INTERVAL / 1000))
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(ticker)
    }
  }, [])

  const getStatusCircle = (status: RPCStatus['status']) => {
    const baseClasses = 'inline-block w-3 h-3 rounded-full mr-2'
    switch (status) {
      case 'healthy':
        return <span className={`${baseClasses} bg-green-500`} />
      case 'unhealthy':
        return <span className={`${baseClasses} bg-red-500`} />
      case 'checking':
        return <span className={`${baseClasses} bg-yellow-500`} />
    }
  }

  const sortRPCs = (rpcs: string[]) => {
    return rpcs.sort((a, b) => {
      const statusA = rpcStatuses[a]?.status
      const statusB = rpcStatuses[b]?.status
      if (statusA === 'healthy' && statusB !== 'healthy') return -1
      if (statusA !== 'healthy' && statusB === 'healthy') return 1
      return 0
    })
  }

  const handleCopy = (rpc: string) => {
    navigator.clipboard.writeText(rpc)
    toast.success('RPC URL Copied', {
      description: rpc,
      duration: 2000,
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Chain List</h2>
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search by chain name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          Next check in: {nextCheckIn}s
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chain Name</TableHead>
            <TableHead>Chain ID</TableHead>
            <TableHead>RPC URLs</TableHead>
            <TableHead>Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChains.map((chain) => (
            <TableRow key={chain.chainId}>
              <TableCell>{chain.name}</TableCell>
              <TableCell>{chain.chainId}</TableCell>
              <TableCell>
                {sortRPCs(chain.rpc).map((rpc, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 ${
                      rpcStatuses[rpc]?.status === 'unhealthy'
                        ? 'text-muted-foreground'
                        : ''
                    }`}
                  >
                    {getStatusCircle(rpcStatuses[rpc]?.status || 'checking')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => handleCopy(rpc)}
                          >
                            {rpc}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </TableCell>
              <TableCell>
                {sortRPCs(chain.rpc).map((rpc, index) => (
                  <div key={index}>
                    {rpcStatuses[rpc]?.latency
                      ? `${rpcStatuses[rpc].latency}ms`
                      : '-'}
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Toaster />
    </div>
  )
}

export default ChainList
