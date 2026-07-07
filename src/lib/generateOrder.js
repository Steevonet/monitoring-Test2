import { supabase } from './supabase'

function auHasard(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)]
}

// =============================================================
//  genererCommande(source)
//  La SEULE fonction qui crée une commande.
//  - appelée par le TIMER  -> source = 'auto'
//  - appelée par le BOUTON -> source = 'manuel'
//  Le total et le nom client sont calculés côté SERVEUR (fonction
//  Postgres `creer_commande`) à partir des vrais prix du catalogue :
//  le client se contente de choisir quels produits et en quelle
//  quantité, il ne peut plus imposer un total arbitraire.
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
  for (let i = 0; i < nbLignes; i++) {
    const p = auHasard(produits)
    const qte = 1 + Math.floor(Math.random() * 2) // 1 ou 2
    lignes.push({ product_id: p.id, quantite: qte })
  }

  // 3) La fonction serveur valide les lignes, recalcule le total
  // à partir des vrais prix, et crée la commande + ses lignes.
  const { data: commande, error: errCmd } = await supabase
    .rpc('creer_commande', { p_source: source, p_lignes: lignes })
  if (errCmd || !commande) return

  return commande
}
