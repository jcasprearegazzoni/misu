-- Amplía la tabla clubs con datos de contacto y servicios.

alter table public.clubs
  add column if not exists cuit text,
  add column if not exists telefono text,
  add column if not exists email_contacto text,
  add column if not exists website text,
  add column if not exists tiene_bar boolean not null default false,
  add column if not exists tiene_estacionamiento boolean not null default false,
  add column if not exists alquila_paletas boolean not null default false,
  add column if not exists alquila_raquetas boolean not null default false,
  add column if not exists tiene_vestuario boolean not null default false,
  add column if not exists tiene_parrilla boolean not null default false;
