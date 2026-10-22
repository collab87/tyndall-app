// Fee schedule. Every fee is set by device/unit count or a flat rate.
// No function here takes tonnage or credit price as an input (rule FEE-01).

export const VAT = 0.075;
export const REG_FEE = 350_000;
export const VVB_FEE = 1_800_000; // pilot validation + PDD validation
export const AUDITOR_FEE_YEAR = 1_200_000;
export const AUDITOR_HOLDBACK = 0.2;

export const BANDS = [
  { id: "A", label: "Band A · up to 100 units", max: 100, fee: 1_200_000 },
  { id: "B", label: "Band B · 101–1,000 units", max: 1000, fee: 3_000_000 },
  { id: "C", label: "Band C · 1,001–5,000 units", max: 5000, fee: 6_000_000 },
  { id: "D", label: "Band D · over 5,000 units", max: Infinity, fee: 9_000_000 },
];

export function bandFor(units: number) {
  return BANDS.find((b) => units <= b.max) ?? BANDS[BANDS.length - 1];
}

export const PROGRAMME_SPLIT = { INIT: 0.3, SCALE: 0.5, ISSUE: 0.2 };

export function withVat(amount: number) {
  return Math.round(amount * (1 + VAT));
}

export function vatOf(amount: number) {
  return Math.round(amount * VAT);
}

export function pilotUnits(units: number) {
  return Math.max(1, Math.ceil(units * 0.01));
}
