"use client";

import { useActionState, useState } from "react";
import { Submit } from "@/components/client";
import { Card, cx, Facts, Pill, Select } from "@/components/ui";
import type { ActionResult } from "@/lib/action";
import { VAT } from "@/lib/fees";
import { naira } from "@/lib/format";
import { engageTeam } from "@/app/developer/actions";

type Row = { id: string; name: string; kind: string; city: string; years: number; methodologies: string; accreditation: string; teamSize: number | null; why: string };

function List({ title, rows, picked, onPick, blockId }: { title: string; rows: Row[]; picked: string; onPick: (id: string) => void; blockId: string }) {
  return (
    <Card title={title} meta={`${rows.filter((r) => !r.why).length} eligible`} pad={false}>
      <ul className="divide-y divide-line">
        {rows.map((r) => {
          const blockedBySelf = r.id === blockId;
          const why = r.why || (blockedBySelf ? "Already chosen in the other role" : "");
          const on = picked === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                disabled={!!why}
                onClick={() => onPick(r.id)}
                className={cx("flex w-full items-start gap-4 px-5 py-4 text-left transition", on ? "bg-brand-soft" : why ? "cursor-not-allowed opacity-60" : "hover:bg-surface-2")}
              >
                <span className={cx("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-brand bg-brand" : "border-line-strong")}>{on ? <span className="size-2 rounded-full bg-white" /> : null}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-ink">{r.name}</span>
                    <Pill tone={r.kind === "FIRM" ? "seal" : "neutral"}>{r.kind === "FIRM" ? `Firm · ${r.teamSize ?? "—"}` : "Individual"}</Pill>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">
                    {r.city} · {r.years} yrs · {r.methodologies}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-faint">{r.accreditation}</span>
                  {why ? <span className="mt-1.5 block text-[12.5px] font-semibold text-bad">{why}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function TeamPicker({ code, vvbs, auditors, fees, canPay }: { code: string; vvbs: Row[]; auditors: Row[]; fees: { init: number; vvb: number; aud: number }; canPay: boolean }) {
  const [vvb, setVvb] = useState("");
  const [aud, setAud] = useState("");
  const [state, run] = useActionState(engageTeam, {} as ActionResult);
  const total = (fees.init + fees.vvb + fees.aud) * (1 + VAT);
  const vName = vvbs.find((v) => v.id === vvb)?.name, aName = auditors.find((a) => a.id === aud)?.name;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
      <List title="VVBs · validate your pilot and PDD" rows={vvbs} picked={vvb} onPick={setVvb} blockId={aud} />
      <List title="Auditors · project lifetime" rows={auditors} picked={aud} onPick={setAud} blockId={vvb} />
      <form action={run} className="xl:sticky xl:top-24 xl:self-start">
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="vvb" value={vvb} />
        <input type="hidden" name="auditor" value={aud} />
        <Card title="Checkout">
          <Facts
            rows={[
              ["VVB", vName ?? <span key="v" className="text-faint">Select a VVB</span>],
              ["Auditor", aName ?? <span key="a" className="text-faint">Select an auditor</span>],
              ["Initiation fee (30%)", naira(fees.init * (1 + VAT))],
              ["VVB fee · through Tyndall", naira(fees.vvb * (1 + VAT))],
              ["Auditor fee · year 1", naira(fees.aud * (1 + VAT))],
              [<b key="t">Total incl. VAT</b>, <b key="tv">{naira(total)}</b>],
            ]}
          />
          <div className="mt-4 flex flex-col gap-3">
            <Select name="method" options={["Card · Paystack", "Bank transfer · dedicated account", "Tyndall wallet"]} />
            <Submit size="lg" disabled={!vvb || !aud || !canPay} className="w-full">
              Pay {naira(total)} and engage
            </Submit>
            {!canPay ? <p className="text-[12px] text-muted">Only an organisation admin can choose the team and pay at checkout.</p> : null}
            {state.error ? <p className="rounded-xl bg-bad/10 px-3 py-2 text-[13px] font-semibold text-bad">{state.error}</p> : null}
            <p className="text-[12px] leading-relaxed text-muted">Tyndall holds 20% of each auditor fee until the project&apos;s final validation. Fees never depend on credit volume or price.</p>
          </div>
        </Card>
      </form>
    </div>
  );
}
