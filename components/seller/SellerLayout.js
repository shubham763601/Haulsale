// components/seller/SellerLayout.js
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const NAV = [
  { href: "/seller", label: "Home", icon: "home" },
  { href: "/seller/dashboard", label: "Products", icon: "box" },
  { href: "/seller/orders", label: "Orders", icon: "receipt" },
  { href: "/seller/settings", label: "Settings", icon: "cog" },
];

function Icon({ name, className = "h-4 w-4" }) {
  // Simple icon switch (keeps bundle light) — extend as needed
  if (name === "home") return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === "box") return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.7L12 2 4 6.3A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7L12 22l8-4.3A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.2"/></svg>;
  if (name === "receipt") return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M8 6h8M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
  if (name === "cog") return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.4"/><path d="M19.4 15a1.5 1.5 0 0 0 .2 1.7l.1.1a1 1 0 0 1-1.3 1.5l-.2-.1a1.5 1.5 0 0 0-1.7.2l-.3.3a1 1 0 0 1-1.4 0l-.3-.3a1.5 1.5 0 0 0-1.7-.2l-.2.1a1 1 0 0 1-1.3-1.5l.1-.1a1.5 1.5 0 0 0 .2-1.7l-.1-.3a1 1 0 0 1 0-1.1l.1-.3a1.5 1.5 0 0 0-.2-1.7l-.1-.1A1 1 0 0 1 9.6 5.4l.2.1a1.5 1.5 0 0 0 1.7-.2l.3-.3a1 1 0 0 1 1.4 0l.3.3a1.5 1.5 0 0 0 1.7.2l.2-.1A1 1 0 0 1 18.6 7l-.1.1a1.5 1.5 0 0 0-.2 1.7l.1.3a1 1 0 0 1 0 1.1l-.1.3z" stroke="currentColor" strokeWidth="1.2"/></svg>;
  return null;
}

export default function SellerLayout({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-seller-700 to-seller-500 text-white p-6">
        <div className="mb-6">
          <div className="text-2xl font-extrabold">Haulcell</div>
          <div className="text-xs mt-1 text-white/80">Seller Console</div>
        </div>

        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            {NAV.map((n) => {
              const active = router.pathname === n.href;
              return (
                <li key={n.href}>
                  <Link href={n.href}>
                    <a className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? 'bg-white/10 text-white' : 'text-white/90 hover:bg-white/5'}`}>
                      <Icon name={n.icon} className="h-4 w-4" />
                      <span>{n.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto text-xs text-white/70">
          <div className="mb-2">Need help? <a href="/support" className="underline">Contact</a></div>
          <div>© {new Date().getFullYear()} Haulcell</div>
        </div>
      </aside>

      {/* mobile drawer */}
      <div className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-seller-700 to-seller-500 text-white p-5 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-6">
            <div className="text-lg font-bold">Haulcell</div>
            <div className="text-xs mt-1 text-white/80">Seller Console</div>
          </div>
          <nav>
            <ul className="space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}><a onClick={() => setOpen(false)} className="block px-2 py-2 rounded-md hover:bg-white/10">{n.label}</a></Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {/* main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="border-b border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border bg-white">
                {!open ? (
                  <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                ) : (
                  <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round"/></svg>
                )}
              </button>
              <div className="text-sm text-slate-600 hidden sm:block">Seller dashboard</div>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-lg px-3 py-1 border text-sm">Docs</button>
              <button className="rounded-lg px-3 py-1 bg-amber-400 text-slate-900 font-semibold text-sm">Account</button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
