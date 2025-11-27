// components/SellerLayout.js
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
)
const IconX = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
)
const IconDashboard = (p)=> (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>)
const IconBox = (p)=> (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M3 7l9-4 9 4-9 4-9-4zm0 4l9 4 9-4m-9 4v6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>)
const IconOrders = (p)=> (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>)
const IconCard = (p)=> (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 10h18" stroke="currentColor" strokeWidth="1.6"/></svg>)
const IconStore = (p)=> (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M4 10l1-5h14l1 5M5 10v9h14v-9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>)

const menuItems = [
  { href: '/seller', label: 'Overview', Icon: IconDashboard },
  { href: '/seller/products', label: 'Products', Icon: IconBox },
  { href: '/seller/orders', label: 'Orders', Icon: IconOrders },
  { href: '/seller/payments', label: 'Payments', Icon: IconCard },
]

export default function SellerLayout({ children, title = 'Seller Dashboard' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isActive = (href) =>
    href === '/seller' ? router.pathname === '/seller' : router.pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-indigo-900/95 border-r border-indigo-800 p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-md bg-emerald-300 flex items-center justify-center font-bold text-slate-900">H</div>
          <div>
            <div className="font-semibold">Haullcell</div>
            <div className="text-xs text-indigo-100/80">Seller Console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((m) => (
            <Link key={m.href} href={m.href}>
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                  ${isActive(m.href) ? 'bg-indigo-700 text-white' : 'text-indigo-100/90 hover:bg-indigo-800/60'}`}
              >
                <m.Icon />
                <span>{m.label}</span>
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="w-64 bg-indigo-900/95 border-r border-indigo-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-emerald-300 flex items-center justify-center font-bold text-slate-900">H</div>
                <div>
                  <div className="font-medium">Haullcell</div>
                  <div className="text-xs text-indigo-100/70">Seller</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-md"><IconX /></button>
            </div>
            <nav className="mt-4 space-y-1">
              {menuItems.map((m) => (
                <Link key={m.href} href={m.href}>
                  <a onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isActive(m.href) ? 'bg-indigo-700' : 'hover:bg-indigo-800/60'}`}>
                    <m.Icon />
                    <span>{m.label}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-md border border-slate-700" onClick={() => setOpen(true)}><IconMenu /></button>
            <div>
              <div className="text-lg font-semibold">{title}</div>
              <div className="text-xs text-slate-400 hidden sm:block">Manage your store, products and orders</div>
            </div>
          </div>

          <div>
            <Link href="/seller/profile">
              <a className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-slate-900 text-sm font-medium">
                <div className="h-7 w-7 rounded-full bg-amber-700 flex items-center justify-center text-xs font-semibold">S</div>
                <span className="hidden sm:inline">Store profile</span>
                <IconStore />
              </a>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
