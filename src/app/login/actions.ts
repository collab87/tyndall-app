"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { areaFor } from "@/lib/roles";
import { cookieOptions, SESSION_COOKIE, signSession } from "@/lib/session";
import type { ActionResult } from "@/lib/action";

export async function login(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "That email and password do not match an account." };
  if (user.status === "DISABLED") return { error: "This account is disabled. Contact your organisation admin." };
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), status: user.status === "INVITED" ? "ACTIVE" : user.status } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession({ uid: user.id, role: user.role, name: user.name, orgId: user.orgId }), cookieOptions);
  const home = "/" + areaFor(user.role);
  redirect(next.startsWith(home) ? next : home);
}

/** One-click sign-in for the sample accounts listed on the login page. */
export async function quickLogin(fd: FormData) {
  await login({}, fd);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
