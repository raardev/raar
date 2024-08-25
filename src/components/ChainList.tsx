import { VirtualizedDataTable } from '@/components/VirtualizedDataTable'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { type Chain, chains } from '@/config/chains'
import { cn } from '@/lib/utils'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  ConstructionIcon,
  LaptopMinimal,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { createPublicClient, http } from 'viem'

interface RPCStatus {
  url: string
  status: 'healthy' | 'unhealthy' | 'checking'
  latency?: number
  namespaces: { [key: string]: boolean }
  clientVersion?: string
}

const BATCH_SIZE = 5
const CHECK_INTERVAL = 30000 // 30 seconds

const ChainList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [rpcStatuses, setRpcStatuses] = useState<{ [key: string]: RPCStatus }>(
    {},
  )
  const [expandedChains, setExpandedChains] = useState<Set<number>>(new Set())
  const [activeRequests, setActiveRequests] = useState<{
    [key: number]: AbortController
  }>({})

  const checkRPCHealth = useCallback(
    async (rpc: string, signal?: AbortSignal) => {
      const startTime = Date.now()
      try {
        const client = createPublicClient({
          transport: http(rpc),
        })

        const [blockNumber, clientVersion] = await Promise.all([
          client.request({ method: 'eth_blockNumber', params: [] }, { signal }),
          client.request(
            { method: 'web3_clientVersion', params: [] },
            { signal },
          ),
        ])

        const endTime = Date.now()
        const latency = endTime - startTime

        const namespaces = ['eth', 'net', 'web3', 'debug', 'trace', 'txpool']
        const namespaceResults = await Promise.all(
          namespaces.map(async (namespace) => {
            try {
              switch (namespace) {
                case 'eth':
                  await client.request(
                    { method: 'eth_blockNumber', params: [] },
                    { signal },
                  )
                  break
                case 'net':
                  await client.request(
                    { method: 'net_version', params: [] },
                    { signal },
                  )
                  break
                case 'web3':
                  await client.request(
                    {
                      method: 'web3_clientVersion',
                      params: [],
                    },
                    { signal },
                  )
                  break
                case 'debug':
                  await client.request(
                    {
                      method: 'debug_traceBlockByNumber',
                      params: ['latest', {}],
                    },
                    { signal },
                  )
                  break
                case 'trace':
                  await client.request(
                    {
                      method: 'trace_block',
                      params: ['latest'],
                    },
                    { signal },
                  )
                  break
                case 'txpool':
                  await client.request(
                    { method: 'txpool_status', params: [] },
                    { signal },
                  )
                  break
              }
              return [namespace, true]
            } catch {
              return [namespace, false]
            }
          }),
        )

        const supportedNamespaces = Object.fromEntries(namespaceResults)

        return {
          status: 'healthy' as const,
          latency,
          namespaces: supportedNamespaces,
          clientVersion: clientVersion as string,
          url: rpc,
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          throw error // Re-throw AbortError to be caught in the calling function
        }
        console.error('RPC health check failed:', error)
        return {
          status: 'unhealthy' as const,
          namespaces: {
            eth: false,
            net: false,
            web3: false,
            debug: false,
            trace: false,
            txpool: false,
          },
          clientVersion: 'Unknown',
          url: rpc,
          latency: undefined,
        }
      }
    },
    [],
  )

  const checkChainRPCs = useCallback(
    async (chainId: number) => {
      const chain = chains.find((c) => c.chainId === chainId)
      if (chain) {
        const abortController = new AbortController()
        setActiveRequests((prev) => ({ ...prev, [chainId]: abortController }))

        const processRPCBatch = async (rpcs: string[]) => {
          const promises = rpcs.map(async (rpc) => {
            setRpcStatuses((prev) => ({
              ...prev,
              [rpc]: {
                ...prev[rpc],
                status: 'checking',
                url: rpc,
                namespaces: prev[rpc]?.namespaces || {
                  eth: false,
                  net: false,
                  web3: false,
                  debug: false,
                  trace: false,
                  txpool: false,
                },
              },
            }))
            try {
              const result = await checkRPCHealth(rpc, abortController.signal)
              setRpcStatuses((prev) => ({
                ...prev,
                [rpc]: { ...prev[rpc], ...result },
              }))
            } catch (error) {
              if (error.name === 'AbortError') {
                console.log('Request aborted for RPC:', rpc)
              } else {
                console.error('Error checking RPC health:', error)
              }
            }
          })
          await Promise.all(promises)
        }

        for (let i = 0; i < chain.rpc.length; i += BATCH_SIZE) {
          const batch = chain.rpc.slice(i, i + BATCH_SIZE)
          await processRPCBatch(batch)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        setActiveRequests((prev) => {
          const newRequests = { ...prev }
          delete newRequests[chainId]
          return newRequests
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
          // Abort any ongoing requests for this chain
          if (activeRequests[chainId]) {
            activeRequests[chainId].abort()
            setActiveRequests((prev) => {
              const newRequests = { ...prev }
              delete newRequests[chainId]
              return newRequests
            })
          }
        } else {
          newSet.add(chainId)
          setTimeout(() => {
            checkChainRPCs(chainId)
          }, 100)
        }
        return newSet
      })
    },
    [checkChainRPCs, activeRequests],
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
      const sortedRPCs = sortRPCs(chain.rpc)

      const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        e.stopPropagation()
      }

      return (
        <div>
          <button
            onClick={() => toggleChainExpansion(chain.chainId)}
            className="flex items-center space-x-2 text-sm font-medium hover:underline"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{`${totalRPCs} RPCs`}</span>
          </button>
          {isExpanded && (
            <ScrollArea className="h-full mt-2" onScroll={handleScroll}>
              <div className="max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {sortedRPCs.map((rpc) => {
                    const rpcStatus = rpcStatuses[rpc] || {
                      status: 'checking',
                      namespaces: {
                        eth: false,
                        net: false,
                        web3: false,
                        debug: false,
                        trace: false,
                        txpool: false,
                      },
                      url: rpc,
                    }
                    return (
                      <div
                        key={rpc}
                        className={cn(
                          'flex flex-col py-1',
                          rpcStatus.status === 'unhealthy' &&
                            'text-muted-foreground',
                        )}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center flex-grow mr-2 min-w-0">
                            {getStatusCircle(rpcStatus.status)}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className="cursor-pointer hover:underline truncate text-sm"
                                  onClick={() => handleCopy(rpc)}
                                >
                                  {rpc}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to copy</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="flex flex-wrap mt-1 text-xs ml-5 gap-1 text-muted-foreground">
                          <div className="flex items-center gap-1 flex-wrap">
                            <ConstructionIcon className="w-3 h-3 mr-1" />
                            {[
                              'eth',
                              'net',
                              'web3',
                              'debug',
                              'trace',
                              'txpool',
                            ].map((namespace) => (
                              <span
                                key={namespace}
                                className={cn(
                                  'flex items-center text-xs',
                                  rpcStatus.namespaces[namespace]
                                    ? 'text-green-500'
                                    : 'text-red-500',
                                )}
                              >
                                {namespace}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 w-full">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">
                                {rpcStatus.latency
                                  ? `${rpcStatus.latency}ms`
                                  : '-'}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <LaptopMinimal className="w-3 h-3" />
                              <span className="text-xs truncate">
                                {rpcStatus.clientVersion || 'Unknown'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      )
    },
    [expandedChains, rpcStatuses, toggleChainExpansion, sortRPCs],
  )

  const filteredChains = useMemo(() => {
    return chains.filter(
      (chain) =>
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.chainId.toString().includes(searchTerm),
    )
  }, [chains, searchTerm])

  const columnHelper = createColumnHelper<Chain>()

  const columns = useMemo<ColumnDef<Chain, any>[]>(
    () => [
      columnHelper.accessor((row, index) => index + 1, {
        id: 'index',
        cell: (info) => info.getValue(),
        header: () => <span>#</span>,
        size: 50,
      }),
      columnHelper.accessor('name', {
        cell: (info) => info.getValue(),
        header: () => <span>Name</span>,
        size: 200,
      }),
      columnHelper.accessor('chainId', {
        cell: (info) => info.getValue(),
        header: () => <span>Chain ID</span>,
        size: 100,
      }),
      columnHelper.accessor('rpc', {
        cell: (info) => renderRPCGroup(info.row.original),
        header: () => <span>RPCs</span>,
        size: 600,
      }),
    ],
    [renderRPCGroup],
  )

  return (
    <div className="container mx-auto flex flex-col h-screen py-4">
      <h2 className="text-2xl font-bold mb-4">Chain List</h2>
      <div className="flex justify-between items-center mb-4">
        <Input
          type="text"
          placeholder="Search by chain name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="flex-grow overflow-hidden">
        <VirtualizedDataTable columns={columns} data={filteredChains} />
      </div>
      <Toaster />
    </div>
  )
}

export default ChainList
