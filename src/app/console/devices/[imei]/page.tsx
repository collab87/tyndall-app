import { notFound } from "next/navigation";
import { DeviceView } from "@/components/device-view";
import { requireConsole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ConsoleDevice({ params }: { params: Promise<{ imei: string }> }) {
  const { imei } = await params;
  await requireConsole("devices");
  const d = await db.device.findUnique({ where: { imei }, include: { project: { include: { methodology: true } } } });
  if (!d) notFound();
  return <DeviceView d={d} back={{ href: "/console/devices", label: "Fleet & data quality" }} />;
}
