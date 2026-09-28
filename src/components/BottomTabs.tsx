import { cardOuter, pillActive, pillIdle } from '../ui/softUi'

export type AppTab = 'setup' | 'history'

interface BottomTabsProps {
  active: AppTab
  historyCount: number
  onChange: (tab: AppTab) => void
}

export function BottomTabs({ active, historyCount, onChange }: BottomTabsProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-[480px] gap-2 px-4 pb-4 pt-2 ${cardOuter}`}
      aria-label="Main"
    >
      <button
        type="button"
        className={`flex-1 ${active === 'setup' ? pillActive : pillIdle}`}
        onClick={() => onChange('setup')}
      >
        Calculator
      </button>
      <button
        type="button"
        className={`flex-1 ${active === 'history' ? pillActive : pillIdle}`}
        onClick={() => onChange('history')}
      >
        History{historyCount > 0 ? ` (${historyCount})` : ''}
      </button>
    </nav>
  )
}
