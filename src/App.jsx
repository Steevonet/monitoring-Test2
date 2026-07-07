import { configManquante } from './lib/supabase'
import Shop from './pages/Shop'
import Dashboard from './pages/Dashboard'

// =============================================================
//  Routage ULTRA-SIMPLE (pas de librairie de routing).
//  On regarde juste l'adresse de la page :
//   - /dashboard  -> le monitoring
//   - tout le reste -> la boutique
// =============================================================
export default function App() {
  // GARDE-FOU : si les variables Supabase manquent, on affiche
  // un message clair au lieu d'un écran blanc qui fait paniquer.
  if (configManquante) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 24, fontFamily: 'system-ui' }}>
        <h1>⚠️ Configuration manquante</h1>
        <p>Les variables d'environnement Supabase ne sont pas définies.</p>
        <p>Sur <strong>Vercel</strong> : Settings → Environment Variables, ajoute :</p>
        <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 8 }}>
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...</pre>
        <p>Puis redéploie le projet. (En local : crée un fichier <code>.env</code>.)</p>
      </div>
    )
  }

  const estDashboard = window.location.pathname.startsWith('/dashboard')
  return estDashboard ? <Dashboard /> : <Shop />
}
