export type DebtBookingBase = {
  id: number;
  alumno_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
  package_consumed: boolean;
};

export type PendingDebtBooking = {
  id: number;
  alumno_id: string;
  alumno_name: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  package_consumed: boolean;
  has_payment_coverage: boolean;
  financial_status: "Cubierto por paquete" | "Cubierto por payment" | "Pendiente";
  estimated_amount: number;
};

export type DebtSummaryByStudent = {
  alumno_id: string;
  alumno_name: string;
  bookings_count: number;
  estimated_total: number;
};

function getEstimatedAmountByType(
  bookingType: "individual" | "dobles" | "trio" | "grupal",
  priceIndividual: number | null,
  priceDobles: number | null,
  priceTrio: number | null,
  priceGrupal: number | null,
) {
  if (bookingType === "individual") {
    return Number(priceIndividual ?? 0);
  }

  if (bookingType === "dobles") {
    return Number(priceDobles ?? 0);
  }

  if (bookingType === "trio") {
    return Number(priceTrio ?? 0);
  }

  return Number(priceGrupal ?? 0);
}

export function buildPendingDebtBookings(params: {
  bookings: DebtBookingBase[];
  coveredBookingIds: Set<number>;
  alumnoNameMap: Map<string, string>;
  priceIndividual: number | null;
  priceDobles: number | null;
  priceTrio: number | null;
  priceGrupal: number | null;
}): PendingDebtBooking[] {
  return params.bookings
    .filter((booking) => booking.status === "confirmado")
    .map((booking) => {
      const hasPaymentCoverage = params.coveredBookingIds.has(booking.id);
      const financialStatus: PendingDebtBooking["financial_status"] = booking.package_consumed
        ? "Cubierto por paquete"
        : hasPaymentCoverage
          ? "Cubierto por payment"
          : "Pendiente";

      return {
        id: booking.id,
        alumno_id: booking.alumno_id,
        alumno_name: params.alumnoNameMap.get(booking.alumno_id) ?? "Alumno",
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        type: booking.type,
        package_consumed: booking.package_consumed,
        has_payment_coverage: hasPaymentCoverage,
        financial_status: financialStatus,
        estimated_amount: getEstimatedAmountByType(
          booking.type,
          params.priceIndividual,
          params.priceDobles,
          params.priceTrio,
          params.priceGrupal,
        ),
      };
    })
    .filter((booking) => booking.financial_status === "Pendiente")
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      return a.start_time.localeCompare(b.start_time);
    });
}

export function buildDebtSummaryByStudent(
  pendingBookings: PendingDebtBooking[],
): DebtSummaryByStudent[] {
  const summaryMap = new Map<string, DebtSummaryByStudent>();

  for (const booking of pendingBookings) {
    const current = summaryMap.get(booking.alumno_id);
    if (!current) {
      summaryMap.set(booking.alumno_id, {
        alumno_id: booking.alumno_id,
        alumno_name: booking.alumno_name,
        bookings_count: 1,
        estimated_total: booking.estimated_amount,
      });
      continue;
    }

    current.bookings_count += 1;
    current.estimated_total += booking.estimated_amount;
  }

  return Array.from(summaryMap.values()).sort((a, b) => b.estimated_total - a.estimated_total);
}
