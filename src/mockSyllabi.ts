export interface MockSyllabus {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  sourceText: string;
}

export const MOCK_SYLLABI: MockSyllabus[] = [
  {
    id: "cbse-10-physics",
    title: "CBSE Class 10 Science (Physics & Optics Focus)",
    subject: "Science (Physics)",
    gradeLevel: "Grade 10 (Secondary)",
    sourceText: `CLASS X PHYSICS SYLLABUS - ACADEMIC REVELATION
Unit 1: Light - Reflection and Refraction
Reflection of light by curved surfaces; Images formed by spherical mirrors, centre of curvature, principal axis, principal focus, focal length, mirror formula (derivation not required), magnification. Refraction; Laws of refraction, refractive index. Refraction of light by spherical lens; Image formed by spherical lenses; Lens formula (derivation not required); Magnification. Power of a lens.

Unit 2: Human Eye and Colorful World
Refraction of light through a prism, dispersion of light, scattering of light, applications in daily life (excluding color of sun at sunrise and sunset).

Unit 3: Electricity and Circuit Currents
Electric current, potential difference and electric current. Ohm's law; Resistance, Resistivity, Factors on which the resistance of a conductor depends. Series combination of resistors, parallel combination of resistors and its applications in daily life. Heating effect of electric current and its applications in daily life. Electric power, Interrelation between P, V, I and R.

Unit 4: Magnetic Effects of Current
Magnetic field, field lines, field due to a current carrying conductor, field due to current carrying coil or solenoid; Force on current carrying conductor, Fleming's Left Hand Rule, Direct current. Alternating current: frequency of AC. Advantage of AC over DC. Domestic electric circuits.`
  },
  {
    id: "cambridge-chemistry",
    title: "Cambridge IGCSE Chemistry Syllabus",
    subject: "Chemistry",
    gradeLevel: "IGCSE Year 10-11",
    sourceText: `CAMBRIDGE INTERNATIONAL IGCSE CHEMISTRY SYLLABUS SECTION
Unit C1: States of Matter & Experimental Techniques
Kinetic particle theory, diffusion, states of matter changes. Measurement of time, temperature, mass and volume. Chromatographic techniques, paper chromatography, Rf values. Purification methods: filtration, crystallization, simple and fractional distillation.

Unit C2: Atoms, Elements and Compounds
Atomic structure, protons, neutrons and electrons. Bonding: Ionic, covalent, macromolecular structures (diamond, graphite, silicon dioxide). Metallic bonding definitions and giant structures.

Unit C3: Acids, Bases, Salts & Qualitative Analysis
The characteristic properties of acids and bases, pH scale, role of indicators. Types of oxides: acidic, basic, amphoteric. Preparation, separation and purification of soluble and insoluble salts. Qualitative tests for anions, cations, and gases (e.g. Carbonates, Halides, Copper, Iron, Oxygen, Hydrogen, Carbon Dioxide).

Unit C4: Chemical Reactions & Rates
Physical and chemical changes. Reversible reactions and chemical equilibria. Factors affecting reaction rates: concentration, temperature, surface area, and catalysts.`
  },
  {
    id: "montessori-theme",
    title: "Kamala Niketan Montessori Nature & Botantical Explorers",
    subject: "Environmental & Botanical Studies",
    gradeLevel: "Montessori Early Years (Ages 4-6)",
    sourceText: `MONTESSORI CLASSROOM OUTLINE: SEASONS & BOTANICAL LIFE CYCLES
Theme A: The Seed and the Soil
Introduction to soil texture, compost, and the magic of germination. Interactive sensory work: handling potting soil, planting broad bean seeds in transparent cups, observing roots, stem, and leaf development.

Theme B: Parts of a Plant and Tree (Montessori Three-Part Cards)
Nomenclature of the root, stem, leaf, flower, and fruit. Puzzle-board exercises. Matching physical leaf structures with botanical cards (lanceolate, cordate, palmated). Collect leaf specimens from the school garden.

Theme C: Weather Systems and Sensory Observations
The cycle of water: evaporation, condensation, precipitation. Creating matching jars, reading thermometers, logging rain indicators. Introduction to weather vocabulary: sunny, overcast, blustery, monsoon.

Theme D: Helpful Insects and Garden Helpers
The life of bees, pollen dispersion, and ladybugs. Building a wormery to understand soil aeration and nature's decomposers.`
  }
];
