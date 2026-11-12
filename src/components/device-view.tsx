import { deviceTone } from "@/lib/device";
import { ago, date, dateTime, num } from "@/lib/format";
import { dailySeries, readings, unitFor } from "@/lib/telemetry";
import { DailyBars } from "./charts";
import { Card, Facts, Grid, Mono, PageHeader, Pill, Table, Td } from "./ui";

type D = { imei: string; serial: string; model: string; location: string; status: string; isPilot: boolean; firmware: string; completeness: number | null; signingKey: string; lastSeenAt: Date | null; commissionedAt: Date | null; createdAt: Date; project: { name: string; code: string; methodology: { code: string } } };

export function DeviceView({ d, back }: { d: D; back: { href: string; label: string } }) {
  const [tone, label] = deviceTone(d.status);
  const u = unitFor(d.project.methodology.code);
  const series = dailySeries(d.imei, d.project.methodology.code, d.status);
  const rs = d.status === "PAIRED" ? [] : readings(d.imei, d.project.methodology.code);
  return (
    <>
      <PageHeader back={back} eyebrow={`Meter ${d.imei} · ${d.project.name}`} title={`${d.model} · ${d.serial}`} sub={d.location} status={{ label, tone }} />
      <Grid>
        <Card title={`Daily ${u.label.toLowerCase()} · last 14 days (${u.unit})`} meta="Hatched days are gaps. A gap is never filled from the device's own history (rule DQ-02).">
          <DailyBars data={series.map((s) => ({ label: s.day.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), value: s.value, gap: s.gap }))} unit={u.unit} digits={u.digits} />
        </Card>
        <Card title="Identity">
          <Facts
            rows={[
              ["Meter IMEI", <Mono key="i">{d.imei}</Mono>],
              ["Equipment serial", <Mono key="s">{d.serial}</Mono>],
              ["Signing key", <Mono key="k">{d.signingKey}</Mono>],
              ["Firmware", d.firmware],
              ["Pilot unit", d.isPilot ? "Yes · 1% pilot" : "No"],
              ["Commissioned", date(d.commissionedAt)],
              ["Last reading", ago(d.lastSeenAt)],
              ["Completeness", d.completeness ? d.completeness.toFixed(1) + "%" : "—"],
            ]}
          />
        </Card>
      </Grid>
      <Card title="Latest signed readings" meta="Readings are placed at measurement time. Arrivals within 90 days count in full." pad={false}>
        <Table cols={["Measured", "Arrived", u.unit, "Signature", "Status"]} minWidth={720} empty="No readings yet. The device has not been installed.">
          {rs.map((r, i) => (
            <tr key={i}>
              <Td mono>{dateTime(r.measured)}</Td>
              <Td mono className={r.late ? "text-warn" : undefined}>{r.late ? "+3 d" : dateTime(r.arrived)}</Td>
              <Td mono>{num(r.value, 2)}</Td>
              <Td mono className="text-muted">{r.sig}</Td>
              <Td>{r.late ? <Pill tone="info">Accepted · late</Pill> : <Pill tone="ok">Accepted</Pill>}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
