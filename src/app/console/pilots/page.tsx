import { Card, Note, PageHeader, Pill, RowLink, Stat, Stats, Table, Td } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { PILOT_STATUS } from "@/lib/stages";

export const metadata = { title: "Pilots" };

export default async function Pilots() {
  await requireConsole("pilots");
  const pilots = await db.pilot.findMany({ include: { project: { include: { org: true, methodology: true, vvb: true, auditor: true, devices: { where: { isPilot: true } } } } }, orderBy: { startedAt: "desc" } });
  const by = (s: string) => pilots.filter((p) => p.status === s).length;
  return (
    <>
      <PageHeader title="Pilots · 1%" sub="Every project runs 1% of its units first. The VVB validates the pilot, and its output becomes the locked PDD baseline." />
      <Stats>
        <Stat label="Planning" value={by("PLANNING")} tone="info" />
        <Stat label="Running" value={by("RUNNING")} tone="tech" />
        <Stat label="With VVB" value={by("REPORTED")} tone="warn" />
        <Stat label="Validated" value={by("VALIDATED")} tone="ok" />
      </Stats>
      <Card pad={false}>
        <Table cols={["Project", "Methodology", "Units", "Reporting", "Started", "Day", "VVB", "Status"]} minWidth={1040}>
          {pilots.map((pl) => {
            const p = pl.project;
            const reporting = p.devices.filter((d) => d.status === "ONLINE").length;
            const day = pl.startedAt ? Math.min(pl.durationDays, Math.floor((Date.now() - pl.startedAt.getTime()) / 86400_000)) : 0;
            const s = PILOT_STATUS[pl.status];
            return (
              <tr key={pl.id}>
                <Td>
                  <RowLink href={`/console/projects/${p.code}`}>{p.name}</RowLink>
                  <div className="text-[11.5px] text-faint">{p.org.name}</div>
                </Td>
                <Td mono>{p.methodology.code}</Td>
                <Td>
                  {p.devices.length} / {pl.units}
                </Td>
                <Td>{pl.status === "PLANNING" ? "—" : `${reporting} / ${p.devices.length}`}</Td>
                <Td className="whitespace-nowrap">{date(pl.startedAt)}</Td>
                <Td mono>{pl.status === "RUNNING" ? `${day} / ${pl.durationDays}` : "—"}</Td>
                <Td className="whitespace-nowrap">{p.vvb?.name ?? "—"}</Td>
                <Td>
                  <Pill tone={s.tone}>{s.label}</Pill>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Note tone="info" title="Gaps during the pilot are excluded, never filled." rule="Rules PIL-01 · DQ-02">The VVB validates the pilot from day 1; the auditor checks the data path from day 1 and stays for the project lifetime.</Note>
    </>
  );
}
