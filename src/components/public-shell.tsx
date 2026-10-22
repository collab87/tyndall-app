import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./client";
import { Logo } from "./logo";
import { btnClass } from "./ui";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-5">
          <Link href="/">
            <Logo sub="Carbon Standards" />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 text-[13.5px] font-semibold text-muted md:flex">
            <Link href="/marketplace" className="rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-ink">
              Marketplace
            </Link>
            <Link href="/verify" className="rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-ink">
              Verify a certificate
            </Link>
            <Link href="/auditors/register" className="rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-ink">
              For VVBs & auditors
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={btnClass("primary", "sm")}>
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-6 text-[12.5px] text-muted">
          <span>© 2026 Tyndall Carbon Standards · Abuja, Nigeria</span>
          <span className="font-mono">Every record hash-chained · tokens shown are a sample feature</span>
        </div>
      </footer>
    </div>
  );
}
