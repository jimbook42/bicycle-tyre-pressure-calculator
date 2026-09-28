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
            Baseline pressures use the Frank Berto 15% tyre-drop model from total system weight,
            nominal tyre width, tube type, and surface mix.
          </p>
          <p>
            Optional weather adjusts gauge pressure for inflation vs ride temperature (ideal gas
            law) and can subtract about 2 PSI when wet.
          </p>
          <p>
            Saved ride notes nudge recommendations for matching setups on this device only — they do
            not change the baseline formula.
          </p>
        </div>
        <button type="button" className={`mt-4 w-full ${btnRaised}`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
