import { Card, Note, PageHeader, Pill, Table, Td } from "@/components/ui";
import { setPurchaseStatus } from "@/app/developer/actions";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";

export const metadata = { title: "Buyer requests" };

const TONE = { NEW: ["warn", "New"], IN_DISCUSSION: ["info", "In discussion"], CLOSED: ["neutral", "Closed"] } as const;

export default async function RequestsPage() {
  const u = await requireDeveloper();
  const reqs = await db.purchaseRequest.findMany({ where: { project: { orgId: u.orgId } }, include: { project: true }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Buyer requests" sub="Purchase requests from the public marketplace for your listed projects. Reply to the buyer directly; Tyndall records every transfer." />
      <Card pad={false}>
        <Table cols={["Request", "Buyer", "Project", "Qty", "Message", "Received", "Status", ""]} minWidth={1100} empty="No requests yet. Listed projects appear on the public marketplace.">
          {reqs.map((r) => {
            const [tone, label] = TONE[r.status as keyof typeof TONE];
            return (
              <tr key={r.id}>
                <Td mono>{r.code}</Td>
                <Td>
                  <div className="font-semibold text-ink">{r.buyerOrg}</div>
                  <a href={`mailto:${r.email}`} className="text-[12px] text-brand-text hover:underline">
                    {r.buyerName} · {r.email}
                  </a>
                </Td>
                <Td className="whitespace-nowrap">{r.project.name}</Td>
                <Td className="whitespace-nowrap font-semibold">{num(r.quantity)} t</Td>
                <Td className="max-w-[260px] text-muted">{r.message}</Td>
                <Td className="whitespace-nowrap text-muted">{date(r.createdAt)}</Td>
                <Td>
                  <Pill tone={tone}>{label}</Pill>
                </Td>
                <Td>
                  <form action={setPurchaseStatus} className="flex gap-1.5">
                    <input type="hidden" name="request" value={r.code} />
                    {r.status !== "IN_DISCUSSION" ? (
                      <button name="status" value="IN_DISCUSSION" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold hover:bg-surface-2">
                        In discussion
                      </button>
                    ) : null}
                    {r.status !== "CLOSED" ? (
                      <button name="status" value="CLOSED" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold hover:bg-surface-2">
                        Close
                      </button>
                    ) : null}
                  </form>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Note tone="info" title="A purchase produces a receipt, not a certificate." rule="Rule ACC-03">Credits count toward a buyer&apos;s claim only when they are retired.</Note>
    </>
  );
}
