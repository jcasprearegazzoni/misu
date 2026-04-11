alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'booking_created',
    'booking_confirmed',
    'booking_cancelled',
    'booking_reprogrammed',
    'package_assigned',
    'solo_decision_created',
    'solo_decision_timeout',
    'solo_decision_accepted_individual',
    'club_invitacion',
    'club_invitacion_respondida',
    'reserva_cancha_confirmada',
    'reserva_cancha_cancelada'
  ));
