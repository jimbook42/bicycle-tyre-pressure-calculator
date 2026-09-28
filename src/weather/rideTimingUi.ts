import type { WeatherSettingsStored } from '../types'

export function localDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function isRideLater(weather: WeatherSettingsStored): boolean {
  return weather.timingMode !== 'now'
}

export function rideDateForDisplay(weather: WeatherSettingsStored, referenceNow = new Date()): string {
  if (weather.timingMode === 'tomorrow') {
    const t = new Date(referenceNow)
    t.setDate(t.getDate() + 1)
    return localDateString(t)
  }
  if (weather.timingMode === 'future' && weather.rideDate.trim()) {
    return weather.rideDate.trim()
  }
  return localDateString(referenceNow)
}

export function timingPatchForLaterDate(
  rideDate: string,
  referenceNow = new Date(),
): Pick<WeatherSettingsStored, 'timingMode' | 'rideDate'> {
  const today = localDateString(referenceNow)
  if (rideDate === today) {
    return { timingMode: 'today', rideDate: rideDate }
  }
  const tomorrow = new Date(referenceNow)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = localDateString(tomorrow)
  if (rideDate === tomorrowStr) {
    return { timingMode: 'tomorrow', rideDate: rideDate }
  }
  return { timingMode: 'future', rideDate: rideDate }
}

export function formatLaterWhenLabel(weather: WeatherSettingsStored, referenceNow = new Date()): string {
  const date = rideDateForDisplay(weather, referenceNow)
  const today = localDateString(referenceNow)
  const tomorrow = new Date(referenceNow)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = localDateString(tomorrow)
  const dayLabel =
    date === today ? 'Today' : date === tomorrowStr ? 'Tomorrow' : date
  const time = weather.startTime || '09:00'
  const [h, m] = time.split(':').map(Number)
  const when = new Date(referenceNow)
  when.setHours(h || 0, m || 0, 0, 0)
  const timeLabel = when.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${dayLabel}, ${timeLabel}`
}
