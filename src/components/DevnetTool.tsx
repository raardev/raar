import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState } from 'react'

interface Wallet {
  address: string
  privateKey: string
}

const DevnetTool: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [forkUrl, setForkUrl] = useState('')

  useEffect(() => {
    const fetchDevnetStatus = async () => {
      const status = await invoke('get_devnet_status')
      setIsRunning(status as boolean)
    }

    fetchDevnetStatus()
  }, [])

  const startDevnet = async () => {
    try {
      await invoke('start_devnet')
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to start devnet:', error)
    }
  }

  const stopDevnet = async () => {
    try {
      await invoke('stop_devnet')
      setIsRunning(false)
      setLogs([])
      setWallets([])
    } catch (error) {
      console.error('Failed to stop devnet:', error)
    }
  }

  const forkNetwork = async () => {
    try {
      await invoke('fork_network', { url: forkUrl })
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to fork network:', error)
    }
  }

  useEffect(() => {
    const fetchLogs = async () => {
      if (isRunning) {
        const newLogs = await invoke('get_devnet_logs')
        setLogs(newLogs as string[])
      }
    }

    const fetchWallets = async () => {
      if (isRunning) {
        const newWallets = await invoke('get_devnet_wallets')
        setWallets(newWallets as Wallet[])
      }
    }

    const interval = setInterval(() => {
      fetchLogs()
      fetchWallets()
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Devnet Tool</h2>
      <div className="flex space-x-2">
        <Button onClick={startDevnet} disabled={isRunning}>
          Start Devnet
        </Button>
        <Button onClick={stopDevnet} disabled={!isRunning}>
          Stop Devnet
        </Button>
      </div>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={forkUrl}
          onChange={(e) => setForkUrl(e.target.value)}
          placeholder="Enter network URL to fork"
        />
        <Button onClick={forkNetwork} disabled={isRunning || !forkUrl}>
          Fork Network
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Devnet Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-2 rounded h-40 overflow-auto">
            {logs.join('\n')}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Devnet Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {wallets.map((wallet, index) => (
              <li key={index}>
                <strong>Address:</strong> {wallet.address}
                <br />
                <strong>Private Key:</strong> {wallet.privateKey}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default DevnetTool
