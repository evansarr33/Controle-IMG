-- Schéma Supabase — Demande d'ordinateur AAE
-- À exécuter dans Supabase SQL Editor.
-- Ne collez jamais la service_role key ou la secret key dans le front-end.

create extension if not exists pgcrypto;

create table if not exists public.demandes (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  prenom text,
  nom text,
  email text,
  telephone text,
  date_naissance date,
  adresse text,
  code_postal text,
  ville text,
  statut_cfa text,
  formation text,
  niveau text,
  entreprise text,
  annee_formation text,
  poursuite_etudes boolean default false,
  formation_prevue text,
  etablissement text,
  ordinateur_requis boolean default false,
  possede_ordinateur boolean default false,
  ordinateur_fonctionne boolean default true,
  age_ordinateur text,
  salaire_net numeric default 0,
  boursier boolean default false,
  situation_familiale_difficile boolean default false,
  handicap boolean default false,
  engagement_cfa boolean default false,
  motivation text,
  signature text,
  score integer not null default 0,
  priorite text not null default 'Priorité 4',
  statut text not null default 'En attente' check (statut in ('En attente','Validée','Refusée')),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.pieces_justificatives (
  id uuid primary key default gen_random_uuid(),
  demande_id text not null references public.demandes(id) on delete cascade,
  created_at timestamptz not null default now(),
  type_piece text not null,
  nom_fichier text,
  taille bigint,
  mime_type text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.utilisateurs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text unique,
  nom text,
  role text not null default 'candidat' check (role in ('candidat','admin','commission'))
);

create table if not exists public.administrateurs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nom text,
  email text unique,
  actif boolean not null default true,
  role text not null default 'admin' check (role in ('admin','commission'))
);

create table if not exists public.historique_actions (
  id uuid primary key default gen_random_uuid(),
  demande_id text references public.demandes(id) on delete cascade,
  created_at timestamptz not null default now(),
  action text not null,
  auteur text default 'system',
  commentaire text,
  metadata jsonb not null default '{}'::jsonb
);


create table if not exists public.messages_internes (
  id uuid primary key default gen_random_uuid(),
  demande_id text not null references public.demandes(id) on delete cascade,
  created_at timestamptz not null default now(),
  auteur text not null default 'Commission',
  message text not null
);

create table if not exists public.parametres_notation (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  label text not null,
  points integer not null default 0,
  active boolean not null default true,
  ordre integer not null default 0
);

insert into public.parametres_notation (id, label, points, active, ordre) values
  ('continues','Poursuite d’études',30,true,10),
  ('higher','Entrée BTS/BUT/Licence/Bachelor/Master',20,true,20),
  ('required','Formation nécessitant un ordinateur',15,true,30),
  ('noComputer','Aucun ordinateur',25,true,40),
  ('oldComputer','Ordinateur de plus de 6 ans ou défectueux',10,true,50),
  ('scholarship','Boursier',20,true,60),
  ('lowSalary','Salaire < 1000 €',15,true,70),
  ('midSalary','Salaire entre 1000 € et 1400 €',10,true,80),
  ('familyIssue','Situation familiale difficile',15,true,90),
  ('disability','Handicap ou besoin spécifique',15,true,100),
  ('cfaLife','Participation à la vie du CFA',10,true,110)
on conflict (id) do update set label=excluded.label, points=excluded.points, active=excluded.active, ordre=excluded.ordre, updated_at=now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists demandes_set_updated_at on public.demandes;
create trigger demandes_set_updated_at before update on public.demandes for each row execute function public.set_updated_at();

drop trigger if exists notation_set_updated_at on public.parametres_notation;
create trigger notation_set_updated_at before update on public.parametres_notation for each row execute function public.set_updated_at();

alter table public.demandes enable row level security;
alter table public.pieces_justificatives enable row level security;
alter table public.utilisateurs enable row level security;
alter table public.administrateurs enable row level security;
alter table public.historique_actions enable row level security;
alter table public.parametres_notation enable row level security;
alter table public.messages_internes enable row level security;

-- Policies simples pour que le site statique fonctionne avec la clé anon.
-- Pour une production stricte, remplacez-les par Supabase Auth + rôles admin.
drop policy if exists "anon_insert_demandes" on public.demandes;
create policy "anon_insert_demandes" on public.demandes for insert to anon with check (true);
drop policy if exists "anon_read_demandes" on public.demandes;
create policy "anon_read_demandes" on public.demandes for select to anon using (true);
drop policy if exists "anon_update_demandes" on public.demandes;
create policy "anon_update_demandes" on public.demandes for update to anon using (true) with check (true);

drop policy if exists "anon_all_pieces" on public.pieces_justificatives;
create policy "anon_all_pieces" on public.pieces_justificatives for all to anon using (true) with check (true);
drop policy if exists "anon_all_historique" on public.historique_actions;
create policy "anon_all_historique" on public.historique_actions for all to anon using (true) with check (true);
drop policy if exists "anon_all_messages" on public.messages_internes;
create policy "anon_all_messages" on public.messages_internes for all to anon using (true) with check (true);
drop policy if exists "anon_read_notation" on public.parametres_notation;
create policy "anon_read_notation" on public.parametres_notation for select to anon using (true);
drop policy if exists "anon_write_notation" on public.parametres_notation;
create policy "anon_write_notation" on public.parametres_notation for all to anon using (true) with check (true);
