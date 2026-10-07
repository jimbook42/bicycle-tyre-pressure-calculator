import { REFERENCE_GROUPS } from '../data/references'
import { btnRaised, cardOuter, mutedText, sectionTitle } from '../ui/softUi'

interface ReferencesPanelProps {
  open: boolean
  onClose: () => void
}

export function ReferencesPanel({ open, onClose }: ReferencesPanelProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="references-title"
      onClick={onClose}
    >
      <div
        className={`max-h-[85vh] w-full max-w-[440px] overflow-y-auto p-5 ${cardOuter}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="references-title" className={sectionTitle}>
          References
        </h2>
        <p className={`mt-3 text-[13px] leading-relaxed ${mutedText}`}>
          These are the sources behind Version 2.2. A direct measurement is not the same thing as
          a model inference, and a calibration percentage is not a published formula.
        </p>
        <div className="mt-4 space-y-5">
          {REFERENCE_GROUPS.map((group) => (
            <section key={group.id}>
              <h3 className="text-[13px] font-semibold">{group.title}</h3>
              <ul className="mt-2 space-y-3">
                {group.entries.map((entry) => (
                  <li key={entry.title} className={`text-[13px] leading-relaxed ${mutedText}`}>
                    <p className="font-medium text-[#2b2825] dark:text-[#e8e6e1]">{entry.title}</p>
                    <p>
                      {entry.authors}. {entry.source}. {entry.year}.
                    </p>
                    <p className="mt-1">{entry.why}</p>
                    <p className="mt-1 flex flex-col gap-1">
                      {entry.url && (
                        <a
                          className="underline"
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open source
                        </a>
                      )}
                      {entry.doi && (
                        <a className="underline" href={entry.doi} target="_blank" rel="noreferrer">
                          DOI
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button type="button" className={`mt-4 w-full ${btnRaised}`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
