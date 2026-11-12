import { notFound } from "next/navigation";
import { DeviceView } from "@/components/device-view";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DevDevice({ params }: { params: Promise<{ imei: string }> }) {
  const { imei } = await params;
  const u = await requireDeveloper();
  const d = await db.device.findUnique({ where: { imei }, include: { project: { include: { methodology: true } } } });
  if (!d || d.project.orgId !== u.orgId) notFound();
  return <DeviceView d={d} back={{ href: `/developer/projects/${d.project.code}/devices`, label: d.project.name }} />;
}
