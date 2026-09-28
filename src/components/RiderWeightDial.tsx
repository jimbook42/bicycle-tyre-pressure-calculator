import { cardInner, mutedText } from '../ui/softUi'

interface RiderWeightDialProps {
  kg: number
  min: number
  max: number
  onChange: (kg: number) => void
}

export function RiderWeightDial({ kg, min, max, onChange }: RiderWeightDialProps) {
  const clamped = Math.min(max, Math.max(min, kg))
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex h-[132px] w-[132px] items-center justify-center rounded-full ${cardInner}`}
      >
        <p className="text-center">
          <span className="block text-[32px] font-semibold leading-none tabular-nums">{clamped}</span>
          <span className={`mt-1 block text-[12px] ${mutedText}`}>kg</span>
        </p>
        <span
          className="absolute -top-0.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-b-[11px] border-x-transparent border-b-[#2b2825] dark:border-b-[#e8e6e1]"
          aria-hidden
        />
      </div>
      <input
        type="range"
        className="soft-range mt-4 max-w-[220px]"
        min={min}
        max={max}
        step={1}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rider weight in kilograms"
      />
      <div className={`mt-1 flex w-full max-w-[220px] justify-between text-[10px] ${mutedText}`}>
        <span>{min} kg</span>
        <span>{max} kg</span>
      </div>
    </div>
  )
}
