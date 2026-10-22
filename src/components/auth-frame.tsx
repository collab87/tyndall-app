import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./client";
import { Logo } from "./logo";

/** Split layout for sign-in and registration pages. */
export function AuthFrame({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#1c0f08] text-[#fbeee3] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-[radial-gradient(circle_at_center,#df773a_0%,rgba(223,119,58,0)_68%)] opacity-60" />
        <div aria-hidden className="pointer-events-none absolute -bottom-56 -left-24 size-[520px] rounded-full bg-[radial-gradient(circle_at_center,#8e3a12_0%,rgba(142,58,18,0)_70%)] opacity-70" />
        <Link href="/" className="relative">
          <span className="[&_*]:!text-[#fbeee3]">
            <Logo sub="Carbon Standards" size={38} />
          </span>
        </Link>
        <div className="relative flex max-w-lg flex-col gap-6">
          <h2 className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.035em]">
            Metered evidence, <span className="text-[#f4a56d]">not annual samples.</span>
          </h2>
          <p className="text-[15px] leading-relaxed text-[#e6cdb9]">
            From a 1% pilot to a retired credit: devices stream signed readings, the platform judges their completeness, and every action lands on an append-only, hash-chained record.
          </p>
          <ul className="grid grid-cols-3 gap-3 text-[12.5px]">
            {[
              ["1%", "pilot before scale-up"],
              ["90 d", "arrival window"],
              ["4-eyes", "on every issuance"],
            ].map(([k, v]) => (
              <li key={k} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <div className="font-display text-[22px] font-semibold text-white">{k}</div>
                <div className="mt-1 text-[#d9bba5]">{v}</div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-[11px] uppercase tracking-[0.14em] text-[#b48a6e]">Standard-setter and registry · Abuja, Nigeria</p>
      </aside>
      <main className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className={`flex w-full flex-col gap-6 ${wide ? "max-w-2xl" : "max-w-[420px]"}`}>{children}</div>
        </div>
      </main>
    </div>
  );
}
