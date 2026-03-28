import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import { transactionAPI, notificationAPI } from '../../services/api';
import {
  ArrowUpRightIcon, ArrowDownLeftIcon, ArrowsRightLeftIcon,
  ShieldCheckIcon, StarIcon, BellIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function StatCard({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-600 text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function TxRow({ tx, userId }) {
  const isSender = tx.sender?._id === userId || tx.type === 'transfer_out' || tx.type === 'withdrawal';
  const isPositive = ['transfer_in', 'deposit', 'trust_points_redeem'].includes(tx.type);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
        {isPositive
          ? <ArrowDownLeftIcon className="w-4 h-4 text-green-600" />
          : <ArrowUpRightIcon className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {tx.type === 'transfer_out' ? `To: ${tx.recipient?.firstName} ${tx.recipient?.lastName}` :
           tx.type === 'transfer_in'  ? `From: ${tx.sender?.firstName} ${tx.sender?.lastName}` :
           tx.type === 'deposit'      ? 'Deposit' :
           tx.type === 'withdrawal'   ? 'Withdrawal' : tx.type}
        </p>
        <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()} · {tx.transactionId}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {isPositive ? '+' : '-'}${tx.amount.toFixed(2)}
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          tx.status === 'completed' ? 'bg-green-100 text-green-700' :
          tx.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>{tx.status}</span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      transactionAPI.getSummary(),
      transactionAPI.getAll({ limit: 8 }),
    ]).then(([s, t]) => {
      setSummary(s.data.summary);
      setTxs(t.data.transactions);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KYC Banner */}
      {user?.kyc?.status !== 'approved' && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          user?.kyc?.status === 'pending'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">
              {user?.kyc?.status === 'pending'
                ? 'KYC Under Review — We\'ll notify you once approved'
                : 'Complete KYC Verification to unlock all features'}
            </p>
          </div>
          {user?.kyc?.status !== 'pending' && (
            <button onClick={() => navigate('/dashboard/kyc')}
              className="text-sm font-semibold px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Verify Now
            </button>
          )}
        </div>
      )}

      {/* Balance Hero */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm mb-1">Total Balance</p>
            <p className="text-4xl font-bold">${(user?.balance || 0).toFixed(2)}</p>
            <p className="text-primary-200 text-sm mt-1">{user?.currency || 'USD'} · {user?.accountNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-200 text-xs">Trust Points</p>
            <p className="text-2xl font-bold text-yellow-300">⭐ {user?.trustPoints || 0}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => navigate('/dashboard/transfer')}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowsRightLeftIcon className="w-4 h-4" /> Send
          </button>
          <button onClick={() => navigate('/dashboard/deposit')}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowDownLeftIcon className="w-4 h-4" /> Deposit
          </button>
          <button onClick={() => navigate('/dashboard/withdraw')}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowUpRightIcon className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sent"     value={`$${(summary?.totalSent || 0).toFixed(2)}`}     sub={`${summary?.totalSentCount || 0} transfers`}     icon={ArrowUpRightIcon}     color="bg-red-500"    onClick={() => navigate('/dashboard/transactions')} />
        <StatCard label="Total Received" value={`$${(summary?.totalReceived || 0).toFixed(2)}`} sub={`${summary?.totalReceivedCount || 0} received`}   icon={ArrowDownLeftIcon}    color="bg-green-500"  onClick={() => navigate('/dashboard/transactions')} />
        <StatCard label="This Month Sent" value={`$${(summary?.monthSent || 0).toFixed(2)}`}   sub="current month"                                       icon={ArrowsRightLeftIcon}  color="bg-primary-600" />
        <StatCard label="Trust Points"   value={user?.trustPoints || 0}                         sub="redeemable points"                                   icon={StarIcon}             color="bg-yellow-500" onClick={() => navigate('/dashboard/trust-points')} />
      </div>

      {/* Quick Actions + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Send Money',       icon: '💸', path: '/dashboard/transfer',     color: 'hover:bg-blue-50' },
              { label: 'Deposit Funds',    icon: '💰', path: '/dashboard/deposit',      color: 'hover:bg-green-50' },
              { label: 'Withdraw',         icon: '🏦', path: '/dashboard/withdraw',     color: 'hover:bg-purple-50' },
              { label: 'Verify KYC',       icon: '🛡️', path: '/dashboard/kyc',          color: 'hover:bg-yellow-50' },
              { label: 'Redeem Points',    icon: '⭐', path: '/dashboard/trust-points', color: 'hover:bg-orange-50' },
              { label: 'Partner Program',  icon: '🤝', path: '/dashboard/partner',      color: 'hover:bg-pink-50' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 ${a.color} transition-colors text-left`}>
                <span className="text-lg">{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            <button onClick={() => navigate('/dashboard/transactions')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          {txs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 text-sm">No transactions yet</p>
              <button onClick={() => navigate('/dashboard/transfer')}
                className="mt-3 text-primary-600 text-sm hover:underline">
                Make your first transfer
              </button>
            </div>
          ) : (
            <div>
              {txs.map(tx => <TxRow key={tx._id} tx={tx} userId={user?._id} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
