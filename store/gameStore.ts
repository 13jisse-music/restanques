import { create } from 'zustand'

export type SceneId = 'splash' | 'maison' | 'monde' | 'combat' | 'craft' | 'commerce' | 'story' | 'tuto' | 'donjon'
export type PlayerClass = 'paladin' | 'artisane' | 'ombre'
export type Weather = 'clear' | 'rain' | 'fog' | 'wind'
export type Season = 'printemps' | 'ete' | 'automne' | 'hiver'

interface GameState {
  // Scene management
  currentScene: SceneId
  previousScene: SceneId | null
  sceneData: Record<string, unknown> | null

  // Player
  playerId: string | null
  playerClass: PlayerClass | null
  playerName: string | null

  // Day/night (0 = sunrise, 0.5 = sunset, 1 = next sunrise)
  dayNightCycle: number
  weather: Weather
  season: Season

  // Multiplayer
  sessionCode: string | null
  isHost: boolean
  connectedPlayers: string[]

  // Skin
  currentSkin: string

  // Actions
  setScene: (scene: SceneId) => void
  transitionToScene: (scene: SceneId, data?: Record<string, unknown>) => void
  resetInputs: () => void
  setPlayer: (id: string, name: string, playerClass: PlayerClass) => void
  setSession: (code: string, isHost: boolean) => void
  setSkin: (skin: string) => void
  updateDayNight: (delta: number) => void
  setWeather: (weather: Weather) => void
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'splash',
  previousScene: null,
  sceneData: null,

  playerId: null,
  playerClass: null,
  playerName: null,

  dayNightCycle: 0.25, // morning
  weather: 'clear',
  season: 'printemps',

  sessionCode: null,
  isHost: false,
  connectedPlayers: [],

  currentSkin: 'provence',

  setScene: (scene) => set((state) => ({
    previousScene: state.currentScene,
    currentScene: scene,
  })),

  transitionToScene: (scene, data) => set((state) => {
    // Notify scene change + reset inputs (no forced resize — causes jitter on mobile)
    window.dispatchEvent(new CustomEvent('scene-change', { detail: { from: state.currentScene, to: scene } }))
    window.dispatchEvent(new CustomEvent('reset-inputs'))
    return {
      previousScene: state.currentScene,
      currentScene: scene,
      sceneData: data || null,
    }
  }),

  resetInputs: () => {
    // CDC M10: Reset all active inputs on scene change
    // Dispatch event that components listen for to clear joystick/dpad state
    window.dispatchEvent(new CustomEvent('reset-inputs'))
  },

  setPlayer: (id, name, playerClass) => set({
    playerId: id,
    playerName: name,
    playerClass: playerClass,
  }),

  setSession: (code, isHost) => set({
    sessionCode: code,
    isHost: isHost,
  }),

  setSkin: (skin) => {
    document.body.setAttribute('data-skin', skin)
    set({ currentSkin: skin })
  },

  updateDayNight: (delta) => set((state) => ({
    dayNightCycle: (state.dayNightCycle + delta) % 1,
  })),

  setWeather: (weather) => set({ weather }),
}))
