import { cardOuter, mutedText, sectionTitle } from '../ui/softUi'

interface PressureResultDialProps {
  label: string
  value: string
  unit: string
}

export function PressureResultDial({ label, value, unit }: PressureResultDialProps) {
  return (
    <div className={`flex flex-col items-center p-4 ${cardOuter}`}>
      <p className={`${sectionTitle} ${mutedText}`}>{label}</p>
      <div className="relative mt-3 flex h-[108px] w-[108px] items-center justify-center rounded-full bg-[#f7f3eb] shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),_inset_-6px_-6px_12px_rgba(255,255,255,0.7)] dark:bg-[#252529] dark:shadow-[inset_6px_6px_14px_rgba(0,0,0,0.6),_inset_-6px_-6px_14px_rgba(255,255,255,0.05)]">
        <div className="text-center">
          <p className="text-[26px] font-semibold leading-none tabular-nums">{value}</p>
          <p className={`mt-1 text-[11px] ${mutedText}`}>{unit}</p>
        </div>
        <span
          className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[10px] border-x-transparent border-b-[#2b2825] dark:border-b-[#e8e6e1]"
          aria-hidden
        />
      </div>
    </div>
  )
}
