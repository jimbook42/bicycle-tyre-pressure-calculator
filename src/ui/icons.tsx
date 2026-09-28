import type { RideType } from '../types'
import type { WeatherIconKind } from '../weather/weatherIcons'

const stroke = 'currentColor'
const common = {
  fill: 'none',
  stroke,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconSettings({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        {...common}
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        {...common}
        d="M19.4 13.5a7.4 7.4 0 0 0 .1-3l2-1.2-2-3.5-2.3.7a7.5 7.5 0 0 0-2.6-1.5L14.5 2h-5L9.4 5a7.5 7.5 0 0 0-2.6 1.5l-2.3-.7-2 3.5 2 1.2a7.4 7.4 0 0 0 0 3l-2 1.2 2 3.5 2.3-.7a7.5 7.5 0 0 0 2.6 1.5L9.5 22h5l.5-3a7.5 7.5 0 0 0 2.6-1.5l2.3.7 2-3.5-2-1.2Z"
      />
    </svg>
  )
}

export function IconPin({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        {...common}
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
      />
      <circle cx="12" cy="11" r="2.2" {...common} />
    </svg>
  )
}

export function IconBike({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="6.5" cy="17.5" r="3" {...common} />
      <circle cx="17.5" cy="17.5" r="3" {...common} />
      <path
        {...common}
        d="M6.5 17.5 11 8h4l2.5 4.5M11 8l2 4.5M15 8h2.5l-1 3.5M13 12.5h4"
      />
    </svg>
  )
}

export function IconPlus({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path {...common} d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconInfo({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" {...common} />
      <path {...common} d="M12 10v6M12 7h.01" />
    </svg>
  )
}

export function RideTypeIcon({
  type,
  className = 'h-4 w-4',
}: {
  type: RideType
  className?: string
}) {
  switch (type) {
    case 'road':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 18h16M6 18l3-8h6l3 8M9 10l1.5-3h5L17 10" />
        </svg>
      )
    case 'gravel':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 17h16M7 17l2-6 3 2 2-5 3 9" />
          <path {...common} d="M8 14h.01M14 12h.01M17 15h.01" />
        </svg>
      )
    case 'commute':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M5 19h14M7 19V9l5-3 5 3v10M9 12h6" />
          <path {...common} d="M12 6v3" />
        </svg>
      )
    case 'mixed':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 18h8M12 18l2-7 6 7M6 18l2-6" />
          <path {...common} d="M16 8h4v4h-4z" />
        </svg>
      )
    default:
      return null
  }
}

export function WeatherIcon({
  kind,
  className = 'h-6 w-6',
}: {
  kind: WeatherIconKind
  className?: string
}) {
  switch (kind) {
    case 'clear':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4" {...common} />
          <path {...common} d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </svg>
      )
    case 'partly-cloudy':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle cx="9" cy="9" r="3" {...common} />
          <path
            {...common}
            d="M7 18h11a3 3 0 0 0 .4-6 4 4 0 0 0-7.6-1.2A3.5 3.5 0 0 0 7 18Z"
          />
        </svg>
      )
    case 'cloudy':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M6 18h12a4 4 0 0 0 .5-8 5 5 0 0 0-9.8-1.3A4.5 4.5 0 0 0 6 18Z"
          />
        </svg>
      )
    case 'rain':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M6 14h12a4 4 0 0 0 .5-8 5 5 0 0 0-9.8-1.3A4.5 4.5 0 0 0 6 14Z"
          />
          <path {...common} d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
        </svg>
      )
    case 'snow':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17" />
        </svg>
      )
    case 'storm':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M6 13h12a4 4 0 0 0 .5-8 5 5 0 0 0-9.8-1.3A4.5 4.5 0 0 0 6 13Z"
          />
          <path {...common} d="M13 12l-3 6h3l-2 4" />
        </svg>
      )
    case 'fog':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 10h16M4 14h16M4 18h10" />
        </svg>
      )
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M12 9v6M9 12h6" />
          <circle cx="12" cy="12" r="9" {...common} />
        </svg>
      )
  }
}
