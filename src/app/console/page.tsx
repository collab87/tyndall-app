import Link from "next/link";
import { Card, Grid, Note, PageHeader, Pill, Stat, Stats } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { verifyChain } from "@/lib/chain";
import { db } from "@/lib/db";
import { ago, num } from "@/lib/format";
import { can, CONSOLE_SCREENS } from "@/lib/roles";
import { STAGES, type Tone } from "@/lib/stages";

export const metadata = { title: "Console" };

export default async function ConsoleHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const u = await requireConsole("overview");
  const [projects, submitted, pddVal, scale, applicants, kyb, pending, dark, issued, retired, chain] = await Promise.all([
    db.project.groupBy({ by: ["stage"], _count: true }),
    db.project.findMany({ where: { stage: "SUBMITTED" }, include: { org: true } }),
    db.project.findMany({ where: { stage: "PDD_VALIDATED" } }),
    db.project.findMany({ where: { stage: "SCALE_REVIEW" } }),
    db.auditor.findMany({ where: { status: "PENDING" } }),
    db.organisation.findMany({ where: { status: "PENDING" } }),
    db.issuanceRequest.findMany({ where: { status: "PENDING" }, include: { project: true } }),
    db.device.count({ where: { status: { in: ["OFFLINE", "FAULT"] } } }),
    db.issuanceRequest.aggregate({ _sum: { quantity: true }, where: { status: "ISSUED" } }),
    db.retirement.aggregate({ _sum: { quantity: true }, _count: true }),
    verifyChain(),
  ]);
  type Q = { title: string; ref: string; tone: Tone; href: string; screen: keyof typeof CONSOLE_SCREENS; age: Date };
  const queue: Q[] = [
    ...pending.map((i) => ({ title: `Approve issuance · ${i.project.name}, ${i.period}`, ref: `${i.code} · ${num(i.quantity)} t · prepared by ${i.preparedBy}`, tone: "warn" as Tone, href: "/console/issuance", screen: "issuance" as const, age: i.preparedAt })),
    ...submitted.map((p) => ({ title: `Screen registration · ${p.name}`, ref: `${p.code} · ${p.org.name}${p.relatedParty ? " · related party" : ""}`, tone: (p.relatedParty ? "bad" : "warn") as Tone, href: `/console/registrations`, screen: "registrations" as const, age: p.submittedAt ?? p.createdAt })),
    ...pddVal.map((p) => ({ title: `Approve PDD · ${p.name}`, ref: `${p.code} · validated by VVB`, tone: "info" as Tone, href: `/console/registrations`, screen: "registrations" as const, age: p.updatedAt })),
    ...scale.map((p) => ({ title: `Review scale-up · ${p.name}`, ref: p.code, tone: "info" as Tone, href: `/console/registrations`, screen: "registrations" as const, age: p.updatedAt })),
    ...applicants.map((a) => ({ title: `Review ${a.kind === "FIRM" ? "firm" : "individual"} application · ${a.name}`, ref: `${a.code} · ${a.roles.replace(",", " + ")}`, tone: "info" as Tone, href: `/console/auditors/${a.code}`, screen: "auditors" as const, age: a.createdAt })),
    ...kyb.map((o) => ({ title: `KYB review · ${o.name}`, ref: `${o.code} · ${o.type.toLowerCase()}`, tone: "info" as Tone, href: `/console/organisations`, screen: "organisations" as const, age: o.createdAt })),
    ...(dark ? [{ title: `${dark} devices offline or faulty`, ref: "Gap engine · arrival window 90 days", tone: "bad" as Tone, href: "/console/devices", screen: "devices" as const, age: new Date() }] : []),
  ].filter((q) => can(u.role, CONSOLE_SCREENS[q.screen]));
  const count = (s: string) => projects.find((p) => p.stage === s)?._count ?? 0;
  const max = Math.max(...STAGES.map((s) => count(s.id)), 1);
  return (
    <>
      <PageHeader eyebrow={`Signed in as ${u.roleLabel}`} title={`Welcome, ${u.name.split(" ")[0]}`} sub="Your queue shows only what your role can act on. Every decision here is written to the hash-chained audit trail." />
      {denied ? <Note tone="bad" title={`Your role (${u.roleLabel}) cannot open ${denied}.`} rule="Roles & permissions">Ask a Super Admin if you need access.</Note> : null}
      <Stats>
        <Stat label="Your queue" value={queue.length} note="items you can act on" tone={queue.length ? "warn" : "ok"} />
        <Stat label="Credits issued" value={num(issued._sum.quantity ?? 0) + " t"} note="sample tokens minted 1:1" tone="seal" href={can(u.role, CONSOLE_SCREENS.issuance) ? "/console/issuance" : undefined} />
        <Stat label="Retired" value={num(retired._sum.quantity ?? 0) + " t"} note={`${retired._count} certificates`} tone="ok" />
        <Stat label="Audit chain" value={chain.ok ? "Intact" : "Broken"} note={`${num(chain.count)} entries verified`} tone={chain.ok ? "ok" : "bad"} href="/console/audit" />
      </Stats>
      <Grid>
        <Card title="Action queue" meta={`${queue.length} items`} pad={false}>
          {queue.length ? (
            <ul className="divide-y divide-line">
              {queue.map((q, i) => (
                <li key={i}>
                  <Link href={q.href} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2">
                    <Pill tone={q.tone}>{q.tone === "bad" ? "Urgent" : q.tone === "warn" ? "Due" : "Review"}</Pill>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-ink">{q.title}</span>
                      <span className="block truncate font-mono text-[11.5px] text-muted">{q.ref}</span>
                    </span>
                    <span className="whitespace-nowrap text-[12px] text-faint">{ago(q.age)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-[13px] text-muted">Nothing waiting on you.</p>
          )}
        </Card>
        <Card title="Pipeline by stage">
          <div className="flex flex-col gap-2.5">
            {STAGES.map((s) => (
              <div key={s.id} className="grid grid-cols-[150px_1fr_28px] items-center gap-3 text-[13px]">
                <span className="truncate text-text">{s.short}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(count(s.id) / max) * 100}%` }} />
                </span>
                <span className="text-right font-mono text-[12.5px] text-ink">{count(s.id)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </>
  );
}
