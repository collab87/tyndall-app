import "server-only";
import { db } from "./db";
import { sha256 } from "./hash";

type Actor = { name: string; roleLabel?: string; role?: string };

/**
 * Append an entry to the audit trail. Each entry's hash chains to the previous
 * one, so altering any past row breaks every hash after it.
 */
export async function audit(actor: Actor, phase: string, action: string, opts: { projectId?: string | null; diff?: string } = {}) {
  const prev = await db.auditLog.findFirst({ orderBy: { at: "desc" }, select: { hash: true } });
  const at = new Date();
  const actorRole = actor.roleLabel ?? actor.role ?? "System";
  const hash = sha256([prev?.hash ?? "genesis", at.toISOString(), actor.name, actorRole, opts.projectId ?? "", phase, action, opts.diff ?? ""].join("|"));
  return db.auditLog.create({
    data: { at, actorName: actor.name, actorRole, projectId: opts.projectId ?? null, phase, action, diff: opts.diff, hash, prevHash: prev?.hash ?? null },
  });
}

export async function nextCode(prefix: string, count: () => Promise<number>, pad = 4) {
  const n = (await count()) + 1;
  return prefix + String(n).padStart(pad, "0");
}
