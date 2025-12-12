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

// ---------------- ICONS ----------------
function Icon({ name, className = "h-5 w-5" }) {
  const stroke = "currentColor";
  if (name === "home")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M3 11L12 4l9 7" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  if (name === "box")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path
          d="M21 16V8a2 2 0 0 0-1-1.7L12 2 4 6.3A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7L12 22l8-4.3A2 2 0 0 0 21 16z"
          stroke={stroke}
          strokeWidth="1.4"
        />
      </svg>
    );
  if (name === "receipt")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M8 6h8M8 10h8M8 14h5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  if (name === "cog")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke={stroke} strokeWidth="1.7" />
        <path
          d="M19 15l.3 1.5-1.3 1-1.5-.3-.9 1.2-1.5-.3-.6-1.4-1.5.3-1-1.3.3-1.5-1.2-.9.3-1.5 1.4-.6-.3-1.5 1.3-1 1.5.3.9-1.2 1.5.3.6 1.4 1.5-.3 1 1.3-.3 1.5 1.2.9-.3 1.5z"
          stroke={stroke}
          strokeWidth="1.4"
        />
      </svg>
    );
  return null;
}

// ---------------- MAIN LAYOUT ----------------
export default function SellerLayout({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-seller-700 to-seller-500 text-white p-6 shadow-xl">
        <div className="mb-8">
          <div className="text-3xl font-extrabold tracking-tight">Haulcell</div>
          <div className="text-sm mt-1 opacity-80">Seller Console</div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {NAV.map((n) => {
              const active = router.pathname === n.href;
              return (
                <li key={n.href}>
                  <Link href={n.href}>
                    <a
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? "bg-white/20 shadow-sm text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon name={n.icon} />
                      {n.label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="text-xs opacity-80 mt-10">
          <a href="/support" className="underline">Contact</a>
          <div className="mt-1">© {new Date().getFullYear()} Haulcell</div>
        </div>
      </aside>

      {/* ---------------- MOBILE OVERLAY + DRAWER ---------------- */}
      <div className={`fixed inset-0 z-40 md:hidden transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />

        <aside
          className={`absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-seller-700 to-seller-500 text-white p-6 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 text-xl font-bold">Haulcell</div>

          <ul className="space-y-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-md hover:bg-white/10"
                  >
                    {n.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* ---------------- MAIN AREA ---------------- */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

            <div className="flex items-center gap-3">
              {/* Hamburger */}
              <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2 rounded-lg border bg-white hover:bg-slate-50 shadow-sm"
              >
                <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>

              <span className="text-sm text-slate-600 hidden sm:block">
                Seller Dashboard
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-3 py-1 border rounded-lg shadow-sm">Docs</button>
              <button className="px-3 py-1 rounded-lg bg-amber-400 text-slate-900 font-semibold shadow-sm">
                Account
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
