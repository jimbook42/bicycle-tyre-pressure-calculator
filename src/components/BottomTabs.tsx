import { cardOuter, pillActive, pillIdle } from '../ui/softUi'

export type AppTab = 'calculate' | 'bikes' | 'rider' | 'feedback'

interface BottomTabsProps {
  active: AppTab
  feedbackCount: number
  onChange: (tab: AppTab) => void
}

const TABS: { id: AppTab; label: string; countKey?: 'feedback' }[] = [
  { id: 'calculate', label: 'Calculate' },
  { id: 'bikes', label: 'Bikes' },
  { id: 'rider', label: 'Rider' },
  { id: 'feedback', label: 'Feedback', countKey: 'feedback' },
]

export function BottomTabs({ active, feedbackCount, onChange }: BottomTabsProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-[480px] gap-1 px-2 pb-4 pt-2 ${cardOuter}`}
      aria-label="Main"
    >
      {TABS.map((tab) => {
        const count = tab.countKey === 'feedback' && feedbackCount > 0 ? ` (${feedbackCount})` : ''
        return (
          <button
            key={tab.id}
            type="button"
            className={`min-w-0 flex-1 truncate px-1 py-2 text-[11px] sm:text-xs ${active === tab.id ? pillActive : pillIdle}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {count}
          </button>
        )
      })}
    </nav>
  )
}
