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
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading profile', error)
          setError('Failed to load profile')
          setProfile(null)
        } else if (!data) {
          // no profile row yet — show basic info from auth
          setProfile({
            id: user.id,
            email: user.email,
            full_name: '',
            phone: '',
            company: ''
          })
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
        <title>Account — Haullcell</title>
      </Head>

      <NavBar />

      <main className="min-h-screen p-8 flex items-start justify-center">
        <section className="w-full max-w-3xl">
          <div className="bg-white/5 backdrop-blur rounded-lg p-8 shadow">
            <h1 className="text-2xl font-bold mb-4 text-white">Account</h1>
            <p className="text-sm text-gray-300 mb-6">View your account details and manage your activity.</p>

            {error && <p className="text-red-400 mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <div className="bg-white/6 p-6 rounded mb-4">
                  <h2 className="font-semibold text-lg text-white mb-2">Profile</h2>
                  <p className="text-sm text-gray-300"><strong>Email:</strong> {profile?.email ?? user.email}</p>
                  <p className="text-sm text-gray-300"><strong>Name:</strong> {profile?.full_name || '—'}</p>
                  <p className="text-sm text-gray-300"><strong>Phone:</strong> {profile?.phone || '—'}</p>
                  <p className="text-sm text-gray-300"><strong>Company:</strong> {profile?.company || '—'}</p>
                </div>

                <div className="bg-white/6 p-6 rounded">
                  <h2 className="font-semibold text-lg text-white mb-2">Quick actions</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => router.push('/account/orders')} className="px-4 py-2 rounded bg-indigo-600">
                      View order history
                    </button>

                    <button onClick={() => router.push('/account/edit')} className="px-4 py-2 rounded bg-emerald-600">
                      Edit account info
                    </button>

                    <button onClick={() => router.push('/products')} className="px-4 py-2 rounded bg-gray-700">
                      Browse products
                    </button>
                  </div>
                </div>
              </div>

              <aside className="col-span-1">
                <div className="bg-white/6 p-6 rounded">
                  <h3 className="font-semibold text-white mb-2">Account</h3>
                  <p className="text-sm text-gray-300 mb-4">Signed in as <span className="font-medium">{user.email}</span></p>

                  <button onClick={handleSignOut} className="w-full px-4 py-2 rounded bg-red-600">
                    Sign out
                  </button>
                </div>
              </aside>
            </div>

          </div>
        </section>
      </main>
    </>
  )
}
