"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { attempt, int, need, str, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDITOR_FEE_YEAR, bandFor, PROGRAMME_SPLIT, REG_FEE, VAT, VVB_FEE } from "@/lib/fees";
import { naira, num } from "@/lib/format";
import { sha256, signingKey, txId } from "@/lib/hash";
import { expectedPerYear } from "@/lib/methodology";
import { DEV_CAN, DEV_ROLES, ROLE_LABEL, type Role } from "@/lib/roles";
import { ineligibility } from "@/lib/rules";

async function me(perm: keyof typeof DEV_CAN, what: string) {
  const u = await requireDeveloper();
  need((DEV_CAN[perm] as readonly string[]).includes(u.role), `As ${u.roleLabel} you cannot ${what}.`);
  return u;
}

async function ownProject(code: string, orgId: string) {
  const p = await db.project.findUnique({ where: { code }, include: { methodology: true, pilot: true, vvb: true, auditor: true } });
  need(p && p.orgId === orgId, "Project not found.");
  return p;
}

function done(code?: string) {
  revalidatePath("/developer", "layout");
  if (code) revalidatePath(`/developer/projects/${code}`, "layout");
}

const invoiceData = (projectId: string, code: string, kind: string, category: string, title: string, amount: number, payee: string) => ({
  projectId,
  code: `INV-${code.replace(/^(PRJ|REG)-/, "").replace(/-/g, "")}-${kind}`,
  kind,
  category,
  title,
  amount: Math.round(amount),
  vat: Math.round(amount * VAT),
  payee,
});

/* ——— create project ——— */

export async function createProject(_: ActionResult, fd: FormData): Promise<ActionResult> {
  let code = "";
  const res = await attempt(async () => {
    const u = await me("createProject", "create projects");
    const name = str(fd, "name"), about = str(fd, "about"), activity = str(fd, "activity"), location = str(fd, "location");
    const units = int(fd, "units");
    const m = await db.methodology.findUnique({ where: { code: str(fd, "methodology") } });
    need(name && about.length >= 20 && activity && location, "Fill in the project basics. The public description needs at least 20 characters.");
    need(m, "Choose a methodology.");
    need(units > 0, "Enter the number of planned units.");
    need(str(fd, "instrument") && str(fd, "interval") && str(fd, "calibration"), "Name the instrument, its reporting interval and calibration regime. No instrument, no listing (rule GATE-01).");
    need(fd.get("rights"), "Confirm you hold, or will hold, the carbon rights.");
    need(fd.get("rpConfirm"), "Complete the related-party declaration.");
    const band = bandFor(units);
    const n = await db.project.count();
    code = `REG-2026-${String(n + 44).padStart(4, "0")}`;
    const p = await db.project.create({
      data: {
        code, name, about, activity, location, orgId: u.orgId, methodologyId: m.id, units, unitType: str(fd, "unitType") || "Units",
        instrument: str(fd, "instrument"), interval: str(fd, "interval"), calibration: str(fd, "calibration"), creditingYears: int(fd, "crediting") || 10,
        startDate: str(fd, "startDate") || null, feeBand: band.label, programmeFee: band.fee, consultant: str(fd, "consultant") || null,
        relatedParty: str(fd, "relatedParty") || null, rightsDeclared: true, expectedPerYear: expectedPerYear(m.code, units),
      },
    });
    await db.invoice.create({ data: invoiceData(p.id, code, "REG", "PROJECT", "Project registration fee", REG_FEE, "Tyndall") });
    await audit(u, "Registration", `Project ${name} created · declarations signed`, { projectId: p.id, diff: "none → draft" });
  });
  if (res.error) return res;
  done();
  redirect(`/developer/projects/${code}`);
}

/* ——— payments ——— */

/** Pay invoices, then apply any stage change that payment unlocks. */
export async function payInvoices(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("pay", "pay invoices");
    const ids = fd.getAll("invoice").map(String);
    const method = str(fd, "method") || "Card · Paystack";
    need(ids.length, "Choose at least one invoice.");
    const list = await db.invoice.findMany({ where: { id: { in: ids }, status: "DUE" }, include: { project: { include: { org: true } } } });
    need(list.length, "Those invoices are already paid.");
    for (const inv of list) {
      need(inv.project.orgId === u.orgId, "Invoice not found.");
      if (inv.kind === "REG") need(inv.project.org.status === "VERIFIED", "Tyndall must verify your organisation (KYB) before you submit a project. Check Organisation status on the overview.");
    }
    for (const inv of list) {
      await db.invoice.update({ where: { id: inv.id }, data: { status: "PAID", paidAt: new Date(), paidBy: u.name, method } });
      await audit(u, "Payments", `Paid ${inv.code} · ${inv.title} · ${naira(inv.amount + inv.vat)}`, { projectId: inv.projectId, diff: "due → paid" });
    }
    for (const pid of new Set(list.map((i) => i.projectId))) {
      const p = await db.project.findUniqueOrThrow({ where: { id: pid }, include: { invoices: true } });
      const paid = (k: string) => p.invoices.some((i) => i.kind === k && i.status === "PAID");
      if (p.stage === "DRAFT" && paid("REG")) {
        await db.project.update({ where: { id: pid }, data: { stage: "SUBMITTED", submittedAt: new Date() } });
        await audit(u, "Registration", "Project submitted for Tyndall screening", { projectId: pid, diff: "draft → submitted" });
      }
      if (p.stage === "SCALE_APPROVED" && paid("SCALE") && paid("AUD2")) {
        await db.project.update({ where: { id: pid }, data: { stage: "ACTIVE" } });
        await audit(u, "Scale-up", "Scale-up fees paid · rollout started", { projectId: pid, diff: "approved → active" });
      }
    }
    done();
    const total = list.reduce((a, i) => a + i.amount + i.vat, 0);
    return `${naira(total)} paid · ${list.length} invoice${list.length > 1 ? "s" : ""}.`;
  });
}

/* ——— team ——— */

export async function engageTeam(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const code = str(fd, "code");
  const res = await attempt(async () => {
    const u = await me("chooseTeam", "choose the VVB and auditor");
    const p = await ownProject(code, u.orgId);
    need(p.stage === "APPROVED", "You choose the team after Tyndall approves the project.");
    const [vvb, aud] = await Promise.all([db.auditor.findUnique({ where: { id: str(fd, "vvb") } }), db.auditor.findUnique({ where: { id: str(fd, "auditor") } })]);
    need(vvb && aud, "Select one VVB and one auditor.");
    const why = ineligibility(vvb, p, "VVB", { auditorId: aud.id }) || ineligibility(aud, p, "AUDITOR", { vvbId: vvb.id });
    need(!why, why);
    need((DEV_CAN.pay as readonly string[]).includes(u.role), "Engaging the team pays their fees. Ask your organisation admin to confirm checkout.");
    await db.invoice.createMany({
      data: [
        { ...invoiceData(p.id, p.code, "INIT", "PROJECT", "Initiation fee · pilot stage (30%)", p.programmeFee * PROGRAMME_SPLIT.INIT, "Tyndall"), status: "PAID", paidAt: new Date(), paidBy: u.name, method: str(fd, "method") },
        { ...invoiceData(p.id, p.code, "VVB", "TEAM", "VVB fee · pilot and PDD validation", VVB_FEE, vvb.name), status: "PAID", paidAt: new Date(), paidBy: u.name, method: str(fd, "method") },
        { ...invoiceData(p.id, p.code, "AUD1", "TEAM", "Auditor fee · year 1 (20% held)", AUDITOR_FEE_YEAR, aud.name), status: "PAID", paidAt: new Date(), paidBy: u.name, method: str(fd, "method") },
      ],
    });
    const pilotUnits = Math.max(1, Math.ceil(p.units * 0.01));
    await db.project.update({ where: { id: p.id }, data: { vvbId: vvb.id, auditorId: aud.id, stage: "PILOT", pilot: { create: { units: pilotUnits } } } });
    await audit(u, "Team", `Engaged VVB ${vvb.name} and auditor ${aud.name} · fees paid · conflict declarations signed`, { projectId: p.id, diff: "approved → pilot" });
  });
  if (res.error) return res;
  done(code);
  redirect(`/developer/projects/${code}/pilot`);
}

/* ——— pilot ——— */

export async function savePilotPlan(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("pilot", "plan the pilot");
    const p = await ownProject(str(fd, "code"), u.orgId);
    need(p.pilot && p.pilot.status === "PLANNING", "The pilot plan is locked once the pilot starts.");
    const plan = str(fd, "plan");
    need(plan.length >= 10, "Describe the pilot units, sites and routes.");
    await db.pilot.update({ where: { id: p.pilot.id }, data: { plan, comparison: str(fd, "comparison") || null, durationDays: int(fd, "duration") || 90 } });
    await audit(u, "Pilot", "Pilot plan saved", { projectId: p.id });
    done(p.code);
    return "Pilot plan saved.";
  });
}

export async function registerDevices(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("devices", "register devices");
    const p = await ownProject(str(fd, "code"), u.orgId);
    const serials = [...new Set(str(fd, "serials").split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))];
    const model = str(fd, "model") || "Your model";
    const location = str(fd, "location") || "Not installed";
    need(serials.length, "Enter at least one equipment serial.");
    const pilotPhase = p.stage === "PILOT";
    need(pilotPhase || p.stage === "ACTIVE" || p.stage === "SCALE_APPROVED", "Devices are registered during the pilot, and again at scale-up.");
    if (pilotPhase) {
      need(p.pilot?.status === "PLANNING", "Pilot units are fixed once the pilot starts.");
      const have = await db.device.count({ where: { projectId: p.id, isPilot: true } });
      need(have + serials.length <= p.pilot.units, `The pilot is 1% of units: ${p.pilot.units} devices. You have ${have} registered.`);
    }
    const clash = await db.device.findMany({ where: { serial: { in: serials } }, select: { serial: true } });
    need(!clash.length, `Already paired in a Tyndall project (a serial can only be paired once): ${clash.map((c) => c.serial).join(", ")}`);
    const base = 356938040000000 + (await db.device.count()) * 17;
    for (const [i, serial] of serials.entries()) {
      const imei = String(base + i * 17);
      await db.device.create({ data: { imei, serial, model, location, projectId: p.id, isPilot: pilotPhase, signingKey: signingKey(imei), status: "PAIRED" } });
    }
    await audit(u, "Devices", `Registered ${serials.length} equipment serial${serials.length > 1 ? "s" : ""} and paired with meters${pilotPhase ? " (pilot)" : ""}`, { projectId: p.id, diff: "none → paired" });
    done(p.code);
    return `${serials.length} serial${serials.length > 1 ? "s" : ""} paired with Tyndall meters.`;
  });
}

export async function startPilot(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("pilot", "start the pilot");
    const p = await ownProject(str(fd, "code"), u.orgId);
    need(p.pilot?.status === "PLANNING", "The pilot has already started.");
    need(p.pilot.plan, "Save the pilot plan first.");
    const n = await db.device.count({ where: { projectId: p.id, isPilot: true } });
    need(n === p.pilot.units, `Register all ${p.pilot.units} pilot units first (${n} so far).`);
    await db.device.updateMany({ where: { projectId: p.id, isPilot: true }, data: { status: "ONLINE", commissionedAt: new Date(), lastSeenAt: new Date(), completeness: 99 } });
    await db.pilot.update({ where: { id: p.pilot.id }, data: { status: "RUNNING", startedAt: new Date() } });
    await audit(u, "Pilot", `Pilot started · ${n} units commissioned`, { projectId: p.id, diff: "plan → running" });
    done(p.code);
    return "Pilot started. Readings now count toward the baseline.";
  });
}

export async function submitPilotReport(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("pilot", "submit the pilot report");
    const p = await ownProject(str(fd, "code"), u.orgId);
    need(p.pilot?.status === "RUNNING", "Only a running pilot can be reported.");
    const day = Math.floor((Date.now() - (p.pilot.startedAt?.getTime() ?? Date.now())) / 86400_000);
    const note = str(fd, "note");
    await db.pilot.update({ where: { id: p.pilot.id }, data: { status: "REPORTED", reportedAt: new Date(), reportNote: note || null } });
    await audit(u, "Pilot", `Pilot report submitted to VVB on day ${day} of ${p.pilot.durationDays}`, { projectId: p.id, diff: "running → reported" });
    done(p.code);
    return `Report sent to ${p.vvb?.name ?? "your VVB"} for validation.`;
  });
}

/* ——— PDD ——— */

export async function savePddSection(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("editPdd", "edit the PDD");
    const p = await ownProject(str(fd, "code"), u.orgId);
    need(p.stage === "PDD", p.stage === "PDD_REVIEW" ? "The PDD is with your VVB. Wait for comments." : "The PDD is not open for editing.");
    const s = await db.pddSection.findUnique({ where: { projectId_code: { projectId: p.id, code: str(fd, "section") } } });
    need(s && s.kind === "TEXT", "This section is filled by the platform.");
    const content = str(fd, "content");
    const complete = str(fd, "intent") === "complete";
    if (complete) need(content.length >= 30, "Write at least a short paragraph (30+ characters) before marking complete.");
    await db.pddSection.update({ where: { id: s.id }, data: { content, evidence: str(fd, "evidence") || s.evidence, status: complete ? "COMPLETE" : s.status === "COMMENT" ? "COMMENT" : "TODO", comment: complete ? null : s.comment } });
    if (complete) await audit(u, "PDD", `Section ${s.code} ${s.title} marked complete`, { projectId: p.id, diff: s.status.toLowerCase() + " → complete" });
    done(p.code);
    return complete ? `Section ${s.code} complete.` : "Draft saved.";
  });
}

export async function submitPdd(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("editPdd", "submit the PDD");
    const p = await ownProject(str(fd, "code"), u.orgId);
    need(p.stage === "PDD", "The PDD is not in drafting.");
    const open = await db.pddSection.count({ where: { projectId: p.id, status: { not: "COMPLETE" } } });
    need(!open, `${open} section${open > 1 ? "s are" : " is"} not complete.`);
    const sections = await db.pddSection.findMany({ where: { projectId: p.id }, orderBy: { sort: "asc" } });
    const hash = sha256(sections.map((s) => s.code + s.content).join("|"));
    await db.project.update({ where: { id: p.id }, data: { stage: "PDD_REVIEW", pddHash: hash, pddVersion: { increment: 1 } } });
    await audit(u, "PDD", `PDD v${p.pddVersion + 1} submitted to VVB ${p.vvb?.name}`, { projectId: p.id, diff: "draft → with VVB" });
    done(p.code);
    return "PDD locked and submitted to your VVB.";
  });
}

/* ——— scale-up ——— */

export async function applyScaleUp(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("createProject", "apply for scale-up");
    const p = await ownProject(str(fd, "code"), u.orgId);
    need(p.stage === "LISTED", "Scale-up opens after the PDD is approved.");
    need(fd.get("decl"), "Confirm your declarations are still accurate.");
    const plan = str(fd, "plan");
    need(plan.length >= 10, "Describe the rollout phases.");
    await db.project.update({ where: { id: p.id }, data: { stage: "SCALE_REVIEW", scalePlan: plan } });
    await audit(u, "Scale-up", "Scale-up application submitted", { projectId: p.id, diff: "listed → in review" });
    done(p.code);
    return "Scale-up application sent to Tyndall.";
  });
}

/* ——— findings ——— */

export async function respondFinding(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("respond", "respond to findings");
    const f = await db.finding.findUnique({ where: { code: str(fd, "finding") }, include: { project: true, auditor: true } });
    need(f && f.project.orgId === u.orgId, "Finding not found.");
    need(f.status === "OPEN" && f.type !== "FAR", "This finding is not waiting for a response.");
    const response = str(fd, "response");
    need(response.length >= 10, "Explain what you did and where the evidence is.");
    await db.finding.update({ where: { id: f.id }, data: { status: "RESPONDED", response, evidence: str(fd, "evidence") || null, respondedAt: new Date() } });
    await audit(u, f.phase.split(" ·")[0], `Responded to ${f.code}`, { projectId: f.projectId, diff: "open → responded" });
    done();
    return `Response sent to ${f.auditor.name}.`;
  });
}

/* ——— credits ——— */

export async function retireCredits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  let code = "";
  const res = await attempt(async () => {
    const u = await me("retire", "retire credits");
    const b = await db.creditBlock.findUnique({ where: { code: str(fd, "block") }, include: { project: true } });
    need(b && b.orgId === u.orgId, "Choose a block you hold.");
    const qty = int(fd, "quantity");
    need(qty > 0 && qty <= b.quantity, `Enter a quantity between 1 and ${num(b.quantity)}.`);
    const beneficiary = str(fd, "beneficiary"), reason = str(fd, "reason");
    need(beneficiary && reason, "Name the beneficiary and the claim.");
    const n = await db.retirement.count();
    code = `RT-2026-${String(n + 1).padStart(4, "0")}`;
    await db.$transaction([
      db.creditBlock.update({ where: { id: b.id }, data: { quantity: b.quantity - qty, serialStart: b.serialStart + qty } }),
      db.retirement.create({ data: { code, orgId: u.orgId, projectId: b.projectId, vintage: b.vintage, quantity: qty, serialStart: b.serialStart, serialEnd: b.serialStart + qty - 1, beneficiary, reason, claimPeriod: str(fd, "period") || "FY2026", burnTx: txId(code), retiredBy: u.name } }),
    ]);
    await audit(u, "Retirement", `Retired ${num(qty)} t for ${beneficiary} · ${code} · ${num(qty)} tokens burned (sample)`, { projectId: b.projectId, diff: "held → retired" });
  });
  if (res.error) return res;
  done();
  redirect(`/verify/${code}`);
}

export async function setPurchaseStatus(fd: FormData) {
  const u = await requireDeveloper();
  const r = await db.purchaseRequest.findUnique({ where: { code: str(fd, "request") }, include: { project: true } });
  if (!r || r.project.orgId !== u.orgId) return;
  const status = str(fd, "status");
  if (!["NEW", "IN_DISCUSSION", "CLOSED"].includes(status)) return;
  await db.purchaseRequest.update({ where: { id: r.id }, data: { status } });
  await audit(u, "Marketplace", `Purchase request ${r.code} marked ${status.toLowerCase().replace("_", " ")}`, { projectId: r.projectId });
  done();
}

/* ——— team members ——— */

export async function inviteMember(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("manageTeam", "invite team members");
    const name = str(fd, "name"), email = str(fd, "email").toLowerCase(), role = str(fd, "role") as Role;
    need(name && email.includes("@"), "Enter a name and a valid email.");
    need(DEV_ROLES.includes(role), "Choose a role.");
    need(!(await db.user.findUnique({ where: { email } })), "Someone with that email already has an account.");
    const temp = randomBytes(5).toString("hex");
    await db.user.create({ data: { name, email, role, orgId: u.orgId, title: ROLE_LABEL[role], status: "INVITED", passwordHash: await bcrypt.hash(temp, 10) } });
    await audit(u, "Team members", `Invited ${name} as ${ROLE_LABEL[role]}`);
    done();
    return `Invited ${name}. Temporary password: ${temp}. Share it securely; it is not shown again.`;
  });
}

export async function changeMemberRole(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await me("manageTeam", "change roles");
    const target = await db.user.findUnique({ where: { id: str(fd, "user") } });
    need(target && target.orgId === u.orgId, "Member not found.");
    need(target.id !== u.id, "You cannot change your own role (rule SEP-00).");
    const role = str(fd, "role") as Role;
    need(DEV_ROLES.includes(role), "Choose a role.");
    await db.user.update({ where: { id: target.id }, data: { role } });
    await audit(u, "Team members", `Changed ${target.name}: ${ROLE_LABEL[target.role as Role]} → ${ROLE_LABEL[role]}`);
    done();
    return `${target.name} is now ${ROLE_LABEL[role]}.`;
  });
}
