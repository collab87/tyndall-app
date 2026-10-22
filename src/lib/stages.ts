export type Tone = "ok" | "warn" | "bad" | "info" | "tech" | "seal" | "neutral" | "brand";

export const STAGES = [
  { id: "DRAFT", label: "Draft", short: "Draft", tone: "neutral", desc: "Profile, scale, instruments and declarations" },
  { id: "SUBMITTED", label: "Awaiting Tyndall approval", short: "Screening", tone: "warn", desc: "Registration fee paid; Tyndall screens against the standard" },
  { id: "APPROVED", label: "Choose VVB & auditor", short: "Team", tone: "info", desc: "Pick an approved VVB and auditor and pay their fees" },
  { id: "PILOT", label: "Pilot · 1% of units", short: "Pilot", tone: "tech", desc: "Run 1% of units; the VVB validates the baseline" },
  { id: "PDD", label: "PDD drafting", short: "PDD", tone: "info", desc: "Built from the methodology template; baseline from the pilot" },
  { id: "PDD_REVIEW", label: "PDD with VVB", short: "PDD review", tone: "info", desc: "The VVB reviews and validates the PDD" },
  { id: "PDD_VALIDATED", label: "Awaiting Tyndall PDD approval", short: "PDD approval", tone: "warn", desc: "Tyndall approves the validated PDD" },
  { id: "LISTED", label: "Listed · apply for scale-up", short: "Listed", tone: "ok", desc: "Listed on the marketplace with expected credits" },
  { id: "SCALE_REVIEW", label: "Scale-up in review", short: "Scale review", tone: "warn", desc: "Tyndall checks the rollout plan against the PDD" },
  { id: "SCALE_APPROVED", label: "Scale-up approved · pay", short: "Scale fees", tone: "warn", desc: "Pay the scale-up fee and auditor year 2" },
  { id: "ACTIVE", label: "Scale-up · monitoring", short: "Active", tone: "ok", desc: "Devices deployed; auditor monitors; credits issued" },
] as const satisfies readonly { id: string; label: string; short: string; tone: Tone; desc: string }[];

export type StageId = (typeof STAGES)[number]["id"] | "REJECTED";

export function stageIndex(stage: string) {
  return STAGES.findIndex((s) => s.id === stage);
}

export function stageInfo(stage: string) {
  if (stage === "REJECTED") return { id: "REJECTED", label: "Rejected", short: "Rejected", tone: "bad" as Tone, desc: "Did not pass Tyndall screening" };
  return STAGES.find((s) => s.id === stage) ?? STAGES[0];
}

export function atLeast(stage: string, target: StageId) {
  return stageIndex(stage) >= stageIndex(target);
}

/** Lifecycle milestones shown on the project tracker (several stages roll into one milestone). */
export const MILESTONES: { label: string; stages: string[] }[] = [
  { label: "Create & register", stages: ["DRAFT", "SUBMITTED"] },
  { label: "Team", stages: ["APPROVED"] },
  { label: "Pilot 1%", stages: ["PILOT"] },
  { label: "PDD", stages: ["PDD", "PDD_REVIEW", "PDD_VALIDATED"] },
  { label: "Listed", stages: ["LISTED"] },
  { label: "Scale-up", stages: ["SCALE_REVIEW", "SCALE_APPROVED"] },
  { label: "Issuing", stages: ["ACTIVE"] },
];

export const PILOT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PLANNING: { label: "Planning", tone: "info" },
  RUNNING: { label: "Running", tone: "tech" },
  REPORTED: { label: "Report with VVB", tone: "warn" },
  VALIDATED: { label: "Validated", tone: "ok" },
};
