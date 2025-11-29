// pages/auth/update-password.js
import React, { useState, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import UserContext from '../../lib/userContext'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { setUser } = useContext(UserContext)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleUpdate(e) {
    e.preventDefault()
    setError(null)
    setMsg(null)

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { data, error: updateErr } = await supabase.auth.updateUser({
      password,
    })

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setMsg('Password updated successfully.')
      if (data?.user) {
        setUser(data.user)
      }
      // After a short delay, go home or to login
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }

    setLoading(false)
  }

  return (
    <>
      <Head><title>Set new password — Haulcell</title></Head>
      <NavBar />

      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-slate-900">
            Set a new password
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            Enter your new password for this account.
          </p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">
                New password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Confirm password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:bg-slate-400"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}