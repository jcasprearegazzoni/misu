"use client";

import type { CSSProperties } from "react";
import { cancelBookingAction, confirmBookingAction } from "@/app/dashboard/profesor/bookings/actions";
import { createDebtChargeQuickAction } from "@/app/dashboard/profesor/deudas/actions";
import { CalendarBookingItem } from "./types";
import { ReprogramBookingPanel } from "./reprogram-booking-panel";
import { ProfesorNoteEditor } from "./profesor-note-editor";
import { AvailabilityRange } from "./time-options";

type BookingDetailContentProps = {
  item: CalendarBookingItem;
  availabilityRanges: AvailabilityRange[];
};

const statusLabel: Record<CalendarBookingItem["status"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

const statusStyle: Record<CalendarBookingItem["status"], CSSProperties> = {
  pendiente: { borderColor: "var(--warning-border)", background: "var(--warning-bg)", color: "var(--warning)" },
  confirmado: { borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" },
  cancelado: { borderColor: "var(--error-border)", background: "var(--error-bg)", color: "#fca5a5" },
};

export function BookingDetailContent({ item, availabilityRanges }: BookingDetailContentProps) {
  const displayStatus = item.is_finalized ? "Finalizada" : statusLabel[item.status];
  const displayStatusStyle = item.is_finalized
    ? { borderColor: "var(--info-border)", background: "var(--info-bg)", color: "var(--info)" }
    : statusStyle[item.status];

  return (
    <div className="grid gap-3">
      <div className="grid gap-1 text-sm" style={{ color: "var(--muted)" }}>
        <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
        </p>
        <p>{item.alumno_name}</p>
        <p>Tipo: {item.type_label}</p>
        <p>
          Estado:{" "}
          <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium" style={displayStatusStyle}>
            {displayStatus}
          </span>
        </p>
        <p>Monto estimado: ${item.estimated_amount.toLocaleString("es-AR")}</p>
        {item.status !== "pendiente" ? <p>Estado financiero: {item.financial_status_label}</p> : null}
        {item.is_finalized && item.financial_pending ? (
          <p
            className="mt-1 rounded-md border px-2 py-1 text-xs font-medium"
            style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)", color: "var(--warning)" }}
          >
            Clase finalizada · cobro pendiente.
          </p>
        ) : item.is_finalized && !item.financial_pending ? (
          <p
            className="mt-1 rounded-md border px-2 py-1 text-xs font-medium"
            style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
          >
            Clase finalizada · cobro cubierto.
          </p>
        ) : null}
        <p>Consumo de paquete: {item.package_consumed ? "Sí" : "No"}</p>
        {item.package_consumed && item.consumed_student_package_id ? (
          <p>Paquete aplicado: #{item.consumed_student_package_id}</p>
        ) : null}
      </div>

      {item.status === "pendiente" ? (
        <div className="grid grid-cols-2 gap-2">
          <form action={confirmBookingAction}>
            <input type="hidden" name="booking_id" value={item.id} />
            <button className="w-full rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ background: "var(--success)" }}>
              Confirmar
            </button>
          </form>
          <form action={cancelBookingAction}>
            <input type="hidden" name="booking_id" value={item.id} />
            <button className="w-full rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ background: "var(--error)" }}>
              Cancelar
            </button>
          </form>
        </div>
      ) : null}

      {item.status === "confirmado" ? (
        <div className="grid grid-cols-2 gap-2">
          <form action={cancelBookingAction}>
            <input type="hidden" name="booking_id" value={item.id} />
            <button className="w-full rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ background: "var(--error)" }}>
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
              <button className="btn-primary w-full justify-center px-3 py-2 text-xs">Cobrar</button>
            </form>
          ) : (
            <div
              className="inline-flex items-center justify-center rounded-md border px-2 py-2 text-xs font-medium"
              style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
            >
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
          currentType={item.type}
          packageConsumed={item.package_consumed}
          hasCoveragePayment={item.has_coverage_payment}
          availabilityRanges={availabilityRanges}
        />
      ) : null}

      <div className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
        <p className="font-semibold" style={{ color: "var(--foreground)" }}>
          Detalle del alumno
        </p>
        <p className="mt-1">Categoría: {item.alumno_category || "No definida"}</p>
        <p>Rama: {item.alumno_branch || "No definida"}</p>
        <p>Zona: {item.alumno_zone || "No definida"}</p>
        <p>Paleta/Raqueta: {item.alumno_has_equipment ? "Sí" : "No"}</p>

        <div className="mt-2">
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            Próximas clases
          </p>
          {item.next_classes.length === 0 ? (
            <p className="mt-1">Sin clases próximas.</p>
          ) : (
            <ul className="mt-1 grid gap-1 text-xs">
              {item.next_classes.map((nextClass) => (
                <li key={nextClass.id} className="rounded-md border px-2 py-1" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
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
