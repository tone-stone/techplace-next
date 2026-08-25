-- Portal de Redacción: perfiles con rol, artículos y bitácora de actividad.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create extension if not exists pgcrypto;

-- 1) profiles: uno por usuario de auth.users, guarda el rol (admin | redactor)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'redactor' check (role in ('admin', 'redactor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- crea automáticamente el perfil (rol redactor por defecto) al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  video_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles enable row level security;

drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published"
  on public.articles for select
  using (status = 'published');

drop policy if exists "articles_select_staff" on public.articles;
create policy "articles_select_staff"
  on public.articles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "articles_insert_staff" on public.articles;
create policy "articles_insert_staff"
  on public.articles for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "articles_update_staff" on public.articles;
create policy "articles_update_staff"
  on public.articles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "articles_delete_admin" on public.articles;
create policy "articles_delete_admin"
  on public.articles for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists articles_status_idx on public.articles (status);
create index if not exists articles_category_idx on public.articles (category);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- 3) activity_log: bitácora de creación/edición/eliminación, solo visible para admins
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_email text not null,
  action text not null check (action in ('creó', 'editó', 'eliminó')),
  article_id uuid,
  article_title text not null,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

drop policy if exists "activity_select_admin" on public.activity_log;
create policy "activity_select_admin"
  on public.activity_log for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "activity_insert_self" on public.activity_log;
create policy "activity_insert_self"
  on public.activity_log for insert
  with check (auth.uid() = actor_id);

-- 4) Storage: bucket público para fotos y videos del blog
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

drop policy if exists "blog_media_public_read" on storage.objects;
create policy "blog_media_public_read"
  on storage.objects for select
  using (bucket_id = 'blog-media');

drop policy if exists "blog_media_staff_insert" on storage.objects;
create policy "blog_media_staff_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'blog-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "blog_media_staff_delete" on storage.objects;
create policy "blog_media_staff_delete"
  on storage.objects for delete
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- 5) Promueve la primera cuenta admin.
-- Solo funciona si ese email YA inició sesión al menos una vez (así existe su fila en profiles).
-- Si todavía no existe la cuenta, créala primero en Authentication > Users > Add user.
update public.profiles set role = 'admin' where email = 'ing.antoniovilla@outlook.com';
