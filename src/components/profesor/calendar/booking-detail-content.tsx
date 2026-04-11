"use client";

import { useActionState } from "react";
import { cancelBookingAction, confirmBookingAction } from "@/app/dashboard/profesor/bookings/actions";
import { createDebtChargeQuickAction } from "@/app/dashboard/profesor/deudas/actions";
import { CalendarBookingItem } from "./types";
import { ReprogramBookingPanel } from "./reprogram-booking-panel";
import { ProfesorNoteEditor } from "./profesor-note-editor";
import { AvailabilityRange } from "./time-options";
import { getStatusVisual } from "./status-utils";

type BookingDetailContentProps = {
  item: CalendarBookingItem;
  availabilityRanges: AvailabilityRange[];
  timeRange?: { start: string; end: string };
  slotBookings?: Array<{
    id: number;
    alumno_name: string;
    status: CalendarBookingItem["status"];
    is_finalized: boolean;
    financial_pending: boolean;
  }>;
  selectedBookingId?: number | null;
  onSelectBooking?: (bookingId: number) => void;
  showNextClasses?: boolean;
};

export function BookingDetailContent({
  item,
  availabilityRanges,
  timeRange,
  slotBookings,
  selectedBookingId,
  onSelectBooking,
  showNextClasses = false,
}: BookingDetailContentProps) {
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmBookingAction, { error: null });
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelBookingAction, { error: null });

  const rangeStart = timeRange?.start ?? item.start_time;
  const rangeEnd = timeRange?.end ?? item.end_time;
  const actionButtonClass = "w-full rounded-md border px-3 py-2 text-xs font-semibold transition disabled:opacity-50";
  const selectedStatus = getStatusVisual({
    status: item.status,
    isFinalized: item.is_finalized,
    financialPending: item.financial_pending,
  });

  return (
    <div className="grid gap-3 px-1 py-1">
      <p className="text-xl font-semibold leading-none" style={{ color: "var(--foreground)" }}>
        {rangeStart.slice(0, 5)} - {rangeEnd.slice(0, 5)}
      </p>

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {item.alumno_name}
          </p>
          <span
            className="inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            style={selectedStatus.style}
          >
            {selectedStatus.label}
          </span>
        </div>

        {slotBookings && slotBookings.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {slotBookings.map((booking) => {
              const isSelected = selectedBookingId === booking.id;
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => onSelectBooking?.(booking.id)}
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
                  style={
                    isSelected
                      ? { borderColor: "var(--misu)", background: "color-mix(in srgb, var(--misu) 14%, var(--surface-2))", color: "var(--foreground)" }
                      : { borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--muted)" }
                  }
                >
                  {booking.alumno_name}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Categoría</p>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{item.alumno_category || "No definida"}</p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Rama</p>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{item.alumno_branch || "No definida"}</p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Paleta/Raqueta</p>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{item.alumno_has_equipment ? "Sí" : "No"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="grid gap-1 text-sm" style={{ color: "var(--muted)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Monto estimado: ${item.estimated_amount.toLocaleString("es-AR")}
          </p>
          {item.package_consumed || item.has_coverage_payment ? (
            <p className="text-xs">
              {item.package_consumed ? "Cubre paquete" : null}
              {item.package_consumed && item.has_coverage_payment ? " · " : null}
              {item.has_coverage_payment ? "Tiene cobro asociado" : null}
            </p>
          ) : null}
        </div>

        {item.is_finalized && item.financial_pending ? (
          <p
            className="mt-2 rounded-md border px-2 py-1 text-xs font-medium"
            style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)", color: "var(--warning)" }}
          >
            Clase finalizada · cobro pendiente.
          </p>
        ) : item.is_finalized && !item.financial_pending ? (
          <p
            className="mt-2 rounded-md border px-2 py-1 text-xs font-medium"
            style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
          >
            Clase finalizada · cobro cubierto.
          </p>
        ) : null}

        {confirmState.error ? (
          <p className="mt-2 rounded-md border px-3 py-2 text-xs" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)", color: "var(--error)" }}>
            {confirmState.error}
          </p>
        ) : null}
        {cancelState.error ? (
          <p className="mt-2 rounded-md border px-3 py-2 text-xs" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)", color: "var(--error)" }}>
            {cancelState.error}
          </p>
        ) : null}

        {item.status === "pendiente" ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <form action={cancelAction}>
              <input type="hidden" name="booking_id" value={item.id} />
              <button
                disabled={confirmPending || cancelPending}
                className={actionButtonClass}
                style={{ borderColor: "var(--error)", background: "var(--error)", color: "#fff" }}
              >
                {cancelPending ? "Cancelando..." : "Cancelar"}
              </button>
            </form>
            <form action={confirmAction}>
              <input type="hidden" name="booking_id" value={item.id} />
              <button
                disabled={confirmPending || cancelPending}
                className={actionButtonClass}
                style={{ borderColor: "var(--success)", background: "var(--success)", color: "#fff" }}
              >
                {confirmPending ? "Confirmando..." : "Confirmar"}
              </button>
            </form>
          </div>
        ) : null}

        {item.status === "confirmado" ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <form action={cancelAction}>
              <input type="hidden" name="booking_id" value={item.id} />
              <button
                disabled={cancelPending}
                className={actionButtonClass}
                style={{ borderColor: "var(--error)", background: "var(--error)", color: "#fff" }}
              >
                {cancelPending ? "Cancelando..." : "Cancelar"}
              </button>
            </form>

            {item.financial_pending ? (
              <form action={createDebtChargeQuickAction}>
                <input type="hidden" name="booking_id" value={item.id} />
                <input type="hidden" name="alumno_id" value={item.alumno_id} />
                <input type="hidden" name="amount" value={item.estimated_amount || 0} />
                <input type="hidden" name="method" value="efectivo" />
                <input type="hidden" name="note" value="" />
                <button
                  className={actionButtonClass}
                  style={{ borderColor: "var(--misu)", background: "var(--misu)", color: "#fff" }}
                >
                  Cobrar
                </button>
              </form>
            ) : (
              <div
                className={`inline-flex items-center justify-center ${actionButtonClass}`}
                style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
              >
                Cobrado
              </div>
            )}
          </div>
        ) : null}

        {item.status === "pendiente" || item.status === "confirmado" ? (
          <div className="mt-2">
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
          </div>
        ) : null}
      </div>

      {showNextClasses ? (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
          {item.next_classes.length === 0 ? (
            <p>Sin clases próximas.</p>
          ) : (
            <ul className="grid gap-1 text-xs">
              {item.next_classes.slice(0, 1).map((nextClass) => (
                <li key={nextClass.id} className="truncate">
                  {nextClass.date} · {nextClass.start_time.slice(0, 5)}-{nextClass.end_time.slice(0, 5)} · {nextClass.type_label}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <ProfesorNoteEditor key={item.alumno_id} alumnoId={item.alumno_id} initialNote={item.profesor_note} />
      </div>
    </div>
  );
}
