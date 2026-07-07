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
--  la LECTURE publique, car le site n'a pas de login et le
--  dashboard est justement pensé comme une page publique.
--  C'est un choix ASSUMÉ pour un projet pédagogique avec fausse
--  data : on montre RLS activé, puis on ouvre volontairement.
--
--  En revanche, l'ÉCRITURE n'est PAS ouverte directement sur les
--  tables : voir plus bas, la création de commande passe par la
--  fonction creer_commande(), qui valide les données et recalcule
--  le total à partir des vrais prix (au lieu de faire confiance à
--  une valeur envoyée par le client).
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

-- ------------------------------------------------------------
--  Création de commande sécurisée
-- ------------------------------------------------------------
--  Aucune policy d'INSERT publique sur orders/order_items : un
--  client (ou n'importe qui appelant l'API REST directement) ne
--  peut donc plus fabriquer une commande avec un total arbitraire
--  ou des lignes ne correspondant à aucun vrai produit.
--  À la place, toute commande passe par cette fonction, qui :
--   - valide la source ('auto' ou 'manuel')
--   - valide chaque ligne (produit existant, quantité 1 à 10)
--   - recalcule le total à partir des VRAIS prix du catalogue
-- ------------------------------------------------------------
create or replace function creer_commande(p_source text, p_lignes jsonb)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_commande orders;
  v_total numeric := 0;
  v_ligne jsonb;
  v_product_id bigint;
  v_quantite int;
  v_prix numeric;
  v_client_nom text;
  prenoms text[] := array['Léa','Hugo','Emma','Lucas','Chloé','Nathan','Manon','Tom','Jade','Louis','Inès','Sacha'];
begin
  if p_source not in ('auto', 'manuel') then
    raise exception 'source invalide';
  end if;

  if p_lignes is null or jsonb_array_length(p_lignes) = 0 or jsonb_array_length(p_lignes) > 10 then
    raise exception 'lignes de commande invalides';
  end if;

  v_client_nom := prenoms[1 + floor(random() * array_length(prenoms, 1))::int];

  insert into orders (total, client_nom, source)
  values (0, v_client_nom, p_source)
  returning * into v_commande;

  for v_ligne in select * from jsonb_array_elements(p_lignes)
  loop
    v_product_id := (v_ligne->>'product_id')::bigint;
    v_quantite := (v_ligne->>'quantite')::int;

    if v_quantite is null or v_quantite < 1 or v_quantite > 10 then
      raise exception 'quantité invalide';
    end if;

    select prix into v_prix from products where id = v_product_id;
    if v_prix is null then
      raise exception 'produit invalide: %', v_product_id;
    end if;

    insert into order_items (order_id, product_id, quantite, prix_unit)
    values (v_commande.id, v_product_id, v_quantite, v_prix);

    v_total := v_total + (v_prix * v_quantite);
  end loop;

  update orders set total = round(v_total, 2) where id = v_commande.id
  returning * into v_commande;

  return v_commande;
end;
$$;

grant execute on function creer_commande(text, jsonb) to anon, authenticated;

-- ------------------------------------------------------------
--  Temps réel : on autorise le dashboard à "écouter" la table
--  orders (Supabase Realtime). C'est ce qui fait que le
--  dashboard se met à jour TOUT SEUL quand une commande arrive.
-- ------------------------------------------------------------
alter publication supabase_realtime add table orders;
