import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { invoke } from '@tauri-apps/api/tauri'
import {
  AlertCircleIcon,
  CopyIcon,
  GitForkIcon,
  Loader2,
  PickaxeIcon,
  PlayIcon,
  RotateCcwIcon,
  SendIcon,
  StopCircleIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Chain } from 'viem'
import {
  createPublicClient,
  createWalletClient,
  formatGwei,
  http,
  parseEther,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import RPCInput from './RPCInput'

interface DevnetInfo {
  rpc_url: string
  chain_id: number
  addresses: string[]
  private_keys: string[]
}

interface DevnetStatus {
  latestBlockNumber: bigint
  gasPrice: string
  clientVersion: string
}

const DevnetTool: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [showForkInput, setShowForkInput] = useState(false)
  const [forkUrl, setForkUrl] = useState('')
  const [devnetInfo, setDevnetInfo] = useState<DevnetInfo | null>(null)
  const [devnetStatus, setDevnetStatus] = useState<DevnetStatus | null>(null)
  const [isForking, setIsForking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [client, setClient] = useState<ReturnType<
    typeof createPublicClient
  > | null>(null)
  const [walletClient, setWalletClient] = useState<ReturnType<
    typeof createWalletClient
  > | null>(null)
  const [resetBlockNumber, setResetBlockNumber] = useState<number | null>(null)
  const [mineBlockCount, setMineBlockCount] = useState(1)
  const [showMineConfig, setShowMineConfig] = useState(false)
  const [showResetConfig, setShowResetConfig] = useState(false)
  const [showSendTxConfig, setShowSendTxConfig] = useState(false)
  const [txAmount, setTxAmount] = useState('0.1')
  const [txRecipient, setTxRecipient] = useState('')
  const [txCount, setTxCount] = useState(10)
  const [txProgress, setTxProgress] = useState(0)
  const [isSendingBatch, setIsSendingBatch] = useState(false)
  const [showBatchTxConfig, setShowBatchTxConfig] = useState(false)
  const [fromAddress, setFromAddress] = useState('')
  const [isMining, setIsMining] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSendingTx, setIsSendingTx] = useState(false)

  const fetchDevnetInfo = useCallback(async () => {
    try {
      const info = (await invoke('get_devnet_info')) as DevnetInfo
      setDevnetInfo(info)
      setIsRunning(true)
      setErrorMessage(null)

      const devnetChain: Chain = {
        id: info.chain_id,
        name: 'Devnet',
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
        rpcUrls: {
          default: { http: [info.rpc_url] },
          public: { http: [info.rpc_url] },
        },
      }

      const newClient = createPublicClient({
        chain: devnetChain,
        transport: http(),
      })
      setClient(newClient)

      const privateKey = info.private_keys[0].startsWith('0x')
        ? info.private_keys[0]
        : `0x${info.private_keys[0]}`

      const account = privateKeyToAccount(privateKey as `0x${string}`)
      const newWalletClient = createWalletClient({
        account,
        chain: devnetChain,
        transport: http(),
      })
      setWalletClient(newWalletClient)

      const [latestBlockNumber, gasPrice, clientVersion] = await Promise.all([
        newClient.getBlockNumber(),
        newClient.getGasPrice(),
        newClient.request({ method: 'web3_clientVersion' }),
      ])

      setDevnetStatus({
        latestBlockNumber,
        gasPrice: formatGwei(gasPrice),
        clientVersion,
      })
    } catch (error) {
      console.error('Failed to fetch devnet info:', error)
      setDevnetInfo(null)
      setDevnetStatus(null)
      setIsRunning(false)
      setClient(null)
      setWalletClient(null)
      setErrorMessage(String(error))
    }
  }, [])

  useEffect(() => {
    const fetchDevnetStatus = async () => {
      const status = await invoke('get_devnet_status')
      setIsRunning(status as boolean)
    }

    fetchDevnetStatus()
  }, [])

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(fetchDevnetInfo, 5000)
      return () => clearInterval(interval)
    }
  }, [isRunning, fetchDevnetInfo])

  const startDevnet = async () => {
    setIsStarting(true)
    setErrorMessage(null)
    try {
      const info = (await invoke('start_devnet')) as DevnetInfo
      setDevnetInfo(info)
      setIsRunning(true)
      toast.success('Devnet started successfully')
      fetchDevnetInfo()
    } catch (error) {
      console.error('Failed to start devnet:', error)
      setErrorMessage(String(error))
      toast.error(`Failed to start devnet: ${error}`)
    } finally {
      setIsStarting(false)
    }
  }

  const stopDevnet = async () => {
    try {
      await invoke('stop_devnet')
      setIsRunning(false)
      setDevnetInfo(null)
      setDevnetStatus(null)
      setClient(null)
      toast.success('Devnet stopped successfully')
    } catch (error) {
      console.error('Failed to stop devnet:', error)
      toast.error('Failed to stop devnet')
    }
  }

  const forkNetwork = async () => {
    setIsForking(true)
    setErrorMessage(null)
    try {
      await invoke('fork_network', { url: forkUrl })
      setIsRunning(true)
      await fetchDevnetInfo()
      toast.success('Network forked successfully')
    } catch (error) {
      console.error('Failed to fork network:', error)
      setErrorMessage(String(error))
      toast.error(`Failed to fork network: ${error}`)
    } finally {
      setIsForking(false)
      setShowForkInput(false)
    }
  }

  const mineBlock = async () => {
    if (!client) return
    setIsMining(true)
    try {
      await client.request({
        method: 'anvil_mine',
        params: [mineBlockCount.toString(), '0x0'],
      })
      toast.success(`${mineBlockCount} block(s) mined successfully`)
      fetchDevnetInfo()
    } catch (error) {
      console.error('Failed to mine blocks:', error)
      toast.error(`Failed to mine blocks: ${error}`)
    } finally {
      setIsMining(false)
    }
  }

  const resetDevnet = async () => {
    if (!client) return
    setIsResetting(true)
    try {
      const params: [
        { forking?: { jsonRpcUrl?: string; blockNumber?: number } },
      ] = [{}]
      if (resetBlockNumber !== null) {
        params[0].forking = {
          jsonRpcUrl: devnetInfo?.rpc_url,
          blockNumber: resetBlockNumber,
        }
      }
      await client.request({ method: 'anvil_reset', params })
      toast.success('Devnet reset successfully')
      fetchDevnetInfo()
    } catch (error) {
      console.error('Failed to reset devnet:', error)
      toast.error(`Failed to reset devnet: ${error}`)
    } finally {
      setIsResetting(false)
    }
  }

  const sendTransaction = async () => {
    if (!walletClient || !devnetInfo) {
      console.warn('walletClient or devnetInfo is null')
      return
    }
    setIsSendingTx(true)
    try {
      // @ts-ignore
      const tx = await walletClient.sendTransaction({
        to: txRecipient as `0x${string}`,
        value: parseEther(txAmount),
      })
      toast.success(`Transaction sent: ${tx}`)
      fetchDevnetInfo()
    } catch (error) {
      console.error('Failed to send transaction:', error)
      toast.error(`Failed to send transaction: ${error}`)
    } finally {
      setIsSendingTx(false)
    }
  }

  const sendBatchTransactions = async () => {
    if (!walletClient || !devnetInfo) return

    setTxProgress(0)
    setIsSendingBatch(true)
    const recipientAddress = devnetInfo.addresses[1]

    for (let i = 0; i < txCount; i++) {
      try {
        // @ts-ignore
        await walletClient.sendTransaction({
          to: recipientAddress as `0x${string}`,
          value: parseEther('0.01'),
        })
        setTxProgress((prev) => prev + 1)
      } catch (error) {
        console.error(`Failed to send transaction ${i + 1}:`, error)
      }
    }

    setIsSendingBatch(false)
    toast.success(
      `${txProgress} out of ${txCount} transactions sent successfully`,
    )
    fetchDevnetInfo()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('Copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy:', err)
        toast.error('Failed to copy to clipboard')
      })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Devnet Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={isRunning ? stopDevnet : startDevnet}
              disabled={isStarting}
              variant={isRunning ? 'destructive' : 'default'}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isRunning ? (
                <StopCircleIcon className="h-4 w-4 mr-2" />
              ) : (
                <PlayIcon className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Stop Devnet' : 'Start Devnet'}
            </Button>
            <Button
              onClick={() => setShowForkInput(!showForkInput)}
              disabled={isRunning}
              variant="outline"
            >
              <GitForkIcon className="h-4 w-4 mr-2" />
              Fork Network
            </Button>
            {isRunning && (
              <>
                <Button
                  onClick={() => {
                    setShowMineConfig(!showMineConfig)
                    setShowResetConfig(false)
                    setShowSendTxConfig(false)
                    setShowBatchTxConfig(false)
                  }}
                  variant="outline"
                >
                  <PickaxeIcon className="h-4 w-4 mr-2" />
                  Mine Block(s)
                </Button>
                <Button
                  onClick={() => {
                    setShowResetConfig(!showResetConfig)
                    setShowMineConfig(false)
                    setShowSendTxConfig(false)
                    setShowBatchTxConfig(false)
                  }}
                  variant="outline"
                >
                  <RotateCcwIcon className="h-4 w-4 mr-2" />
                  Reset Devnet
                </Button>
                <Button
                  onClick={() => {
                    setShowSendTxConfig(!showSendTxConfig)
                    setShowMineConfig(false)
                    setShowResetConfig(false)
                    setShowBatchTxConfig(false)
                  }}
                  variant="outline"
                >
                  <SendIcon className="h-4 w-4 mr-2" />
                  Send Transaction
                </Button>
                <Button
                  onClick={() => {
                    setShowBatchTxConfig(!showBatchTxConfig)
                    setShowMineConfig(false)
                    setShowResetConfig(false)
                    setShowSendTxConfig(false)
                  }}
                  variant="outline"
                >
                  <SendIcon className="h-4 w-4 mr-2" />
                  Batch Transactions
                </Button>
              </>
            )}
          </div>

          {showForkInput && (
            <div className="mt-4 flex space-x-2">
              <RPCInput
                value={forkUrl}
                onChange={setForkUrl}
                placeholder="Enter network URL to fork"
              />
              <Button onClick={forkNetwork} disabled={!forkUrl || isForking}>
                {isForking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Fork
              </Button>
            </div>
          )}

          {isRunning && showMineConfig && (
            <div className="mt-4 flex items-end space-x-2">
              <div>
                <Label htmlFor="mineBlockCount">Blocks to mine:</Label>
                <Input
                  id="mineBlockCount"
                  type="number"
                  min="1"
                  value={mineBlockCount}
                  onChange={(e) =>
                    setMineBlockCount(Number.parseInt(e.target.value) || 1)
                  }
                  className="w-20"
                />
              </div>
              <Button onClick={mineBlock} variant="outline" disabled={isMining}>
                {isMining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mining...
                  </>
                ) : (
                  'Mine'
                )}
              </Button>
            </div>
          )}

          {isRunning && showResetConfig && (
            <div className="mt-4 flex items-end space-x-2">
              <div>
                <Label htmlFor="resetBlockNumber">
                  Reset to block (optional):
                </Label>
                <Input
                  id="resetBlockNumber"
                  type="number"
                  min="0"
                  value={resetBlockNumber === null ? '' : resetBlockNumber}
                  onChange={(e) =>
                    setResetBlockNumber(
                      e.target.value === ''
                        ? null
                        : Number.parseInt(e.target.value),
                    )
                  }
                  className="w-32"
                  placeholder="Latest"
                />
              </div>
              <Button
                onClick={resetDevnet}
                variant="outline"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset'
                )}
              </Button>
            </div>
          )}

          {isRunning && showSendTxConfig && (
            <div className="mt-4 space-y-2">
              <div>
                <Label htmlFor="fromAddress">From Address (optional):</Label>
                <Input
                  id="fromAddress"
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="0x... (leave empty for default)"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="txAmount">Amount (ETH):</Label>
                <Input
                  id="txAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-32"
                />
              </div>
              <div>
                <Label htmlFor="txRecipient">Recipient Address:</Label>
                <Input
                  id="txRecipient"
                  type="text"
                  value={txRecipient}
                  onChange={(e) => setTxRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full"
                />
              </div>
              <Button
                onClick={sendTransaction}
                variant="outline"
                disabled={!txRecipient || isSendingTx}
              >
                {isSendingTx ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          )}

          {isRunning && showBatchTxConfig && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="txCount">Number of Transactions:</Label>
                <Input
                  id="txCount"
                  type="number"
                  min="1"
                  value={txCount}
                  onChange={(e) =>
                    setTxCount(Number.parseInt(e.target.value) || 1)
                  }
                  className="w-20"
                />
              </div>
              <div>
                <Label htmlFor="fromAddress">From Address (optional):</Label>
                <Input
                  id="fromAddress"
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="0x... (leave empty for default)"
                  className="w-full"
                />
              </div>
              <Button
                onClick={sendBatchTransactions}
                variant="outline"
                disabled={isSendingBatch}
              >
                {isSendingBatch ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Batch...
                  </>
                ) : (
                  'Send Batch'
                )}
              </Button>
              {txProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={(txProgress / txCount) * 100} />
                  <p>
                    {txProgress} out of {txCount} transactions sent
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 whitespace-pre-wrap">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {devnetInfo && devnetStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Devnet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">RPC URL</TableCell>
                  <TableCell className="flex justify-between items-center">
                    {devnetInfo.rpc_url}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(devnetInfo.rpc_url)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Latest Block</TableCell>
                  <TableCell>
                    {devnetStatus.latestBlockNumber.toString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Gas Price</TableCell>
                  <TableCell>{devnetStatus.gasPrice} Gwei</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Client Version</TableCell>
                  <TableCell>{devnetStatus.clientVersion}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {devnetInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Private Key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devnetInfo.addresses.map((address, index) => (
                  <TableRow key={address}>
                    <TableCell className="font-mono">{address}</TableCell>
                    <TableCell className="font-mono">
                      {devnetInfo.private_keys[index]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DevnetTool
