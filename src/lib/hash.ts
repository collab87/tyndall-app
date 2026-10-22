import { createHash } from "node:crypto";

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

/** Short display form, e.g. "9c1e…a4f2". */
export function shortHash(full: string) {
  return full.slice(0, 4) + "…" + full.slice(-4);
}

/** Demo token transaction id. Tokens are a sample feature: one token per tCO₂e. */
export function txId(seed: string) {
  return "0x" + sha256("tx:" + seed).slice(0, 40);
}

export function shortTx(tx: string) {
  return tx.slice(0, 8) + "…" + tx.slice(-4);
}

export function signingKey(seed: string) {
  return "ed25519:" + sha256("key:" + seed).slice(0, 16);
}
