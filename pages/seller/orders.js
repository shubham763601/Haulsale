// pages/seller/orders.js
import React from 'react';
import SellerLayout from '../../components/seller/SellerLayout';
import OrdersList from '../../components/seller/OrdersList';

export default function SellerOrders() {
  return (
    <SellerLayout>
      <div className="page-shell">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Orders</h1>
            <p className="text-sm text-slate-500 mt-1">Orders that contain one or more of your products.</p>
          </div>
        </div>

        <div className="mt-6">
          <OrdersList />
        </div>
      </div>
    </SellerLayout>
  );
}