"use server";

import { revalidatePath } from "next/cache";
import { attempt, int, need, str, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

export async function requestPurchase(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const p = await db.project.findUnique({ where: { code: str(fd, "code") } });
    need(p && p.listed, "This project is not listed.");
    const quantity = int(fd, "quantity");
    need(quantity > 0, "Enter a quantity in whole tonnes.");
    const buyerName = str(fd, "buyerName"), buyerOrg = str(fd, "buyerOrg"), email = str(fd, "email");
    need(buyerName && buyerOrg && email.includes("@"), "Enter your name, organisation and a valid email.");
    const n = await db.purchaseRequest.count();
    const code = "PR-" + String(n + 1).padStart(4, "0");
    await db.purchaseRequest.create({ data: { code, projectId: p.id, buyerName, buyerOrg, email, quantity, message: str(fd, "message") || null } });
    await audit({ name: buyerName, role: "Buyer (public)" }, "Marketplace", `Purchase request ${code} · ${quantity} t from ${buyerOrg}`, { projectId: p.id });
    revalidatePath("/developer");
    return `Request ${code} sent to ${p.name}. The developer will contact you.`;
  });
}
