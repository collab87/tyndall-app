"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; count?: number | string; exact?: boolean };
export type NavGroup = { title?: string; items: NavItem[] };

export const ICONS = {
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  folder: "M3 6h6l2 2h10v11H3z",
  plus: "M12 5v14M5 12h14",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 4-6 7-6s6 2 7 6M17 11a3 3 0 1 0 0-6M22 21c-.5-2.5-2-4-4-5",
  flask: "M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  chart: "M4 20h16M7 16V9M12 16V5M17 16v-4",
  device: "M7 3h10v18H7zM11 18h2",
  flag: "M5 21V4h11l-2 4 2 4H5",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 10h6M9 14h6",
  key: "M15 7a4 4 0 1 1-3.9 5H8v3H5v-3H3v-3h8.1A4 4 0 0 1 15 7z",
  shield: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z",
  inbox: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5",
  pulse: "M3 12h4l3 8 4-16 3 8h4",
  building: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
  seal: "M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z",
  store: "M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6",
  check: "M9 4h6l1 2h3v15H5V6h3zM9 13l2 2 4-4",
  audit: "M4 6h16M4 12h16M4 18h10M17 17l2 2 3-3",
  download: "M12 4v12M7 11l5 5 5-5M5 20h14",
};

export function Icon({ name, size = 17 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function NavLinks({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  const all = groups.flatMap((g) => g.items);
  // The most specific matching link wins, so /developer/projects/new does not also light up /developer/projects.
  const active = all
    .filter((i) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {groups.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {g.title ? <span className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">{g.title}</span> : null}
          {g.items.map((i) => {
            const on = active?.href === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "group relative flex h-9 items-center gap-3 rounded-xl px-3 text-[13.5px] transition",
                  on ? "bg-brand-soft font-bold text-brand-text" : "font-semibold text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                {on ? <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-brand" /> : null}
                <Icon name={i.icon} />
                <span className="flex-1 truncate">{i.label}</span>
                {i.count ? <span className={cx("min-w-5 rounded-full px-1.5 py-0.5 text-center font-mono text-[10.5px]", on ? "bg-brand text-brand-fg" : "bg-surface-3 text-text")}>{i.count}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
