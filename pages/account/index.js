import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

export default function AccountPage(){
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    const init = async () => {
      setLoading(true); setError('')
      const { data, error } = await supabase.auth.getUser()
      if(error){ setError(error.message); setLoading(false); return }
      if(!data?.user){ router.replace('/auth/login'); return }
      setUser(data.user); setLoading(false)
    }
    init()
  },[router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const becomeSeller = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if(!accessToken){ alert('Not logged in'); return }

      const { data } = await supabase.auth.getUser()
      const userId = data?.user?.id

      const res = await fetch('/api/create-seller', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ auth_user_id: userId, shop_name: 'Demo Wholesale' })
      })
      const json = await res.json()
      if(!res.ok) alert(json.error || 'Failed creating seller')
      else {
        alert(json.message || 'Seller created')
      }
    } catch (err) {
      console.error(err); alert('Unexpected error')
    }
  }

  if(loading) return <div className="p-8">Loading account…</div>

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto bg-white/90 rounded p-6">
        <h1 className="text-2xl font-bold">Hi, {user?.email}</h1>
        <p className="mt-2">This is your basic profile from Supabase Auth.</p>

        <div className="mt-6">
          <div><strong>User ID</strong></div>
          <div className="text-sm text-gray-700"><code>{user?.id}</code></div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={()=>router.push('/')} className="px-3 py-2 bg-gray-200 rounded">Back to marketplace</button>
          <button onClick={handleLogout} className="px-3 py-2 bg-red-400 rounded">Logout</button>
          <button onClick={becomeSeller} className="px-3 py-2 bg-green-500 rounded">Become a Seller</button>
        </div>
      </main>
    </div>
  )
}
