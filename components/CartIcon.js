// components/CartIcon.js
import Link from 'next/link'
import React, { useContext } from 'react'
import { CartContext } from '../lib/cartContext'

export default function CartIcon({ className = '' }) {
  const { items } = useContext(CartContext || { items: [] })
  const qty = items ? items.reduce((s, i) => s + Number(i.qty || 0), 0) : 0

  return (
    <Link href="/cart">
      <a
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded hover:bg-white/5 transition ${className}`}
        aria-label="Cart"
        title="Cart"
      >
        {/* shopping cart icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M3 3h2l.4 2M7 13h8l2-7H6.4M7 13L6 17h9M7 13l-1.5 4.5" stroke="currentColor" strokeWidth="0" />
          <path d="M7 13a1 1 0 100 2 1 1 0 000-2zM15 13a1 1 0 100 2 1 1 0 000-2z" />
        </svg>

        {/* badge */}
        {qty > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 text-xs rounded-full bg-red-600 text-white flex items-center justify-center">
            {qty}
          </span>
        )}
      </a>
    </Link>
  )
}
