export const notificationTypes = [
  "booking_created",
  "booking_confirmed",
  "booking_cancelled",
  "booking_reprogrammed",
  "package_assigned",
  "solo_decision_created",
  "solo_decision_timeout",
  "solo_decision_accepted_individual",
  "reserva_cancha_confirmada",
  "reserva_cancha_cancelada",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

