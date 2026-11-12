import { ActionForm, ConfirmAction, Submit } from "@/components/client";
import { Card, Facts, Grid, Input, Label, Mono, Note, PageHeader, Pill, Select, Stat, Stats, Table, Td } from "@/components/ui";
import { decideIssuance, prepareIssuance } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";
import { shortTx } from "@/lib/hash";

export const metadata = { title: "Issuance" };

export default async function Issuance() {
  const u = await requireConsole("issuance");
  const [reqs, active, minted, burned] = await Promise.all([
    db.issuanceRequest.findMany({ include: { project: { include: { invoices: true, findings: true, org: true } } }, orderBy: [{ status: "asc" }, { preparedAt: "desc" }] }),
    db.project.findMany({ where: { stage: "ACTIVE" }, select: { code: true, name: true } }),
    db.issuanceRequest.aggregate({ _sum: { quantity: true }, where: { status: "ISSUED" } }),
    db.retirement.aggregate({ _sum: { quantity: true } }),
  ]);
  const pending = reqs.filter((r) => r.status === "PENDING");
  const canPrepare = ["SUPER_ADMIN", "CARBON_MANAGER"].includes(u.role);
  const canApprove = ["SUPER_ADMIN", "REGISTRY_ADMIN"].includes(u.role);
  return (
    <>
      <PageHeader title="Issuance" sub="Tyndall issues, and only Tyndall. A Carbon Manager prepares a request from an accepted verification; a Registry Admin approves it. Nobody can do both for the same request." />
      <Stats>
        <Stat label="Awaiting approval" value={pending.length} note="four-eyes queue" tone="warn" />
        <Stat label="Issued" value={num(minted._sum.quantity ?? 0) + " t"} note="sample tokens minted 1:1" tone="seal" />
        <Stat label="Burned at retirement" value={num(burned._sum.quantity ?? 0) + " t"} note="sample tokens" tone="ok" />
        <Stat label="Projects issuing" value={active.length} tone="brand" />
      </Stats>
      {pending.map((r) => {
        const fee = r.project.invoices.find((i) => i.kind === "ISSUE");
        const openCar = r.project.findings.filter((f) => f.type === "CAR" && f.status !== "CLOSED");
        const self = r.preparedById === u.id;
        return (
          <Card key={r.id} title={`${r.code} · ${r.project.name}`} meta={`${r.period} · prepared by ${r.preparedBy} on ${date(r.preparedAt)}`} action={<Pill tone="warn">Awaiting approval</Pill>}>
            <Grid>
              <Facts
                rows={[
                  ["Quantity", <b key="q">{num(r.quantity)} tCO₂e</b>],
                  ["Vintage", r.vintage],
                  ["Inferred share", `${r.inferredPct.toFixed(1)}% · within the 5% cap`],
                  ["Issuance fee", fee ? (fee.status === "PAID" ? <Pill key="f" tone="ok">Paid</Pill> : <Pill key="f" tone="warn">Due from developer</Pill>) : "—"],
                  ["Evidence", r.note ?? "—"],
                  ["Compliance", "Host country authorisation · pending"],
                ]}
              />
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-line p-4">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">Preparer</div>
                    <div className="mt-1 font-semibold text-ink">{r.preparedBy}</div>
                    <div className="text-[12px] text-muted">Prepared {date(r.preparedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-line-strong p-4">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">Approver</div>
                    <div className="mt-1 font-semibold text-muted">Waiting</div>
                    <div className="text-[12px] text-muted">Registry Admin or Super Admin</div>
                  </div>
                </div>
                {openCar.length ? <Note tone="warn" title={`Open corrective action: ${openCar.map((f) => f.code).join(", ")}`}>Check the withheld tonnage is excluded from this request before approving.</Note> : null}
                {self ? (
                  <Note tone="bad" title="You prepared this request, so you cannot approve it." rule="Rule SEP-04 · four eyes">Ask a Registry Admin to approve.</Note>
                ) : !canApprove ? (
                  <Note tone="info" title={`As ${u.roleLabel} you prepare issuance but cannot approve it.`} rule="Rule SEP-04" />
                ) : null}
                {canApprove && !self ? (
                  <div className="flex gap-2">
                    <ConfirmAction action={decideIssuance} fields={{ code: r.code, decision: "approve" }} trigger={`Approve · issue ${num(r.quantity)} t`} title={`Issue ${num(r.quantity)} tCO₂e?`} body={`Serials are allocated for ${r.project.name}, ${num(r.quantity)} sample tokens are minted, and the credits land in ${r.project.org.name}'s account. Only a four-eyes cancellation can reverse this.`} ack="I checked the verification report, quality statement and inference disclosure." confirmLabel="Approve and issue" />
                    <ConfirmAction action={decideIssuance} fields={{ code: r.code, decision: "return" }} trigger="Return" triggerVariant="secondary" variant="secondary" title="Return to the preparer?" confirmLabel="Return request" />
                  </div>
                ) : null}
              </div>
            </Grid>
          </Card>
        );
      })}
      <Grid>
        {canPrepare ? (
          <Card title="Prepare an issuance request" meta="From an accepted verification. A period can be issued once.">
            {active.length ? (
              <ActionForm action={prepareIssuance} className="grid gap-4 sm:grid-cols-2" resetOnOk>
                <Label label="Project" className="sm:col-span-2">
                  <Select name="code" options={active.map((p) => [p.code, p.name] as [string, string])} />
                </Label>
                <Label label="Monitoring period">
                  <Input name="period" placeholder="Sep 2026" required />
                </Label>
                <Label label="Vintage">
                  <Input name="vintage" defaultValue="2026" mono />
                </Label>
                <Label label="Verified quantity (t)">
                  <Input name="quantity" mono required placeholder="1,150" />
                </Label>
                <Label label="Inferred share (%)" help="Cohort inference, capped at 5%.">
                  <Input name="inferred" mono defaultValue="0.0" />
                </Label>
                <Label label="Evidence" className="sm:col-span-2">
                  <Input name="note" placeholder="Verification report and quality statement references" />
                </Label>
                <div className="sm:col-span-2">
                  <Submit>Prepare request</Submit>
                </div>
              </ActionForm>
            ) : (
              <p className="text-[13px] text-muted">No project is in scale-up yet.</p>
            )}
          </Card>
        ) : null}
        <Note tone="info" title="Tokens are a sample feature." rule="Rule TOK-00 · demo">
          Each issued tonne is shown as one token minted to the developer&apos;s wallet and burned on retirement. The registry serial is the record of truth.
        </Note>
      </Grid>
      <Card title="History" pad={false}>
        <Table cols={["Request", "Project", "Period", "Qty", "Serials", "Prepared", "Approved", "Mint tx (sample)", "Status"]} minWidth={1200}>
          {reqs
            .filter((r) => r.status !== "PENDING")
            .map((r) => (
              <tr key={r.id}>
                <Td mono>{r.code}</Td>
                <Td className="whitespace-nowrap">{r.project.name}</Td>
                <Td>{r.period}</Td>
                <Td className="font-semibold">{num(r.quantity)} t</Td>
                <Td mono className="whitespace-nowrap text-[11.5px]">{r.serialFrom ? `${r.serialFrom} → ${r.serialTo}` : "—"}</Td>
                <Td className="whitespace-nowrap">{r.preparedBy}</Td>
                <Td className="whitespace-nowrap">{r.approvedBy ?? "—"}</Td>
                <Td>{r.tokenTx ? <Mono>{shortTx(r.tokenTx)}</Mono> : "—"}</Td>
                <Td>{r.status === "ISSUED" ? <Pill tone="ok">Issued</Pill> : <Pill tone="neutral">Returned</Pill>}</Td>
              </tr>
            ))}
        </Table>
      </Card>
    </>
  );
}
