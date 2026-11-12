"use client";

import { useState } from "react";
import { ConfirmAction } from "@/components/client";
import { Input, Label, Select } from "@/components/ui";
import { num } from "@/lib/format";
import { retireCredits } from "../actions";

export function RetireForm({ blocks, org, canRetire }: { blocks: { code: string; label: string; qty: number }[]; org: string; canRetire: boolean }) {
  const [block, setBlock] = useState(blocks[0].code);
  const [qty, setQty] = useState("");
  const [ben, setBen] = useState(org);
  const [reason, setReason] = useState("");
  const [period, setPeriod] = useState("FY2026");
  const b = blocks.find((x) => x.code === block)!;
  const q = parseInt(qty.replace(/,/g, ""), 10);
  const err = qty && (!(q > 0) || q > b.qty) ? `You hold ${num(b.qty)} t in this block.` : "";
  const ok = q > 0 && !err && ben.trim() && reason.trim();
  return (
    <div className="flex flex-col gap-4">
      <Label label="From block">
        <Select value={block} onChange={(e) => setBlock(e.target.value)} options={blocks.map((x) => [x.code, x.label] as [string, string])} />
      </Label>
      <Label label="Quantity (tCO₂e)" error={err} help={ok ? `${num(b.qty - q)} t stay in your account.` : undefined}>
        <Input value={qty} onChange={(e) => setQty(e.target.value)} mono inputMode="numeric" placeholder={`up to ${num(b.qty)}`} />
      </Label>
      <Label label="Beneficiary" help="Your own claim, or a customer you retire for.">
        <Input value={ben} onChange={(e) => setBen(e.target.value)} />
      </Label>
      <Label label="Claim">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. 2026 operational emissions, Kano and Lagos offices" />
      </Label>
      <Label label="Claim period">
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} options={["FY2026", "FY2025", "Calendar 2026"]} />
      </Label>
      <div>
        <ConfirmAction
          action={retireCredits}
          fields={{ block, quantity: q || 0, beneficiary: ben, reason, period }}
          disabled={!ok || !canRetire}
          trigger={ok ? `Retire ${num(q)} t…` : "Retire…"}
          variant="seal"
          title={`Retire ${ok ? num(q) : ""} tCO₂e permanently?`}
          body={`The serials are closed for ${ben} and ${ok ? num(q) : ""} sample tokens are burned. Nobody can undo this.`}
          phrase={ok ? `RETIRE ${q}` : undefined}
          ack="I have checked the beneficiary and the claim."
          confirmLabel="Retire permanently"
        />
        {!canRetire ? <p className="mt-2 text-[12px] text-muted">Only an organisation admin can retire credits.</p> : null}
      </div>
    </div>
  );
}
