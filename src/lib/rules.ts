// Business rules shared by the portal, the console and the auditor workspace.
import { splitList } from "./format";

type AuditorLike = { id: string; status: string; roles: string; methodologies: string; consultsFor: string | null; accreditationExpiry: Date | null };
type ProjectLike = { code: string; vvbId: string | null; auditorId: string | null; methodology: { code: string } };

/** Why an auditor cannot take a role on a project, or "" if they can. Rules TEAM-01 to TEAM-04. */
export function ineligibility(a: AuditorLike, p: ProjectLike, role: "VVB" | "AUDITOR", picked?: { vvbId?: string | null; auditorId?: string | null }) {
  if (a.status !== "APPROVED") return a.status === "SUSPENDED" ? "Suspended by Tyndall" : "Not approved yet";
  if (a.accreditationExpiry && a.accreditationExpiry < new Date()) return "Accreditation expired";
  if (!splitList(a.roles).includes(role)) return role === "VVB" ? "Not registered as a VVB" : "Not registered as an auditor";
  if (!splitList(a.methodologies).includes(p.methodology.code)) return `Not qualified for ${p.methodology.code}`;
  if (role === "VVB" && splitList(a.consultsFor).includes(p.code)) return "Consulted on this project. A VVB can never validate a project it advised.";
  const vvb = picked?.vvbId ?? p.vvbId, aud = picked?.auditorId ?? p.auditorId;
  if (role === "AUDITOR" && vvb === a.id) return "Already the VVB on this project";
  if (role === "VVB" && aud === a.id) return "Already the auditor on this project";
  return "";
}

/** Separation-of-duties pairs that one person may never hold together. */
export const SEPARATION: [string, string, string, string][] = [
  ["CARBON_MANAGER", "REGISTRY_ADMIN", "SEP-04", "Preparing and approving issuance must be done by different people."],
  ["DQ_ANALYST", "REGISTRY_ADMIN", "SEP-06", "Whoever polices data quality cannot also issue credits from it."],
];

export const SEP_RULES = [
  ["SEP-00", "No one can grant themselves a role."],
  ["SEP-01", "The reviewer of a validation report cannot register the same project."],
  ["SEP-02", "Whoever assigns an auditor cannot approve that auditor's invoice."],
  ["SEP-03", "Whoever builds a methodology cannot issue credits under it."],
  ["SEP-04", "Issuance needs a second approver: the preparer can never approve their own request."],
  ["SEP-05", "Nobody can edit or delete the audit trail, including Super Admins."],
];
