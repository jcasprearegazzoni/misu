"use client";

import { useRouter } from "next/navigation";

type CalendarStatusFilterProps = {
  value: "pendientes" | "confirmadas" | "canceladas" | "todas";
  weekOffset: number;
  selectedDay: string;
  counts: {
    todas: number;
    pendientes: number;
    confirmadas: number;
    canceladas: number;
  };
};

export function CalendarStatusFilter({ value, weekOffset, selectedDay, counts }: CalendarStatusFilterProps) {
  const router = useRouter();
  const options: Array<{
    key: CalendarStatusFilterProps["value"];
    label: string;
    count: number;
  }> = [
    { key: "todas", label: "Todas", count: counts.todas },
    { key: "pendientes", label: "Pendientes", count: counts.pendientes },
    { key: "confirmadas", label: "Confirmadas", count: counts.confirmadas },
    { key: "canceladas", label: "Canceladas", count: counts.canceladas },
  ];

  return (
    <div className="mt-4 rounded-xl border p-2" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              router.push(
                `/dashboard/profesor/calendario?filter=${option.key}&weekOffset=${weekOffset}&day=${selectedDay}`,
              );
            }}
            className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-opacity hover:opacity-90 sm:text-sm"
            style={
              option.key === value
                ? { borderColor: "var(--misu)", background: "var(--misu)", color: "#fff" }
                : { borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }
            }
            aria-pressed={option.key === value}
          >
            <span>{option.label}</span>
            <span
              className="inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: option.key === value ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                color: option.key === value ? "#fff" : "var(--muted)",
              }}
            >
              {option.count}
            </span>
          </button>
        ))}
      </div>
      <select
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          router.push(`/dashboard/profesor/calendario?filter=${next}&weekOffset=${weekOffset}&day=${selectedDay}`);
        }}
        className="sr-only"
      >
        <option value="todas">Todas ({counts.todas})</option>
        <option value="pendientes">Pendientes ({counts.pendientes})</option>
        <option value="confirmadas">Confirmadas ({counts.confirmadas})</option>
        <option value="canceladas">Canceladas ({counts.canceladas})</option>
      </select>
    </div>
  );
}
