// pages/admin/users.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'

export default function AdminUsers() {
  const { loading, isAdmin } = useAdmin()
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    if (loading || !isAdmin) return
    fetchUsers()
  }, [loading, isAdmin, page])

  async function fetchUsers() {
    const from = (page - 1) * perPage
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, seller_status, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1)

    if (error) {
      console.error('fetch users', error)
      return
    }
    setUsers(data || [])
  }

  async function setRole(userId, role) {
    const token = (await supabase.auth.getSession()).data?.session?.access_token
    const resp = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, role }),
    })
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}))
      alert('Failed: ' + (json?.error || JSON.stringify(json)))
    } else {
      fetchUsers()
    }
  }

  if (loading) return <><NavBar /><main className="p-8">Loading...</main></>
  return (
    <>
      <NavBar />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="p-4 bg-white/5 rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{u.full_name || '(no name)'}</div>
                <div className="text-sm text-gray-300">{u.email}</div>
                <div className="text-xs text-gray-400">Joined: {new Date(u.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <select value={u.role || 'buyer'} onChange={e => setRole(u.id, e.target.value)} className="bg-transparent border px-2 py-1 rounded">
                  <option value="buyer">buyer</option>
                  <option value="seller">seller</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <div className="px-3 py-1">Page {page}</div>
          <button className="px-3 py-1 border rounded" onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </main>
    </>
  )
}
