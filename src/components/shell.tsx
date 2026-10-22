import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "./client";
import { Logo } from "./logo";
import { NavLinks, type NavGroup } from "./nav";
import { Avatar } from "./ui";

export function Shell({
  area,
  nav,
  user,
  orgLine,
  top,
  children,
}: {
  area: string;
  nav: NavGroup[];
  user: { name: string; roleLabel: string };
  orgLine?: string;
  top?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Link href={"/" + area.toLowerCase().split(" ")[0]}>
            <Logo sub={area} />
          </Link>
        </div>
        <NavLinks groups={nav} />
        {orgLine ? <div className="border-t border-line px-5 py-3 text-[11.5px] leading-snug text-faint">{orgLine}</div> : null}
        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <Avatar name={user.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-ink">{user.name}</div>
            <div className="truncate text-[12px] text-muted">{user.roleLabel}</div>
          </div>
          <form action={logout}>
            <button type="submit" title="Sign out" aria-label="Sign out" className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" /></svg>
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6">
          <details className="relative lg:hidden">
            <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-xl border border-line" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <div className="absolute left-0 top-11 z-40 w-[260px] rounded-2xl border border-line bg-surface shadow-lg">
              <NavLinks groups={nav} />
            </div>
          </details>
          <div className="min-w-0 flex-1">{top}</div>
          <ThemeToggle />
        </header>
        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-6 sm:px-7 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
