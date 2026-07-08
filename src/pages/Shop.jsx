import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { genererCommande } from '../lib/generateOrder'

// =============================================================
//  PAGE BOUTIQUE (route "/")
//  Le faux site qui vend des vitamines pour chiens et chats.
//  - affiche le catalogue
//  - un gros bouton "Passer une commande maintenant" qui
//    déclenche genererCommande('manuel') -> visible comme un PIC
//    dans le dashboard.
// =============================================================
export default function Shop() {
  const [produits, setProduits] = useState([])
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('products')
      .select('*')
      .order('id')
      .then(({ data }) => setProduits(data || []))
  }, [])

  async function commanderMaintenant() {
    if (enCours) return // évite les doublons sur double-clic / clics répétés
    setEnCours(true)
    setMessage('⏳ Commande en cours...')
    const cmd = await genererCommande('manuel')
    if (cmd) {
      setMessage(`✅ Commande #${cmd.id} de ${cmd.total} € enregistrée ! Va voir le dashboard.`)
    } else {
      setMessage('❌ Erreur : vérifie ta configuration Supabase.')
    }
    setEnCours(false)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Vitashine — ma boutique</h1>
      <p style={{ color: '#666' }}>
        Boutique de démonstration du Module 5. Clique sur le bouton ci-dessous
        pour passer une commande : elle apparaîtra <strong>en direct</strong> dans
        le dashboard de monitoring.
      </p>

      <button
        onClick={commanderMaintenant}
        disabled={enCours}
        style={{
          fontSize: 18, padding: '16px 24px', margin: '16px 0',
          background: enCours ? '#93b4f0' : '#2563eb', color: 'white', border: 'none',
          borderRadius: 12, cursor: enCours ? 'not-allowed' : 'pointer', fontWeight: 'bold',
        }}
      >
        {enCours ? '⏳ Commande en cours...' : '🛒 Passer une commande maintenant'}
      </button>

      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16, marginTop: 24,
      }}>
        {produits.map((p) => (
          <div key={p.id} style={{
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40 }}>{p.image_emoji}</div>
            <div style={{ fontWeight: 'bold', marginTop: 8 }}>{p.nom}</div>
            <div style={{ color: '#666', fontSize: 14 }}>
              {p.animal === 'chien' ? '🐕 Chien' : '🐱 Chat'}
            </div>
            <div style={{ marginTop: 8, fontSize: 18 }}>{p.prix} €</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 32 }}>
        <a href="/dashboard">→ Aller au dashboard de monitoring</a>
      </p>
    </div>
  )
}
