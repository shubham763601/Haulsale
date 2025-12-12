// components/seller/SellerLayout.js
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SellerLayout({ children }) {
  const [open, setOpen] = useState(false); // mobile drawer
  const router = useRouter();

  // close mobile drawer on route change
  useEffect(() => {
    const handleRoute = () => setOpen(false);
    router.events.on("routeChangeStart", handleRoute);
    return () => router.events.off("routeChangeStart", handleRoute);
  }, [router.events]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col w-64 flex-none px-6 py-8 bg-gradient-to-b from-brand-700 to-brand-500 text-white"
        aria-hidden={open ? "false" : "false"}
      >
        <div className="mb-8">
          <div className="text-2xl font-extrabold tracking-tight">Haulcell</div>
          <div className="text-xs mt-1 text-white/80">Seller Dashboard</div>
        </div>

        <nav className="mt-6 flex-1">
          <ul className="space-y-1">
            <li>
              <Link href="/seller">
                <a className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/5">Home</a>
              </Link>
            </li>
            <li>
              <Link href="/seller/dashboard">
                <a className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/5">Products</a>
              </Link>
            </li>
            <li>
              <Link href="/seller/orders">
                <a className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/5">Orders</a>
              </Link>
            </li>
            <li>
              <Link href="/seller/settings">
                <a className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/5">Settings</a>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto text-xs text-white/70">
          <div>© {new Date().getFullYear()} Haulcell</div>
        </div>
      </aside>

      {/* Mobile slide-over sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <aside
          className={`absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-brand-700 to-brand-500 text-white p-6 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
          aria-hidden={!open}
        >
          <div className="mb-6">
            <div className="text-xl font-bold">Haulcell</div>
            <div className="text-xs mt-1 text-white/80">Seller</div>
          </div>

          <nav>
            <ul className="space-y-2">
              <li><Link href="/seller"><a onClick={() => setOpen(false)} className="block px-2 py-2 rounded-md hover:bg-white/10">Home</a></Link></li>
              <li><Link href="/seller/dashboard"><a onClick={() => setOpen(false)} className="block px-2 py-2 rounded-md hover:bg-white/10">Products</a></Link></li>
              <li><Link href="/seller/orders"><a onClick={() => setOpen(false)} className="block px-2 py-2 rounded-md hover:bg-white/10">Orders</a></Link></li>
              <li><Link href="/seller/settings"><a onClick={() => setOpen(false)} className="block px-2 py-2 rounded-md hover:bg-white/10">Settings</a></Link></li>
            </ul>
          </nav>
        </aside>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="w-full border-b border-slate-100 bg-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(true)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md bg-white/90 border border-slate-100"
                aria-label="Open menu"
                aria-expanded={open}
              >
                {/* 3-bar icon */}
                <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="text-sm text-slate-600 hidden sm:block">Welcome to your seller panel</div>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-md border px-3 py-1 text-sm bg-white">Docs</button>
              <button className="rounded-md bg-white/6 px-3 py-1 text-sm">Account</button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}