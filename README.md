# 🐾 VitaPet — Projet du Module 5

Bienvenue ! Ce dossier contient un **faux site e-commerce** (vitamines pour chiens et chats)
avec un **dashboard de monitoring**. Ton objectif : le mettre en ligne et observer son activité.

Tout est déjà codé. Tu n'as **rien à programmer** : tu vas déployer et observer.

---

## 🗺️ Le parcours en 4 étapes

```
1. Créer la base de données (Supabase)
2. Mettre le code sur GitHub
3. Déployer sur Vercel
4. Observer le dashboard qui s'anime
```

---

## Étape 1 — La base de données (Supabase)

1. Va sur [supabase.com](https://supabase.com) et crée un projet (gratuit).
2. Dans le menu de gauche, ouvre **SQL Editor**.
3. Ouvre le fichier `supabase/schema.sql` de ce dossier, copie tout, colle dans l'éditeur, clique **Run**.
4. Fais pareil avec `supabase/seed.sql` (ça crée 60 jours de fausses commandes).
5. Va dans **Project Settings → API** et note 2 informations :
   - **Project URL** (ressemble à `https://xxxxx.supabase.co`)
   - **Publishable key** (commence par `sb_publishable_...`)

> 💡 Garde ces 2 valeurs sous la main, on en a besoin à l'étape 3.

---

## Étape 2 — Le code sur GitHub

1. Va sur [github.com](https://github.com) et connecte-toi (crée un compte si besoin).
2. Clique sur **New repository**, donne-lui un nom (ex. `vitapet`), laisse-le **public**, clique **Create**.
3. Sur la page du repo vide, clique sur le lien **uploading an existing file**.
4. **Glisse-dépose tous les fichiers de ce dossier** dans la fenêtre (sauf le dossier `node_modules` s'il existe).
5. Clique **Commit changes**.

> 💡 Pas besoin d'installer Git : l'upload par le site web suffit.

---

## Étape 3 — Le déploiement (Vercel)

1. Va sur [vercel.com](https://vercel.com) et connecte-toi **avec ton compte GitHub**.
2. Clique **Add New → Project**, choisis ton repo `vitapet`, clique **Import**.
3. ⚠️ **AVANT de cliquer Deploy**, ouvre la section **Environment Variables** et ajoute les 2 variables de l'étape 1 :

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | ton Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | ta clé `sb_publishable_...` |

4. Clique **Deploy** et attends ~1 minute.

> ⚠️ **Si tu oublies les variables**, le site affichera un message
> « Configuration manquante » (au lieu de planter). Il suffira de les ajouter
> dans Settings → Environment Variables, puis de redéployer.

---

## Étape 4 — Observer 🎉

- Ouvre l'adresse donnée par Vercel : tu vois la **boutique**.
- Ajoute `/dashboard` à la fin de l'adresse : tu vois le **monitoring**.
- Sur le dashboard, les commandes arrivent **toutes seules** (toutes les 4 secondes).
- Retourne sur la boutique, clique **« Passer une commande maintenant »**, puis
  reviens au dashboard : tu verras **ton** clic apparaître en direct (compteur « manuelles »).

C'est ça, la chaîne causale : **tu agis → la donnée est créée → tu l'observes.**

---

## 🔎 Les 3 niveaux du dashboard

| Niveau | Ce qu'il montre | D'où viennent les chiffres |
|--------|-----------------|---------------------------|
| **1. Métier** | CA, nombre de commandes, courbe | Calculés depuis Supabase |
| **2. Base de données** | latence réelle, statut temps réel | Mesurés en direct |
| **3. Plateforme** | visiteurs, vitesse | Dans le tableau de bord **Vercel** |

> Le niveau 3 ne s'affiche pas dans notre code : c'est Vercel qui fournit ces
> chiffres. Une vraie leçon de monitoring : on ne mesure pas tout soi-même.

---

## 🧪 Tester en local (optionnel)

```bash
npm install
cp .env.example .env   # puis remplis .env avec tes valeurs Supabase
npm run dev
```
