import {
  createPublicClient,
  http,
  numberToHex,
  type Address,
  type Hash,
  type PublicClient,
} from 'viem'
import { mainnet } from 'viem/chains'

export interface ExtendedClient extends PublicClient {
  getBlockDetails: (args: { blockNumber: bigint }) => Promise<BlockDetails>
  getBlockTransactions: (args: {
    blockNumber: bigint
    page: number
  }) => Promise<TransactionList>
  getAddressInfo: (args: { address: Address }) => Promise<AddressInfo>
  getContractInfo: (args: { address: Address }) => Promise<ContractInfo>
  searchTransactions: (args: {
    address: Address
    page: number
  }) => Promise<TransactionList>
  traceTransaction: (args: { hash: Hash }) => Promise<TraceResult>
}

export const createExtendedClient = (url: string): ExtendedClient => {
  const transport = http(url)
  const publicClient = createPublicClient({ chain: mainnet, transport })

  return {
    ...publicClient,
    getBlockDetails: (args) =>
      publicClient.request({
        method: 'ots_getBlockDetails',
        params: [numberToHex(args.blockNumber)],
      }) as Promise<BlockDetails>,
    getBlockTransactions: (args) =>
      publicClient.request({
        method: 'ots_getBlockTransactions',
        params: [numberToHex(args.blockNumber), args.page],
      }) as Promise<TransactionList>,
    getAddressInfo: (args) =>
      publicClient.request({
        method: 'ots_getAddressInfo',
        params: [args.address],
      }) as Promise<AddressInfo>,
    getContractInfo: (args) =>
      publicClient.request({
        method: 'ots_getContractInfo',
        params: [args.address],
      }) as Promise<ContractInfo>,
    searchTransactions: (args) =>
      publicClient.request({
        method: 'ots_searchTransactions',
        params: [args.address, args.page],
      }) as Promise<TransactionList>,
    traceTransaction: (args) =>
      publicClient.request({
        method: 'ots_traceTransaction',
        params: [args.hash],
      }) as Promise<TraceResult>,
  }
}

interface BlockDetails {
  block: {
    hash: Hash
    parentHash: Hash
    sha3Uncles: Hash
    miner: Address
    stateRoot: Hash
    transactionsRoot: Hash
    receiptsRoot: Hash
    logsBloom: string
    difficulty: string
    number: string
    gasLimit: string
    gasUsed: string
    timestamp: string
    totalDifficulty: string
    extraData: string
    mixHash: Hash
    nonce: string
    baseFeePerGas: string
    blobGasUsed: string
    excessBlobGas: string
    uncles: Hash[]
    size: string
    transactionCount: number
  }
  issuance: {
    blockReward: string
    uncleReward: string
    issuance: string
  }
  totalFees: string
}

interface TransactionList {
  transactions: Array<{
    hash: Hash
    nonce: string
    blockHash: Hash | null
    blockNumber: string | null
    transactionIndex: string | null
    from: Address
    to: Address | null
    value: string
    gasPrice: string
    gas: string
    input: string
    v: string
    r: string
    s: string
    type: string
    accessList?: Array<{ address: Address; storageKeys: string[] }>
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }>
  nextPage: number | null
}

interface AddressInfo {
  address: Address
  balance: string
  nonce: string
  code: string
  storage: Record<string, string>
}

interface ContractInfo {
  address: Address
  creationTx: Hash
  creator: Address
  code: string
  implementation?: Address
  proxy?: boolean
}

interface TraceResult {
  gas: string
  failed: boolean
  returnValue: string
  structLogs: Array<{
    pc: number
    op: string
    gas: string
    gasCost: string
    depth: number
    error?: string
    stack: string[]
    memory: string[]
    storage: Record<string, string>
  }>
}
