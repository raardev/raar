import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ParsedNFTData {
  type: 'image' | 'video' | 'audio' | 'json' | 'text' | 'unknown'
  content: string | object
  mimeType?: string
  originalUri: string
  resolvedUri?: string
  metadata?: any
  error?: string
}

interface HistoryItem {
  id: string
  uri: string
  timestamp: number
  result: ParsedNFTData
}

interface NFTDataParserState {
  history: HistoryItem[]
  addToHistory: (item: HistoryItem) => void
  clearHistory: () => void
  removeFromHistory: (id: string) => void
}

export const useNFTDataParserStore = create<NFTDataParserState>()(
  persist(
    (set) => ({
      history: [],
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history.slice(0, 49)], // Keep only last 50 items
        })),
      clearHistory: () => set({ history: [] }),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'nft-data-parser-storage',
    },
  ),
)