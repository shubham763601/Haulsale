import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function NavBar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
    }
    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription?.unsubscribe?.()
  }, [])

  return (
    <nav>
      {/* show nav items based on user */}
      {user ? <a href="/account">My Account</a> : <a href="/auth/login">Login / Sign up</a>}
    </nav>
  )
}
