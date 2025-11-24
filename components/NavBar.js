// components/NavBar.js
import React, { useContext } from 'react'
import Link from 'next/link'
import UserContext from '../lib/userContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { ShoppingCart, User, LogOut, LogIn, UserPlus } from 'lucide-react'

export default function NavBar() {
  const { user, setUser } = useContext(UserContext)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="p-4 flex items-center gap-6 bg-yellow-400 text-black font-bold">
      <Link href="/">
        <a className="text-xl">🔥 Haulcell (test navbar) 🔥</a>
      </Link>

      <div className="ml-auto flex items-center gap-4">
        {/* Cart Icon */}
        <Link href="/cart">
          <a aria-label="Cart">
            <ShoppingCart size={28} />
          </a>
        </Link>

        {/* User logged in */}
        {user ? (
          <>
            <Link href="/account">
              <a title="Account">
                <User size={26} />
              </a>
            </Link>

            <button onClick={handleSignOut} title="Sign out">
              <LogOut size={26} />
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <a title="Sign in">
                <LogIn size={26} />
              </a>
            </Link>

            <Link href="/auth/signup">
              <a title="Sign up">
                <UserPlus size={26} />
              </a>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
