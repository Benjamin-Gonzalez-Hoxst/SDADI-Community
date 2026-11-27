-- SDADI Community - permisos de tabla para los roles de Supabase
-- Ejecutar después de database/schema.sql y database/policies.sql.
-- RLS sigue limitando qué filas puede leer o modificar cada usuario.
-- Sin estos GRANT, el navegador recibe "permission denied for table ...".

grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.proposals, public.votes, public.comments,
  public.projects, public.project_members, public.community_posts
  to anon, authenticated;

grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.proposals to authenticated;
grant insert, delete on public.votes to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update, delete on public.projects to authenticated;
grant insert, update, delete on public.project_members to authenticated;
grant insert, update, delete on public.community_posts to authenticated;
grant insert on public.reports to authenticated;
grant update on public.reports to authenticated;
