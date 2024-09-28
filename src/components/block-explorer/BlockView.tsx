import type React from 'react'
import { formatEther, formatGwei } from 'viem'
import type { BlockDetails } from './extended-client'

interface BlockViewProps {
  data: BlockDetails | null
  onViewTransactions: (blockNumber: bigint) => void
}

const BlockView: React.FC<BlockViewProps> = ({ data, onViewTransactions }) => {
  if (!data) {
    return <div className="text-center">Loading block details...</div>
  }

  const { block, issuance, totalFees } = data

  const blockDetails = [
    { label: 'Number', value: BigInt(block.number).toString() },
    { label: 'Hash', value: block.hash },
    { label: 'Parent Hash', value: block.parentHash },
    {
      label: 'Timestamp',
      value: new Date(Number(block.timestamp) * 1000).toLocaleString(),
    },
    { label: 'Gas Limit', value: `${formatGwei(BigInt(block.gasLimit))} Gwei` },
    { label: 'Gas Used', value: `${formatGwei(BigInt(block.gasUsed))} Gwei` },
    { label: 'Miner', value: block.miner },
    { label: 'Difficulty', value: BigInt(block.difficulty).toString() },
    {
      label: 'Total Difficulty',
      value: BigInt(block.totalDifficulty).toString(),
    },
    { label: 'Nonce', value: block.nonce },
    {
      label: 'Base Fee Per Gas',
      value: block.baseFeePerGas
        ? `${formatGwei(BigInt(block.baseFeePerGas))} Gwei`
        : 'N/A',
    },
    {
      label: 'Transactions',
      value: block.transactionCount.toString(),
      isLink: true,
    },
    {
      label: 'Issuance',
      value: `${formatEther(BigInt(issuance.issuance))} ETH`,
    },
    { label: 'Total Fees', value: `${formatEther(BigInt(totalFees))} ETH` },
    { label: 'Size', value: BigInt(block.size).toString() + ' bytes' },
  ]

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 text-sm">
      <h2 className="text-lg font-bold mb-3">Block Details</h2>
      <div className="space-y-2">
        {blockDetails.map(({ label, value, isLink }) => (
          <div key={label} className="border-b border-gray-100 pb-2">
            <div className="flex items-center">
              <span className="font-medium text-gray-600 w-1/3">{label}:</span>
              {isLink ? (
                <span
                  className="cursor-pointer underline ml-2 break-all"
                  onClick={() => onViewTransactions(BigInt(block.number))}
                >
                  {value}
                </span>
              ) : (
                <span className="text-gray-800 ml-2 break-all">{value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlockView
