// frontend/components/NavBar.js
import Link from 'next/link'
import { useContext } from 'react'
import { UserContext } from '../pages/_app' // import the context exported by _app.js
import { supabase } from '../lib/supabaseClient'

export default function NavBar() {
  const { user } = useContext(UserContext)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // auth state subscriber in _app will clear user
    } catch (err) {
      console.error('logout error', err)
    }
  }

  return (
    <header style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 700 }}>
        <Link href="/">Haullcell</Link>
      </div>

      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/">Marketplace</Link>

        {user ? (
          <>
            <Link href="/account">My Account</Link>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{user.email}</span>
            <button onClick={handleLogout} style={{ marginLeft: 8 }}>Logout</button>
          </>
        ) : (
          <Link href="/auth/login">Login / Sign up</Link>
        )}
      </nav>
    </header>
  )
}
