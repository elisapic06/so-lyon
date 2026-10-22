-- ============================================================
-- So Lyon — schéma Supabase
-- À coller dans Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- Table des profils (liée aux utilisateurs auth de Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null default 'Nouveau lion',
  bio text default '',
  avatar_emoji text default '🦁',
  points integer default 0,
  account_type text not null default 'particulier',  -- 'particulier' | 'pro'
  claimed_place_id text default '',                  -- id OSM du lieu revendiqué (comptes pro)
  created_at timestamptz default now()
);

-- Table des posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles(id) on delete cascade,
  place_id text,                -- id OSM (ex: "n123456")
  place_name text,
  text text not null default '',
  photo_url text,               -- URL Supabase Storage (bucket 'photos')
  likes integer default 0,
  created_at timestamptz default now()
);

-- Followers
create table if not exists public.follows (
  follower uuid not null references public.profiles(id) on delete cascade,
  followed uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower, followed)
);

-- To-do list (publiques visibles par tous, privées visibles par leur auteur)
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles(id) on delete cascade,
  txt text not null,
  done boolean default false,
  pub boolean default true,
  created_at timestamptz default now()
);

-- Likes (qui a liké quoi — évite les double-likes)
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- Check-ins (compte pour les défis/badges)
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id text not null,
  place_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- Sécurité (RLS) : chacun ne voit/modifie que ce qui lui appartient,
-- les contenus publics sont lisibles par tous
-- ============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.todos enable row level security;
alter table public.post_likes enable row level security;
alter table public.checkins enable row level security;

-- Profils : lisibles par tous, modifiables par soi-même
create policy "profils publics" on public.profiles for select using (true);
create policy "créer son profil" on public.profiles for insert with check (auth.uid() = id);
create policy "modifier son profil" on public.profiles for update using (auth.uid() = id);

-- Posts : lisibles par tous, écriture par l'auteur uniquement
create policy "posts publics" on public.posts for select using (true);
create policy "publier" on public.posts for insert with check (auth.uid() = author);
create policy "supprimer son post" on public.posts for delete using (auth.uid() = author);

-- Likes de posts : incrément autorisé par n'importe quel utilisateur connecté
create policy "voir les likes" on public.post_likes for select using (true);
create policy "liker" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "unliker" on public.post_likes for delete using (auth.uid() = user_id);

-- Followers : public en lecture, on ne gère que ses propres follow
create policy "voir les follows" on public.follows for select using (true);
create policy "suivre" on public.follows for insert with check (auth.uid() = follower);
create policy "ne plus suivre" on public.follows for delete using (auth.uid() = follower);

-- Todos : publiques lisibles par tous ; privées par l'auteur seul
create policy "todos lisibles" on public.todos for select using (pub = true or auth.uid() = author);
create policy "créer todo" on public.todos for insert with check (auth.uid() = author);
create policy "modifier todo" on public.todos for update using (auth.uid() = author);
create policy "supprimer todo" on public.todos for delete using (auth.uid() = author);

-- Check-ins : visibles par tous (leaderboard), écriture par soi
create policy "voir checkins" on public.checkins for select using (true);
create policy "checkin" on public.checkins for insert with check (auth.uid() = user_id);

-- ============================================================
-- Storage : bucket 'photos' pour les photos de posts
-- (Dashboard > Storage > New bucket > "photos" > Public)
-- Politique ci-dessous : lecture publique, upload par utilisateur connecté
-- ============================================================
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos lisibles" on storage.objects for select using (bucket_id = 'photos');
create policy "upload photo" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

-- ============================================================
-- Trigger : créer automatiquement un profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name, account_type, claimed_place_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', 'lion_' || substr(new.id::text, 1, 6)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Nouveau lion'),
    coalesce(new.raw_user_meta_data->>'account_type', 'particulier'),
    coalesce(new.raw_user_meta_data->>'claimed_place_id', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ============================================================
-- Fonctions de compteur de likes (sûres, atomiques)
-- ============================================================
create or replace function public.increment_like(p uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set likes = likes + 1 where id = p;
$$;

create or replace function public.decrement_like(p uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set likes = greatest(likes - 1, 0) where id = p;
$$;

-- ============================================================
-- Commentaires
-- ============================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  txt text not null,
  created_at timestamptz default now()
);
alter table public.comments enable row level security;
create policy "commentaires lisibles" on public.comments for select using (true);
create policy "commenter" on public.comments for insert with check (auth.uid() = user_id);
create policy "supprimer son commentaire" on public.comments for delete using (auth.uid() = user_id);

-- ============================================================
-- Messagerie privée
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles(id) on delete cascade,
  receiver uuid not null references public.profiles(id) on delete cascade,
  txt text not null,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
-- on ne voit que les messages où l'on est expéditeur ou destinataire
create policy "messages visibles par les parties" on public.messages
  for select using (auth.uid() = sender or auth.uid() = receiver);
create policy "envoyer message" on public.messages
  for insert with check (auth.uid() = sender);
create policy "marquer lu" on public.messages
  for update using (auth.uid() = receiver);

-- conversations d'un utilisateur (vue pratique)
create or replace function public.my_conversations()
returns table (
  other_id uuid, other_handle text, other_name text, other_emoji text,
  last_txt text, last_at timestamptz, unread int
) language sql security definer set search_path = public as $$
  select
    case when m.sender = auth.uid() then m.receiver else m.sender end as other_id,
    p.handle, p.display_name, p.avatar_emoji,
    (array_agg(m.txt order by m.created_at desc))[1] as last_txt,
    max(m.created_at) as last_at,
    count(*) filter (where m.receiver = auth.uid() and m.read = false) as unread
  from public.messages m
  join public.profiles p
    on p.id = case when m.sender = auth.uid() then m.receiver else m.sender end
  where m.sender = auth.uid() or m.receiver = auth.uid()
  group by other_id, p.handle, p.display_name, p.avatar_emoji
  order by max(m.created_at) desc;
$$;

-- Partage de posts en messagerie : un message peut référencer un post
alter table public.messages
  add column if not exists shared_post uuid references public.posts(id) on delete set null;
