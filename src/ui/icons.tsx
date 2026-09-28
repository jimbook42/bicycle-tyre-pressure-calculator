import type { ReactNode } from 'react'
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

const RIDE_TYPE_ICON_SRC: Record<RideType, string> = {
  road: '/icons/ride-road.png',
  gravel: '/icons/ride-gravel.png',
  commute: '/icons/ride-commute.png',
  mixed: '/icons/ride-mixed.png',
}

function Svg({
  className = 'h-5 w-5',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconSettings({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <Svg className={className}>
      <path
        {...common}
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        {...common}
        d="M19.4 13.5a7.4 7.4 0 0 0 .1-3l2-1.2-2-3.5-2.3.7a7.5 7.5 0 0 0-2.6-1.5L14.5 2h-5L9.4 5a7.5 7.5 0 0 0-2.6 1.5l-2.3-.7-2 3.5 2 1.2a7.4 7.4 0 0 0 0 3l-2 1.2 2 3.5 2.3-.7a7.5 7.5 0 0 0 2.6 1.5L9.5 22h5l.5-3a7.5 7.5 0 0 0 2.6-1.5l2.3.7 2-3.5-2-1.2Z"
      />
    </Svg>
  )
}

export function IconPin({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...common} d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2" {...common} />
    </Svg>
  )
}

/** Brand road-bike artwork (light strokes; inverted on light theme). */
export function IconBike({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img
      src="/icons/bike-road.png"
      alt=""
      className={`shrink-0 object-contain invert dark:invert-0 ${className}`}
      width={32}
      height={32}
      decoding="async"
      draggable={false}
    />
  )
}

export function IconPlus({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...common} d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconInfo({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" {...common} />
      <path {...common} d="M12 10v6M12 7h.01" />
    </Svg>
  )
}

export function RideTypeIcon({
  type,
  className = 'h-7 w-7',
}: {
  type: RideType
  className?: string
}) {
  const src = RIDE_TYPE_ICON_SRC[type]
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      className={`shrink-0 object-contain invert dark:invert-0 ${className}`}
      width={28}
      height={28}
      decoding="async"
      draggable={false}
    />
  )
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
        <Svg className={className}>
          <circle cx="12" cy="12" r="4" {...common} />
          <path {...common} d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </Svg>
      )
    case 'partly-cloudy':
      return (
        <Svg className={className}>
          <circle cx="9" cy="9" r="3" {...common} />
          <path
            {...common}
            d="M7 18h11a3 3 0 0 0 .4-6 4 4 0 0 0-7.6-1.2A3.5 3.5 0 0 0 7 18Z"
          />
        </Svg>
      )
    case 'cloudy':
      return (
        <Svg className={className}>
          <path
            {...common}
            d="M6 18h12a4 4 0 0 0 .5-8 5 5 0 0 0-9.8-1.3A4.5 4.5 0 0 0 6 18Z"
          />
        </Svg>
      )
    case 'rain':
      return (
        <Svg className={className}>
          <path
            {...common}
            d="M6 14h12a4 4 0 0 0 .5-8 5 5 0 0 0-9.8-1.3A4.5 4.5 0 0 0 6 14Z"
          />
          <path {...common} d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
        </Svg>
      )
    case 'snow':
      return (
        <Svg className={className}>
          <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17" />
        </Svg>
      )
    case 'storm':
      return (
        <Svg className={className}>
          <path
            {...common}
            d="M6 13h12a4 4 0 0 0 .5-8 5 5 0 0 0-9.8-1.3A4.5 4.5 0 0 0 6 13Z"
          />
          <path {...common} d="M13 12l-3 6h3l-2 4" />
        </Svg>
      )
    case 'fog':
      return (
        <Svg className={className}>
          <path {...common} d="M4 10h16M4 14h16M4 18h10" />
        </Svg>
      )
    default:
      return (
        <Svg className={className}>
          <path {...common} d="M12 9v6M9 12h6" />
          <circle cx="12" cy="12" r="9" {...common} />
        </Svg>
      )
  }
}
