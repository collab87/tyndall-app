import Link from "next/link";
import { ActionForm, Submit } from "@/components/client";
import { Card, Empty, Facts, Grid, Input, Label, Mono, Note, PageHeader, Pill } from "@/components/ui";
import { approvePdd, decideRegistration, decideScaleUp } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, naira, num } from "@/lib/format";
import { shortHash } from "@/lib/hash";

export const metadata = { title: "Approvals" };

export default async function Approvals() {
  await requireConsole("registrations");
  const include = { org: true, methodology: true, vvb: true, auditor: true, pilot: true } as const;
  const [screening, pdd, scale] = await Promise.all([
    db.project.findMany({ where: { stage: "SUBMITTED" }, include, orderBy: { submittedAt: "asc" } }),
    db.project.findMany({ where: { stage: "PDD_VALIDATED" }, include }),
    db.project.findMany({ where: { stage: "SCALE_REVIEW" }, include }),
  ]);
  return (
    <>
      <PageHeader title="Approvals" sub="Three Tyndall decisions in the lifecycle: screening a new registration, approving a VVB-validated PDD, and approving scale-up." />
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-semibold text-ink">Registration screening · {screening.length}</h2>
        {screening.length ? (
          screening.map((p) => (
            <Card key={p.id} title={<Link href={`/console/projects/${p.code}`} className="hover:text-brand-text">{p.name}</Link>} meta={`${p.code} · ${p.org.name} · submitted ${date(p.submittedAt)}`} action={p.relatedParty ? <Pill tone="bad">Related party</Pill> : <Pill tone="ok">No affiliation</Pill>}>
              <Grid>
                <div className="flex flex-col gap-4">
                  <Facts
                    rows={[
                      ["Methodology", `${p.methodology.code} ${p.methodology.version} · ${p.methodology.name}`],
                      ["Scale", `${num(p.units)} ${p.unitType.toLowerCase()} · ${p.feeBand}`],
                      ["Instrument", p.instrument],
                      ["Interval", p.interval],
                      ["Calibration", p.calibration],
                      ["Consultant", p.consultant ?? "None"],
                      ["Programme fee", naira(p.programmeFee)],
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <Note tone="ok" title="Technology-verifiability gate passed" rule="Rule GATE-01">Instrument, monitored quantity, interval and calibration regime are all named.</Note>
                  {p.relatedParty ? (
                    <Note tone="warn" title="Route to the segregated review queue" rule="Rules RP-01 to RP-04">
                      {p.relatedParty} Anyone with the declared relationship is excluded from review; the project needs an accredited VVB firm and a second reviewer.
                    </Note>
                  ) : null}
                  <ActionForm action={decideRegistration} className="flex flex-col gap-3">
                    <input type="hidden" name="code" value={p.code} />
                    <Label label="Note to the developer" help="Required when rejecting. Published with the decision.">
                      <Input name="note" placeholder="Optional for approval" />
                    </Label>
                    <div className="flex gap-2">
                      <Submit name="decision" value="approve">
                        Approve project
                      </Submit>
                      <Submit name="decision" value="reject" variant="secondary">
                        Reject
                      </Submit>
                    </div>
                  </ActionForm>
                </div>
              </Grid>
            </Card>
          ))
        ) : (
          <Empty title="No registrations waiting">New submissions appear here once the developer pays the registration fee.</Empty>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-semibold text-ink">PDD approval · {pdd.length}</h2>
        {pdd.length ? (
          pdd.map((p) => (
            <Card key={p.id} title={p.name} meta={`${p.code} · validated by ${p.vvb?.name}`}>
              <Grid>
                <Facts
                  rows={[
                    ["PDD version", `v${p.pddVersion}`],
                    ["Content hash", p.pddHash ? <Mono key="h">{shortHash(p.pddHash)}</Mono> : "—"],
                    ["Pilot", p.pilot ? `${p.pilot.units} units · validated ${date(p.pilot.validatedAt)}` : "—"],
                    ["Expected reductions", num(p.expectedPerYear ?? 0) + " tCO₂e / yr"],
                  ]}
                />
                <ActionForm action={approvePdd} className="flex flex-col justify-end gap-3">
                  <input type="hidden" name="code" value={p.code} />
                  <p className="text-[13px] text-muted">Approving lists the project on the marketplace with its expected credits.</p>
                  <div>
                    <Submit>Approve and list</Submit>
                  </div>
                </ActionForm>
              </Grid>
            </Card>
          ))
        ) : (
          <Empty title="No PDDs waiting">A PDD appears here after the project&apos;s VVB validates it.</Empty>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-semibold text-ink">Scale-up review · {scale.length}</h2>
        {scale.length ? (
          scale.map((p) => (
            <Card key={p.id} title={p.name} meta={`${p.code} · ${p.org.name}`}>
              <Grid>
                <div className="whitespace-pre-line rounded-xl bg-surface-2 p-4 text-[13px] leading-relaxed text-text">{p.scalePlan}</div>
                <ActionForm action={decideScaleUp} className="flex flex-col gap-3">
                  <input type="hidden" name="code" value={p.code} />
                  <Label label="Note">
                    <Input name="note" placeholder="Optional" />
                  </Label>
                  <div className="flex gap-2">
                    <Submit name="decision" value="approve">
                      Approve and invoice
                    </Submit>
                    <Submit name="decision" value="return" variant="secondary">
                      Return
                    </Submit>
                  </div>
                </ActionForm>
              </Grid>
            </Card>
          ))
        ) : (
          <Empty title="No scale-up applications" />
        )}
      </section>
    </>
  );
}
