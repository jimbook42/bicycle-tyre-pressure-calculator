import { IconSettings } from '../ui/icons'
import { cardOuter } from '../ui/softUi'
import { ThemeToggle } from './ThemeToggle'

interface AppHeaderProps {
  darkMode: boolean
  onToggleDark: () => void
  onOpenSettings: () => void
}

export function AppHeader({ darkMode, onToggleDark, onOpenSettings }: AppHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3 px-4 pt-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="/favicon.svg"
          alt=""
          className="h-10 w-10 shrink-0 object-contain"
        />
        <h1 className="truncate text-[15px] font-semibold leading-none tracking-tight">
          Bike Tyre Pressure
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${cardOuter}`}
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <IconSettings className="h-[18px] w-[18px] text-[#2b2825] dark:text-[#e8e6e1]" />
        </button>
        <ThemeToggle dark={darkMode} onToggle={onToggleDark} />
      </div>
    </header>
  )
}
