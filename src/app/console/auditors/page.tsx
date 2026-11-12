import { Card, Note, PageHeader, Pill, RowLink, Stat, Stats, Table, Tabs, Td } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { AUD_TONE } from "@/lib/device";

export const metadata = { title: "VVBs & auditors" };

export default async function Auditors({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireConsole("auditors");
  const { tab = "applications" } = await searchParams;
  const all = await db.auditor.findMany({ include: { _count: { select: { vvbProjects: true, auditProjects: true } } }, orderBy: { createdAt: "desc" } });
  const list = tab === "applications" ? all.filter((a) => a.status === "PENDING") : all.filter((a) => a.status !== "PENDING");
  return (
    <>
      <PageHeader title="VVBs & auditors" sub="Firms and individuals register themselves. Tyndall checks accreditation and conflicts, then approves them for specific methodologies. Developers choose only from approved parties." />
      <Stats>
        <Stat label="Applications" value={all.filter((a) => a.status === "PENDING").length} note="waiting for review" tone="warn" />
        <Stat label="Approved" value={all.filter((a) => a.status === "APPROVED").length} note={`${all.filter((a) => a.status === "APPROVED" && a.kind === "FIRM").length} firms · ${all.filter((a) => a.status === "APPROVED" && a.kind === "INDIVIDUAL").length} individuals`} tone="ok" />
        <Stat label="Suspended" value={all.filter((a) => a.status === "SUSPENDED").length} tone="bad" />
        <Stat label="Engagements" value={all.reduce((a, x) => a + x._count.vvbProjects + x._count.auditProjects, 0)} note="active project roles" tone="brand" />
      </Stats>
      <Tabs
        current={tab}
        tabs={[
          { id: "applications", label: "Applications", href: "?tab=applications", count: all.filter((a) => a.status === "PENDING").length },
          { id: "registry", label: "Registry", href: "?tab=registry" },
        ]}
      />
      <Card pad={false}>
        <Table cols={["Name", "Type", "Roles", "Methodologies", "Accreditation", "Expires", "Projects", "Status"]} minWidth={1100} empty={tab === "applications" ? "No applications waiting." : "No parties yet."}>
          {list.map((a) => (
            <tr key={a.id} className="hover:bg-surface-2/60">
              <Td>
                <RowLink href={`/console/auditors/${a.code}`}>{a.name}</RowLink>
                <div className="text-[11.5px] text-faint">
                  {a.code} · {a.city}, {a.country}
                </div>
              </Td>
              <Td>
                <Pill tone={a.kind === "FIRM" ? "seal" : "neutral"}>{a.kind === "FIRM" ? "Firm" : "Individual"}</Pill>
              </Td>
              <Td className="whitespace-nowrap">{a.roles.replace(",", " + ")}</Td>
              <Td mono className="text-[11.5px]">{a.methodologies.replace(/,/g, " · ")}</Td>
              <Td className="max-w-[220px] text-muted">{a.accreditation}</Td>
              <Td className="whitespace-nowrap">{date(a.accreditationExpiry)}</Td>
              <Td>{a._count.vvbProjects + a._count.auditProjects}</Td>
              <Td>
                <Pill tone={AUD_TONE[a.status]}>{a.status.toLowerCase()}</Pill>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Note tone="info" title="A party that consults on a project can never be its VVB. One party cannot be both VVB and auditor on the same project." rule="Rules TEAM-01 to TEAM-04" />
    </>
  );
}
