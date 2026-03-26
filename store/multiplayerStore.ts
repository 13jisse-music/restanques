import { create } from 'zustand'

interface MultiplayerState {
  sessionId: string | null
  sessionCode: string | null
  isConnected: boolean
  players: { id: string; name: string; class: string; x: number; y: number; hp: number }[]

  setSession: (id: string, code: string) => void
  disconnect: () => void
  updatePlayer: (id: string, data: Partial<MultiplayerState['players'][0]>) => void
}

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  sessionId: null,
  sessionCode: null,
  isConnected: false,
  players: [],

  setSession: (id, code) => set({ sessionId: id, sessionCode: code, isConnected: true }),
  disconnect: () => set({ sessionId: null, sessionCode: null, isConnected: false, players: [] }),
  updatePlayer: (id, data) => set((state) => ({
    players: state.players.map((p) => p.id === id ? { ...p, ...data } : p),
  })),
}))
