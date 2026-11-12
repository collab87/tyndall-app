import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyBars } from "@/components/charts";
import { ActionForm, ConfirmAction, Submit } from "@/components/client";
import { StageTrack } from "@/components/stage-track";
import { Card, Facts, Grid, Input, Label, Mono, Note, PageHeader, Pill, Select, Table, Td, Textarea } from "@/components/ui";
import { commentPdd, decidePilot, raiseFinding, validatePdd } from "@/app/auditor/actions";
import { requireAuditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { findingTone, FINDING_TYPES } from "@/lib/findings";
import { date, num } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { PILOT_BASELINE } from "@/lib/methodology";
import { PILOT_STATUS, stageInfo } from "@/lib/stages";
import { dailySeries, unitFor } from "@/lib/telemetry";

export default async function AuditorProject({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const u = await requireAuditor();
  const a = u.auditor;
  const p = await db.project.findUnique({ where: { code }, include: { org: true, methodology: true, pilot: true, vvb: true, auditor: true, findings: { include: { auditor: true }, orderBy: { createdAt: "desc" } }, pddSections: { orderBy: { sort: "asc" } }, devices: { where: { isPilot: true } } } });
  if (!p || (p.vvbId !== a.id && p.auditorId !== a.id) || a.status !== "APPROVED") notFound();
  const isVvb = p.vvbId === a.id;
  const s = stageInfo(p.stage);
  const unit = unitFor(p.methodology.code);
  const series = p.devices.map((d) => dailySeries(d.imei, p.methodology.code, d.status));
  const daily = series[0]?.map((x, i) => ({ label: x.day.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), value: series.reduce((acc, ds) => acc + ds[i].value, 0), gap: series.every((ds) => ds[i].gap) })) ?? [];
  const textSections = p.pddSections.filter((x) => x.kind === "TEXT");
  return (
    <>
      <PageHeader back={{ href: "/auditor", label: "Engagements" }} eyebrow={`${p.code} · ${p.methodology.code} ${p.methodology.version} · you are the ${isVvb ? "VVB" : "lifetime auditor"}`} title={p.name} sub={`${p.org.name} · ${p.location} · ${num(p.units)} ${p.unitType.toLowerCase()}`} status={{ label: s.label, tone: s.tone }} />
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm">
        <StageTrack stage={p.stage} />
      </div>

      {p.pilot ? (
        <Grid>
          <Card title="Pilot · 1%" action={<Pill tone={PILOT_STATUS[p.pilot.status].tone}>{PILOT_STATUS[p.pilot.status].label}</Pill>}>
            <Facts
              rows={[
                ["Units", `${p.devices.length} of ${p.pilot.units}`],
                ["Plan", p.pilot.plan ?? "—"],
                ["Comparison", p.pilot.comparison ?? "—"],
                ["Started", date(p.pilot.startedAt)],
                ["Reported", date(p.pilot.reportedAt)],
                ["Developer note", p.pilot.reportNote ?? "—"],
                ["Gaps", `${p.devices.filter((d) => d.status === "OFFLINE" || d.status === "FAULT").length} units with gaps · excluded, not filled`],
              ]}
            />
          </Card>
          <Card title={`Pilot fleet · daily ${unit.label.toLowerCase()} (${unit.unit})`}>
            {daily.length ? <DailyBars data={daily} unit={unit.unit} digits={unit.digits} /> : <p className="text-[13px] text-muted">No pilot readings yet.</p>}
          </Card>
        </Grid>
      ) : null}

      {isVvb && p.pilot?.status === "REPORTED" ? (
        <Card title="Validate the pilot" meta="Validating locks the baseline into PDD section 3.1 and opens the developer's PDD.">
          <Grid>
            <Facts rows={(PILOT_BASELINE[p.methodology.code] ?? []).map(([k, v, un]) => [k, <Mono key={k}>{`${v} ${un}`}</Mono>])} />
            <ActionForm action={decidePilot} className="flex flex-col gap-3">
              <input type="hidden" name="code" value={p.code} />
              <Label label="Validation note" help="Required if you return the report.">
                <Textarea name="note" rows={3} placeholder="e.g. Day-1 visit matched all serials; sample within 0.8%." />
              </Label>
              <div className="flex gap-2">
                <Submit name="decision" value="validate">
                  Validate baseline
                </Submit>
                <Submit name="decision" value="return" variant="secondary">
                  Ask for more data
                </Submit>
              </div>
            </ActionForm>
          </Grid>
        </Card>
      ) : null}

      {isVvb && p.stage === "PDD_REVIEW" ? (
        <Card title={`Review PDD v${p.pddVersion}`} meta={p.pddHash ? `content hash ${shortHash(p.pddHash)}` : undefined} action={<ConfirmAction action={validatePdd} fields={{ code: p.code }} trigger="Validate PDD" size="sm" title="Validate this PDD?" body="Your validation is recorded and the PDD goes to Tyndall for approval and listing." ack="I reviewed every section against the methodology and the pilot baseline." confirmLabel="Validate" />}>
          <div className="flex flex-col gap-4">
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-line">
              {textSections.map((x) => (
                <div key={x.id} className="border-b border-line px-4 py-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11.5px] text-brand-text">{x.code}</span>
                    <span className="text-[13px] font-bold text-ink">{x.title}</span>
                    {x.evidence ? <span className="font-mono text-[11px] text-faint">· {x.evidence}</span> : null}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-text">{x.content || <span className="text-faint">Empty</span>}</p>
                </div>
              ))}
            </div>
            <ActionForm action={commentPdd} className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
              <input type="hidden" name="code" value={p.code} />
              <Label label="Section">
                <Select name="section" options={textSections.map((x) => [x.code, `${x.code} ${x.title}`] as [string, string])} />
              </Label>
              <Label label="Comment">
                <Input name="comment" placeholder="What the developer must change" />
              </Label>
              <Submit variant="secondary">Comment & return</Submit>
            </ActionForm>
          </div>
        </Card>
      ) : null}

      <Grid>
        <Card title="Findings" pad={false}>
          <Table cols={["Finding", "Status"]} empty="No findings raised.">
            {p.findings.map((f) => {
              const [t, l] = findingTone(f);
              return (
                <tr key={f.id}>
                  <Td>
                    <Link href={`/auditor/findings/${f.code}`} className="font-semibold text-ink hover:text-brand-text">
                      {f.title}
                    </Link>
                    <div className="font-mono text-[11.5px] text-faint">
                      {f.code} · by {f.auditor.name}
                    </div>
                  </Td>
                  <Td>
                    <Pill tone={t}>{l}</Pill>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
        <Card title="Raise a finding">
          <ActionForm action={raiseFinding} className="flex flex-col gap-3" resetOnOk>
            <input type="hidden" name="code" value={p.code} />
            <Label label="Type">
              <Select name="type" options={FINDING_TYPES} />
            </Label>
            <Label label="Title">
              <Input name="title" required />
            </Label>
            <Label label="What you found">
              <Textarea name="detail" rows={2} required />
            </Label>
            <Label label="What the developer must do">
              <Textarea name="request" rows={2} required />
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Label label="At stake">
                <Input name="atStake" placeholder="e.g. 124 t withheld" />
              </Label>
              <Label label="Due">
                <Input name="due" type="date" />
              </Label>
            </div>
            <div>
              <Submit>Raise finding</Submit>
            </div>
          </ActionForm>
        </Card>
      </Grid>
      <Note tone="info" title="Independence">You were engaged by the developer and are paid through Tyndall. Tyndall holds 20% of auditor fees until final validation.</Note>
    </>
  );
}
