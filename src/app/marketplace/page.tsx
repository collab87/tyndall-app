import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Pill } from "@/components/ui";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { stageInfo } from "@/lib/stages";

export const metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";

export default async function Marketplace() {
  const projects = await db.project.findMany({
    where: { listed: true },
    include: { methodology: true, org: true, blocks: true, vvb: true, auditor: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-12">
        <div className="max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-text">Marketplace</span>
          <h1 className="mt-2 font-display text-[38px] font-semibold tracking-[-0.035em] text-ink">Listed projects</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            A project is listed once its 1% pilot and PDD are validated and Tyndall approves it. Send a purchase request and the developer replies to you directly; Tyndall records every transfer. There is no order book.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const available = p.blocks.filter((b) => b.orgId === p.orgId).reduce((a, b) => a + b.quantity, 0);
            const s = stageInfo(p.stage);
            return (
              <Link key={p.id} href={`/marketplace/${p.code}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                <div className="relative h-28 bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900 p-5">
                  <span className="rounded-full bg-black/25 px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-white">{p.methodology.code} · {p.methodology.sector}</span>
                  <span className="absolute bottom-4 right-5 font-display text-[13px] font-semibold text-white/90">{p.location}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink group-hover:text-brand-text">{p.name}</h2>
                    <p className="mt-1 text-[13px] text-muted">{p.org.name}</p>
                  </div>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-text">{p.about}</p>
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-3">
                    <div>
                      <div className="font-display text-[18px] font-semibold text-ink">{num(p.expectedPerYear ?? 0)} t</div>
                      <div className="text-[11.5px] text-muted">expected per year</div>
                    </div>
                    <div>
                      <div className="font-display text-[18px] font-semibold text-ink">{available ? num(available) + " t" : "—"}</div>
                      <div className="text-[11.5px] text-muted">{available ? "issued, available" : "not yet issued"}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Pill tone={s.tone}>{s.short}</Pill>
                    <span className="text-[12px] text-muted">{num(p.units)} {p.unitType.toLowerCase()}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
