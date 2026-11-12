# Tyndall Carbon Standards platform

One Next.js app (front end and back end) for the Tyndall registry:

| Area | Path | Who |
| --- | --- | --- |
| Public site, marketplace, certificate lookup | `/`, `/marketplace`, `/verify` | Anyone |
| Developer Portal | `/developer` | Project developers and their consultants |
| Internal Console | `/console` | Super Admin, Carbon Manager, Registry Admin, Data Quality Analyst |
| VVB & auditor workspace | `/auditor` | Approved VVBs and auditors (firms or individuals) |

Everyone signs in at `/login` and lands in the workspace for their role.

## Run it

```bash
npm install
npm run setup     # creates the SQLite database and loads sample data
npm run dev
```

Copy `.env.example` to `.env` first and set `AUTH_SECRET` to a long random string (`openssl rand -hex 32`).

For demos and presentations use production mode, where every page is built ahead of time and opens in under a second:

```bash
npm run build     # about 1–2 minutes; repeat after any code change
npm run start -- -p 3002
```

`npm run dev` compiles each page the first time it is opened, which takes several seconds per page. Use it only while changing code.

Every sample account uses the password `tyndall123`. The login page lists them (set `SHOW_SAMPLE_ACCOUNTS="false"` to hide the list). `npm run db:reset` wipes the database and reloads the sample data.

## Lifecycle

`DRAFT → SUBMITTED → APPROVED → PILOT → PDD → PDD_REVIEW → PDD_VALIDATED → LISTED → SCALE_REVIEW → SCALE_APPROVED → ACTIVE`

1. **Create & register**: the developer creates the project (it must pass the instrument check) and pays the registration fee. Tyndall verifies the organisation (KYB) and screens the project.
2. **Team**: the developer picks one approved VVB and one auditor. The platform blocks ineligible choices: wrong methodology, a party that consulted on the project, the same party in both roles, or a suspended or expired party.
3. **Pilot (1% of units)**: the developer plans the pilot and registers exactly 1% of units, runs it and submits the report. The VVB validates it, and the baseline is locked into PDD section 3.1.
4. **PDD**: built from the methodology template. The VVB comments or validates, then Tyndall approves and the project is listed on the marketplace.
5. **Scale-up**: the developer applies, Tyndall approves, and the developer pays the scale-up fees.
6. **Issuance & retirement**: a Carbon Manager prepares an issuance and a different person (Registry Admin) approves it. Retirement is permanent and produces a public certificate.

Tokens are a **sample feature**: each tonne is shown as a token minted at issuance and burned at retirement. Transaction ids are simulated; the registry serial is the record of truth.

## Code map

- `prisma/schema.prisma`: data model. SQLite locally; change `provider` to `postgresql` for production.
- `prisma/seed.ts`: sample data covering every stage.
- `src/lib/`: auth and sessions (`auth.ts`, `session.ts`), roles (`roles.ts`), lifecycle (`stages.ts`), fees (`fees.ts`), business rules (`rules.ts`), the hash-chained audit trail (`audit.ts`, `chain.ts`), methodology templates (`methodology.ts`).
- `src/app/*/actions.ts`: server actions. Every mutation checks role and stage on the server and writes an audit entry.
- `src/components/`: design system (`ui.tsx`), shells, and client widgets.
- `scripts/smoke.ts`: requests every page as each sample role. Run `npx tsx scripts/smoke.ts http://localhost:3000` with `.env` loaded.

## Design

Burnt-orange brand (`--brand-600 #B14A14`) on warm neutrals, light and dark themes. Fonts: Bricolage Grotesque (display), Manrope (body), JetBrains Mono (data). Tokens live in `src/app/globals.css`.
