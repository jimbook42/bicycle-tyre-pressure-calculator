import { cardOuter } from '../ui/softUi'

interface ThemeToggleProps {
  dark: boolean
  onToggle: () => void
}

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex h-[30px] w-[54px] items-center rounded-full p-1 transition-all ${cardOuter}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className={`h-[22px] w-[22px] rounded-full bg-[#2b2825] transition-transform dark:translate-x-[22px] dark:bg-[#e8e6e1]`}
      />
    </button>
  )
}
