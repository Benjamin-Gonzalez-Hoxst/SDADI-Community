-- SDADI Community - migración 002
-- Hace opcionales los campos 'problem' y 'solution' en la tabla de propuestas.
-- Ejecutar en Supabase SQL Editor si deseas permitir que las columnas admitan NULL directamente.

alter table public.proposals
  alter column problem drop not null,
  alter column solution drop not null;
