-- SDADI Community - migración 001
-- Añade el enlace opcional a las propuestas.
-- Ejecutar en Supabase SQL Editor si database/schema.sql ya estaba aplicado.

alter table public.proposals
  add column if not exists link_url text
  check (link_url is null or link_url ~ '^https?://[^[:space:]]+$');
