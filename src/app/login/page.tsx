import Link from "next/link";
import { ActionForm, Submit } from "@/components/client";
import { AuthFrame } from "@/components/auth-frame";
import { Input, Label } from "@/components/ui";
import { login, quickLogin } from "./actions";

export const metadata = { title: "Sign in" };

const SAMPLE = [
  ["Developer", "fatima@arewaclean.ng", "Organisation admin · Arewa Clean Energy"],
  ["Developer", "musa@sahelgreen.ng", "Organisation admin · Sahel Green Power"],
  ["Console", "super@tyndall.earth", "Super Admin"],
  ["Console", "amara@tyndall.earth", "Carbon Manager"],
  ["Console", "tunde@tyndall.earth", "Registry Admin"],
  ["Console", "ngozi@tyndall.earth", "Data Quality Analyst"],
  ["VVB", "thandiwe@verify.africa", "Individual VVB · Lagos Keke"],
  ["VVB", "kofi@mensah.gh", "Individual VVB · Kaduna kiosks"],
  ["Auditor", "joseph@mwangiaudit.co.ke", "Individual auditor · Kano"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const showSamples = process.env.SHOW_SAMPLE_ACCOUNTS !== "false";
  return (
    <AuthFrame>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[30px] font-semibold tracking-[-0.03em] text-ink">Sign in</h1>
        <p className="text-[14px] text-muted">One sign-in for developers, Tyndall staff, VVBs and auditors. You land in the right workspace for your role.</p>
      </div>
      <ActionForm action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <Label label="Work email">
          <Input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </Label>
        <Label label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Label>
        <Submit size="lg" className="w-full">
          Sign in
        </Submit>
      </ActionForm>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
        <Link href="/register" className="font-semibold text-brand-text hover:underline">
          Register a developer organisation
        </Link>
        <Link href="/auditors/register" className="font-semibold text-brand-text hover:underline">
          Apply as a VVB or auditor
        </Link>
      </div>
      {showSamples ? (
        <details className="group rounded-2xl border border-line bg-surface-2/60 p-4">
          <summary className="cursor-pointer list-none text-[13px] font-bold text-ink">
            Sample accounts <span className="font-normal text-muted">· password tyndall123</span>
          </summary>
          <ul className="mt-3 flex flex-col gap-1.5">
            {SAMPLE.map(([area, email, who]) => (
              <li key={email}>
                <form action={quickLogin}>
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="password" value="tyndall123" />
                  <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-surface">
                    <span className="w-16 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-text">{area}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{who}</span>
                      <span className="block truncate font-mono text-[11.5px] text-muted">{email}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </AuthFrame>
  );
}
