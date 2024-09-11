import { create } from 'zustand'
import type { DataFrameResult, FileInfo } from '../types/chainAnalyzer'

interface ChainAnalyzerState {
  selectedDir: string
  setSelectedDir: (dir: string) => void
  files: FileInfo[]
  setFiles: (files: FileInfo[]) => void
  selectedFile: string
  setSelectedFile: (file: string) => void
  sqlQuery: string
  setSqlQuery: (query: string) => void
  queryResult: DataFrameResult | null
  setQueryResult: (result: DataFrameResult | null) => void
  queryTime: number | null
  setQueryTime: (time: number | null) => void
  queryError: string | null
  setQueryError: (error: string | null) => void
  chartType: 'bar' | 'line' | 'area'
  setChartType: (type: 'bar' | 'line' | 'area') => void
  previewData: DataFrameResult | null
  setPreviewData: (data: DataFrameResult | null) => void
}

export const useChainAnalyzerStore = create<ChainAnalyzerState>((set) => ({
  selectedDir: '',
  setSelectedDir: (dir) => set({ selectedDir: dir }),
  files: [],
  setFiles: (files) => set({ files }),
  selectedFile: '',
  setSelectedFile: (file) => set({ selectedFile: file }),
  sqlQuery: '',
  setSqlQuery: (query) => set({ sqlQuery: query }),
  queryResult: null,
  setQueryResult: (result) => set({ queryResult: result }),
  queryTime: null,
  setQueryTime: (time) => set({ queryTime: time }),
  queryError: null,
  setQueryError: (error) => set({ queryError: error }),
  chartType: 'bar',
  setChartType: (type) => set({ chartType: type }),
  previewData: null,
  setPreviewData: (data) => set({ previewData: data }),
}))
