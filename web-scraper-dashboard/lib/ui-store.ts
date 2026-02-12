import { create } from 'zustand'

interface UIStore {
  showManualButton: boolean
  setShowManualButton: (value: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  showManualButton: true,
  setShowManualButton: (value) => set({ showManualButton: value }),
}))
