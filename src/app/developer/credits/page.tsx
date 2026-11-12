import Link from "next/link";
import { serialOf } from "@/components/certificate";
import { Card, Grid, Note, PageHeader, Pill, Stat, Stats, Table, Td } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";
import { shortTx } from "@/lib/hash";
import { RetireForm } from "./retire-form";

export const metadata = { title: "Credits & retirement" };

export default async function CreditsPage() {
  const u = await requireDeveloper();
  const [blocks, certs, expected] = await Promise.all([
    db.creditBlock.findMany({ where: { orgId: u.orgId, quantity: { gt: 0 } }, include: { project: { include: { methodology: true } }, issuance: true }, orderBy: { createdAt: "asc" } }),
    db.retirement.findMany({ where: { orgId: u.orgId }, include: { project: true }, orderBy: { createdAt: "desc" } }),
    db.project.aggregate({ _sum: { expectedPerYear: true }, where: { orgId: u.orgId, stage: { notIn: ["ACTIVE", "REJECTED"] } } }),
  ]);
  const held = blocks.reduce((a, b) => a + b.quantity, 0);
  const wallet = "0x" + u.org.code.replace(/\W/g, "").toLowerCase().padEnd(8, "0").slice(0, 8) + "…c03e";
  return (
    <>
      <PageHeader title="Credits & retirement" sub="Each issued credit is a registry serial. As a sample feature, each tonne is also shown as a token: minted at issuance, burned at retirement." />
      <Stats>
        <Stat label="Held" value={num(held) + " t"} note={`sample tokens · wallet ${wallet}`} tone="seal" />
        <Stat label="Retired by you" value={num(certs.reduce((a, c) => a + c.quantity, 0)) + " t"} note={`${certs.length} certificate${certs.length === 1 ? "" : "s"}`} tone="ok" />
        <Stat label="Expected, not yet issued" value={num(expected._sum.expectedPerYear ?? 0) + " t"} note="per year, across pipeline projects" tone="neutral" />
        <Stat label="Blocks" value={blocks.length} note="serial ranges in your account" tone="brand" />
      </Stats>
      <Grid>
        <Card title="Holdings" pad={false}>
          <Table cols={["Block", "Project", "Vintage", "Serial range", "Qty"]} empty="No credits held yet. Credits arrive after Tyndall issues a verified period.">
            {blocks.map((b) => (
              <tr key={b.id}>
                <Td mono>{b.code}</Td>
                <Td>{b.project.name}</Td>
                <Td mono>{b.vintage}</Td>
                <Td mono className="whitespace-nowrap text-[11.5px]">
                  …{String(b.serialStart).padStart(6, "0")} → {String(b.serialStart + b.quantity - 1).padStart(6, "0")}
                </Td>
                <Td className="whitespace-nowrap font-semibold">{num(b.quantity)} t</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Retire credits" meta="Retirement is the only act that makes a credit count. It cannot be undone.">
          {blocks.length ? <RetireForm blocks={blocks.map((b) => ({ code: b.code, label: `${b.code} · ${b.project.name} · ${b.vintage} · ${num(b.quantity)} t`, qty: b.quantity }))} org={u.org.name} canRetire={u.role === "DEV_ADMIN"} /> : <Note tone="info" title="Nothing to retire yet." />}
        </Card>
      </Grid>
      <Card title="Certificates" pad={false}>
        <Table cols={["Certificate", "Beneficiary", "Project", "Serials", "Qty", "Retired", "Burn tx (sample)"]} minWidth={980} empty="No retirements yet.">
          {certs.map((c) => (
            <tr key={c.id}>
              <Td mono>
                <Link href={`/verify/${c.code}`} className="text-brand-text hover:underline">
                  {c.code}
                </Link>
              </Td>
              <Td>{c.beneficiary}</Td>
              <Td>{c.project.name}</Td>
              <Td mono className="whitespace-nowrap text-[11.5px]">
                {String(c.serialStart).padStart(6, "0")} → {String(c.serialEnd).padStart(6, "0")}
              </Td>
              <Td className="font-semibold">{num(c.quantity)} t</Td>
              <Td className="whitespace-nowrap">{date(c.createdAt)}</Td>
              <Td mono>
                <Pill tone="seal">{shortTx(c.burnTx)}</Pill>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      {blocks[0] ? <p className="font-mono text-[11.5px] text-faint">Serial format: {serialOf(blocks[0].project, blocks[0].vintage, blocks[0].serialStart)}</p> : null}
    </>
  );
}
