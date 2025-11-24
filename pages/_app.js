// pages/_app.js
import React, { useEffect, useState } from 'react'
import UserContext from '../lib/userContext'
import { supabase } from '../lib/supabaseClient'
import '../styles/globals.css'
import { CartProvider } from '../lib/cartContext'
// ...inside render
<UserContext.Provider value={{ user, setUser }}>
  <CartProvider>
    <Component {...pageProps} />
  </CartProvider>
</UserContext.Provider>

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data?.session?.user ?? null)
    }).catch(()=>{})

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      try { listener?.subscription?.unsubscribe() } catch (e) {}
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}

export default MyApp
