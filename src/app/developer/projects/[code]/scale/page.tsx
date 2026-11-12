import { ActionForm, Submit } from "@/components/client";
import { Card, Check, Facts, Grid, LinkButton, Note, Steps, Textarea } from "@/components/ui";
import { applyScaleUp } from "@/app/developer/actions";
import { AUDITOR_FEE_YEAR, PROGRAMME_SPLIT, VAT } from "@/lib/fees";
import { naira, num } from "@/lib/format";
import { atLeast } from "@/lib/stages";
import { loadProject } from "../data";

export default async function ScalePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { p } = await loadProject(code);
  const rest = p.units - (p.pilot?.units ?? 0);
  const flow = (
    <Card title="Scale-up flow">
      <Steps
        steps={[
          { title: "PDD approved", desc: "Listed with expected credits", state: atLeast(p.stage, "LISTED") ? "done" : "todo" },
          { title: "Submit scale-up application", desc: "Rollout phases, devices, team", state: atLeast(p.stage, "SCALE_REVIEW") ? "done" : p.stage === "LISTED" ? "now" : "todo" },
          { title: "Tyndall review", desc: "Checks the plan against the PDD", state: atLeast(p.stage, "SCALE_APPROVED") ? "done" : p.stage === "SCALE_REVIEW" ? "now" : "todo" },
          { title: "Pay", desc: "Scale-up fee (50%) + auditor year 2", state: p.stage === "ACTIVE" ? "done" : p.stage === "SCALE_APPROVED" ? "now" : "todo" },
          { title: "Roll out", desc: "Pair and commission devices · auditor visits quarterly", state: p.stage === "ACTIVE" ? "now" : "todo" },
        ]}
      />
    </Card>
  );
  if (!atLeast(p.stage, "LISTED")) {
    return (
      <Grid>
        {flow}
        <Note tone="info" title="Scale-up opens after Tyndall approves your PDD.">You deploy the remaining {num(rest)} {p.unitType.toLowerCase()} after the pilot and PDD are validated.</Note>
      </Grid>
    );
  }
  if (p.stage === "LISTED") {
    return (
      <Grid>
        {flow}
        <Card title="Scale-up application" meta={`Deploy the remaining ${num(rest)} ${p.unitType.toLowerCase()}`}>
          <ActionForm action={applyScaleUp} className="flex flex-col gap-4">
            <input type="hidden" name="code" value={p.code} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink">Rollout plan</span>
              <Textarea name="plan" rows={4} defaultValue={`Phase A: ${num(Math.round(rest * 0.4))} ${p.unitType.toLowerCase()} · Q1 2027\nPhase B: ${num(rest - Math.round(rest * 0.4))} ${p.unitType.toLowerCase()} · Q3 2027`} />
            </label>
            <Facts
              rows={[
                ["Devices", `${num(rest)} Tyndall IoT meters to order; you register your own serials when they arrive`],
                ["Team", `VVB ${p.vvb?.name} · auditor ${p.auditor?.name} continue`],
                ["Scale-up fee (50%)", naira(p.programmeFee * PROGRAMME_SPLIT.SCALE * (1 + VAT))],
                ["Auditor fee · year 2", naira(AUDITOR_FEE_YEAR * (1 + VAT))],
              ]}
            />
            <Check name="decl">Our declarations (related parties, consultants, carbon rights) are still accurate.</Check>
            <div>
              <Submit>Submit application</Submit>
            </div>
          </ActionForm>
        </Card>
      </Grid>
    );
  }
  return (
    <Grid>
      {flow}
      <div className="flex flex-col gap-4">
        {p.stage === "SCALE_REVIEW" ? <Note tone="info" title="Your application is with Tyndall.">A Carbon Manager checks the rollout plan against the approved PDD.</Note> : null}
        {p.stage === "SCALE_APPROVED" ? <Note tone="warn" title="Approved. Pay the scale-up fees to start rollout." action={<LinkButton href="/developer/payments" variant="primary" size="sm">Go to payments</LinkButton>} /> : null}
        {p.stage === "ACTIVE" ? <Note tone="ok" title="Scale-up running." action={<LinkButton href={`/developer/projects/${p.code}/devices`} variant="primary" size="sm">Manage devices</LinkButton>}>Your auditor stays for the project lifetime and visits quarterly.</Note> : null}
        {p.scalePlan ? (
          <Card title="Rollout plan">
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-text">{p.scalePlan}</p>
          </Card>
        ) : null}
      </div>
    </Grid>
  );
}
