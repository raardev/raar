import { formatEther } from 'viem'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface AddressViewProps {
  data: any // TODO: Replace with a more specific type
  searchTerm: string
  setCurrentView: (view: 'addressTransactions') => void
  setCurrentPage: (page: number) => void
}

const AddressView: React.FC<AddressViewProps> = ({ 
  data, 
  searchTerm, 
  setCurrentView, 
  setCurrentPage 
}) => {
  if (!data) return null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Address {searchTerm}</h2>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Balance</TableCell>
            <TableCell>{formatEther(data.balance)} ETH</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Nonce</TableCell>
            <TableCell>{data.nonce}</TableCell>
          </TableRow>
          {data.contractInfo && (
            <>
              <TableRow>
                <TableCell className="font-medium">Contract Name</TableCell>
                <TableCell>{data.contractInfo.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Verified</TableCell>
                <TableCell>{data.contractInfo.verified ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
      <Button
        className="mt-4"
        onClick={() => {
          setCurrentView('addressTransactions')
          setCurrentPage(1)
        }}
      >
        View Transactions
      </Button>
    </div>
  )
}

export default AddressView