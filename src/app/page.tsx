import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { btnClass } from "@/components/ui";
import { db } from "@/lib/db";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [issued, retired, listed, auditors] = await Promise.all([
    db.issuanceRequest.aggregate({ _sum: { quantity: true }, where: { status: "ISSUED" } }),
    db.retirement.aggregate({ _sum: { quantity: true } }),
    db.project.count({ where: { listed: true } }),
    db.auditor.count({ where: { status: "APPROVED" } }),
  ]);
  const steps = [
    ["01", "Register", "Create the project, declare instruments and related parties, pay a fee set by unit count."],
    ["02", "Choose your team", "Pick an approved VVB and a lifetime auditor from the public registry."],
    ["03", "Pilot 1%", "Run 1% of units first. The validated pilot output becomes your PDD baseline."],
    ["04", "PDD & listing", "Build the PDD from the methodology template; once approved you are listed."],
    ["05", "Scale-up", "Deploy the rest. Devices stream signed readings; the auditor monitors."],
    ["06", "Issue & retire", "Four-eyes issuance. Retirement is permanent and produces a public certificate."],
  ];
  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-48 size-[640px] rounded-full bg-[radial-gradient(circle,var(--brand-300)_0%,transparent_65%)] opacity-40 dark:opacity-20" />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div className="flex flex-col gap-7">
            <span className="w-fit rounded-full border border-brand/30 bg-brand-soft px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-text">Standard-setter and registry</span>
            <h1 className="font-display text-[46px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[64px]">
              Carbon credits backed by <span className="text-brand-text">instrument data.</span>
            </h1>
            <p className="max-w-xl text-[17px] leading-relaxed text-muted">
              Tyndall runs the rulebook and the ledger. Projects prove themselves on a 1% pilot, stream signed readings from every device, and issue credits only after an independent VVB and auditor sign off.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={btnClass("primary", "lg")}>
                Register a project developer
              </Link>
              <Link href="/marketplace" className={btnClass("secondary", "lg")}>
                Browse listed projects
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            {[
              ["Credits issued", num(issued._sum.quantity ?? 0) + " t"],
              ["Credits retired", num(retired._sum.quantity ?? 0) + " t"],
              ["Listed projects", String(listed)],
              ["Approved VVBs & auditors", String(auditors)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
                <div className="font-display text-[34px] font-semibold tracking-[-0.03em] text-ink">{v}</div>
                <div className="mt-1 text-[13px] text-muted">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <h2 className="font-display text-[30px] font-semibold tracking-[-0.03em] text-ink">From pilot to retired credit</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="rounded-3xl border border-line bg-surface p-6">
              <span className="font-mono text-[12px] font-medium text-brand-text">{n}</span>
              <h3 className="mt-3 font-display text-[19px] font-semibold text-ink">{t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
