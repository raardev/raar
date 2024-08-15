import JsonView from '@/components/JsonView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const commonMethods = [
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getTransactionCount',
  'eth_getBlockByNumber',
  'eth_getTransactionByHash',
]

const defaultParams = {
  eth_blockNumber: '[]',
  eth_getBalance: '["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "latest"]',
  eth_getTransactionCount:
    '["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "latest"]',
  eth_getBlockByNumber: '["latest", false]',
  eth_getTransactionByHash:
    '["0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b"]',
}

const RPCTool: React.FC = () => {
  const [rpcUrl, setRpcUrl] = useState('')
  const [params, setParams] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [latencies, setLatencies] = useState<
    { time: number; latency: number }[]
  >([])
  const [isPinging, setIsPinging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentMethod, setCurrentMethod] = useState('eth_blockNumber')

  useEffect(() => {
    if (currentMethod && defaultParams[currentMethod]) {
      setParams(defaultParams[currentMethod])
    }
  }, [currentMethod])

  const sendRequest = async (isPingRequest = false) => {
    try {
      const startTime = Date.now()
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: currentMethod,
          params: JSON.parse(params),
        }),
      })
      const endTime = Date.now()
      const newLatency = endTime - startTime
      setLatency(newLatency)
      if (isPingRequest) {
        setLatencies((prev) => {
          const newLatencies = [...prev, { time: endTime, latency: newLatency }]
          return newLatencies.slice(-60) // Keep last 60 seconds of data
        })
      }
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const handleSendRequest = async () => {
    setIsLoading(true)
    await sendRequest()
    setIsLoading(false)
  }

  const togglePing = () => {
    if (isPinging) {
      setIsPinging(false)
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    } else {
      setIsPinging(true)
      setLatencies([]) // Clear previous latencies
      sendRequest(true) // Initial request
      pingIntervalRef.current = setInterval(() => {
        sendRequest(true)
      }, 1000) // Ping every 1 second
    }
  }

  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">RPC Tool</h2>
      <Input
        type="text"
        value={rpcUrl}
        onChange={(e) => setRpcUrl(e.target.value)}
        placeholder="RPC URL"
      />
      <div className="flex space-x-2">
        <Select onValueChange={setCurrentMethod} value={currentMethod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {commonMethods.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={currentMethod}
          onChange={(e) => setCurrentMethod(e.target.value)}
          placeholder="Custom method"
        />
      </div>
      <Textarea
        value={params}
        onChange={(e) => setParams(e.target.value)}
        placeholder="Params (JSON)"
        className="font-mono"
      />
      <div className="flex space-x-2">
        <Button onClick={handleSendRequest} disabled={isLoading || isPinging}>
          {isLoading ? 'Sending...' : 'Send Request'}
        </Button>
        <Button onClick={togglePing} variant="secondary" disabled={isLoading}>
          {isPinging ? 'Stop Pinging' : 'Start Pinging'}
        </Button>
      </div>
      {latency !== null && (
        <div className="text-sm text-muted-foreground">
          Latest Latency: {latency}ms
        </div>
      )}
      {isPinging && latencies.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencies}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(unixTime) =>
                  new Date(unixTime).toLocaleTimeString()
                }
                domain={['auto', 'auto']}
                type="number"
                scale="time"
              />
              <YAxis domain={[0, 'auto']} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value) => [`${value}ms`, 'Latency']}
              />
              <Legend />
              <Line
                type="linear"
                dataKey="latency"
                stroke="#8884d8"
                name="Latency (ms)"
                isAnimationActive={false}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {response && (
        <div className="bg-muted p-4 rounded overflow-auto max-h-60">
          <JsonView data={response} />
        </div>
      )}
    </div>
  )
}

export default RPCTool
