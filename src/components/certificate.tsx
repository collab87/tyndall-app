import { date, num } from "@/lib/format";
import { shortTx } from "@/lib/hash";
import { LogoMark } from "./logo";

type Cert = { code: string; quantity: number; beneficiary: string; reason: string; claimPeriod: string; vintage: string; serialStart: number; serialEnd: number; burnTx: string; createdAt: Date; project: { name: string; code: string; methodology: { code: string; version: string } } };

export function serialOf(project: { code: string; methodology: { code: string; version: string } }, vintage: string, n: number) {
  return `TYN-${project.code.replace(/^(PRJ|REG)-/, "")}-${vintage}-${String(n).padStart(6, "0")}`;
}

export function Certificate({ c }: { c: Cert }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-md">
      <div className="h-2 bg-gradient-to-r from-brand-400 via-brand-600 to-seal" />
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-seal">Certificate of retirement</span>
            <h2 className="mt-2 font-display text-[34px] font-semibold tracking-[-0.03em] text-ink">{num(c.quantity)} tCO₂e retired</h2>
          </div>
          <LogoMark size={44} />
        </div>
        <p className="text-[15px] leading-relaxed text-text">
          Retired permanently on behalf of <b className="text-ink">{c.beneficiary}</b> for {c.reason}.
        </p>
        <dl className="grid grid-cols-2 gap-4 border-y border-line py-4 sm:grid-cols-4">
          {[
            ["Project", c.project.name],
            ["Methodology", `${c.project.methodology.code} ${c.project.methodology.version}`],
            ["Vintage · claim", `${c.vintage} · ${c.claimPeriod}`],
            ["Retired", date(c.createdAt)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] text-muted">{k}</dt>
              <dd className="mt-0.5 text-[14px] font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-lg bg-ink px-3 py-1.5 font-mono text-[12px] text-surface">
            {serialOf(c.project, c.vintage, c.serialStart)} → {String(c.serialEnd).padStart(6, "0")}
          </span>
          <span className="font-mono text-[12px] text-muted">Burn tx (sample) {shortTx(c.burnTx)}</span>
        </div>
        <span className="font-mono text-[12px] text-brand-text">tyndall.earth/verify/{c.code}</span>
      </div>
    </div>
  );
}
