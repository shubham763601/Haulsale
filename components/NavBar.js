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
    <nav className="p-4 flex items-center gap-4 bg-gray-900 text-white">
      <Link href="/"><a className="font-bold">Haulcell</a></Link>
      <div style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span className="mr-3">{user.email}</span>
            <button onClick={() => router.push('/account')} className="mr-2">Account</button>
            <button onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/auth/login')} className="mr-2">Sign in</button>
            <button onClick={() => router.push('/auth/signup')}>Sign up</button>
          </>
        )}
      </div>
    </nav>
  )
}
