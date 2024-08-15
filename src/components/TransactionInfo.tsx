import type React from 'react'
import { formatEther } from 'viem'

interface TransactionInfoProps {
  transaction: any
}

const TransactionInfo: React.FC<TransactionInfoProps> = ({ transaction }) => {
  const formatValue = (value: bigint | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A'
    return formatEther(value)
  }

  const formatNumber = (value: bigint | number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A'
    return value.toString()
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">Transaction Information</h3>
      <p>
        <strong>Hash:</strong> {transaction.hash || 'N/A'}
      </p>
      <p>
        <strong>From:</strong> {transaction.from || 'N/A'}
      </p>
      <p>
        <strong>To:</strong> {transaction.to || 'N/A'}
      </p>
      <p>
        <strong>Value:</strong> {formatValue(transaction.value)} ETH
      </p>
      <p>
        <strong>Gas Price:</strong> {formatValue(transaction.gasPrice)} ETH
      </p>
      <p>
        <strong>Gas Limit:</strong> {formatNumber(transaction.gas)}
      </p>
      <p>
        <strong>Nonce:</strong> {formatNumber(transaction.nonce)}
      </p>
      <p>
        <strong>Block Number:</strong> {formatNumber(transaction.blockNumber)}
      </p>
      <p>
        <strong>Block Hash:</strong> {transaction.blockHash || 'N/A'}
      </p>
    </div>
  )
}

export default TransactionInfo
