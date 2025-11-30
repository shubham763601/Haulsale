// components/NavBar.js
import React, { useContext, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import UserContext from '../lib/userContext'
import { useCart } from '../context/CartContext' // ✅ new cart hook

export default function NavBar() {
  const router = useRouter()
  const { user, setUser } = useContext(UserContext)
  const { totalCount = 0 } = useCart() || {}

  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [search, setSearch] = useState('')

  // keep user in sync with Supabase session on first load
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

  // scroll listener → collapse navbar on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return

    function onScroll() {
      setIsScrolled(window.scrollY > 80)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    setMenuOpen(false)
    router.push(`/products?search=${encodeURIComponent(q)}`)
  }

  const links = [
    { href: '/', label: 'Marketplace' },
    { href: '/categories', label: 'Categories' },
    { href: '/seller', label: 'Become a seller' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-4 lg:px-6 py-2">
        {/* LEFT: logo (hidden when scrolled tight) */}
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${isScrolled ? 'opacity-0 pointer-events-none hidden sm:hidden' : 'opacity-100'}`}>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
              Hc
            </div>
            <span className="hidden sm:inline text-base font-semibold tracking-tight">
              Haullcell
            </span>
          </button>
        </div>

        {/* CENTER: search bar (always visible, expands when scrolled) */}
        <div className={`flex-1 px-2 ${isScrolled ? '' : 'max-w-xl'}`}>
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 focus-within:border-indigo-500 focus-within:bg-white transition"
          >
            <span className="text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, categories…"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="hidden sm:inline-flex rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Search
            </button>
          </form>
        </div>

        {/* RIGHT: cart + menu (menu hidden when scrolled tight, as you asked) */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={() => router.push('/cart')}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-indigo-400"
            aria-label="Cart"
          >
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
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {totalCount}
              </span>
            )}
          </button>

          {/* Hamburger menu: only when not collapsed */}
          {!isScrolled && (
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-indigo-400"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? (
                <span className="text-lg leading-none">&times;</span>
              ) : (
                <span className="text-xl leading-none">≡</span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* DROPDOWN MENU (for both mobile + desktop, holds links + auth) */}
      {menuOpen && !isScrolled && (
        <div className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-3 text-sm">
            {/* Primary links */}
            <div className="flex flex-col gap-1 pb-3">
              {links.map(link => (
                <Link key={link.href} href={link.href}>
                  <a
                    onClick={() => setMenuOpen(false)}
                    className={`rounded px-2 py-1 ${
                      router.pathname === link.href
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>

            {/* Auth section */}
            <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      router.push('/account')
                    }}
                    className="flex items-center gap-2 rounded px-2 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="truncate">{user.email}</span>
                  </button>
                  <button
                    onClick={async () => {
                      setMenuOpen(false)
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
                      setMenuOpen(false)
                      router.push('/auth/login')
                    }}
                    className="rounded px-2 py-1 text-left text-slate-700 hover:bg-slate-50"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
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
