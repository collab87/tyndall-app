import { Card, Note, PageHeader, Pill, RowLink, Stat, Stats, Table, Td } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { findingTone } from "@/lib/findings";

export const metadata = { title: "Findings" };

export default async function FindingsPage() {
  const u = await requireDeveloper();
  const findings = await db.finding.findMany({ where: { project: { orgId: u.orgId } }, include: { project: true, auditor: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  const open = findings.filter((f) => f.status === "OPEN" && f.type !== "FAR");
  return (
    <>
      <PageHeader title="Findings" sub="Raised by your VVB during the pilot and PDD, and by your auditor during monitoring. Each names what is affected and what is withheld until it closes." />
      <Stats>
        <Stat label="Open" value={open.length} note="need your response" tone={open.length ? "warn" : "ok"} />
        <Stat label="Awaiting reviewer" value={findings.filter((f) => f.status === "RESPONDED").length} note="you responded" tone="info" />
        <Stat label="Corrective actions" value={open.filter((f) => f.type === "CAR").length} note="credits withheld until closed" tone="bad" />
        <Stat label="Closed" value={findings.filter((f) => f.status === "CLOSED").length} note="all time" tone="ok" />
      </Stats>
      <Card pad={false}>
        <Table cols={["Finding", "Project", "Phase", "Raised by", "Due", "At stake", "Status"]} minWidth={1080} empty="No findings. Your VVB and auditor raise them during reviews.">
          {findings.map((f) => {
            const [tone, label] = findingTone(f);
            return (
              <tr key={f.id} className="hover:bg-surface-2/60">
                <Td>
                  <RowLink href={`/developer/findings/${f.code}`}>{f.title}</RowLink>
                  <div className="font-mono text-[11.5px] text-faint">
                    {f.code} · {f.type}
                  </div>
                </Td>
                <Td className="whitespace-nowrap">{f.project.name}</Td>
                <Td className="whitespace-nowrap text-muted">{f.phase}</Td>
                <Td className="whitespace-nowrap">{f.auditor.name}</Td>
                <Td className="whitespace-nowrap text-muted">{f.type === "FAR" ? "Each period" : date(f.due)}</Td>
                <Td className="whitespace-nowrap">{f.atStake ?? "—"}</Td>
                <Td>
                  <Pill tone={tone}>{label}</Pill>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Note tone="info" title="CAR: corrective action required, credits withheld until closed. CLR: clarification. FAR: forward action for later periods." />
    </>
  );
}
