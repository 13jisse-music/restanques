// Asset loader with fallback placeholders
// If sprite exists → use it. If not → colored rectangle.

const assetCache = new Map<string, string | null>()

export async function loadSprite(path: string): Promise<string | null> {
  if (assetCache.has(path)) return assetCache.get(path)!
  try {
    const response = await fetch(path, { method: 'HEAD' })
    if (response.ok) {
      assetCache.set(path, path)
      return path
    }
  } catch {}
  assetCache.set(path, null)
  return null
}

export function preloadSprites(paths: string[]): Promise<(string | null)[]> {
  return Promise.all(paths.map(loadSprite))
}

// Placeholder audio via Web Audio API
export function playPlaceholderSound(type: 'hit' | 'spell' | 'defend' | 'flee' | 'potion' | 'craft_success' | 'craft_fail' | 'harvest' | 'levelup' | 'portal' | 'combo' | 'death' | 'chest' | 'npc_talk' | 'notification'): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const configs: Record<string, { freq: number; vol: number; dur: number; type?: OscillatorType }> = {
      hit: { freq: 120, vol: 0.3, dur: 100 },
      spell: { freq: 880, vol: 0.2, dur: 200, type: 'sine' },
      defend: { freq: 200, vol: 0.2, dur: 150 },
      flee: { freq: 300, vol: 0.15, dur: 100 },
      potion: { freq: 523, vol: 0.2, dur: 200, type: 'sine' },
      craft_success: { freq: 660, vol: 0.25, dur: 300, type: 'sine' },
      craft_fail: { freq: 100, vol: 0.2, dur: 200 },
      harvest: { freq: 440, vol: 0.15, dur: 100, type: 'sine' },
      levelup: { freq: 784, vol: 0.3, dur: 400, type: 'sine' },
      portal: { freq: 600, vol: 0.2, dur: 300, type: 'sine' },
      combo: { freq: 1000, vol: 0.25, dur: 150, type: 'sine' },
      death: { freq: 80, vol: 0.3, dur: 500 },
      chest: { freq: 523, vol: 0.2, dur: 200, type: 'triangle' },
      npc_talk: { freq: 350, vol: 0.1, dur: 50, type: 'square' },
      notification: { freq: 880, vol: 0.15, dur: 100, type: 'sine' },
    }

    const cfg = configs[type] || configs.hit
    osc.frequency.value = cfg.freq
    osc.type = cfg.type || 'square'
    gain.gain.value = cfg.vol

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
