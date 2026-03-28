// Asset loader with fallback placeholders + music manager
// CDC M0/M9: Priority: Supabase Storage → /public/ → placeholder

import { supabase } from '@/lib/supabase'

const assetCache = new Map<string, string | null>()

// Try Supabase Storage first, then /public/, then null
export async function loadSprite(path: string): Promise<string | null> {
  if (assetCache.has(path)) return assetCache.get(path)!

  // 1. Try Supabase Storage (custom_assets or direct bucket)
  try {
    const key = path.replace(/^\//, '') // remove leading slash
    const { data } = supabase.storage.from('assets').getPublicUrl(key)
    if (data?.publicUrl) {
      const check = await fetch(data.publicUrl, { method: 'HEAD' }).catch(() => null)
      if (check?.ok) {
        assetCache.set(path, data.publicUrl)
        return data.publicUrl
      }
    }
  } catch {}

  // 2. Try /public/ (local path)
  try {
    const response = await fetch(path, { method: 'HEAD' })
    if (response.ok) {
      assetCache.set(path, path)
      return path
    }
  } catch {}

  // 3. Placeholder (null)
  assetCache.set(path, null)
  return null
}

export function preloadSprites(paths: string[]): Promise<(string | null)[]> {
  return Promise.all(paths.map(loadSprite))
}

// CDC M10: Lazy loading — preload only essential assets at startup, biome assets on demand
const BIOME_ASSETS: Record<string, { sprites: string[]; music: string[] }> = {
  core: {
    sprites: ['/sprites/combat/combat_paladin.png', '/sprites/combat/combat_artisane.png', '/sprites/combat/combat_ombre.png'],
    music: ['/music/theme.mp3', '/music/story.mp3'],
  },
  garrigue: {
    sprites: ['/sprites/combat/combat_garrigue_loup.png', '/sprites/combat/combat_garrigue_rat.png', '/sprites/combat/combat_garrigue_serpent.png', '/sprites/combat/combat_boss_sanglier.png', '/sprites/combat/combat_demiboss_cerf.png'],
    music: ['/music/garrigue.mp3', '/music/combat.mp3'],
  },
  calanques: {
    sprites: ['/sprites/combat/combat_calanques_crabe.png', '/sprites/combat/combat_calanques_meduse.png', '/sprites/combat/combat_calanques_goeland.png', '/sprites/combat/combat_demiboss_poulpe.png', '/sprites/combat/combat_boss_mouette.png'],
    music: ['/music/calanques.mp3'],
  },
  mines: {
    sprites: ['/sprites/combat/combat_mines_chauvesouris.png', '/sprites/combat/combat_mines_golem.png', '/sprites/combat/combat_mines_araignee.png', '/sprites/combat/combat_demiboss_dragon.png', '/sprites/combat/combat_boss_tarasque.png'],
    music: ['/music/mines.mp3'],
  },
  mer: {
    sprites: ['/sprites/combat/combat_mer_poissonepee.png', '/sprites/combat/combat_mer_pieuvre.png', '/sprites/combat/combat_mer_requin.png', '/sprites/combat/combat_demiboss_sirene.png', '/sprites/combat/combat_boss_kraken.png'],
    music: ['/music/mer.mp3'],
  },
  restanques: {
    sprites: ['/sprites/combat/combat_restanques_esprit.png', '/sprites/combat/combat_restanques_gardien.png', '/sprites/combat/combat_restanques_phenix.png', '/sprites/combat/combat_demiboss_titan.png', '/sprites/combat/combat_boss_mistral.png'],
    music: ['/music/restanques.mp3'],
  },
}
const loadedBiomes = new Set<string>()

// Preload core assets at startup (players + theme music)
export async function preloadGameAssets(): Promise<void> {
  await preloadBiomeAssets('core')
  await preloadBiomeAssets('garrigue') // first biome always needed
}

// Lazy load biome assets on demand
export async function preloadBiomeAssets(biomeId: string): Promise<void> {
  if (loadedBiomes.has(biomeId)) return
  loadedBiomes.add(biomeId)
  const assets = BIOME_ASSETS[biomeId]
  if (!assets) return

  const sprites = assets.sprites
  const music = assets.music

  // Preload sprites into browser cache
  await Promise.allSettled(sprites.map(s => {
    const img = new Image()
    img.src = s
    return new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.onerror = () => resolve()
    })
  }))

  // Preload music files via fetch (puts them in SW cache)
  await Promise.allSettled(music.map(m => fetch(m).catch(() => {})))
}

// Music manager singleton with crossfade (CDC M10: 1s crossfade between scenes)
let currentMusic: HTMLAudioElement | null = null
let currentMusicPath: string | null = null
let fadeInterval: ReturnType<typeof setInterval> | null = null
const CROSSFADE_MS = 1000
const FADE_STEPS = 20

function fadeOut(audio: HTMLAudioElement, durationMs: number): Promise<void> {
  return new Promise(resolve => {
    const startVol = audio.volume
    const step = startVol / FADE_STEPS
    const interval = durationMs / FADE_STEPS
    let current = startVol
    const id = setInterval(() => {
      current -= step
      if (current <= 0) {
        audio.volume = 0
        audio.pause()
        audio.currentTime = 0
        clearInterval(id)
        resolve()
      } else {
        audio.volume = current
      }
    }, interval)
    fadeInterval = id
  })
}

function fadeIn(audio: HTMLAudioElement, targetVol: number, durationMs: number): void {
  audio.volume = 0
  const step = targetVol / FADE_STEPS
  const interval = durationMs / FADE_STEPS
  let current = 0
  const id = setInterval(() => {
    current += step
    if (current >= targetVol) {
      audio.volume = targetVol
      clearInterval(id)
    } else {
      audio.volume = current
    }
  }, interval)
}

export function playMusic(path: string, volume = 0.3, loop = true): void {
  if (currentMusicPath === path && currentMusic && !currentMusic.paused) return

  // HARD STOP old music first to prevent overlap
  if (currentMusic) {
    try { currentMusic.pause(); currentMusic.currentTime = 0 } catch {}
  }
  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }

  const oldMusic = currentMusic
  const oldPath = currentMusicPath

  try {
    const audio = new Audio(path)
    audio.volume = 0
    audio.loop = loop
    audio.play().catch(() => {
      const resume = () => {
        audio.play().catch(() => {})
        document.removeEventListener('click', resume)
        document.removeEventListener('touchstart', resume)
      }
      document.addEventListener('click', resume, { once: true })
      document.addEventListener('touchstart', resume, { once: true })
    })
    currentMusic = audio
    currentMusicPath = path

    // Crossfade: fade out old, fade in new
    if (oldMusic && !oldMusic.paused) {
      fadeOut(oldMusic, CROSSFADE_MS)
    }
    fadeIn(audio, volume, CROSSFADE_MS)
  } catch {}
}

export function stopMusic(): void {
  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }
  if (currentMusic) {
    // Fade out instead of hard stop
    const audio = currentMusic
    fadeOut(audio, 500)
    currentMusic = null
    currentMusicPath = null
  }
}

export function stopMusicImmediate(): void {
  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }
  if (currentMusic) {
    currentMusic.pause()
    currentMusic.currentTime = 0
    currentMusic = null
    currentMusicPath = null
  }
}

export function setMusicVolume(volume: number): void {
  if (currentMusic) currentMusic.volume = Math.max(0, Math.min(1, volume))
}

// Placeholder audio via Web Audio API
export function playPlaceholderSound(type: 'hit' | 'spell' | 'defend' | 'flee' | 'potion' | 'craft_success' | 'craft_fail' | 'harvest' | 'levelup' | 'portal' | 'combo' | 'death' | 'chest' | 'npc_talk' | 'notification'): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    // CDC M10: SFX Web Audio ameliores — sons distincts et reconnaissables par action
    const configs: Record<string, { freq: number; freq2?: number; vol: number; dur: number; type?: OscillatorType }> = {
      hit: { freq: 150, freq2: 80, vol: 0.25, dur: 80 },           // impact sourd descendant
      spell: { freq: 440, freq2: 1200, vol: 0.15, dur: 250, type: 'sine' },  // whoosh montant
      defend: { freq: 300, freq2: 500, vol: 0.15, dur: 120, type: 'triangle' }, // clang metallique
      flee: { freq: 400, freq2: 200, vol: 0.1, dur: 150, type: 'sawtooth' },   // whoosh descendant
      potion: { freq: 523, freq2: 784, vol: 0.15, dur: 300, type: 'sine' },    // bulles montantes
      craft_success: { freq: 523, freq2: 1047, vol: 0.2, dur: 400, type: 'sine' }, // fanfare ascendante
      craft_fail: { freq: 200, freq2: 80, vol: 0.15, dur: 300 },                  // buzzer descendant
      harvest: { freq: 440, freq2: 550, vol: 0.1, dur: 80, type: 'sine' },
      levelup: { freq: 523, freq2: 1047, vol: 0.25, dur: 500, type: 'sine' },     // fanfare triomphale
      portal: { freq: 300, freq2: 900, vol: 0.15, dur: 400, type: 'sine' },       // vortex montant
      combo: { freq: 800, freq2: 1600, vol: 0.2, dur: 200, type: 'sine' },        // power surge
      death: { freq: 150, freq2: 40, vol: 0.25, dur: 600 },                       // grave descendant lent
      chest: { freq: 400, freq2: 800, vol: 0.15, dur: 250, type: 'triangle' },    // decouverte
      npc_talk: { freq: 350, freq2: 400, vol: 0.08, dur: 60, type: 'square' },    // bip dialogue
      notification: { freq: 880, freq2: 1100, vol: 0.12, dur: 120, type: 'sine' },
    }

    const cfg = configs[type] || configs.hit
    osc.frequency.value = cfg.freq
    osc.type = cfg.type || 'square'
    gain.gain.value = cfg.vol
    // CDC M10: Frequency sweep pour sons plus expressifs
    if (cfg.freq2) osc.frequency.linearRampToValueAtTime(cfg.freq2, ctx.currentTime + cfg.dur / 1000)

    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.dur / 1000)
    setTimeout(() => osc.stop(), cfg.dur + 50)
  } catch {}
}

// Try to load MP3, fallback to placeholder
export async function playSound(path: string, fallbackType: Parameters<typeof playPlaceholderSound>[0]): Promise<void> {
  try {
    const audio = new Audio(path)
    await audio.play()
  } catch {
    playPlaceholderSound(fallbackType)
  }
}
