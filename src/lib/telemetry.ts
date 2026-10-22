// Deterministic sample telemetry. Readings are generated from the device
// identity and day, so every page that shows a device's history agrees.

function rand(seed: string) {
  let h = 2166136261;
  for (const c of seed) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const BASE: Record<string, { v: number; unit: string; label: string; digits: number }> = {
  TCS001: { v: 1.9, unit: "kWh", label: "Cooking energy", digits: 2 },
  TCS006: { v: 31, unit: "%", label: "Soil moisture", digits: 1 },
  TCS007: { v: 3400, unit: "L", label: "Water dispensed", digits: 0 },
  TCS009: { v: 118, unit: "km", label: "Distance", digits: 0 },
};

export function unitFor(methodology: string) {
  return BASE[methodology] ?? BASE.TCS001;
}

export type Day = { day: Date; value: number; late: boolean; gap: boolean };

/** Daily totals for the last `days` days. Offline/fault devices go dark for their final days. */
export function dailySeries(imei: string, methodology: string, status: string, days = 14): Day[] {
  const b = unitFor(methodology);
  const darkFrom = status === "OFFLINE" ? days - 4 : status === "FAULT" ? days - 2 : days + 1;
  const out: Day[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (days - 1 - i));
    const r = rand(imei + ":" + i);
    const gap = i >= darkFrom || status === "PAIRED";
    const value = gap ? 0 : +(b.v * (0.78 + r * 0.44)).toFixed(b.digits);
    out.push({ day, value, late: !gap && r > 0.93, gap });
  }
  return out;
}

export function readings(imei: string, methodology: string, n = 10) {
  const b = unitFor(methodology);
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const r = rand(imei + "r" + i);
    const measured = new Date(now - i * 37 * 60_000 - r * 600_000);
    const late = r > 0.88;
    return {
      measured,
      arrived: late ? new Date(measured.getTime() + 3 * 86400_000) : measured,
      late,
      value: +((b.v / 24) * (0.6 + r)).toFixed(b.digits === 0 ? 1 : 3),
      sig: "ed25519:" + Math.floor(r * 0xffffffff).toString(16).padStart(8, "0") + "…" + imei.slice(-4),
    };
  });
}
