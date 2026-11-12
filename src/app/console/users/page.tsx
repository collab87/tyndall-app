import { ActionForm, Submit } from "@/components/client";
import { Avatar, Card, Grid, Note, PageHeader, Pill, Select, Table, Td } from "@/components/ui";
import { grantRole } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ago } from "@/lib/format";
import { CONSOLE_SCREENS, ROLE_LABEL, TYNDALL_ROLES, type Role } from "@/lib/roles";
import { SEP_RULES } from "@/lib/rules";

export const metadata = { title: "Roles & permissions" };

export default async function Users() {
  const u = await requireConsole("users");
  const staff = await db.user.findMany({ where: { role: { in: TYNDALL_ROLES } }, orderBy: { createdAt: "asc" } });
  const opts = TYNDALL_ROLES.map((r) => [r, ROLE_LABEL[r]] as [string, string]);
  return (
    <>
      <PageHeader title="Roles & permissions" sub="The separations that make the programme credible live here. No one can grant themselves a role, and the preparer of an issuance can never approve it." />
      <Card title="Tyndall staff" pad={false}>
        <Table cols={["Person", "Email", "Role", "Last sign-in", "Change role"]} minWidth={900}>
          {staff.map((s) => (
            <tr key={s.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <span className="font-semibold text-ink">{s.name}</span>
                  {s.id === u.id ? <Pill tone="brand">You</Pill> : null}
                </div>
              </Td>
              <Td mono>{s.email}</Td>
              <Td>{ROLE_LABEL[s.role as Role]}</Td>
              <Td className="text-muted">{ago(s.lastLoginAt)}</Td>
              <Td>
                {s.id === u.id ? (
                  <span className="text-[12px] text-muted">Ask another Super Admin (SEP-00)</span>
                ) : (
                  <ActionForm action={grantRole} className="flex gap-2">
                    <input type="hidden" name="user" value={s.id} />
                    <Select name="role" defaultValue={s.role} options={opts} className="h-9 w-48 text-[12.5px]" />
                    <Submit size="sm" variant="secondary">
                      Save
                    </Submit>
                  </ActionForm>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Grid>
        <Card title="Separation of duties" pad={false}>
          <ul className="divide-y divide-line">
            {SEP_RULES.map(([id, t]) => (
              <li key={id} className="flex gap-4 px-5 py-3">
                <span className="w-16 shrink-0 font-mono text-[12px] font-semibold text-brand-text">{id}</span>
                <span className="text-[13px] text-text">{t}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Screen access by role" pad={false}>
          <Table cols={["Screen", ...TYNDALL_ROLES.map((r) => ROLE_LABEL[r].replace("Data Quality Analyst", "DQ analyst"))]}>
            {Object.entries(CONSOLE_SCREENS).map(([sc, roles]) => (
              <tr key={sc}>
                <Td className="font-semibold capitalize text-ink">{sc}</Td>
                {TYNDALL_ROLES.map((r) => (
                  <Td key={r} className="text-center">
                    {roles.includes(r) ? <span className="text-ok">●</span> : <span className="text-faint">—</span>}
                  </Td>
                ))}
              </tr>
            ))}
          </Table>
        </Card>
      </Grid>
      <Note tone="bad" title="Some behaviour has no setting on purpose." rule="Rule PLT-00">
        Self-interpolation of gaps and price-linked fees have no code path, so there is nothing to switch on. The audit trail has no edit or delete path for any role.
      </Note>
    </>
  );
}
