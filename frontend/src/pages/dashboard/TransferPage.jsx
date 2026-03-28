import React, { useState } from 'react';
import { userAPI, transactionAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function TransferPage() {
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [accountNum, setAccountNum] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const FEE_PERCENT = 1.5;
  const fee = form.amount ? Math.max((parseFloat(form.amount) * FEE_PERCENT) / 100, 0.5) : 0;
  const total = form.amount ? parseFloat(form.amount) + fee : 0;

  const lookupAccount = async () => {
    if (!accountNum.trim()) return;
    setSearching(true);
    try {
      const { data } = await userAPI.lookup(accountNum.trim());
      if (data.user._id === user._id) return toast.error('Cannot transfer to yourself');
      setRecipient(data.user);
      setStep(2);
    } catch {
      toast.error('Account not found');
    } finally { setSearching(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!recipient) return;
    if (total > user.balance) return toast.error('Insufficient balance');
    setLoading(true);
    try {
      const { data } = await transactionAPI.transfer({
        recipientAccountNumber: recipient.accountNumber,
        amount: parseFloat(form.amount),
        description: form.description,
        note: form.note,
      });
      setResult(data);
      updateUser({ balance: data.newBalance, trustPoints: (user.trustPoints || 0) + (data.trustPointsEarned || 0) });
      setStep(3);
      toast.success('Transfer successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally { setLoading(false); }
  };

  const reset = () => { setStep(1); setAccountNum(''); setRecipient(null); setForm({ amount: '', description: '', note: '' }); setResult(null); };

  if (user?.kyc?.status !== 'approved') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">KYC Required</h2>
          <p className="text-gray-500 mb-4">You need to complete KYC verification before making transfers.</p>
          <button onClick={() => window.location.href = '/dashboard/kyc'}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
            Complete KYC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Money</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Step Indicator */}
        <div className="flex border-b border-gray-100">
          {['Find Recipient', 'Transfer Details', 'Confirmation'].map((s, i) => (
            <div key={s} className={`flex-1 py-3 text-center text-xs font-medium ${
              step > i + 1 ? 'text-green-600 bg-green-50' :
              step === i + 1 ? 'text-primary-600 bg-primary-50' : 'text-gray-400'
            }`}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Find Account */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">Enter the recipient's Zenvio account number</p>
              <div className="flex gap-2">
                <input
                  value={accountNum}
                  onChange={e => setAccountNum(e.target.value.toUpperCase())}
                  onKeyPress={e => e.key === 'Enter' && lookupAccount()}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="ZNV12345678"
                />
                <button onClick={lookupAccount} disabled={searching}
                  className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors">
                  {searching
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <MagnifyingGlassIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Your balance: <strong className="text-gray-800">${(user?.balance || 0).toFixed(2)}</strong></p>
              </div>
            </div>
          )}

          {/* Step 2: Transfer Details */}
          {step === 2 && recipient && (
            <form onSubmit={handleTransfer} className="space-y-4">
              {/* Recipient */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                  {recipient.avatar
                    ? <img src={recipient.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-semibold text-sm">{recipient.firstName?.[0]}{recipient.lastName?.[0]}</span>}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{recipient.firstName} {recipient.lastName}</p>
                  <p className="text-xs text-gray-500">{recipient.accountNumber}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-primary-600 hover:underline">Change</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input type="number" min="1" step="0.01" required
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="0.00" />
                </div>
              </div>

              {form.amount && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Amount</span><span>${parseFloat(form.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Fee ({FEE_PERCENT}%)</span><span>${fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total Deducted</span><span>${total.toFixed(2)}</span>
                  </div>
                  {total > (user?.balance || 0) && (
                    <p className="text-red-500 text-xs font-medium">⚠ Insufficient balance</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="What is this for?" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  placeholder="Private note..." />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Back
                </button>
                <button type="submit" disabled={loading || total > (user?.balance || 0) || !form.amount}
                  className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors text-sm">
                  {loading ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && result && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-9 h-9 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Transfer Successful!</h3>
              <p className="text-gray-500 text-sm mb-4">Transaction ID: <span className="font-mono text-xs text-gray-700">{result.transaction?.transactionId}</span></p>

              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-left mb-5">
                <div className="flex justify-between"><span className="text-gray-500">Amount Sent</span><span className="font-semibold">${result.transaction?.amount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Fee</span><span>${result.fee?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">New Balance</span><span className="font-semibold text-primary-600">${result.newBalance?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Trust Points Earned</span><span className="text-yellow-600 font-semibold">+{result.trustPointsEarned} ⭐</span></div>
              </div>

              <button onClick={reset}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Send Another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
