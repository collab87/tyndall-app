import { dateTime } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { Mono, Table, Td } from "./ui";

type Row = { id: string; at: Date; actorName: string; actorRole: string; phase: string; action: string; diff: string | null; hash: string; project: { name: string } | null };

export function AuditTable({ rows, showProject = true }: { rows: Row[]; showProject?: boolean }) {
  return (
    <Table cols={["When", ...(showProject ? ["Project"] : []), "Phase", "Who", "Action", "Change", "Hash"]} minWidth={1100} empty="No entries for this filter.">
      {rows.map((l) => (
        <tr key={l.id}>
          <Td mono className="whitespace-nowrap text-muted">{dateTime(l.at)}</Td>
          {showProject ? <Td className="whitespace-nowrap">{l.project?.name ?? <span className="text-faint">Platform</span>}</Td> : null}
          <Td className="whitespace-nowrap text-muted">{l.phase}</Td>
          <Td className="whitespace-nowrap">
            {l.actorName}
            <div className="text-[11.5px] text-faint">{l.actorRole}</div>
          </Td>
          <Td>{l.action}</Td>
          <Td mono className="whitespace-nowrap text-[11.5px] text-muted">{l.diff ?? "—"}</Td>
          <Td>
            <Mono className="text-faint">{shortHash(l.hash)}</Mono>
          </Td>
        </tr>
      ))}
    </Table>
  );
}
