import "server-only";
import { db } from "./db";
import { sha256 } from "./hash";

/** Recomputes the whole audit chain. Any edited row breaks every hash after it. */
export async function verifyChain() {
  const rows = await db.auditLog.findMany({ orderBy: { at: "asc" } });
  let prev: string | null = null;
  for (const [i, r] of rows.entries()) {
    const h = sha256([prev ?? "genesis", r.at.toISOString(), r.actorName, r.actorRole, r.projectId ?? "", r.phase, r.action, r.diff ?? ""].join("|"));
    if (h !== r.hash || r.prevHash !== prev) return { ok: false as const, count: rows.length, brokenAt: i, head: rows.at(-1)?.hash ?? null };
    prev = r.hash;
  }
  return { ok: true as const, count: rows.length, head: prev };
}

/** Daily anchor batches: one summary hash per day over that day's entries. */
export async function anchorBatches(limit = 7) {
  const rows = await db.auditLog.findMany({ orderBy: { at: "desc" }, take: 500, select: { at: true, hash: true } });
  const byDay = new Map<string, string[]>();
  for (const r of rows) {
    const k = r.at.toISOString().slice(0, 10);
    byDay.set(k, [...(byDay.get(k) ?? []), r.hash]);
  }
  return [...byDay.entries()].slice(0, limit).map(([day, hashes]) => ({ day, count: hashes.length, root: sha256(hashes.sort().join("")) }));
}
