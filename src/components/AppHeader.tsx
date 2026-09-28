import { cardOuter, mutedText } from '../ui/softUi'
import { ThemeToggle } from './ThemeToggle'

interface AppHeaderProps {
  darkMode: boolean
  onToggleDark: () => void
  onOpenScience: () => void
}

export function AppHeader({ darkMode, onToggleDark, onOpenScience }: AppHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] ${cardOuter}`}
        >
          <img src="/app-icon.jpg" alt="" className="h-7 w-7 object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-none tracking-tight">
            Bike Tyre Pressure
          </h1>
          <p className={`mt-[2px] text-[11px] ${mutedText}`}>Frank Berto 15% drop • Open-Meteo</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenScience}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${cardOuter} ${mutedText}`}
        >
          Science
        </button>
        <ThemeToggle dark={darkMode} onToggle={onToggleDark} />
      </div>
    </header>
  )
}
