import Link from "next/link";
import { Card, Note, PageHeader, Pill, Stat, Stats, Steps } from "@/components/ui";
import { requireAuditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { stageInfo } from "@/lib/stages";

export const metadata = { title: "Engagements" };

/** What this party needs to do on a project right now. */
function todo(p: { stage: string; vvbId: string | null; pilot: { status: string } | null }, me: string) {
  const vvb = p.vvbId === me;
  if (vvb && p.pilot?.status === "REPORTED") return "Validate the pilot report";
  if (vvb && p.stage === "PDD_REVIEW") return "Review the PDD";
  if (p.pilot?.status === "RUNNING") return "Monitor the pilot";
  if (p.stage === "ACTIVE") return vvb ? "No action · project in monitoring" : "Quarterly monitoring audit";
  return "No action needed";
}

export default async function AuditorHome() {
  const u = await requireAuditor();
  const a = u.auditor;
  if (a.status !== "APPROVED") {
    return (
      <>
        <PageHeader title={a.status === "PENDING" ? "Application received" : `Registration ${a.status.toLowerCase()}`} sub="Developers can only choose approved VVBs and auditors." status={{ label: a.status.toLowerCase(), tone: a.status === "PENDING" ? "warn" : "bad" }} />
        <Card title="What happens next">
          <Steps
            steps={[
              { title: "Application submitted", meta: date(a.createdAt), state: "done" },
              { title: "Tyndall checks accreditation and conflicts", desc: "Certificate, expiry, declared consulting work", state: a.status === "PENDING" ? "now" : a.status === "APPROVED" ? "done" : "bad" },
              { title: "Approved and listed for developers", desc: `For ${a.methodologies.replace(/,/g, " · ")}`, state: "todo" },
            ]}
          />
        </Card>
        {a.reviewNote ? <Note tone="bad" title="Tyndall's note">{a.reviewNote}</Note> : null}
      </>
    );
  }
  const projects = await db.project.findMany({ where: { OR: [{ vvbId: a.id }, { auditorId: a.id }] }, include: { org: true, methodology: true, pilot: true }, orderBy: { updatedAt: "desc" } });
  const actionable = projects.filter((p) => !todo(p, a.id).startsWith("No action"));
  return (
    <>
      <PageHeader title="Engagements" sub="Projects you are engaged on. You see only these: never other candidates, nor how the developer chose." />
      <Stats>
        <Stat label="Engagements" value={projects.length} tone="brand" />
        <Stat label="As VVB" value={projects.filter((p) => p.vvbId === a.id).length} tone="tech" />
        <Stat label="As auditor" value={projects.filter((p) => p.auditorId === a.id).length} tone="seal" />
        <Stat label="Need action" value={actionable.length} tone={actionable.length ? "warn" : "ok"} />
      </Stats>
      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((p) => {
          const s = stageInfo(p.stage);
          const t = todo(p, a.id);
          return (
            <Link key={p.id} href={`/auditor/projects/${p.code}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[11.5px] text-faint">
                    {p.code} · {p.methodology.code}
                  </div>
                  <div className="mt-1 font-display text-[18px] font-semibold text-ink">{p.name}</div>
                  <div className="text-[13px] text-muted">{p.org.name}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Pill tone={p.vvbId === a.id ? "tech" : "seal"}>{p.vvbId === a.id ? "VVB" : "Auditor"}</Pill>
                  <Pill tone={s.tone}>{s.short}</Pill>
                </div>
              </div>
              <div className={`border-t border-line pt-3 text-[13px] ${t.startsWith("No action") ? "text-muted" : "font-bold text-ink"}`}>{t}</div>
            </Link>
          );
        })}
      </div>
      {!projects.length ? <Note tone="info" title="No engagements yet.">You appear in the registry developers choose from for {a.methodologies.replace(/,/g, " · ")}.</Note> : null}
    </>
  );
}
