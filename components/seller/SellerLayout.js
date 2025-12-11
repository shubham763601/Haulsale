// components/seller/SellerLayout.js
import React from 'react';
import Link from 'next/link';

export default function SellerLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden md:block w-64 bg-gradient-to-b from-[#0f2a78] to-[#4f46e5] text-white p-6">
          <div className="mb-8">
            <div className="text-xl font-bold">Haulcell</div>
            <div className="text-xs mt-1 text-white/80">Seller Dashboard</div>
          </div>
          <nav className="space-y-2">
            <Link href="/seller/dashboard"><a className="block rounded-md bg-white/6 px-3 py-2 text-sm">Products</a></Link>
            <Link href="/seller/orders"><a className="block px-3 py-2 text-sm">Orders</a></Link>
            <Link href="/seller/settings"><a className="block px-3 py-2 text-sm">Settings</a></Link>
          </nav>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="border-b border-slate-100 bg-white px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-sm text-slate-600">Welcome to your seller panel</div>
              <div className="flex items-center gap-3">
                <button className="rounded-md border px-3 py-1 text-sm">Docs</button>
                <button className="rounded-md bg-white/6 px-3 py-1 text-sm">Account</button>
              </div>
            </div>
          </div>

          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
