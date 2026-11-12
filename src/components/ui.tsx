import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "@/lib/stages";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-info",
  tech: "text-tech",
  seal: "text-seal",
  neutral: "text-neutral",
  brand: "text-brand-text",
};
const TONE_BG: Record<Tone, string> = {
  ok: "bg-ok/12",
  warn: "bg-warn/12",
  bad: "bg-bad/12",
  info: "bg-info/12",
  tech: "bg-tech/12",
  seal: "bg-seal/12",
  neutral: "bg-neutral/12",
  brand: "bg-brand/12",
};
const TONE_DOT: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  info: "bg-info",
  tech: "bg-tech",
  seal: "bg-seal",
  neutral: "bg-neutral",
  brand: "bg-brand",
};

const TONE_BORDER: Record<Tone, string> = {
  ok: "border-l-ok",
  warn: "border-l-warn",
  bad: "border-l-bad",
  info: "border-l-info",
  tech: "border-l-tech",
  seal: "border-l-seal",
  neutral: "border-l-neutral",
  brand: "border-l-brand",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold", TONE_BG[tone], TONE_TEXT[tone], className)}>
      <span className={cx("size-1.5 rounded-full", TONE_DOT[tone])} />
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  return <span className={cx("inline-block size-2 rounded-full", TONE_DOT[tone])} />;
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "seal";
const BTN: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg shadow-sm hover:brightness-110",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-brand-text hover:bg-brand-soft",
  danger: "bg-bad text-white hover:brightness-110",
  seal: "bg-seal text-white hover:brightness-110 dark:text-[#14123a]",
};
const SIZE = { sm: "h-8 px-3 text-[12.5px] rounded-lg", md: "h-10 px-4 text-[13.5px] rounded-xl", lg: "h-12 px-6 text-[15px] rounded-xl" };

export function btnClass(variant: Variant = "secondary", size: keyof typeof SIZE = "md") {
  return cx(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
    BTN[variant],
    SIZE[size],
  );
}

export function Button({ variant = "secondary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return <button type="button" className={cx(btnClass(variant, size), className)} {...p} />;
}

export function LinkButton({ variant = "secondary", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return <Link className={cx(btnClass(variant, size), className)} {...p} />;
}

export function Card({ title, meta, action, children, className, pad = true, tone }: { title?: ReactNode; meta?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean; tone?: Tone }) {
  return (
    <section className={cx("overflow-hidden rounded-2xl border border-line bg-surface shadow-sm", tone && "border-l-4", tone && TONE_BORDER[tone], className)}>
      {title || action ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {meta ? <p className="mt-0.5 text-[12px] text-muted">{meta}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, sub, status, actions, back }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; status?: { label: string; tone: Tone }; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-3">
      {back ? (
        <Link href={back.href} className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-brand-text hover:underline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {eyebrow ? <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.08em] text-faint">{eyebrow}</span> : null}
            {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
          </div>
          <h1 className="mt-1.5 font-display text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">{title}</h1>
          {sub ? <p className="mt-1.5 text-[14px] leading-relaxed text-muted text-pretty">{sub}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Stat({ label, value, note, tone = "neutral", href }: { label: string; value: ReactNode; note?: ReactNode; tone?: Tone; href?: string }) {
  const body = (
    <div className={cx("group relative flex h-full flex-col gap-2 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm transition", href && "hover:border-brand/50 hover:shadow-md")}>
      <span className={cx("absolute inset-x-0 top-0 h-[3px]", TONE_DOT[tone])} />
      <span className="text-[12.5px] font-medium text-muted">{label}</span>
      <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink">{value}</span>
      {note ? <span className="text-[12px] text-muted">{note}</span> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

export type StepState = "done" | "now" | "todo" | "bad";
export function Steps({ steps }: { steps: { title: ReactNode; desc?: ReactNode; meta?: ReactNode; state: StepState }[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={i} className="relative grid grid-cols-[24px_1fr_auto] gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 ? <span className={cx("absolute left-[11px] top-6 bottom-0 w-px", s.state === "done" ? "bg-brand" : "bg-line")} /> : null}
          <span
            className={cx(
              "relative z-10 mt-0.5 flex size-6 items-center justify-center rounded-full border-2 text-white",
              s.state === "done" && "border-brand bg-brand",
              s.state === "now" && "border-brand bg-brand-soft",
              s.state === "todo" && "border-line-strong bg-surface",
              s.state === "bad" && "border-bad bg-bad",
            )}
          >
            {s.state === "done" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            ) : s.state === "now" ? (
              <span className="size-2 rounded-full bg-brand" />
            ) : null}
          </span>
          <div className="min-w-0">
            <div className={cx("text-[13.5px] text-ink", s.state === "now" ? "font-bold" : "font-semibold")}>{s.title}</div>
            {s.desc ? <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{s.desc}</div> : null}
          </div>
          <div className="whitespace-nowrap font-mono text-[11.5px] text-faint">{s.meta}</div>
        </li>
      ))}
    </ol>
  );
}

export function Facts({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-start justify-between gap-6 py-2.5 text-[13px]">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="min-w-0 text-right font-medium text-ink [overflow-wrap:anywhere]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("font-mono text-[12.5px]", className)}>{children}</span>;
}

export function Table({ cols, children, empty, minWidth }: { cols: ReactNode[]; children?: ReactNode; empty?: ReactNode; minWidth?: number }) {
  const hasRows = Array.isArray(children) ? children.flat().filter(Boolean).length > 0 : !!children;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            {cols.map((c, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint first:pl-5 last:pr-5">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {!hasRows ? <div className="px-5 py-8 text-center text-[13px] text-muted">{empty ?? "Nothing here yet."}</div> : null}
    </div>
  );
}

export function Td({ children, className, mono }: { children?: ReactNode; className?: string; mono?: boolean }) {
  return <td className={cx("px-4 py-3 align-middle first:pl-5 last:pr-5", mono && "font-mono text-[12.5px]", className)}>{children}</td>;
}

export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-ink hover:text-brand-text hover:underline">
      {children}
    </Link>
  );
}

export function Note({ tone = "info", title, children, rule, action }: { tone?: Tone; title: ReactNode; children?: ReactNode; rule?: string; action?: ReactNode }) {
  return (
    <div role="note" className={cx("flex gap-3 rounded-2xl border px-4 py-3.5", TONE_BG[tone], "border-current/15", TONE_TEXT[tone])}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
        {tone === "bad" ? <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" /> : tone === "warn" ? <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /> : tone === "ok" ? <path d="M5 12l5 5L20 7" /> : <path d="M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />}
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[13.5px] font-bold text-ink">{title}</span>
        {children ? <div className="text-[13px] leading-relaxed text-text">{children}</div> : null}
        {rule ? <span className="font-mono text-[11px] text-faint">{rule}</span> : null}
        {action ? <div className="mt-1.5">{action}</div> : null}
      </div>
    </div>
  );
}

export function Tabs({ tabs, current }: { tabs: { id: string; label: ReactNode; href: string; count?: number }[]; current: string }) {
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-line" aria-label="Tabs">
      {tabs.map((t) => {
        const on = t.id === current;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cx(
              "flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[13.5px] transition",
              on ? "border-brand font-bold text-ink" : "border-transparent font-semibold text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.count ? <span className="rounded-full bg-surface-3 px-1.5 py-0.5 font-mono text-[10.5px] text-text">{t.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={cx("grid gap-4", cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3")}>{children}</div>;
}

export function Empty({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="font-display text-[16px] font-semibold text-ink">{title}</span>
      {children ? <p className="max-w-md text-[13px] text-muted">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Bar({ value, max = 100, tone = "brand" }: { value: number; max?: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <span className={cx("block h-full rounded-full", TONE_DOT[tone])} style={{ width: pct + "%" }} />
    </span>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name
    .replace(/^Dr\.?\s+/, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-display font-bold text-brand-text" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {ini}
    </span>
  );
}

/* ——— form controls ——— */

export function Label({ label, help, error, children, className }: { label: ReactNode; help?: ReactNode; error?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {help ? <span className="text-[12px] text-muted">{help}</span> : null}
      {error ? <span className="text-[12px] font-semibold text-bad">{error}</span> : null}
    </label>
  );
}

const FIELD = "w-full rounded-xl border border-line-strong bg-canvas px-3.5 text-[13.5px] text-ink placeholder:text-faint transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:bg-surface-2 read-only:bg-surface-2";

export function Input({ className, mono, ...p }: ComponentProps<"input"> & { mono?: boolean }) {
  return <input className={cx(FIELD, "h-11", mono && "font-mono", className)} {...p} />;
}

export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cx(FIELD, "min-h-24 py-2.5 leading-relaxed", className)} {...p} />;
}

export function Select({ className, options, ...p }: ComponentProps<"select"> & { options: (string | [string, string])[] }) {
  return (
    <select className={cx(FIELD, "h-11 cursor-pointer pr-8", className)} {...p}>
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function Check({ name, value, children, defaultChecked, required }: { name: string; value?: string; children: ReactNode; defaultChecked?: boolean; required?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas p-3 text-[13px] leading-snug text-text has-[:checked]:border-brand/50 has-[:checked]:bg-brand-soft">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} required={required} className="mt-0.5 size-4 accent-[var(--brand)]" />
      <span>{children}</span>
    </label>
  );
}
