import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactionTracerStore } from '@/stores/transactionTracerStore'
import { type AutoloadResult, loaders, whatsabi } from '@shazow/whatsabi'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ABIFunction } from 'node_modules/@shazow/whatsabi/lib.types/abi'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPublicClient, decodeFunctionData, formatEther, http } from 'viem'

interface CallTraceNode {
  type: string
  from: string
  to: string
  gasUsed: string
  value: string
  input: string
  output?: string
  opcodes?: string[]
  storage?: { [key: string]: string }
  calls?: CallTraceNode[]
}

interface CallTraceVisualizationProps {
  trace: CallTraceNode
}

const CallTraceVisualization: React.FC<CallTraceVisualizationProps> = ({
  trace,
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const { customRPC } = useTransactionTracerStore()
  const [chainId, setChainId] = useState<number | null>(null)

  const client = useMemo(() => {
    if (!customRPC) {
      // toast.error('Please enter a valid RPC URL')
      return
    }

    return createPublicClient({
      transport: http(customRPC),
    })
  }, [customRPC])

  useEffect(() => {
    const fetchChainId = async () => {
      if (client) {
        try {
          const id = await client.getChainId()
          setChainId(id)
        } catch (error) {
          console.error('Error fetching chain ID:', error)
        }
      }
    }

    fetchChainId()
  }, [client])

  const getAllAddresses = useCallback((node: CallTraceNode): Set<string> => {
    const addresses = new Set<string>([node.to])
    if (node.calls) {
      for (const childNode of node.calls) {
        for (const address of getAllAddresses(childNode)) {
          addresses.add(address)
        }
      }
    }
    return addresses
  }, [])

  const addresses = useMemo(
    () => getAllAddresses(trace),
    [getAllAddresses, trace],
  )

  const loader = useMemo(
    () =>
      new loaders.MultiABILoader([
        new loaders.SourcifyABILoader({
          chainId: chainId || undefined,
        }),
        // new loaders.EtherscanABILoader(
        //   {
        //   apiKey: process.env.ETHERSCAN_API_KEY,
        // }),
      ]),
    [chainId],
  )

  const { data: decodedFunctions, isLoading } = useQuery({
    queryKey: ['decodedFunctions', Array.from(addresses), customRPC, chainId],
    queryFn: async () => {
      const results: { [address: string]: AutoloadResult['abi'] } = {}
      for (const address of addresses) {
        try {
          const result = await whatsabi.autoload(address as `0x${string}`, {
            provider: client,
            followProxies: true,
            abiLoader: loader,
            onProgress: (phase) => console.log('autoload progress', phase),
            onError: (phase, context) =>
              console.error('autoload error', phase, context),
          })
          results[address] = result.abi
        } catch (error) {
          console.error('Error fetching ABI:', error)
          results[address] = []
        }
      }
      return results
    },
    enabled: !!chainId && !!client,
  })

  const { data: contractInfo, isLoading: isLoadingContract } = useQuery({
    queryKey: ['contractInfo', Array.from(addresses), chainId],
    queryFn: async () => {
      const results: { [address: string]: { abi: any[]; name: string } } = {}
      for (const address of addresses) {
        try {
          const contract = await loader.getContract(address as `0x${string}`)
          results[address] = {
            abi: contract.abi,
            name: contract.name || address,
          }
        } catch (error) {
          console.error('Error fetching contract info:', error)
          results[address] = { abi: [], name: address }
        }
      }
      return results
    },
    enabled: !!chainId,
  })

  const decodeFunctionCall = useCallback(
    (abi: AutoloadResult['abi'], input: string, output: string) => {
      const selector = input.slice(0, 10)

      try {
        const decodedInputs = decodeFunctionData({
          abi: abi,
          data: input as `0x${string}`,
        })

        const matchingFunction = abi.find(
          (item) =>
            item.type === 'function' &&
            item.name === decodedInputs.functionName,
        ) as ABIFunction

        let decodedArgs: { [key: string]: unknown } = {}
        if (matchingFunction?.inputs && decodedInputs.args) {
          decodedArgs = matchingFunction.inputs.reduce(
            (acc, input, index) => {
              const argValue = decodedInputs.args?.[index]
              acc[input.name || `arg${index}`] = argValue
              return acc
            },
            {} as { [key: string]: unknown },
          )
        }

        return {
          functionName: decodedInputs.functionName,
          args: decodedArgs,
          output: output || '',
        }
      } catch (error) {
        console.error('Error decoding function inputs:', error)
        // Fallback to displaying raw input if decoding fails
        const callData = input.slice(10)
        const truncatedCallData = `${callData.slice(0, 64)}...${callData.slice(-4)}`
        return {
          functionName: selector,
          args: { call_data: truncatedCallData },
          output: output || '',
        }
      }
    },
    [],
  )

  const toggleNode = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  const colorMap = {
    callType: {
      call: 'text-blue-500 font-semibold',
      staticcall: 'text-green-500 font-semibold',
      delegatecall: 'text-purple-500 font-semibold',
      create: 'text-red-500 font-semibold',
      create2: 'text-orange-500 font-semibold',
    },
    gasUsed: 'text-gray-600',
    ethValue: 'text-yellow-600',
    contractName: 'text-indigo-600',
    functionName: 'text-pink-600',
    argName: 'text-cyan-600',
    argValue: 'text-emerald-600',
    output: 'text-teal-600',
  }

  const renderNode = useCallback(
    (node: CallTraceNode, nodeId: string, depth: number) => {
      const isCollapsed = collapsedNodes.has(nodeId)
      const hasChildren = node.calls && node.calls.length > 0
      const gasUsed = Number.parseInt(node.gasUsed, 16)
      const abi = decodedFunctions?.[node.to] || []
      const decodedCall = decodeFunctionCall(abi, node.input, node.output || '')

      const { abi: contractAbi, name: contractName } = contractInfo?.[
        node.to
      ] || { abi: [], name: node.to }
      const callType = node.type.toLowerCase()
      const callTypeColor =
        colorMap.callType[callType as keyof typeof colorMap.callType] ||
        'text-gray-600 font-semibold'
      const callTypeStr = `[${callType.toUpperCase()}] `
      const ethValue =
        node.value !== '0x0'
          ? `ETH ${formatEther(BigInt(node.value || '0'))} `
          : ''

      const formatArgValue = (value: unknown): string => {
        if (typeof value === 'bigint') {
          return value.toString()
        }
        if (typeof value === 'string' && value.length > 68) {
          return `${value.slice(0, 64)}...${value.slice(-4)}`
        }
        return String(value)
      }

      return (
        <div key={nodeId} className="py-1">
          <div className="flex items-center space-x-1">
            {hasChildren && (
              <button
                onClick={() => toggleNode(nodeId)}
                className="focus:outline-none"
                type="button"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <span className="w-3" />}
            <div className="font-mono text-xs whitespace-nowrap">
              <span className={callTypeColor}>{callTypeStr}</span>
              <span className={colorMap.gasUsed}>[{gasUsed}]: </span>
              <span className={colorMap.ethValue}>{ethValue}</span>
              <span className={colorMap.contractName}>({contractName}).</span>
              <span className={colorMap.functionName}>
                {decodedCall.functionName}
              </span>
              <span>(</span>
              <span>
                {Object.entries(decodedCall.args).map(
                  ([key, value], index, arr) => (
                    <span key={key}>
                      <span className={colorMap.argName}>{key}</span>
                      <span>=</span>
                      <span className={colorMap.argValue}>
                        {formatArgValue(value)}
                      </span>
                      {index < arr.length - 1 && <span>, </span>}
                    </span>
                  ),
                )}
              </span>
              <span>{') => ('}</span>
              <span className={colorMap.output}>{decodedCall.output}</span>
              <span>)</span>
            </div>
          </div>
          {!isCollapsed && hasChildren && (
            <div className="border-l border-gray-300 ml-1 pl-2 mt-1">
              {node.calls?.map((childNode, index) =>
                renderNode(childNode, `${nodeId}-${index}`, depth + 1),
              )}
            </div>
          )}
        </div>
      )
    },
    [
      collapsedNodes,
      contractInfo,
      decodedFunctions,
      decodeFunctionCall,
      toggleNode,
    ],
  )

  const renderedTree = useMemo(() => {
    if (decodedFunctions) {
      return renderNode(trace, 'root', 0)
    }
    return null
  }, [decodedFunctions, renderNode, trace])

  if (isLoading || isLoadingContract) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Transaction Trace</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="whitespace-nowrap">{renderedTree}</div>
      </CardContent>
    </Card>
  )
}

export default CallTraceVisualization
