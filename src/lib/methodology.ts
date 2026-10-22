// Methodology-driven content: PDD template sections, pilot baseline parameters,
// and the per-unit reduction factor used for expected-credit estimates.

type Section = { code: string; title: string; kind?: "PILOT" | "AUTO" };

const PART1: Section[] = [
  { code: "1.1", title: "Purpose and general description" },
  { code: "1.2", title: "Project design" },
  { code: "1.3", title: "Technologies and measures" },
  { code: "1.4", title: "Physical and geographical location" },
  { code: "1.5", title: "Ownership and carbon rights" },
  { code: "1.6", title: "Project start date and crediting period" },
  { code: "1.7", title: "Scale and estimated reductions", kind: "AUTO" },
  { code: "1.8", title: "SDG contribution and safeguards" },
];
const PART2: Section[] = [
  { code: "2.1", title: "Reference of methodology", kind: "AUTO" },
  { code: "2.2", title: "Applicability of methodology" },
  { code: "2.3", title: "Additionality" },
  { code: "2.4", title: "Methodology deviations" },
];
const PART4: Section[] = [
  { code: "4.1", title: "Monitoring plan" },
  { code: "4.2", title: "Data management and hashing", kind: "AUTO" },
  { code: "4.3", title: "Stakeholder consultation and benefit sharing" },
  { code: "A", title: "Annexes · maps, evidence, declarations" },
];

const PART3: Record<string, Section[]> = {
  TCS001: [
    { code: "3.1", title: "Baseline fuel use", kind: "PILOT" },
    { code: "3.2", title: "Project emissions" },
    { code: "3.3", title: "Leakage" },
    { code: "3.4", title: "Net emission reductions", kind: "AUTO" },
    { code: "3.5", title: "Data monitored · cooking energy (kWh)" },
  ],
  TCS006: [
    { code: "3.1", title: "Baseline · 3-year practice look-back", kind: "PILOT" },
    { code: "3.2", title: "Project SOC stock change" },
    { code: "3.3", title: "N₂O from fertiliser" },
    { code: "3.4", title: "Net reductions and removals", kind: "AUTO" },
    { code: "3.5", title: "Data monitored · SOC samples and soil probes" },
  ],
  TCS007: [
    { code: "3.1", title: "Baseline emissions · boiling water", kind: "PILOT" },
    { code: "3.2", title: "Project emissions · kiosk energy" },
    { code: "3.3", title: "Leakage" },
    { code: "3.4", title: "Net emission reductions", kind: "AUTO" },
    { code: "3.5", title: "Data monitored · litres dispensed" },
  ],
  TCS009: [
    { code: "3.1", title: "Baseline emissions · petrol vehicles", kind: "PILOT" },
    { code: "3.2", title: "Project emissions · charging" },
    { code: "3.3", title: "Leakage" },
    { code: "3.4", title: "Net emission reductions", kind: "AUTO" },
    { code: "3.5", title: "Data monitored · km and kWh" },
  ],
};

export function pddTemplate(methodologyCode: string) {
  const parts: [string, Section[]][] = [
    ["Part 1 · Project details", PART1],
    ["Part 2 · Methodology", PART2],
    ["Part 3 · Quantification", PART3[methodologyCode] ?? PART3.TCS001],
    ["Part 4 · Monitoring and annexes", PART4],
  ];
  let sort = 0;
  return parts.flatMap(([part, list]) => list.map((s) => ({ ...s, part, kind: s.kind ?? "TEXT", sort: sort++ })));
}

/** Baseline parameters produced by a validated pilot, per methodology. */
export const PILOT_BASELINE: Record<string, [string, string, string][]> = {
  TCS001: [
    ["Firewood use per household", "2.9", "kg/day"],
    ["Non-renewable biomass fraction f_NRB", "0.84", ""],
    ["Emission factor, wood", "112", "tCO₂/TJ"],
    ["Average cooking energy (metered)", "1.86", "kWh/day"],
  ],
  TCS006: [
    ["Tillage events per year", "3", "events"],
    ["N fertiliser applied", "120", "kg/ha"],
    ["SOC stock 0–30 cm", "28.4", "t/ha"],
  ],
  TCS007: [
    ["Share of households boiling water X_boil", "0.71", ""],
    ["Energy to boil 1 L (SEC)", "376", "kJ/L"],
    ["Non-renewable biomass fraction f_NRB", "0.84", ""],
    ["Emission factor, wood", "112", "tCO₂/TJ"],
  ],
  TCS009: [
    ["Specific fuel consumption, petrol", "0.0401", "L/km"],
    ["Baseline emission factor EF_BL,km", "92.6", "gCO₂/km"],
    ["Project emission factor EF_PJ,km", "28.7", "gCO₂/km"],
    ["Annual distance per vehicle", "41,600", "km"],
  ],
};

/** tCO₂e per unit per year, used only for the expected-credits estimate shown at listing. */
export const REDUCTION_PER_UNIT: Record<string, number> = {
  TCS001: 2.0,
  TCS006: 1.85,
  TCS007: 12.4,
  TCS009: 2.6,
};

export function expectedPerYear(methodologyCode: string, units: number) {
  return Math.round((REDUCTION_PER_UNIT[methodologyCode] ?? 1) * units);
}

export const UNIT_TYPES = ["Stoves", "Vehicles", "Water kiosks", "Hectares", "Meters"];
