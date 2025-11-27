// pages/seller/payments.js
import React, { useEffect, useState } from 'react'
import SellerLayout from '../../components/SellerLayout'
import { supabase } from '../../lib/supabaseClient'

export default function SellerPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState([])
  const [revenue, setRevenue] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null
      if (mounted) setUser(u)
      if (u) load(u.id)
    })
    return () => { mounted = false }
  }, [])

  async function load(uid) {
    setLoading(true)
    try {
      // payouts for seller
      const { data: pay } = await supabase
        .from('payouts')
        .select('*')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false })
      setPayouts(pay || [])

      // revenue calculation via order_items & products
      const { data: prods } = await supabase.from('products').select('id').eq('seller_id', uid)
      const pids = (prods || []).map(p => p.id)
      if (pids.length === 0) {
        setRevenue(0)
      } else {
        const { data: items } = await supabase.from('order_items').select('quantity, price').in('product_id', pids)
        const rev = (items || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)
        setRevenue(rev)
      }
    } catch (err) {
      console.error('load payouts', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerLayout title="Payments">
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Payouts & earnings</h2>

        <div className="bg-slate-800/60 p-4 rounded">
          <div className="text-sm text-slate-300">Total revenue from sold items</div>
          <div className="text-2xl font-bold mt-2">₹{loading ? '...' : revenue.toFixed(2)}</div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded">
          <h3 className="font-medium mb-2">Payouts</h3>
          {loading ? <div>Loading...</div> : (
            payouts.length === 0
              ? <div className="text-slate-400">No payouts yet.</div>
              : payouts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-slate-900/40 rounded mb-2">
                  <div>
                    <div className="font-medium">Payout #{p.id}</div>
                    <div className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-emerald-300">₹{Number(p.amount || 0).toFixed(2)}</div>
                </div>
              ))
          )}
        </div>
      </div>
    </SellerLayout>
  )
}
