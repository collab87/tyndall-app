import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { areaFor, can, CONSOLE_SCREENS, ROLE_LABEL, type Area, type Role } from "./roles";
import { readSession, SESSION_COOKIE } from "./session";

export const currentUser = cache(async () => {
  const jar = await cookies();
  const s = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const user = await db.user.findUnique({ where: { id: s.uid }, include: { org: true, auditor: true } });
  if (!user || user.status === "DISABLED") return null;
  return { ...user, roleLabel: ROLE_LABEL[user.role as Role] ?? user.role };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireArea(area: Area) {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (areaFor(u.role) !== area) redirect("/" + areaFor(u.role));
  return u;
}

export async function requireDeveloper() {
  const u = await requireArea("developer");
  if (!u.orgId || !u.org) redirect("/login");
  return u as CurrentUser & { orgId: string; org: NonNullable<CurrentUser["org"]> };
}

export async function requireAuditor() {
  const u = await requireArea("auditor");
  if (!u.auditor) redirect("/login");
  return u as CurrentUser & { auditor: NonNullable<CurrentUser["auditor"]> };
}

export async function requireConsole(screen: keyof typeof CONSOLE_SCREENS) {
  const u = await requireArea("console");
  if (!can(u.role, CONSOLE_SCREENS[screen])) redirect("/console?denied=" + screen);
  return u;
}

/** Throws inside server actions when the actor lacks permission. */
export function assertRole(u: { role: string }, allowed: readonly string[], what: string) {
  if (!allowed.includes(u.role)) throw new Error(`Your role cannot ${what}.`);
}
