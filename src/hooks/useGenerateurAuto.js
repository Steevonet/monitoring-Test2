import { useEffect } from 'react'
import { genererCommande } from '../lib/generateOrder'

// =============================================================
//  useGenerateurAuto()
//  Lance une fausse commande toutes les X secondes, tant que
//  l'app est ouverte. C'est le "pouls de fond" du dashboard.
//
//  - intervalleSecondes : cadence (4 s par défaut = lent et lisible)
//  - maxCommandes : sécurité, on arrête après N commandes pour ne
//    pas exploser la base si un onglet reste ouvert toute la nuit.
// =============================================================
export function useGenerateurAuto(intervalleSecondes = 4, maxCommandes = 500) {
  useEffect(() => {
    let compteur = 0

    const id = setInterval(() => {
      if (compteur >= maxCommandes) {
        clearInterval(id)
        return
      }
      genererCommande('auto')
      compteur++
    }, intervalleSecondes * 1000)

    // nettoyage quand on quitte la page
    return () => clearInterval(id)
  }, [intervalleSecondes, maxCommandes])
}
