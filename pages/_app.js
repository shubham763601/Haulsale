// pages/_app.js
import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import UserContext from '../lib/userContext'
import { CartProvider } from '../context/CartContext'

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [initialised, setInitialised] = useState(false)

  // Load current session once on app start
  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(data?.session?.user ?? null)
      setInitialised(true)
    }

    loadSession()

    // subscribe to auth changes (login/logout from any tab)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  // Optional: simple splash while checking auth once
  if (!initialised) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </UserContext.Provider>
  )
}

export default MyApp