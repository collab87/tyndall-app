import { MILESTONES, stageIndex, STAGES } from "@/lib/stages";
import { cx } from "./ui";

/** Horizontal lifecycle tracker: create → team → pilot → PDD → listed → scale-up → issuing. */
export function StageTrack({ stage }: { stage: string }) {
  const cur = stageIndex(stage);
  const msIndex = MILESTONES.findIndex((m) => m.stages.includes(stage));
  return (
    <ol className="grid grid-cols-7 gap-1.5">
      {MILESTONES.map((m, i) => {
        const last = stageIndex(m.stages[m.stages.length - 1]);
        const state = stage === "REJECTED" ? "todo" : cur > last ? "done" : i === msIndex ? "now" : "todo";
        return (
          <li key={m.label} className="flex min-w-0 flex-col gap-1.5">
            <span className={cx("h-1.5 rounded-full", state === "done" ? "bg-brand" : state === "now" ? "bg-gradient-to-r from-brand to-brand-200" : "bg-surface-3")} />
            <span className={cx("truncate text-[11.5px]", state === "now" ? "font-bold text-ink" : state === "done" ? "font-semibold text-text" : "font-medium text-faint")}>{m.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function stageCount() {
  return STAGES.length;
}
