import type { ReactNode } from "react";
import { PathTabs } from "@/components/path-tabs";
import { StageTrack } from "@/components/stage-track";
import { PageHeader } from "@/components/ui";
import { num } from "@/lib/format";
import { stageInfo } from "@/lib/stages";
import { loadProject } from "./data";

export default async function ProjectLayout({ children, params }: { children: ReactNode; params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { p } = await loadProject(code);
  const s = stageInfo(p.stage);
  const base = `/developer/projects/${p.code}`;
  return (
    <>
      <PageHeader
        back={{ href: "/developer/projects", label: "My projects" }}
        eyebrow={`${p.code} · ${p.methodology.code} ${p.methodology.version}`}
        title={p.name}
        sub={`${p.location} · ${num(p.units)} ${p.unitType.toLowerCase()} · ${p.methodology.name}`}
        status={{ label: s.label, tone: s.tone }}
      />
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm">
        <StageTrack stage={p.stage} />
      </div>
      <PathTabs
        base={base}
        tabs={[
          { seg: "", label: "Overview" },
          { seg: "team", label: "VVB & auditor" },
          { seg: "pilot", label: "Pilot · 1%" },
          { seg: "pdd", label: "PDD" },
          { seg: "scale", label: "Scale-up" },
          { seg: "devices", label: "Devices", count: p._count.devices },
        ]}
      />
      {children}
    </>
  );
}
