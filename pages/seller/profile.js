// pages/seller/profile.js
import SellerLayout from '../../components/SellerLayout'

export default function SellerProfilePage() {
  // later you can load/save from `sellers` + `profiles` table
  return (
    <SellerLayout title="Store profile">
      <div className="max-w-3xl mx-auto bg-slate-800/70 rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-semibold mb-1">Store Profile</h2>
        <p className="text-sm text-slate-400 mb-6">
          Manage your store details that buyers will see.
        </p>

        <form className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Store logo
            </label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-700 flex items-center justify-center text-sm text-slate-300">
                Logo
              </div>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 text-sm font-medium hover:bg-amber-400"
              >
                Upload image
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Store name
              </label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="eg. Capitol Goods"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Owner name
              </label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Store address
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
              placeholder="Address, city, state, PIN"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                GSTIN
              </label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="07AAAAA0000A1Z5"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full md:w-auto px-3 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-medium hover:bg-emerald-400"
              >
                Verify
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contact number
              </label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Business email
              </label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="you@store.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Business hours
            </label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/60"
              placeholder="Mon–Sat, 10:00 AM – 8:00 PM"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
            >
              Save changes
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-200 hover:bg-slate-800/80"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </SellerLayout>
  )
}
