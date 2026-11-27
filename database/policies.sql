-- SDADI Community - Row Level Security
-- Ejecutar después de database/schema.sql.
-- Después ejecutar database/grants.sql para los permisos de tabla.

alter table public.profiles enable row level security;
alter table public.proposals enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.reports enable row level security;

create policy profiles_public_read on public.profiles for select using (true);
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy proposals_public_read on public.proposals for select using (status <> 'Archivada' or author_id = auth.uid());
create policy proposals_authenticated_insert on public.proposals for insert to authenticated with check (author_id = auth.uid());
create policy proposals_author_update on public.proposals for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy proposals_author_delete on public.proposals for delete to authenticated using (author_id = auth.uid());

create policy votes_public_read on public.votes for select using (true);
create policy votes_self_insert on public.votes for insert to authenticated with check (user_id = auth.uid());
create policy votes_self_delete on public.votes for delete to authenticated using (user_id = auth.uid());

create policy comments_public_read on public.comments for select using (true);
create policy comments_authenticated_insert on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy comments_author_update on public.comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_author_delete on public.comments for delete to authenticated using (author_id = auth.uid());

create policy projects_public_read on public.projects for select using (true);
create policy projects_owner_insert on public.projects for insert to authenticated with check (owner_id = auth.uid());
create policy projects_owner_update on public.projects for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy projects_owner_delete on public.projects for delete to authenticated using (owner_id = auth.uid());

create policy project_members_public_read on public.project_members for select using (true);
create policy project_members_self_request on public.project_members for insert to authenticated with check (user_id = auth.uid());
create policy project_members_owner_manage on public.project_members for update to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy project_members_self_leave on public.project_members for delete to authenticated using (user_id = auth.uid());

create policy community_posts_public_read on public.community_posts for select using (true);
create policy community_posts_authenticated_insert on public.community_posts for insert to authenticated with check (author_id = auth.uid());
create policy community_posts_author_update on public.community_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy community_posts_author_delete on public.community_posts for delete to authenticated using (author_id = auth.uid());

create policy reports_authenticated_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
-- Los reportes no se exponen al navegador. Moderación deberá usar un entorno seguro o service_role.
