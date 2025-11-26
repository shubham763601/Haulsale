// pages/seller/products.js
import SellerLayout from '../../components/SellerLayout'

export default function SellerProductsPage() {
  return (
    <SellerLayout title="Products">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Your products</h2>
        <button className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 text-sm font-medium hover:bg-amber-400">
          Add product
        </button>
      </div>

      <div className="overflow-x-auto bg-slate-800/70 rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/90 text-slate-300">
            <tr>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Price</th>
              <th className="text-left px-4 py-2">Stock</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-700/60">
              <td className="px-4 py-3 text-slate-200">Sample product</td>
              <td className="px-4 py-3">₹0.00</td>
              <td className="px-4 py-3">0</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  Draft
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SellerLayout>
  )
}
