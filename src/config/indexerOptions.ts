export interface IndexerOptions {
  // Basic options
  datatype: string[]
  rpc: string | null
  outputDir: string

  // Content options
  blocks: string | string[] | null
  timestamps: string | string[] | null
  txs: string | string[] | null
  align: boolean
  reorgBuffer: number
  includeColumns: string | string[] | null
  excludeColumns: string | string[] | null
  columns: string | string[] | null
  u256Types: string | string[] | null
  hex: boolean
  sort: string | string[] | null
  excludeFailed: boolean

  // Source options
  networkName: string | null

  // Acquisition options
  requestsPerSecond: number | null
  maxRetries: number
  initialBackoff: number
  maxConcurrentRequests: number | null
  maxConcurrentChunks: number | null
  chunkOrder: string | null
  dry: boolean

  // Output options
  chunkSize: number
  nChunks: number | null
  partitionBy: string[] | null
  subdirs: string[]
  label: string | null
  overwrite: boolean
  csv: boolean
  json: boolean
  rowGroupSize: number | null
  nRowGroups: number | null
  noStats: boolean
  compression: string[]
  reportDir: string | null
  noReport: boolean

  // Dataset-specific options
  address: string[] | null
  toAddress: string[] | null
  fromAddress: string[] | null
  callData: string[] | null
  function: string[] | null
  inputs: string[] | null
  slot: string[] | null
  contract: string[] | null
  topic0: string[] | null
  topic1: string[] | null
  topic2: string[] | null
  topic3: string[] | null
  eventSignature: string | null
  innerRequestSize: number
  jsTracer: string | null
}

export const defaultOptions: IndexerOptions = {
  // Basic options
  datatype: [],
  rpc: 'http://localhost:8545',
  outputDir: '',

  // Content options
  blocks: null,
  timestamps: null,
  txs: null,
  align: false,
  reorgBuffer: 0,
  includeColumns: null,
  excludeColumns: null,
  columns: null,
  u256Types: null,
  hex: false,
  sort: null,
  excludeFailed: false,

  // Source options
  networkName: null,

  // Acquisition options
  requestsPerSecond: null,
  maxRetries: 5,
  initialBackoff: 500,
  maxConcurrentRequests: null,
  maxConcurrentChunks: null,
  chunkOrder: null,
  dry: false,

  // Output options
  chunkSize: 1000,
  nChunks: null,
  partitionBy: null,
  subdirs: [],
  label: null,
  overwrite: false,
  csv: false,
  json: false,
  rowGroupSize: null,
  nRowGroups: null,
  noStats: false,
  compression: ['lz4'],
  reportDir: null,
  noReport: false,

  // Dataset-specific options
  address: null,
  toAddress: null,
  fromAddress: null,
  callData: null,
  function: null,
  inputs: null,
  slot: null,
  contract: null,
  topic0: null,
  topic1: null,
  topic2: null,
  topic3: null,
  eventSignature: null,
  innerRequestSize: 1,
  jsTracer: null,
}
