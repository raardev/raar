import { Button } from '@/components/ui/button'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { chains as allChains } from '@/config/chains'
import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { formatUnits } from 'viem'
import RPCInput from './RPCInput'
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

const REFRESH_INTERVAL = 30000 // 30 seconds

const MultiChainGasTracker: React.FC = () => {
  const [selectedChains, setSelectedChains] = useState<Chain[]>([])
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [newChainRPC, setNewChainRPC] = useState<string>('')

  const fetchGasPrices = useCallback(async () => {
    setIsLoading(true)
    const prices: GasPrice[] = []

    for (const chain of selectedChains) {
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
  }, [selectedChains])

  useEffect(() => {
    if (selectedChains.length > 0) {
      fetchGasPrices()
    }
  }, [fetchGasPrices, selectedChains])

  const handleAddChain = () => {
    const chainToAdd = allChains.find((chain) =>
      chain.rpc.includes(newChainRPC),
    )
    if (
      chainToAdd &&
      !selectedChains.some((c) => c.chainId === chainToAdd.chainId)
    ) {
      setSelectedChains([...selectedChains, chainToAdd])
      setNewChainRPC('')
    }
  }

  const handleRemoveChain = (chainId: number) => {
    setSelectedChains(selectedChains.filter((c) => c.chainId !== chainId))
  }

  // Sort gasPrices from lowest to highest
  const sortedGasPrices = [...gasPrices].sort((a, b) => a.price - b.price)

  // Prepare chart config
  const chartConfig: ChartConfig = Object.fromEntries(
    sortedGasPrices.map((gasPrice, index) => [
      gasPrice.chainName,
      {
        label: gasPrice.chainName,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      },
    ]),
  )

  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-2">
        <RPCInput
          value={newChainRPC}
          onChange={setNewChainRPC}
          placeholder="Enter RPC URL to add chain"
        />
        <Button onClick={handleAddChain} disabled={!newChainRPC}>
          Add Chain
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
        <RefreshCountdown
          interval={REFRESH_INTERVAL}
          onRefresh={fetchGasPrices}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs">Chain</TableHead>
              <TableHead className="h-8 text-xs">Gas Price (Gwei)</TableHead>
              <TableHead className="h-8 text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGasPrices.map((gasPrice) => (
              <TableRow
                key={gasPrice.chainName}
                className="h-10 hover:bg-muted/50"
              >
                <TableCell className="py-1 text-sm">
                  {gasPrice.chainName}
                </TableCell>
                <TableCell className="py-1 text-sm">
                  {gasPrice.price.toFixed(4)}
                </TableCell>
                <TableCell className="py-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() =>
                      handleRemoveChain(
                        selectedChains.find(
                          (c) => c.name === gasPrice.chainName,
                        )?.chainId || 0,
                      )
                    }
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ChartContainer config={chartConfig} className="mt-8 h-[400px]">
        <BarChart
          data={sortedGasPrices}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
        >
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey="chainName"
            type="category"
            width={100}
            tickLine={false}
            axisLine={false}
            fontSize={14}
          />
          <XAxis
            type="number"
            tickLine={false}
            tickMargin={8}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(2)}`}
            fontSize={14}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: 'transparent' }}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="price" radius={[0, 4, 4, 0]} barSize={24}>
            {sortedGasPrices.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(var(--chart-${(index % 5) + 1}))`}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export default MultiChainGasTracker
