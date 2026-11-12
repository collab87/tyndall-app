import type { ReactNode } from "react";
import type { NavGroup } from "@/components/nav";
import { Shell } from "@/components/shell";
import { Pill } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  const u = await requireDeveloper();
  const [due, openFindings, requests] = await Promise.all([
    db.invoice.count({ where: { status: "DUE", project: { orgId: u.orgId } } }),
    db.finding.count({ where: { status: "OPEN", type: { not: "FAR" }, project: { orgId: u.orgId } } }),
    db.purchaseRequest.count({ where: { status: "NEW", project: { orgId: u.orgId } } }),
  ]);
  const nav: NavGroup[] = [
    { items: [{ href: "/developer", label: "Overview", icon: "home", exact: true }] },
    {
      title: "Projects",
      items: [
        { href: "/developer/projects", label: "My projects", icon: "folder" },
        { href: "/developer/projects/new", label: "Create project", icon: "plus" },
      ],
    },
    {
      title: "Across projects",
      items: [
        { href: "/developer/findings", label: "Findings", icon: "flag", count: openFindings || undefined },
        { href: "/developer/payments", label: "Payments", icon: "invoice", count: due || undefined },
        { href: "/developer/credits", label: "Credits & retirement", icon: "coin" },
        { href: "/developer/requests", label: "Buyer requests", icon: "store", count: requests || undefined },
      ],
    },
    {
      title: "Records",
      items: [
        { href: "/developer/audit", label: "Audit log", icon: "key" },
        { href: "/developer/team", label: "Team members", icon: "users" },
      ],
    },
  ];
  return (
    <Shell
      area="Developer"
      nav={nav}
      user={u}
      orgLine={`${u.org.name} · ${u.org.code}`}
      top={
        <div className="flex items-center gap-3 truncate text-[13px]">
          <span className="truncate font-bold text-ink">{u.org.name}</span>
          {u.org.status === "VERIFIED" ? <Pill tone="ok">KYB verified</Pill> : u.org.status === "SUSPENDED" ? <Pill tone="bad">Suspended</Pill> : <Pill tone="warn">KYB in review</Pill>}
        </div>
      }
    >
      {children}
    </Shell>
  );
}
