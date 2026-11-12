import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/client";
import { PublicShell } from "@/components/public-shell";
import { Card, Facts, Input, Label, Mono, Pill, Table, Td, Textarea } from "@/components/ui";
import { db } from "@/lib/db";
import { date, num } from "@/lib/format";
import { shortHash, shortTx } from "@/lib/hash";
import { stageInfo } from "@/lib/stages";
import { requestPurchase } from "../actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const p = await db.project.findUnique({
    where: { code },
    include: { methodology: true, org: true, vvb: true, auditor: true, blocks: true, issuances: { where: { status: "ISSUED" }, orderBy: { approvedAt: "desc" } }, retirements: true, pilot: true, _count: { select: { devices: true } } },
  });
  if (!p || !p.listed) notFound();
  const available = p.blocks.filter((b) => b.orgId === p.orgId).reduce((a, b) => a + b.quantity, 0);
  const retired = p.retirements.reduce((a, r) => a + r.quantity, 0);
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10">
        <Link href="/marketplace" className="text-[13px] font-semibold text-brand-text hover:underline">
          ← All listed projects
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <Mono className="text-faint">{p.code}</Mono>
              <Pill tone={stageInfo(p.stage).tone}>{stageInfo(p.stage).short}</Pill>
            </div>
            <h1 className="mt-2 font-display text-[36px] font-semibold tracking-[-0.035em] text-ink">{p.name}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.about}</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Expected / year", num(p.expectedPerYear ?? 0) + " t"],
                ["Available now", num(available) + " t"],
                ["Retired", num(retired) + " t"],
                ["Metered devices", num(p._count.devices)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="font-display text-[22px] font-semibold text-ink">{v}</div>
                  <div className="text-[12px] text-muted">{k}</div>
                </div>
              ))}
            </div>
            <Card title="Project">
              <Facts
                rows={[
                  ["Developer", p.org.name],
                  ["Methodology", `${p.methodology.code} ${p.methodology.version} · ${p.methodology.name}`],
                  ["Location", `${p.location}, ${p.country}`],
                  ["Scale", `${num(p.units)} ${p.unitType.toLowerCase()}`],
                  ["Instrument", p.instrument],
                  ["Pilot (1%)", p.pilot ? `${p.pilot.units} units · validated ${date(p.pilot.validatedAt)}` : "—"],
                  ["VVB", p.vvb?.name ?? "—"],
                  ["Lifetime auditor", p.auditor?.name ?? "—"],
                  ["PDD hash", p.pddHash ? <Mono key="h">{shortHash(p.pddHash)}</Mono> : "—"],
                ]}
              />
            </Card>
            <Card title="Issuance history" pad={false}>
              <Table cols={["Request", "Period", "Quantity", "Approved", "Token mint tx (sample)"]} empty="No credits issued yet.">
                {p.issuances.map((i) => (
                  <tr key={i.id}>
                    <Td mono>{i.code}</Td>
                    <Td>{i.period}</Td>
                    <Td>{num(i.quantity)} t</Td>
                    <Td>{date(i.approvedAt)}</Td>
                    <Td mono>{i.tokenTx ? shortTx(i.tokenTx) : "—"}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
          </div>
          <Card title="Request to buy" meta="Sent to the developer and recorded by Tyndall.">
            <ActionForm action={requestPurchase} className="flex flex-col gap-4" resetOnOk>
              <input type="hidden" name="code" value={p.code} />
              <Label label="Your name">
                <Input name="buyerName" required />
              </Label>
              <Label label="Organisation">
                <Input name="buyerOrg" required />
              </Label>
              <Label label="Email">
                <Input name="email" type="email" required />
              </Label>
              <Label label="Quantity (tCO₂e)">
                <Input name="quantity" required mono placeholder="1,000" />
              </Label>
              <Label label="Message">
                <Textarea name="message" rows={3} placeholder="Delivery schedule, vintage, claim period…" />
              </Label>
              <Submit size="lg">Send request</Submit>
              <p className="text-[12px] leading-relaxed text-muted">A purchase produces a receipt, not a certificate. Credits count toward a claim only when they are retired.</p>
            </ActionForm>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
