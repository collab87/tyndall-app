import { FilterBar } from "@/components/filter-bar";
import { Card, PageHeader, Pill, RowLink, Table, Td } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { stageInfo, STAGES } from "@/lib/stages";

export const metadata = { title: "All projects" };

export default async function AllProjects({ searchParams }: { searchParams: Promise<{ stage?: string; m?: string }> }) {
  await requireConsole("projects");
  const { stage, m } = await searchParams;
  const [projects, meths] = await Promise.all([
    db.project.findMany({ where: { ...(stage ? { stage } : {}), ...(m ? { methodology: { code: m } } : {}) }, include: { org: true, methodology: true, vvb: true, auditor: true, _count: { select: { devices: true } } }, orderBy: { createdAt: "desc" } }),
    db.methodology.findMany(),
  ]);
  return (
    <>
      <PageHeader title="All projects" sub="Every project in the registry, across developers and methodologies." />
      <FilterBar
        filters={[
          { name: "stage", label: "Stage", value: stage, options: [["", "All stages"], ...STAGES.map((s) => [s.id, s.label] as [string, string]), ["REJECTED", "Rejected"]] },
          { name: "m", label: "Methodology", value: m, options: [["", "All methodologies"], ...meths.map((x) => [x.code, `${x.code} · ${x.name}`] as [string, string])] },
        ]}
      />
      <Card pad={false}>
        <Table cols={["Project", "Developer", "Methodology", "Units", "Devices", "VVB", "Auditor", "Stage"]} minWidth={1100}>
          {projects.map((p) => {
            const s = stageInfo(p.stage);
            return (
              <tr key={p.id} className="hover:bg-surface-2/60">
                <Td>
                  <RowLink href={`/console/projects/${p.code}`}>{p.name}</RowLink>
                  <div className="font-mono text-[11.5px] text-faint">{p.code}</div>
                </Td>
                <Td className="whitespace-nowrap">{p.org.name}</Td>
                <Td mono>{p.methodology.code}</Td>
                <Td className="whitespace-nowrap">{num(p.units)}</Td>
                <Td>{p._count.devices}</Td>
                <Td className="whitespace-nowrap">{p.vvb?.name ?? "—"}</Td>
                <Td className="whitespace-nowrap">{p.auditor?.name ?? "—"}</Td>
                <Td>
                  <Pill tone={s.tone}>{s.short}</Pill>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
