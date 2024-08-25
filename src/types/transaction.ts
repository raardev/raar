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
  from?: string
  to?: string
  amount: string
  usdValue?: string
  token?: string
  tokenId?: string
  contractAddress?: string
  description?: string
  symbol?: string
}

export interface Action {
  type: 'transfer'
  amount: string
  token: string
  from: string
  to: string
  operator?: string
  tokenId?: string
}

export interface CallTrace {
  from: string
  to: string
  input: string
  output: string
  value: string
  gasUsed: string
  type: string
  calls?: CallTrace[]
}