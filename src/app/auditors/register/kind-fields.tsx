"use client";

import { useState } from "react";
import { cx, Input, Label } from "@/components/ui";

/** Firm or individual: the identity fields change with the choice. */
export function KindFields() {
  const [kind, setKind] = useState<"INDIVIDUAL" | "FIRM">("INDIVIDUAL");
  const firm = kind === "FIRM";
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-faint">Who is applying</legend>
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-2 sm:col-span-2" role="radiogroup">
        {(
          [
            ["INDIVIDUAL", "Individual", "An independent verifier or auditor"],
            ["FIRM", "Firm", "An accredited body with a team"],
          ] as const
        ).map(([v, t, d]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={kind === v}
            onClick={() => setKind(v)}
            className={cx("flex flex-col items-start gap-0.5 rounded-2xl border p-4 text-left transition", kind === v ? "border-brand bg-brand-soft" : "border-line bg-canvas hover:border-line-strong")}
          >
            <span className="font-display text-[15px] font-semibold text-ink">{t}</span>
            <span className="text-[12.5px] text-muted">{d}</span>
          </button>
        ))}
      </div>
      <Label label={firm ? "Firm name" : "Full name"}>
        <Input name="name" required placeholder={firm ? "e.g. EarthCheck Verification" : "e.g. Halima Sadiq"} />
      </Label>
      {firm ? (
        <Label label="Contact person">
          <Input name="contactName" required />
        </Label>
      ) : (
        <Label label="Phone">
          <Input name="phone" type="tel" placeholder="+234 …" />
        </Label>
      )}
      <Label label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Label>
      <Label label="City">
        <Input name="city" required />
      </Label>
      {firm ? (
        <Label label="Number of verifiers / auditors">
          <Input name="teamSize" type="number" min={1} mono />
        </Label>
      ) : null}
    </fieldset>
  );
}
