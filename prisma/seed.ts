/* Sample data for every stage of the lifecycle. Run: npm run db:seed (wipes the database first). */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AUDITOR_FEE_YEAR, bandFor, PROGRAMME_SPLIT, REG_FEE, VAT, VVB_FEE } from "../src/lib/fees";
import { sha256, signingKey, txId } from "../src/lib/hash";
import { expectedPerYear, PILOT_BASELINE, pddTemplate } from "../src/lib/methodology";

const db = new PrismaClient();
const d = (s: string) => new Date(s);
const daysAgo = (n: number, h = 10) => {
  const x = new Date();
  x.setDate(x.getDate() - n);
  x.setHours(h, Math.floor(Math.random() * 59), 0, 0);
  return x;
};

async function main() {
  // Wipe in dependency order.
  for (const t of ["auditLog", "purchaseRequest", "retirement", "creditBlock", "issuanceRequest", "invoice", "finding", "device", "pddSection", "pilot", "project", "methodology", "auditor", "user", "organisation"] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)[t].deleteMany();
  }

  const pw = await bcrypt.hash("tyndall123", 10);

  /* ——— methodologies ——— */
  const M = {
    TCS001: await db.methodology.create({ data: { code: "TCS001", name: "Metered Clean Cooking", version: "v2.1", sector: "Household energy", unitLabel: "kWh", summary: "Emission reductions from metered electric and efficient cookstoves replacing non-renewable biomass." } }),
    TCS006: await db.methodology.create({ data: { code: "TCS006", name: "Improved Agricultural Land Management", version: "v1.0", sector: "Agriculture", unitLabel: "t SOC/ha", summary: "Reductions and removals from reduced tillage, cover crops and improved fertiliser management." } }),
    TCS007: await db.methodology.create({ data: { code: "TCS007", name: "Water Resource Management by Reducing Emissions", version: "v1.0", sector: "Water", unitLabel: "litres", summary: "Safe-water supply that removes the need to boil water with non-renewable biomass." } }),
    TCS009: await db.methodology.create({ data: { code: "TCS009", name: "Electric and Hybrid Vehicles", version: "v1.0", sector: "Transport", unitLabel: "km · kWh", summary: "Displacement of petrol vehicles by metered electric and hybrid vehicles." } }),
  };

  /* ——— organisations & users ——— */
  const tyndall = await db.organisation.create({ data: { code: "ORG-NG-0001", name: "Tyndall Carbon Standards", type: "TYNDALL", regNumber: "RC 1820044", address: "Plot 1124 Cadastral Zone, Abuja" } });
  const arewa = await db.organisation.create({ data: { code: "ORG-NG-0007", name: "Arewa Clean Energy Ltd", type: "DEVELOPER", regNumber: "RC 1402118", address: "22 Zaria Road, Kano" } });
  const sahel = await db.organisation.create({ data: { code: "ORG-NG-0012", name: "Sahel Green Power Ltd", type: "DEVELOPER", regNumber: "RC 1611905", address: "8 Sultan Abubakar Way, Sokoto" } });
  const breweries = await db.organisation.create({ data: { code: "ORG-NG-0233", name: "Lagos Breweries Plc", type: "BUYER", regNumber: "RC 2207", address: "Iganmu, Lagos" } });

  const user = (email: string, name: string, role: string, orgId: string | null, title?: string, phone?: string) =>
    db.user.create({ data: { email, name, role, orgId, title, phone, passwordHash: pw } });

  await user("fatima@arewaclean.ng", "Fatima Bello", "DEV_ADMIN", arewa.id, "Managing Director");
  await user("chinedu@arewaclean.ng", "Chinedu Obi", "DEV_LEAD", arewa.id, "Head of Projects");
  await user("ibrahim@arewaclean.ng", "Ibrahim Sule", "DEV_MEO", arewa.id, "M&E Officer");
  await user("halima@arewaclean.ng", "Halima Yusuf", "DEV_FINANCE", arewa.id, "Finance Officer");
  await user("grace@okonadvisory.com", "Grace Okon", "DEV_CONSULTANT", arewa.id, "PDD consultant");
  await user("musa@sahelgreen.ng", "Musa Abdullahi", "DEV_ADMIN", sahel.id, "CEO");
  await user("super@tyndall.earth", "Chukwuemeka Okoro", "SUPER_ADMIN", tyndall.id, "Head of IT");
  await user("amara@tyndall.earth", "Amara Nwosu", "CARBON_MANAGER", tyndall.id, "Carbon Manager");
  await user("tunde@tyndall.earth", "Tunde Bakare", "REGISTRY_ADMIN", tyndall.id, "Registry Admin");
  await user("ngozi@tyndall.earth", "Ngozi Adeyemi", "DQ_ANALYST", tyndall.id, "Data Quality Analyst");

  /* ——— VVBs and auditors (firms and individuals) ——— */
  type A = { code: string; kind: "FIRM" | "INDIVIDUAL"; name: string; contactName?: string; email: string; city: string; country: string; roles: string; meth: string; years: number; accreditation: string; expiry: string; languages: string; bio: string; teamSize?: number; consults?: string; status?: string; login?: boolean };
  const AUD: A[] = [
    { code: "AUD-0001", kind: "INDIVIDUAL", name: "Thandiwe Mokoena", email: "thandiwe@verify.africa", city: "Lagos", country: "South Africa", roles: "VVB", meth: "TCS009,TCS007,TCS001", years: 11, accreditation: "ISO 14064-3 lead verifier · ISO 14065 trained", expiry: "2027-03-15", languages: "English, isiZulu", bio: "Lead verifier on 14 transport and water projects across East and West Africa.", login: true },
    { code: "AUD-0002", kind: "FIRM", name: "EarthCheck Verification", contactName: "Sipho Dlamini", email: "ops@earthcheck.co.za", city: "Johannesburg", country: "South Africa", roles: "VVB,AUDITOR", meth: "TCS001,TCS007,TCS009", years: 16, accreditation: "ISO 14065 accredited body · SANAS V0012", expiry: "2027-06-30", languages: "English, French", bio: "Accredited validation and verification body with 9 lead verifiers.", teamSize: 9, login: true },
    { code: "AUD-0003", kind: "INDIVIDUAL", name: "Adebayo Bankole", email: "adebayo@bankole.ng", city: "Lagos", country: "Nigeria", roles: "VVB", meth: "TCS001,TCS009", years: 6, accreditation: "ISO 14064-3 verifier (2022)", expiry: "2027-02-02", languages: "English, Yoruba", bio: "Clean cooking specialist; validated the Kano cookstove pilot.", login: true },
    { code: "AUD-0004", kind: "INDIVIDUAL", name: "Joseph Mwangi", email: "joseph@mwangiaudit.co.ke", city: "Nairobi", country: "Kenya", roles: "AUDITOR", meth: "TCS009,TCS001,TCS007", years: 15, accreditation: "ISO 14064-3 lead auditor (2014)", expiry: "2027-08-22", languages: "English, Kiswahili", bio: "Lifetime auditor on four metered projects.", login: true },
    { code: "AUD-0005", kind: "INDIVIDUAL", name: "Pieter Naidoo", email: "pieter@naidoo.co.za", city: "Cape Town", country: "South Africa", roles: "AUDITOR", meth: "TCS006,TCS009", years: 12, accreditation: "ISO 14064-3 lead auditor (2016)", expiry: "2027-05-11", languages: "English, Afrikaans", bio: "Transport and soil-carbon auditor.", login: true },
    { code: "AUD-0006", kind: "FIRM", name: "Kilimanjaro Audit Partners", contactName: "Neema Mushi", email: "audit@kilimanjaro.co.tz", city: "Arusha", country: "Tanzania", roles: "AUDITOR", meth: "TCS001,TCS006,TCS007", years: 10, accreditation: "ISO 14065 accredited body · TBS-2019-44", expiry: "2027-01-31", languages: "English, Kiswahili", bio: "Audit firm with 6 auditors and field teams in 4 countries.", teamSize: 6, login: true },
    { code: "AUD-0007", kind: "INDIVIDUAL", name: "Kofi Mensah", email: "kofi@mensah.gh", city: "Accra", country: "Ghana", roles: "VVB", meth: "TCS007,TCS006,TCS001", years: 8, accreditation: "ISO 14064-3 verifier (2021)", expiry: "2027-05-11", languages: "English, Twi", bio: "Water and agriculture verifier. Also registered to consult.", consults: "REG-2026-0044", login: true },
    { code: "AUD-0008", kind: "INDIVIDUAL", name: "Dr. Amina Ibrahim", email: "amina@aminaibrahim.ng", city: "Abuja", country: "Nigeria", roles: "VVB,AUDITOR", meth: "TCS006,TCS007", years: 13, accreditation: "PhD soil science · ISO 14064-3 lead verifier (2017)", expiry: "2027-09-18", languages: "English, Hausa", bio: "Soil carbon and water specialist.", login: true },
    { code: "AUD-0009", kind: "INDIVIDUAL", name: "Fatou Diallo", email: "fatou@diallo.sn", city: "Dakar", country: "Senegal", roles: "AUDITOR", meth: "TCS007,TCS001", years: 7, accreditation: "ISO 14064-3 auditor (2021)", expiry: "2027-01-30", languages: "French, English, Wolof", bio: "Auditor for water kiosk programmes in the Sahel.", login: true },
    { code: "AUD-0010", kind: "INDIVIDUAL", name: "Halima Sadiq", email: "halima.sadiq@gmail.com", city: "Maiduguri", country: "Nigeria", roles: "VVB", meth: "TCS006,TCS007", years: 7, accreditation: "ISO 14064-3 verifier (2021)", expiry: "2027-11-30", languages: "English, Hausa, Kanuri", bio: "Applying to validate agriculture and water projects in the North East.", status: "PENDING", login: true },
    { code: "AUD-0011", kind: "FIRM", name: "Sahel Assurance Group", contactName: "Moussa Traoré", email: "contact@sahelassurance.ml", city: "Bamako", country: "Mali", roles: "VVB,AUDITOR", meth: "TCS001,TCS007", years: 12, accreditation: "ISO 14065 accredited body · MLI-ACC-031", expiry: "2026-11-30", languages: "French, English, Bambara", bio: "Assurance firm expanding into Nigeria.", teamSize: 5, status: "PENDING" },
    { code: "AUD-0012", kind: "INDIVIDUAL", name: "Chiamaka Nwachukwu", email: "chiamaka.n@outlook.com", city: "Owerri", country: "Nigeria", roles: "VVB", meth: "TCS001", years: 3, accreditation: "ISO 14065 training only", expiry: "2027-04-01", languages: "English, Igbo", bio: "Consults for two developers; applying to verify clean cooking.", consults: "PRJ-NG-CC-001", status: "PENDING" },
    { code: "AUD-0013", kind: "FIRM", name: "Kanem Audit Partners", contactName: "Bulama Ali", email: "info@kanemaudit.ng", city: "Maiduguri", country: "Nigeria", roles: "VVB", meth: "TCS001", years: 5, accreditation: "ISO 14065 accreditation lapsed 20 Sep 2026", expiry: "2026-09-20", languages: "English, Hausa", bio: "Suspended after accreditation lapsed.", status: "SUSPENDED" },
  ];
  const aud: Record<string, string> = {};
  for (const a of AUD) {
    const u = a.login ? await user(a.email, a.kind === "FIRM" ? a.contactName! : a.name, "AUDITOR", null, a.kind === "FIRM" ? "Lead · " + a.name : "Independent VVB / auditor") : null;
    const status = a.status ?? "APPROVED";
    const row = await db.auditor.create({
      data: {
        code: a.code, kind: a.kind, name: a.name, contactName: a.contactName, email: a.email, city: a.city, country: a.country, roles: a.roles, methodologies: a.meth, years: a.years,
        accreditation: a.accreditation, accreditationExpiry: d(a.expiry), languages: a.languages, bio: a.bio, teamSize: a.teamSize, consultsFor: a.consults, status,
        reviewedBy: status === "APPROVED" || status === "SUSPENDED" ? "Amara Nwosu" : null, reviewedAt: status === "PENDING" ? null : d("2026-01-15"),
        reviewNote: status === "SUSPENDED" ? "Accreditation lapsed 20 Sep 2026." : null, userId: u?.id, createdAt: status === "PENDING" ? daysAgo(3 + AUD.indexOf(a) - 9) : d("2025-12-01"),
      },
    });
    aud[a.code] = row.id;
  }

  /* ——— projects ——— */
  let devSeq = 0;
  type P = { code: string; name: string; org: string; m: keyof typeof M; activity: string; about: string; location: string; units: number; unitType: string; instrument: string; interval: string; calibration: string; stage: string; vvb?: string; auditor?: string; consultant?: string; relatedParty?: string; listed?: boolean; created: string };
  async function project(p: P) {
    const band = bandFor(p.units);
    return db.project.create({
      data: {
        code: p.code, name: p.name, orgId: p.org, methodologyId: M[p.m].id, activity: p.activity, about: p.about, location: p.location, units: p.units, unitType: p.unitType,
        instrument: p.instrument, interval: p.interval, calibration: p.calibration, feeBand: band.label, programmeFee: band.fee, consultant: p.consultant, relatedParty: p.relatedParty,
        rightsDeclared: p.stage !== "DRAFT", stage: p.stage, vvbId: p.vvb ? aud[p.vvb] : null, auditorId: p.auditor ? aud[p.auditor] : null, listed: !!p.listed,
        expectedPerYear: expectedPerYear(p.m, p.units), submittedAt: p.stage === "DRAFT" ? null : d(p.created), approvedAt: ["DRAFT", "SUBMITTED"].includes(p.stage) ? null : d(p.created),
        createdAt: d(p.created), startDate: "2026-02-01",
      },
    });
  }

  async function invoices(projectId: string, pre: string, programmeFee: number, kinds: string[], vvbName?: string, audName?: string) {
    const all: Record<string, [string, string, number, string]> = {
      REG: ["PROJECT", "Project registration fee", REG_FEE, "Tyndall"],
      INIT: ["PROJECT", "Initiation fee · pilot stage (30%)", programmeFee * PROGRAMME_SPLIT.INIT, "Tyndall"],
      VVB: ["TEAM", "VVB fee · pilot and PDD validation", VVB_FEE, vvbName ?? "VVB"],
      AUD1: ["TEAM", "Auditor fee · year 1 (20% held)", AUDITOR_FEE_YEAR, audName ?? "Auditor"],
      SCALE: ["PROJECT", "Scale-up fee (50%)", programmeFee * PROGRAMME_SPLIT.SCALE, "Tyndall"],
      AUD2: ["TEAM", "Auditor fee · year 2 (20% held)", AUDITOR_FEE_YEAR, audName ?? "Auditor"],
      ISSUE: ["PROJECT", "Issuance fee (20%)", programmeFee * PROGRAMME_SPLIT.ISSUE, "Tyndall"],
    };
    for (const k of kinds) {
      const [kind, paid] = k.split(":");
      const [category, title, amount, payee] = all[kind];
      await db.invoice.create({
        data: { code: `INV-${pre}-${kind}`, projectId, kind, category, title, amount: Math.round(amount), vat: Math.round(amount * VAT), payee, status: paid === "due" ? "DUE" : "PAID", method: paid === "due" ? null : "Card · Paystack", paidAt: paid === "due" ? null : d("2026-03-01"), paidBy: paid === "due" ? null : "Halima Yusuf" },
      });
    }
  }

  async function devices(projectId: string, n: number, mk: (i: number) => { serial: string; model: string; location: string }, opts: { pilot?: number; statuses?: Record<number, string> } = {}) {
    for (let i = 0; i < n; i++) {
      devSeq++;
      const imei = String(356938035600000 + devSeq * 17);
      const m = mk(i);
      const status = opts.statuses?.[i] ?? "ONLINE";
      await db.device.create({
        data: { imei, serial: m.serial, model: m.model, location: m.location, projectId, status, isPilot: i < (opts.pilot ?? 0), signingKey: signingKey(imei), completeness: status === "ONLINE" ? 96 + (i % 4) : status === "OFFLINE" ? 71 : status === "FAULT" ? 63 : 88, lastSeenAt: status === "OFFLINE" ? daysAgo(4) : status === "FAULT" ? daysAgo(0, 4) : new Date(Date.now() - (i % 9) * 60_000), commissionedAt: d("2025-04-14") },
      });
    }
  }

  async function pdd(projectId: string, mcode: string, state: "all" | "partial") {
    const t = pddTemplate(mcode);
    for (const s of t) {
      const done = state === "all" || s.kind !== "TEXT" || ["1.1", "1.2", "1.3", "1.4", "1.5", "2.2"].includes(s.code);
      const comment = state === "partial" && s.code === "2.3";
      await db.pddSection.create({
        data: {
          projectId, code: s.code, part: s.part, title: s.title, kind: s.kind, sort: s.sort, status: comment ? "COMMENT" : done ? "COMPLETE" : "TODO",
          content: done && s.kind === "TEXT" ? `${s.title}: drafted by the project team and reviewed against the methodology guidance.` : comment ? "Investment analysis shows an IRR of 6.2% without carbon revenue, below the 12% benchmark." : null,
          comment: comment ? "Attach the financing term sheet referenced in the IRR calculation." : null,
        },
      });
    }
  }

  // 1. Kano · active, issuing
  const kano = await project({ code: "PRJ-NG-CC-001", name: "Kano Metered Cookstoves", org: arewa.id, m: "TCS001", activity: "Metered electric cookstoves replacing firewood in peri-urban Kano households.", about: "2,508 Arewa Jiko Smart stoves with Tyndall IoT meters across Gwale, Dala and Nassarawa.", location: "Kano State", units: 2508, unitType: "Stoves", instrument: "Tyndall TM-2 meter on Arewa Jiko Smart 2 stoves", interval: "Every 1 minute, signed on device", calibration: "Annual, ISO/IEC 17025 lab", stage: "ACTIVE", vvb: "AUD-0003", auditor: "AUD-0004", listed: true, created: "2025-03-04" });
  await db.pilot.create({ data: { projectId: kano.id, units: 26, comparison: "26 households on firewood (kitchen performance test)", durationDays: 90, status: "VALIDATED", plan: "26 metered stoves in Gwale and Dala.", baseline: JSON.stringify(PILOT_BASELINE.TCS001), startedAt: d("2025-04-14"), reportedAt: d("2025-07-14"), validatedAt: d("2025-07-30"), vvbNote: "Baseline validated. Firewood 2.9 kg/day per household." } });
  await pdd(kano.id, "TCS001", "all");
  await db.project.update({ where: { id: kano.id }, data: { pddVersion: 3, pddHash: sha256("pdd-kano-v3") } });
  await devices(kano.id, 32, (i) => ({ serial: "ARW-CS-04188" + String(i).padStart(2, "0"), model: "Arewa Jiko Smart 2", location: ["Gwale", "Dala", "Nassarawa", "Fagge"][i % 4] + " · HH-KN-" + sha256("hh" + i).slice(0, 6) }), { pilot: 26, statuses: { 5: "OFFLINE", 11: "FAULT", 19: "CALIBRATION", 27: "OFFLINE" } });
  await invoices(kano.id, "CC001", kano.programmeFee, ["REG", "INIT", "VVB", "AUD1", "SCALE", "AUD2", "ISSUE"], "Adebayo Bankole", "Joseph Mwangi");

  // 2. Kaduna · PDD drafting
  const kaduna = await project({ code: "REG-2026-0036", name: "Kaduna Safe Water Kiosks", org: arewa.id, m: "TCS007", activity: "Solar UV water kiosks so households stop boiling water with firewood.", about: "400 SolarPure UV-500 kiosks with Tyndall flow meters serving 1,860 households in the pilot.", location: "Kaduna State", units: 400, unitType: "Water kiosks", instrument: "Tyndall FM-1 flow meter on SolarPure UV-500 kiosks", interval: "Every 15 minutes, signed on device", calibration: "Factory + 2-yearly field check", stage: "PDD", vvb: "AUD-0007", auditor: "AUD-0009", created: "2026-02-10" });
  await db.pilot.create({ data: { projectId: kaduna.id, units: 4, comparison: "Household boiling survey (n=420)", durationDays: 120, status: "VALIDATED", plan: "4 kiosks serving 1,860 households.", baseline: JSON.stringify(PILOT_BASELINE.TCS007), startedAt: d("2026-04-02"), reportedAt: d("2026-08-01"), validatedAt: d("2026-08-28"), vvbNote: "Validated after KDK-03 recalibration." } });
  await pdd(kaduna.id, "TCS007", "partial");
  await db.project.update({ where: { id: kaduna.id }, data: { pddVersion: 1 } });
  await devices(kaduna.id, 4, (i) => ({ serial: "KDK-0" + (i + 1), model: "SolarPure UV-500 kiosk", location: ["Zaria · Sabon Gari", "Kaduna North · Kawo", "Kaduna South · Barnawa", "Chikun · Kujama"][i] }), { pilot: 4, statuses: { 2: "CALIBRATION" } });
  await invoices(kaduna.id, "20260036", kaduna.programmeFee, ["REG", "INIT", "VVB", "AUD1"], "Kofi Mensah", "Fatou Diallo");

  // 3. Lagos · pilot running
  const lagos = await project({ code: "REG-2026-0041", name: "Lagos Electric Keke", org: arewa.id, m: "TCS009", activity: "Electric tricycles (keke) replacing petrol keke on fixed routes.", about: "1,200 electric keke with VIN-linked Tyndall meters on Ikeja–Oshodi and Yaba–CMS routes.", location: "Lagos State", units: 1200, unitType: "Vehicles", instrument: "Tyndall TM-2 meter, VIN-linked", interval: "Every 30 seconds, signed on device", calibration: "Annual, ISO/IEC 17025 lab", stage: "PILOT", vvb: "AUD-0001", auditor: "AUD-0005", consultant: "Grace Okon (PDD drafting)", created: "2026-06-20" });
  await db.pilot.create({ data: { projectId: lagos.id, units: 12, comparison: "12 petrol keke on the same routes", durationDays: 90, status: "RUNNING", plan: "12 electric keke + 12 petrol comparison keke on Ikeja–Oshodi and Yaba–CMS.", startedAt: daysAgo(62) } });
  const DRV = ["Sunday Okafor", "Bola Adeyemi", "Emeka Nwosu", "Yusuf Bello", "Kunle Ojo", "Ifeanyi Eze", "Segun Bakare", "Chidi Uche", "Ahmed Musa", "Tobi Alade", "Femi Ogunleye", "Gbenga Lawal"];
  await devices(lagos.id, 12, (i) => ({ serial: "MD9EK3P2N" + (41007 + i * 13), model: "Keke-E 3W", location: (i % 2 ? "Yaba–CMS" : "Ikeja–Oshodi") + " · " + DRV[i] }), { pilot: 12, statuses: { 6: "OFFLINE" } });
  await invoices(lagos.id, "20260041", lagos.programmeFee, ["REG", "INIT", "VVB", "AUD1"], "Thandiwe Mokoena", "Pieter Naidoo");

  // 4. Benue · approved, choosing team
  const benue = await project({ code: "REG-2026-0044", name: "Benue Regenerative Farms", org: arewa.id, m: "TCS006", activity: "Reduced tillage, cover crops and improved fertiliser use on smallholder farms.", about: "5,000 ha across 240 smallholder farms with IoT soil probes and lab SOC sampling.", location: "Benue State", units: 5000, unitType: "Hectares", instrument: "Tyndall SP-3 soil probes + lab SOC sampling", interval: "Probes every 15 minutes; SOC cores each season", calibration: "Factory + 2-yearly field check", stage: "APPROVED", consultant: "Kofi Mensah (project design)", created: "2026-09-24" });
  await invoices(benue.id, "20260044", benue.programmeFee, ["REG"]);

  // 5. Sahel · Zaria e-Okada · listed (ready for scale-up)
  const zaria = await project({ code: "REG-2026-0029", name: "Zaria e-Okada Fleet", org: sahel.id, m: "TCS009", activity: "Electric motorcycles (okada) for commercial riders.", about: "300 electric motorcycles with swappable batteries and Tyndall meters around Zaria.", location: "Kaduna State", units: 300, unitType: "Vehicles", instrument: "Tyndall TM-2 meter on Spiro EKON 450", interval: "Every 30 seconds, signed on device", calibration: "Annual, ISO/IEC 17025 lab", stage: "LISTED", vvb: "AUD-0001", auditor: "AUD-0002", listed: true, created: "2026-01-12" });
  await db.pilot.create({ data: { projectId: zaria.id, units: 3, comparison: "3 petrol okada", durationDays: 90, status: "VALIDATED", baseline: JSON.stringify(PILOT_BASELINE.TCS009), startedAt: d("2026-03-01"), reportedAt: d("2026-06-01"), validatedAt: d("2026-06-20") } });
  await pdd(zaria.id, "TCS009", "all");
  await db.project.update({ where: { id: zaria.id }, data: { pddVersion: 1, pddHash: sha256("pdd-zaria-v1") } });
  await devices(zaria.id, 3, (i) => ({ serial: "SPR-EK450-" + (7701 + i), model: "Spiro EKON 450", location: "Zaria · Samaru" }), { pilot: 3 });
  await invoices(zaria.id, "20260029", zaria.programmeFee, ["REG", "INIT", "VVB", "AUD1"], "Thandiwe Mokoena", "EarthCheck Verification");

  // 6. Sahel · Sokoto · submitted, related party
  const sokoto = await project({ code: "REG-2026-0047", name: "Sokoto Electric Pressure Cookers", org: sahel.id, m: "TCS001", activity: "Electric pressure cookers on mini-grid connections.", about: "640 EPCs with smart plug meters for households on Sokoto mini-grids.", location: "Sokoto State", units: 640, unitType: "Stoves", instrument: "Tyndall SPM-3 smart plug meter", interval: "Every 1 minute, signed on device", calibration: "Factory + 2-yearly field check", stage: "SUBMITTED", relatedParty: "Shares a director (Alhaji Sani Musa) with Arewa Clean Energy Ltd.", created: "2026-10-18" });
  await invoices(sokoto.id, "20260047", sokoto.programmeFee, ["REG"]);

  // 7. Sahel · Katsina · draft
  const katsina = await project({ code: "REG-2026-0049", name: "Katsina Borehole Kiosks", org: sahel.id, m: "TCS007", activity: "Solar borehole kiosks with chlorination.", about: "120 kiosks in Katsina LGAs.", location: "Katsina State", units: 120, unitType: "Water kiosks", instrument: "Tyndall FM-1 flow meter", interval: "Every 15 minutes, signed on device", calibration: "Factory + 2-yearly field check", stage: "DRAFT", created: "2026-10-20" });
  await invoices(katsina.id, "20260049", katsina.programmeFee, ["REG:due"]);

  /* ——— findings ——— */
  const F = [
    { code: "CAR-KN-P3-01", projectId: kano.id, auditorId: aud["AUD-0004"], type: "CAR", phase: "Monitoring · Period 3", title: "12 households missing consent re-confirmation after rebinding", detail: "Meters were moved to new households in July. Consent exists only for the original households.", request: "Upload re-confirmed consent for each rebound household, or exclude those meters from Period 3.", atStake: "124 t withheld", due: daysAgo(-6), status: "OPEN", createdAt: daysAgo(28) },
    { code: "CLR-KN-P3-02", projectId: kano.id, auditorId: aud["AUD-0004"], type: "CLR", phase: "Monitoring · Period 3", title: "Explain the step-change in cooking energy for cohort KN-05 in week 31", detail: "Median daily kWh rose 18% between 27 Jul and 2 Aug.", request: "Explain the cause with evidence.", atStake: "None withheld", due: daysAgo(-8), status: "OPEN", createdAt: daysAgo(28) },
    { code: "FAR-KN-P2-03", projectId: kano.id, auditorId: aud["AUD-0004"], type: "FAR", phase: "Monitoring · Period 2", title: "Monitor stove resale outside the project boundary", detail: "Carried forward from Period 2.", request: "Report GPS relocations above 2 km each period.", atStake: "—", status: "OPEN", createdAt: d("2026-06-02") },
    { code: "CLR-KD-PIL-01", projectId: kaduna.id, auditorId: aud["AUD-0007"], type: "CLR", phase: "Pilot", title: "Flow meter on KDK-03 drifted 2.1% against the reference", detail: "Reference jug test showed 2.1% over-reading.", request: "Recalibrate and show the corrected series.", atStake: "Pilot baseline only", status: "CLOSED", response: "Recalibrated; corrected series attached.", respondedAt: d("2026-08-25"), closedAt: d("2026-08-27"), createdAt: d("2026-08-21") },
    { code: "CLR-LG-PIL-02", projectId: lagos.id, auditorId: aud["AUD-0001"], type: "CLR", phase: "Pilot", title: "Explain the 2-day gap on unit 07", detail: "No readings from unit 07 for two days.", request: "Confirm the cause and that the gap is excluded, not filled.", atStake: "Pilot baseline only", due: daysAgo(-5), status: "OPEN", createdAt: daysAgo(2) },
  ];
  for (const f of F) await db.finding.create({ data: f });

  /* ——— issuance, holdings, retirement (sample tokens) ——— */
  const ir1 = await db.issuanceRequest.create({ data: { code: "IR-2026-009", projectId: kano.id, period: "Apr–Jun 2026", vintage: "2026", quantity: 1180, inferredPct: 0.6, status: "ISSUED", preparedById: "seed", preparedBy: "Amara Nwosu", approvedBy: "Tunde Bakare", serialFrom: 1, serialTo: 1180, tokenTx: txId("IR-2026-009"), preparedAt: d("2026-07-10"), approvedAt: d("2026-07-12") } });
  const ir2 = await db.issuanceRequest.create({ data: { code: "IR-2026-012", projectId: kano.id, period: "Jul 2026", vintage: "2026", quantity: 6745, inferredPct: 0.8, status: "ISSUED", preparedById: "seed", preparedBy: "Amara Nwosu", approvedBy: "Tunde Bakare", serialFrom: 1181, serialTo: 7925, tokenTx: txId("IR-2026-012"), preparedAt: d("2026-09-10"), approvedAt: d("2026-09-12") } });
  const amara = await db.user.findUniqueOrThrow({ where: { email: "amara@tyndall.earth" } });
  await db.issuanceRequest.create({ data: { code: "IR-2026-014", projectId: kano.id, period: "Aug 2026", vintage: "2026", quantity: 1204, inferredPct: 0.8, status: "PENDING", preparedById: amara.id, preparedBy: "Amara Nwosu", note: "Verification report VR-2026-031 accepted. Quality statement QS-KN-2026-08.", preparedAt: daysAgo(2) } });
  await db.creditBlock.create({ data: { code: "BLK-0001", orgId: arewa.id, projectId: kano.id, issuanceId: ir1.id, vintage: "2026", serialStart: 251, quantity: 930 } });
  await db.creditBlock.create({ data: { code: "BLK-0002", orgId: arewa.id, projectId: kano.id, issuanceId: ir2.id, vintage: "2026", serialStart: 1181, quantity: 6245 } });
  await db.creditBlock.create({ data: { code: "BLK-0003", orgId: breweries.id, projectId: kano.id, issuanceId: ir2.id, vintage: "2026", serialStart: 7426, quantity: 500 } });
  await db.retirement.create({ data: { code: "RT-2026-0001", orgId: arewa.id, projectId: kano.id, vintage: "2026", quantity: 250, serialStart: 1, serialEnd: 250, beneficiary: "Arewa Clean Energy Ltd", reason: "2025 office and fleet emissions", claimPeriod: "FY2025", burnTx: txId("RT-2026-0001"), retiredBy: "Fatima Bello", createdAt: d("2026-09-14") } });

  await db.purchaseRequest.create({ data: { code: "PR-0001", projectId: kano.id, buyerName: "Adaeze Okafor", buyerOrg: "Safari Freight Ltd", email: "adaeze@safarifreight.ng", quantity: 1000, message: "Looking to offset 2026 fleet emissions. Can you do quarterly delivery?", status: "NEW", createdAt: daysAgo(1) } });
  await db.purchaseRequest.create({ data: { code: "PR-0002", projectId: zaria.id, buyerName: "Kelechi Ibe", buyerOrg: "Lekki Data Centres", email: "kelechi@lekkidc.com", quantity: 300, message: "Interested in forward volume once issuance starts.", status: "IN_DISCUSSION", createdAt: daysAgo(6) } });

  /* ——— audit trail (hash-chained) ——— */
  let prev: string | null = null;
  const log = async (at: Date, actorName: string, actorRole: string, phase: string, action: string, projectId?: string, diff?: string) => {
    const hash = sha256([prev ?? "genesis", at.toISOString(), actorName, actorRole, projectId ?? "", phase, action, diff ?? ""].join("|"));
    await db.auditLog.create({ data: { at, actorName, actorRole, phase, action, projectId, diff, hash, prevHash: prev } });
    prev = hash;
  };
  await log(d("2025-03-04T09:12:00"), "Fatima Bello", "Organisation admin", "Registration", "Project created · declarations signed", kano.id, "none → submitted");
  await log(d("2025-03-06T13:40:00"), "Amara Nwosu", "Carbon Manager", "Approval", "Project approved · standards check 6 of 6", kano.id, "screening → approved");
  await log(d("2025-04-14T09:48:00"), "Adebayo Bankole", "VVB", "Pilot", "Pilot day-1 visit · 26 stoves checked", kano.id);
  await log(d("2025-07-30T15:00:00"), "Adebayo Bankole", "VVB", "Pilot", "Pilot validated · baseline signed", kano.id, "report → validated");
  await log(d("2026-07-12T10:00:00"), "Tunde Bakare", "Registry Admin", "Issuance", "Issued IR-2026-009 · 1,180 tokens minted (sample)", kano.id, "pending → issued");
  await log(d("2026-08-28T15:00:00"), "Kofi Mensah", "VVB", "Pilot", "Pilot validated · baseline signed (X_boil 0.71, SEC 376 kJ/L)", kaduna.id, "report → validated");
  await log(d("2026-09-12T11:20:00"), "Tunde Bakare", "Registry Admin", "Issuance", "Issued IR-2026-012 · 6,745 tokens minted (sample)", kano.id, "pending → issued");
  await log(d("2026-09-14T16:02:00"), "Fatima Bello", "Organisation admin", "Retirement", "Retired 250 t for Arewa Clean Energy Ltd · RT-2026-0001 · 250 tokens burned", kano.id, "held → retired");
  await log(d("2026-09-24T11:40:00"), "Joseph Mwangi", "Auditor", "Monitoring", "Raised CAR-KN-P3-01 and CLR-KN-P3-02 · 124 t withheld", kano.id);
  await log(d("2026-09-25T09:00:00"), "Fatima Bello", "Organisation admin", "Credits", "Transferred 500 t to Lagos Breweries Plc", kano.id, "held → transferred");
  await log(d("2026-09-26T10:00:00"), "Amara Nwosu", "Carbon Manager", "Approval", "Project approved · standards check 6 of 6", benue.id, "screening → approved");
  await log(daysAgo(62), "Chinedu Obi", "Project lead", "Pilot", "Pilot started · 12 units registered", lagos.id, "plan → running");
  await log(daysAgo(4), "Musa Abdullahi", "Organisation admin", "Registration", "Project submitted · registration fee paid · related party declared", sokoto.id, "draft → submitted");
  await log(daysAgo(2), "Amara Nwosu", "Carbon Manager", "Issuance", "Prepared IR-2026-014 · 1,204 t", kano.id, "— → pending");
  await log(daysAgo(2, 16), "Thandiwe Mokoena", "VVB", "Pilot", "Raised CLR-LG-PIL-02 · unit 07 gap", lagos.id);
  await log(daysAgo(0, 8), "System", "Ingestion", "Monitoring", "Daily telemetry batch hashed · 51 devices", undefined, "pending → anchored");

  console.log("Seeded. Every account's password is: tyndall123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
