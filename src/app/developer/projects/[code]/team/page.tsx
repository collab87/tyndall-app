import { Card, Facts, Grid, Note, Pill, Steps } from "@/components/ui";
import { db } from "@/lib/db";
import { AUDITOR_FEE_YEAR, PROGRAMME_SPLIT, VVB_FEE } from "@/lib/fees";
import { atLeast } from "@/lib/stages";
import { ineligibility } from "@/lib/rules";
import { loadProject } from "../data";
import { TeamPicker } from "./picker";

export default async function TeamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { u, p } = await loadProject(code);
  const choosing = p.stage === "APPROVED";
  const flow = (
    <Card title="How it works">
      <Steps
        steps={[
          { title: "Browse approved VVBs and auditors", desc: "Firms and individuals, each approved by Tyndall for specific methodologies", state: atLeast(p.stage, "PILOT") ? "done" : choosing ? "now" : "todo" },
          { title: "Pick one VVB", desc: "Validates your pilot and your PDD", state: atLeast(p.stage, "PILOT") ? "done" : choosing ? "now" : "todo" },
          { title: "Pick one auditor", desc: "A different party · audits from pilot day 1 for the project lifetime", state: atLeast(p.stage, "PILOT") ? "done" : "todo" },
          { title: "Pay", desc: "Initiation fee (30%) + VVB and auditor fees through Tyndall", state: atLeast(p.stage, "PILOT") ? "done" : "todo" },
          { title: "Engaged · the pilot opens", desc: "Both sign their conflict declaration on engagement", state: atLeast(p.stage, "PILOT") ? "done" : "todo" },
        ]}
      />
    </Card>
  );
  if (!choosing && !p.vvb) {
    return (
      <Grid>
        {flow}
        <Note tone="info" title="You choose your VVB and auditor after Tyndall approves the project.">
          {p.stage === "DRAFT" ? "Pay the registration fee to submit the project first." : "Tyndall is screening the project."}
        </Note>
      </Grid>
    );
  }
  if (choosing) {
    const all = await db.auditor.findMany({ orderBy: [{ status: "asc" }, { years: "desc" }] });
    const visible = all.filter((a) => a.status === "APPROVED" || a.status === "SUSPENDED");
    const row = (a: (typeof all)[number], role: "VVB" | "AUDITOR") => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      city: `${a.city}, ${a.country}`,
      years: a.years,
      methodologies: a.methodologies.split(",").join(" · "),
      accreditation: a.accreditation,
      teamSize: a.teamSize,
      why: ineligibility(a, p, role),
      roles: a.roles,
    });
    return (
      <>
        <Grid>
          {flow}
          <Note tone="info" title="Rules Tyndall enforces" rule="Rules TEAM-01 to TEAM-04">
            A VVB may also consult, but never on a project it validates. One party cannot be both VVB and auditor on the same project. Only parties approved for {p.methodology.code} can be selected. Ineligible parties are shown with the reason.
          </Note>
        </Grid>
        <TeamPicker
          code={p.code}
          vvbs={visible.filter((a) => a.roles.includes("VVB")).map((a) => row(a, "VVB"))}
          auditors={visible.filter((a) => a.roles.includes("AUDITOR")).map((a) => row(a, "AUDITOR"))}
          fees={{ init: p.programmeFee * PROGRAMME_SPLIT.INIT, vvb: VVB_FEE, aud: AUDITOR_FEE_YEAR }}
          canPay={u.role === "DEV_ADMIN"}
        />
      </>
    );
  }
  const party = (a: NonNullable<typeof p.vvb>, role: string, duty: string) => (
    <Card title={role} action={<Pill tone="ok">Engaged</Pill>}>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft font-display text-[15px] font-bold text-brand-text">{a.name.replace(/^Dr\.?\s+/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
        <div>
          <div className="font-display text-[17px] font-semibold text-ink">{a.name}</div>
          <div className="text-[12.5px] text-muted">
            {a.kind === "FIRM" ? `Firm · ${a.teamSize ?? "—"} verifiers` : "Individual"} · {a.city}, {a.country}
          </div>
        </div>
      </div>
      <Facts
        rows={[
          ["Duty", duty],
          ["Accreditation", a.accreditation],
          ["Methodologies", a.methodologies.split(",").join(" · ")],
          ["Experience", `${a.years} years`],
          ["Conflict declaration", <Pill key="d" tone="ok">Signed on engagement</Pill>],
        ]}
      />
    </Card>
  );
  return (
    <>
      <Grid>
        {party(p.vvb!, "VVB", "Validates the pilot and the PDD")}
        {party(p.auditor!, "Lifetime auditor", "Audits from pilot day 1 for the project lifetime")}
      </Grid>
      <Note tone="info" title="Need to replace someone?" rule="Rule TEAM-05">
        Contact Tyndall with the reason. The new party signs a conflict declaration, a handover fee applies, and work done so far stays valid.
      </Note>
    </>
  );
}
