import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { ActionForm, Submit } from "@/components/client";
import { Check, Input, Label, Select } from "@/components/ui";
import { registerDeveloper } from "./actions";

export const metadata = { title: "Register a developer" };

export default function RegisterPage() {
  return (
    <AuthFrame wide>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-text">Project developers</span>
        <h1 className="font-display text-[30px] font-semibold tracking-[-0.03em] text-ink">Register your organisation</h1>
        <p className="text-[14px] text-muted">You can start drafting projects straight away. Tyndall verifies your organisation (KYB) before your first project is submitted.</p>
      </div>
      <ActionForm action={registerDeveloper} className="flex flex-col gap-5">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-faint">Organisation</legend>
          <Label label="Legal name" className="sm:col-span-2">
            <Input name="org" required placeholder="e.g. Arewa Clean Energy Ltd" />
          </Label>
          <Label label="Registration number">
            <Input name="regNumber" required placeholder="RC 1402118" mono />
          </Label>
          <Label label="Country">
            <Select name="country" options={["Nigeria", "Ghana", "Kenya", "Rwanda", "Zambia"]} />
          </Label>
          <Label label="Registered address" className="sm:col-span-2">
            <Input name="address" placeholder="Street, city" />
          </Label>
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-faint">Your admin account</legend>
          <Label label="Full name">
            <Input name="name" required autoComplete="name" />
          </Label>
          <Label label="Job title">
            <Input name="title" placeholder="Managing Director" />
          </Label>
          <Label label="Work email">
            <Input name="email" type="email" required autoComplete="email" />
          </Label>
          <Label label="Password" help="At least 8 characters.">
            <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Label>
        </fieldset>
        <Check name="terms" required>
          I am authorised to act for this organisation, and I will declare related parties and consultants for every project I register.
        </Check>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/login" className="text-[13px] font-semibold text-brand-text hover:underline">
            Already registered? Sign in
          </Link>
          <Submit size="lg">Create organisation</Submit>
        </div>
      </ActionForm>
    </AuthFrame>
  );
}
