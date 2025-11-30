// context/CartContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext()

const STORAGE_KEY = 'haullcell_cart_v1'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  // Load from localStorage on client
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch (err) {
      console.error('Failed to load cart from storage', err)
    }
  }, [])

  // Save to localStorage whenever items change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save cart', err)
    }
  }, [items])

  function addItem(item) {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.product_id === item.product_id &&
          (p.variant_id || null) === (item.variant_id || null)
      )

      if (idx === -1) {
        return [...prev, { ...item, qty: item.qty || 1 }]
      }

      const next = [...prev]
      next[idx] = {
        ...next[idx],
        qty: next[idx].qty + (item.qty || 1),
      }
      return next
    })
  }

  function updateQty(product_id, variant_id, qty) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (
            item.product_id === product_id &&
            (item.variant_id || null) === (variant_id || null)
          ) {
            return { ...item, qty }
          }
          return item
        })
        .filter((item) => item.qty > 0)
    )
  }

  function removeItem(product_id, variant_id) {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product_id === product_id &&
            (item.variant_id || null) === (variant_id || null)
          )
      )
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + i.qty * (i.price || 0), 0)

  const value = {
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    totalCount,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
