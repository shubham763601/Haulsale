// pages/seller/payments.js
import SellerLayout from '../../components/SellerLayout'

export default function SellerPaymentsPage() {
  return (
    <SellerLayout title="Payments">
      <div className="bg-slate-800/70 rounded-xl p-4">
        <h2 className="font-semibold mb-2 text-sm">Payouts & earnings</h2>
        <p className="text-sm text-slate-400">
          Later we&apos;ll show settlements, commissions and payout status here.
        </p>
      </div>
    </SellerLayout>
  )
}
