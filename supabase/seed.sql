-- ============================================================
--  Module 5 — Données de départ (seed)
-- ------------------------------------------------------------
--  À exécuter APRÈS schema.sql, dans Supabase → SQL Editor.
--  Crée le catalogue + ~60 jours de fausses commandes pour que
--  le dashboard affiche déjà de belles courbes au démarrage.
-- ============================================================

-- ---------- 1) Le catalogue de vitamines ----------
insert into products (nom, animal, prix, image_emoji) values
  ('Multivitamines Toutou',        'chien', 19.90, '🦴'),
  ('Oméga-3 Pelage Brillant',      'chien', 24.50, '🐕'),
  ('Articulations Senior',         'chien', 29.90, '🦮'),
  ('Calme & Sérénité',             'chien', 22.00, '🐶'),
  ('Vitalité Minou',               'chat',  18.90, '🐱'),
  ('Boules de Poils Stop',         'chat',  16.50, '🐈'),
  ('Défenses Immunitaires Félin',  'chat',  21.90, '😺'),
  ('Hydratation Rénale',           'chat',  27.00, '🐾');

-- ---------- 2) 60 jours d'historique de commandes ----------
-- On génère entre 3 et 12 commandes par jour sur les 60 derniers
-- jours. Pour chaque commande : 1 à 3 produits au hasard.
-- (Bloc PL/pgSQL — on n'a PAS besoin que les élèves comprennent
--  ce SQL : ils l'exécutent une fois, c'est de la prépa de data.)

do $$
declare
  jour        int;
  nb_du_jour  int;
  cmd         int;
  new_order   bigint;
  prod        record;
  nb_lignes   int;
  ligne       int;
  qte         int;
  total_cmd   numeric;
  prenoms     text[] := array['Léa','Hugo','Emma','Lucas','Chloé','Nathan','Manon','Tom','Jade','Louis','Inès','Sacha','Lina','Noah','Zoé'];
begin
  for jour in 0..59 loop
    nb_du_jour := 3 + floor(random() * 10)::int;   -- 3 à 12 commandes
    for cmd in 1..nb_du_jour loop
      total_cmd := 0;
      -- créer la commande (date répartie dans la journée)
      insert into orders (created_at, total, client_nom, source)
      values (
        now() - (jour || ' days')::interval - (floor(random()*86400) || ' seconds')::interval,
        0,
        prenoms[1 + floor(random() * array_length(prenoms,1))::int],
        'auto'
      )
      returning id into new_order;

      -- 1 à 3 lignes de produits
      nb_lignes := 1 + floor(random() * 3)::int;
      for ligne in 1..nb_lignes loop
        select * into prod from products order by random() limit 1;
        qte := 1 + floor(random() * 2)::int;       -- 1 ou 2
        insert into order_items (order_id, product_id, quantite, prix_unit)
        values (new_order, prod.id, qte, prod.prix);
        total_cmd := total_cmd + (prod.prix * qte);
      end loop;

      -- mettre à jour le total de la commande
      update orders set total = total_cmd where id = new_order;
    end loop;
  end loop;
end $$;
