-- SDADI Community - moderación, administración y protección antispam
-- Ejecutar después de schema.sql, policies.sql y grants.sql.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy profiles_admin_read on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy reports_admin_read on public.reports
  for select to authenticated using (public.is_admin() or reporter_id = auth.uid());

create policy reports_admin_update on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.enforce_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  recent_count integer;
  actor_column text := case when tg_table_name = 'reports' then 'reporter_id' else 'author_id' end;
begin
  if actor is null then
    return new;
  end if;

  execute format(
    'select count(*) from public.%I where %I = $1 and created_at > now() - interval ''10 minutes''',
    tg_table_name, actor_column
  ) into recent_count using actor;

  if recent_count >= 20 then
    raise exception 'Demasiadas acciones en poco tiempo. Intenta nuevamente más tarde.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_rate_limit on public.proposals;
create trigger proposals_rate_limit before insert on public.proposals
  for each row execute function public.enforce_submission_rate_limit();
drop trigger if exists comments_rate_limit on public.comments;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.enforce_submission_rate_limit();
drop trigger if exists community_posts_rate_limit on public.community_posts;
create trigger community_posts_rate_limit before insert on public.community_posts
  for each row execute function public.enforce_submission_rate_limit();
drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.enforce_submission_rate_limit();
