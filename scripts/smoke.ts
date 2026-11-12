/* Smoke test: signs a session for each sample role and requests every page. Run: npx tsx scripts/smoke.ts [baseUrl] */
import { PrismaClient } from "@prisma/client";
import { signSession } from "../src/lib/session";

const base = process.argv[2] ?? "http://localhost:3000";
const db = new PrismaClient();

const PAGES: Record<string, string[]> = {
  "fatima@arewaclean.ng": ["/developer", "/developer/projects", "/developer/projects/new", "/developer/projects/PRJ-NG-CC-001", "/developer/projects/PRJ-NG-CC-001/team", "/developer/projects/REG-2026-0044/team", "/developer/projects/REG-2026-0041/pilot", "/developer/projects/REG-2026-0036/pdd", "/developer/projects/PRJ-NG-CC-001/scale", "/developer/projects/PRJ-NG-CC-001/devices", "/developer/findings", "/developer/findings/CAR-KN-P3-01", "/developer/payments", "/developer/credits", "/developer/requests", "/developer/audit", "/developer/team"],
  "musa@sahelgreen.ng": ["/developer", "/developer/projects/REG-2026-0029/scale", "/developer/payments"],
  "super@tyndall.earth": ["/console", "/console/registrations", "/console/projects", "/console/projects/PRJ-NG-CC-001", "/console/pilots", "/console/auditors", "/console/auditors?tab=registry", "/console/auditors/AUD-0010", "/console/organisations", "/console/devices", "/console/issuance", "/console/retirements", "/console/marketplace", "/console/users", "/console/audit"],
  "tunde@tyndall.earth": ["/console", "/console/issuance", "/console/registrations"],
  "ngozi@tyndall.earth": ["/console", "/console/devices"],
  "thandiwe@verify.africa": ["/auditor", "/auditor/projects/REG-2026-0041", "/auditor/findings", "/auditor/profile"],
  "joseph@mwangiaudit.co.ke": ["/auditor", "/auditor/projects/PRJ-NG-CC-001", "/auditor/findings/CAR-KN-P3-01"],
  "halima.sadiq@gmail.com": ["/auditor"],
  "": ["/", "/login", "/register", "/auditors/register", "/marketplace", "/marketplace/PRJ-NG-CC-001", "/verify", "/verify/RT-2026-0001"],
};

async function main() {
  let bad = 0;
  for (const [email, pages] of Object.entries(PAGES)) {
    let cookie = "";
    if (email) {
      const u = await db.user.findUniqueOrThrow({ where: { email } });
      cookie = "tyn_session=" + (await signSession({ uid: u.id, role: u.role, name: u.name, orgId: u.orgId }));
    }
    const results = await Promise.all(
      pages.map(async (p) => {
        const res = await fetch(base + p, { headers: { cookie }, redirect: "manual" });
        await res.text();
        // notFound() answers 404 and a thrown render error answers 500, so status is the signal.
        const err = res.status >= 400;
        return { p, status: res.status, err, loc: res.headers.get("location") };
      }),
    );
    for (const r of results) {
      if (r.err) bad++;
      console.log(`${r.err ? "FAIL" : r.status === 200 ? " ok " : "REDIR"} ${r.status} ${email || "(public)"} ${r.p}${r.loc ? " → " + r.loc : ""}`);
    }
  }
  console.log(bad ? `\n${bad} problem(s)` : "\nAll pages OK");
  process.exit(bad ? 1 : 0);
}

main();
