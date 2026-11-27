-- SDADI Community - esquema inicial para Supabase/PostgreSQL
-- Ejecutar primero este archivo y después database/policies.sql.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 140),
  description text not null check (char_length(description) between 20 and 2000),
  problem text not null check (char_length(problem) between 20 and 3000),
  solution text not null check (char_length(solution) between 20 and 3000),
  category text not null check (category in ('Tecnología','Educación','Medioambiente','Comunidad','Salud y bienestar','Ciencia','Software','Diseño','Innovación','Otros')),
  status text not null default 'Nueva' check (status in ('Nueva','En evaluación','Aprobada','En desarrollo','Completada','Archivada')),
  tags text[] not null default '{}',
  link_url text check (link_url is null or link_url ~ '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (proposal_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid unique references public.proposals(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 5 and 140),
  description text not null check (char_length(description) between 20 and 3000),
  category text not null,
  status text not null default 'Planificación' check (status in ('Planificación','Buscando colaboradores','En desarrollo','En pausa','Completado')),
  progress integer not null default 0 check (progress between 0 and 100),
  github_url text check (github_url is null or github_url ~ '^https://github\.com/'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Colaborador' check (role in ('Colaborador','Responsable')),
  status text not null default 'Pendiente' check (status in ('Pendiente','Aceptado','Rechazado')),
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 140),
  content text not null check (char_length(content) between 1 and 5000),
  category text not null check (category in ('Debate','Anuncio','Pregunta','General')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('proposal','comment','project','community_post')),
  content_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  created_at timestamptz not null default now(),
  status text not null default 'Pendiente' check (status in ('Pendiente','En revisión','Resuelto','Descartado'))
);

create index if not exists proposals_author_id_idx on public.proposals(author_id);
create index if not exists proposals_category_idx on public.proposals(category);
create index if not exists proposals_status_idx on public.proposals(status);
create index if not exists proposals_created_at_idx on public.proposals(created_at desc);
create index if not exists votes_proposal_id_idx on public.votes(proposal_id);
create index if not exists comments_proposal_id_idx on public.comments(proposal_id);
create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists community_posts_created_at_idx on public.community_posts(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at before update on public.proposals for each row execute function public.set_updated_at();
drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at before update on public.comments for each row execute function public.set_updated_at();
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at before update on public.community_posts for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username',''), 'user_' || substr(replace(new.id::text,'-',''),1,10)),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name',''), split_part(coalesce(new.email,'Usuario'), '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

