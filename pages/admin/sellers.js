// pages/admin/sellers.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'

export default function AdminSellers() {
  const { loading, isAdmin } = useAdmin()
  const [sellers, setSellers] = useState([])

  useEffect(() => {
    if (loading || !isAdmin) return
    fetchPending()
  }, [loading, isAdmin])

  async function fetchPending() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, seller_status')
      .eq('seller_status', 'pending')
      .limit(50)
    setSellers(data || [])
  }

  async function approve(userId, approve) {
    const token = (await supabase.auth.getSession()).data?.session?.access_token
    const resp = await fetch('/api/admin/toggle-seller-approval', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, approve }),
    })
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}))
      alert('Failed: ' + (json?.error || JSON.stringify(json)))
    } else {
      fetchPending()
    }
  }

  if (loading) return <><NavBar /><main className="p-8">Loading...</main></>
  return (
    <>
      <NavBar />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Seller approvals</h1>
        <div className="space-y-3">
          {sellers.length === 0 && <div>No pending sellers</div>}
          {sellers.map(s => (
            <div key={s.id} className="p-4 bg-white/5 rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.full_name || '(no name)'}</div>
                <div className="text-sm text-gray-300">{s.email}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-600 rounded" onClick={() => approve(s.id, true)}>Approve</button>
                <button className="px-3 py-1 bg-red-600 rounded" onClick={() => approve(s.id, false)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
