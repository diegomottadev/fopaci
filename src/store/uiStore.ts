import { create } from 'zustand'

interface Toast {
  message: string
  type: 'success' | 'error' | 'warning'
}

interface UIState {
  toast: Toast | null
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
  hideToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  toast: null,

  showToast: (message, type) => set({ toast: { message, type } }),

  hideToast: () => set({ toast: null }),
}))
