import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { whatsabi } from '@shazow/whatsabi'
import { ConnectKitButton } from 'connectkit'
import { useState } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { useAccount, useWalletClient } from 'wagmi'

const ContractInteraction: React.FC = () => {
  const [address, setAddress] = useState('')
  const [abi, setAbi] = useState<any>(null)
  const [readFunctions, setReadFunctions] = useState<any[]>([])
  const [writeFunctions, setWriteFunctions] = useState<any[]>([])
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [functionInputs, setFunctionInputs] = useState<
    Record<string, string[]>
  >({})

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  )
  const [results, setResults] = useState<Record<string, string>>({})
  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, boolean>
  >({})
  const [isFetchingAbi, setIsFetchingAbi] = useState(false)

  const { address: walletAddress, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const fetchABI = async () => {
    setIsFetchingAbi(true)
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(),
      })

      const result = await whatsabi.autoload(address as `0x${string}`, {
        provider: client,
        followProxies: true,
        onProgress: (phase) => console.log('autoload progress', phase),
        onError: (phase, context) =>
          console.error('autoload error', phase, context),
      })

      setAbi(result.abi)
      setReadFunctions(
        result.abi.filter(
          (item: any) =>
            item.type === 'function' &&
            (item.stateMutability === 'view' ||
              item.stateMutability === 'pure'),
        ),
      )
      setWriteFunctions(
        result.abi.filter(
          (item: any) =>
            item.type === 'function' &&
            item.stateMutability !== 'view' &&
            item.stateMutability !== 'pure',
        ),
      )
      setResolvedAddress(result.address)

      console.log('Full result:', result)
    } catch (error) {
      console.error('Error fetching ABI:', error)
    } finally {
      setIsFetchingAbi(false)
    }
  }

  const callReadFunction = async (func: any) => {
    setLoadingStates((prev) => ({ ...prev, [func.name]: true }))
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(),
      })

      const args = func.inputs.map(
        (_: any, index: number) => functionInputs[func.name]?.[index] || '',
      )
      const result = await client.readContract({
        address: resolvedAddress as `0x${string}`,
        abi: [func],
        functionName: func.name,
        args,
      })
      setResults((prev) => ({ ...prev, [func.name]: JSON.stringify(result) }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [func.name]: `Error: ${error.message}`,
      }))
    } finally {
      setLoadingStates((prev) => ({ ...prev, [func.name]: false }))
    }
  }

  const callWriteFunction = async (func: any) => {
    if (!isConnected || !walletClient) {
      console.error('Wallet not connected')
      return
    }

    setLoadingStates((prev) => ({ ...prev, [func.name]: true }))
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(),
      })

      const args = func.inputs.map(
        (_: any, index: number) => functionInputs[func.name]?.[index] || '',
      )
      const { request } = await client.simulateContract({
        account: walletAddress,
        address: resolvedAddress as `0x${string}`,
        abi: [func],
        functionName: func.name,
        args,
      })
      const hash = await walletClient.writeContract(request)
      setResults((prev) => ({
        ...prev,
        [func.name]: `Transaction hash: ${hash}`,
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [func.name]: `Error: ${error.message}`,
      }))
    } finally {
      setLoadingStates((prev) => ({ ...prev, [func.name]: false }))
    }
  }

  const handleInputChange = (
    funcName: string,
    index: number,
    value: string,
  ) => {
    setFunctionInputs((prev) => ({
      ...prev,
      [funcName]: {
        ...prev[funcName],
        [index]: value,
      },
    }))
  }

  const demoAddresses = [
    { name: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Contract Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button onClick={fetchABI} disabled={isFetchingAbi}>
          {isFetchingAbi ? 'Loading...' : 'Load Contract'}
        </Button>
      </div>
      {resolvedAddress && resolvedAddress !== address && (
        <p>Resolved to: {resolvedAddress}</p>
      )}
      <ConnectKitButton />
      {readFunctions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Read Functions</CardTitle>
          </CardHeader>
          <CardContent>
            {readFunctions.map((func, index) => (
              <div key={index} className="mb-4">
                <Button
                  onClick={() =>
                    setExpandedFunctions((prev) => ({
                      ...prev,
                      [func.name]: !prev[func.name],
                    }))
                  }
                  className="w-full justify-between"
                >
                  {func.name}
                  <span>{expandedFunctions[func.name] ? '▲' : '▼'}</span>
                </Button>
                {expandedFunctions[func.name] && (
                  <div className="mt-2">
                    {func.inputs.map((input: any, inputIndex: number) => (
                      <Input
                        key={inputIndex}
                        type="text"
                        placeholder={`${input.name} (${input.type})`}
                        onChange={(e) =>
                          handleInputChange(
                            func.name,
                            inputIndex,
                            e.target.value,
                          )
                        }
                        className="mt-2"
                      />
                    ))}
                    <Button
                      onClick={() => callReadFunction(func)}
                      className="mt-2"
                      disabled={loadingStates[func.name]}
                    >
                      {loadingStates[func.name] ? 'Loading...' : 'Call'}
                    </Button>
                    {results[func.name] && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p>Result: {results[func.name]}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {writeFunctions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Write Functions</CardTitle>
          </CardHeader>
          <CardContent>
            {writeFunctions.map((func, index) => (
              <div key={index} className="mb-4">
                <Button
                  onClick={() =>
                    setExpandedFunctions((prev) => ({
                      ...prev,
                      [func.name]: !prev[func.name],
                    }))
                  }
                  className="w-full justify-between"
                >
                  {func.name}
                  <span>{expandedFunctions[func.name] ? '▲' : '▼'}</span>
                </Button>
                {expandedFunctions[func.name] && (
                  <div className="mt-2">
                    {func.inputs.map((input: any, inputIndex: number) => (
                      <Input
                        key={inputIndex}
                        type="text"
                        placeholder={`${input.name} (${input.type})`}
                        onChange={(e) =>
                          handleInputChange(
                            func.name,
                            inputIndex,
                            e.target.value,
                          )
                        }
                        className="mt-2"
                      />
                    ))}
                    <Button
                      onClick={() => callWriteFunction(func)}
                      className="mt-2"
                      disabled={!isConnected || loadingStates[func.name]}
                    >
                      {loadingStates[func.name] ? 'Loading...' : 'Call'}
                    </Button>
                    {results[func.name] && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p>Result: {results[func.name]}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContractInteraction
