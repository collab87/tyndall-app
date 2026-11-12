import { btnClass, Select } from "./ui";

/** GET form of select filters; the page reads them from searchParams. */
export function FilterBar({ filters }: { filters: { name: string; label: string; value?: string; options: (string | [string, string])[] }[] }) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
      {filters.map((f) => (
        <label key={f.name} className="flex min-w-[200px] flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-muted">{f.label}</span>
          <Select name={f.name} defaultValue={f.value ?? ""} options={f.options} />
        </label>
      ))}
      <button type="submit" className={btnClass("secondary")}>
        Apply
      </button>
    </form>
  );
}
