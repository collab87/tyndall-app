export type Role =
  | "DEV_ADMIN"
  | "DEV_LEAD"
  | "DEV_MEO"
  | "DEV_FINANCE"
  | "DEV_CONSULTANT"
  | "SUPER_ADMIN"
  | "REGISTRY_ADMIN"
  | "CARBON_MANAGER"
  | "DQ_ANALYST"
  | "AUDITOR";

export const ROLE_LABEL: Record<Role, string> = {
  DEV_ADMIN: "Organisation admin",
  DEV_LEAD: "Project lead",
  DEV_MEO: "M&E / data officer",
  DEV_FINANCE: "Finance officer",
  DEV_CONSULTANT: "Consultant (external)",
  SUPER_ADMIN: "Super Admin",
  REGISTRY_ADMIN: "Registry Admin",
  CARBON_MANAGER: "Carbon Manager",
  DQ_ANALYST: "Data Quality Analyst",
  AUDITOR: "VVB / auditor",
};

export const DEV_ROLES: Role[] = ["DEV_ADMIN", "DEV_LEAD", "DEV_MEO", "DEV_FINANCE", "DEV_CONSULTANT"];
export const TYNDALL_ROLES: Role[] = ["SUPER_ADMIN", "REGISTRY_ADMIN", "CARBON_MANAGER", "DQ_ANALYST"];

export type Area = "developer" | "console" | "auditor";

export function areaFor(role: string): Area {
  if (DEV_ROLES.includes(role as Role)) return "developer";
  if (TYNDALL_ROLES.includes(role as Role)) return "console";
  return "auditor";
}

/** What each developer role may do. Checked on the server in every action. */
export const DEV_CAN = {
  createProject: ["DEV_ADMIN", "DEV_LEAD"],
  editPdd: ["DEV_ADMIN", "DEV_LEAD", "DEV_MEO", "DEV_CONSULTANT"],
  chooseTeam: ["DEV_ADMIN", "DEV_LEAD"],
  pay: ["DEV_ADMIN", "DEV_FINANCE"],
  devices: ["DEV_ADMIN", "DEV_LEAD", "DEV_MEO"],
  pilot: ["DEV_ADMIN", "DEV_LEAD", "DEV_MEO"],
  respond: ["DEV_ADMIN", "DEV_LEAD", "DEV_MEO", "DEV_CONSULTANT"],
  retire: ["DEV_ADMIN"],
  manageTeam: ["DEV_ADMIN"],
} satisfies Record<string, Role[]>;

/** Console screens each Tyndall role can open. */
export const CONSOLE_SCREENS: Record<string, Role[]> = {
  overview: ["SUPER_ADMIN", "REGISTRY_ADMIN", "CARBON_MANAGER", "DQ_ANALYST"],
  registrations: ["SUPER_ADMIN", "CARBON_MANAGER"],
  projects: ["SUPER_ADMIN", "CARBON_MANAGER", "REGISTRY_ADMIN", "DQ_ANALYST"],
  pilots: ["SUPER_ADMIN", "CARBON_MANAGER", "DQ_ANALYST"],
  auditors: ["SUPER_ADMIN", "CARBON_MANAGER"],
  devices: ["SUPER_ADMIN", "DQ_ANALYST"],
  issuance: ["SUPER_ADMIN", "REGISTRY_ADMIN", "CARBON_MANAGER"],
  retirements: ["SUPER_ADMIN", "REGISTRY_ADMIN"],
  marketplace: ["SUPER_ADMIN", "CARBON_MANAGER", "REGISTRY_ADMIN"],
  organisations: ["SUPER_ADMIN", "CARBON_MANAGER"],
  users: ["SUPER_ADMIN"],
  audit: ["SUPER_ADMIN", "REGISTRY_ADMIN", "CARBON_MANAGER", "DQ_ANALYST"],
};

export function can(role: string, list: readonly string[]) {
  return list.includes(role);
}
