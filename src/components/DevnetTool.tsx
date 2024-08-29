import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { invoke } from '@tauri-apps/api/tauri'
import { Loader2, PlayIcon, StopCircleIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DevnetInfo {
  rpc_url: string
  chain_id: number
  client_version: string
  addresses: string[]
  private_keys: string[]
}

const DevnetTool: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [showForkInput, setShowForkInput] = useState(false)
  const [forkUrl, setForkUrl] = useState('')
  const [devnetInfo, setDevnetInfo] = useState<DevnetInfo | null>(null)
  const [isForking, setIsForking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchDevnetInfo = useCallback(async () => {
    try {
      const info = (await invoke('get_devnet_info')) as DevnetInfo
      setDevnetInfo(info)
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to fetch devnet info:', error)
      setDevnetInfo(null)
      setIsRunning(false)
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
    const fetchData = async () => {
      await fetchDevnetInfo()
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)

    return () => clearInterval(interval)
  }, [fetchDevnetInfo])

  const startDevnet = async () => {
    try {
      const info = (await invoke('start_devnet')) as DevnetInfo
      setDevnetInfo(info)
      setIsRunning(true)
      toast.success('Devnet started successfully')
    } catch (error) {
      console.error('Failed to start devnet:', error)
      toast.error('Failed to start devnet')
    }
  }

  const stopDevnet = async () => {
    try {
      await invoke('stop_devnet')
      setIsRunning(false)
      setDevnetInfo(null)
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
      setIsRunning(false)
    } finally {
      setIsForking(false)
      setShowForkInput(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button onClick={isRunning ? stopDevnet : startDevnet}>
          {isRunning ? (
            <>
              <StopCircleIcon className="mr-2 h-4 w-4" />
              Stop Devnet
            </>
          ) : (
            <>
              <PlayIcon className="mr-2 h-4 w-4" />
              Start Devnet
            </>
          )}
        </Button>
        <Button
          onClick={() => setShowForkInput(!showForkInput)}
          disabled={isRunning}
        >
          Fork Network
        </Button>
      </div>
      {showForkInput && (
        <div className="flex space-x-2">
          <Input
            type="text"
            value={forkUrl}
            onChange={(e) => setForkUrl(e.target.value)}
            placeholder="Enter network URL to fork"
            disabled={isForking}
          />
          <Button onClick={forkNetwork} disabled={!forkUrl || isForking}>
            {isForking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Forking...
              </>
            ) : (
              'Fork'
            )}
          </Button>
        </div>
      )}
      {errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{errorMessage}</p>
          </CardContent>
        </Card>
      )}
      {devnetInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">RPC URL:</span>
              <span>{devnetInfo.rpc_url}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Chain ID:</span>
              <span>{devnetInfo.chain_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Client Version:</span>
              <span>{devnetInfo.client_version}</span>
            </div>
          </CardContent>
        </Card>
      )}
      {isRunning && !devnetInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Devnet Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Devnet is running, but detailed information is not available.</p>
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
                    <TableCell>{address}</TableCell>
                    <TableCell>{devnetInfo.private_keys[index]}</TableCell>
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
