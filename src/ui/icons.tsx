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

const dot = { fill: 'currentColor', stroke: 'none' as const }

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

/** Road-racing bike — drop bars, slim wheels (side view). */
export function IconBike({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="5.5" cy="16.5" r="2.35" {...common} />
      <circle cx="18.5" cy="16.5" r="2.35" {...common} />
      <path {...common} d="M5.5 16.5 8.8 9.8 13.8 10.6 18.5 16.5" />
      <path {...common} d="M8.8 9.8 9.6 7.6" />
      <path {...common} d="M13.8 10.6 14.4 8.4" />
      <path {...common} d="M10.8 7.8 12.2 6.6 14.8 7.4" />
      <path {...common} d="M14.4 8.4 14.8 7.4" />
      <circle cx="5.5" cy="16.5" r="0.55" {...dot} />
    </Svg>
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

function IconRoadSurface({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...common} d="M5 7.5 9.5 19.5h5L19 7.5" />
      <path
        {...common}
        strokeDasharray="2.5 2.5"
        d="M12 9v9.5"
      />
    </Svg>
  )
}

function IconGravelSurface({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path
        {...common}
        d="M3 14.5c2.2-2.8 3.8-.8 5.5-2.2 1.4-1.2 2.6-2.6 4.5-1.2 1.6 1.2 3.2.4 4.5-1.8 1-1.6 2.2-2.2 3.5-1.5"
      />
      <circle cx="6.5" cy="12.8" r="0.65" {...dot} />
      <circle cx="10" cy="14.8" r="0.55" {...dot} />
      <circle cx="13.5" cy="12.2" r="0.6" {...dot} />
      <circle cx="16.8" cy="14.5" r="0.5" {...dot} />
      <circle cx="19.2" cy="12.8" r="0.55" {...dot} />
    </Svg>
  )
}

function IconCommuteBuilding({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...common} d="M5 20V9h14v11" />
      <path {...common} d="M9 20v-4h6v4" />
      <path {...common} d="M8 6h8v3H8z" />
      <rect x="7.5" y="11" width="2.2" height="2.2" rx="0.3" {...common} />
      <rect x="11" y="11" width="2.2" height="2.2" rx="0.3" {...common} />
      <rect x="14.5" y="11" width="2.2" height="2.2" rx="0.3" {...common} />
      <rect x="7.5" y="14.5" width="2.2" height="2.2" rx="0.3" {...common} />
      <rect x="11" y="14.5" width="2.2" height="2.2" rx="0.3" {...common} />
      <rect x="14.5" y="14.5" width="2.2" height="2.2" rx="0.3" {...common} />
    </Svg>
  )
}

function IconMixedSurface({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...common} d="M3 16.5h9" />
      <path {...common} strokeDasharray="2 2" d="M7.5 14.8v3.4" />
      <path
        {...common}
        d="M12 16.5c1.2-1.6 2.2-.6 3.2-1.8.9-1 2-1.4 3.3-.5 1 .7 1.8.2 2.5-1.2"
      />
      <circle cx="15" cy="14.2" r="0.45" {...dot} />
      <circle cx="17.8" cy="15.8" r="0.4" {...dot} />
      <circle cx="20" cy="14.5" r="0.45" {...dot} />
    </Svg>
  )
}

export function RideTypeIcon({
  type,
  className = 'h-6 w-6',
}: {
  type: RideType
  className?: string
}) {
  switch (type) {
    case 'road':
      return <IconRoadSurface className={className} />
    case 'gravel':
      return <IconGravelSurface className={className} />
    case 'commute':
      return <IconCommuteBuilding className={className} />
    case 'mixed':
      return <IconMixedSurface className={className} />
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
