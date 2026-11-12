import { Card, Facts, Note, PageHeader } from "@/components/ui";
import { requireAuditor } from "@/lib/auth";
import { AUD_TONE } from "@/lib/device";
import { date } from "@/lib/format";

export const metadata = { title: "Registration" };

export default async function AuditorProfile() {
  const u = await requireAuditor();
  const a = u.auditor;
  return (
    <>
      <PageHeader eyebrow={a.code} title={a.name} sub={`${a.kind === "FIRM" ? "Firm" : "Individual"} · ${a.city}, ${a.country}`} status={{ label: a.status.toLowerCase(), tone: AUD_TONE[a.status] }} />
      <Card title="Registration with Tyndall">
        <Facts
          rows={[
            ["Roles", a.roles.replace(",", " + ")],
            ["Methodologies", a.methodologies.replace(/,/g, " · ")],
            ["Accreditation", a.accreditation],
            ["Expires", date(a.accreditationExpiry)],
            ["Experience", `${a.years} years`],
            ["Languages", a.languages],
            ["Declared consulting", a.consultsFor ?? "None"],
            ["Reviewed", a.reviewedBy ? `${a.reviewedBy} · ${date(a.reviewedAt)}` : "Not yet"],
          ]}
        />
      </Card>
      <Note tone="info" title="Keep your accreditation current." rule="Rule AUD-02">Tyndall alerts you 90, 60 and 30 days before expiry. A lapsed accreditation makes you ineligible automatically.</Note>
    </>
  );
}
