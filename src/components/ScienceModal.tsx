import { btnRaised, cardOuter, mutedText } from '../ui/softUi'

interface ScienceModalProps {
  open: boolean
  onClose: () => void
}

export function ScienceModal({ open, onClose }: ScienceModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="science-title"
      onClick={onClose}
    >
      <div
        className={`max-h-[80vh] w-full max-w-[440px] overflow-y-auto p-5 ${cardOuter}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="science-title" className="text-[15px] font-semibold">How this works</h2>
        <div className={`mt-3 space-y-2 text-[13px] leading-relaxed ${mutedText}`}>
          <p>
            Version 2 estimates a starting pressure from system mass, front and rear wheel load,
            tyre width, rim width, wheel diameter, and the Renart tyre pressure–deflection
            relationship. Surface roughness sets a target deflection. It is a starting point, not
            a perfect pressure.
          </p>
          <p>
            Surface roughness uses an IRI scale. A mixed ride combines road and gravel roughness
            rather than averaging two pressures.
          </p>
          <p>
            Expected average speed can shift the suggestion because speed changes vibration and
            rolling behaviour. That shift is bounded and calibrated. It is not an exact
            PSI-per-km/h rule.
          </p>
          <p>
            Wet conditions can favour a slightly lower pressure for grip. The change is
            conservative and bounded. It is not a universal wet deduction.
          </p>
          <p>
            Tube system and casing can affect how a tyre behaves. Version 2 stores them and does
            not invent unsupported PSI offsets.
          </p>
          <p>
            Tyre, rim, hookless, and manufacturer limits constrain the result. Inflation versus
            ride temperature uses the ideal-gas law.
          </p>
          <p>
            Saved ride feedback stays on this device and can gently adjust future suggestions for
            comparable setups. It does not change the underlying physical model.
          </p>
        </div>
        <button type="button" className={`mt-4 w-full ${btnRaised}`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
