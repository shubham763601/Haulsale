// pages/seller/orders.js
import React from 'react';
import SellerLayout from '../../components/seller/SellerLayout';
import OrdersList from '../../components/seller/OrdersList';

export default function SellerOrders() {
  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-slate-500">Orders that include your products. Manage fulfillment here.</p>
        <div className="mt-4">
          <OrdersList />
        </div>
      </div>
    </SellerLayout>
  );
}
