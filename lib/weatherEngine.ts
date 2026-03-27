// Meteo - change toutes les 5-10 min
export type Weather = 'clear' | 'rain' | 'fog' | 'wind'

const WEATHER_WEIGHTS: Record<Weather, number> = {
  clear: 50, rain: 20, fog: 15, wind: 15,
}

export function rollWeather(): Weather {
  const total = Object.values(WEATHER_WEIGHTS).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const [w, weight] of Object.entries(WEATHER_WEIGHTS)) {
    roll -= weight
    if (roll <= 0) return w as Weather
  }
  return 'clear'
}

export function getWeatherEffect(weather: Weather) {
  switch (weather) {
    case 'rain': return { plantGrowth: 1.5, moveSpeed: 1, visibility: 1, desc: 'Pluie - plantes x1.5' }
    case 'fog': return { plantGrowth: 1, moveSpeed: 1, visibility: 0.5, desc: 'Brouillard - visibilite reduite' }
    case 'wind': return { plantGrowth: 1, moveSpeed: 0.7, visibility: 1, desc: 'Vent - deplacement ralenti' }
    default: return { plantGrowth: 1, moveSpeed: 1, visibility: 1, desc: 'Temps clair' }
  }
}

export function getNextWeatherChange(): number {
  return (5 + Math.random() * 5) * 60 * 1000 // 5-10 min en ms
}
