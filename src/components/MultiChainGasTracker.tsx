import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatUnits } from 'viem'
import RefreshCountdown from './RefreshCountdown'

interface Chain {
  name: string
  chainId: number
  rpc: string[]
}

interface GasPrice {
  chainName: string
  price: number
}

const chains: Chain[] = [
  {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpc: ['https://eth.llamarpc.com'],
  },
  {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpc: ['https://bsc-dataseed.binance.org/'],
  },
  {
    name: 'Polygon',
    chainId: 137,
    rpc: ['https://polygon-rpc.com'],
  },
  {
    name: 'Arbitrum One',
    chainId: 42161,
    rpc: ['https://arb1.arbitrum.io/rpc'],
  },
  {
    name: 'Optimism',
    chainId: 10,
    rpc: ['https://mainnet.optimism.io'],
  },
]

const REFRESH_INTERVAL = 30000 // 30 seconds

const MultiChainGasTracker: React.FC = () => {
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchGasPrices = useCallback(async () => {
    setIsLoading(true)
    const prices: GasPrice[] = []

    for (const chain of chains) {
      try {
        const response = await fetch(chain.rpc[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
          }),
        })
        const data = await response.json()
        const gasPrice = Number.parseFloat(formatUnits(BigInt(data.result), 9))
        prices.push({ chainName: chain.name, price: gasPrice })
      } catch (error) {
        console.error(`Error fetching gas price for ${chain.name}:`, error)
      }
    }

    setGasPrices(prices)
    setLastUpdated(new Date())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchGasPrices()
  }, [fetchGasPrices])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Multi Chain Gas Tracker</CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <RefreshCountdown
            interval={REFRESH_INTERVAL}
            onRefresh={fetchGasPrices}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chain</TableHead>
              <TableHead>Gas Price (Gwei)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gasPrices.map((gasPrice) => (
              <TableRow key={gasPrice.chainName}>
                <TableCell>{gasPrice.chainName}</TableCell>
                <TableCell>{gasPrice.price.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="h-80 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={gasPrices}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="chainName" type="category" width={100} />
              <Tooltip />
              <Bar
                dataKey="price"
                fill="#8884d8"
                name="Gas Price (Gwei)"
                animationDuration={500}
                animationBegin={0}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default MultiChainGasTracker
