import { num } from "@/lib/format";

/** Daily bar chart. Gap days render as a hatched placeholder so missing data is visible, not hidden. */
export function DailyBars({ data, unit, digits = 0 }: { data: { label: string; value: number; gap?: boolean }[]; unit: string; digits?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-44 items-end gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
            {d.gap ? (
              <div className="h-full rounded-md border border-dashed border-warn/60 bg-[repeating-linear-gradient(135deg,transparent_0_5px,color-mix(in_srgb,var(--warn)_18%,transparent)_5px_7px)]" />
            ) : (
              <div className="rounded-md bg-brand/85 transition group-hover:bg-brand" style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }} />
            )}
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 font-mono text-[11px] text-surface group-hover:block">
              {d.gap ? "gap · excluded" : `${num(d.value, digits)} ${unit}`}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center font-mono text-[10px] text-faint">
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal comparison bars. */
export function CompareBars({ rows }: { rows: { label: string; value: number; display: string; tone?: "brand" | "muted" | "ok" }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const color = { brand: "bg-brand", muted: "bg-neutral/60", ok: "bg-ok" };
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[130px_1fr_80px] items-center gap-3 text-[13px]">
          <span className="truncate text-text">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-surface-3">
            <span className={`block h-full rounded-full ${color[r.tone ?? "brand"]}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-mono text-[12.5px] text-ink">{r.display}</span>
        </div>
      ))}
    </div>
  );
}
