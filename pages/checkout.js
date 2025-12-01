// pages/checkout.js
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart() || {}
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  const [savingAddress, setSavingAddress] = useState(false)
  const [newAddressOpen, setNewAddressOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)

  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    recipient_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    is_default: false,
  })

  // Load session → if not logged in, redirect to login
  useEffect(() => {
    let mounted = true
    async function loadSession() {
      setLoadingUser(true)
      const { data } = await supabase.auth.getSession()
      const sessionUser = data?.session?.user || null

      if (!mounted) return

      if (!sessionUser) {
        setUser(null)
        setLoadingUser(false)
        // redirect to login with next=/checkout
        router.replace('/auth/login?next=/checkout')
        return
      }

      setUser(sessionUser)
      setLoadingUser(false)
    }
    loadSession()
    return () => {
      mounted = false
    }
  }, [router])

  // Load addresses when user is known
  useEffect(() => {
    if (!user) return
    let active = true

    async function loadAddresses() {
      setLoadingAddresses(true)
      setError(null)
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!active) return

      if (error) {
        console.error('loadAddresses error', error)
        setError('Failed to load addresses')
        setAddresses([])
      } else {
        setAddresses(data || [])
        // pick default if exists; else first
        const defaultAddr = (data || []).find((a) => a.is_default)
        const firstAddr = (data || [])[0]
        setSelectedAddressId(
          defaultAddr?.id || firstAddr?.id || null
        )
      }
      setLoadingAddresses(false)
    }

    loadAddresses()
    return () => {
      active = false
    }
  }, [user])

  function handleAddressFieldChange(field, value) {
    setAddressForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSaveAddress(e) {
    e?.preventDefault()
    if (!user) return
    setSavingAddress(true)
    setError(null)

    try {
      const payload = {
        ...addressForm,
        user_id: user.id,
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('insert address error', error)
        setError(error.message || 'Failed to save address')
      } else {
        const nextList = [...addresses, data]
        setAddresses(nextList)
        setSelectedAddressId(data.id)
        setNewAddressOpen(false)
        // simple reset
        setAddressForm({
          label: 'Home',
          recipient_name: '',
          phone: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          is_default: false,
        })
      }
    } catch (err) {
      console.error(err)
      setError('Unexpected error saving address')
    } finally {
      setSavingAddress(false)
    }
  }

  function getSelectedAddress() {
    return addresses.find((a) => a.id === selectedAddressId) || null
  }

  async function handlePlaceOrder() {
    setError(null)
    if (!user) {
      router.push('/auth/login?next=/checkout')
      return
    }

    if (!items || items.length === 0) {
      setError('Your cart is empty')
      return
    }

    const addr = getSelectedAddress()
    if (!addr) {
      setError('Please select or add a shipping address')
      return
    }

    setPlacing(true)
    try {
      // transform cart items into shape expected by Edge function
      const payloadItems = items.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id || null,
        qty: it.qty || 1,
        price: it.price || 0,
        stock: it.stock ?? null,
      }))

      const shipping_address = {
        shipping_name: addr.recipient_name,
        shipping_phone: addr.phone,
        shipping_line1: addr.line1,
        shipping_line2: addr.line2,
        shipping_city: addr.city,
        shipping_state: addr.state,
        shipping_pincode: addr.pincode,
        shipping_country: addr.country,
      }

      const resp = await fetch('/api/proxy-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          shipping_address,
        }),
      })

      const json = await resp.json()

      if (!resp.ok) {
        console.error('Place order failed', json)
        setError(json.error || json.message || 'Order API failed')
        setPlacing(false)
        return
      }

      // clear cart + go to success page
      if (typeof clearCart === 'function') {
        clearCart()
      }
      router.push(`/order-success?order_id=${json.order_id}`)
    } catch (err) {
      console.error('placeOrder error', err)
      setError(err.message || 'Unexpected error placing order')
    } finally {
      setPlacing(false)
    }
  }

  if (loadingUser) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-sm text-slate-500">
            Checking your session…
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Checkout – Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1 mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
            Checkout
          </h1>

          {/* layout: left addresses, right order summary */}
          <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr] items-start">
            {/* LEFT: Addresses */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Shipping address
                  </h2>
                  <p className="text-xs text-slate-500">
                    Choose where we should deliver your order.
                  </p>
                </div>
                <button
                  onClick={() => setNewAddressOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  + New address
                </button>
              </div>

              {loadingAddresses && (
                <p className="text-xs text-slate-500">
                  Loading addresses…
                </p>
              )}

              {!loadingAddresses && addresses.length === 0 && (
                <p className="text-xs text-slate-500">
                  You have no saved addresses yet. Add one to continue.
                </p>
              )}

              <div className="mt-2 space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 text-xs sm:text-sm transition ${
                      selectedAddressId === addr.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-slate-900">
                        {addr.recipient_name}{' '}
                        {addr.label ? (
                          <span className="ml-1 text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                            {addr.label}
                          </span>
                        ) : null}
                      </div>
                      {addr.is_default && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      <div>{addr.phone}</div>
                      <div>
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                      </div>
                      <div>
                        {addr.city}, {addr.state} – {addr.pincode}
                      </div>
                      <div>{addr.country}</div>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-3 text-xs text-rose-600">{error}</p>
              )}
            </section>

            {/* RIGHT: Order summary */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Order summary
              </h2>

              {!items || items.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Your cart is empty. Add items to continue.
                </p>
              ) : (
                <>
                  <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg mb-3">
                    {items.map((it) => (
                      <div
                        key={`${it.product_id}-${it.variant_id ?? 'default'}`}
                        className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 border-slate-100"
                      >
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                          {it.imageUrl ? (
                            <img
                              src={it.imageUrl}
                              alt={it.title}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-900 line-clamp-1">
                            {it.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Qty {it.qty} · ₹{Number(it.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          ₹{(Number(it.price || 0) * (it.qty || 1)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Items total</span>
                      <span>₹{Number(total || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Shipping</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-slate-900 border-t border-slate-200 pt-2 mt-1">
                      <span>Payable amount</span>
                      <span>₹{Number(total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={placing || !items || items.length === 0}
                    className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold shadow ${
                      placing
                        ? 'bg-slate-400 text-white cursor-wait'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {placing ? 'Placing order…' : 'Place order'}
                  </button>
                </>
              )}
            </section>
          </div>

          {/* New address form modal-like section (inline) */}
          {newAddressOpen && (
            <section className="mt-6 max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Add new address
                </h2>
                <button
                  type="button"
                  onClick={() => setNewAddressOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              <form
                onSubmit={handleSaveAddress}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Label (Home / Shop)
                  </label>
                  <input
                    value={addressForm.label}
                    onChange={(e) =>
                      handleAddressFieldChange('label', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Recipient name
                  </label>
                  <input
                    required
                    value={addressForm.recipient_name}
                    onChange={(e) =>
                      handleAddressFieldChange('recipient_name', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Phone
                  </label>
                  <input
                    required
                    value={addressForm.phone}
                    onChange={(e) =>
                      handleAddressFieldChange('phone', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Line 1
                  </label>
                  <input
                    required
                    value={addressForm.line1}
                    onChange={(e) =>
                      handleAddressFieldChange('line1', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Line 2 (optional)
                  </label>
                  <input
                    value={addressForm.line2}
                    onChange={(e) =>
                      handleAddressFieldChange('line2', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    City
                  </label>
                  <input
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      handleAddressFieldChange('city', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    State
                  </label>
                  <input
                    required
                    value={addressForm.state}
                    onChange={(e) =>
                      handleAddressFieldChange('state', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Pincode
                  </label>
                  <input
                    required
                    value={addressForm.pincode}
                    onChange={(e) =>
                      handleAddressFieldChange('pincode', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Country
                  </label>
                  <input
                    value={addressForm.country}
                    onChange={(e) =>
                      handleAddressFieldChange('country', e.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="is_default"
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(e) =>
                      handleAddressFieldChange(
                        'is_default',
                        e.target.checked
                      )
                    }
                    className="h-3 w-3 rounded border-slate-300"
                  />
                  <label
                    htmlFor="is_default"
                    className="text-[11px] text-slate-600"
                  >
                    Make this my default address
                  </label>
                </div>

                <div className="sm:col-span-2 mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAddressOpen(false)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white ${
                      savingAddress
                        ? 'bg-slate-400 cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {savingAddress ? 'Saving…' : 'Save address'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </>
  )
}