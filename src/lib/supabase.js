import { createClient } from '@supabase/supabase-js'

// On lit les deux variables d'environnement (configurées sur Vercel).
// IMPORTANT : avec Vite, une variable DOIT commencer par "VITE_"
// pour être accessible dans le navigateur.
const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// -------------------------------------------------------------
//  GARDE-FOU : si une variable manque, on le dit clairement
//  au lieu de laisser l'app planter sur un écran blanc.
//  (cf. App.jsx qui affiche un message lisible dans ce cas)
// -------------------------------------------------------------
export const configManquante = !url || !cle

// On crée le client seulement si la config est là.
export const supabase = configManquante
  ? null
  : createClient(url, cle)
