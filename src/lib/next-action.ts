type P = { code: string; stage: string; pilot?: { status: string } | null };

/** What the developer should do next, and whether the ball is in their court. */
export function nextAction(p: P): { label: string; href: string; yours: boolean } {
  const base = `/developer/projects/${p.code}`;
  switch (p.stage) {
    case "DRAFT":
      return { label: "Pay the registration fee to submit", href: "/developer/payments", yours: true };
    case "SUBMITTED":
      return { label: "Tyndall is screening the project", href: base, yours: false };
    case "APPROVED":
      return { label: "Choose your VVB and auditor", href: base + "/team", yours: true };
    case "PILOT": {
      const s = p.pilot?.status;
      if (s === "PLANNING") return { label: "Plan the pilot and register 1% of units", href: base + "/pilot", yours: true };
      if (s === "RUNNING") return { label: "Pilot running · submit the report when done", href: base + "/pilot", yours: true };
      return { label: "Pilot report with your VVB", href: base + "/pilot", yours: false };
    }
    case "PDD":
      return { label: "Complete the PDD and submit to your VVB", href: base + "/pdd", yours: true };
    case "PDD_REVIEW":
      return { label: "PDD with your VVB", href: base + "/pdd", yours: false };
    case "PDD_VALIDATED":
      return { label: "Tyndall is approving the PDD", href: base + "/pdd", yours: false };
    case "LISTED":
      return { label: "Apply for scale-up", href: base + "/scale", yours: true };
    case "SCALE_REVIEW":
      return { label: "Tyndall is reviewing your scale-up plan", href: base + "/scale", yours: false };
    case "SCALE_APPROVED":
      return { label: "Pay scale-up fees to start rollout", href: "/developer/payments", yours: true };
    case "ACTIVE":
      return { label: "Monitor devices · respond to findings", href: base + "/devices", yours: true };
    default:
      return { label: "Rejected · see Tyndall's reason", href: base, yours: false };
  }
}
