// pages/admin/users.js
import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function AdminUsers() {
  const { loading, isAdmin } = useAdmin()
  const [users, setUsers] = useState([])
  const [fetching, setFetching] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 20
  const router = useRouter()

  useEffect(() => {
    if (loading || !isAdmin) return
    loadUsers(page)
  }, [loading, isAdmin, page])

  async function loadUsers(pageNumber) {
    setFetching(true)
    try {
      const from = (pageNumber - 1) * perPage
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, kyc_status, role, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + perPage - 1)

      if (error) {
        console.error('fetch users', error)
        setUsers([])
        return
      }
      // add tempRole field for UI editing
      const withDraft = (data || []).map(u => ({
        ...u,
        tempRole: u.role || 'buyer',
      }))
      setUsers(withDraft)
    } catch (err) {
      console.error('Unexpected fetch users error', err)
      setUsers([])
    } finally {
      setFetching(false)
    }
  }

  async function applyRoleChange(userId) {
    const userRow = users.find(u => u.id === userId)
    if (!userRow) return
    const newRole = userRow.tempRole

    try {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      const headers = { 'content-type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const resp = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, role: newRole }),
      })

      if (!resp.ok) {
        const json = await resp.json().catch(() => null)
        const msg = json?.error || json?.message || `HTTP ${resp.status}`
        alert('Failed to change role: ' + msg)
        return
      }

      // After success, refresh list
      await loadUsers(page)
    } catch (err) {
      console.error('applyRoleChange error', err)
      alert('Failed to change role: ' + (err.message || String(err)))
    }
  }

  function updateTempRole(userId, val) {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, tempRole: val } : u
      )
    )
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="p-8 text-white">Checking admin access…</main>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <main className="p-8">
          <div className="max-w-2xl mx-auto bg-red-900/40 border border-red-500/60 p-6 rounded-xl text-white">
            <h2 className="text-lg font-semibold">Admin only</h2>
            <p className="mt-2 text-sm text-red-100">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <section className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin — Users</h1>
              <p className="text-sm text-slate-300 mt-1">
                Manage roles, view KYC status, and drill into per-user products and orders.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Page {page} · {fetching ? 'Loading…' : `${users.length} users`}
            </div>
          </header>

          <div className="overflow-x-auto rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/90">
                <tr className="text-left text-slate-300 border-b border-slate-700/70">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !fetching && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}

                {users.map(u => (
                  <tr
                    key={u.id}
                    className="border-t border-slate-800/70 hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name || '(no name)'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Joined: {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs md:text-sm text-slate-100 break-all">
                        {u.email || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-200">
                        {u.phone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium
                        ${u.kyc_status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : u.kyc_status === 'rejected'
                          ? 'bg-red-500/20 text-red-200 border border-red-500/60'
                          : 'bg-amber-500/15 text-amber-200 border border-amber-500/40'}
                      `}>
                        {u.kyc_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.tempRole}
                          onChange={e => updateTempRole(u.id, e.target.value)}
                          className="bg-slate-900/70 border border-slate-600 px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="buyer">buyer</option>
                          <option value="seller">seller</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          onClick={() => applyRoleChange(u.id)}
                          className="text-[11px] px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-all shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col md:flex-row gap-2 justify-center">
                        <button
                          onClick={() => router.push(`/admin/user-products?user_id=${u.id}`)}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-sky-600/90 hover:bg-sky-500 shadow-sm hover:shadow-md transition-all"
                        >
                          Products
                        </button>
                        <button
                          onClick={() => router.push(`/admin/user-orders?user_id=${u.id}`)}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-fuchsia-600/90 hover:bg-fuchsia-500 shadow-sm hover:shadow-md transition-all"
                        >
                          Orders
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <button
              className="px-3 py-1.5 rounded-md border border-slate-600 text-xs disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-400">Page {page}</span>
            <button
              className="px-3 py-1.5 rounded-md border border-slate-600 text-xs"
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
