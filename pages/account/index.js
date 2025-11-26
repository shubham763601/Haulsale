// pages/account/index.js
import Head from 'next/head'
import React, { useContext, useEffect, useState } from 'react'
import NavBar from '../../components/NavBar'
import UserContext from '../../lib/userContext'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function AccountPage() {
  const router = useRouter()
  const { user } = useContext(UserContext)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      setLoading(true)
      setError(null)

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone, company, role, updated_at')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading profile', error)
          setError('Failed to load profile')
          setProfile(null)
        } else if (!data) {
          setProfile(null)
        } else {
          setProfile(data)
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
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
            <p className="text-white">Please sign in to view your account.</p>
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
        <title>Account — Haulcell</title>
      </Head>

      <NavBar />

      <main className="min-h-screen p-8 flex items-start justify-center">
        <section className="w-full max-w-2xl">
          <div className="bg-white/5 backdrop-blur rounded-lg p-8 shadow">
            <h1 className="text-2xl font-bold mb-4 text-white">Account</h1>
            <p className="text-sm text-gray-300 mb-6">View your account details and quick actions.</p>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="text-sm text-gray-300 mt-2">Email: <span className="text-white underline">{user.email}</span></p>
              <p className="text-sm text-gray-300 mt-1">Name: <span className="text-white">{profile?.full_name ?? '—'}</span></p>
              <p className="text-sm text-gray-300 mt-1">Phone: <span className="text-white">{profile?.phone ?? '—'}</span></p>
              <p className="text-sm text-gray-300 mt-1">Company: <span className="text-white">{profile?.company ?? '—'}</span></p>
              <p className="text-sm text-gray-300 mt-1">Role: <span className="text-white">{profile?.role ?? '—'}</span></p>
  
            </div>

            <div className="space-y-3">
              <button onClick={() => router.push('/account/orders')} className="w-full px-4 py-3 rounded bg-violet-600">
                View order history
              </button>

              <button onClick={() => router.push('/account/edit')} className="w-full px-4 py-3 rounded bg-green-600">
                Edit account info
              </button>

              <button onClick={() => router.push('/products')} className="w-full px-4 py-3 rounded bg-gray-700 text-white">
                Browse products
              </button>

              <button onClick={handleSignOut} className="w-full px-4 py-3 rounded bg-red-600 text-white">
                Sign out
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
