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
    error?: string
    result?: any
  } | null
  latency: number | null
  status?: number
  statusText?: string
}

interface RPCToolState {
  requests: RPCRequest[]
  activeTab: string
  addRequest: (request: RPCRequest) => void
  updateRequest: (id: string, updates: Partial<RPCRequest>) => void
  removeRequest: (id: string) => void
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
      removeRequest: (id) =>
        set((state) => {
          const newRequests = state.requests.filter((req) => req.id !== id)
          let newActiveTab = state.activeTab

          if (state.activeTab === id) {
            const closedIndex = state.requests.findIndex((req) => req.id === id)
            if (closedIndex < state.requests.length - 1) {
              // If it's not the last tab, select the next one
              newActiveTab = state.requests[closedIndex + 1].id
            } else if (closedIndex > 0) {
              // If it's the last tab, select the previous one
              newActiveTab = state.requests[closedIndex - 1].id
            } else {
              // If it's the only tab, set to '1' or any default value
              newActiveTab = '1'
            }
          }

          return {
            requests: newRequests,
            activeTab: newActiveTab,
          }
        }),
      setActiveTab: (id) => set({ activeTab: id }),
    }),
    {
      name: 'rpc-tool-storage',
    },
  ),
)
