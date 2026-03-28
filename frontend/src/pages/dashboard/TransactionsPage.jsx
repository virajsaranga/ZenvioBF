import React, { useEffect, useState } from 'react';
import { transactionAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import { ArrowUpRightIcon, ArrowDownLeftIcon } from '@heroicons/react/24/outline';

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    transactionAPI.getAll({ ...filters, limit: 20 })
      .then(r => { setTxs(r.data.transactions); setPagination(r.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const isPositive = (type) => ['transfer_in', 'deposit', 'trust_points_redeem'].includes(type);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4 flex flex-wrap gap-3">
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Types</option>
          <option value="transfer_out">Sent</option>
          <option value="transfer_in">Received</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <span className="ml-auto text-sm text-gray-500 self-center">{pagination.total || 0} transactions</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : txs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Transaction', 'Type', 'Amount', 'Fee', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {txs.map(tx => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive(tx.type) ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isPositive(tx.type)
                              ? <ArrowDownLeftIcon className="w-3.5 h-3.5 text-green-600" />
                              : <ArrowUpRightIcon className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-xs font-mono text-gray-700">{tx.transactionId}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[120px]">{tx.description || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{tx.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${isPositive(tx.type) ? 'text-green-600' : 'text-red-500'}`}>
                          {isPositive(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">${(tx.fee || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                          tx.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                          tx.status === 'failed'    ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {filters.page} of {pagination.pages}</span>
                <button disabled={filters.page >= pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
