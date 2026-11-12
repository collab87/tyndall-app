import { Card, Note, PageHeader, Stat, Stats } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { naira } from "@/lib/format";
import { InvoiceTable } from "./invoice-table";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const u = await requireDeveloper();
  const all = await db.invoice.findMany({ where: { project: { orgId: u.orgId } }, include: { project: true }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] });
  const sum = (l: typeof all) => l.reduce((a, i) => a + i.amount + i.vat, 0);
  const due = all.filter((i) => i.status === "DUE");
  const rows = all.map((i) => ({ id: i.id, code: i.code, project: i.project.name, title: i.title, payee: i.payee, total: i.amount + i.vat, due: i.status === "DUE", category: i.category, paidAt: i.paidAt?.toISOString() ?? null }));
  const canPay = ["DEV_ADMIN", "DEV_FINANCE"].includes(u.role);
  return (
    <>
      <PageHeader title="Payments" sub="Two kinds of fee. Project fees go to Tyndall: registration, then the programme fee in three stages (30% initiation, 50% scale-up, 20% issuance). VVB and auditor fees are paid through Tyndall to the parties." />
      <Stats>
        <Stat label="Due now" value={naira(sum(due))} note={`${due.length} invoice${due.length === 1 ? "" : "s"}`} tone={due.length ? "warn" : "ok"} />
        <Stat label="Project fees paid" value={naira(sum(all.filter((i) => i.category === "PROJECT" && i.status === "PAID")))} note="to Tyndall" tone="brand" />
        <Stat label="VVB & auditor fees paid" value={naira(sum(all.filter((i) => i.category === "TEAM" && i.status === "PAID")))} note="through Tyndall" tone="tech" />
        <Stat label="Invoices" value={all.length} note="all projects" tone="neutral" />
      </Stats>
      <Card title="Invoices" meta={canPay ? "Select the invoices to pay" : "Only an organisation admin or finance officer can pay"} pad={false}>
        <InvoiceTable rows={rows} canPay={canPay} />
      </Card>
      <Note tone="info" title="Tyndall holds 20% of each auditor fee until the project's final validation and releases it if no gaps are found." rule="Rules FEE-01 · PAY-04">
        Fees never depend on credit volume or price.
      </Note>
    </>
  );
}
