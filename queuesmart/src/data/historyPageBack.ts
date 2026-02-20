import { create } from 'zustand';

interface UIState {
  historyPage: number;
  setHistoryPage: (page: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  historyPage: 1,
  setHistoryPage: (page: number) => set({ historyPage: page }),
}));