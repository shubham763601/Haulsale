// pages/account/edit.js
import Head from 'next/head'
import React, { useContext, useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import UserContext from '../../lib/userContext'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function EditAccount() {
  const router = useRouter()
  const { user } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', company: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, company')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('load profile', error)
          setError('Failed to load profile')
        } else if (data) {
          setForm({
            full_name: data.full_name ?? '',
            phone: data.phone ?? '',
            company: data.company ?? ''
          })
        }
      } catch (err) {
        console.error(err)
        setError('Unexpected error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  async function handleSave(e) {
    e?.preventDefault()
    setSaving(true)
    setError(null)
    if (!user) {
      setError('You must be signed in')
      setSaving(false)
      return
    }

    try {
      const payload = {
        id: user.id,
        full_name: form.full_name ?? null,
        phone: form.phone ?? null,
        company: form.company ?? null,
        email: user.email, // keep email consistent
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { returning: 'representation' })
        .select()

      if (error) {
        console.error('upsert profile', error)
        setError('Failed to save profile: ' + (error.message || JSON.stringify(error)))
      } else {
        router.push('/account')
      }
    } catch (err) {
      console.error(err)
      setError('Unexpected error saving profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <>
      <NavBar />
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </main>
    </>
  )

  return (
    <>
      <Head><title>Edit profile — Haulcell</title></Head>
      <NavBar />
      <main className="min-h-screen p-8 flex items-start justify-center">
        <section className="w-full max-w-lg">
          <div className="bg-white/5 p-8 rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Edit Account</h1>
            <p className="text-sm text-gray-300 mb-6">Update your personal details below.</p>

            {error && <div className="text-red-400 mb-4">{error}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300">Email (read-only)</label>
                <input value={user?.email ?? ''} readOnly className="mt-1 w-full px-3 py-2 rounded bg-transparent border border-gray-700 text-white" />
              </div>

              <div>
                <label className="block text-sm text-gray-300">Full name</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded bg-transparent border border-gray-700 text-white" />
              </div>

              <div>
                <label className="block text-sm text-gray-300">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded bg-transparent border border-gray-700 text-white" />
              </div>

              <div>
                <label className="block text-sm text-gray-300">Company</label>
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded bg-transparent border border-gray-700 text-white" />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 rounded">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button type="button" onClick={() => router.push('/account')} className="px-4 py-2 bg-gray-700 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
