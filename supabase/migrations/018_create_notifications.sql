create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'booking_created',
      'booking_confirmed',
      'booking_cancelled',
      'solo_decision_created',
      'solo_decision_timeout',
      'solo_decision_accepted_individual'
    )
  ),
  title text not null,
  message text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

revoke all on table public.notifications from public;
revoke all on table public.notifications from anon;
revoke all on table public.notifications from authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own_read_at" on public.notifications;
create policy "notifications_update_own_read_at"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.emit_notifications_from_solo_decisions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pendiente' then
    insert into public.notifications (user_id, type, title, message)
    values (
      new.alumno_id,
      'solo_decision_created',
      'Decision requerida',
      'Quedaste solo en un turno. Elegi si pasar a individual o cancelar.'
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'cancelada_timeout' then
      insert into public.notifications (user_id, type, title, message)
      values (
        new.alumno_id,
        'solo_decision_timeout',
        'Reserva cancelada por vencimiento',
        'Tu decision vencio y la reserva fue cancelada.'
      );
    elsif new.status = 'aceptada_individual' then
      insert into public.notifications (user_id, type, title, message)
      values (
        new.alumno_id,
        'solo_decision_accepted_individual',
        'Reserva pasada a individual',
        'Tu reserva fue actualizada a modalidad individual.'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_emit_notifications_from_solo_decisions on public.booking_solo_decisions;
create trigger trg_emit_notifications_from_solo_decisions
after insert or update of status on public.booking_solo_decisions
for each row
execute function public.emit_notifications_from_solo_decisions();

