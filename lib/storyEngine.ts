// M6 — Story Engine
// Gère le tracking des stories vues (Supabase + localStorage fallback)
// et le déclenchement des séquences narratives

import { STORY, StorySeq } from '@/data/story'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'

// Index rapide par ID
const STORY_MAP: Record<string, StorySeq> = {}
STORY.forEach(s => { STORY_MAP[s.id] = s })

export function getStoryById(id: string): StorySeq | null {
  return STORY_MAP[id] || null
}

export function getAllStories(): StorySeq[] {
  return STORY
}

// ─── Story Seen tracking ───────────────────────────────────────────

// Cache local pour éviter les requêtes répétées
let seenCache: Set<string> | null = null

function getLocalSeen(): Set<string> {
  try {
    const raw = localStorage.getItem('restanques_stories_seen')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveLocalSeen(seen: Set<string>): void {
  try {
    localStorage.setItem('restanques_stories_seen', JSON.stringify([...seen]))
  } catch {}
}

// Initialise le cache depuis localStorage (et Supabase si dispo)
export function initStorySeen(): void {
  seenCache = getLocalSeen()
}

// Vérifie si une story a été vue (synchrone, utilise le cache)
export function isStorySeen(storyId: string): boolean {
  if (!seenCache) seenCache = getLocalSeen()
  return seenCache.has(storyId)
}

// Marque une story comme vue (Supabase + localStorage)
export async function markStorySeen(storyId: string): Promise<void> {
  if (!seenCache) seenCache = getLocalSeen()
  if (seenCache.has(storyId)) return

  seenCache.add(storyId)
  saveLocalSeen(seenCache)

  // Persist to Supabase if player exists
  const playerId = useGameStore.getState().playerId
  if (playerId) {
    try {
      await supabase.from('story_seen').upsert(
        { player_id: playerId, story_id: storyId },
        { onConflict: 'player_id,story_id' }
      )
    } catch {
      // Offline fallback — localStorage already saved
    }
  }
}

// Charge les stories vues depuis Supabase (au login/load)
export async function loadStorySeenFromSupabase(playerId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('story_seen')
      .select('story_id')
      .eq('player_id', playerId)

    if (data && data.length > 0) {
      if (!seenCache) seenCache = getLocalSeen()
      data.forEach((row: { story_id: string }) => seenCache!.add(row.story_id))
      saveLocalSeen(seenCache!)
    }
  } catch {
    // Offline — use localStorage only
  }
}

// Reset (nouvelle partie)
export function resetStorySeen(): void {
  seenCache = new Set()
  saveLocalSeen(seenCache)
}

// ─── Story Triggers ────────────────────────────────────────────────

// Déclenche une séquence story (transition vers SceneStory)
export function triggerStory(storyId: string, nextScene: string, extraData?: Record<string, unknown>): boolean {
  if (isStorySeen(storyId)) return false

  const story = getStoryById(storyId)
  if (!story) return false

  const { transitionToScene } = useGameStore.getState()
  transitionToScene('story', { storyId, nextScene, ...extraData })
  return true
}

// Déclenche l'intro (une seule fois, sinon va direct à la destination)
export function triggerIntro(nextScene: string): void {
  if (!triggerStory('story_intro', nextScene)) {
    // Déjà vue → aller direct
    useGameStore.getState().transitionToScene(nextScene as any)
  }
}

// Déclenche la story d'entrée d'un biome
export function triggerBiomeEntry(biome: string, nextScene: string): boolean {
  const storyId = `story_${biome}_entree`
  return triggerStory(storyId, nextScene)
}

// Déclenche la story avant un boss/demi-boss
export function triggerBossBefore(monsterName: string): string | null {
  const map = getBossStoryMap()
  const info = map[monsterName]
  if (info?.before && !isStorySeen(info.before)) {
    return info.before
  }
  return null
}

// Déclenche la story après victoire boss/demi-boss
export function triggerBossAfter(monsterName: string, returnScene: string): boolean {
  const map = getBossStoryMap()
  const info = map[monsterName]
  if (!info?.after) return false

  // Boss final → chaîner vers l'ending
  if (monsterName === 'Le Mistral') {
    return triggerStory(info.after, 'story', { storyChain: 'story_ending', nextScene: 'splash' })
  }

  return triggerStory(info.after, returnScene)
}

// ─── Boss → Story ID mapping ──────────────────────────────────────

interface BossStoryInfo { before?: string; after?: string }

const BOSS_STORY_CACHE: Record<string, BossStoryInfo> = {
  'Grand Cerf': { before: 'story_garrigue_demiboss_entree', after: 'story_garrigue_demiboss_victoire' },
  'Sanglier geant': { before: 'story_garrigue_boss_entree', after: 'story_garrigue_boss_victoire' },
  'Poulpe geant': { before: 'story_calanques_demiboss_entree', after: 'story_calanques_demiboss_victoire' },
  'Mouette titanesque': { before: 'story_calanques_boss_entree', after: 'story_calanques_boss_victoire' },
  'Dragon mineur': { before: 'story_mines_demiboss_entree', after: 'story_mines_demiboss_victoire' },
  'Tarasque': { before: 'story_mines_boss_entree', after: 'story_mines_boss_victoire' },
  'Sirene': { before: 'story_mer_demiboss_entree', after: 'story_mer_demiboss_victoire' },
  'Kraken': { before: 'story_mer_boss_entree', after: 'story_mer_boss_victoire' },
  'Titan ancien': { before: 'story_restanques_demiboss_entree', after: 'story_restanques_demiboss_victoire' },
  'Le Mistral': { before: 'story_restanques_boss_entree', after: 'story_restanques_boss_victoire' },
}

export function getBossStoryMap(): Record<string, BossStoryInfo> {
  return BOSS_STORY_CACHE
}

// ─── Popups contextuelles ──────────────────────────────────────────

const CONTEXTUAL_POPUPS: Record<string, string> = {
  first_combat: '⚔️ Combat ! Joue tes cartes : Coup, Défense, Fuite ou Potion',
  first_craft: '⚒️ Approche-toi du meuble et appuie sur A pour crafter !',
  first_garden: '🌱 Plante une graine dans le bac vide !',
  first_pnj: '💬 Un PNJ ! Appuie sur A pour lui parler',
  first_resource: '🪓 Ressource ! Appuie sur A pour récolter',
  first_night: '🌙 La nuit tombe... les monstres sont plus forts, rentre à la maison !',
  first_boss: '💀 Ce monstre a l\'air costaud... vérifie tes sorts !',
  first_portal: '🌀 Un portail ! Vaincs le boss pour l\'ouvrir',
  first_fatigue: '😴 Tu es fatigué... dors dans le lit pour te reposer',
  first_shop: '💰 Comptoir ! Achète et vends tes objets ici',
}

let popupsSeen: Set<string> | null = null

function getLocalPopups(): Set<string> {
  try {
    const raw = localStorage.getItem('restanques_popups_seen')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

export function shouldShowPopup(key: string): string | null {
  if (!popupsSeen) popupsSeen = getLocalPopups()
  if (popupsSeen.has(key)) return null
  return CONTEXTUAL_POPUPS[key] || null
}

export function markPopupSeen(key: string): void {
  if (!popupsSeen) popupsSeen = getLocalPopups()
  popupsSeen.add(key)
  try {
    localStorage.setItem('restanques_popups_seen', JSON.stringify([...popupsSeen]))
  } catch {}
}

export function resetPopups(): void {
  popupsSeen = new Set()
  try { localStorage.removeItem('restanques_popups_seen') } catch {}
}
