import Link from "next/link";
import { ActionForm, Submit } from "@/components/client";
import { FilterBar } from "@/components/filter-bar";
import { Card, Grid, PageHeader, Pill, Select, Stat, Stats, Table, Td } from "@/components/ui";
import { setDeviceStatus } from "@/app/console/actions";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceTone } from "@/lib/device";
import { ago, num } from "@/lib/format";

export const metadata = { title: "Fleet & data quality" };

const THRESHOLDS = [
  ["Arrival window", "Readings arriving later than this are recorded as gaps.", "90 days"],
  ["Device completeness", "Minimum share of expected reporting days per period.", "90.0%"],
  ["Cohort completeness floor", "Below this a cohort is suspended and cannot infer.", "85.0%"],
  ["Cohort inference cap", "Maximum share of an issuance that may be inferred.", "5.0%"],
  ["Inference uncertainty deduction", "Deducted from inferred tonnes before issuance.", "10.0%"],
];
const GAP_RULES: [string, string, "neutral" | "ok" | "bad" | "warn", string][] = [
  ["Silence inside the window", "No use reported. Counts as zero use. Not a gap.", "neutral", "Zero use"],
  ["Late arrival inside 90 days", "Placed at measurement time. Counts in full.", "ok", "Counts"],
  ["Arrival after 90 days", "Recorded as a gap. Excluded from issuance.", "bad", "Gap"],
  ["Cohort inference", "Only above the floor, conservative lower bound, capped and deducted.", "warn", "Capped"],
  ["Self-interpolation", "Not available. No setting, flag or API exists for it.", "neutral", "Not possible"],
];

export default async function Fleet({ searchParams }: { searchParams: Promise<{ project?: string; status?: string }> }) {
  await requireConsole("devices");
  const { project, status } = await searchParams;
  const [devices, projects, counts] = await Promise.all([
    db.device.findMany({ where: { ...(project ? { project: { code: project } } : {}), ...(status ? { status } : {}) }, include: { project: true }, orderBy: [{ status: "asc" }, { lastSeenAt: "asc" }], take: 200 }),
    db.project.findMany({ where: { devices: { some: {} } }, select: { code: true, name: true } }),
    db.device.groupBy({ by: ["status"], _count: true }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  const total = counts.reduce((a, x) => a + x._count, 0);
  return (
    <>
      <PageHeader title="Fleet & data quality" sub="Every commissioned meter across all projects. The gap engine decides what counts; nothing is ever filled from a device's own history." />
      <Stats>
        <Stat label="Paired meters" value={num(total)} note={`${c("PAIRED")} awaiting install`} tone="tech" />
        <Stat label="Online" value={num(c("ONLINE"))} note="reported in 72 h" tone="ok" />
        <Stat label="Offline or fault" value={num(c("OFFLINE") + c("FAULT"))} note="gaps logged, data quarantined" tone="bad" />
        <Stat label="Calibration" value={num(c("CALIBRATION"))} note="readings held until recalibrated" tone="info" />
      </Stats>
      <FilterBar
        filters={[
          { name: "project", label: "Project", value: project, options: [["", "All projects"], ...projects.map((p) => [p.code, p.name] as [string, string])] },
          { name: "status", label: "Status", value: status, options: [["", "All statuses"], "ONLINE", "OFFLINE", "FAULT", "CALIBRATION", "PAIRED"] },
        ]}
      />
      <Card pad={false} meta="Up to 200 shown">
        <Table cols={["Meter", "Project", "Serial", "Location", "Last reading", "Complete", "Status", "Set status"]} minWidth={1200}>
          {devices.map((d) => {
            const [tone, label] = deviceTone(d.status);
            return (
              <tr key={d.id}>
                <Td mono>
                  <Link href={`/console/devices/${d.imei}`} className="text-brand-text hover:underline">
                    {d.imei}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">{d.project.name}</Td>
                <Td mono>{d.serial}</Td>
                <Td className="text-muted">{d.location}</Td>
                <Td className="whitespace-nowrap text-muted">{ago(d.lastSeenAt)}</Td>
                <Td mono>{d.completeness ? d.completeness.toFixed(1) + "%" : "—"}</Td>
                <Td>
                  <Pill tone={tone}>{label}</Pill>
                </Td>
                <Td>
                  <ActionForm action={setDeviceStatus} className="flex gap-1.5">
                    <input type="hidden" name="imei" value={d.imei} />
                    <Select name="status" defaultValue={d.status === "PAIRED" ? "ONLINE" : d.status} options={["ONLINE", "OFFLINE", "FAULT", "CALIBRATION"]} className="h-8 w-36 text-[12px]" />
                    <Submit size="sm" variant="secondary">
                      Set
                    </Submit>
                  </ActionForm>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Grid>
        <Card title="Thresholds" meta="Set by the methodology team · read-only here" pad={false}>
          <ul className="divide-y divide-line">
            {THRESHOLDS.map(([k, d, v]) => (
              <li key={k} className="flex items-center justify-between gap-4 px-5 py-3">
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">{k}</span>
                  <span className="block text-[12.5px] text-muted">{d}</span>
                </span>
                <span className="font-mono text-[14px] font-semibold text-ink">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Gap rules" pad={false}>
          <ul className="divide-y divide-line">
            {GAP_RULES.map(([k, d, t, tag]) => (
              <li key={k} className="flex items-center justify-between gap-4 px-5 py-3">
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">{k}</span>
                  <span className="block text-[12.5px] text-muted">{d}</span>
                </span>
                <Pill tone={t}>{tag}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </Grid>
    </>
  );
}
