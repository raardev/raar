import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CastCommand {
  id: number
  name: string
}

interface CastToolState {
  activeCommands: CastCommand[]
  nextId: number
  searchTerm: string
  addCommand: (name: string) => void
  removeCommand: (id: number) => void
  clearAllCommands: () => void
  setSearchTerm: (term: string) => void
}

export const useCastToolStore = create<CastToolState>()(
  persist(
    (set) => ({
      activeCommands: [],
      nextId: 0,
      searchTerm: '',
      addCommand: (name) =>
        set((state) => ({
          activeCommands: [...state.activeCommands, { name, id: state.nextId }],
          nextId: state.nextId + 1,
        })),
      removeCommand: (id) =>
        set((state) => ({
          activeCommands: state.activeCommands.filter((cmd) => cmd.id !== id),
        })),
      clearAllCommands: () => set({ activeCommands: [] }),
      setSearchTerm: (term) => set({ searchTerm: term }),
    }),
    {
      name: 'cast-tool-storage',
      partialize: (state) => ({ activeCommands: state.activeCommands }),
    }
  )
)