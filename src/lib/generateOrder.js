import { supabase } from './supabase'

// Quelques prénoms au hasard pour les fausses commandes
const PRENOMS = ['Léa','Hugo','Emma','Lucas','Chloé','Nathan','Manon','Tom','Jade','Louis','Inès','Sacha']

function auHasard(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)]
}

// =============================================================
//  genererCommande(source)
//  La SEULE fonction qui crée une commande.
//  - appelée par le TIMER  -> source = 'auto'
//  - appelée par le BOUTON -> source = 'manuel'
//  C'est le même code dans les deux cas : un seul endroit à
//  comprendre et à maintenir.
// =============================================================
export async function genererCommande(source = 'auto') {
  if (!supabase) return // pas de config : on ne fait rien

  // 1) On récupère le catalogue pour piocher des produits
  const { data: produits, error: errProd } = await supabase
    .from('products')
    .select('*')
  if (errProd || !produits || produits.length === 0) return

  // 2) On choisit 1 à 3 produits au hasard
  const nbLignes = 1 + Math.floor(Math.random() * 3)
  const lignes = []
  let total = 0
  for (let i = 0; i < nbLignes; i++) {
    const p = auHasard(produits)
    const qte = 1 + Math.floor(Math.random() * 2) // 1 ou 2
    lignes.push({ product_id: p.id, quantite: qte, prix_unit: p.prix })
    total += p.prix * qte
  }

  // 3) On crée la commande, puis ses lignes de détail
  const { data: commande, error: errCmd } = await supabase
    .from('orders')
    .insert({
      total: Math.round(total * 100) / 100,
      client_nom: auHasard(PRENOMS),
      source, // 'auto' ou 'manuel' -> permet de colorer les pics manuels
    })
    .select()
    .single()
  if (errCmd || !commande) return

  await supabase
    .from('order_items')
    .insert(lignes.map((l) => ({ ...l, order_id: commande.id })))

  return commande
}
