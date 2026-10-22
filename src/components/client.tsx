"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { btnClass, cx } from "./ui";
import type { ActionResult } from "@/lib/action";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const flip = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tyn-theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };
  return (
    <button type="button" onClick={flip} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} className="inline-flex size-9 items-center justify-center rounded-xl border border-line text-text transition hover:bg-surface-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {dark ? <path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /> : <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />}
      </svg>
    </button>
  );
}

type Variant = Parameters<typeof btnClass>[0];

export function Submit({ children, variant = "primary", size = "md", disabled, className, name, value }: { children: ReactNode; variant?: Variant; size?: "sm" | "md" | "lg"; disabled?: boolean; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={disabled || pending} className={cx(btnClass(variant, size), className)}>
      {pending ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}

type Act = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/** A form bound to a server action that returns { ok } or { error }. */
export function ActionForm({ action, children, className, resetOnOk }: { action: Act; children: ReactNode; className?: string; resetOnOk?: boolean }) {
  const [state, run] = useActionState(action, {} as ActionResult);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      <Flash state={state} />
    </form>
  );
}

function Flash({ state }: { state: ActionResult }) {
  const [shown, setShown] = useState<ActionResult>({});
  useEffect(() => {
    setShown(state);
    if (state.ok) {
      const t = setTimeout(() => setShown({}), 4000);
      return () => clearTimeout(t);
    }
  }, [state]);
  if (shown.error)
    return (
      <p role="alert" className="mt-3 rounded-xl bg-bad/10 px-3.5 py-2.5 text-[13px] font-semibold text-bad">
        {shown.error}
      </p>
    );
  if (shown.ok)
    return (
      <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-[13.5px] font-semibold text-surface shadow-lg">
        {shown.ok}
      </div>
    );
  return null;
}

/**
 * Confirmation dialog for irreversible actions. Optionally requires typing a
 * phrase and ticking an acknowledgement before the confirm button enables.
 */
export function ConfirmAction({
  action,
  trigger,
  title,
  body,
  confirmLabel = "Confirm",
  phrase,
  ack,
  variant = "primary",
  triggerVariant,
  size = "md",
  fields,
  disabled,
}: {
  action: Act;
  trigger: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  phrase?: string;
  ack?: string;
  variant?: Variant;
  triggerVariant?: Variant;
  size?: "sm" | "md";
  fields?: Record<string, string | number>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [ticked, setTicked] = useState(false);
  const [state, run] = useActionState(action, {} as ActionResult);
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);
  const ok = (!phrase || text.trim().toUpperCase() === phrase.toUpperCase()) && (!ack || ticked);
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => (setOpen(true), setText(""), setTicked(false))} className={btnClass(triggerVariant ?? variant, size)}>
        {trigger}
      </button>
      {open ? (
        <div role="presentation" onClick={() => setOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <form action={run} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-line bg-surface shadow-lg">
            {fields ? Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
            <div className="flex flex-col gap-2 px-6 pt-6">
              <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
              {body ? <div className="text-[13.5px] leading-relaxed text-text">{body}</div> : null}
            </div>
            <div className="flex flex-col gap-3 px-6 py-4">
              {phrase ? (
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
                  <span>
                    Type <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono">{phrase}</span> to confirm
                  </span>
                  <input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck={false} className="h-11 rounded-xl border border-line-strong bg-canvas px-3.5 font-mono text-[14px] text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                </label>
              ) : null}
              {ack ? (
                <label className="flex cursor-pointer items-start gap-3 text-[13px] text-text">
                  <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
                  {ack}
                </label>
              ) : null}
              {state.error ? <p className="rounded-xl bg-bad/10 px-3 py-2 text-[13px] font-semibold text-bad">{state.error}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <button type="button" onClick={() => setOpen(false)} className={btnClass("secondary")}>
                Cancel
              </button>
              <Submit variant={variant} disabled={!ok}>
                {confirmLabel}
              </Submit>
            </div>
          </form>
        </div>
      ) : null}
      {state.ok && !open ? <OkToast msg={state.ok} /> : null}
    </>
  );
}

function OkToast({ msg }: { msg: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-[13.5px] font-semibold text-surface shadow-lg">
      {msg}
    </div>
  );
}
