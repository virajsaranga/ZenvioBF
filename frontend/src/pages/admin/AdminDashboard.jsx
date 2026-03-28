import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ===== STAT CARD =====
function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-xl mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

// ===== ADMIN DASHBOARD =====
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;

  const { stats } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"     value={stats?.totalUsers || 0}           color="bg-blue-100"   icon="👥" />
        <StatCard label="Active Users"    value={stats?.activeUsers || 0}          color="bg-green-100"  icon="✅" />
        <StatCard label="Pending KYC"     value={stats?.pendingKYC || 0}           color="bg-yellow-100" icon="🛡️" />
        <StatCard label="Total Volume"    value={`$${(stats?.totalVolume || 0).toFixed(0)}`} color="bg-purple-100" icon="💰" />
        <StatCard label="Total Fees"      value={`$${(stats?.totalFees || 0).toFixed(2)}`}   color="bg-emerald-100" icon="💵" />
        <StatCard label="Pending Deposits" value={stats?.pendingDeposits || 0}     color="bg-orange-100" icon="⬇️" />
        <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals || 0} color="bg-red-100" icon="⬆️" />
        <StatCard label="Total Transactions" value={stats?.totalTransactions || 0} color="bg-indigo-100" icon="📊" />
      </div>

      {/* Daily Volume Table */}
      {data?.dailyVolume?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Daily Volume (Last 30 days)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-500 font-medium">Date</th>
                <th className="text-right pb-2 text-gray-500 font-medium">Transactions</th>
                <th className="text-right pb-2 text-gray-500 font-medium">Volume</th>
              </tr></thead>
              <tbody>
                {data.dailyVolume.slice(-10).reverse().map(d => (
                  <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-700">{d._id}</td>
                    <td className="py-2 text-right text-gray-600">{d.count}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">${d.volume.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ADMIN USERS =====
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', kycStatus: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminAPI.getUsers({ search, ...filters, limit: 20 })
      .then(r => { setUsers(r.data.users); setPagination(r.data.pagination); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateUserStatus(id, { status });
      toast.success(`User ${status}`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, account..."
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={filters.kycStatus} onChange={e => setFilters({ ...filters, kycStatus: e.target.value, page: 1 })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="">All KYC</option>
          <option value="pending">KYC Pending</option>
          <option value="approved">KYC Approved</option>
          <option value="rejected">KYC Rejected</option>
          <option value="not_submitted">Not Submitted</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['User', 'Account', 'Balance', 'Status', 'KYC', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{u.accountNumber}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${(u.balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.kyc?.status === 'approved' ? 'bg-green-100 text-green-700' : u.kyc?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.kyc?.status || 'n/a'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {u.status !== 'active' && (
                          <button onClick={() => updateStatus(u._id, 'active')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">Activate</button>
                        )}
                        {u.status !== 'suspended' && (
                          <button onClick={() => updateStatus(u._id, 'suspended')} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <span className="text-sm text-gray-500">Page {filters.page} of {pagination.pages}</span>
                <button disabled={filters.page >= pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ADMIN KYC =====
export function AdminKYC() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejReason, setRejReason] = useState('');

  const load = () => {
    setLoading(true);
    adminAPI.getUsers({ kycStatus: 'pending', limit: 50 })
      .then(r => setUsers(r.data.users))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (userId, decision) => {
    if (decision === 'rejected' && !rejReason) return toast.error('Provide rejection reason');
    try {
      await adminAPI.reviewKYC(userId, { decision, reason: rejReason });
      toast.success(`KYC ${decision}`);
      setSelected(null);
      setRejReason('');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">KYC Reviews ({users.length} pending)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-4xl mb-3">✅</p><p className="text-gray-500">No pending KYC reviews</p>
          </div>
        ) : users.map(u => (
          <div key={u._id} className={`bg-white rounded-2xl border-2 shadow-sm p-5 cursor-pointer transition-all ${selected?._id === u._id ? 'border-red-400' : 'border-gray-100 hover:border-gray-300'}`}
            onClick={() => setSelected(selected?._id === u._id ? null : u)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700">
                {u.firstName?.[0]}{u.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-gray-400">{u.email} · {u.accountNumber}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Doc Type: <strong>{u.kyc?.documents?.[0]?.type || 'n/a'}</strong></p>
              <p>Submitted: <strong>{u.kyc?.submittedAt ? new Date(u.kyc.submittedAt).toLocaleDateString() : 'n/a'}</strong></p>
              <p>Docs uploaded: <strong>{u.kyc?.documents?.length || 0}</strong></p>
            </div>
            {u.kyc?.documents?.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {u.kyc.documents.map((d, i) => (
                  <a key={i} href={d.fileUrl} target="_blank" rel="noreferrer"
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    onClick={e => e.stopPropagation()}>
                    {d.type}
                  </a>
                ))}
              </div>
            )}
            {selected?._id === u._id && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>
                <textarea value={rejReason} onChange={e => setRejReason(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Rejection reason (required for reject)" />
                <div className="flex gap-2">
                  <button onClick={() => review(u._id, 'approved')}
                    className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
                    ✅ Approve
                  </button>
                  <button onClick={() => review(u._id, 'rejected')}
                    className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ADMIN DEPOSITS =====
export function AdminDeposits() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [note, setNote] = useState({});

  const load = () => {
    setLoading(true);
    adminAPI.getAllTransactions({ type: 'deposit', status: statusFilter, limit: 50 })
      .then(r => setTxs(r.data.transactions))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const review = async (id, decision) => {
    try {
      await adminAPI.reviewDeposit(id, { decision, note: note[id] || '' });
      toast.success(`Deposit ${decision === 'approve' ? 'approved' : 'rejected'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Deposit Management</h1>
      <div className="flex gap-3 mb-4">
        {['pending', 'completed', 'failed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {loading ? <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
          : txs.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><p className="text-gray-500">No {statusFilter} deposits</p></div>
          : txs.map(tx => (
          <div key={tx._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{tx.recipient?.firstName} {tx.recipient?.lastName}</p>
                <p className="text-xs text-gray-400">{tx.recipient?.email} · {tx.transactionId}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">${tx.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 capitalize">{tx.depositMethod?.replace('_', ' ')}</p>
              </div>
            </div>
            {tx.depositProof && (
              <a href={tx.depositProof} target="_blank" rel="noreferrer"
                className="inline-block text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors mb-3">
                📄 View Proof
              </a>
            )}
            {tx.status === 'pending' && (
              <div className="flex gap-2 items-center mt-2">
                <input value={note[tx._id] || ''} onChange={e => setNote({ ...note, [tx._id]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Admin note (optional)" />
                <button onClick={() => review(tx._id, 'approve')} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">Approve</button>
                <button onClick={() => review(tx._id, 'reject')} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">Reject</button>
              </div>
            )}
            {tx.status !== 'pending' && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {tx.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ADMIN WITHDRAWALS =====
export function AdminWithdrawals() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [note, setNote] = useState({});

  const load = () => {
    setLoading(true);
    adminAPI.getAllTransactions({ type: 'withdrawal', status: statusFilter, limit: 50 })
      .then(r => setTxs(r.data.transactions))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const process = async (id, decision) => {
    try {
      await adminAPI.processWithdrawal(id, { decision, note: note[id] || '' });
      toast.success(`Withdrawal ${decision === 'approve' ? 'processed' : 'cancelled & refunded'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Withdrawal Management</h1>
      <div className="flex gap-3 mb-4">
        {['pending', 'completed', 'refunded'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {loading ? <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
          : txs.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><p className="text-gray-500">No {statusFilter} withdrawals</p></div>
          : txs.map(tx => (
          <div key={tx._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{tx.sender?.firstName} {tx.sender?.lastName}</p>
                <p className="text-xs text-gray-400">{tx.sender?.email} · {tx.transactionId}</p>
              </div>
              <p className="text-lg font-bold text-gray-900">${tx.amount.toFixed(2)} <span className="text-sm font-normal text-gray-400">(+${tx.fee?.toFixed(2)} fee)</span></p>
            </div>
            {tx.bankDetails && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1 mb-3">
                <p><strong>Bank:</strong> {tx.bankDetails.bankName}</p>
                <p><strong>Account:</strong> {tx.bankDetails.accountNumber} · {tx.bankDetails.accountName}</p>
              </div>
            )}
            {tx.status === 'pending' && (
              <div className="flex gap-2 items-center">
                <input value={note[tx._id] || ''} onChange={e => setNote({ ...note, [tx._id]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Admin note (optional)" />
                <button onClick={() => process(tx._id, 'approve')} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">Process</button>
                <button onClick={() => process(tx._id, 'reject')} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">Cancel & Refund</button>
              </div>
            )}
            {tx.status !== 'pending' && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {tx.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTransactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 });

  useEffect(() => {
    setLoading(true);
    adminAPI.getAllTransactions({ ...filters, limit: 25 })
      .then(r => setTxs(r.data.transactions))
      .catch(() => {}).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Transactions</h1>
      <div className="flex gap-3 mb-4">
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Types</option>
          <option value="transfer_out">Transfers</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['ID', 'From', 'To', 'Type', 'Amount', 'Fee', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txs.map(tx => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{tx.transactionId}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{tx.sender?.firstName || '-'} {tx.sender?.lastName || ''}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{tx.recipient?.firstName || '-'} {tx.recipient?.lastName || ''}</td>
                    <td className="px-4 py-3 text-xs capitalize text-gray-600">{tx.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-sm font-semibold">${tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">${(tx.fee || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{tx.status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
