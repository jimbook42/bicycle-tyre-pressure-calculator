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
        className={`max-h-[85vh] w-full max-w-[440px] overflow-y-auto p-5 ${cardOuter}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="science-title" className="text-[15px] font-semibold">
          How this pressure is built
        </h2>
        <div className={`mt-3 space-y-3 text-[13px] leading-relaxed ${mutedText}`}>
          <p>
            Version 2.1 gives an evidence-backed starting pressure for this rider, tyre, load, and
            ride. It is not a scientifically proven optimum, and it is not a guarantee of the
            fastest or safest pressure.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">
            Empirical baseline
          </h3>
          <p>
            Frank Berto measured static tyre drop on road tyres, about 19–37 mm wide, at wheel
            loads of about 20–220 lb and pressures of about 40–160 PSI. The chart’s reference
            region is about 15% drop. Per-wheel load and measured width both change that pressure.
            Front and rear are calculated separately. The app does not force them into the
            wheel-load ratio.
          </p>
          <p>
            The number itself comes from Dave Adams’s published curve fit to that chart, not from
            an equation Berto wrote. Where a measured width is missing, the labelled width is
            used. Outside the measured width, load, or pressure region, the result is flagged as
            an extrapolation. The 15% figure is a reference region from those tests, not proof
            that every ride is fastest at exactly 15% drop.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">
            Surface adjustment
          </h3>
          <p>
            Turner’s 2024 model links roughness resistance and vibration to vertical stiffness and
            road roughness (IRI). Lower stiffness can reduce those losses. Bicycle Quarterly also
            says a slight increase can suit a very smooth road, and a reduction can suit a very
            rough or unpaved road. Turner does not hand back a universal PSI formula, and this
            app does not turn IRI into a deflection and then into pressure.
          </p>
          <p>
            Normal road keeps the Berto baseline. Other surfaces apply a bounded percentage
            around it, in 2-point steps, never more than 10%. That percentage is an
            evidence-informed engineering calibration. It is not a published “rough roads need X%
            less” rule. You choose a ride condition. You do not enter an IRI value.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">Wet grip</h3>
          <p>
            Bicycle Rolling Resistance tested three 28 mm road tyres at 54, 72, 90 and 108 PSI on
            a flat textured ceramic plate at very low speed. Average wet grip increased at lower
            pressure. That grip percentage is not copied into PSI. Wet or likely-wet conditions
            lower the target by 4%, on each wheel, before the safety limits. Damp forecasts use
            the same step, because the test did not separate drizzle from rain.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">
            What does not change PSI
          </h3>
          <p>
            Speed can change vibration, but the evidence here does not support a universal
            speed-to-PSI rule, so speed is not applied. Casing and tube type can change rolling
            resistance, grip, puncture risk, and vibration. Crenna and colleagues measured tube
            and pressure effects on one road setup. That is not a general casing or tubeless
            multiplier, so none is applied. Rim internal width and wheel diameter are stored with
            the bike and are not part of this baseline.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">
            Temperature, safety, and your notes
          </h3>
          <p>
            The baseline is the pressure to ride at. Ideal-gas temperature correction only changes
            what to set on the pump so the tyre reaches that pressure at the expected riding
            temperature. It is not folded into the Berto number.
          </p>
          <p>
            Tyre minimum, tyre or rim maximum, and the ISO 5775-1 hookless caps are applied after
            the condition adjustments. If a target is capped, the usable pressure is the cap. The
            cap is not the model’s original target. There is no Renart 30% section-height floor.
          </p>
          <p>
            Saved ride notes can nudge a comparable setup, inside a fixed cap, after the safety
            check. They do not replace the empirical baseline, and updating this model does not
            delete them.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">
            Other 2025 measurements
          </h3>
          <p>
            Buder, Fouchard and Schwanitz found that width and pressure trade off rolling
            resistance, and that a rougher lab surface mattered, on one tyre model. Wider tyres
            reduced vibration more than pressure did. Those pressures are not copied here.
          </p>
          <h3 className="font-semibold text-[#2b2825] dark:text-[#e8e6e1]">Renart</h3>
          <p>
            Renart and Roura-Grabulosa modelled an inflated tyre as a thin membrane and related
            load, deflection, and pressure. Version 2 investigated that relationship as the
            pressure engine. It is not the production authority in Version 2.1. The paper does not
            validate it as a direct modern recommendation for what to pump into a bicycle tyre.
            The code remains only as a scientific reference.
          </p>
        </div>
        <button type="button" className={`mt-4 w-full ${btnRaised}`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
