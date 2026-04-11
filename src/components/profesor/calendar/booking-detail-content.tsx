"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  compactMobile?: boolean;
};

export function BookingDetailContent({
  item,
  availabilityRanges,
  timeRange,
  slotBookings,
  selectedBookingId,
  onSelectBooking,
  showNextClasses = false,
  compactMobile = false,
}: BookingDetailContentProps) {
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmBookingAction, { error: null });
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelBookingAction, { error: null });
  const [isReprogramOpen, setIsReprogramOpen] = useState(false);
  const [reprogramSessionId, setReprogramSessionId] = useState(0);
  const [isAlumnoListOpen, setIsAlumnoListOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const alumnoDropdownRef = useRef<HTMLDivElement | null>(null);

  const rangeStart = timeRange?.start ?? item.start_time;
  const rangeEnd = timeRange?.end ?? item.end_time;
  const isMultiBookingSlot = Boolean(slotBookings && slotBookings.length > 1);
  const canReprogram = item.status === "pendiente" || item.status === "confirmado";
  const primaryActionClass = "w-full rounded-md border px-3 py-2 text-xs font-semibold transition disabled:opacity-50";
  const secondaryActionClass = "w-full rounded-md border px-3 py-2 text-xs font-semibold transition disabled:opacity-50";
  const tertiaryActionClass = "w-full rounded-md border px-3 py-2 text-xs font-medium transition disabled:opacity-50";
  const statusBadgeClass = compactMobile
    ? "inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold"
    : "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  const equipmentLabel = item.sport === "padel" ? "Paleta" : item.sport === "tenis" ? "Raqueta" : "Equipamiento";
  const selectedStatus = getStatusVisual({
    status: item.status,
    isFinalized: item.is_finalized,
    financialPending: item.financial_pending,
  });

  useEffect(() => {
    if (!isAlumnoListOpen) return undefined;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!alumnoDropdownRef.current?.contains(target)) {
        setIsAlumnoListOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAlumnoListOpen]);

  return (
    <>
      <div className="grid gap-2.5 px-0.5 py-0.5">
        <p className="text-xl font-semibold leading-none" style={{ color: "var(--foreground)" }}>
          {rangeStart.slice(0, 5)} - {rangeEnd.slice(0, 5)}
        </p>

        <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div ref={alumnoDropdownRef} className="relative">
            <div className="flex items-start justify-between gap-2">
              {isMultiBookingSlot ? (
                <button
                  type="button"
                  onClick={() => setIsAlumnoListOpen((prev) => !prev)}
                  className="inline-flex max-w-[75%] items-center gap-1 text-left text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ color: "var(--foreground)" }}
                  aria-expanded={isAlumnoListOpen}
                  aria-label="Cambiar alumno"
                >
                  <span className="truncate">{item.alumno_name}</span>
                  <span className="shrink-0" style={{ color: "var(--muted)" }} aria-hidden="true">
                    <svg
                      viewBox="0 0 10 6"
                      className={`h-2.5 w-2.5 transition-transform ${isAlumnoListOpen ? "rotate-180" : ""}`}
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              ) : (
                <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {item.alumno_name}
                </p>
              )}
              <span
                className={statusBadgeClass}
                style={selectedStatus.style}
              >
                {selectedStatus.label}
              </span>
            </div>

            {isMultiBookingSlot && isAlumnoListOpen ? (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-full rounded-md border p-1 shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                {slotBookings?.map((booking) => {
                  const isSelected = selectedBookingId === booking.id;
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => {
                        onSelectBooking?.(booking.id);
                        setIsAlumnoListOpen(false);
                      }}
                      className="w-full truncate rounded px-2 py-1.5 text-left text-xs font-medium"
                      style={
                        isSelected
                          ? {
                              background: "color-mix(in srgb, var(--misu) 14%, var(--surface-2))",
                              color: "var(--foreground)",
                            }
                          : { background: "transparent", color: "var(--muted)" }
                      }
                    >
                      {booking.alumno_name}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>Categoria</p>
              <p className="text-sm leading-5" style={{ color: "var(--foreground)" }}>{item.alumno_category || "No definida"}</p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>Rama</p>
              <p className="text-sm leading-5" style={{ color: "var(--foreground)" }}>{item.alumno_branch || "No definida"}</p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>{equipmentLabel}</p>
              <p className="text-sm leading-5" style={{ color: "var(--foreground)" }}>{item.alumno_has_equipment ? "Si" : "No"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div className="grid gap-1" style={{ color: "var(--muted)" }}>
            <p className="text-[15px] font-semibold leading-5" style={{ color: "var(--foreground)" }}>
              Monto estimado: ${item.estimated_amount.toLocaleString("es-AR")}
            </p>
            {item.package_consumed || item.has_coverage_payment ? (
              <p className="text-[11px]">
                {item.package_consumed ? "Cubre paquete" : null}
                {item.package_consumed && item.has_coverage_payment ? " - " : null}
                {item.has_coverage_payment ? "Tiene cobro asociado" : null}
              </p>
            ) : null}
          </div>

          {item.is_finalized && item.financial_pending ? (
            compactMobile ? (
              <p
                className="mt-2 border-l-2 pl-2 text-xs font-medium"
                style={{ borderLeftColor: "var(--warning)", color: "var(--warning)" }}
              >
                Clase finalizada - cobro pendiente.
              </p>
            ) : (
              <p
                className="mt-2 rounded-md border px-2 py-1 text-xs font-medium"
                style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)", color: "var(--warning)" }}
              >
                Clase finalizada - cobro pendiente.
              </p>
            )
          ) : item.is_finalized && !item.financial_pending ? (
            compactMobile ? (
              <p
                className="mt-2 border-l-2 pl-2 text-xs font-medium"
                style={{ borderLeftColor: "var(--success)", color: "var(--success)" }}
              >
                Clase finalizada - cobro cubierto.
              </p>
            ) : (
              <p
                className="mt-2 rounded-md border px-2 py-1 text-xs font-medium"
                style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
              >
                Clase finalizada - cobro cubierto.
              </p>
            )
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={confirmPending || cancelPending}
                className={secondaryActionClass}
                style={{ borderColor: "var(--error-border)", background: "var(--surface-1)", color: "var(--error)" }}
                onClick={() => setIsCancelConfirmOpen(true)}
              >
                {cancelPending ? "Cancelando..." : "Cancelar"}
              </button>
              <form action={confirmAction}>
                <input type="hidden" name="booking_id" value={item.id} />
                <button
                  disabled={confirmPending || cancelPending}
                  className={primaryActionClass}
                  style={{ borderColor: "var(--misu)", background: "var(--misu)", color: "#fff" }}
                >
                  {confirmPending ? "Confirmando..." : "Confirmar"}
                </button>
              </form>
            </div>
          ) : null}

          {item.status === "confirmado" ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cancelPending}
                className={secondaryActionClass}
                style={{ borderColor: "var(--error-border)", background: "var(--surface-1)", color: "var(--error)" }}
                onClick={() => setIsCancelConfirmOpen(true)}
              >
                {cancelPending ? "Cancelando..." : "Cancelar"}
              </button>

              {item.financial_pending ? (
                <form action={createDebtChargeQuickAction}>
                  <input type="hidden" name="booking_id" value={item.id} />
                  <input type="hidden" name="alumno_id" value={item.alumno_id} />
                  <input type="hidden" name="amount" value={item.estimated_amount || 0} />
                  <input type="hidden" name="method" value="efectivo" />
                  <input type="hidden" name="note" value="" />
                  <button
                    className={primaryActionClass}
                    style={{ borderColor: "var(--misu)", background: "var(--misu)", color: "#fff" }}
                  >
                    Cobrar
                  </button>
                </form>
              ) : (
                <div
                  className={`inline-flex items-center justify-center ${secondaryActionClass}`}
                  style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
                >
                  Cobrado
                </div>
              )}
            </div>
          ) : null}

          {canReprogram ? (
            <button
              type="button"
              className={`mt-2 ${tertiaryActionClass}`}
              style={{ borderColor: "var(--border)", background: "transparent", color: "var(--muted)" }}
              onClick={() => {
                setReprogramSessionId((prev) => prev + 1);
                setIsReprogramOpen(true);
              }}
            >
              Reprogramar
            </button>
          ) : null}
        </div>

        {showNextClasses ? (
          <div className="rounded-lg border p-2.5 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
            {item.next_classes.length === 0 ? (
              <p>Sin clases proximas.</p>
            ) : (
              <ul className="grid gap-1 text-xs">
                {item.next_classes.slice(0, 1).map((nextClass) => (
                  <li key={nextClass.id} className="truncate">
                    {nextClass.date} - {nextClass.start_time.slice(0, 5)}-{nextClass.end_time.slice(0, 5)} - {nextClass.type_label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <ProfesorNoteEditor key={item.alumno_id} alumnoId={item.alumno_id} initialNote={item.profesor_note} />
        </div>
      </div>

      {canReprogram ? (
        <ReprogramBookingPanel
          key={`reprogram-${item.id}-${reprogramSessionId}`}
          isOpen={isReprogramOpen}
          onRequestClose={() => setIsReprogramOpen(false)}
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

      {isCancelConfirmOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsCancelConfirmOpen(false)}
            aria-label="Cerrar confirmacion"
          />
          <div
            className="relative z-10 w-full max-w-[420px] rounded-xl border p-4 shadow-2xl"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Confirmar cancelacion
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              Esta accion cancelara la clase seleccionada.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={secondaryActionClass}
                style={{ borderColor: "var(--border)", background: "transparent", color: "var(--muted)" }}
                onClick={() => setIsCancelConfirmOpen(false)}
              >
                Volver
              </button>
              <form action={cancelAction}>
                <input type="hidden" name="booking_id" value={item.id} />
                <button
                  className={primaryActionClass}
                  style={{ borderColor: "var(--error)", background: "var(--error)", color: "#fff" }}
                  onClick={() => setIsCancelConfirmOpen(false)}
                >
                  {cancelPending ? "Cancelando..." : "Si, cancelar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
