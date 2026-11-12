import { Card, PageHeader, Pill, RowLink, Table, Td } from "@/components/ui";
import { requireAuditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { findingTone } from "@/lib/findings";
import { date } from "@/lib/format";

export const metadata = { title: "Findings" };

export default async function AuditorFindings() {
  const u = await requireAuditor();
  const findings = await db.finding.findMany({ where: { auditorId: u.auditor.id }, include: { project: true }, orderBy: [{ status: "desc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title="Findings" sub="Findings you raised. Responded findings are waiting for your decision." />
      <Card pad={false}>
        <Table cols={["Finding", "Project", "Type", "Raised", "Due", "Status"]} minWidth={900} empty="You have not raised any findings.">
          {findings.map((f) => {
            const [t, l] = findingTone(f);
            return (
              <tr key={f.id} className={f.status === "RESPONDED" ? "bg-info/5" : undefined}>
                <Td>
                  <RowLink href={`/auditor/findings/${f.code}`}>{f.title}</RowLink>
                  <div className="font-mono text-[11.5px] text-faint">{f.code}</div>
                </Td>
                <Td className="whitespace-nowrap">{f.project.name}</Td>
                <Td mono>{f.type}</Td>
                <Td className="whitespace-nowrap">{date(f.createdAt)}</Td>
                <Td className="whitespace-nowrap">{date(f.due)}</Td>
                <Td>
                  <Pill tone={t}>{l}</Pill>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
