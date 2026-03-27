"use client";

import { cancelBookingAction, confirmBookingAction } from "@/app/dashboard/profesor/bookings/actions";
import { createDebtChargeQuickAction } from "@/app/dashboard/profesor/deudas/actions";
import { CalendarBookingItem } from "./types";
import { ReprogramBookingPanel } from "./reprogram-booking-panel";
import { ProfesorNoteEditor } from "./profesor-note-editor";

type BookingDetailContentProps = {
  item: CalendarBookingItem;
};

const statusLabel: Record<CalendarBookingItem["status"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

const statusClass: Record<CalendarBookingItem["status"], string> = {
  pendiente: "border-amber-300 bg-amber-100 text-amber-800",
  confirmado: "border-emerald-300 bg-emerald-100 text-emerald-800",
  cancelado: "border-red-300 bg-red-100 text-red-800",
};

export function BookingDetailContent({ item }: BookingDetailContentProps) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1 text-sm text-zinc-700">
        <p className="text-base font-semibold text-zinc-900">
          {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
        </p>
        <p>{item.alumno_name}</p>
        <p>Tipo: {item.type_label}</p>
        <p>
          Estado:{" "}
          <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusClass[item.status]}`}
          >
            {statusLabel[item.status]}
          </span>
        </p>
        <p>Monto estimado: ${item.estimated_amount.toLocaleString("es-AR")}</p>
        {item.status !== "pendiente" ? <p>Estado financiero: {item.financial_status_label}</p> : null}
        <p>Consumo de paquete: {item.package_consumed ? "Si" : "No"}</p>
        {item.package_consumed && item.consumed_student_package_id ? (
          <p>Paquete aplicado: #{item.consumed_student_package_id}</p>
        ) : null}
      </div>

      {item.status === "pendiente" ? (
        <div className="grid grid-cols-2 gap-2">
          <form action={confirmBookingAction}>
            <input type="hidden" name="booking_id" value={item.id} />
            <button className="w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
              Confirmar
            </button>
          </form>
          <form action={cancelBookingAction}>
            <input type="hidden" name="booking_id" value={item.id} />
            <button className="w-full rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white">
              Cancelar
            </button>
          </form>
        </div>
      ) : null}

      {item.status === "confirmado" ? (
        <div className="grid grid-cols-2 gap-2">
          <form action={cancelBookingAction}>
            <input type="hidden" name="booking_id" value={item.id} />
            <button className="w-full rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white">
              Cancelar
            </button>
          </form>

          {item.financial_pending ? (
            <form action={createDebtChargeQuickAction}>
              <input type="hidden" name="booking_id" value={item.id} />
              <input type="hidden" name="alumno_id" value={item.alumno_id} />
              <input type="hidden" name="amount" value={item.estimated_amount || 0} />
              <input type="hidden" name="method" value="efectivo" />
              <input type="hidden" name="note" value="" />
              <button className="w-full rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">
                Cobrar
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-zinc-100 px-2 py-2 text-xs font-medium text-zinc-600">
              Cobrado
            </div>
          )}
        </div>
      ) : null}

      {item.status === "pendiente" || item.status === "confirmado" ? (
        <ReprogramBookingPanel
          bookingId={item.id}
          currentDate={item.date}
          currentStartTime={item.start_time}
          currentEndTime={item.end_time}
          packageConsumed={item.package_consumed}
          hasCoveragePayment={item.has_coverage_payment}
        />
      ) : null}

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Detalle del alumno</p>
        <p className="mt-1">Categoria: {item.alumno_category || "No definida"}</p>
        <p>Rama: {item.alumno_branch || "No definida"}</p>
        <p>Zona: {item.alumno_zone || "No definida"}</p>
        <p>Paleta/Raqueta: {item.alumno_has_equipment ? "Si" : "No"}</p>

        <div className="mt-2">
          <p className="font-semibold text-zinc-900">Proximas clases</p>
          {item.next_classes.length === 0 ? (
            <p className="mt-1 text-zinc-600">Sin clases proximas.</p>
          ) : (
            <ul className="mt-1 grid gap-1 text-xs">
              {item.next_classes.map((nextClass) => (
                <li key={nextClass.id} className="rounded-md border border-zinc-200 bg-white px-2 py-1">
                  {nextClass.date} {nextClass.start_time.slice(0, 5)}-{nextClass.end_time.slice(0, 5)} |{" "}
                  {nextClass.type_label} | {nextClass.status_label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ProfesorNoteEditor key={item.alumno_id} alumnoId={item.alumno_id} initialNote={item.profesor_note} />
    </div>
  );
}
