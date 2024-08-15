import type React from 'react'
import { formatEther } from 'viem'

interface BlockInfoProps {
  block: any
}

const BlockInfo: React.FC<BlockInfoProps> = ({ block }) => {
  const formatNumber = (value: bigint | number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A'
    return value.toString()
  }

  const formatValue = (value: bigint | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A'
    return formatEther(value)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">Block Information</h3>
      <p>
        <strong>Number:</strong> {formatNumber(block.number)}
      </p>
      <p>
        <strong>Hash:</strong> {block.hash || 'N/A'}
      </p>
      <p>
        <strong>Parent Hash:</strong> {block.parentHash || 'N/A'}
      </p>
      <p>
        <strong>Timestamp:</strong>{' '}
        {block.timestamp
          ? new Date(Number(block.timestamp) * 1000).toLocaleString()
          : 'N/A'}
      </p>
      <p>
        <strong>Gas Used:</strong> {formatNumber(block.gasUsed)}
      </p>
      <p>
        <strong>Gas Limit:</strong> {formatNumber(block.gasLimit)}
      </p>
      <p>
        <strong>Base Fee Per Gas:</strong> {formatValue(block.baseFeePerGas)}{' '}
        ETH
      </p>
      <p>
        <strong>Transactions:</strong>{' '}
        {Array.isArray(block.transactions) ? block.transactions.length : 'N/A'}
      </p>
    </div>
  )
}

export default BlockInfo
