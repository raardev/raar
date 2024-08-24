import type { TransactionInfo, ValueChange } from '@/types/transaction'
import { type PublicClient, formatEther, formatUnits } from 'viem'

export const formatTransactionInfo = (transaction: any): TransactionInfo => ({
  hash: transaction.hash,
  from: transaction.from,
  to: transaction.to || 'Contract Creation',
  value: formatEther(transaction.value),
  gasPrice: formatEther(transaction.gasPrice || 0n),
  gasLimit: transaction.gas.toString(),
  nonce: Number(transaction.nonce),
  blockNumber: Number(transaction.blockNumber),
  blockHash: transaction.blockHash || '',
  transactionIndex: Number(transaction.transactionIndex),
})

// Fetch USD price for a given symbol using CoinGecko API
async function getUSDPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.json()
    return data[symbol].usd
  } catch (error) {
    console.error(`Error fetching USD price for ${symbol}:`, error)
    return 0
  }
}

export const fetchValueChanges = async (
  client: PublicClient,
  transaction: any,
  receipt: any,
): Promise<ValueChange[]> => {
  const valueChanges: ValueChange[] = []
  const ethPrice = await getUSDPrice('ethereum')

  // Calculate ETH transfer
  if (transaction.value > 0n) {
    const ethAmount = formatEther(transaction.value)
    const usdValue = (Number(ethAmount) * ethPrice).toFixed(2)
    valueChanges.push({
      type: 'eth',
      address: transaction.from,
      amount: `-${ethAmount}`,
      usdValue: `-$${usdValue}`,
    })
    valueChanges.push({
      type: 'eth',
      address: transaction.to,
      amount: `+${ethAmount}`,
      usdValue: `+$${usdValue}`,
    })
  }

  // Calculate gas fee
  const gasCost = receipt.gasUsed * receipt.effectiveGasPrice
  const gasEthAmount = formatEther(gasCost)
  const gasUsdValue = (Number(gasEthAmount) * ethPrice).toFixed(2)
  valueChanges.push({
    type: 'eth',
    address: transaction.from,
    amount: `-${gasEthAmount}`,
    usdValue: `-$${gasUsdValue}`,
    description: 'Gas Fee',
  })

  // Token transfers
  const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

  for (const log of receipt.logs) {
    if (log.topics[0] === transferEventTopic) {
      const from = `0x${log.topics[1].slice(-40)}`
      const to = `0x${log.topics[2].slice(-40)}`

      if (log.topics.length === 3) {
        // ERC20 transfer
        const amount = formatUnits(BigInt(log.data), 18) // Assuming all tokens have 18 decimals
        // Note: We need a method to get the USD price for each token, which might require additional API calls
        // This is a simplified example, in practice you'd need more complex logic
        const tokenUsdPrice = 1 // Assuming all tokens are worth 1 USD
        const usdValue = (Number(amount) * tokenUsdPrice).toFixed(2)
        valueChanges.push({
          type: 'token',
          address: from,
          amount: `-${amount}`,
          usdValue: `-$${usdValue}`,
          token: log.address,
        })
        valueChanges.push({
          type: 'token',
          address: to,
          amount: `+${amount}`,
          usdValue: `+$${usdValue}`,
          token: log.address,
        })
      } else if (log.topics.length === 4) {
        // ERC721 transfer
        const tokenId = BigInt(log.topics[3]).toString()
        valueChanges.push({
          type: 'nft',
          address: from,
          amount: '-1',
          usdValue: 'N/A',  // USD value for NFTs is typically hard to determine
          tokenId,
          contractAddress: log.address,
        })
        valueChanges.push({
          type: 'nft',
          address: to,
          amount: '+1',
          usdValue: 'N/A',  // USD value for NFTs is typically hard to determine
          tokenId,
          contractAddress: log.address,
        })
      }
    }
  }

  return valueChanges
}

export const formatDiff = (oldValue: string, newValue: string): string => {
  const diff = Number.parseFloat(newValue) - Number.parseFloat(oldValue)
  const formattedDiff = diff.toFixed(6)
  const sign = diff >= 0 ? '+' : ''
  return `(${sign}${formattedDiff})`
}