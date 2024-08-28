import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Action, TransactionInfo, ValueChange } from '@/types/transaction'

interface TransactionTracerState {
  txHash: string
  transactionInfo: TransactionInfo | null
  valueChanges: ValueChange[]
  actions: Action[]
  callTrace: any
  callTraceError: string | null
  customRPC: string
  isLoading: boolean
  setTxHash: (hash: string) => void
  setTransactionInfo: (info: TransactionInfo | null) => void
  setValueChanges: (changes: ValueChange[]) => void
  setActions: (actions: Action[]) => void
  setCallTrace: (trace: any) => void
  setCallTraceError: (error: string | null) => void
  setCustomRPC: (rpc: string) => void
  setIsLoading: (loading: boolean) => void
}

export const useTransactionTracerStore = create<TransactionTracerState>()(
  persist(
    (set) => ({
      txHash: '',
      transactionInfo: null,
      valueChanges: [],
      actions: [],
      callTrace: null,
      callTraceError: null,
      customRPC: '',
      isLoading: false,
      setTxHash: (hash) => set({ txHash: hash }),
      setTransactionInfo: (info) => set({ transactionInfo: info }),
      setValueChanges: (changes) => set({ valueChanges: changes }),
      setActions: (actions) => set({ actions: actions }),
      setCallTrace: (trace) => set({ callTrace: trace }),
      setCallTraceError: (error) => set({ callTraceError: error }),
      setCustomRPC: (rpc) => set({ customRPC: rpc }),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'transaction-tracer-storage',
    }
  )
)