// frontend/components/NavBar.js
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient' // <- use the shared client

export default function NavBar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1) initial check
    let mounted = true
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        setUser(data?.user ?? null)
      } catch (err) {
        console.error('NavBar: getUser error', err)
      }
    }
    init()

    // 2) subscribe to auth changes (login / logout / token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      mounted = false
      // unsubscribe safely
      authListener?.subscription?.unsubscribe?.()
    }
  }, [])

  return (
    <header className="site-header">
      <nav className="nav">
        <Link href="/"><a className="logo">Haullcell</a></Link>

        <div className="nav-right">
          {user ? (
            <>
              <Link href="/account"><a>My Account</a></Link>
              <span style={{ marginLeft: 12, fontSize: 14 }}>{user.email}</span>
            </>
          ) : (
            <Link href="/auth/login"><a>Login / Sign up</a></Link>
          )}
        </div>
      </nav>
      <style jsx>{`
        .nav { display:flex; justify-content:space-between; align-items:center; padding:12px 20px; }
        .nav-right { display:flex; align-items:center; gap:8px; }
      `}</style>
    </header>
  )
}
