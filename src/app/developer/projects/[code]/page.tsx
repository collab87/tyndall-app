import { Card, Facts, Grid, LinkButton, Mono, Note, Pill, Steps, Table, Td, type StepState } from "@/components/ui";
import { db } from "@/lib/db";
import { date, naira, num } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { nextAction } from "@/lib/next-action";
import { stageIndex, STAGES } from "@/lib/stages";
import { loadProject } from "./data";

export default async function ProjectOverview({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { p } = await loadProject(code);
  const [invoices, logs] = await Promise.all([
    db.invoice.findMany({ where: { projectId: p.id }, orderBy: { createdAt: "asc" } }),
    db.auditLog.findMany({ where: { projectId: p.id }, orderBy: { at: "desc" }, take: 6 }),
  ]);
  const n = nextAction(p);
  const cur = stageIndex(p.stage);
  return (
    <>
      <Note tone={n.yours ? "brand" : "info"} title={n.yours ? `Next: ${n.label}` : n.label} action={n.yours ? <LinkButton href={n.href} variant="primary" size="sm">Go</LinkButton> : undefined}>
        {p.stage === "REJECTED" && p.reviewNote ? `Tyndall's reason: ${p.reviewNote}` : STAGES[Math.max(0, cur)]?.desc}
      </Note>
      <Grid>
        <Card title="Lifecycle">
          <Steps
            steps={STAGES.map((s, i) => ({
              title: s.label,
              desc: i === cur ? s.desc : undefined,
              state: (p.stage === "REJECTED" ? (i <= 1 ? (i === 1 ? "bad" : "done") : "todo") : i < cur ? "done" : i === cur ? "now" : "todo") as StepState,
            }))}
          />
        </Card>
        <div className="flex flex-col gap-4">
          <Card title="Project">
            <Facts
              rows={[
                ["Activity", p.activity],
                ["Instrument", p.instrument],
                ["Interval", p.interval],
                ["Calibration", p.calibration],
                ["Crediting period", `${p.creditingYears} years`],
                ["Expected reductions", p.expectedPerYear ? num(p.expectedPerYear) + " tCO₂e / yr" : "—"],
                ["Fee band", p.feeBand],
              ]}
            />
          </Card>
          <Card title="Declarations" meta="Locked at submission · published on the project page">
            <Facts
              rows={[
                ["Related parties", p.relatedParty ? <span key="rp" className="text-warn">{p.relatedParty}</span> : "None declared"],
                ["Consultant", p.consultant ?? "None"],
                ["Carbon rights", p.rightsDeclared ? <Pill key="r" tone="ok">Declared</Pill> : <Pill key="r" tone="warn">Not yet</Pill>],
                ["PDD hash", p.pddHash ? <Mono key="h">{shortHash(p.pddHash)}</Mono> : "—"],
                ["Submitted", date(p.submittedAt)],
              ]}
            />
          </Card>
        </div>
      </Grid>
      <Grid>
        <Card title="Invoices" pad={false} action={<LinkButton href="/developer/payments" variant="ghost" size="sm">Payments</LinkButton>}>
          <Table cols={["Invoice", "Item", "Total", "Status"]}>
            {invoices.map((i) => (
              <tr key={i.id}>
                <Td mono>{i.code}</Td>
                <Td>{i.title}</Td>
                <Td>{naira(i.amount + i.vat)}</Td>
                <Td>{i.status === "PAID" ? <Pill tone="ok">Paid</Pill> : <Pill tone="warn">Due</Pill>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Recent activity" pad={false}>
          <Table cols={["When", "Who", "Action"]}>
            {logs.map((l) => (
              <tr key={l.id}>
                <Td mono className="whitespace-nowrap text-muted">{date(l.at)}</Td>
                <Td className="whitespace-nowrap">{l.actorName}</Td>
                <Td>{l.action}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </Grid>
    </>
  );
}
