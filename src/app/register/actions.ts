"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attempt, need, str, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { cookieOptions, SESSION_COOKIE, signSession } from "@/lib/session";

export async function registerDeveloper(_: ActionResult, fd: FormData): Promise<ActionResult> {
  let uid = "";
  const res = await attempt(async () => {
    const org = str(fd, "org"), regNumber = str(fd, "regNumber"), country = str(fd, "country") || "Nigeria", address = str(fd, "address");
    const name = str(fd, "name"), email = str(fd, "email").toLowerCase(), password = String(fd.get("password") ?? "");
    need(org && regNumber && name && email, "Fill in every field.");
    need(password.length >= 8, "Use a password of at least 8 characters.");
    need(fd.get("terms"), "Confirm the declarations to continue.");
    need(!(await db.user.findUnique({ where: { email } })), "An account with that email already exists. Sign in instead.");
    const n = await db.organisation.count();
    const created = await db.organisation.create({
      data: {
        code: `ORG-${country === "Nigeria" ? "NG" : country.slice(0, 2).toUpperCase()}-${String(n + 20).padStart(4, "0")}`,
        name: org, type: "DEVELOPER", country, regNumber, address, status: "PENDING",
        users: { create: { email, name, role: "DEV_ADMIN", title: str(fd, "title") || "Organisation admin", passwordHash: await bcrypt.hash(password, 10) } },
      },
      include: { users: true },
    });
    uid = created.users[0].id;
    await audit({ name, role: "Organisation admin" }, "Registration", `Organisation ${org} registered · KYB pending`, { diff: "none → pending" });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, await signSession({ uid, role: "DEV_ADMIN", name, orgId: created.id }), cookieOptions);
  });
  if (res.error) return res;
  redirect("/developer");
}
