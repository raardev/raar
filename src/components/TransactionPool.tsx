import RPCInput from '@/components/RPCInput'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VirtualizedDataTable } from '@/components/VirtualizedDataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Database, FuelIcon, Hash, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState, useEffect } from 'react'
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
  const [diagnostics, setDiagnostics] = useState<{ check: string; passed: boolean; message: string }[]>([])

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

  const runDiagnostics = useCallback(() => {
    if (!stats || transactions.length === 0) return

    const checks = [
      {
        check: "Nonce Check",
        passed: transactions.every((tx, i, arr) => i === 0 || tx.nonce >= arr[i-1].nonce),
        message: "Transactions are ordered by nonce"
      },
      {
        check: "Gas Price Check",
        passed: transactions.every(tx => tx.gasPrice >= stats.minGasPrice),
        message: "All transactions meet minimum gas price"
      },
      {
        check: "Pending vs Queued",
        passed: stats.pendingCount > 0,
        message: stats.pendingCount > 0 ? "There are pending transactions" : "No pending transactions, all may be queued"
      },
      {
        check: "Gas Limit Check",
        passed: transactions.every(tx => tx.gas <= 30000000n), // Example max gas limit
        message: "All transactions are within gas limit"
      },
      {
        check: "Gas Price Competitiveness",
        passed: transactions.every(tx => tx.gasPrice >= stats.avgGasPrice),
        message: transactions.every(tx => tx.gasPrice >= stats.avgGasPrice)
          ? "All transactions have competitive gas prices"
          : "Some transactions may have low gas prices"
      },
      {
        check: "Transaction Variety",
        passed: new Set(transactions.map(tx => tx.from)).size > 1,
        message: new Set(transactions.map(tx => tx.from)).size > 1
          ? "Transactions are from multiple addresses"
          : "All transactions are from the same address"
      },
      {
        check: "Large Value Transactions",
        passed: !transactions.some(tx => tx.value > 1000000000000000000n), // > 1 ETH
        message: !transactions.some(tx => tx.value > 1000000000000000000n)
          ? "No unusually large value transactions detected"
          : "There are transactions with large ETH values"
      },
      {
        check: "Contract Interactions",
        passed: transactions.some(tx => tx.input !== '0x'),
        message: transactions.some(tx => tx.input !== '0x')
          ? "There are transactions interacting with contracts"
          : "No contract interactions detected"
      },
      {
        check: "Nonce Gaps",
        passed: !transactions.some((tx, i, arr) => i > 0 && tx.nonce > arr[i-1].nonce + 1),
        message: !transactions.some((tx, i, arr) => i > 0 && tx.nonce > arr[i-1].nonce + 1)
          ? "No nonce gaps detected"
          : "There are nonce gaps in the transaction sequence"
      },
      {
        check: "Transaction Pool Fullness",
        passed: stats.totalTransactions < 4096, // Example max pool size
        message: stats.totalTransactions < 4096
          ? "Transaction pool is not full"
          : "Transaction pool is approaching or at capacity"
      },
      {
        check: "Low Gas Price Transactions",
        passed: !transactions.some(tx => tx.gasPrice < (stats.avgGasPrice * 8n) / 10n),
        message: transactions.some(tx => tx.gasPrice < (stats.avgGasPrice * 8n) / 10n)
          ? "Some transactions have significantly low gas prices"
          : "All transactions have reasonable gas prices"
      },
      {
        check: "Repeated Sender",
        passed: !transactions.some((tx, i, arr) => 
          arr.filter(t => t.from === tx.from).length > arr.length * 0.1),
        message: transactions.some((tx, i, arr) => 
          arr.filter(t => t.from === tx.from).length > arr.length * 0.1)
          ? "One address is sending a large number of transactions"
          : "Transactions are well distributed among senders"
      },
      {
        check: "Network Congestion",
        passed: stats.pendingCount < 1000, // Adjust this threshold as needed
        message: stats.pendingCount < 1000
          ? "Network doesn't seem congested"
          : "Network might be congested, causing delays"
      },
      {
        check: "Nonce Sequence",
        passed: transactions.every((tx, i, arr) => 
          i === 0 || tx.from !== arr[i-1].from || tx.nonce === arr[i-1].nonce + 1),
        message: transactions.every((tx, i, arr) => 
          i === 0 || tx.from !== arr[i-1].from || tx.nonce === arr[i-1].nonce + 1)
          ? "Transactions from each address are in correct nonce sequence"
          : "There might be nonce issues for some addresses"
      },
      {
        check: "High Gas Limit Transactions",
        passed: !transactions.some(tx => tx.gas > 1000000n),
        message: transactions.some(tx => tx.gas > 1000000n)
          ? "Some transactions have unusually high gas limits"
          : "All transactions have reasonable gas limits"
      }
    ]

    setDiagnostics(checks)
  }, [stats, transactions])

  useEffect(() => {
    if (stats && transactions.length > 0) {
      runDiagnostics()
    }
  }, [stats, transactions, runDiagnostics])

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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Transaction Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics.length > 0 ? (
            <>
              <ul className="space-y-2">
                {diagnostics.map((item, index) => (
                  <li key={index} className="flex items-center">
                    {item.passed ? (
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 mr-2 text-red-500" />
                    )}
                    <span>{item.check}: {item.message}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <h4 className="font-semibold">Potential Reasons for Pending Transactions:</h4>
                <ul className="list-disc list-inside mt-2">
                  {!diagnostics.find(d => d.check === "Gas Price Check")?.passed && 
                    <li>Some transactions have gas prices below the network's current minimum</li>}
                  {!diagnostics.find(d => d.check === "Low Gas Price Transactions")?.passed && 
                    <li>Some transactions have significantly low gas prices compared to the average</li>}
                  {!diagnostics.find(d => d.check === "Network Congestion")?.passed && 
                    <li>The network appears to be congested, which may cause delays</li>}
                  {!diagnostics.find(d => d.check === "Nonce Sequence")?.passed && 
                    <li>There might be nonce issues for some addresses, blocking subsequent transactions</li>}
                  {!diagnostics.find(d => d.check === "High Gas Limit Transactions")?.passed && 
                    <li>Some transactions have unusually high gas limits, which may delay their inclusion in blocks</li>}
                  {!diagnostics.find(d => d.check === "Repeated Sender")?.passed && 
                    <li>One address is sending a large number of transactions, which might cause delays</li>}
                </ul>
              </div>
            </>
          ) : (
            <p>Run a transaction pool query to see diagnostics.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionPool
