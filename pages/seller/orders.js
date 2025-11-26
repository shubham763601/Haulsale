// pages/seller/orders.js
import SellerLayout from '../../components/SellerLayout'

export default function SellerOrdersPage() {
  return (
    <SellerLayout title="Orders">
      <div className="bg-slate-800/70 rounded-xl p-4">
        <h2 className="font-semibold mb-2 text-sm">Orders</h2>
        <p className="text-sm text-slate-400">
          When customers place orders for your products, they&apos;ll appear here.
        </p>
      </div>
    </SellerLayout>
  )
}
