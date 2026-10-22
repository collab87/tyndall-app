"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attempt, int, need, str, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { cookieOptions, SESSION_COOKIE, signSession } from "@/lib/session";

export async function applyAsAuditor(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const res = await attempt(async () => {
    const kind = str(fd, "kind") === "FIRM" ? "FIRM" : "INDIVIDUAL";
    const name = str(fd, "name"), contactName = str(fd, "contactName"), email = str(fd, "email").toLowerCase(), password = String(fd.get("password") ?? "");
    const roles = fd.getAll("roles").map(String).filter((r) => r === "VVB" || r === "AUDITOR");
    const meth = fd.getAll("meth").map(String);
    const years = int(fd, "years");
    need(name && email && str(fd, "city") && str(fd, "accreditation"), "Fill in every required field.");
    need(kind === "INDIVIDUAL" || contactName, "Name the contact person for your firm.");
    need(roles.length, "Choose at least one role: VVB, auditor or both.");
    need(meth.length, "Choose at least one methodology you are qualified for.");
    need(years >= 0, "Enter your years of experience.");
    need(password.length >= 8, "Use a password of at least 8 characters.");
    need(fd.get("coi"), "Confirm the conflict-of-interest declaration.");
    need(!(await db.user.findUnique({ where: { email } })), "An account with that email already exists.");
    const n = await db.auditor.count();
    const userName = kind === "FIRM" ? contactName : name;
    const user = await db.user.create({ data: { email, name: userName, role: "AUDITOR", title: kind === "FIRM" ? "Lead · " + name : "Independent VVB / auditor", passwordHash: await bcrypt.hash(password, 10) } });
    await db.auditor.create({
      data: {
        code: "AUD-" + String(n + 1).padStart(4, "0"), kind, name, contactName: kind === "FIRM" ? contactName : null, email, phone: str(fd, "phone") || null,
        city: str(fd, "city"), country: str(fd, "country") || "Nigeria", roles: roles.join(","), methodologies: meth.join(","), years,
        accreditation: str(fd, "accreditation"), accreditationExpiry: str(fd, "expiry") ? new Date(str(fd, "expiry")) : null, languages: str(fd, "languages") || "English",
        bio: str(fd, "bio") || null, teamSize: kind === "FIRM" ? int(fd, "teamSize") || null : null, consultsFor: str(fd, "consults") || null, status: "PENDING", userId: user.id,
      },
    });
    await audit({ name: userName, role: "Applicant" }, "Auditor registry", `${kind === "FIRM" ? "Firm" : "Individual"} ${name} applied as ${roles.join(" + ")}`, { diff: "none → pending" });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, await signSession({ uid: user.id, role: "AUDITOR", name: userName, orgId: null }), cookieOptions);
  });
  if (res.error) return res;
  redirect("/auditor");
}
