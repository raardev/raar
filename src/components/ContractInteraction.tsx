import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { whatsabi } from '@shazow/whatsabi'
import { ConnectKitButton } from 'connectkit'
import type { ABIFunction } from 'node_modules/@shazow/whatsabi/lib.types/abi'
import { useState } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { useAccount, useWalletClient } from 'wagmi'
import RPCInput from './RPCInput'

const ContractInteraction: React.FC = () => {
  const [address, setAddress] = useState('')
  const [customRPC, setCustomRPC] = useState('')
  const [readFunctions, setReadFunctions] = useState<ABIFunction[]>([])
  const [writeFunctions, setWriteFunctions] = useState<ABIFunction[]>([])
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [functionInputs, setFunctionInputs] = useState<
    Record<string, string[]>
  >({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  )
  const [results, setResults] = useState<Record<string, string>>({})
  const [isFetchingAbi, setIsFetchingAbi] = useState(false)

  const { address: walletAddress, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const fetchABI = async () => {
    setIsFetchingAbi(true)
    try {
      const client = createPublicClient({
        transport: http(customRPC || undefined),
      })

      const result = await whatsabi.autoload(address as `0x${string}`, {
        provider: client,
        followProxies: true,
        onProgress: (phase) => console.log('autoload progress', phase),
        onError: (phase, context) =>
          console.error('autoload error', phase, context),
      })

      const functionAbi = result.abi.filter(
        (item): item is ABIFunction => item.type === 'function',
      )

      setReadFunctions(
        functionAbi.filter(
          (item) =>
            item.stateMutability === 'view' || item.stateMutability === 'pure',
        ),
      )
      setWriteFunctions(
        functionAbi.filter(
          (item) =>
            item.stateMutability !== 'view' && item.stateMutability !== 'pure',
        ),
      )
      setResolvedAddress(result.address)
    } catch (error) {
      console.error('Error fetching ABI:', error)
    } finally {
      setIsFetchingAbi(false)
    }
  }

  const callFunction = async (func: ABIFunction, isWrite: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [func.name as string]: true }))
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(customRPC || undefined),
      })

      const args = (func.inputs ?? []).map(
        (_, index) => functionInputs[func.name ?? '']?.[index] ?? '',
      )

      if (isWrite) {
        if (!isConnected || !walletClient) {
          throw new Error('Wallet not connected')
        }
        const { request } = await client.simulateContract({
          account: walletAddress,
          address: resolvedAddress as `0x${string}`,
          abi: [func],
          functionName: func.name ?? 'unknownFunction',
          args,
        })
        const hash = await walletClient.writeContract(request)
        setResults((prev) => ({
          ...prev,
          [func.name as string]: `Transaction hash: ${hash}`,
        }))
      } else {
        const result = await client.readContract({
          address: resolvedAddress as `0x${string}`,
          abi: [func],
          functionName: func.name ?? 'unknownFunction',
          args,
        })
        setResults((prev) => ({
          ...prev,
          [func.name as string]: formatResult(result, func.outputs),
        }))
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [func.name as string]: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }))
    } finally {
      setLoadingStates((prev) => ({ ...prev, [func.name as string]: false }))
    }
  }

  const formatResult = (
    result: unknown,
    outputs: ABIFunction['outputs'],
  ): string => {
    if (result === null || result === undefined) {
      return 'null'
    }

    if (typeof result === 'bigint') {
      return result.toString()
    }

    if (Array.isArray(result)) {
      // @ts-expect-error: outputs is not always defined
      return `[${result.map((item, index) => formatResult(item, outputs?.[index]?.components ?? [])).join(', ')}]`
    }

    if (typeof result === 'object') {
      const formattedObj: Record<string, string> = {}
      for (const [key, value] of Object.entries(result)) {
        formattedObj[key] = formatResult(
          value,
          // @ts-expect-error: outputs is not always defined
          outputs?.find((o) => o.name === key)?.components || [],
        )
      }
      return JSON.stringify(formattedObj, null, 2)
    }

    return String(result)
  }

  const handleInputChange = (
    funcName: string,
    index: number,
    value: string,
  ) => {
    setFunctionInputs((prev) => ({
      ...prev,
      [funcName]: { ...prev[funcName], [index]: value },
    }))
  }

  const renderFunctionInputs = (func: ABIFunction) => (
    <div className="space-y-2">
      {func.inputs?.map((input, inputIndex) => (
        <Input
          key={`${func.name}-${input.name}-${inputIndex}`}
          placeholder={`${input.name} (${input.type})`}
          onChange={(e) =>
            handleInputChange(
              func.name ?? 'unknownFunction',
              inputIndex,
              e.target.value,
            )
          }
        />
      ))}
    </div>
  )

  const renderFunctionItem = (func: ABIFunction, isWrite: boolean) => (
    <AccordionItem
      value={func.name ?? 'unknownFunction'}
      key={func.name ?? 'unknownFunction'}
    >
      <AccordionTrigger>{func.name ?? 'Unknown Function'}</AccordionTrigger>
      <AccordionContent>
        {renderFunctionInputs(func)}
        <Button
          onClick={() => callFunction(func, isWrite)}
          className="mt-2"
          disabled={
            (isWrite && !isConnected) ||
            loadingStates[func.name ?? 'unknownFunction']
          }
        >
          {loadingStates[func.name ?? 'unknownFunction']
            ? 'Loading...'
            : 'Call'}
        </Button>
        {results[func.name ?? 'unknownFunction'] && (
          <div className="mt-2 p-2 bg-muted rounded">
            <pre className="whitespace-pre-wrap break-words">
              <code>{results[func.name ?? 'unknownFunction']}</code>
            </pre>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rpc-input">RPC URL</Label>
          <RPCInput
            value={customRPC}
            onChange={setCustomRPC}
            placeholder="Enter custom RPC URL"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-input">Contract Address</Label>
          <div className="flex space-x-2">
            <Input
              id="address-input"
              placeholder="Contract Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button onClick={fetchABI} disabled={isFetchingAbi}>
              {isFetchingAbi ? 'Loading...' : 'Load'}
            </Button>
          </div>
        </div>
        {resolvedAddress && resolvedAddress !== address && (
          <p className="text-sm text-muted-foreground">
            Resolved to: {resolvedAddress}
          </p>
        )}
        <div className="flex justify-start">
          <ConnectKitButton />
        </div>
      </div>

      {readFunctions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Read Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {readFunctions.map((func) => renderFunctionItem(func, false))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {writeFunctions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Write Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {writeFunctions.map((func) => renderFunctionItem(func, true))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContractInteraction
