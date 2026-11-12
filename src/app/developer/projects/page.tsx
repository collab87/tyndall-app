import Link from "next/link";
import { StageTrack } from "@/components/stage-track";
import { LinkButton, PageHeader, Pill } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { nextAction } from "@/lib/next-action";
import { stageInfo } from "@/lib/stages";

export const metadata = { title: "My projects" };

export default async function ProjectsPage() {
  const u = await requireDeveloper();
  const projects = await db.project.findMany({ where: { orgId: u.orgId }, include: { methodology: true, pilot: true, _count: { select: { devices: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="My projects" sub="Every project moves through the same lifecycle. The tracker shows where each one is." actions={<LinkButton href="/developer/projects/new" variant="primary">Create project</LinkButton>} />
      <div className="grid gap-4 xl:grid-cols-2">
        {projects.map((p) => {
          const s = stageInfo(p.stage);
          const n = nextAction(p);
          return (
            <Link key={p.id} href={`/developer/projects/${p.code}`} className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11.5px] text-faint">
                    {p.code} · {p.methodology.code} {p.methodology.version}
                  </div>
                  <h2 className="mt-1 font-display text-[19px] font-semibold tracking-[-0.02em] text-ink group-hover:text-brand-text">{p.name}</h2>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {p.location} · {num(p.units)} {p.unitType.toLowerCase()} · {p._count.devices} devices paired
                  </p>
                </div>
                <Pill tone={s.tone}>{s.short}</Pill>
              </div>
              <StageTrack stage={p.stage} />
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[13px]">
                <span className={n.yours ? "font-bold text-ink" : "text-muted"}>{n.yours ? "Next: " : ""}{n.label}</span>
                <span className="font-semibold text-brand-text">Open →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
