import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { formatEther, TransactionResponse } from 'viem'
import { TraceResult } from './extended-client'

interface TransactionViewProps {
  data: TransactionResponse & { trace: TraceResult }
  searchTerm: string
}

const TransactionView: React.FC<TransactionViewProps> = ({
  data,
  searchTerm,
}) => {
  if (!data) return null

  console.log('data', data)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transaction {searchTerm}</h2>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">From</TableCell>
            <TableCell>{data.from}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">To</TableCell>
            <TableCell>{data.to}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Value</TableCell>
            <TableCell>{formatEther(data.value)} ETH</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Gas Price</TableCell>
            <TableCell>{formatEther(data.gasPrice)} ETH</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Gas</TableCell>
            <TableCell>{data.gas.toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Nonce</TableCell>
            <TableCell>{data.nonce}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Block Number</TableCell>
            <TableCell>{data.blockNumber}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Transaction Index</TableCell>
            <TableCell>{data.transactionIndex}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <h3 className="text-xl font-bold mt-4 mb-2">Transaction Trace</h3>
      <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
        {JSON.stringify(data.trace, null, 2)}
      </pre>
    </div>
  )
}

export default TransactionView
