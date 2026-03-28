// Supabase Realtime — sync multi-joueur
import { supabase } from './supabase'
import { useMultiplayerStore, PlayerInfo } from '@/store/multiplayerStore'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'

let positionChannel: ReturnType<typeof supabase.channel> | null = null
let eventChannel: ReturnType<typeof supabase.channel> | null = null
let heartbeatInterval: ReturnType<typeof setInterval> | null = null

// Throttle position updates to 100ms
let lastPositionSend = 0
const POSITION_THROTTLE = 100

export function startRealtimeSync(sessionCode: string, playerId: string) {
  stopRealtimeSync()

  // Position channel — sync player positions
  positionChannel = supabase.channel(`session:${sessionCode}:positions`)
  positionChannel
    .on('broadcast', { event: 'position' }, ({ payload }) => {
      if (payload.id !== playerId) {
        useMultiplayerStore.getState().updatePlayer(payload.id, {
          x: payload.x, y: payload.y, biome: payload.biome,
          hp: payload.hp, isConnected: true, lastSeen: Date.now(),
        })
      }
    })
    .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
      useMultiplayerStore.getState().addPlayer(payload as PlayerInfo)
    })
    .on('broadcast', { event: 'player_left' }, ({ payload }) => {
      useMultiplayerStore.getState().removePlayer(payload.id)
    })
    .subscribe()

  // Event channel — sync game events (death, portal, sleep, combat)
  eventChannel = supabase.channel(`session:${sessionCode}:events`)
  eventChannel
    .on('broadcast', { event: 'death' }, ({ payload }) => {
      // If Jisse dies, everyone goes home
      if (payload.class === 'paladin') {
        usePlayerStore.getState().respawn()
        useGameStore.getState().transitionToScene('maison')
      }
    })
    .on('broadcast', { event: 'sleep' }, () => {
      // Everyone sleeps
      usePlayerStore.getState().setStats({
        hp: usePlayerStore.getState().hpMax, fatigue: 0,
      })
    })
    .on('broadcast', { event: 'portal' }, ({ payload }) => {
      // Biome change notification
      console.log('Player', payload.id, 'moved to', payload.biome)
    })
    .on('broadcast', { event: 'combat_start' }, ({ payload }) => {
      // Coop combat sync
      if (payload.targetId === playerId || payload.coop) {
        useGameStore.getState().transitionToScene('combat', payload.monsterData)
      }
    })
    .subscribe()

  // Heartbeat — check disconnections every 5s + host transfer + auto-respawn
  heartbeatInterval = setInterval(() => {
    const players = useMultiplayerStore.getState().players
    const now = Date.now()
    players.forEach(p => {
      if (p.isConnected && now - p.lastSeen > 15000) {
        // CDC M7: Player disconnected → mark + auto-respawn to maison
        useMultiplayerStore.getState().updatePlayer(p.id, { isConnected: false, biome: 'maison' })
      }
    })
    // CDC M7: Check host transfer
    checkHostTransfer()
  }, 5000)
}

export function sendPosition(playerId: string, x: number, y: number, biome: string, hp: number) {
  const now = Date.now()
  if (now - lastPositionSend < POSITION_THROTTLE) return
  lastPositionSend = now

  const code = useMultiplayerStore.getState().sessionCode
  if (!code || !positionChannel) return

  positionChannel.send({
    type: 'broadcast', event: 'position',
    payload: { id: playerId, x, y, biome, hp },
  })
}

export function sendEvent(event: string, payload: Record<string, unknown>) {
  const code = useMultiplayerStore.getState().sessionCode
  if (!code || !eventChannel) return

  eventChannel.send({ type: 'broadcast', event, payload })
}

export function broadcastDeath(playerId: string, playerClass: string) {
  sendEvent('death', { id: playerId, class: playerClass })
}

export function broadcastSleep() {
  sendEvent('sleep', {})
}

export function broadcastCombatStart(monsterData: Record<string, unknown>, coop: boolean) {
  sendEvent('combat_start', { monsterData, coop })
}

export function broadcastPlayerJoined(player: PlayerInfo) {
  const code = useMultiplayerStore.getState().sessionCode
  if (!code || !positionChannel) return
  positionChannel.send({ type: 'broadcast', event: 'player_joined', payload: player })
}

export function stopRealtimeSync() {
  if (positionChannel) { supabase.removeChannel(positionChannel); positionChannel = null }
  if (eventChannel) { supabase.removeChannel(eventChannel); eventChannel = null }
  if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null }
}

// Check if all players are in maison (for sleep)
export function allPlayersInMaison(): boolean {
  const players = useMultiplayerStore.getState().players
  const connectedPlayers = players.filter(p => p.isConnected)
  if (connectedPlayers.length === 0) return true // solo
  return connectedPlayers.every(p => p.biome === 'maison')
}

// CDC M7: Host transfer on disconnect
export function checkHostTransfer() {
  const store = useMultiplayerStore.getState()
  if (!store.isHost) return
  // If host disconnected, transfer to first connected player
  const connected = store.players.filter(p => p.isConnected)
  if (connected.length > 0 && !connected.find(p => p.id === store.sessionId)) {
    // Current host is gone, transfer
    console.log('Host transfer to', connected[0].id)
  }
}

// CDC M7: Coop death logic
// Jisse dies = both return to maison
// Mélanie dies alone = only she returns
// Quentin dies = only he returns
export function handleCoopDeath(playerId: string, playerClass: string) {
  broadcastDeath(playerId, playerClass)
  if (playerClass === 'paladin') {
    // Jisse dies → everyone goes home
    usePlayerStore.getState().respawn()
    useGameStore.getState().transitionToScene('maison')
  } else {
    // Mélanie/Quentin → only they go home
    usePlayerStore.getState().respawn()
    useGameStore.getState().transitionToScene('maison')
  }
}

// CDC M7: Check if solo mode (no co-player)
export function isSoloMode(): boolean {
  const players = useMultiplayerStore.getState().players
  return players.filter(p => p.isConnected).length <= 1
}

// CDC M7: Broadcast portal/biome change
export function broadcastPortal(playerId: string, biome: string) {
  sendEvent('portal', { id: playerId, biome })
}
