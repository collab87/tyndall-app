import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/client";
import { Card, Facts, Grid, Input, Label, Note, PageHeader, Pill, Table, Td } from "@/components/ui";
import { reviewAuditor } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUD_TONE } from "@/lib/device";
import { date } from "@/lib/format";
import { stageInfo } from "@/lib/stages";

export default async function AuditorDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireConsole("auditors");
  const a = await db.auditor.findUnique({ where: { code }, include: { vvbProjects: true, auditProjects: true, user: true } });
  if (!a) notFound();
  const expired = a.accreditationExpiry && a.accreditationExpiry < new Date();
  const expSoon = a.accreditationExpiry && a.accreditationExpiry.getTime() - Date.now() < 90 * 86400_000;
  const engagements = [...a.vvbProjects.map((p) => ({ p, role: "VVB" })), ...a.auditProjects.map((p) => ({ p, role: "Auditor" }))];
  return (
    <>
      <PageHeader back={{ href: "/console/auditors", label: "VVBs & auditors" }} eyebrow={`${a.code} · ${a.kind === "FIRM" ? "Firm" : "Individual"} · ${a.roles.replace(",", " + ")}`} title={a.name} sub={`${a.city}, ${a.country} · ${a.years} years · applied ${date(a.createdAt)}`} status={{ label: a.status.toLowerCase(), tone: AUD_TONE[a.status] }} />
      <Grid>
        <div className="flex flex-col gap-4">
          <Card title="Application">
            <Facts
              rows={[
                ["Type", a.kind === "FIRM" ? `Firm · ${a.teamSize ?? "—"} verifiers` : "Individual"],
                ["Contact", a.contactName ?? a.name],
                ["Email", a.email],
                ["Roles", a.roles.replace(",", " + ")],
                ["Methodologies", a.methodologies.replace(/,/g, " · ")],
                ["Accreditation", a.accreditation],
                ["Expires", expired ? <Pill key="e" tone="bad">Expired {date(a.accreditationExpiry)}</Pill> : expSoon ? <Pill key="e" tone="warn">{date(a.accreditationExpiry)}</Pill> : date(a.accreditationExpiry)],
                ["Languages", a.languages],
                ["Declared consulting", a.consultsFor ?? "None"],
                ["Sign-in account", a.user ? a.user.email : "None"],
              ]}
            />
          </Card>
          {a.bio ? (
            <Card title="About">
              <p className="text-[13.5px] leading-relaxed text-text">{a.bio}</p>
            </Card>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          {a.consultsFor ? <Note tone="warn" title="Declared consulting work" rule="Rule TEAM-02">This party can never be the VVB on {a.consultsFor}. The platform blocks it automatically.</Note> : null}
          {a.accreditation.toLowerCase().includes("training only") ? <Note tone="bad" title="Training is not accreditation." rule="Rule AUD-03">A training record cannot substitute for an ISO 14065 or ISO 14064-3 certificate.</Note> : null}
          {a.reviewNote ? <Note tone="info" title={`Review note · ${a.reviewedBy ?? ""} · ${date(a.reviewedAt)}`}>{a.reviewNote}</Note> : null}
          <Card title="Decision" meta="Recorded in the audit trail and shared with the applicant.">
            <ActionForm action={reviewAuditor} className="flex flex-col gap-3">
              <input type="hidden" name="code" value={a.code} />
              <Label label="Note" help="Required for rejection or suspension.">
                <Input name="note" />
              </Label>
              <div className="flex flex-wrap gap-2">
                {a.status !== "APPROVED" ? (
                  <Submit name="status" value="APPROVED" disabled={!!expired}>
                    Approve
                  </Submit>
                ) : null}
                {a.status === "PENDING" ? (
                  <Submit name="status" value="REJECTED" variant="secondary">
                    Reject
                  </Submit>
                ) : null}
                {a.status === "APPROVED" ? (
                  <Submit name="status" value="SUSPENDED" variant="danger">
                    Suspend
                  </Submit>
                ) : null}
              </div>
            </ActionForm>
          </Card>
          <Card title="Engagements" pad={false}>
            <Table cols={["Project", "Role", "Stage"]} empty="No engagements yet.">
              {engagements.map(({ p, role }) => (
                <tr key={p.id + role}>
                  <Td>{p.name}</Td>
                  <Td>{role}</Td>
                  <Td>
                    <Pill tone={stageInfo(p.stage).tone}>{stageInfo(p.stage).short}</Pill>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </Grid>
    </>
  );
}
