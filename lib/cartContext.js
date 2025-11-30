// lib/cartContext.js
import React, { createContext, useEffect, useState } from 'react'

export const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  total: 0,
})

const STORAGE_KEY = 'haulcell_cart_v1'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch (e) {
      console.warn('cart load err', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('cart save err', e)
    }
  }, [items])

  const addItem = (variant, qty = 1) => {
    setItems(prev => {
      const vid = String(variant.variant_id ?? variant.id)
      const idx = prev.findIndex(i => String(i.variant_id) === vid)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx].qty = Number(copy[idx].qty) + Number(qty)
        return copy
      }
      return [
        ...prev,
        {
          variant_id: variant.variant_id ?? variant.id,
          product_id: variant.product_id ?? variant.product_id ?? variant.product_id,
          title: variant.product_title ?? variant.title ?? '',
          price: Number(variant.price ?? 0),
          qty: Number(qty),
          sku: variant.sku ?? '',
        },
      ]
    })
  }

  const removeItem = (variant_id) => setItems(prev => prev.filter(i => String(i.variant_id) !== String(variant_id)))
  const updateQty = (variant_id, qty) => {
    if (qty <= 0) return removeItem(variant_id)
    setItems(prev => prev.map(i => (String(i.variant_id) === String(variant_id) ? ({ ...i, qty: Number(qty) }) : i)))
  }
  const clear = () => setItems([])

  const total = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total }}>
      {children}
    </CartContext.Provider>
  )
}

