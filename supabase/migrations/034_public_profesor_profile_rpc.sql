create or replace function public.get_public_profesor_by_username(
  p_username text
)
returns table (
  user_id uuid,
  username text,
  name text,
  bio text,
  sport text
)
language sql
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.username,
    coalesce(nullif(trim(p.name), ''), 'Profesor') as name,
    p.bio,
    p.sport::text as sport
  from public.profiles p
  where p.role = 'profesor'
    and p.username is not null
    and lower(p.username) = lower(p_username)
  limit 1;
$$;

revoke all on function public.get_public_profesor_by_username(text) from public;
revoke all on function public.get_public_profesor_by_username(text) from anon;
revoke all on function public.get_public_profesor_by_username(text) from authenticated;
grant execute on function public.get_public_profesor_by_username(text) to anon;
grant execute on function public.get_public_profesor_by_username(text) to authenticated;
