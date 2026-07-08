import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGenerateurAuto } from '../hooks/useGenerateurAuto'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'

// =============================================================
//  PAGE DASHBOARD (route "/dashboard")
//  Monitoring à 3 niveaux :
//   1. MÉTIER      -> vraies données Supabase (CA, commandes, courbes)
//   2. BASE DONNÉES -> santé technique mesurée (latence réelle, Realtime)
//   3. PLATEFORME  -> renvoi vers le vrai dashboard Vercel (assumé)
// =============================================================
export default function Dashboard() {
  // Le timer auto tourne tant qu'on est sur cette page (pouls de fond)
  useGenerateurAuto(4, 500)

  const [commandes, setCommandes] = useState([])
  const [latenceMs, setLatenceMs] = useState(null)
  const [realtimeOk, setRealtimeOk] = useState(false)

  // --- Chargement initial + mesure de la latence réelle ---
  async function charger() {
    if (!supabase) return
    const t0 = performance.now()
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    const t1 = performance.now()
    setLatenceMs(Math.round(t1 - t0)) // VRAIE latence de la requête
    setCommandes(data || [])
  }

  useEffect(() => {
    charger()

    // --- Realtime : le dashboard s'actualise quand une commande arrive ---
    if (!supabase) return
    const canal = supabase
      .channel('commandes-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setCommandes((prev) => [payload.new, ...prev])
        })
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(canal) }
  }, [])

  // --- Calculs métier ---
  const ca = commandes.reduce((s, c) => s + Number(c.total), 0)
  const nbManuel = commandes.filter((c) => c.source === 'manuel').length

  // Commandes par tranche de temps (les 20 dernières minutes)
  // Regroupement par date+minute (pas juste heure:minute) pour ne pas
  // mélanger des commandes de jours différents tombées sur la même heure.
  const parMinute = {}
  commandes.forEach((c) => {
    const date = new Date(c.created_at)
    const cle = date.toISOString().slice(0, 16) // ex: "2026-07-07T17:05"
    if (!parMinute[cle]) {
      parMinute[cle] = {
        cle,
        minute: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        nb: 0,
      }
    }
    parMinute[cle].nb += 1
  })
  const courbe = Object.values(parMinute)
    .sort((a, b) => a.cle.localeCompare(b.cle))
    .slice(-20)

  const Carte = ({ titre, valeur, sous }) => (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, flex: '1 1 220px' }}>
      <div style={{ color: '#666', fontSize: 13 }}>{titre}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{valeur}</div>
      {sous && <div style={{ color: '#999', fontSize: 12 }}>{sous}</div>}
    </div>
  )

  const Section = ({ children }) => (
    <h2 style={{ marginTop: 32, borderBottom: '2px solid #2563eb', paddingBottom: 4 }}>{children}</h2>
  )

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1>📊 Dashboard de monitoring — Vitashine</h1>
      <p><a href="/">← Retour à la boutique</a></p>

      {/* ---------- NIVEAU 1 : MÉTIER ---------- */}
      <Section>1️⃣ Niveau métier (données réelles)</Section>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Carte titre="Chiffre d'affaires" valeur={`${ca.toFixed(2)} €`} sous="cumul affiché" />
        <Carte titre="Commandes" valeur={commandes.length} />
        <Carte titre="dont manuelles 🛒" valeur={nbManuel} sous="tes clics" />
      </div>
      <div style={{ height: 240, marginTop: 16 }}>
        <ResponsiveContainer>
          <LineChart data={courbe}>
            <XAxis dataKey="minute" /><YAxis allowDecimals={false} /><Tooltip />
            <Line type="monotone" dataKey="nb" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ---------- NIVEAU 2 : BASE DE DONNÉES ---------- */}
      <Section>2️⃣ Niveau base de données (Supabase)</Section>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Carte titre="Latence requête" valeur={latenceMs != null ? `${latenceMs} ms` : '...'} sous="mesurée en direct" />
        <Carte titre="Realtime" valeur={realtimeOk ? '🟢 connecté' : '🔴 déconnecté'} />
        <Carte titre="Lignes chargées" valeur={commandes.length} />
      </div>

      {/* ---------- NIVEAU 3 : PLATEFORME ---------- */}
      <Section>3️⃣ Niveau plateforme (Vercel)</Section>
      <div style={{
        border: '1px dashed #f59e0b', background: '#fffbeb',
        borderRadius: 12, padding: 16,
      }}>
        <p style={{ margin: 0 }}>
          ⚠️ Ces indicateurs ne se mesurent <strong>pas</strong> depuis le code :
          ils sont fournis par Vercel. Pour les consulter, ouvre ton projet sur
          Vercel puis :
        </p>
        <ul>
          <li><strong>Analytics</strong> → visiteurs, pages vues</li>
          <li><strong>Speed Insights</strong> → vitesse de chargement (Web Vitals)</li>
          <li><strong>Deployments → Logs</strong> → historique des déploiements</li>
        </ul>
        <p style={{ margin: 0, color: '#92400e' }}>
          👉 C'est une vraie leçon de monitoring : certaines métriques, tu les
          mesures toi-même (ci-dessus), d'autres, c'est l'hébergeur qui te les donne.
        </p>
      </div>
    </div>
  )
}
