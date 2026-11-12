import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";

/** Loads a project owned by the signed-in developer's organisation, or 404s. */
export const loadProject = cache(async (code: string) => {
  const u = await requireDeveloper();
  const p = await db.project.findUnique({
    where: { code },
    include: { methodology: true, pilot: true, vvb: true, auditor: true, org: true, _count: { select: { devices: true, findings: true } } },
  });
  if (!p || p.orgId !== u.orgId) notFound();
  return { u, p };
});
