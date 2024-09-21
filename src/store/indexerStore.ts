import { create } from 'zustand'
import { type IndexerOptions, defaultOptions } from '../config/indexerOptions'

export interface IndexerState {
  indexerState: {
    indexing_progress: number
    log_messages: string[]
    available_datasets: string[]
    selected_dataset: string | null
    summary: string | null
    indexed_dirs: string[]
    indexed_files: string[]
  } | null
  availableDatasets: string[]
  selectedDataset: string | null
  options: IndexerOptions
  freezeSummary: CompactFreezeSummary | null
  error: string | null
  isIndexing: boolean
  setIndexerState: (state: IndexerState['indexerState']) => void
  setAvailableDatasets: (datasets: string[]) => void
  setSelectedDataset: (dataset: string | null) => void
  setOptions: (newOptions: Partial<IndexerOptions>) => void
  setFreezeSummary: (summary: CompactFreezeSummary | null) => void
  setError: (error: string | null) => void
  setIsIndexing: (isIndexing: boolean) => void
}

export interface CompactFreezeSummary {
  completed_chunks: number
  skipped_chunks: number
  errored_chunks: number
  total_chunks: number
  rows_written: number
}

export const useIndexerStore = create<IndexerState>((set) => ({
  indexerState: null,
  availableDatasets: [],
  selectedDataset: null,
  options: defaultOptions,
  freezeSummary: null,
  error: null,
  isIndexing: false,
  setIndexerState: (state) => set({ indexerState: state }),
  setAvailableDatasets: (datasets) => set({ availableDatasets: datasets }),
  setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),
  setOptions: (newOptions) =>
    set((state) => ({
      options: { ...state.options, ...newOptions },
    })),
  setFreezeSummary: (summary) => set({ freezeSummary: summary }),
  setError: (error) => set({ error }),
  setIsIndexing: (isIndexing) => set({ isIndexing }),
}))
