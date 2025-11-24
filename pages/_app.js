// pages/_app.js
import React, { useEffect, useState } from 'react'
import UserContext from '../lib/userContext'
import { supabase } from '../lib/supabaseClient'
import '../styles/globals.css' // keep if you have global css

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true

    // Get initial session (if any)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data?.session?.user ?? null)
    }).catch(() => {
      if (!mounted) return
      setUser(null)
    })

    // Subscribe to auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      // unsubscribe safely
      try {
        listener?.subscription?.unsubscribe()
      } catch (e) {}
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}

export default MyApp
