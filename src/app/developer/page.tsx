import Link from "next/link";
import { Card, LinkButton, Note, PageHeader, Pill, RowLink, Stat, Stats, Table, Td } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime, naira, num } from "@/lib/format";
import { nextAction } from "@/lib/next-action";
import { stageInfo } from "@/lib/stages";

export const metadata = { title: "Overview" };

export default async function DevOverview() {
  const u = await requireDeveloper();
  const [projects, due, blocks, findings, logs] = await Promise.all([
    db.project.findMany({ where: { orgId: u.orgId }, include: { methodology: true, vvb: true, auditor: true, pilot: true }, orderBy: { createdAt: "asc" } }),
    db.invoice.findMany({ where: { status: "DUE", project: { orgId: u.orgId } } }),
    db.creditBlock.findMany({ where: { orgId: u.orgId } }),
    db.finding.findMany({ where: { status: "OPEN", type: { not: "FAR" }, project: { orgId: u.orgId } } }),
    db.auditLog.findMany({ where: { project: { orgId: u.orgId } }, orderBy: { at: "desc" }, take: 8, include: { project: true } }),
  ]);
  const held = blocks.reduce((a, b) => a + b.quantity, 0);
  const dueTotal = due.reduce((a, i) => a + i.amount + i.vat, 0);
  const todo = projects.map((p) => ({ p, n: nextAction(p) })).filter((x) => x.n.yours);
  const hour = new Date().getHours();
  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
        title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${u.name.split(" ")[0]}`}
        sub={`${projects.length} project${projects.length === 1 ? "" : "s"} at ${u.org.name}. Each follows its own Tyndall methodology and starts with a 1% pilot.`}
        actions={<LinkButton href="/developer/projects/new" variant="primary">Create project</LinkButton>}
      />
      {u.org.status !== "VERIFIED" ? (
        <Note tone="warn" title="Tyndall is verifying your organisation.">
          You can draft projects now. Paying the registration fee and submitting a project unlocks once KYB is complete, usually within two working days.
        </Note>
      ) : null}
      <Stats>
        <Stat label="Projects" value={projects.length} note={[...new Set(projects.map((p) => p.methodology.code))].join(" · ") || "none yet"} tone="brand" href="/developer/projects" />
        <Stat label="Invoices due" value={due.length} note={due.length ? naira(dueTotal) : "nothing due"} tone={due.length ? "warn" : "ok"} href="/developer/payments" />
        <Stat label="Credits held" value={num(held) + " t"} note="sample tokens in your wallet" tone="seal" href="/developer/credits" />
        <Stat label="Open findings" value={findings.length} note={findings.some((f) => f.type === "CAR") ? "includes corrective actions" : "clarifications only"} tone={findings.length ? "bad" : "ok"} href="/developer/findings" />
      </Stats>
      {todo.length ? (
        <Card title="Your next steps" meta="Actions waiting on your team" pad={false}>
          <ul className="divide-y divide-line">
            {todo.map(({ p, n }) => (
              <li key={p.id}>
                <Link href={n.href} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft font-mono text-[11px] font-bold text-brand-text">{p.methodology.code.slice(3)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold text-ink">{n.label}</span>
                    <span className="block text-[12.5px] text-muted">{p.name}</span>
                  </span>
                  <span className="text-[13px] font-semibold text-brand-text">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card title="Portfolio" pad={false}>
        <Table cols={["Project", "Methodology", "Stage", "VVB", "Auditor", "Next"]} minWidth={980} empty="No projects yet. Create your first project.">
          {projects.map((p) => {
            const s = stageInfo(p.stage);
            return (
              <tr key={p.id} className="hover:bg-surface-2/60">
                <Td>
                  <RowLink href={`/developer/projects/${p.code}`}>{p.name}</RowLink>
                  <div className="font-mono text-[11.5px] text-faint">{p.code}</div>
                </Td>
                <Td mono>{p.methodology.code}</Td>
                <Td>
                  <Pill tone={s.tone}>{s.short}</Pill>
                </Td>
                <Td>{p.vvb?.name ?? <span className="text-faint">Not chosen</span>}</Td>
                <Td>{p.auditor?.name ?? <span className="text-faint">Not chosen</span>}</Td>
                <Td className="text-muted">{nextAction(p).label}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Card title="Recent activity" action={<LinkButton href="/developer/audit" variant="ghost" size="sm">Audit log</LinkButton>} pad={false}>
        <Table cols={["When", "Project", "Who", "Action"]} minWidth={720}>
          {logs.map((l) => (
            <tr key={l.id}>
              <Td mono className="whitespace-nowrap text-muted">{dateTime(l.at)}</Td>
              <Td className="whitespace-nowrap">{l.project?.name}</Td>
              <Td className="whitespace-nowrap text-muted">{l.actorName}</Td>
              <Td>{l.action}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
