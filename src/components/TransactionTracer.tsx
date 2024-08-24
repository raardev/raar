import type { Action, TransactionInfo, ValueChange } from '@/types/transaction'
import {
  fetchValueChanges,
  formatTransactionInfo,
} from '@/utils/transactionUtils'
import { useState } from 'react'
import { toast } from 'sonner'
import { createPublicClient, formatEther, formatUnits, http } from 'viem'
import { mainnet } from 'viem/chains'
import ActionsList from './ActionsList'
import ChangesList from './ChangesList'
import TransactionForm from './TransactionForm'
import TransactionInfoCard from './TransactionInfoCard'

const TransactionTracer: React.FC = () => {
  const [txHash, setTxHash] = useState('')
  const [transactionInfo, setTransactionInfo] =
    useState<TransactionInfo | null>(null)
  const [valueChanges, setValueChanges] = useState<ValueChange[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [actions, setActions] = useState<Action[]>([])

  const demoTxHash =
    '0x1a62fa4fba30fa68e9ecf4606eda41ccefd12eee297b4123a6743fae8dac0cd8'

  const parseActions = (transaction: any, receipt: any): Action[] => {
    const actions: Action[] = []

    // ETH transfer
    if (transaction.value > 0n) {
      actions.push({
        type: 'transfer',
        amount: formatEther(transaction.value),
        token: 'ETH',
        from: transaction.from,
        to: transaction.to,
      })
    }

    // Token transfers
    const erc20TransferEventTopic =
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    const erc721TransferEventTopic =
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    const erc1155SingleTransferEventTopic =
      '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'
    const erc1155BatchTransferEventTopic =
      '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'

    for (const log of receipt.logs) {
      if (
        log.topics[0] === erc20TransferEventTopic &&
        log.topics.length === 3
      ) {
        // ERC20 transfer
        actions.push({
          type: 'transfer',
          amount: formatUnits(BigInt(log.data), 18), // Assuming 18 decimals
          token: log.address,
          from: `0x${log.topics[1].slice(-40)}`,
          to: `0x${log.topics[2].slice(-40)}`,
        })
      } else if (
        log.topics[0] === erc721TransferEventTopic &&
        log.topics.length === 4
      ) {
        // ERC721 transfer
        actions.push({
          type: 'transfer',
          amount: '1',
          token: log.address,
          from: `0x${log.topics[1].slice(-40)}`,
          to: `0x${log.topics[2].slice(-40)}`,
          tokenId: BigInt(log.topics[3]).toString(),
        })
      } else if (log.topics[0] === erc1155SingleTransferEventTopic) {
        // ERC1155 single transfer
        const [id, value] = log.data.slice(2).match(/.{1,64}/g)
        actions.push({
          type: 'transfer',
          amount: BigInt(`0x${value}`).toString(),
          token: log.address,
          from: `0x${log.topics[2].slice(-40)}`,
          to: `0x${log.topics[3].slice(-40)}`,
          tokenId: BigInt(`0x${id}`).toString(),
        })
      } else if (log.topics[0] === erc1155BatchTransferEventTopic) {
        // ERC1155 batch transfer
        const [, idsOffset, idsLength, valuesOffset, valuesLength] = log.data
          .slice(2)
          .match(/.{1,64}/g)
        const idsStart = Number.parseInt(idsOffset, 16) * 2
        const idsEnd = idsStart + Number.parseInt(idsLength, 16) * 64
        const valuesStart = Number.parseInt(valuesOffset, 16) * 2
        const valuesEnd = valuesStart + Number.parseInt(valuesLength, 16) * 64

        const ids = log.data.slice(idsStart + 2, idsEnd + 2).match(/.{1,64}/g)
        const values = log.data
          .slice(valuesStart + 2, valuesEnd + 2)
          .match(/.{1,64}/g)

        ids.forEach((id, index) => {
          actions.push({
            type: 'transfer',
            amount: BigInt(`0x${values[index]}`).toString(),
            token: log.address,
            from: `0x${log.topics[2].slice(-40)}`,
            to: `0x${log.topics[3].slice(-40)}`,
            tokenId: BigInt(`0x${id}`).toString(),
          })
        })
      }
    }

    return actions
  }

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
      const changes = await fetchValueChanges(client, transaction, receipt)
      setValueChanges(changes)

      const parsedActions = parseActions(transaction, receipt)
      setActions(parsedActions)
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
        <ActionsList title="Actions" actions={actions} />
        <ChangesList title="Value Changes" changes={valueChanges} />
      </div>
    </div>
  )
}

export default TransactionTracer
