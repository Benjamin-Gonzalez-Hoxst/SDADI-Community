-- SDADI Community - chat comunitario

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room text not null default 'general' check (room in ('general','ideas','proyectos')),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx on public.chat_messages(room, created_at desc);
alter table public.chat_messages enable row level security;

drop policy if exists chat_messages_authenticated_read on public.chat_messages;
create policy chat_messages_authenticated_read on public.chat_messages
  for select to authenticated using (true);
drop policy if exists chat_messages_authenticated_insert on public.chat_messages;
create policy chat_messages_authenticated_insert on public.chat_messages
  for insert to authenticated with check (author_id = auth.uid());
drop policy if exists chat_messages_author_delete on public.chat_messages;
create policy chat_messages_author_delete on public.chat_messages
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

grant select, insert, delete on public.chat_messages to authenticated;
