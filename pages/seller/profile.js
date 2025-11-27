// pages/seller/profile.js
import React, { useEffect, useState } from 'react'
import SellerLayout from '../../components/SellerLayout'
import { supabase } from '../../lib/supabaseClient'

export default function SellerProfilePage() {
  const [user, setUser] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    shop_name: '',
    gstin: '',
    logo_url: '',
    business_address: '',
    contact_number: '',
    business_email: '',
    business_hours: '',
    bank_account: ''
  })

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user ?? null
      if (mounted) setUser(u)
      if (u) loadSeller(u.id)
    })
    return () => { mounted = false }
  }, [])

  async function loadSeller(uid) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('sellers')
        .select('*')
        .eq('auth_user_id', uid)
        .maybeSingle()

      if (data) {
        setSeller(data)
        setForm({
          shop_name: data.shop_name || '',
          gstin: data.gstin || '',
          logo_url: data.logo_url || '',
          business_address: data.business_address || '',
          contact_number: data.contact_number || '',
          business_email: data.business_email || '',
          business_hours: data.business_hours || '',
          bank_account: data.bank_account || ''
        })
      } else {
        setSeller(null)
      }
    } catch (err) {
      console.error('load seller', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e?.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const payload = {
        auth_user_id: user.id,
        shop_name: form.shop_name,
        gstin: form.gstin || null,
        logo_url: form.logo_url || null,
        business_address: form.business_address || null,
        contact_number: form.contact_number || null,
        business_email: form.business_email || null,
        business_hours: form.business_hours || null,
        bank_account: form.bank_account || null,
      }

      // upsert: find by auth_user_id
      const { data, error } = await supabase
        .from('sellers')
        .upsert(payload, { onConflict: 'auth_user_id', returning: 'representation' })
        .select()

      if (error) throw error

      // supabase returns array
      const newRow = Array.isArray(data) ? data[0] : data
      setSeller(newRow)
      alert('Saved')
    } catch (err) {
      console.error('save seller', err)
      alert('Save failed: ' + (err.message || JSON.stringify(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SellerLayout title="Store profile">
      <div className="max-w-3xl mx-auto bg-slate-800/60 p-6 rounded">
        <h2 className="text-lg font-semibold mb-2">Store profile</h2>

        {loading ? <div>Loading...</div> : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs block mb-1">Shop name</label>
              <input className="w-full p-2 rounded bg-slate-900/60" value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))} required />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1">GSTIN</label>
                <input className="w-full p-2 rounded bg-slate-900/60" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs block mb-1">Contact number</label>
                <input className="w-full p-2 rounded bg-slate-900/60" value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs block mb-1">Business email</label>
              <input className="w-full p-2 rounded bg-slate-900/60" value={form.business_email} onChange={e => setForm(f => ({ ...f, business_email: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs block mb-1">Business address</label>
              <textarea className="w-full p-2 rounded bg-slate-900/60" value={form.business_address} onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))} />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1">Logo URL</label>
                <input className="w-full p-2 rounded bg-slate-900/60" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs block mb-1">Business hours</label>
                <input className="w-full p-2 rounded bg-slate-900/60" value={form.business_hours} onChange={e => setForm(f => ({ ...f, business_hours: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs block mb-1">Bank account (optional)</label>
              <input className="w-full p-2 rounded bg-slate-900/60" value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <button disabled={saving} className="px-3 py-2 rounded bg-emerald-500 text-slate-900">Save</button>
              <button type="button" onClick={() => loadSeller(user?.id)} className="px-3 py-2 rounded border">Reload</button>
            </div>
          </form>
        )}
      </div>
    </SellerLayout>
  )
}
