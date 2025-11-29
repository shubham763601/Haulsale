// components/AuthLayout.js
import React from 'react'
import Link from 'next/link'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left brand panel (hidden on small screens) */}
      <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-slate-900 text-white px-12 py-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center font-semibold">
            Hc
          </div>
          <div className="text-lg font-semibold tracking-tight">Haullcell</div>
        </div>

        <div className="mt-20 max-w-md">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            B2B wholesale · India
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-snug">
            One dashboard for all your shop supplies.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Connect with verified wholesalers, manage orders, and track payouts —
            built on Supabase, designed for local retailers.
          </p>

          <div className="mt-8 space-y-2 text-sm text-slate-300">
            <p>✓ Fast OTP sign-in</p>
            <p>✓ Live inventory and order history</p>
            <p>✓ Seller dashboard for wholesale catalogs</p>
          </div>
        </div>

        <div className="mt-auto text-xs text-slate-500">
          © {new Date().getFullYear()} Haullcell. All rights reserved.
        </div>
      </div>

      {/* Right auth card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                Hc
              </div>
              <span className="font-semibold text-slate-900">Haullcell</span>
            </div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-700">
              Back to home
            </Link>
          </div>

          <div className="card">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}

            <div className="mt-6">{children}</div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Protected by Supabase Auth · Sessions synced on all tabs.
          </div>
        </div>
      </div>
    </div>
  )
}