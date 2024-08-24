import type { TransactionInfo, ValueChange } from '@/types/transaction'
import {
  fetchValueChanges,
  formatTransactionInfo,
} from '@/utils/transactionUtils'
import { useState } from 'react'
import { toast } from 'sonner'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import ChangesList from './ChangesList'
import TransactionForm from './TransactionForm'
import TransactionInfoCard from './TransactionInfoCard'

const TransactionTracer: React.FC = () => {
  const [txHash, setTxHash] = useState('')
  const [transactionInfo, setTransactionInfo] =
    useState<TransactionInfo | null>(null)
  const [valueChanges, setValueChanges] = useState<ValueChange[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const demoTxHash =
    '0x1a62fa4fba30fa68e9ecf4606eda41ccefd12eee297b4123a6743fae8dac0cd8'

  const traceTransaction = async (hash: string) => {
    if (!hash) {
      toast.error('Please enter a transaction hash')
      return
    }

    setIsLoading(true)
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(),
      })

      const transaction = await client.getTransaction({
        hash: hash as `0x${string}`,
      })
      const receipt = await client.getTransactionReceipt({
        hash: hash as `0x${string}`,
      })

      setTransactionInfo(formatTransactionInfo(transaction))
      setValueChanges(await fetchValueChanges(client, transaction, receipt))
    } catch (error) {
      console.error('Error tracing transaction:', error)
      toast.error(
        'Error tracing transaction. Please check the transaction hash and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoClick = () => {
    setTxHash(demoTxHash)
    traceTransaction(demoTxHash)
  }

  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-bold mb-6">Transaction Tracer</h1>
      <div className="space-y-6">
        <TransactionForm
          txHash={txHash}
          setTxHash={setTxHash}
          traceTransaction={traceTransaction}
          handleDemoClick={handleDemoClick}
          isLoading={isLoading}
        />
        {transactionInfo && (
          <TransactionInfoCard transactionInfo={transactionInfo} />
        )}
        <ChangesList title="Value Changes" changes={valueChanges} />
      </div>
    </div>
  )
}

export default TransactionTracer
