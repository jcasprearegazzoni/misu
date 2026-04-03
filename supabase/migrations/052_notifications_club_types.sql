ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'booking_created',
    'booking_confirmed',
    'booking_cancelled',
    'solo_decision_created',
    'solo_decision_timeout',
    'solo_decision_accepted_individual',
    'club_invitacion',
    'club_invitacion_respondida'
  ));
