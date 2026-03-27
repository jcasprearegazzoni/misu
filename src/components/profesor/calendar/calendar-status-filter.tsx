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

  return (
    <div className="mt-4 w-full rounded-lg border border-zinc-300 bg-white p-2 md:max-w-sm">
      <label htmlFor="calendar-status-filter" className="px-1 text-xs font-medium text-zinc-600">
        Estado
      </label>
      <select
        id="calendar-status-filter"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          router.push(
            `/dashboard/profesor/calendario?filter=${next}&weekOffset=${weekOffset}&day=${selectedDay}`,
          );
        }}
        className="mt-2 h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
      >
        <option value="todas">Todas ({counts.todas})</option>
        <option value="pendientes">Pendientes ({counts.pendientes})</option>
        <option value="confirmadas">Confirmadas ({counts.confirmadas})</option>
        <option value="canceladas">Canceladas ({counts.canceladas})</option>
      </select>
    </div>
  );
}
