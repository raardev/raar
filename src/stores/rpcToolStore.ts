import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RPCRequest {
  id: string
  rpcUrl: string
  method: string
  params: string
  response: {
    status?: number
    statusText?: string
  } | null
  latency: number | null
}

interface RPCToolState {
  requests: RPCRequest[]
  activeTab: string
  addRequest: (request: RPCRequest) => void
  updateRequest: (id: string, updates: Partial<RPCRequest>) => void
  setActiveTab: (id: string) => void
}

export const useRPCToolStore = create<RPCToolState>()(
  persist(
    (set) => ({
      requests: [
        {
          id: '1',
          rpcUrl: '',
          method: 'eth_blockNumber',
          params: JSON.stringify(
            {
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1,
            },
            null,
            2,
          ),
          response: null,
          latency: null,
        },
      ],
      activeTab: '1',
      addRequest: (request) =>
        set((state) => ({ requests: [...state.requests, request] })),
      updateRequest: (id, updates) =>
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id ? { ...req, ...updates } : req,
          ),
        })),
      setActiveTab: (id) => set({ activeTab: id }),
    }),
    {
      name: 'rpc-tool-storage',
    },
  ),
)
