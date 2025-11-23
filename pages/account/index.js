// frontend/pages/account/index.js
import NavBar from '../../components/NavBar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient' // ensure this file exists

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError('')
      try {
        // uses new supabase client getSession/getUser depending on installed lib
        const { data } = await supabase.auth.getUser?.() || await supabase.auth.getSession?.()
        // handle both shapes: new client returns { data: { user } }, older clients differ
        const userObj = data?.user ?? (data?.session?.user ?? null)

        if (!userObj) {
          router.replace('/auth/login')
          return
        }

        setUser(userObj)
      } catch (err) {
        console.error('fetchUser error', err)
        setError('Could not load account. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error(err)
    } finally {
      router.push('/')
    }
  }

  // becomeSeller: calls server-side API route that uses the SUPABASE_SERVICE_KEY
  const becomeSeller = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.data?.session?.user?.id ?? sessionData?.user?.id

      if (!userId) {
        alert('Not logged in')
        return
      }

      const res = await fetch('/api/create-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, shop_name: 'Demo Wholesale' })
      })

      const json = await res.json()
      if (!res.ok) {
        alert(json.error || 'Failed creating seller')
      } else {
        alert(json.message || 'Seller created')
        // optionally reload or set state
      }
    } catch (err) {
      console.error('becomeSeller error', err)
      alert('Unexpected error: ' + (err.message || err))
    }
  }

  return (
    <div className="account-page" style={{ padding: 20 }}>
      <NavBar />

      <main className="account-main" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="account-card">
          {loading && <div>Loading account…</div>}

          {!loading && user && (
            <>
              <h1 className="account-title">Hi, {user.email || 'wholesale user'}</h1>
              <p className="account-subtitle">
                This is your basic profile from Supabase Auth. Later we can link this
                to buyer / seller records in the main database.
              </p>

              <div>
                <div style={{ fontWeight: 700 }}>User ID</div>
                <div style={{ marginBottom: 12 }}>
                  <code style={{ fontSize: '0.85rem' }}>{user.id}</code>
                </div>

                <div style={{ fontWeight: 700 }}>Email</div>
                <div style={{ marginBottom: 12 }}>{user.email || '—'}</div>

                <div style={{ fontWeight: 700 }}>Phone</div>
                <div style={{ marginBottom: 12 }}>
                  {user.phone || 'Not set (phone OTP to be configured later)'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => router.push('/')} className="btn">Back to marketplace</button>
                <button onClick={handleLogout} className="btn">Logout</button>
                <button onClick={becomeSeller} className="btn primary">Become a Seller</button>
              </div>
            </>
          )}

          {!loading && !user && !error && (
            <div>You are not logged in. Redirecting to login…</div>
          )}

          {error && <div className="auth-error" style={{ color: 'red' }}>{error}</div>}
        </div>
      </main>

      <footer style={{ marginTop: 40, textAlign: 'center' }}>
        Haullcell demo • Account data powered by Supabase Auth
      </footer>
    </div>
  )
}
