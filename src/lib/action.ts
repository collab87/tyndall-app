export type ActionResult = { ok?: string; error?: string };

/** Turns thrown errors into a displayable { error } result for forms. */
export async function attempt(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const msg = await fn();
    return { ok: msg || "Saved." };
  } catch (e) {
    // Let Next.js redirects and not-found signals through.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

export function int(fd: FormData, k: string) {
  const n = parseInt(String(fd.get(k) ?? "").replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
}

export function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
