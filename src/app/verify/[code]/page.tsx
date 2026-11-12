import Link from "next/link";
import { Certificate } from "@/components/certificate";
import { PublicShell } from "@/components/public-shell";
import { Note } from "@/components/ui";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VerifyCert({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await db.retirement.findUnique({ where: { code: decodeURIComponent(code) }, include: { project: { include: { methodology: true } } } });
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-5 py-12">
        <Link href="/verify" className="text-[13px] font-semibold text-brand-text hover:underline">
          ← Verify another
        </Link>
        {c ? (
          <>
            <Note tone="ok" title={`Certificate ${c.code} is genuine.`}>
              These serials are retired in the Tyndall registry and can never be transferred or retired again.
            </Note>
            <Certificate c={c} />
          </>
        ) : (
          <Note tone="bad" title={`No certificate ${decodeURIComponent(code)} exists.`}>
            Check the number on the certificate. If it still does not match, the certificate is not issued by Tyndall.
          </Note>
        )}
      </div>
    </PublicShell>
  );
}
