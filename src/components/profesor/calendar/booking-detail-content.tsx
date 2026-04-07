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
};

export function BookingDetailContent({
  item,
  availabilityRanges,
  timeRange,
  slotBookings,
  selectedBookingId,
  onSelectBooking,
}: BookingDetailContentProps) {
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmBookingAction, { error: null });
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelBookingAction, { error: null });

  const rangeStart = timeRange?.start ?? item.start_time;
  const rangeEnd = timeRange?.end ?? item.end_time;
  const actionButtonClass = "w-full rounded-md border px-3 py-2 text-xs font-semibold transition disabled:opacity-50";

  return (
    <div className="px-1 py-1">
      <p className="text-xl font-semibold leading-none" style={{ color: "var(--foreground)" }}>
        {rangeStart.slice(0, 5)} - {rangeEnd.slice(0, 5)}
      </p>

      {slotBookings && slotBookings.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {slotBookings.map((booking) => {
            const bookingStatus = getStatusVisual({
              status: booking.status,
              isFinalized: booking.is_finalized,
              financialPending: booking.financial_pending,
            });
            const isSelected = selectedBookingId === booking.id;
            return (
              <button
                key={booking.id}
                type="button"
                onClick={() => onSelectBooking?.(booking.id)}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                style={
                  isSelected
                    ? { borderColor: "var(--misu)", background: "var(--surface-1)", color: "var(--foreground)" }
                    : { borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--muted)" }
                }
              >
                <span>{booking.alumno_name}</span>
                <span className="inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold" style={bookingStatus.style}>
                  {bookingStatus.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
        <p>Categoría: {item.alumno_category || "No definida"}</p>
        <p>Rama: {item.alumno_branch || "No definida"}</p>
        <p>Paleta/Raqueta: {item.alumno_has_equipment ? "Sí" : "No"}</p>
      </div>

      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="grid gap-1 text-sm" style={{ color: "var(--muted)" }}>
          <p>Monto estimado: ${item.estimated_amount.toLocaleString("es-AR")}</p>
          {item.package_consumed ? <p>Cubierto por paquete: Sí</p> : null}
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

      <div className="mt-3 border-t pt-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        {item.next_classes.length === 0 ? (
          <p>Sin clases próximas.</p>
        ) : (
          <ul className="grid gap-1 text-xs">
            {item.next_classes.slice(0, 3).map((nextClass) => (
              <li key={nextClass.id} className="truncate">
                {nextClass.date} · {nextClass.start_time.slice(0, 5)}-{nextClass.end_time.slice(0, 5)} · {nextClass.type_label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <ProfesorNoteEditor key={item.alumno_id} alumnoId={item.alumno_id} initialNote={item.profesor_note} />
      </div>
    </div>
  );
}
