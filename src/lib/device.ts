import type { Tone } from "./stages";

export const DEVICE_TONE: Record<string, [Tone, string]> = {
  ONLINE: ["ok", "Online"],
  OFFLINE: ["neutral", "Offline"],
  FAULT: ["bad", "Fault"],
  CALIBRATION: ["info", "Calibration"],
  PAIRED: ["warn", "Awaiting install"],
};

export const AUD_TONE: Record<string, Tone> = { APPROVED: "ok", PENDING: "warn", REJECTED: "neutral", SUSPENDED: "bad" };

export function deviceTone(status: string): [Tone, string] {
  return DEVICE_TONE[status] ?? ["neutral", status];
}
