export type BookingStatus = "pendiente" | "confirmado" | "cancelado";
export type BookingType = "individual" | "dobles" | "trio" | "grupal";

export type CalendarBookingItem = {
  id: number;
  alumno_id: string;
  alumno_name: string;
  alumno_category: string | null;
  alumno_branch: string | null;
  alumno_zone: string | null;
  alumno_has_equipment: boolean;
  date: string;
  start_time: string;
  end_time: string;
  type: BookingType;
  type_label: string;
  status: BookingStatus;
  package_consumed: boolean;
  consumed_student_package_id: number | null;
  profesor_note: string;
  has_coverage_payment: boolean;
  financial_status_label: "Cubierto por paquete" | "Pagado" | "Pendiente";
  financial_pending: boolean;
  estimated_amount: number;
  next_classes: Array<{
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    type_label: string;
    status_label: string;
  }>;
};
