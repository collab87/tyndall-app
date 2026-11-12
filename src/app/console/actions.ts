"use server";

import { revalidatePath } from "next/cache";
import { attempt, int, need, str, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireArea } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDITOR_FEE_YEAR, PROGRAMME_SPLIT, VAT } from "@/lib/fees";
import { num } from "@/lib/format";
import { txId } from "@/lib/hash";
import { ROLE_LABEL, TYNDALL_ROLES, type Role } from "@/lib/roles";

async function staff(allowed: Role[], what: string) {
  const u = await requireArea("console");
  need(allowed.includes(u.role as Role), `As ${u.roleLabel} you cannot ${what}.`);
  return u;
}

const done = () => revalidatePath("/", "layout");

/* ——— projects ——— */

export async function decideRegistration(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER"], "screen registrations");
    const p = await db.project.findUnique({ where: { code: str(fd, "code") } });
    need(p && p.stage === "SUBMITTED", "This project is not waiting for screening.");
    const approve = str(fd, "decision") === "approve";
    const note = str(fd, "note");
    if (!approve) need(note.length >= 5, "Give the developer a reason for the rejection.");
    await db.project.update({ where: { id: p.id }, data: { stage: approve ? "APPROVED" : "REJECTED", approvedAt: approve ? new Date() : null, reviewNote: note || null } });
    await audit(u, "Approval", approve ? "Project approved · standards check passed" : `Project rejected · ${note}`, { projectId: p.id, diff: approve ? "screening → approved" : "screening → rejected" });
    done();
    return approve ? `${p.name} approved. The developer can now choose a VVB and auditor.` : `${p.name} rejected.`;
  });
}

export async function approvePdd(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER"], "approve PDDs");
    const p = await db.project.findUnique({ where: { code: str(fd, "code") } });
    need(p && p.stage === "PDD_VALIDATED", "This PDD has not been validated by the VVB.");
    await db.project.update({ where: { id: p.id }, data: { stage: "LISTED", listed: true } });
    await audit(u, "PDD", `PDD approved by Tyndall · listed with ${num(p.expectedPerYear ?? 0)} t expected per year`, { projectId: p.id, diff: "validated → listed" });
    done();
    return `${p.name} is listed on the marketplace.`;
  });
}

export async function decideScaleUp(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER"], "review scale-up");
    const p = await db.project.findUnique({ where: { code: str(fd, "code") }, include: { auditor: true } });
    need(p && p.stage === "SCALE_REVIEW", "No scale-up application is waiting.");
    const approve = str(fd, "decision") === "approve";
    if (approve) {
      const pre = p.code.replace(/^(PRJ|REG)-/, "").replace(/-/g, "");
      const mk = (kind: string, category: string, title: string, amount: number, payee: string) => ({ projectId: p.id, code: `INV-${pre}-${kind}`, kind, category, title, amount: Math.round(amount), vat: Math.round(amount * VAT), payee });
      await db.invoice.createMany({ data: [mk("SCALE", "PROJECT", "Scale-up fee (50%)", p.programmeFee * PROGRAMME_SPLIT.SCALE, "Tyndall"), mk("AUD2", "TEAM", "Auditor fee · year 2 (20% held)", AUDITOR_FEE_YEAR, p.auditor?.name ?? "Auditor")] });
    }
    await db.project.update({ where: { id: p.id }, data: { stage: approve ? "SCALE_APPROVED" : "LISTED", reviewNote: str(fd, "note") || null } });
    await audit(u, "Scale-up", approve ? "Scale-up application approved · fees invoiced" : "Scale-up returned to developer", { projectId: p.id, diff: approve ? "in review → approved" : "in review → listed" });
    done();
    return approve ? "Approved. Scale-up invoices sent to the developer." : "Returned to the developer.";
  });
}

/* ——— organisations & auditors ——— */

export async function setOrgStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER"], "review organisations");
    const o = await db.organisation.findUnique({ where: { code: str(fd, "code") } });
    need(o && o.type !== "TYNDALL", "Organisation not found.");
    const status = str(fd, "status");
    need(["VERIFIED", "SUSPENDED", "PENDING"].includes(status), "Unknown status.");
    await db.organisation.update({ where: { id: o.id }, data: { status } });
    await audit(u, "KYB", `${o.name}: ${o.status.toLowerCase()} → ${status.toLowerCase()}`, { diff: `${o.status} → ${status}` });
    done();
    return `${o.name} is now ${status.toLowerCase()}.`;
  });
}

export async function reviewAuditor(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER"], "review VVBs and auditors");
    const a = await db.auditor.findUnique({ where: { code: str(fd, "code") } });
    need(a, "Applicant not found.");
    const status = str(fd, "status"), note = str(fd, "note");
    need(["APPROVED", "REJECTED", "SUSPENDED"].includes(status), "Unknown decision.");
    if (status !== "APPROVED") need(note.length >= 5, "Record the reason. It is shared with the applicant.");
    if (status === "APPROVED") need(!a.accreditationExpiry || a.accreditationExpiry > new Date(), "The accreditation has expired. It cannot be approved.");
    await db.auditor.update({ where: { id: a.id }, data: { status, reviewNote: note || null, reviewedBy: u.name, reviewedAt: new Date() } });
    await audit(u, "Auditor registry", `${a.name} (${a.kind.toLowerCase()}) ${status.toLowerCase()}${note ? " · " + note : ""}`, { diff: `${a.status.toLowerCase()} → ${status.toLowerCase()}` });
    done();
    return `${a.name} ${status.toLowerCase()}.`;
  });
}

/* ——— issuance (four-eyes) ——— */

export async function prepareIssuance(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER"], "prepare issuance");
    const p = await db.project.findUnique({ where: { code: str(fd, "code") }, include: { invoices: true, issuances: true, findings: true } });
    need(p && p.stage === "ACTIVE", "Only projects in scale-up can issue.");
    const quantity = int(fd, "quantity"), period = str(fd, "period");
    need(quantity > 0 && period, "Enter the verified quantity and the monitoring period.");
    need(!p.issuances.some((i) => i.period === period && i.status !== "RETURNED"), `Period ${period} already has an issuance. A period can be issued once (rule ISS-02).`);
    const n = await db.issuanceRequest.count();
    const code = `IR-2026-${String(n + 13).padStart(3, "0")}`;
    await db.issuanceRequest.create({ data: { code, projectId: p.id, period, vintage: str(fd, "vintage") || "2026", quantity, inferredPct: parseFloat(str(fd, "inferred")) || 0, preparedById: u.id, preparedBy: u.name, note: str(fd, "note") || null } });
    if (!p.invoices.some((i) => i.kind === "ISSUE")) {
      const amount = p.programmeFee * PROGRAMME_SPLIT.ISSUE;
      await db.invoice.create({ data: { projectId: p.id, code: `INV-${p.code.replace(/^(PRJ|REG)-/, "").replace(/-/g, "")}-ISSUE`, kind: "ISSUE", category: "PROJECT", title: "Issuance fee (20%)", amount: Math.round(amount), vat: Math.round(amount * VAT), payee: "Tyndall" } });
    }
    await audit(u, "Issuance", `Prepared ${code} · ${num(quantity)} t · ${period}`, { projectId: p.id, diff: "— → pending" });
    done();
    return `${code} prepared. A Registry Admin must approve it.`;
  });
}

export async function decideIssuance(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "REGISTRY_ADMIN"], "approve issuance");
    const ir = await db.issuanceRequest.findUnique({ where: { code: str(fd, "code") }, include: { project: { include: { invoices: true, findings: true } } } });
    need(ir && ir.status === "PENDING", "This request is not pending.");
    need(ir.preparedById !== u.id, "You prepared this request, so you cannot approve it (rule SEP-04 · four eyes).");
    if (str(fd, "decision") === "return") {
      await db.issuanceRequest.update({ where: { id: ir.id }, data: { status: "RETURNED", approvedBy: u.name, approvedAt: new Date(), note: str(fd, "note") || ir.note } });
      await audit(u, "Issuance", `Returned ${ir.code} to the preparer`, { projectId: ir.projectId, diff: "pending → returned" });
      done();
      return `${ir.code} returned.`;
    }
    const fee = ir.project.invoices.find((i) => i.kind === "ISSUE");
    need(!fee || fee.status === "PAID", "The developer has not paid the issuance fee yet.");
    const last = await db.issuanceRequest.aggregate({ _max: { serialTo: true }, where: { projectId: ir.projectId } });
    const from = (last._max.serialTo ?? 0) + 1, to = from + ir.quantity - 1;
    const n = await db.creditBlock.count();
    const tx = txId(ir.code);
    await db.$transaction([
      db.issuanceRequest.update({ where: { id: ir.id }, data: { status: "ISSUED", approvedBy: u.name, approvedAt: new Date(), serialFrom: from, serialTo: to, tokenTx: tx } }),
      db.creditBlock.create({ data: { code: `BLK-${String(n + 1).padStart(4, "0")}`, orgId: ir.project.orgId, projectId: ir.projectId, issuanceId: ir.id, vintage: ir.vintage, serialStart: from, quantity: ir.quantity } }),
    ]);
    await audit(u, "Issuance", `Issued ${ir.code} · ${num(ir.quantity)} t · serials ${from}–${to} · ${num(ir.quantity)} tokens minted (sample)`, { projectId: ir.projectId, diff: "pending → issued" });
    done();
    return `${ir.code} issued. ${num(ir.quantity)} t delivered to the developer.`;
  });
}

/* ——— devices ——— */

export async function setDeviceStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN", "DQ_ANALYST"], "change device status");
    const d = await db.device.findUnique({ where: { imei: str(fd, "imei") } });
    need(d, "Device not found.");
    const status = str(fd, "status");
    need(["ONLINE", "FAULT", "CALIBRATION", "OFFLINE"].includes(status), "Unknown status.");
    await db.device.update({ where: { id: d.id }, data: { status } });
    await audit(u, "Data quality", `Device ${d.imei}: ${d.status.toLowerCase()} → ${status.toLowerCase()}${str(fd, "note") ? " · " + str(fd, "note") : ""}`, { projectId: d.projectId, diff: `${d.status} → ${status}` });
    done();
    return `Device ${d.imei} set to ${status.toLowerCase()}.`;
  });
}

/* ——— purchase requests ——— */

export async function setRequestStatus(fd: FormData) {
  const u = await staff(["SUPER_ADMIN", "CARBON_MANAGER", "REGISTRY_ADMIN"], "update requests");
  const r = await db.purchaseRequest.findUnique({ where: { code: str(fd, "request") } });
  const status = str(fd, "status");
  if (!r || !["NEW", "IN_DISCUSSION", "CLOSED"].includes(status)) return;
  await db.purchaseRequest.update({ where: { id: r.id }, data: { status } });
  await audit(u, "Marketplace", `Purchase request ${r.code} marked ${status.toLowerCase().replace("_", " ")}`, { projectId: r.projectId });
  done();
}

/* ——— roles ——— */

export async function grantRole(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const u = await staff(["SUPER_ADMIN"], "change roles");
    const target = await db.user.findUnique({ where: { id: str(fd, "user") } });
    need(target && TYNDALL_ROLES.includes(target.role as Role), "Choose a Tyndall staff member.");
    need(target.id !== u.id, "You cannot change your own role. Ask another Super Admin (rule SEP-00).");
    const role = str(fd, "role") as Role;
    need(TYNDALL_ROLES.includes(role), "Choose a Tyndall role.");
    need(role !== target.role, `${target.name} already holds ${ROLE_LABEL[role]}.`);
    await db.user.update({ where: { id: target.id }, data: { role } });
    await audit(u, "Roles", `Changed ${target.name}: ${ROLE_LABEL[target.role as Role]} → ${ROLE_LABEL[role]}`, { diff: `${target.role} → ${role}` });
    done();
    return `${target.name} is now ${ROLE_LABEL[role]}.`;
  });
}
