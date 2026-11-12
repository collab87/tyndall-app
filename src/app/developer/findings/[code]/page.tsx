import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/client";
import { FindingView } from "@/components/finding-view";
import { Card, Input, Label, Textarea } from "@/components/ui";
import { respondFinding } from "@/app/developer/actions";
import { requireDeveloper } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function FindingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const u = await requireDeveloper();
  const f = await db.finding.findUnique({ where: { code }, include: { project: true, auditor: true } });
  if (!f || f.project.orgId !== u.orgId) notFound();
  return (
    <FindingView f={f} back={{ href: "/developer/findings", label: "Findings" }}>
      {f.status === "OPEN" && f.type !== "FAR" ? (
        <Card title="Your response">
          <ActionForm action={respondFinding} className="flex flex-col gap-4">
            <input type="hidden" name="finding" value={f.code} />
            <Label label="Response">
              <Textarea name="response" rows={5} placeholder="What you did, and where the evidence is." />
            </Label>
            <Label label="Evidence file" help="Hashed on upload.">
              <Input name="evidence" placeholder="consent-batch-07.zip" />
            </Label>
            <div>
              <Submit>Submit response</Submit>
            </div>
          </ActionForm>
        </Card>
      ) : null}
    </FindingView>
  );
}
