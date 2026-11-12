import Link from "next/link";
import { ActionForm, Submit } from "@/components/client";
import { Card, Grid, Input, Label, Note, Pill, Stat, Stats, Table, Td, Textarea } from "@/components/ui";
import { registerDevices } from "@/app/developer/actions";
import { db } from "@/lib/db";
import { ago, num } from "@/lib/format";
import { deviceTone } from "@/lib/device";
import { loadProject } from "../data";

export default async function DevicesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { p } = await loadProject(code);
  const devices = await db.device.findMany({ where: { projectId: p.id }, orderBy: [{ isPilot: "desc" }, { createdAt: "asc" }] });
  const online = devices.filter((d) => d.status === "ONLINE").length;
  const attention = devices.filter((d) => ["OFFLINE", "FAULT", "CALIBRATION"].includes(d.status)).length;
  const canRegister = p.stage === "ACTIVE" || p.stage === "SCALE_APPROVED";
  return (
    <>
      <Stats>
        <Stat label="Meters paired" value={num(devices.length)} note={`of ${num(p.units)} planned ${p.unitType.toLowerCase()}`} tone="tech" />
        <Stat label="Online" value={num(online)} note="reported in the last 72 h" tone="ok" />
        <Stat label="Needs attention" value={num(attention)} note="offline, fault or calibration" tone={attention ? "warn" : "ok"} />
        <Stat label="Pilot units" value={num(devices.filter((d) => d.isPilot).length)} note="1% of the project" tone="brand" />
      </Stats>
      <Grid>
        <Card title="All devices" pad={false} className="lg:col-span-2">
          <Table cols={["Meter IMEI", "Your serial", "Equipment", "Location", "Last reading", "Status"]} minWidth={900} empty="No devices yet. Pilot units are registered on the Pilot tab.">
            {devices.map((d) => {
              const [tone, label] = deviceTone(d.status);
              return (
                <tr key={d.id} className="hover:bg-surface-2/60">
                  <Td mono>
                    <Link href={`/developer/devices/${d.imei}`} className="text-brand-text hover:underline">
                      {d.imei}
                    </Link>
                  </Td>
                  <Td mono>{d.serial}</Td>
                  <Td>
                    {d.model} {d.isPilot ? <Pill tone="tech" className="ml-1">Pilot</Pill> : null}
                  </Td>
                  <Td className="text-muted">{d.location}</Td>
                  <Td className="text-muted">{ago(d.lastSeenAt)}</Td>
                  <Td>
                    <Pill tone={tone}>{label}</Pill>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </Grid>
      {canRegister ? (
        <Grid>
          <Card title="Register equipment serials" meta="Tyndall ships IoT meters. You register each equipment serial to pair it with a meter.">
            <ActionForm action={registerDevices} className="flex flex-col gap-4" resetOnOk>
              <input type="hidden" name="code" value={p.code} />
              <Label label="Equipment model">
                <Input name="model" defaultValue={devices[0]?.model ?? ""} />
              </Label>
              <Label label="Site">
                <Input name="location" placeholder="LGA or route" />
              </Label>
              <Label label="Serial numbers" help="One per line or comma-separated.">
                <Textarea name="serials" rows={4} className="font-mono" />
              </Label>
              <div>
                <Submit>Pair with meters</Submit>
              </div>
            </ActionForm>
          </Card>
          <Note tone="info" title="Installation is done in the field app.">Installers record GPS, photos, household consent and a signed test reading. The device then shows Online here.</Note>
        </Grid>
      ) : (
        <Note tone="info" title={p.stage === "PILOT" ? "During the pilot, register units on the Pilot tab." : "More devices are registered at scale-up."} />
      )}
    </>
  );
}
