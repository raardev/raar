export interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gasLimit: string
  nonce: number
  blockNumber: number
  blockHash: string
  transactionIndex: number
}

export interface ValueChange {
  type: 'eth' | 'token' | 'nft' | 'erc1155'
  address: string
  amount: string
  usdValue?: string
  token?: string
  tokenId?: string
  contractAddress?: string
  description?: string
}