"use server";

import { revalidatePath } from "next/cache";
import { attempt, need, str, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireAuditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/hash";
import { PILOT_BASELINE, pddTemplate } from "@/lib/methodology";

/** Loads a project the signed-in party is engaged on, in the given capacity. */
async function engaged(code: string, as: "VVB" | "AUDITOR" | "ANY") {
  const u = await requireAuditor();
  need(u.auditor.status === "APPROVED", "Your registration is not approved yet.");
  const p = await db.project.findUnique({ where: { code }, include: { pilot: true, methodology: true } });
  need(p, "Project not found.");
  const isVvb = p.vvbId === u.auditor.id, isAud = p.auditorId === u.auditor.id;
  need(as === "VVB" ? isVvb : as === "AUDITOR" ? isAud : isVvb || isAud, "You are not engaged on this project in that role.");
  return { u, p, actor: { name: u.auditor.name, role: isVvb ? "VVB" : "Auditor" } };
}

const done = (code: string) => {
  revalidatePath("/auditor", "layout");
  revalidatePath(`/developer/projects/${code}`, "layout");
};

export async function decidePilot(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const { p, actor } = await engaged(str(fd, "code"), "VVB");
    need(p.pilot?.status === "REPORTED", "There is no pilot report waiting for you.");
    const note = str(fd, "note");
    if (str(fd, "decision") === "return") {
      need(note.length >= 5, "Tell the developer what more you need.");
      await db.pilot.update({ where: { id: p.pilot.id }, data: { status: "RUNNING", vvbNote: note } });
      await audit(actor, "Pilot", `Pilot report returned · ${note}`, { projectId: p.id, diff: "reported → running" });
      done(p.code);
      return "Returned to the developer.";
    }
    const tmpl = pddTemplate(p.methodology.code);
    await db.$transaction([
      db.pilot.update({ where: { id: p.pilot.id }, data: { status: "VALIDATED", validatedAt: new Date(), baseline: JSON.stringify(PILOT_BASELINE[p.methodology.code] ?? []), vvbNote: note || "Baseline validated." } }),
      db.project.update({ where: { id: p.id }, data: { stage: "PDD", pddVersion: 1 } }),
      ...tmpl.map((s) => db.pddSection.upsert({ where: { projectId_code: { projectId: p.id, code: s.code } }, create: { projectId: p.id, code: s.code, part: s.part, title: s.title, kind: s.kind, sort: s.sort, status: s.kind === "TEXT" ? "TODO" : "COMPLETE" }, update: {} })),
    ]);
    await audit(actor, "Pilot", "Pilot validated · baseline signed and locked into PDD 3.1", { projectId: p.id, diff: "reported → validated" });
    done(p.code);
    return "Pilot validated. The developer's PDD is open with the baseline imported.";
  });
}

export async function commentPdd(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const { p, actor } = await engaged(str(fd, "code"), "VVB");
    need(p.stage === "PDD_REVIEW", "The PDD is not with you for review.");
    const comment = str(fd, "comment"), section = str(fd, "section");
    need(comment.length >= 5, "Write the comment for the developer.");
    const s = await db.pddSection.findUnique({ where: { projectId_code: { projectId: p.id, code: section } } });
    need(s && s.kind === "TEXT", "Choose a section the developer writes.");
    await db.pddSection.update({ where: { id: s.id }, data: { status: "COMMENT", comment } });
    await db.project.update({ where: { id: p.id }, data: { stage: "PDD" } });
    await audit(actor, "PDD", `Commented on section ${s.code} · PDD returned to developer`, { projectId: p.id, diff: "with VVB → draft" });
    done(p.code);
    return `Comment sent on ${s.code}. The PDD is back with the developer.`;
  });
}

export async function validatePdd(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const { p, actor } = await engaged(str(fd, "code"), "VVB");
    need(p.stage === "PDD_REVIEW", "The PDD is not with you for review.");
    const sections = await db.pddSection.findMany({ where: { projectId: p.id }, orderBy: { sort: "asc" } });
    await db.project.update({ where: { id: p.id }, data: { stage: "PDD_VALIDATED", pddHash: sha256(sections.map((s) => s.code + s.content).join("|")) } });
    await audit(actor, "PDD", `PDD v${p.pddVersion} validated · sent to Tyndall for approval`, { projectId: p.id, diff: "with VVB → validated" });
    done(p.code);
    return "PDD validated. Tyndall approves it next.";
  });
}

export async function raiseFinding(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const { u, p, actor } = await engaged(str(fd, "code"), "ANY");
    const type = str(fd, "type");
    need(["CAR", "CLR", "FAR"].includes(type), "Choose a finding type.");
    const title = str(fd, "title"), detail = str(fd, "detail"), request = str(fd, "request");
    need(title && detail && request, "Fill in the title, what you found and what is needed.");
    const n = await db.finding.count();
    const code = `${type}-${p.code.slice(-4)}-${String(n + 1).padStart(2, "0")}`;
    const phase = p.stage === "PILOT" ? "Pilot" : p.stage.startsWith("PDD") ? "PDD" : "Monitoring";
    await db.finding.create({ data: { code, projectId: p.id, auditorId: u.auditor.id, type, phase, title, detail, request, atStake: str(fd, "atStake") || null, due: str(fd, "due") ? new Date(str(fd, "due")) : null } });
    await audit(actor, phase, `Raised ${code} · ${title}`, { projectId: p.id });
    done(p.code);
    return `${code} raised and sent to the developer.`;
  });
}

export async function closeFinding(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await requireAuditor();
    const f = await db.finding.findUnique({ where: { code: str(fd, "finding") }, include: { project: true } });
    need(f && f.auditorId === u.auditor.id, "You can only decide findings you raised.");
    const accept = str(fd, "decision") === "accept";
    need(f.status === "RESPONDED" || (f.type === "FAR" && f.status === "OPEN"), "The developer has not responded yet.");
    await db.finding.update({ where: { id: f.id }, data: accept ? { status: "CLOSED", closedAt: new Date() } : { status: "OPEN", respondedAt: null } });
    await audit({ name: u.auditor.name, role: f.project.vvbId === u.auditor.id ? "VVB" : "Auditor" }, f.phase.split(" ·")[0], accept ? `Accepted response · closed ${f.code}` : `Re-opened ${f.code} · response not sufficient`, { projectId: f.projectId, diff: accept ? "responded → closed" : "responded → open" });
    done(f.project.code);
    return accept ? `${f.code} closed.` : `${f.code} re-opened.`;
  });
}
