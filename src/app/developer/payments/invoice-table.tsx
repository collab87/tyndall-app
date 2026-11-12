"use client";

import { useActionState, useEffect, useState } from "react";
import { Submit } from "@/components/client";
import { Pill, Select, Table, Td } from "@/components/ui";
import type { ActionResult } from "@/lib/action";
import { naira } from "@/lib/format";
import { payInvoices } from "../actions";

type Row = { id: string; code: string; project: string; title: string; payee: string; total: number; due: boolean; category: string; paidAt: string | null };

export function InvoiceTable({ rows, canPay }: { rows: Row[]; canPay: boolean }) {
  const dueIds = rows.filter((r) => r.due).map((r) => r.id);
  const [sel, setSel] = useState<string[]>(dueIds);
  const [state, run] = useActionState(payInvoices, {} as ActionResult);
  useEffect(() => setSel(rows.filter((r) => r.due).map((r) => r.id)), [rows]);
  const total = rows.filter((r) => sel.includes(r.id)).reduce((a, r) => a + r.total, 0);
  return (
    <form action={run}>
      <Table cols={["", "Invoice", "Project", "Item", "Paid to", "Total", "Status"]} minWidth={980}>
        {rows.map((r) => (
          <tr key={r.id} className={r.due ? "bg-warn/5" : undefined}>
            <Td>
              {r.due ? (
                <input type="checkbox" name="invoice" value={r.id} checked={sel.includes(r.id)} disabled={!canPay} onChange={(e) => setSel((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} className="size-4 accent-[var(--brand)]" aria-label={`Select ${r.code}`} />
              ) : null}
            </Td>
            <Td mono>{r.code}</Td>
            <Td className="whitespace-nowrap">{r.project}</Td>
            <Td>
              {r.title}
              <div className="text-[11.5px] text-faint">{r.category === "TEAM" ? "VVB & auditor fee" : "Project fee"}</div>
            </Td>
            <Td className="whitespace-nowrap">{r.payee}</Td>
            <Td className="whitespace-nowrap font-semibold">{naira(r.total)}</Td>
            <Td>{r.due ? <Pill tone="warn">Due</Pill> : <Pill tone="ok">Paid</Pill>}</Td>
          </tr>
        ))}
      </Table>
      {dueIds.length && canPay ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-4">
          {state.error ? <p className="mr-auto text-[13px] font-semibold text-bad">{state.error}</p> : state.ok ? <p className="mr-auto text-[13px] font-semibold text-ok">{state.ok}</p> : null}
          <Select name="method" className="w-auto" options={["Card · Paystack", "Bank transfer · dedicated account", "Tyndall wallet"]} />
          <Submit disabled={!sel.length}>Pay {naira(total)}</Submit>
        </div>
      ) : null}
    </form>
  );
}
