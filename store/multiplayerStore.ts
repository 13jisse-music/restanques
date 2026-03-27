import { create } from 'zustand'

export interface PlayerInfo {
  id: string
  name: string
  class: string
  x: number
  y: number
  hp: number
  hpMax: number
  biome: string
  isConnected: boolean
  lastSeen: number
}

interface MultiplayerState {
  sessionId: string | null
  sessionCode: string | null
  isHost: boolean
  isConnected: boolean
  players: PlayerInfo[]
  isSolo: boolean

  // Actions
  createSession: () => string
  setSession: (id: string, code: string, isHost: boolean) => void
  joinSession: (code: string) => void
  disconnect: () => void
  addPlayer: (player: PlayerInfo) => void
  removePlayer: (id: string) => void
  updatePlayer: (id: string, data: Partial<PlayerInfo>) => void
  setAllPlayers: (players: PlayerInfo[]) => void
}

// Generate session code: 3 letters + 3 digits
function generateCode(): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  const l = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const n = String(Math.floor(Math.random() * 900) + 100)
  return l + '-' + n
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  sessionId: null,
  sessionCode: null,
  isHost: false,
  isConnected: false,
  players: [],
  isSolo: true,

  createSession: () => {
    const code = generateCode()
    const id = crypto.randomUUID()
    set({ sessionId: id, sessionCode: code, isHost: true, isConnected: true, isSolo: true })
    return code
  },

  setSession: (id, code, isHost) => set({
    sessionId: id, sessionCode: code, isHost, isConnected: true,
  }),

  joinSession: (code) => set({
    sessionCode: code, isConnected: true, isHost: false, isSolo: false,
  }),

  disconnect: () => set({
    sessionId: null, sessionCode: null, isConnected: false, isHost: false, players: [], isSolo: true,
  }),

  addPlayer: (player) => set((state) => ({
    players: [...state.players.filter(p => p.id !== player.id), player],
    isSolo: false,
  })),

  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id),
    isSolo: state.players.filter(p => p.id !== id).length === 0,
  })),

  updatePlayer: (id, data) => set((state) => ({
    players: state.players.map((p) => p.id === id ? { ...p, ...data } : p),
  })),

  setAllPlayers: (players) => set({ players, isSolo: players.length === 0 }),
}))
