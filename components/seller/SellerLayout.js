// components/seller/SellerLayout.js
import React from "react";
import Link from "next/link";

export default function SellerLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] text-white p-6">
          <div className="mb-8">
            <div className="rounded-lg bg-white/10 px-3 py-2 text-lg font-semibold">Haulcell</div>
          </div>
          <nav className="space-y-2">
            <Link href="/seller/dashboard"><a className="block rounded-md bg-white/6 px-3 py-2 text-sm">Dashboard</a></Link>
            <Link href="/seller/dashboard"><a className="block px-3 py-2 text-sm">Products</a></Link>
            <Link href="/seller/orders"><a className="block px-3 py-2 text-sm">Orders</a></Link>
            <Link href="/seller/settings"><a className="block px-3 py-2 text-sm">Settings</a></Link>
          </nav>
        </aside>

        <main className="flex-1">
          {/* Topbar */}
          <div className="border-b border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Seller Dashboard</div>
              <div className="flex items-center gap-3">
                <button className="rounded-md border px-3 py-1 text-sm">Help</button>
                <button className="rounded-full bg-white/6 px-3 py-1 text-sm">Account</button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
