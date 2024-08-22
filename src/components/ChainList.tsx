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
import { type Chain, chains } from '@/config/chains'
import { ChevronDown, ChevronUp, Pause, Play } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Toaster, toast } from 'sonner'

interface RPCStatus {
  url: string
  status: 'healthy' | 'unhealthy' | 'checking'
  latency?: number
}

const CHECK_INTERVAL = 10000 // 10 seconds

interface FetchingControlProps {
  chainId: number
  checkChainRPCs: (chainId: number) => void
}

const FetchingControl: React.FC<FetchingControlProps> = ({
  chainId,
  checkChainRPCs,
}) => {
  const [isFetching, setIsFetching] = useState(true)
  const [nextCheckIn, setNextCheckIn] = useState(CHECK_INTERVAL / 1000)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (isFetching) {
      checkChainRPCs(chainId)
      intervalId = setInterval(() => {
        checkChainRPCs(chainId)
        setNextCheckIn(CHECK_INTERVAL / 1000)
      }, CHECK_INTERVAL)

      const countdownInterval = setInterval(() => {
        setNextCheckIn((prev) => (prev > 0 ? prev - 1 : CHECK_INTERVAL / 1000))
      }, 1000)

      return () => {
        if (intervalId) clearInterval(intervalId)
        clearInterval(countdownInterval)
      }
    }
  }, [chainId, isFetching, checkChainRPCs])

  const toggleFetching = () => {
    setIsFetching((prev) => !prev)
  }

  return (
    <button
      type="button"
      onClick={toggleFetching}
      className="relative w-6 h-6 focus:outline-none"
      aria-label={isFetching ? 'Pause' : 'Start'}
    >
      <svg className="w-full h-full" viewBox="0 0 24 24">
        <circle
          className="text-muted-foreground/20"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r="10"
          cx="12"
          cy="12"
        />
        <circle
          className="text-primary"
          strokeWidth="2"
          strokeDasharray="63"
          strokeDashoffset={63 * (nextCheckIn / (CHECK_INTERVAL / 1000))}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="10"
          cx="12"
          cy="12"
        />
      </svg>
      {isFetching ? (
        <Pause className="w-3 h-3 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      ) : (
        <Play className="w-3 h-3 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      )}
    </button>
  )
}

const ChainList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [rpcStatuses, setRpcStatuses] = useState<{ [key: string]: RPCStatus }>(
    {},
  )
  const [expandedChains, setExpandedChains] = useState<Set<number>>(new Set())

  const checkRPCHealth = useCallback(async (rpc: string) => {
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
        return { status: 'healthy' as const, latency: endTime - startTime }
      }
    } catch (error) {
      // Error handling
    }
    return { status: 'unhealthy' as const }
  }, [])

  const checkChainRPCs = useCallback(
    (chainId: number) => {
      const chain = chains.find((c) => c.chainId === chainId)
      if (chain) {
        chain.rpc.forEach(async (rpc) => {
          const result = await checkRPCHealth(rpc)
          setRpcStatuses((prev) => ({
            ...prev,
            [rpc]: { url: rpc, ...result },
          }))
        })
      }
    },
    [chains, checkRPCHealth],
  )

  const toggleChainExpansion = useCallback(
    (chainId: number) => {
      setExpandedChains((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(chainId)) {
          newSet.delete(chainId)
        } else {
          newSet.add(chainId)
          // Immediately check RPCs when expanding
          checkChainRPCs(chainId)
        }
        return newSet
      })
    },
    [checkChainRPCs],
  )

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
      const latencyA = rpcStatuses[a]?.latency ?? Number.POSITIVE_INFINITY
      const latencyB = rpcStatuses[b]?.latency ?? Number.POSITIVE_INFINITY
      return latencyA - latencyB
    })
  }

  const handleCopy = (rpc: string) => {
    navigator.clipboard.writeText(rpc)
    toast.success('RPC URL Copied', {
      description: rpc,
      duration: 2000,
    })
  }

  const renderRPCGroup = useCallback(
    (chain: Chain) => {
      const isExpanded = expandedChains.has(chain.chainId)
      const totalRPCs = chain.rpc.length

      return (
        <div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleChainExpansion(chain.chainId)}
              className="flex items-center space-x-2 text-sm font-medium"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span>
                {isExpanded
                  ? `${chain.rpc.filter((rpc) => rpcStatuses[rpc]?.status === 'healthy').length}/${totalRPCs} RPCs healthy`
                  : `${totalRPCs} RPCs`}
              </span>
            </button>
            {isExpanded && (
              <FetchingControl
                chainId={chain.chainId}
                checkChainRPCs={checkChainRPCs}
              />
            )}
          </div>
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {sortRPCs(chain.rpc).map((rpc, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between ${
                    rpcStatuses[rpc]?.status === 'unhealthy'
                      ? 'text-muted-foreground'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getStatusCircle(rpcStatuses[rpc]?.status || 'checking')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="cursor-pointer hover:underline truncate max-w-xs"
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
                  <span className="text-sm">
                    {rpcStatuses[rpc]?.latency
                      ? `${rpcStatuses[rpc].latency}ms`
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    [expandedChains, rpcStatuses, toggleChainExpansion, checkChainRPCs],
  )

  const filteredChains = useMemo(() => {
    return chains.filter(
      (chain) =>
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.chainId.toString().includes(searchTerm),
    )
  }, [chains, searchTerm])

  return (
    <div className="container mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-4">Chain List</h2>
      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Search by chain name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="w-1/4">Chain Name</TableHead>
              <TableHead className="w-1/4">Chain ID</TableHead>
              <TableHead className="w-1/2">RPC URLs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChains.map((chain, index) => (
              <TableRow key={chain.chainId}>
                <TableCell className="w-16">{index + 1}</TableCell>
                <TableCell className="w-1/4">{chain.name}</TableCell>
                <TableCell className="w-1/4">{chain.chainId}</TableCell>
                <TableCell className="w-1/2">{renderRPCGroup(chain)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Toaster />
    </div>
  )
}

export default ChainList
