import Link from "next/link";
import { Card, PageHeader, Pill, Stat, Stats, Table, Td } from "@/components/ui";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";
import { shortTx } from "@/lib/hash";

export const metadata = { title: "Retirements" };

export default async function Retirements() {
  await requireConsole("retirements");
  const [rows, accounts] = await Promise.all([
    db.retirement.findMany({ include: { project: true, org: true }, orderBy: { createdAt: "desc" } }),
    db.creditBlock.groupBy({ by: ["orgId"], _sum: { quantity: true } }),
  ]);
  const orgs = await db.organisation.findMany({ where: { id: { in: accounts.map((a) => a.orgId) } } });
  return (
    <>
      <PageHeader title="Retirements" sub="Retirement is the only act that makes a credit count, and it cannot be undone. Each one produces a public certificate anyone can verify without an account." />
      <Stats>
        <Stat label="Retired" value={num(rows.reduce((a, r) => a + r.quantity, 0)) + " t"} note={`${rows.length} certificates`} tone="ok" />
        <Stat label="Held across accounts" value={num(accounts.reduce((a, x) => a + (x._sum.quantity ?? 0), 0)) + " t"} note={`${accounts.length} accounts`} tone="seal" />
        <Stat label="Beneficiaries" value={new Set(rows.map((r) => r.beneficiary)).size} tone="brand" />
        <Stat label="Double retirements" value="0" note="a retired serial is refused" tone="neutral" />
      </Stats>
      <Card title="Certificates" pad={false}>
        <Table cols={["Certificate", "Beneficiary", "Account", "Project", "Qty", "Claim", "Retired", "Burn tx (sample)"]} minWidth={1100}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td mono>
                <Link href={`/verify/${r.code}`} className="text-brand-text hover:underline">
                  {r.code}
                </Link>
              </Td>
              <Td className="font-semibold text-ink">{r.beneficiary}</Td>
              <Td>{r.org.name}</Td>
              <Td>{r.project.name}</Td>
              <Td className="font-semibold">{num(r.quantity)} t</Td>
              <Td className="text-muted">
                {r.reason} · {r.claimPeriod}
              </Td>
              <Td className="whitespace-nowrap">{date(r.createdAt)}</Td>
              <Td>
                <Pill tone="seal">{shortTx(r.burnTx)}</Pill>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Account holdings" pad={false}>
        <Table cols={["Account holder", "Type", "Holding"]}>
          {accounts.map((a) => {
            const o = orgs.find((x) => x.id === a.orgId);
            return (
              <tr key={a.orgId}>
                <Td className="font-semibold text-ink">{o?.name}</Td>
                <Td className="capitalize">{o?.type.toLowerCase()}</Td>
                <Td>{num(a._sum.quantity ?? 0)} t</Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
