import Link from "next/link";
import { ActionForm, ConfirmAction, Submit } from "@/components/client";
import { Bar, Card, cx, Facts, Input, Label, LinkButton, Mono, Note, Pill, Stat, Stats, Textarea } from "@/components/ui";
import { savePddSection, submitPdd } from "@/app/developer/actions";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { atLeast } from "@/lib/stages";
import { loadProject } from "../data";

const STATUS = { COMPLETE: ["ok", "Complete"], TODO: ["warn", "To do"], COMMENT: ["bad", "VVB comment"] } as const;

export default async function PddPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ s?: string }> }) {
  const { code } = await params;
  const { s: sel } = await searchParams;
  const { u, p } = await loadProject(code);
  if (!atLeast(p.stage, "PDD")) {
    return (
      <Note tone="warn" title="The PDD opens after your pilot is validated." rule="Rule PIL-02" action={p.pilot ? <LinkButton href={`/developer/projects/${p.code}/pilot`} variant="primary" size="sm">Go to pilot</LinkButton> : undefined}>
        The PDD is built from the {p.methodology.code} template, and section 3.1 (baseline) is filled from your validated 1% pilot.
      </Note>
    );
  }
  const sections = await db.pddSection.findMany({ where: { projectId: p.id }, orderBy: { sort: "asc" } });
  const done = sections.filter((s) => s.status === "COMPLETE").length;
  const comments = sections.filter((s) => s.status === "COMMENT").length;
  const pct = sections.length ? Math.round((done / sections.length) * 100) : 0;
  const editable = p.stage === "PDD" && ["DEV_ADMIN", "DEV_LEAD", "DEV_MEO", "DEV_CONSULTANT"].includes(u.role);
  const cur = sections.find((s) => s.code === sel) ?? sections.find((s) => s.status !== "COMPLETE") ?? sections[0];
  const baseline: [string, string, string][] = p.pilot?.baseline ? JSON.parse(p.pilot.baseline) : [];
  const parts = [...new Set(sections.map((s) => s.part))];
  const locked = !editable;
  return (
    <>
      <Stats>
        <Stat label="Complete" value={`${pct}%`} note={`${done} of ${sections.length} sections`} tone={pct === 100 ? "ok" : "brand"} />
        <Stat label="VVB comments" value={comments} note={comments ? "need your response" : "none open"} tone={comments ? "bad" : "ok"} />
        <Stat label="Expected reductions" value={num(p.expectedPerYear ?? 0) + " t"} note="per year · auto-calculated" tone="seal" />
        <Stat label="Version" value={`v${Math.max(1, p.pddVersion)}`} note={p.pddHash ? `hash ${shortHash(p.pddHash)}` : "draft · not yet hashed"} tone="neutral" />
      </Stats>
      {p.stage === "PDD_REVIEW" ? <Note tone="info" title={`The PDD is with ${p.vvb?.name}.`}>It is locked while your VVB reviews it. If they comment, it returns to you for edits.</Note> : null}
      {p.stage === "PDD_VALIDATED" ? <Note tone="warn" title="Validated by your VVB. Tyndall is approving it.">Once approved, the project is listed on the marketplace with expected credits.</Note> : null}
      {atLeast(p.stage, "LISTED") ? <Note tone="ok" title="PDD approved by Tyndall. The project is listed." action={p.stage === "LISTED" ? <LinkButton href={`/developer/projects/${p.code}/scale`} variant="primary" size="sm">Apply for scale-up</LinkButton> : undefined}>Changes now need a new version reviewed by your VVB and Tyndall.</Note> : null}
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="Sections" meta={p.methodology.code + " template"} pad={false} action={p.stage === "PDD" ? <ConfirmAction action={submitPdd} fields={{ code: p.code }} trigger="Submit to VVB" size="sm" disabled={pct < 100 || !editable} title={`Submit the PDD to ${p.vvb?.name}?`} body="The PDD is locked and its content hash recorded. Your VVB reviews it and may comment." confirmLabel="Submit PDD" /> : undefined}>
          <div className="px-5 pt-4">
            <Bar value={pct} tone={pct === 100 ? "ok" : "brand"} />
          </div>
          <nav className="flex flex-col py-2">
            {parts.map((part) => (
              <div key={part} className="py-1">
                <div className="px-5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">{part}</div>
                {sections
                  .filter((s) => s.part === part)
                  .map((s) => {
                    const [tone, label] = s.kind === "PILOT" ? (["tech", "From pilot"] as const) : s.kind === "AUTO" ? (["info", "Auto"] as const) : STATUS[s.status as keyof typeof STATUS];
                    return (
                      <Link key={s.id} href={`?s=${s.code}`} scroll={false} className={cx("flex items-center gap-3 px-5 py-2 text-[13px] transition", cur?.id === s.id ? "bg-brand-soft" : "hover:bg-surface-2")}>
                        <span className="w-7 shrink-0 font-mono text-[11.5px] text-muted">{s.code}</span>
                        <span className={cx("min-w-0 flex-1 truncate", cur?.id === s.id ? "font-bold text-ink" : "text-text")}>{s.title}</span>
                        <Pill tone={tone}>{label}</Pill>
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>
        </Card>
        {cur ? (
          <Card title={`${cur.code} · ${cur.title}`} meta={cur.part}>
            {cur.kind === "PILOT" ? (
              <div className="flex flex-col gap-4">
                <Note tone="info" title={`Imported from the validated pilot · validated by ${p.vvb?.name}`} rule="Rule PIL-02 · locked">
                  Developers cannot edit the baseline. It comes from the 1% pilot measurements.
                </Note>
                <Facts rows={baseline.map(([k, v, un]) => [k, <Mono key={k}>{`${v} ${un}`}</Mono>])} />
              </div>
            ) : cur.kind === "AUTO" ? (
              <Facts
                rows={[
                  [
                    "Filled by the platform",
                    cur.code === "2.1"
                      ? `${p.methodology.code} ${p.methodology.version} · ${p.methodology.name} · pinned at registration`
                      : cur.code === "4.2"
                        ? "Readings are signed on the device, hashed in daily batches and chained in the audit trail."
                        : `${num(p.expectedPerYear ?? 0)} tCO₂e per year: pilot values × ${num(p.units)} ${p.unitType.toLowerCase()}.`,
                  ],
                ]}
              />
            ) : (
              <ActionForm action={savePddSection} className="flex flex-col gap-4">
                <input type="hidden" name="code" value={p.code} />
                <input type="hidden" name="section" value={cur.code} />
                {cur.status === "COMMENT" && cur.comment ? <Note tone="bad" title={`${p.vvb?.name} commented`}>{cur.comment}</Note> : null}
                <Label label="Section text" help={`Guidance from ${p.methodology.code} applies. Every save is versioned.`}>
                  <Textarea key={cur.id} name="content" rows={10} defaultValue={cur.content ?? ""} readOnly={locked} placeholder="Write this section…" />
                </Label>
                <Label label="Evidence file" help="Name of the attached file. It is hashed on upload.">
                  <Input key={cur.id + "e"} name="evidence" defaultValue={cur.evidence ?? ""} readOnly={locked} placeholder="e.g. financing-term-sheet.pdf" />
                </Label>
                {editable ? (
                  <div className="flex flex-wrap gap-2">
                    <Submit variant="secondary" name="intent" value="draft">
                      Save draft
                    </Submit>
                    <Submit name="intent" value="complete">
                      {cur.status === "COMPLETE" ? "Save" : "Mark complete"}
                    </Submit>
                  </div>
                ) : null}
              </ActionForm>
            )}
          </Card>
        ) : null}
      </div>
    </>
  );
}
