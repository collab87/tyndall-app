import { AuditTable } from "@/components/audit-table";
import { FilterBar } from "@/components/filter-bar";
import { Card, PageHeader, Stat, Stats } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { verifyChain } from "@/lib/chain";
import { db } from "@/lib/db";
import { shortHash } from "@/lib/hash";

export const metadata = { title: "Audit log" };

export default async function DevAudit({ searchParams }: { searchParams: Promise<{ project?: string; phase?: string }> }) {
  const { project, phase } = await searchParams;
  const u = await requireDeveloper();
  const projects = await db.project.findMany({ where: { orgId: u.orgId }, select: { id: true, code: true, name: true } });
  const where = { project: { orgId: u.orgId }, ...(project ? { project: { code: project, orgId: u.orgId } } : {}), ...(phase ? { phase } : {}) };
  const [rows, phases, chain] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { at: "desc" }, take: 200, include: { project: true } }),
    db.auditLog.findMany({ where: { project: { orgId: u.orgId } }, distinct: ["phase"], select: { phase: true } }),
    verifyChain(),
  ]);
  return (
    <>
      <PageHeader title="Audit log" sub="Every action on your projects. Nothing can be edited or deleted; each entry's hash chains to the one before it." />
      <Stats>
        <Stat label="Entries shown" value={rows.length} note="your organisation" tone="brand" />
        <Stat label="Chain" value={chain.ok ? "Intact" : "Broken"} note={`${chain.count} entries verified platform-wide`} tone={chain.ok ? "ok" : "bad"} />
        <Stat label="Head hash" value={<span className="font-mono text-[18px]">{chain.head ? shortHash(chain.head) : "—"}</span>} note="latest entry" tone="seal" />
        <Stat label="Projects" value={projects.length} tone="neutral" />
      </Stats>
      <FilterBar
        filters={[
          { name: "project", label: "Project", value: project, options: [["", "All projects"], ...projects.map((p) => [p.code, p.name] as [string, string])] },
          { name: "phase", label: "Phase", value: phase, options: [["", "All phases"], ...phases.map((p) => p.phase)] },
        ]}
      />
      <Card pad={false}>
        <AuditTable rows={rows} />
      </Card>
    </>
  );
}
