import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/client";
import { FindingView } from "@/components/finding-view";
import { Card } from "@/components/ui";
import { closeFinding } from "@/app/auditor/actions";
import { requireAuditor } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AuditorFinding({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const u = await requireAuditor();
  const f = await db.finding.findUnique({ where: { code }, include: { project: true, auditor: true } });
  if (!f || (f.project.vvbId !== u.auditor.id && f.project.auditorId !== u.auditor.id)) notFound();
  const mine = f.auditorId === u.auditor.id;
  const decidable = mine && (f.status === "RESPONDED" || (f.type === "FAR" && f.status === "OPEN"));
  return (
    <FindingView f={f} back={{ href: "/auditor/findings", label: "Findings" }}>
      {decidable ? (
        <Card title="Your decision">
          <ActionForm action={closeFinding} className="flex gap-2">
            <input type="hidden" name="finding" value={f.code} />
            <Submit name="decision" value="accept">
              Accept and close
            </Submit>
            {f.status === "RESPONDED" ? (
              <Submit name="decision" value="reopen" variant="secondary">
                Re-open
              </Submit>
            ) : null}
          </ActionForm>
        </Card>
      ) : null}
    </FindingView>
  );
}
