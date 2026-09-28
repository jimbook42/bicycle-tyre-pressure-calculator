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

/** Landscape line icons, 1:1 with the viewBox so strokes stay about 1.4px. */
export const RIDE_TYPE_ICON_SIZE = 'h-8 w-[4.5rem]'
/** Wider than the ride icons; the bike tile has room for it. */
export const BIKE_ICON_SIZE = 'h-11 w-[4.75rem]'

const line = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.35,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function LineIcon({
  className,
  viewBox,
  children,
}: {
  className: string
  viewBox: string
  children: ReactNode
}) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox={viewBox} aria-hidden>
      {children}
    </svg>
  )
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

/** Side-view road bike. Extra classes append; size stays applied. */
export function IconBike({ className = '' }: { className?: string }) {
  return (
    <LineIcon className={`${BIKE_ICON_SIZE} ${className}`} viewBox="0 0 88 50">
      <circle cx="18" cy="34" r="12" {...line} />
      <circle cx="70" cy="34" r="12" {...line} />
      <path {...line} strokeWidth="1.05" d="M18 22.5v23M6.5 34h23M70 22.5v23M58.5 34h23" />
      <circle cx="18" cy="34" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="70" cy="34" r="1.15" fill="currentColor" stroke="none" />
      <path {...line} d="M18 34 38 15h18l6 7 8 12" />
      <path {...line} d="M38 15v19M18 34h20M38 34 62 22" />
      <path {...line} d="M30 11h16M38 11v4" />
      <path {...line} d="M56 15c1-6 9-7 11-2" />
    </LineIcon>
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
  className = RIDE_TYPE_ICON_SIZE,
}: {
  type: RideType
  className?: string
}) {
  switch (type) {
    case 'road':
      return (
        <LineIcon className={className} viewBox="0 0 72 32">
          <path {...line} d="M4 9h64M4 23h64" />
          <path {...line} d="M10 16h8M26 16h8M42 16h8M58 16h6" />
        </LineIcon>
      )
    case 'gravel':
      return (
        <LineIcon className={className} viewBox="0 0 72 32">
          <path
            {...line}
            d="M3 11c6 0 8-5 14-5s8 5 14 5 8-5 14-5 8 5 14 5 6-5 10-5"
          />
          <path
            {...line}
            d="M3 23c6 0 8-5 14-5s8 5 14 5 8-5 14-5 8 5 14 5 6-5 10-5"
          />
          <circle cx="14" cy="17" r="1.05" fill="currentColor" />
          <circle cx="24" cy="15.5" r="0.85" fill="currentColor" />
          <circle cx="33" cy="18" r="1.15" fill="currentColor" />
          <circle cx="43" cy="15" r="0.8" fill="currentColor" />
          <circle cx="52" cy="17.5" r="1.05" fill="currentColor" />
          <circle cx="61" cy="16" r="0.75" fill="currentColor" />
        </LineIcon>
      )
    case 'commute':
      return (
        <LineIcon className={className} viewBox="0 0 72 32">
          <rect x="24" y="3.5" width="24" height="25" rx="1.4" {...line} />
          <path {...line} d="M24 8.5h24" />
          <rect x="28" y="11" width="5.5" height="5" rx="0.4" {...line} />
          <rect x="38.5" y="11" width="5.5" height="5" rx="0.4" {...line} />
          <rect x="28" y="18.5" width="5.5" height="5" rx="0.4" {...line} />
          <rect x="38.5" y="18.5" width="5.5" height="5" rx="0.4" {...line} />
          <path {...line} d="M33 28.5v-5h6v5" />
        </LineIcon>
      )
    case 'mixed':
      return (
        <LineIcon className={className} viewBox="0 0 72 32">
          <path {...line} d="M3 10h26c7 0 8-5 15-5s9 5 16 5 7-4 9-4" />
          <path {...line} d="M3 23h26c7 0 8-5 15-5s9 5 16 5 7-4 9-4" />
          <path {...line} d="M8 16.5h7M20 16.5h6" />
          <circle cx="46" cy="16.5" r="0.9" fill="currentColor" />
          <circle cx="53" cy="15" r="0.75" fill="currentColor" />
          <circle cx="59" cy="17.5" r="1" fill="currentColor" />
          <circle cx="66" cy="16" r="0.7" fill="currentColor" />
        </LineIcon>
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
