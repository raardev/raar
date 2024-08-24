import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TransactionFormProps {
  txHash: string
  setTxHash: (hash: string) => void
  traceTransaction: (hash: string) => void
  handleDemoClick: () => void
  isLoading: boolean
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  txHash,
  setTxHash,
  traceTransaction,
  handleDemoClick,
  isLoading,
}) => (
  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
    <Input
      type="text"
      value={txHash}
      onChange={(e) => setTxHash(e.target.value)}
      placeholder="Enter transaction hash"
      className="flex-grow"
    />
    <div className="flex space-x-2">
      <Button onClick={() => traceTransaction(txHash)} disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? 'Tracing...' : 'Trace'}
      </Button>
      <Button onClick={handleDemoClick} disabled={isLoading} variant="outline" className="w-full sm:w-auto">
        Demo
      </Button>
    </div>
  </div>
)

export default TransactionForm