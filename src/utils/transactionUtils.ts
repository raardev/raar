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
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`,
    )
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
  const erc20TransferEventTopic =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  const erc721TransferEventTopic =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  const erc1155SingleTransferEventTopic =
    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'
  const erc1155BatchTransferEventTopic =
    '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'

  for (const log of receipt.logs) {
    if (log.topics[0] === erc20TransferEventTopic && log.topics.length === 3) {
      // ERC20 transfer
      const from = `0x${log.topics[1].slice(-40)}`
      const to = `0x${log.topics[2].slice(-40)}`
      const amount = formatUnits(BigInt(log.data), 18) // Assuming all tokens have 18 decimals
      valueChanges.push(
        {
          type: 'token',
          address: from,
          amount: `-${amount}`,
          token: log.address,
        },
        {
          type: 'token',
          address: to,
          amount: `+${amount}`,
          token: log.address,
        },
      )
    } else if (
      log.topics[0] === erc721TransferEventTopic &&
      log.topics.length === 4
    ) {
      // ERC721 transfer
      const from = `0x${log.topics[1].slice(-40)}`
      const to = `0x${log.topics[2].slice(-40)}`
      const tokenId = BigInt(log.topics[3]).toString()
      valueChanges.push(
        {
          type: 'nft',
          address: from,
          amount: '-1',
          tokenId,
          contractAddress: log.address,
        },
        {
          type: 'nft',
          address: to,
          amount: '+1',
          tokenId,
          contractAddress: log.address,
        },
      )
    } else if (log.topics[0] === erc1155SingleTransferEventTopic) {
      // ERC1155 single transfer
      const from = `0x${log.topics[2].slice(-40)}`
      const to = `0x${log.topics[3].slice(-40)}`
      const [id, value] = log.data.slice(2).match(/.{1,64}/g)
      const tokenId = BigInt(`0x${id}`).toString()
      const amount = BigInt(`0x${value}`).toString()
      valueChanges.push(
        {
          type: 'erc1155',
          address: from,
          amount: `-${amount}`,
          tokenId,
          contractAddress: log.address,
        },
        {
          type: 'erc1155',
          address: to,
          amount: `+${amount}`,
          tokenId,
          contractAddress: log.address,
        },
      )
    } else if (log.topics[0] === erc1155BatchTransferEventTopic) {
      // ERC1155 batch transfer
      const from = `0x${log.topics[2].slice(-40)}`
      const to = `0x${log.topics[3].slice(-40)}`
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
        const tokenId = BigInt(`0x${id}`).toString()
        const amount = BigInt(`0x${values[index]}`).toString()
        valueChanges.push(
          {
            type: 'erc1155',
            address: from,
            amount: `-${amount}`,
            tokenId,
            contractAddress: log.address,
          },
          {
            type: 'erc1155',
            address: to,
            amount: `+${amount}`,
            tokenId,
            contractAddress: log.address,
          },
        )
      })
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

export const fetchCallTrace = async (client: any, hash: string) => {
  const trace = await client.request({
    method: 'debug_traceTransaction',
    params: [hash, { tracer: 'callTracer' }],
  })
  return trace
}