// pages/seller/index.js
import SellerLayout from '../../components/SellerLayout'

export default function SellerOverviewPage() {
  return (
    <SellerLayout title="Overview">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-800/70 rounded-xl p-4">
          <p className="text-xs text-slate-400">Today&apos;s orders</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
        <div className="bg-slate-800/70 rounded-xl p-4">
          <p className="text-xs text-slate-400">Revenue (last 7 days)</p>
          <p className="mt-2 text-2xl font-semibold">₹0</p>
        </div>
        <div className="bg-slate-800/70 rounded-xl p-4">
          <p className="text-xs text-slate-400">Active products</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
      </div>

      <div className="mt-6 bg-slate-800/70 rounded-xl p-4">
        <h2 className="font-semibold mb-2 text-sm">Recent activity</h2>
        <p className="text-sm text-slate-400">
          Once orders start coming in, you&apos;ll see them here.
        </p>
      </div>
    </SellerLayout>
  )
}
