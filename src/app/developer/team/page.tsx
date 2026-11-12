import { ActionForm, Submit } from "@/components/client";
import { Avatar, Card, Grid, Input, Label, Note, PageHeader, Pill, Select, Table, Td } from "@/components/ui";
import { changeMemberRole, inviteMember } from "@/app/developer/actions";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { ago } from "@/lib/format";
import { DEV_CAN, DEV_ROLES, ROLE_LABEL, type Role } from "@/lib/roles";

export const metadata = { title: "Team members" };

const CAPS: [string, keyof typeof DEV_CAN][] = [
  ["Create projects, apply for scale-up", "createProject"],
  ["Edit the PDD", "editPdd"],
  ["Choose VVB & auditor", "chooseTeam"],
  ["Pay invoices", "pay"],
  ["Register devices", "devices"],
  ["Run the pilot", "pilot"],
  ["Respond to findings", "respond"],
  ["Retire credits", "retire"],
  ["Manage team", "manageTeam"],
];

export default async function TeamMembers() {
  const u = await requireDeveloper();
  const members = await db.user.findMany({ where: { orgId: u.orgId }, orderBy: { createdAt: "asc" } });
  const admin = u.role === "DEV_ADMIN";
  const roleOpts = DEV_ROLES.map((r) => [r, ROLE_LABEL[r]] as [string, string]);
  return (
    <>
      <PageHeader title="Team members" sub="Invite staff and consultants and give each a role. Every invite and role change is recorded in the audit log." />
      <Card pad={false}>
        <Table cols={["Person", "Email", "Role", "Last sign-in", "Status", admin ? "Change role" : ""]} minWidth={900}>
          {members.map((m) => (
            <tr key={m.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} />
                  <span className="font-semibold text-ink">{m.name}</span>
                  {m.id === u.id ? <Pill tone="brand">You</Pill> : null}
                </div>
              </Td>
              <Td mono>{m.email}</Td>
              <Td>{ROLE_LABEL[m.role as Role]}</Td>
              <Td className="text-muted">{ago(m.lastLoginAt)}</Td>
              <Td>{m.status === "ACTIVE" ? <Pill tone="ok">Active</Pill> : <Pill tone="info">Invited</Pill>}</Td>
              <Td>
                {admin && m.id !== u.id ? (
                  <ActionForm action={changeMemberRole} className="flex gap-2">
                    <input type="hidden" name="user" value={m.id} />
                    <Select name="role" defaultValue={m.role} options={roleOpts} className="h-9 w-48 text-[12.5px]" />
                    <Submit size="sm" variant="secondary">
                      Save
                    </Submit>
                  </ActionForm>
                ) : null}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Grid>
        {admin ? (
          <Card title="Invite a team member">
            <ActionForm action={inviteMember} className="flex flex-col gap-4" resetOnOk>
              <Label label="Full name">
                <Input name="name" required />
              </Label>
              <Label label="Work email">
                <Input name="email" type="email" required />
              </Label>
              <Label label="Role">
                <Select name="role" defaultValue="DEV_MEO" options={roleOpts} />
              </Label>
              <div>
                <Submit>Send invite</Submit>
              </div>
            </ActionForm>
          </Card>
        ) : (
          <Note tone="info" title="Only an organisation admin can invite people or change roles." />
        )}
        <Card title="Roles & permissions" pad={false}>
          <Table cols={["Capability", ...DEV_ROLES.map((r) => ROLE_LABEL[r].replace(" (external)", "").replace(" / data officer", ""))]} minWidth={720}>
            {CAPS.map(([label, k]) => (
              <tr key={k}>
                <Td className="font-semibold text-ink">{label}</Td>
                {DEV_ROLES.map((r) => (
                  <Td key={r} className="text-center">
                    {(DEV_CAN[k] as readonly string[]).includes(r) ? <span className="text-ok">●</span> : <span className="text-faint">—</span>}
                  </Td>
                ))}
              </tr>
            ))}
          </Table>
        </Card>
      </Grid>
    </>
  );
}
