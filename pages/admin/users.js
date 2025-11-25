// pages/admin/users.js
import React, { useEffect, useState, useCallback } from 'react'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'
import { supabase } from '../../lib/supabaseClient'

export default function AdminUsers() {
  const { loading, isAdmin } = useAdmin()
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(false)
  const perPage = 20

  // stable fetchUsers so effect deps are correct
  const fetchUsers = useCallback(async (pageToFetch = page) => {
    setFetching(true)
    try {
      const from = (pageToFetch - 1) * perPage
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, seller_status, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + perPage - 1)

      if (error) {
        console.error('fetch users', error)
        setUsers([])
        return
      }
      setUsers(data || [])
    } catch (err) {
      console.error('Unexpected fetch users error', err)
      setUsers([])
    } finally {
      setFetching(false)
    }
  }, [page])

  // Load users when admin ready or page changes
  useEffect(() => {
    if (loading) return
    if (!isAdmin) return
    fetchUsers(page)
  }, [loading, isAdmin, page, fetchUsers])

  // change role via server API (server should verify requestor is admin)
  async function setRole(userId, role) {
    try {
      // get current session token to authenticate the request server-side
      const sessionResp = await supabase.auth.getSession()
      const token = sessionResp?.data?.session?.access_token

      const headers = { 'content-type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const resp = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, role }),
      })

      if (!resp.ok) {
        // try to parse error json, otherwise fall back to status text
        const json = await resp.json().catch(() => null)
        const msg = json?.error || json?.message || resp.statusText || `HTTP ${resp.status}`
        alert('Failed to change role: ' + msg)
        return
      }

      // refresh users after successful role change
      fetchUsers(page)
    } catch (err) {
      console.error('setRole error', err)
      alert('Failed to change role: ' + (err.message || String(err)))
    }
  }

  if (loading) return (
    <>
      <NavBar />
      <main className="p-8">Loading...</main>
    </>
  )

  if (!isAdmin) return (
    <>
      <NavBar />
      <main className="p-8">
        <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded">
          <h2 className="text-lg font-semibold">Admin area</h2>
          <p className="text-gray-300 mt-2">You must be an admin to view this page.</p>
        </div>
      </main>
    </>
  )

  return (
    <>
      <NavBar />
      <main className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Users</h1>

        <div className="mb-4">
          <span className="text-sm text-gray-400">Showing page {page} — {fetching ? 'loading…' : `${users.length} users`}</span>
        </div>

        <div className="space-y-4">
          {users.length === 0 && !fetching && (
            <div className="text-gray-400">No users found.</div>
          )}

          {users.map(u => (
            <div key={u.id} className="p-4 bg-white/5 rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{u.full_name || '(no name)'}</div>
                <div className="text-sm text-gray-300">{u.email || '—'}</div>
                <div className="text-xs text-gray-400">Joined: {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={u.role || 'buyer'}
                  onChange={e => setRole(u.id, e.target.value)}
                  className="bg-transparent border px-2 py-1 rounded text-sm"
                >
                  <option value="buyer">buyer</option>
                  <option value="seller">seller</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>

          <div className="px-3 py-1">Page {page}</div>

          <button
            className="px-3 py-1 border rounded"
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </main>
    </>
  )
}
