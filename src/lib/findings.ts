import type { Tone } from "./stages";

export function findingTone(f: { status: string; type: string }): [Tone, string] {
  if (f.status === "CLOSED") return ["ok", "Closed"];
  if (f.status === "RESPONDED") return ["info", "Responded"];
  if (f.type === "FAR") return ["neutral", "Ongoing"];
  return f.type === "CAR" ? ["bad", "Open · CAR"] : ["warn", "Open"];
}

export const FINDING_TYPES: [string, string][] = [
  ["CAR", "CAR · corrective action required"],
  ["CLR", "CLR · clarification request"],
  ["FAR", "FAR · forward action request"],
];
