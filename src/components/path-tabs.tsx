"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "./ui";

/** Tabs whose active state follows the URL. The first tab is the base path. */
export function PathTabs({ base, tabs }: { base: string; tabs: { seg: string; label: string; count?: number }[] }) {
  const path = usePathname();
  const cur = tabs.find((t) => t.seg && path.startsWith(`${base}/${t.seg}`))?.seg ?? "";
  return <Tabs current={cur} tabs={tabs.map((t) => ({ id: t.seg, label: t.label, count: t.count, href: t.seg ? `${base}/${t.seg}` : base }))} />;
}
