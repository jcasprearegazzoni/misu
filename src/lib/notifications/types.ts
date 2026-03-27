export const notificationTypes = [
  "booking_created",
  "booking_confirmed",
  "booking_cancelled",
  "solo_decision_created",
  "solo_decision_timeout",
  "solo_decision_accepted_individual",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

