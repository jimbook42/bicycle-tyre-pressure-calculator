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
 * used to write V2.1. Standards with no stable public page are cited without a link.
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
        why: 'Shows that roughness resistance and vibration depend on vertical stiffness and the International Roughness Index. Lower stiffness, which lower pressure can provide, can reduce those losses. The paper does not provide a universal PSI calculator, and V2.1 does not copy its pressure-bound optimum.',
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
        why: 'A thin-membrane model relating load, deflection, and pressure, checked on two wheels. Version 2 investigated it as a pressure engine. V2.1 does not use it to set PSI, because the paper does not validate it as a modern riding-pressure recommendation.',
        url: 'https://arxiv.org/abs/1902.03661',
        doi: 'https://doi.org/10.1119/1.5086008',
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
        why: 'Three 28-622 tyres were tested at 54, 72, 90 and 108 PSI on a flat textured ceramic plate at very low speed. Average centre grip rose as pressure fell (0.69 at 108 PSI to 0.78 at 54 PSI). V2.1 uses the direction of that result for a 4% wet reduction. It does not treat the grip change as a PSI change.',
        url: 'https://www.bicyclerollingresistance.com/specials/wet-grip-pressure-test',
      },
      {
        title: 'Optimal tire pressure for bicycles',
        authors: 'Dave Adams, published by Bike Tinker',
        source: 'Bike Tinker',
        year: '2010',
        why: 'Gives the regression PSI = 153.6 × load_lb / width_mm^1.5785 − 7.1685 as a curve fit to Berto’s chart. V2.1 uses that fit because this repository does not contain a complete digitised chart. The interface does not call it Berto’s formula.',
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
