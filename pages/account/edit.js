// pages/account/edit.js
import Head from 'next/head'
import React, { useContext, useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import UserContext from '../../lib/userContext'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function EditAccountPage() {
  const router = useRouter()
  const { user } = useContext(UserContext)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    company: '',
    email: '',
  })
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      setLoading(true)
      setError(null)
      setInfo(null)

      if (!user) {
        setProfile(null)
        setForm(f => ({ ...f, email: '' }))
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading profile', error)
          setError('Failed to load profile')
          setProfile(null)
        } else if (!data) {
          setProfile(null)
          setForm(f => ({ ...f, email: user.email ?? '' }))
        } else {
          setProfile(data)
          setForm({
            full_name: data.full_name ?? '',
            phone: data.phone ?? '',
            company: data.company ?? '',
            email: data.email ?? user.email ?? '',
          })
        }
      } catch (err) {
        console.error(err)
        setError('Unexpected error loading profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [user])

  async function handleSave(e) {
    e?.preventDefault()
    setSaving(true)
    setError(null)
    setInfo(null)
    if (!user) {
      setError('You must be signed in to update your profile')
      setSaving(false)
      return
    }

    try {
      const payload = {
        id: user.id,
        email: form.email ?? user.email,
        full_name: form.full_name,
        phone: form.phone,
        company: form.company,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { returning: 'representation' })
        .select()

      if (error) {
        console.error('Upsert error', error)
        setError('Failed to save profile: ' + (error.message || JSON.stringify(error)))
      } else {
        setProfile(Array.isArray(data) ? data[0] : data)
        setInfo('Profile saved successfully')
        // after save redirect back to account page
        setTimeout(() => router.push('/account'), 800)
      }
    } catch (err) {
      console.error(err)
      setError('Unexpected error while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen p-8 flex items-center justify-center">
          <div className="text-gray-300">Loading profile...</div>
        </main>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen p-8 flex items-center justify-center">
          <div className="max-w-md bg-white/5 p-8 rounded">
            <p className="text-white">Please sign in to edit your account.</p>
            <div className="mt-4">
              <button onClick={() => router.push('/auth/login')} className="px-4 py-2 rounded bg-indigo-600">
                Go to Sign in
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Edit Account — Haullcell</title>
      </Head>

      <NavBar />

      <main className="min-h-screen p-8 flex items-start justify-center">
        <section className="w-full max-w-2xl">
          <div className="bg-white/5 backdrop-blur rounded-lg p-8 shadow">
            <h1 className="text-2xl font-bold mb-4 text-white">Edit Account</h1>
            <p className="text-sm text-gray-300 mb-6">Update your personal details below.</p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300">Email (read-only)</label>
                <input className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white" value={form.email ?? user.email} readOnly />
              </div>

              <div>
                <label className="block text-sm text-gray-300">Full name</label>
                <input className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300">Phone</label>
                <input className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300">Company</label>
                <input className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 items-center">
                <button disabled={saving} type="submit" className="px-4 py-2 rounded bg-green-600">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>

                <button type="button" onClick={() => router.push('/account')} className="px-3 py-2 rounded bg-gray-700">
                  Cancel
                </button>
              </div>

              {info && <p className="text-green-400">{info}</p>}
              {error && <p className="text-red-400">{error}</p>}
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
