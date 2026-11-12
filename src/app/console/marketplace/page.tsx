import Link from "next/link";
import { Card, Note, PageHeader, Pill, Table, Td } from "@/components/ui";
import { setRequestStatus } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";
import { stageInfo } from "@/lib/stages";

export const metadata = { title: "Marketplace" };

const TONE = { NEW: ["warn", "New"], IN_DISCUSSION: ["info", "In discussion"], CLOSED: ["neutral", "Closed"] } as const;

export default async function ConsoleMarketplace() {
  await requireConsole("marketplace");
  const [listed, reqs] = await Promise.all([
    db.project.findMany({ where: { listed: true }, include: { org: true, methodology: true, blocks: true, _count: { select: { purchases: true } } } }),
    db.purchaseRequest.findMany({ include: { project: { include: { org: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <PageHeader
        title="Marketplace"
        sub="Listed projects and buyer requests. Tyndall records requests and transfers; it does not run an order book or set prices."
        actions={
          <Link href="/marketplace" className="text-[13px] font-semibold text-brand-text hover:underline">
            Open public marketplace →
          </Link>
        }
      />
      <Card title="Listed projects" pad={false}>
        <Table cols={["Project", "Developer", "Methodology", "Expected / yr", "Available", "Requests", "Stage"]} minWidth={960}>
          {listed.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/console/projects/${p.code}`} className="font-semibold text-ink hover:text-brand-text">
                  {p.name}
                </Link>
              </Td>
              <Td>{p.org.name}</Td>
              <Td mono>{p.methodology.code}</Td>
              <Td>{num(p.expectedPerYear ?? 0)} t</Td>
              <Td>{num(p.blocks.filter((b) => b.orgId === p.orgId).reduce((a, b) => a + b.quantity, 0))} t</Td>
              <Td>{p._count.purchases}</Td>
              <Td>
                <Pill tone={stageInfo(p.stage).tone}>{stageInfo(p.stage).short}</Pill>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Purchase requests" pad={false}>
        <Table cols={["Request", "Buyer", "Project", "Qty", "Received", "Status", ""]} minWidth={1000}>
          {reqs.map((r) => {
            const [tone, label] = TONE[r.status as keyof typeof TONE];
            return (
              <tr key={r.id}>
                <Td mono>{r.code}</Td>
                <Td>
                  <div className="font-semibold text-ink">{r.buyerOrg}</div>
                  <div className="text-[12px] text-muted">
                    {r.buyerName} · {r.email}
                  </div>
                </Td>
                <Td>
                  {r.project.name}
                  <div className="text-[12px] text-muted">{r.project.org.name}</div>
                </Td>
                <Td className="font-semibold">{num(r.quantity)} t</Td>
                <Td className="whitespace-nowrap">{date(r.createdAt)}</Td>
                <Td>
                  <Pill tone={tone}>{label}</Pill>
                </Td>
                <Td>
                  {r.status !== "CLOSED" ? (
                    <form action={setRequestStatus}>
                      <input type="hidden" name="request" value={r.code} />
                      <button name="status" value="CLOSED" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold hover:bg-surface-2">
                        Close
                      </button>
                    </form>
                  ) : null}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Note tone="info" title="Tyndall does not operate a market." rule="Rule ACC-01">
        No exchange, order book or price discovery. Fees are flat per transaction and never read the credit price.
      </Note>
    </>
  );
}
