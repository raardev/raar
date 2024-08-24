import type { ValueChange, TransactionInfo } from '@/types/transaction'
import { fetchValueChanges, formatTransactionInfo } from '@/utils/transactionUtils'
import { useState } from 'react'
import { toast } from 'sonner'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import ChangesList from './ChangesList'
import TransactionForm from './TransactionForm'
import TransactionInfoCard from './TransactionInfoCard'
import CopyableShortText from './CopyableShortText'

const TransactionTracer: React.FC = () => {
  const [txHash, setTxHash] = useState('')
  const [transactionInfo, setTransactionInfo] = useState<TransactionInfo | null>(null)
  const [valueChanges, setValueChanges] = useState<ValueChange[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const demoTxHash = '0x1a62fa4fba30fa68e9ecf4606eda41ccefd12eee297b4123a6743fae8dac0cd8'

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

      const transaction = await client.getTransaction({ hash: hash as `0x${string}` })
      const receipt = await client.getTransactionReceipt({ hash: hash as `0x${string}` })

      setTransactionInfo(formatTransactionInfo(transaction))
      setValueChanges(await fetchValueChanges(client, transaction, receipt))
    } catch (error) {
      console.error('Error tracing transaction:', error)
      toast.error('Error tracing transaction. Please check the transaction hash and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoClick = () => {
    setTxHash(demoTxHash)
    traceTransaction(demoTxHash)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Transaction Tracer</h1>
      <div className="space-y-6">
        <TransactionForm
          txHash={txHash}
          setTxHash={setTxHash}
          traceTransaction={traceTransaction}
          handleDemoClick={handleDemoClick}
          isLoading={isLoading}
        />
        {transactionInfo && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-2">Transaction Hash:</h2>
              <CopyableShortText text={transactionInfo.hash} maxLength={16} />
            </div>
            <TransactionInfoCard transactionInfo={transactionInfo} />
          </div>
        )}
        <ChangesList title="Value Changes" changes={valueChanges} />
      </div>
    </div>
  )
}

export default TransactionTracer