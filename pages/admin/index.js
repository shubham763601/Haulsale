// pages/admin/index.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'

export default function AdminIndex() {
  const { loading, isAdmin } = useAdmin()
  const [counts, setCounts] = useState({ users: 0, sellers_pending: 0, orders: 0 })

  useEffect(() => {
    if (loading || !isAdmin) return
    async function load() {
      const [{ count: usersCount }, { count: sellersCount }, { count: ordersCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).filter('seller_status', 'eq', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ])
      setCounts({
        users: usersCount?.count ?? 0,
        sellers_pending: sellersCount?.count ?? 0,
        orders: ordersCount?.count ?? 0,
      })
    }
    load()
  }, [loading, isAdmin])

  if (loading) return <><NavBar /><main className="p-8">Loading...</main></>

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-6">Admin dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded">Total users: {counts.users}</div>
          <div className="p-4 bg-white/5 rounded">Pending sellers: {counts.sellers_pending}</div>
          <div className="p-4 bg-white/5 rounded">Total orders: {counts.orders}</div>
        </div>
      </main>
    </>
  )
}
