// frontend/pages/_app.js
import { useEffect, useState, createContext } from 'react'
import { supabase } from '../lib/supabaseClient'
import '../styles/globals.css' // keep if your project uses this - adjust path if needed

// Export the context so components can import it:
export const UserContext = createContext({ user: null, setUser: () => {} })

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // on mount, fetch current user (if any)
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data?.user ?? null)
      } catch (e) {
        console.error('getUser error', e)
        setUser(null)
      }
    }
    init()

    // subscribe to auth changes to keep UI updated
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // cleanup
    return () => {
      if (listener?.subscription) listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}

export default MyApp