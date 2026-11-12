import type { ReactNode } from "react";
import { date } from "@/lib/format";
import { findingTone } from "@/lib/findings";
import { Card, Facts, Grid, Note, PageHeader, Steps } from "./ui";

type F = { code: string; type: string; phase: string; title: string; detail: string; request: string; atStake: string | null; due: Date | null; status: string; response: string | null; evidence: string | null; respondedAt: Date | null; closedAt: Date | null; createdAt: Date; project: { name: string }; auditor: { name: string } };

/** Shared read view of a finding, used by the developer, the auditor and the console. */
export function FindingView({ f, back, children }: { f: F; back: { href: string; label: string }; children?: ReactNode }) {
  const [tone, label] = findingTone(f);
  return (
    <>
      <PageHeader back={back} eyebrow={`${f.code} · ${f.type} · ${f.project.name} · ${f.phase}`} title={f.title} sub={`Raised by ${f.auditor.name} on ${date(f.createdAt)}${f.due ? ` · due ${date(f.due)}` : ""}`} status={{ label, tone }} />
      <Grid>
        <div className="flex flex-col gap-4">
          <Note tone="info" title="What the reviewer found">{f.detail}</Note>
          <Note tone="warn" title="What is needed">{f.request}</Note>
          <Card title="Finding">
            <Facts
              rows={[
                ["Type", f.type],
                ["Phase", f.phase],
                ["Raised by", f.auditor.name],
                ["At stake", f.atStake ?? "—"],
              ]}
            />
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card title="Status">
            <Steps
              steps={[
                { title: "Raised", meta: date(f.createdAt), state: "done" },
                { title: "Developer response", desc: f.response ?? undefined, meta: f.respondedAt ? date(f.respondedAt) : undefined, state: f.respondedAt ? "done" : f.status === "OPEN" ? "now" : "todo" },
                { title: "Reviewer decision", desc: f.closedAt ? "Accepted and closed" : undefined, meta: f.closedAt ? date(f.closedAt) : undefined, state: f.closedAt ? "done" : f.status === "RESPONDED" ? "now" : "todo" },
              ]}
            />
            {f.evidence ? <p className="mt-3 font-mono text-[12px] text-muted">Evidence: {f.evidence}</p> : null}
          </Card>
          {children}
        </div>
      </Grid>
    </>
  );
}
