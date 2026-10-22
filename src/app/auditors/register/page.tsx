import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { ActionForm, Submit } from "@/components/client";
import { Check, Input, Label, Select, Textarea } from "@/components/ui";
import { db } from "@/lib/db";
import { applyAsAuditor } from "./actions";
import { KindFields } from "./kind-fields";

export const metadata = { title: "Apply as a VVB or auditor" };

export default async function AuditorRegisterPage() {
  const meths = await db.methodology.findMany({ orderBy: { code: "asc" } });
  return (
    <AuthFrame wide>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-text">VVBs & auditors</span>
        <h1 className="font-display text-[30px] font-semibold tracking-[-0.03em] text-ink">Apply to the Tyndall registry</h1>
        <p className="text-[14px] text-muted">Firms and individuals both apply here. A Tyndall admin reviews your accreditation and conflicts before you appear to developers.</p>
      </div>
      <ActionForm action={applyAsAuditor} className="flex flex-col gap-5">
        <KindFields />
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-faint">What you do</legend>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-semibold text-ink">Roles</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <Check name="roles" defaultChecked>
                <b>VVB</b> · validates the pilot and the PDD
              </Check>
              <Check name="roles">
                <b>Auditor</b> · audits monitoring for the project lifetime
              </Check>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-semibold text-ink">Methodologies you are qualified for</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {meths.map((m) => (
                <label key={m.code} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas p-3 text-[13px] has-[:checked]:border-brand/50 has-[:checked]:bg-brand-soft">
                  <input type="checkbox" name="meth" value={m.code} className="size-4 accent-[var(--brand)]" />
                  <span>
                    <span className="font-mono text-[11.5px] text-brand-text">{m.code}</span> {m.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Label label="Accreditation or certification" help="e.g. ISO 14065 accredited body, or ISO 14064-3 lead verifier." className="sm:col-span-2">
            <Input name="accreditation" required />
          </Label>
          <Label label="Accreditation expiry">
            <Input name="expiry" type="date" />
          </Label>
          <Label label="Years of experience">
            <Input name="years" type="number" min={0} required mono />
          </Label>
          <Label label="Languages">
            <Input name="languages" placeholder="English, Hausa" />
          </Label>
          <Label label="Projects you have consulted on" help="Project codes, comma-separated. You can never validate these.">
            <Input name="consults" placeholder="REG-2026-0044" mono />
          </Label>
          <Label label="About" className="sm:col-span-2">
            <Textarea name="bio" rows={3} placeholder="Experience, past engagements, regions covered." />
          </Label>
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-faint">Sign-in</legend>
          <Label label="Password" help="At least 8 characters.">
            <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Label>
          <Label label="Country">
            <Select name="country" options={["Nigeria", "Ghana", "Kenya", "Rwanda", "Zambia", "South Africa", "Senegal", "Other"]} />
          </Label>
        </fieldset>
        <Check name="coi" required>
          I declare all consulting work, employers and family links to project developers. I understand a VVB can never validate a project it consulted on, and one party cannot be both VVB and auditor on the same project.
        </Check>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/login" className="text-[13px] font-semibold text-brand-text hover:underline">
            Already applied? Sign in
          </Link>
          <Submit size="lg">Submit application</Submit>
        </div>
      </ActionForm>
    </AuthFrame>
  );
}
