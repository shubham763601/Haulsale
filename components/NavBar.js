// components/NavBar.js
import React, { useContext, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import UserContext from '../lib/userContext'
import { CartContext } from '../lib/cartContext'

export default function NavBar() {
  const router = useRouter()
  const { user, setUser } = useContext(UserContext)
  const { items } = useContext(CartContext) || { items: [] }

  const [mobileOpen, setMobileOpen] = useState(false)

  // optional: keep user in sync with Supabase session on first load
  useEffect(() => {
    let mounted = true
    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data?.session?.user && !user) {
        setUser(data.session.user)
      }
    }
    loadSession()
    return () => { mounted = false }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const cartCount = items?.reduce((sum, it) => sum + (it.qty || 0), 0) || 0

  const links = [
    { href: '/', label: 'Marketplace' },
    { href: '/categories', label: 'Categories' },
    { href: '/dashboard/seller', label: 'Seller' },  // we’ll flesh this later
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Logo + primary nav */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
              Hc
            </div>
            <span className="text-base font-semibold tracking-tight">
              Haulcell
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
            {links.map(link => (
              <Link key={link.href} href={link.href}>
                <a
                  className={
                    router.pathname === link.href
                      ? 'text-slate-900'
                      : 'hover:text-slate-900'
                  }
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Cart + account + mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <button
            onClick={() => router.push('/cart')}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-indigo-400"
            aria-label="Cart"
          >
            {/* simple cart icon */}
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-slate-600"
              aria-hidden="true"
            >
              <path
                d="M7 4h-2l-1 2m0 0 2.2 9.2A1 1 0 0 0 7.2 16h9.6a1 1 0 0 0 1-.8L19 8H5M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Auth / user */}
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <button
                onClick={() => router.push('/account')}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[120px] truncate">
                  {user.email}
                </span>
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={() => router.push('/auth/login')}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Sign up
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-indigo-400 sm:hidden"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <span className="text-lg leading-none">&times;</span>
            ) : (
              <span className="text-xl leading-none">≡</span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white sm:hidden">
          <div className="mx-auto max-w-6xl px-4 py-2 text-sm">
            <div className="flex flex-col gap-2 py-2">
              {links.map(link => (
                <Link key={link.href} href={link.href}>
                  <a
                    onClick={() => setMobileOpen(false)}
                    className={`
                      block rounded px-2 py-1 
                      ${router.pathname === link.href
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'}
                    `}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      router.push('/account')
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="truncate">{user.email}</span>
                  </button>
                  <button
                    onClick={async () => {
                      setMobileOpen(false)
                      await handleSignOut()
                    }}
                    className="rounded px-2 py-1 text-left text-slate-700 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      router.push('/auth/login')
                    }}
                    className="rounded px-2 py-1 text-left text-slate-700 hover:bg-slate-50"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      router.push('/auth/signup')
                    }}
                    className="rounded px-2 py-1 text-left text-slate-700 hover:bg-slate-50"
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}