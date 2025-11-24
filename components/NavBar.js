// components/NavBar.js
import React, { useContext } from 'react'
import Link from 'next/link'
import UserContext from '../lib/userContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function NavBar() {
  const { user, setUser } = useContext(UserContext)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <nav style={{ display: 'flex', gap: 16, padding: 12 }}>
      <Link href="/"><a>Marketplace</a></Link>
      <Link href="/products"><a>Products</a></Link>

      <div style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>{user.email}</span>
            <button onClick={() => router.push('/account')}>Account</button>
            <button onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/auth/login')}>Sign in</button>
            <button onClick={() => router.push('/auth/signup')}>Sign up</button>
          </>
        )}
      </div>
    </nav>
  )
}
