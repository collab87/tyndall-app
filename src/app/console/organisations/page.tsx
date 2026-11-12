import { ActionForm, Submit } from "@/components/client";
import { Card, PageHeader, Pill, Table, Td } from "@/components/ui";
import { setOrgStatus } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { date } from "@/lib/format";

export const metadata = { title: "Organisations" };

export default async function Orgs() {
  await requireConsole("organisations");
  const orgs = await db.organisation.findMany({ where: { type: { not: "TYNDALL" } }, include: { _count: { select: { users: true, projects: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title="Organisations" sub="Developers and buyers. Business verification (KYB) happens once and is re-checked on a cycle. A suspended organisation keeps its history but cannot submit." />
      <Card pad={false}>
        <Table cols={["Organisation", "Type", "Registration", "Country", "Users", "Projects", "Joined", "KYB", ""]} minWidth={1100}>
          {orgs.map((o) => (
            <tr key={o.id}>
              <Td>
                <span className="font-semibold text-ink">{o.name}</span>
                <div className="font-mono text-[11.5px] text-faint">{o.code}</div>
              </Td>
              <Td className="capitalize">{o.type.toLowerCase()}</Td>
              <Td mono>{o.regNumber ?? "—"}</Td>
              <Td>{o.country}</Td>
              <Td>{o._count.users}</Td>
              <Td>{o._count.projects}</Td>
              <Td className="whitespace-nowrap">{date(o.createdAt)}</Td>
              <Td>{o.status === "VERIFIED" ? <Pill tone="ok">Verified</Pill> : o.status === "PENDING" ? <Pill tone="warn">In review</Pill> : <Pill tone="bad">Suspended</Pill>}</Td>
              <Td>
                <ActionForm action={setOrgStatus} className="flex gap-1.5">
                  <input type="hidden" name="code" value={o.code} />
                  {o.status !== "VERIFIED" ? (
                    <Submit size="sm" name="status" value="VERIFIED">
                      {o.status === "PENDING" ? "Approve KYB" : "Reinstate"}
                    </Submit>
                  ) : (
                    <Submit size="sm" variant="secondary" name="status" value="SUSPENDED">
                      Suspend
                    </Submit>
                  )}
                </ActionForm>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
