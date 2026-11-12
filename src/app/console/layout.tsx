import type { ReactNode } from "react";
import type { NavGroup, NavItem } from "@/components/nav";
import { Shell } from "@/components/shell";
import { Pill } from "@/components/ui";
import { requireArea } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, CONSOLE_SCREENS } from "@/lib/roles";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const u = await requireArea("console");
  const [screening, applicants, pendingIr, attention, pdd, scale, kyb, requests] = await Promise.all([
    db.project.count({ where: { stage: "SUBMITTED" } }),
    db.auditor.count({ where: { status: "PENDING" } }),
    db.issuanceRequest.count({ where: { status: "PENDING" } }),
    db.device.count({ where: { status: { in: ["OFFLINE", "FAULT"] } } }),
    db.project.count({ where: { stage: "PDD_VALIDATED" } }),
    db.project.count({ where: { stage: "SCALE_REVIEW" } }),
    db.organisation.count({ where: { status: "PENDING" } }),
    db.purchaseRequest.count({ where: { status: "NEW" } }),
  ]);
  const item = (screen: keyof typeof CONSOLE_SCREENS, href: string, label: string, icon: NavItem["icon"], count?: number): NavItem | null =>
    can(u.role, CONSOLE_SCREENS[screen]) ? { href, label, icon, count: count || undefined, exact: href === "/console" } : null;
  const groups: NavGroup[] = [
    { items: [item("overview", "/console", "Overview", "home")] },
    { title: "Projects", items: [item("registrations", "/console/registrations", "Approvals", "check", screening + pdd + scale), item("projects", "/console/projects", "All projects", "folder"), item("pilots", "/console/pilots", "Pilots · 1%", "flask")] },
    { title: "Parties", items: [item("auditors", "/console/auditors", "VVBs & auditors", "users", applicants), item("organisations", "/console/organisations", "Organisations", "building", kyb)] },
    { title: "Devices & data", items: [item("devices", "/console/devices", "Fleet & data quality", "pulse", attention)] },
    { title: "Credits", items: [item("issuance", "/console/issuance", "Issuance", "coin", pendingIr), item("retirements", "/console/retirements", "Retirements", "seal"), item("marketplace", "/console/marketplace", "Marketplace", "store", requests)] },
    { title: "Governance", items: [item("users", "/console/users", "Roles & permissions", "shield"), item("audit", "/console/audit", "Audit trail", "audit")] },
  ]
    .map((g) => ({ ...g, items: g.items.filter((i): i is NavItem => !!i) }))
    .filter((g) => g.items.length);
  const hidden = Object.values(CONSOLE_SCREENS).filter((r) => !can(u.role, r)).length;
  return (
    <Shell
      area="Console"
      nav={groups}
      user={u}
      orgLine={hidden ? `${hidden} modules hidden for ${u.roleLabel}` : "Tyndall Carbon Standards · internal"}
      top={
        <div className="flex items-center gap-3 truncate text-[13px]">
          <span className="truncate font-bold text-ink">Tyndall internal console</span>
          <Pill tone="brand">{u.roleLabel}</Pill>
        </div>
      }
    >
      {children}
    </Shell>
  );
}
