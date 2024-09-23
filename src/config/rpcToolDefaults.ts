interface RPCMethod {
  method: string
  params: unknown[]
}

export const commonMethods: RPCMethod[] = [
  { method: 'custom', params: [] },

  // eth namespace methods
  { method: 'eth_blockNumber', params: [] },
  { method: 'eth_chainId', params: [] },
  { method: 'eth_gasPrice', params: [] },
  {
    method: 'eth_getBalance',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'latest'],
  },
  {
    method: 'eth_getTransactionCount',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'latest'],
  },
  { method: 'eth_getBlockByNumber', params: ['latest', true] },
  {
    method: 'eth_getTransactionByHash',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
    ],
  },
  {
    method: 'eth_getTransactionReceipt',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
    ],
  },
  {
    method: 'eth_call',
    params: [
      {
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        data: '0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e',
      },
      'latest',
    ],
  },
  {
    method: 'eth_estimateGas',
    params: [{ to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', data: '0x' }],
  },
  {
    method: 'eth_getCode',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'latest'],
  },
  { method: 'eth_getBlockByHash', params: ['0x1b4', true] },
  { method: 'eth_getBlockTransactionCountByNumber', params: ['latest'] },
  { method: 'eth_getBlockTransactionCountByHash', params: ['0x1b4'] },
  { method: 'eth_getUncleCountByBlockNumber', params: ['latest'] },
  { method: 'eth_getUncleCountByBlockHash', params: ['0x1b4'] },
  {
    method: 'eth_getLogs',
    params: [{ fromBlock: 'latest', toBlock: 'latest' }],
  },
  { method: 'eth_sendRawTransaction', params: ['0xf86d8201...'] },

  // net namespace methods
  { method: 'net_version', params: [] },
  { method: 'net_listening', params: [] },
  { method: 'net_peerCount', params: [] },

  // web3 namespace methods
  { method: 'web3_clientVersion', params: [] },

  // debug namespace methods
  {
    method: 'debug_traceTransaction',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
      { tracer: 'callTracer' },
    ],
  },
  {
    method: 'debug_traceCall',
    params: [
      { to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', data: '0x70a08231' },
      'latest',
      {},
    ],
  },
  { method: 'debug_traceBlockByNumber', params: ['latest', {}] },
  { method: 'debug_traceBlockByHash', params: ['0x1b4', {}] },

  // trace namespace methods
  {
    method: 'trace_transaction',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
    ],
  },
  {
    method: 'trace_get',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
      ['0x0'],
    ],
  },
  {
    method: 'trace_call',
    params: [
      { to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', data: '0x70a08231' },
      ['trace'],
      'latest',
    ],
  },
  { method: 'trace_rawTransaction', params: ['0xf86d8201...', ['trace']] },
  {
    method: 'trace_replayTransaction',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
      ['trace'],
    ],
  },
  { method: 'trace_block', params: ['latest'] },
  {
    method: 'txpool_status',
    params: [],
  },
  {
    method: 'txpool_inspect',
    params: [],
  },
  {
    method: 'txpool_content',
    params: [],
  },

  // Anvil-specific methods
  {
    method: 'anvil_impersonateAccount',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
  },
  {
    method: 'anvil_stopImpersonatingAccount',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
  },
  { method: 'anvil_autoImpersonateAccount', params: [true] },
  { method: 'anvil_getAutomine', params: [] },
  { method: 'anvil_mine', params: [1, 0] },
  {
    method: 'anvil_dropTransaction',
    params: [
      '0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396',
    ],
  },
  {
    method: 'anvil_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
          blockNumber: 12345678,
        },
      },
    ],
  },
  {
    method: 'anvil_setRpcUrl',
    params: ['https://mainnet.infura.io/v3/YOUR-PROJECT-ID'],
  },
  {
    method: 'anvil_setBalance',
    params: [
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      '0x1000000000000000000',
    ],
  },
  {
    method: 'anvil_setCode',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '0x60806040...'],
  },
  {
    method: 'anvil_setNonce',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '0x1'],
  },
  {
    method: 'anvil_setStorageAt',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '0x0', '0x1'],
  },
  {
    method: 'anvil_setCoinbase',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
  },
  { method: 'anvil_setLoggingEnabled', params: [true] },
  { method: 'anvil_setMinGasPrice', params: ['0x1'] },
  { method: 'anvil_setNextBlockBaseFeePerGas', params: ['0x1'] },
  { method: 'anvil_setChainId', params: [1] },
  { method: 'anvil_dumpState', params: [] },
  { method: 'anvil_loadState', params: ['0x...'] }, // Replace with actual state hex string
  { method: 'anvil_nodeInfo', params: [] },
]

export const defaultParams: Record<string, string> = Object.fromEntries(
  commonMethods.map(({ method, params }) => [
    method,
    JSON.stringify(
      {
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      },
      null,
      2,
    ),
  ]),
)

// Override the 'custom' method with a more generic template
defaultParams.custom = JSON.stringify(
  {
    jsonrpc: '2.0',
    method: 'method_name',
    params: [],
    id: 1,
  },
  null,
  2,
)
