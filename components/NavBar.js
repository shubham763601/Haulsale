// components/NavBar.js
import React, { useContext } from 'react'
import Link from 'next/link'
import UserContext from '../lib/userContext'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import CartIcon from './CartIcon'

export default function NavBar() {
  const { user, setUser } = useContext(UserContext)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="w-full bg-transparent border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center gap-4 p-4">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <a className="flex items-center gap-3 group">
              {/* logo circle */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow">
                H
              </div>

              {/* brand name hidden on very small screens */}
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">Haullcell</span>
                <span className="text-xs text-gray-400 -mt-0.5 hidden md:block">Wholesale marketplace</span>
              </div>
            </a>
          </Link>
        </div>

        {/* Middle: primary nav (hidden on small screens) */}
        <div className="flex-1 hidden md:flex items-center gap-6 ml-6">
          <Link href="/products">
            <a className="flex items-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition" title="Browse products">
              {/* products / catalog icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M2 6a2 2 0 012-2h3v10H4a2 2 0 01-2-2V6zM9 4h7a2 2 0 012 2v6a2 2 0 01-2 2H9V4z" />
              </svg>
              <span className="text-sm text-gray-200">Products</span>
            </a>
          </Link>

          <Link href="/seller">
            <a className="flex items-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition" title="Sell on Haullcell">
              {/* seller icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M4 3h12v2H4V3zM3 8h14v9H3V8z" />
              </svg>
              <span className="text-sm text-gray-200">Sell</span>
            </a>
          </Link>

          <Link href="/about">
            <a className="flex items-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition" title="About Haullcell">
              {/* info icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9 9h2v6H9V9zM9 5h2v2H9V5z" />
              </svg>
              <span className="text-sm text-gray-200">About</span>
            </a>
          </Link>
        </div>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-3">
          {/* cart */}
          <CartIcon />

          {/* account / auth */}
          {user ? (
            <>
              <Link href="/account">
                <a
                  className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/5 transition"
                  title="Account"
                >
                  {/* user icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 18a8 8 0 0116 0H2z" />
                  </svg>

                  <span className="hidden sm:inline text-sm text-gray-200 truncate max-w-[12rem]">
                    {user.email}
                  </span>
                </a>
              </Link>

              <button onClick={handleSignOut} className="px-3 py-1 rounded bg-red-600 hover:opacity-90 text-white">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <a className="px-3 py-1 rounded hover:bg-white/5 transition text-sm">Sign in</a>
              </Link>

              <Link href="/auth/signup">
                <a className="px-3 py-1 rounded bg-indigo-600 hover:opacity-90 text-white">Sign up</a>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

