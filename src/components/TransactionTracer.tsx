import { Skeleton } from '@/components/ui/skeleton'
import { useTransactionTracerStore } from '@/stores/transactionTracerStore'
import type { Action } from '@/types/transaction'
import { fetchTokenInfo } from '@/utils/tokenUtils'
import {
  fetchCallTrace,
  fetchValueChanges,
  formatTransactionInfo,
} from '@/utils/transactionUtils'
import { toast } from 'sonner'
import type { PublicClient, Transaction, TransactionReceipt } from 'viem'
import { createPublicClient, formatEther, formatUnits, http } from 'viem'
import { mainnet } from 'viem/chains'
import ActionsList from './ActionsList'
import CallTraceVisualization from './CallTraceVisualization'
import ChangesList from './ChangesList'
import TransactionForm from './TransactionForm'
import TransactionInfoCard from './TransactionInfoCard'

const TransactionTracer: React.FC = () => {
  const {
    txHash,
    transactionInfo,
    valueChanges,
    actions,
    callTrace,
    callTraceError,
    customRPC,
    isLoading,
    setTxHash,
    setTransactionInfo,
    setValueChanges,
    setActions,
    setCallTrace,
    setCallTraceError,
    setCustomRPC,
    setIsLoading,
  } = useTransactionTracerStore()

  const parseActions = (
    transaction: Transaction,
    receipt: TransactionReceipt,
  ): Action[] => {
    const actions: Action[] = []

    // ETH transfer
    if (transaction.value > 0n) {
      actions.push({
        type: 'transfer',
        amount: formatEther(transaction.value),
        token: 'ETH',
        from: transaction.from,
        to: transaction.to ?? '',
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
        const matches = log.data.slice(2).match(/.{1,64}/g)
        if (matches && matches.length >= 2) {
          const [id, value] = matches
          actions.push({
            type: 'transfer',
            amount: BigInt(`0x${value}`).toString(),
            token: log.address,
            from: `0x${log.topics[2]?.slice(-40) ?? ''}`,
            to: `0x${log.topics[3]?.slice(-40) ?? ''}`,
            tokenId: BigInt(`0x${id}`).toString(),
          })
        }
      } else if (log.topics[0] === erc1155BatchTransferEventTopic) {
        // ERC1155 batch transfer
        const matches = log.data.slice(2).match(/.{1,64}/g)
        if (matches && matches.length >= 5) {
          const [, idsOffset, idsLength, valuesOffset, valuesLength] = matches
          const idsStart = Number.parseInt(idsOffset, 16) * 2
          const idsEnd = idsStart + Number.parseInt(idsLength, 16) * 64
          const valuesStart = Number.parseInt(valuesOffset, 16) * 2
          const valuesEnd = valuesStart + Number.parseInt(valuesLength, 16) * 64

          const ids = log.data.slice(idsStart + 2, idsEnd + 2).match(/.{1,64}/g)
          const values =
            log.data.slice(valuesStart + 2, valuesEnd + 2).match(/.{1,64}/g) ??
            []

          ids?.forEach((id: string, index: number) => {
            actions.push({
              type: 'transfer',
              amount: BigInt(`0x${values?.[index] ?? '0'}`).toString(),
              token: log.address,
              from: `0x${log.topics[2]?.slice(-40) ?? ''}`,
              to: `0x${log.topics[3]?.slice(-40) ?? ''}`,
              tokenId: BigInt(`0x${id}`).toString(),
            })
          })
        }
      }
    }

    return actions
  }

  const fetchCallTraceData = async (client: PublicClient, hash: string) => {
    try {
      const trace = await fetchCallTrace(client, hash)
      return trace
    } catch (error) {
      console.error('Error fetching call trace:', error)
      throw new Error(
        `Unable to fetch call trace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  const traceTransaction = async (hash: string) => {
    if (!hash) {
      toast.error('Please enter a transaction hash')
      return
    }

    if (!customRPC) {
      toast.error('Please enter a valid RPC URL')
      return
    }

    setIsLoading(true)
    setCallTrace(null)
    setCallTraceError(null)
    setTransactionInfo(null)
    setValueChanges([])
    setActions([])

    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(customRPC),
      })

      // Fetch transaction info
      try {
        const transaction = await client.getTransaction({
          hash: hash as `0x${string}`,
        })
        setTransactionInfo(formatTransactionInfo(transaction))
      } catch (error) {
        console.error('Error fetching transaction info:', error)
        toast.error('Failed to fetch transaction info')
      }

      // Fetch value changes and actions
      try {
        const [transaction, receipt] = await Promise.all([
          client.getTransaction({ hash: hash as `0x${string}` }),
          client.getTransactionReceipt({ hash: hash as `0x${string}` }),
        ])

        const changes = await fetchValueChanges(transaction, receipt)
        const parsedActions = parseActions(transaction, receipt)

        // Fetch token info
        const uniqueTokenAddresses = new Set([
          ...changes.filter((c) => c.type === 'token').map((c) => c.token),
          ...parsedActions.filter((a) => a.token !== 'ETH').map((a) => a.token),
        ])

        const tokenInfoPromises = Array.from(uniqueTokenAddresses).map(
          (address) => fetchTokenInfo(client, address as string),
        )
        const tokenInfoResults = await Promise.all(tokenInfoPromises)

        const tokenInfoMap = Object.fromEntries(
          tokenInfoResults.map((info) => [info.address, info]),
        )

        // Update changes and actions with token info
        const updatedChanges = changes.map((change) => ({
          ...change,
          tokenInfo:
            change.type === 'token'
              ? tokenInfoMap[change.token as keyof typeof tokenInfoMap]
              : undefined,
        }))
        setValueChanges(updatedChanges)

        const updatedActions = parsedActions.map((action) => ({
          ...action,
          tokenInfo:
            action.token !== 'ETH'
              ? tokenInfoMap[action.token as keyof typeof tokenInfoMap]
              : undefined,
        }))
        setActions(updatedActions)
      } catch (error) {
        console.error('Error fetching value changes and actions:', error)
        toast.error('Failed to fetch value changes and actions')
      }

      // Fetch call trace
      try {
        const trace = await fetchCallTraceData(client, hash)
        setCallTrace(trace)
      } catch (error) {
        console.error('Error fetching call trace:', error)
        if (
          error instanceof Error &&
          error.message.includes('Unable to fetch call trace')
        ) {
          setCallTraceError(error.message)
        } else {
          toast.error('Failed to fetch call trace')
        }
      }
    } catch (error) {
      console.error('Error tracing transaction:', error)
      if (error instanceof Error) {
        if (error.message.includes('No URL was provided')) {
          toast.error(
            'Invalid RPC URL. Please check your RPC URL and try again.',
          )
        } else {
          toast.error(
            'Error tracing transaction. Please check the transaction hash and try again.',
          )
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRPCChange = (newRPC: string) => {
    setCustomRPC(newRPC)
  }

  return (
    <div className="space-y-4">
      <TransactionForm
        txHash={txHash}
        onTxHashChange={setTxHash}
        onTrace={traceTransaction}
        isLoading={isLoading}
        customRPC={customRPC}
        onRPCChange={handleRPCChange}
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : transactionInfo ? (
        <TransactionInfoCard transactionInfo={transactionInfo} />
      ) : null}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : valueChanges.length > 0 ? (
        <ChangesList title="Value Changes" changes={valueChanges} />
      ) : null}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : actions && actions.length > 0 ? (
        <ActionsList title="Actions" actions={actions} />
      ) : null}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : callTraceError ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-medium">Error fetching call trace</p>
          <p className="text-sm mt-1">{callTraceError}</p>
        </div>
      ) : callTrace ? (
        <CallTraceVisualization trace={callTrace} />
      ) : null}
    </div>
  )
}

export default TransactionTracer
