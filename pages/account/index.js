// import supabase from lib
import { supabase } from '../../lib/supabaseClient' // update path if different

// inside component, create function:
const becomeSeller = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.data?.session?.user?.id || sessionData?.user?.id || null
    // fallback older client: const { data } = await supabase.auth.getUser(); const userId = data?.user?.id

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
      // optionally refresh page / fetch sellers
    }
  } catch (err) {
    console.error(err)
    alert('Unexpected error: ' + (err.message || err))
  }
}
