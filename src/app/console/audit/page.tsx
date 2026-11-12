import { AuditTable } from "@/components/audit-table";
import { FilterBar } from "@/components/filter-bar";
import { Card, Grid, Mono, Note, PageHeader, Stat, Stats, Table, Td } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { anchorBatches, verifyChain } from "@/lib/chain";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { shortHash } from "@/lib/hash";

export const metadata = { title: "Audit trail" };

export default async function AuditTrail({ searchParams }: { searchParams: Promise<{ phase?: string; project?: string }> }) {
  await requireConsole("audit");
  const { phase, project } = await searchParams;
  const [rows, chain, batches, phases, projects] = await Promise.all([
    db.auditLog.findMany({ where: { ...(phase ? { phase } : {}), ...(project ? { project: { code: project } } : {}) }, orderBy: { at: "desc" }, take: 300, include: { project: true } }),
    verifyChain(),
    anchorBatches(),
    db.auditLog.findMany({ distinct: ["phase"], select: { phase: true } }),
    db.project.findMany({ select: { code: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Audit trail & anchoring" sub="An append-only record of every action and state change. No role can edit or delete it, including Super Admins. Each entry's hash chains to the one before it." />
      <Stats>
        <Stat label="Entries" value={num(chain.count)} note="since genesis" tone="brand" />
        <Stat label="Chain verification" value={chain.ok ? "Intact" : "Broken"} note={chain.ok ? "every hash recomputed just now" : `breaks at entry ${"brokenAt" in chain ? chain.brokenAt : "?"}`} tone={chain.ok ? "ok" : "bad"} />
        <Stat label="Head hash" value={<span className="font-mono text-[18px]">{chain.head ? shortHash(chain.head) : "—"}</span>} tone="seal" />
        <Stat label="Daily batches" value={batches.length} note="summary root per day" tone="tech" />
      </Stats>
      <Grid>
        <Card title="Daily anchor batches" meta="Each day's entries summarised into one root hash" pad={false}>
          <Table cols={["Day", "Entries", "Root"]}>
            {batches.map((b) => (
              <tr key={b.day}>
                <Td mono>{b.day}</Td>
                <Td>{b.count}</Td>
                <Td>
                  <Mono>{shortHash(b.root)}</Mono>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Note tone="info" title="Anchoring is never in the path of an issuance." rule="Rule ANC-01">
          The daily root is what gets anchored externally. If anchoring fails, the platform continues and the backlog anchors on recovery.
        </Note>
      </Grid>
      <FilterBar
        filters={[
          { name: "project", label: "Project", value: project, options: [["", "All projects"], ...projects.map((p) => [p.code, p.name] as [string, string])] },
          { name: "phase", label: "Phase", value: phase, options: [["", "All phases"], ...phases.map((p) => p.phase)] },
        ]}
      />
      <Card pad={false} meta="Latest 300">
        <AuditTable rows={rows} />
      </Card>
    </>
  );
}
