import type { ReactNode } from "react";
import type { NavGroup } from "@/components/nav";
import { Shell } from "@/components/shell";
import { Pill } from "@/components/ui";
import { requireAuditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUD_TONE } from "@/lib/device";

export default async function AuditorLayout({ children }: { children: ReactNode }) {
  const u = await requireAuditor();
  const open = await db.finding.count({ where: { auditorId: u.auditor.id, status: "RESPONDED" } });
  const nav: NavGroup[] = [
    { items: [{ href: "/auditor", label: "Engagements", icon: "folder", exact: true }] },
    { title: "Work", items: [{ href: "/auditor/findings", label: "Findings", icon: "flag", count: open || undefined }] },
    { title: "Account", items: [{ href: "/auditor/profile", label: "Registration", icon: "shield" }] },
  ];
  return (
    <Shell
      area="VVB & auditor"
      nav={nav}
      user={{ name: u.name, roleLabel: u.auditor.kind === "FIRM" ? u.auditor.name : "Independent" }}
      orgLine={`${u.auditor.code} · ${u.auditor.roles.replace(",", " + ")}`}
      top={
        <div className="flex items-center gap-3 truncate text-[13px]">
          <span className="truncate font-bold text-ink">{u.auditor.name}</span>
          <Pill tone={AUD_TONE[u.auditor.status]}>{u.auditor.status === "APPROVED" ? "Approved by Tyndall" : u.auditor.status.toLowerCase()}</Pill>
        </div>
      }
    >
      {children}
    </Shell>
  );
}
