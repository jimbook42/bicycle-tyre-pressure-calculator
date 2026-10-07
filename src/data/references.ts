export interface ReferenceEntry {
  title: string
  authors: string
  source: string
  year: string
  why: string
  /** Article, preprint, or publisher page. */
  url?: string
  /** DOI URL when one was verified. */
  doi?: string
}

export interface ReferenceGroup {
  id: string
  title: string
  entries: ReferenceEntry[]
}

/**
 * Sources a reader can open. URLs below were checked against the documents
 * used to write V2.2. Standards with no stable public page are cited without a link.
 */
export const REFERENCE_GROUPS: ReferenceGroup[] = [
  {
    id: 'primary',
    title: 'Primary research',
    entries: [
      {
        title: 'Optimizing Your Tire Pressure for Your Weight',
        authors: 'Jan Heine, reviewed by Frank Berto',
        source: 'Bicycle Quarterly, Vol. 5, No. 4',
        year: '2007',
        why: 'Publishes Berto’s 15% tyre-drop chart and the worked examples this baseline is checked against. It also says average roads use that chart, very smooth roads may want a slight increase, and very rough or unpaved roads may want a reduction. It does not publish the percentages V2.1 uses.',
        url: 'https://bikesportbicycles.com/wp-content/uploads/2024/08/TireDrop-OptimizingTirePressure.pdf',
      },
      {
        title: 'All About Tire Inflation',
        authors: 'Frank Berto',
        source: 'Reprint of Berto’s tyre-inflation article',
        year: 'Measurement series described from his road-tyre tests',
        why: 'Describes the static drop tests behind the chart: road tyres, measured widths from about 19 mm to 37 mm, loads from about 20 lb to 220 lb, and pressures from about 40 PSI to 160 PSI. The 15% drop line is the reference region on that chart, not a universal optimisation law.',
        url: 'https://www.velonerd.cc/wp-content/uploads/2020/10/Frank_Berto-All_About_Tire_Inflation.pdf',
      },
      {
        title: 'Cycling on rough roads: a model for resistance and vibration',
        authors: 'Miles M. Turner',
        source: 'Vehicle System Dynamics',
        year: '2024',
        why: 'Shows that roughness resistance and vibration depend on vertical stiffness and the International Roughness Index. Lower stiffness, which lower pressure can provide, can reduce those losses. The paper does not provide a universal PSI calculator, and this app does not copy its pressure-bound optimum.',
        url: 'https://arxiv.org/abs/2405.00019',
        doi: 'https://doi.org/10.1080/00423114.2024.2304031',
      },
      {
        title:
          'The impact of tyre width, pressure and surface condition on rolling resistance and vibration transmission of bicycle tyres',
        authors: 'Jens Buder, Esteban Fouchard and Stefan Schwanitz',
        source: 'Journal of Science and Cycling, 14(2)',
        year: '2025',
        why: 'On one tyre model, width and pressure changed rolling resistance together, and surface condition was a secondary effect. Wider tyres reduced transmitted vibration more than pressure did. Those lab pressures are not copied into this calculator.',
        url: 'https://www.jsc-journal.com/index.php/JSC/article/download/1049/863/5662',
      },
      {
        title: 'A measurement system to characterize the effects of tires on bicycle vibrations',
        authors: 'Francesco Crenna, Vittorio Belotti, Alessandro Colò, Samuel Morettini and Luca Tenerini',
        source: 'Eng, 6(9), article 245. Earlier notes in this project called the journal name “Eng et al.”',
        year: '2025',
        why: 'A road measurement system found that lower pressure reduced handlebar and seatpost vibration, and that width and the presence of an inner tube also mattered, at two speeds. It does not publish a universal speed, casing, or tube PSI multiplier.',
        url: 'https://www.mdpi.com/2673-4117/6/9/245',
      },
      {
        title: 'Deformation of an inflated bicycle tire when loaded',
        authors: 'Jordi Renart and Pere Roura-Grabulosa',
        source: 'American Journal of Physics, 87, 102–109',
        year: '2019',
        why: 'Mechanical background only. A thin-membrane model relating load, deflection, and pressure, checked on two wheels. Version 2 investigated it as a pressure engine. V2.2 does not use it to set PSI. The paper does not validate it as a modern riding-pressure recommendation, and it is not the source of the front/rear damping.',
        url: 'https://arxiv.org/abs/1902.03661',
        doi: 'https://doi.org/10.1119/1.5086008',
      },
      {
        title:
          'Racing bicycle tyres – Influence on mechanical characteristics of internal pressure, vertical force, speed and temperature',
        authors: 'Gabriele Dell’Orto, Federico Maria Ballo, Gianpiero Mastinu, Massimiliano Gobbi and Gianantonio Magnani',
        source: 'European Journal of Mechanics - A/Solids, 100, 105010',
        year: '2023',
        why: 'Laboratory measurements on a road racing tyre. Static deflection at different pressures and vertical loads was used to find vertical stiffness. The abstract reports that higher inflation pressure is appropriate for heavy vertical loads, and that a tyre inflated too high at a low vertical load develops less cornering stiffness. That is evidence the useful pressure depends on load without being a straight proportion. The paper does not publish a front/rear pressure equation, and V2.2 does not copy a Dell’Orto coefficient.',
        doi: 'https://doi.org/10.1016/j.euromechsol.2023.105010',
      },
      {
        title:
          'Design and Characterization of a Single Lever Bicycle Brake with Hydraulic Pressure Proportioning',
        authors: 'Michael D. Machado and Vimal K. Viswanathan',
        source: 'Applied Sciences, 13(3), 1767',
        year: '2023',
        why: 'Gives the longitudinal load-transfer equations: front normal force rises with deceleration and rear normal force falls. It also restates a 40% front / 60% rear example, wheelbase 1.067 m and centre of gravity 1.1 m, in which a 4.91 m/s² stop leaves the rear able to take only 10% of the braking force before lockup. That example is cited from earlier braking analysis. It shows why a static 40/60 split is a poor sole design load for the front tyre. It is not a tyre-pressure formula, and the halfway gain in V2.2 is not taken from this paper.',
        url: 'https://www.mdpi.com/2076-3417/13/3/1767',
        doi: 'https://doi.org/10.3390/app13031767',
      },
    ],
  },
  {
    id: 'testing',
    title: 'Independent testing and technical evidence',
    entries: [
      {
        title: 'Wet grip at different tire pressures',
        authors: 'Jarno Bierman',
        source: 'Bicycle Rolling Resistance',
        year: '2024',
        why: 'Three 28-622 tyres were tested at 54, 72, 90 and 108 PSI on a flat textured ceramic plate at very low speed. Average centre grip rose as pressure fell (0.69 at 108 PSI to 0.78 at 54 PSI). This calculator uses the direction of that result for a 4% wet reduction. It does not treat the grip change as a PSI change.',
        url: 'https://www.bicyclerollingresistance.com/specials/wet-grip-pressure-test',
      },
      {
        title: 'Optimal tire pressure for bicycles',
        authors: 'Dave Adams, published by Bike Tinker',
        source: 'Bike Tinker',
        year: '2010',
        why: 'Gives the regression PSI = 153.6 × load_lb / width_mm^1.5785 − 7.1685 as a curve fit to Berto’s chart. This calculator uses that fit because the repository does not contain a complete digitised chart. The interface does not call it Berto’s formula.',
        url: 'http://www.biketinker.com/2010/bike-resources/optimal-tire-pressure-for-bicycles/',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Manufacturer and safety sources',
    entries: [
      {
        title: 'ISO 5775-1:2023, Bicycle tyres and rims — Part 1',
        authors: 'ISO',
        source: 'Table 3, recommended maximum inflation pressure for straight-side (hookless) rims, by section width',
        year: '2023',
        why: 'The hookless cap in this calculator is that table. A lower manufacturer maximum still wins. Hooked rims do not use the table. There is no public free copy of the standard linked here. Enter the tyre and rim maximums printed by the manufacturer; those limits are hard caps.',
      },
    ],
  },
  {
    id: 'engineering',
    title: 'Manufacturer engineering and empirical calculators',
    entries: [
      {
        title: 'Feedback from Racers: Tire Pressure Calculator 3.0',
        authors: 'Jan Heine, describing the Rene Herse calculator developed with the Cal Poly Pomona engineering department',
        source: 'Rene Herse Cycles',
        year: '2026',
        why: 'The 2026 calculator changes front and rear pressure with rider position and where extra weight sits, and it keeps the front tyre from collapsing under hard braking, when the front can carry almost the whole system. A tall, rearward rider was given a larger rear-minus-front gap than the 1 PSI he usually added. This is current empirical practice, not a published equation. V2.2 does not copy the calculator’s outputs.',
        url: 'https://www.renehersecycles.com/feedback-from-racers-tire-pressure-calculator-3-0/',
      },
      {
        title: 'How to calculate your tire pressure',
        authors: 'SRAM / Zipp',
        source: 'SRAM',
        year: 'Current product guidance',
        why: 'The Zipp tyre-pressure guide asks for the setup and returns a separate front and rear starting pressure. It says that suggestion is a starting point, and that the maximum etched on a hookless rim is not the recommended pressure. The public page does not publish the formula, so no SRAM coefficient is used here.',
        url: 'https://www.sram.com/en/zipp/learn/how-to-calculate-tire-pressure',
      },
      {
        title: 'SILCA Pro Pressure Calculator Explained',
        authors: 'Josh Poertner',
        source: 'SILCA Velo, Marginal Gains TV episode 8',
        year: '2020',
        why: 'Poertner says a garage measurement is often about 40% front and 60% rear, and that SILCA does not turn that static split into pressure. On the Pro calculator the distribution input runs from 50/50 to about 46/54, because a descent, a more aggressive position, and braking move load forward. He says athletes do not want the front about 20% below the rear. V2.2 does not copy the 46/54 limit or SILCA’s breakpoint formula.',
        url: 'https://www.youtube.com/watch?v=eyu1kDnNHKw',
      },
    ],
  },
  {
    id: 'secondary',
    title: 'Secondary and explanatory sources',
    entries: [
      {
        title: 'The same Bicycle Quarterly tyre-drop article, Rene Herse reprint',
        authors: 'Jan Heine',
        source: 'Rene Herse Cycles reprint of Bicycle Quarterly',
        year: '2007 article',
        why: 'Same chart article as the primary Berto/Heine link, hosted by the author’s current site. Useful if you want a second copy of the worked examples (20 mm at 45 kg / 55 kg: 125 / 155 PSI; 37 mm: 45 / 53 PSI).',
        url: 'https://www.renehersecycles.com/wp-content/uploads/2015/03/BQTireDrop.pdf',
      },
    ],
  },
]
