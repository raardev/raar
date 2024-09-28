import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEther } from 'viem'
import type { TransactionList as TransactionListType } from './extended-client'

interface TransactionListProps {
  data: TransactionListType
  currentView: 'transactions' | 'addressTransactions'
  searchTerm: string
  currentPage: number
  setCurrentPage: (page: number) => void
}

const TransactionList: React.FC<TransactionListProps> = ({
  data,
  currentView,
  searchTerm,
  currentPage,
  setCurrentPage,
}) => {
  if (!data || !data.transactions) return <div>No transactions found.</div>

  console.log('TransactionList', data)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        {currentView === 'transactions'
          ? 'Block Transactions'
          : 'Address Transactions'}
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction Hash</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.transactions.map((tx) => (
            <TableRow key={tx.hash}>
              <TableCell>{tx.hash}</TableCell>
              <TableCell>{tx.from}</TableCell>
              <TableCell>{tx.to}</TableCell>
              <TableCell>
                {tx.value !== undefined ? formatEther(tx.value) : 'N/A'} ETH
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.nextPage !== null && (
        <Pagination
          currentPage={currentPage}
          totalPages={data.nextPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default TransactionList
