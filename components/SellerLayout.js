// components/SellerLayout.js
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  ClipboardList,
  CreditCard,
  Store,
} from 'lucide-react'

const menuItems = [
  { href: '/seller', label: 'Overview', icon: LayoutDashboard },
  { href: '/seller/products', label: 'Products', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ClipboardList },
  { href: '/seller/payments', label: 'Payments', icon: CreditCard },
]

export default function SellerLayout({ children, title = 'Seller Dashboard' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isActive = (href) =>
    href === '/seller'
      ? router.pathname === '/seller'
      : router.pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* SIDEBAR (desktop) */}
      <aside className="hidden md:flex md:flex-col w-64 bg-blue-900/95 border-r border-blue-800">
        <div className="px-5 py-4 border-b border-blue-800 flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-emerald-400 flex items-center justify-center font-bold text-slate-900">
            H
          </div>
          <div>
            <div className="font-semibold">Haullcell</div>
            <div className="text-xs text-blue-100/70">Seller Console</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                ${
                  isActive(href)
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-blue-100/80 hover:bg-blue-800/70 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 bg-blue-900/95 border-r border-blue-800 flex flex-col">
            <div className="px-5 py-4 border-b border-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-400 flex items-center justify-center font-bold text-slate-900 text-sm">
                  H
                </div>
                <div>
                  <div className="font-semibold text-sm">Haullcell</div>
                  <div className="text-[11px] text-blue-100/70">Seller Console</div>
                </div>
              </div>
              <button
                className="p-1 rounded hover:bg-blue-800/70"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                    ${
                      isActive(href)
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-blue-100/80 hover:bg-blue-800/70 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          {/* Clickable backdrop to close */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg border border-slate-700 bg-slate-900"
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Manage your store, products, and orders.
              </p>
            </div>
          </div>

          {/* Store profile button (top-right) */}
          <Link href="/seller/profile">
            <a className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-slate-900 text-xs font-medium hover:bg-amber-400 transition">
              <Store size={16} />
              <span className="hidden sm:inline">Store profile</span>
            </a>
          </Link>
        </header>

        <main className="flex-1 px-4 md:px-6 py-5">{children}</main>
      </div>
    </div>
  )
}
