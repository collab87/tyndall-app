import { PageHeader } from "@/components/ui";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";
import { Wizard } from "./wizard";

export const metadata = { title: "Create project" };

export default async function NewProjectPage() {
  const u = await requireDeveloper();
  const methodologies = await db.methodology.findMany({ orderBy: { code: "asc" }, select: { code: true, name: true, version: true, sector: true } });
  return (
    <>
      <PageHeader eyebrow="New project" title="Create project" sub="Set up the project and its public page. It must pass the standards check; then you pay the registration fee and Tyndall screens it." status={{ label: "Draft", tone: "neutral" }} back={{ href: "/developer/projects", label: "My projects" }} />
      <Wizard methodologies={methodologies} verified={u.org.status === "VERIFIED"} />
    </>
  );
}
