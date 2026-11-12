"use client";

import { useActionState, useState } from "react";
import { Submit } from "@/components/client";
import { Button, Card, Check, cx, Facts, Input, Label, Note, Select, Steps, Textarea } from "@/components/ui";
import type { ActionResult } from "@/lib/action";
import { bandFor, pilotUnits, REG_FEE, VAT } from "@/lib/fees";
import { naira, num } from "@/lib/format";
import { REDUCTION_PER_UNIT, UNIT_TYPES } from "@/lib/methodology";
import { createProject } from "../../actions";

type M = { code: string; name: string; version: string; sector: string };
const STEPS = ["Basics", "Scale & pilot", "Instruments", "Team & declarations", "Standards check", "Review"];

export function Wizard({ methodologies, verified }: { methodologies: M[]; verified: boolean }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string>>({ methodology: methodologies[0]?.code ?? "", unitType: "Stoves", crediting: "10", interval: "", calibration: "Annual, ISO/IEC 17025 lab" });
  const [state, run] = useActionState(createProject, {} as ActionResult);
  const set = (k: string) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const units = parseInt((v.units ?? "").replace(/,/g, ""), 10) || 0;
  const band = bandFor(units || 1);
  const pilot = pilotUnits(units || 1);
  const m = methodologies.find((x) => x.code === v.methodology);
  const checks: [string, string, boolean][] = [
    ["Methodology applicable", m ? `${m.code} ${m.name}` : "—", !!m],
    ["Instrument named", v.instrument || "Not named", !!v.instrument],
    ["Reporting interval", v.interval || "Not given", !!v.interval],
    ["Calibration regime", v.calibration || "Not given", !!v.calibration],
    ["Planned units", units ? num(units) + " " + (v.unitType ?? "").toLowerCase() : "Not given", units > 0],
    ["Unit IDs unique", "Every serial is checked against all Tyndall projects at pairing", true],
  ];
  const passed = checks.filter((c) => c[2]).length;
  const can = [
    !!(v.name && (v.about ?? "").length >= 20 && v.activity && v.location),
    units > 0,
    !!(v.instrument && v.interval && v.calibration),
    true,
    passed === checks.length,
    true,
  ];

  return (
    <form action={run} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={cx(
                  "flex h-9 items-center gap-2 rounded-full border px-3.5 text-[12.5px] font-semibold transition",
                  i === step ? "border-brand bg-brand text-brand-fg" : i < step ? "border-brand/40 bg-brand-soft text-brand-text" : "border-line text-muted",
                )}
              >
                <span className="font-mono text-[11px]">{i + 1}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>

        <Card className={step === 0 ? "" : "hidden"} title="1 · Basics" meta="This becomes your public project page.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Project title" className="sm:col-span-2">
              <Input name="name" value={v.name ?? ""} onChange={set("name")} placeholder="e.g. Abuja Biogas Digesters" />
            </Label>
            <Label label="Methodology" help="PDD fields come from this methodology. The version is pinned at registration." className="sm:col-span-2">
              <Select name="methodology" value={v.methodology} onChange={set("methodology")} options={methodologies.map((x) => [x.code, `${x.code} ${x.version} · ${x.name}`] as [string, string])} />
            </Label>
            <Label label="Activity" className="sm:col-span-2">
              <Input name="activity" value={v.activity ?? ""} onChange={set("activity")} placeholder="What the project does, in one line" />
            </Label>
            <Label label="Location">
              <Input name="location" value={v.location ?? ""} onChange={set("location")} placeholder="State, country" />
            </Label>
            <Label label="Planned start">
              <Input name="startDate" type="date" value={v.startDate ?? ""} onChange={set("startDate")} />
            </Label>
            <Label label="About (public)" help="At least 20 characters." className="sm:col-span-2">
              <Textarea name="about" rows={3} value={v.about ?? ""} onChange={set("about")} />
            </Label>
          </div>
        </Card>

        <Card className={step === 1 ? "" : "hidden"} title="2 · Scale & pilot" meta="Your fee band comes from unit count only, never tonnage.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Planned units">
              <Input name="units" value={v.units ?? ""} onChange={set("units")} mono inputMode="numeric" placeholder="1,200" />
            </Label>
            <Label label="Unit type">
              <Select name="unitType" value={v.unitType} onChange={set("unitType")} options={UNIT_TYPES} />
            </Label>
            <Label label="Crediting period">
              <Select name="crediting" value={v.crediting} onChange={set("crediting")} options={[["10", "10 years"], ["7", "7 years (renewable)"]]} />
            </Label>
            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-tech/30 bg-tech/10 px-4 py-3 text-[13px] text-text">
                <b className="text-tech">Pilot: {num(pilot)} {(v.unitType ?? "units").toLowerCase()}</b> · 1% of planned units. The pilot sets your PDD baseline.
              </div>
            </div>
          </div>
        </Card>

        <Card className={step === 2 ? "" : "hidden"} title="3 · Instruments" meta="No instrument, no listing. This is checked automatically (rule GATE-01).">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Measuring instrument" className="sm:col-span-2" help="Tyndall IoT meter on your own equipment, or an approved third-party model.">
              <Input name="instrument" value={v.instrument ?? ""} onChange={set("instrument")} placeholder="Tyndall TM-2 meter on Arewa Jiko Smart 2 stoves" />
            </Label>
            <Label label="Reporting interval">
              <Input name="interval" value={v.interval ?? ""} onChange={set("interval")} placeholder="Every 1 minute, signed on device" />
            </Label>
            <Label label="Calibration regime">
              <Select name="calibration" value={v.calibration} onChange={set("calibration")} options={["Annual, ISO/IEC 17025 lab", "Factory + 2-yearly field check"]} />
            </Label>
          </div>
        </Card>

        <Card className={step === 3 ? "" : "hidden"} title="4 · Team & declarations" meta="Declarations are locked when you pay and published on your project page.">
          <div className="flex flex-col gap-4">
            <Label label="Project consultant" help="Anyone who advised on the design. A consultant can never be this project's VVB.">
              <Input name="consultant" value={v.consultant ?? ""} onChange={set("consultant")} placeholder="None" />
            </Label>
            <Label label="Related parties" help="Shared directors, owners or family links with Tyndall staff, VVBs, or other developers.">
              <Textarea name="relatedParty" rows={2} value={v.relatedParty ?? ""} onChange={set("relatedParty")} placeholder="Leave empty if there are none" />
            </Label>
            <Check name="rpConfirm">I have declared every related party above, or there are none.</Check>
            <Check name="rights">We hold, or will hold before issuance, the carbon rights from every unit.</Check>
          </div>
        </Card>

        <Card className={step === 4 ? "" : "hidden"} title="5 · Standards check" meta={`${passed} of ${checks.length} passed`} pad={false}>
          <ul className="divide-y divide-line">
            {checks.map(([k, d, ok]) => (
              <li key={k} className="flex items-center gap-3 px-5 py-3">
                <span className={cx("flex size-6 items-center justify-center rounded-full text-white", ok ? "bg-ok" : "bg-bad")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">{ok ? <path d="M5 12l5 5L20 7" /> : <path d="M6 6l12 12M18 6L6 18" />}</svg>
                </span>
                <span className="w-44 shrink-0 text-[13px] font-semibold text-ink">{k}</span>
                <span className="min-w-0 truncate text-[13px] text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className={step === 5 ? "flex flex-col gap-4" : "hidden"}>
          <Card title="6 · Review and create">
            <Facts
              rows={[
                ["Project", v.name || "—"],
                ["Methodology", m ? `${m.code} ${m.version}` : "—"],
                ["Units", units ? `${num(units)} ${(v.unitType ?? "").toLowerCase()}` : "—"],
                ["Pilot (1%)", num(pilot)],
                ["Fee band", band.label],
                ["Registration fee (next)", naira(REG_FEE * (1 + VAT)) + " incl. VAT"],
              ]}
            />
          </Card>
          {!verified ? <Note tone="warn" title="You can create this project now and pay once Tyndall has verified your organisation." /> : null}
        </div>

        {state.error ? <p className="rounded-xl bg-bad/10 px-4 py-3 text-[13px] font-semibold text-bad">{state.error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!can[step]}>
              {step === 4 ? "Continue to review" : "Next"}
            </Button>
          ) : (
            <Submit size="lg">Create project</Submit>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="h-20 bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900" />
          <div className="flex flex-col gap-3 p-5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">Live preview · public page</span>
            <div className="font-display text-[18px] font-semibold text-ink">{v.name || "Untitled project"}</div>
            <p className="text-[13px] text-muted">{v.about || "Your public description appears here."}</p>
            <Facts
              rows={[
                ["Planned units", units ? num(units) : "—"],
                ["Pilot (1%)", units ? num(pilot) : "—"],
                ["Expected / yr", units && m ? num(Math.round((REDUCTION_PER_UNIT[m.code] ?? 1) * units)) + " tCO₂e" : "—"],
                ["Programme fee", naira(band.fee)],
              ]}
            />
          </div>
        </div>
        <Card title="How fees work">
          <Steps
            steps={[
              { title: "Registration", desc: naira(REG_FEE) + " + VAT, at submission", state: "now" },
              { title: "Initiation · 30%", desc: "With your VVB and auditor fees", state: "todo" },
              { title: "Scale-up · 50%", desc: "After the PDD is approved", state: "todo" },
              { title: "Issuance · 20%", desc: "Before first issuance", state: "todo" },
            ]}
          />
        </Card>
      </aside>
    </form>
  );
}
