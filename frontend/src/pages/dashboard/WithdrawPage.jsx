import React, { useState, useEffect } from 'react';
import { withdrawalAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export function WithdrawPage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ amount: '', method: 'bank_transfer', bankName: '', accountNumber: '', accountName: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const FEE_PERCENT = 1.5;
  const fee = form.amount ? Math.max((parseFloat(form.amount) * FEE_PERCENT) / 100, 0.5) : 0;
  const total = form.amount ? parseFloat(form.amount) + fee : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.kyc?.status !== 'approved') return toast.error('KYC required for withdrawals');
    if (total > (user?.balance || 0)) return toast.error('Insufficient balance');
    setLoading(true);
    try {
      const { data } = await withdrawalAPI.request({
        amount: parseFloat(form.amount), method: form.method,
        bankDetails: { bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName },
        note: form.note,
      });
      setSuccess(data);
      updateUser({ balance: data.newBalance });
      toast.success('Withdrawal request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  if (user?.kyc?.status !== 'approved') return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
        <div className="text-5xl mb-4">🛡️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">KYC Required</h2>
        <p className="text-gray-500 mb-4">Complete KYC verification to make withdrawals.</p>
        <button onClick={() => window.location.href = '/dashboard/kyc'}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors">Verify Now</button>
      </div>
    </div>
  );

  if (success) return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Withdrawal Requested</h2>
        <p className="text-gray-500 text-sm mb-4">Your request is pending admin approval. New balance: <strong>${success.newBalance?.toFixed(2)}</strong></p>
        <button onClick={() => setSuccess(null)} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors">New Request</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Withdraw Funds</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-gray-600">Available Balance: <strong className="text-gray-900">${(user?.balance || 0).toFixed(2)}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" min="5" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="0.00" />
            </div>
            {form.amount && (
              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                <div className="flex justify-between"><span>Fee:</span><span>${fee.toFixed(2)}</span></div>
                <div className="flex justify-between font-medium text-gray-700"><span>Total deducted:</span><span>${total.toFixed(2)}</span></div>
                {total > (user?.balance || 0) && <p className="text-red-500 font-medium">⚠ Insufficient balance</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
            <input required value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Bank of America" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
              <input required value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="1234567890" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
              <input required value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="John Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Reference" />
          </div>
          <button type="submit" disabled={loading || total > (user?.balance || 0) || !form.amount}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {loading ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default WithdrawPage;
