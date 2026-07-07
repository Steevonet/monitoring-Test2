-- ============================================================
--  Module 5 — Schéma de la base de données (Supabase / PostgreSQL)
--  Faux e-commerce : vitamines pour chiens et chats
-- ------------------------------------------------------------
--  À exécuter dans : Supabase → SQL Editor → coller → Run
--  Volontairement minimal : 3 tables, c'est tout ce qu'il faut.
-- ============================================================

-- 1) Les produits vendus sur le site (catalogue fixe)
create table if not exists products (
  id          bigint generated always as identity primary key,
  nom         text    not null,
  animal      text    not null,        -- 'chien' ou 'chat'
  prix        numeric not null,        -- en euros
  image_emoji text    default '💊'      -- un emoji en guise d'image (zéro upload à gérer)
);

-- 2) Les commandes passées (c'est CETTE table que le dashboard observe)
create table if not exists orders (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  total       numeric     not null,
  client_nom  text        not null,
  source      text        not null default 'auto'  -- 'auto' (timer) ou 'manuel' (bouton)
);

-- 3) Le détail de chaque commande (quel produit, quelle quantité)
create table if not exists order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint  not null references orders(id) on delete cascade,
  product_id  bigint  not null references products(id),
  quantite    int     not null default 1,
  prix_unit   numeric not null
);

-- ------------------------------------------------------------
--  Sécurité : Row Level Security (RLS)
-- ------------------------------------------------------------
--  On active RLS sur les 3 tables (bonne pratique = point de
--  cours pour le volet "sécurité" du module), puis on autorise
--  lecture + insertion publiques, car le site n'a pas de login.
--  C'est un choix ASSUMÉ pour un projet pédagogique avec fausse
--  data : on montre RLS activé, puis on ouvre volontairement.
-- ------------------------------------------------------------

alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Lecture publique (le site et le dashboard lisent tout)
create policy "lecture publique products"
  on products for select using (true);
create policy "lecture publique orders"
  on orders for select using (true);
create policy "lecture publique order_items"
  on order_items for select using (true);

-- Insertion publique (le site crée des commandes sans login)
create policy "insertion publique orders"
  on orders for insert with check (true);
create policy "insertion publique order_items"
  on order_items for insert with check (true);

-- ------------------------------------------------------------
--  Temps réel : on autorise le dashboard à "écouter" la table
--  orders (Supabase Realtime). C'est ce qui fait que le
--  dashboard se met à jour TOUT SEUL quand une commande arrive.
-- ------------------------------------------------------------
alter publication supabase_realtime add table orders;
