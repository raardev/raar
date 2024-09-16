import RPCInput from '@/components/RPCInput'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VirtualizedDataTable } from '@/components/VirtualizedDataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Database, FuelIcon, Hash, RefreshCw } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { createPublicClient, formatEther, formatUnits, http } from 'viem'
import { mainnet } from 'viem/chains'

interface TxPoolTransaction {
  hash: string
  from: string
  to: string
  value: bigint
  gasPrice: bigint
  gas: bigint
  nonce: number
  input: string
}

interface TxPoolStats {
  totalTransactions: number
  avgGasPrice: bigint
  minGasPrice: bigint
  maxGasPrice: bigint
  totalValue: bigint
  pendingCount: number
  queuedCount: number
}

interface RawTxPoolTransaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gas: string
  nonce: string
  input: string
}

const TransactionPool: React.FC = () => {
  const [transactions, setTransactions] = useState<TxPoolTransaction[]>([])
  const [stats, setStats] = useState<TxPoolStats | null>(null)
  const [gasPriceDistribution, setGasPriceDistribution] = useState<
    { range: string; count: number }[]
  >([])
  const [rpcUrl, setRpcUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const client = useMemo(() => {
    if (!rpcUrl) return null
    return createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    })
  }, [rpcUrl])

  const calculateGasPriceDistribution = (txs: TxPoolTransaction[]) => {
    const ranges = [0, 20, 40, 60, 80, 100, Number.POSITIVE_INFINITY]
    const distribution = ranges.slice(0, -1).map((min, i) => ({
      range: `${min}-${ranges[i + 1] === Number.POSITIVE_INFINITY ? '100+' : ranges[i + 1]}`,
      count: 0,
    }))

    for (const tx of txs) {
      const gasPrice = Number(formatUnits(tx.gasPrice, 9))
      const index = ranges.findIndex(
        (max, i) => gasPrice >= ranges[i] && gasPrice < ranges[i + 1],
      )
      if (index !== -1) distribution[index].count++
    }

    return distribution
  }

  const fetchMempoolData = useCallback(async () => {
    if (!rpcUrl || !client) {
      setError('No RPC URL provided or client not initialized')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [pendingTransactions, txpoolStatus] = await Promise.all([
        client.request({ method: 'txpool_content' }),
        client.request({ method: 'txpool_status' }),
      ])

      const txs: TxPoolTransaction[] = Object.values(
        pendingTransactions.pending,
      )
        .flatMap(Object.values)
        .map((tx: RawTxPoolTransaction) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: BigInt(tx.value),
          gasPrice: BigInt(tx.gasPrice),
          gas: BigInt(tx.gas),
          nonce: Number(tx.nonce),
          input: tx.input,
        }))

      setTransactions(txs)

      // Calculate stats
      const totalTxs = txs.length
      const totalGasPrice = txs.reduce((sum, tx) => sum + tx.gasPrice, 0n)
      const avgGasPrice = totalTxs > 0 ? totalGasPrice / BigInt(totalTxs) : 0n
      const minGasPrice = txs.reduce(
        (min, tx) => (tx.gasPrice < min ? tx.gasPrice : min),
        txs[0]?.gasPrice || 0n,
      )
      const maxGasPrice = txs.reduce(
        (max, tx) => (tx.gasPrice > max ? tx.gasPrice : max),
        0n,
      )
      const totalValue = txs.reduce((sum, tx) => sum + tx.value, 0n)

      setStats({
        totalTransactions: totalTxs,
        avgGasPrice,
        minGasPrice,
        maxGasPrice,
        totalValue,
        pendingCount: Number.parseInt(txpoolStatus.pending, 16),
        queuedCount: Number.parseInt(txpoolStatus.queued, 16),
      })

      // Calculate gas price distribution
      const distribution = calculateGasPriceDistribution(txs)
      setGasPriceDistribution(distribution)
    } catch (error) {
      console.error('Failed to fetch mempool data:', error)
      setError(`Failed to fetch mempool data: ${(error as Error).message}`)
      setTransactions([])
      setStats(null)
      setGasPriceDistribution([])
    } finally {
      setIsLoading(false)
    }
  }, [client, rpcUrl])

  const columns = useMemo<ColumnDef<TxPoolTransaction>[]>(
    () => [
      {
        accessorKey: 'index',
        header: '#',
        cell: (info) => info.row.index + 1,
        size: 50,
      },
      {
        accessorKey: 'hash',
        header: 'Hash',
        cell: (info) => `${info.getValue<string>().slice(0, 10)}...`,
        size: 100,
      },
      {
        accessorKey: 'from',
        header: 'From',
        cell: (info) => `${info.getValue<string>().slice(0, 10)}...`,
        size: 100,
      },
      {
        accessorKey: 'to',
        header: 'To',
        cell: (info) => `${info.getValue<string>().slice(0, 10)}...`,
        size: 100,
      },
      {
        accessorKey: 'value',
        header: 'Value (ETH)',
        cell: (info) => formatEther(info.getValue<bigint>()),
        size: 120,
      },
      {
        accessorKey: 'gasPrice',
        header: 'Gas Price (Gwei)',
        cell: (info) => formatUnits(info.getValue<bigint>(), 9),
        size: 120,
      },
      {
        accessorKey: 'gas',
        header: 'Gas Limit',
        cell: (info) => info.getValue<bigint>().toString(),
        size: 100,
      },
      {
        accessorKey: 'nonce',
        header: 'Nonce',
        cell: (info) => info.getValue<number>(),
        size: 80,
      },
      {
        accessorKey: 'input',
        header: 'Input Data',
        cell: (info) => `${info.getValue<string>().slice(0, 10)}...`,
        size: 100,
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <RPCInput
          value={rpcUrl}
          onChange={setRpcUrl}
          placeholder="Enter RPC URL"
          className="flex-grow"
        />
        <Button onClick={fetchMempoolData} disabled={!rpcUrl || isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Fetch Data
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Transaction Pool Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Txs:</span>
                  <span className="font-bold">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-bold">{stats.pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Queued:</span>
                  <span className="font-bold">{stats.queuedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Gas:</span>
                  <span className="font-bold">
                    {formatUnits(stats.avgGasPrice, 9)} Gwei
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min Gas:</span>
                  <span className="font-bold">
                    {formatUnits(stats.minGasPrice, 9)} Gwei
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Gas:</span>
                  <span className="font-bold">
                    {formatUnits(stats.maxGasPrice, 9)} Gwei
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>Total Value:</span>
                  <span className="font-bold">
                    {formatEther(stats.totalValue)} ETH
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FuelIcon className="w-5 h-5 mr-2" />
              Gas Price Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gasPriceDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Recent Transactions ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-auto">
            <VirtualizedDataTable columns={columns} data={transactions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionPool
