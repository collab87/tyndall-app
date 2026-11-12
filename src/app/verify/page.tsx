import { redirect } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { btnClass, Input } from "@/components/ui";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Verify a certificate" };
export const dynamic = "force-dynamic";

async function go(fd: FormData) {
  "use server";
  redirect("/verify/" + encodeURIComponent(String(fd.get("code") ?? "").trim().toUpperCase()));
}

export default async function VerifyIndex() {
  const recent = await db.retirement.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { project: true } });
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[760px] flex-col gap-8 px-5 py-14">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-text">Public lookup · no account needed</span>
          <h1 className="mt-2 font-display text-[36px] font-semibold tracking-[-0.035em] text-ink">Verify a retirement certificate</h1>
          <p className="mt-2 text-[15px] text-muted">Enter the certificate number printed on the certificate, e.g. RT-2026-0001.</p>
        </div>
        <form action={go} className="flex gap-2">
          <Input name="code" required placeholder="RT-2026-0001" mono className="h-12 text-[15px]" />
          <button type="submit" className={btnClass("primary", "lg")}>
            Verify
          </button>
        </form>
        <div className="flex flex-col gap-2">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-faint">Recent retirements</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {recent.map((r) => (
              <li key={r.id}>
                <Link href={`/verify/${r.code}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface-2">
                  <span>
                    <span className="font-mono text-[12.5px] text-brand-text">{r.code}</span>
                    <span className="ml-3 text-[13.5px] font-semibold text-ink">{r.beneficiary}</span>
                  </span>
                  <span className="text-[12.5px] text-muted">
                    {num(r.quantity)} t · {r.project.name} · {date(r.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PublicShell>
  );
}
