import { notFound } from "next/navigation";
import { AuditTable } from "@/components/audit-table";
import { StageTrack } from "@/components/stage-track";
import { Card, Facts, Grid, LinkButton, Mono, Note, PageHeader, Pill, Table, Td } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceTone } from "@/lib/device";
import { findingTone } from "@/lib/findings";
import { date, naira, num } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { PILOT_STATUS, stageInfo } from "@/lib/stages";

export default async function ConsoleProject({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireConsole("projects");
  const p = await db.project.findUnique({
    where: { code },
    include: { org: true, methodology: true, vvb: true, auditor: true, pilot: true, invoices: true, findings: { include: { auditor: true } }, issuances: true, devices: { take: 8, orderBy: { createdAt: "asc" } }, logs: { orderBy: { at: "desc" }, take: 12, include: { project: true } }, _count: { select: { devices: true } } },
  });
  if (!p) notFound();
  const s = stageInfo(p.stage);
  return (
    <>
      <PageHeader back={{ href: "/console/projects", label: "All projects" }} eyebrow={`${p.code} · ${p.methodology.code} ${p.methodology.version}`} title={p.name} sub={`${p.org.name} · ${p.location} · ${num(p.units)} ${p.unitType.toLowerCase()}`} status={{ label: s.label, tone: s.tone }} actions={p.listed ? <LinkButton href={`/marketplace/${p.code}`}>Public listing</LinkButton> : undefined} />
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm">
        <StageTrack stage={p.stage} />
      </div>
      {p.relatedParty ? <Note tone="warn" title="Related party declared" rule="Rules RP-01 to RP-04">{p.relatedParty}</Note> : null}
      <Grid cols={3}>
        <Card title="Registration">
          <Facts
            rows={[
              ["Developer", `${p.org.name} (${p.org.status.toLowerCase()})`],
              ["Instrument", p.instrument],
              ["Interval", p.interval],
              ["Calibration", p.calibration],
              ["Fee band", p.feeBand],
              ["Consultant", p.consultant ?? "None"],
            ]}
          />
        </Card>
        <Card title="Team">
          <Facts
            rows={[
              ["VVB", p.vvb ? `${p.vvb.name} · ${p.vvb.kind.toLowerCase()}` : "Not chosen"],
              ["Auditor", p.auditor ? `${p.auditor.name} · ${p.auditor.kind.toLowerCase()}` : "Not chosen"],
              ["Check", p.vvb && p.auditor ? <Pill key="c" tone="ok">VVB ≠ auditor ≠ consultant</Pill> : "—"],
            ]}
          />
        </Card>
        <Card title="Pilot · 1%">
          {p.pilot ? (
            <Facts
              rows={[
                ["Units", `${p.pilot.units} of ${num(p.units)}`],
                ["Status", <Pill key="s" tone={PILOT_STATUS[p.pilot.status].tone}>{PILOT_STATUS[p.pilot.status].label}</Pill>],
                ["Started", date(p.pilot.startedAt)],
                ["Validated", date(p.pilot.validatedAt)],
                ["PDD hash", p.pddHash ? <Mono key="h">{shortHash(p.pddHash)}</Mono> : "—"],
              ]}
            />
          ) : (
            <p className="text-[13px] text-muted">Opens after the team is engaged.</p>
          )}
        </Card>
      </Grid>
      <Grid>
        <Card title="Findings" pad={false}>
          <Table cols={["Finding", "By", "Status"]}>
            {p.findings.map((f) => {
              const [t, l] = findingTone(f);
              return (
                <tr key={f.id}>
                  <Td>
                    <span className="font-semibold text-ink">{f.title}</span>
                    <div className="font-mono text-[11.5px] text-faint">{f.code}</div>
                  </Td>
                  <Td className="whitespace-nowrap">{f.auditor.name}</Td>
                  <Td>
                    <Pill tone={t}>{l}</Pill>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
        <Card title="Fees" pad={false}>
          <Table cols={["Invoice", "Item", "Total", "Status"]}>
            {p.invoices.map((i) => (
              <tr key={i.id}>
                <Td mono>{i.code}</Td>
                <Td>{i.title}</Td>
                <Td className="whitespace-nowrap">{naira(i.amount + i.vat)}</Td>
                <Td>{i.status === "PAID" ? <Pill tone="ok">Paid</Pill> : <Pill tone="warn">Due</Pill>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </Grid>
      <Card title="Devices" meta={`${p._count.devices} paired · first 8 shown`} pad={false} action={<LinkButton href={`/console/devices?project=${p.code}`} variant="ghost" size="sm">Fleet view</LinkButton>}>
        <Table cols={["Meter", "Serial", "Location", "Status"]}>
          {p.devices.map((d) => {
            const [t, l] = deviceTone(d.status);
            return (
              <tr key={d.id}>
                <Td mono>{d.imei}</Td>
                <Td mono>{d.serial}</Td>
                <Td>{d.location}</Td>
                <Td>
                  <Pill tone={t}>{l}</Pill>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Card title="History" pad={false}>
        <AuditTable rows={p.logs} showProject={false} />
      </Card>
    </>
  );
}
