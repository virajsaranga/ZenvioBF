import React, { useEffect, useState } from 'react';
import { trustAPI, partnerAPI, notificationAPI, userAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';

// ===== TRUST POINTS PAGE =====
export function TrustPointsPage() {
  const { user, updateUser } = useAuthStore();
  const [data, setData] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { trustAPI.getPoints().then(r => setData(r.data)).catch(() => {}); }, []);

  const handleRedeem = async () => {
    const pts = parseInt(redeemAmount);
    if (!pts || pts < 100) return toast.error('Minimum 100 points');
    setLoading(true);
    try {
      const { data: res } = await trustAPI.redeem(pts);
      toast.success(res.message);
      updateUser({ balance: res.newBalance, trustPoints: res.remainingPoints });
      setRedeemAmount('');
      trustAPI.getPoints().then(r => setData(r.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Redeem failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trust Points</h1>
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white mb-6">
        <p className="text-yellow-100 text-sm mb-1">Your Trust Points</p>
        <p className="text-5xl font-bold">⭐ {user?.trustPoints || 0}</p>
        <p className="text-yellow-100 text-sm mt-2">≈ ${((user?.trustPoints || 0) * 0.01).toFixed(2)} cash value</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Per Transfer', value: '10 pts', icon: '💸' },
          { label: 'KYC Approved', value: '20 pts', icon: '🛡️' },
          { label: 'Referral Bonus', value: '50 pts', icon: '🤝' },
          { label: 'Cash Rate', value: '$0.01/pt', icon: '💰' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Redeem */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Redeem Points</h3>
        <p className="text-sm text-gray-500 mb-4">Minimum 100 points. Rate: 100 pts = $1.00</p>
        <div className="flex gap-3">
          <input type="number" min="100" step="100" value={redeemAmount} onChange={e => setRedeemAmount(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="Enter points (min 100)" />
          <button onClick={handleRedeem} disabled={loading || !redeemAmount}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
            {loading ? '...' : 'Redeem'}
          </button>
        </div>
        {redeemAmount >= 100 && <p className="text-xs text-gray-500 mt-2">= ${(parseInt(redeemAmount || 0) * 0.01).toFixed(2)} cash</p>}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Points History</h3>
        {data?.history?.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No history yet</p>
          : (data?.history || []).slice().reverse().slice(0, 20).map((h, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm text-gray-700">{h.reason}</p>
              <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</p>
            </div>
            <span className={`text-sm font-semibold ${h.type === 'earned' ? 'text-green-600' : 'text-red-500'}`}>
              {h.type === 'earned' ? '+' : '-'}{h.amount} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== PARTNER PAGE =====
export function PartnerPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => { partnerAPI.getStats().then(r => setStats(r.data)).catch(() => {}); }, []);

  const applyPartner = async () => {
    if (user?.kyc?.status !== 'approved') return toast.error('KYC required for partner program');
    setApplying(true);
    try {
      await partnerAPI.apply();
      toast.success('Partner application approved!');
      partnerAPI.getStats().then(r => setStats(r.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApplying(false); }
  };

  const referralLink = `${window.location.origin}/register?ref=${stats?.referralCode || ''}`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Partner Program</h1>

      {!stats?.isPartner ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-5xl mb-4">🤝</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Become a Partner</h2>
          <p className="text-gray-500 mb-4">Earn commissions by referring users to Zenvio. Requires KYC verification.</p>
          <ul className="text-sm text-gray-600 space-y-1.5 mb-6 text-left max-w-xs mx-auto">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Earn 5% commission on referral transactions</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 50 Trust Points per referral signup</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unique referral link</li>
          </ul>
          <button onClick={applyPartner} disabled={applying}
            className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {applying ? 'Applying...' : 'Apply Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
            <p className="text-primary-200 text-sm mb-1">Partner Status</p>
            <p className="text-2xl font-bold">Active Partner ✅</p>
            <p className="text-primary-200 text-sm mt-1">Commission Rate: {stats.commissionRate}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.referralCount}</p>
              <p className="text-sm text-gray-500">Total Referrals</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-3xl font-bold text-yellow-600">⭐ {stats.trustPoints}</p>
              <p className="text-sm text-gray-500">Trust Points</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Your Referral Link</h3>
            <div className="flex gap-2">
              <input readOnly value={referralLink}
                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-mono text-xs" />
              <button onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Copied!'); }}
                className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700 transition-colors">Copy</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Code: <strong className="font-mono">{stats.referralCode}</strong></p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Referrals</h3>
            {stats.referrals?.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No referrals yet. Share your link!</p>
              : stats.referrals?.slice(0, 10).map(r => (
              <div key={r._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
                    {r.firstName?.[0]}{r.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== NOTIFICATIONS PAGE =====
export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationAPI.getAll({ limit: 50 })
      .then(r => { setNotifications(r.data.notifications); setUnreadCount(r.data.unreadCount); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationAPI.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('All marked as read');
  };

  const iconMap = { transaction: '💸', kyc: '🛡️', security: '🔐', trust_points: '⭐', system: '📢', promotion: '🎁' };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications {unreadCount > 0 && <span className="ml-2 text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}</h1>
        {unreadCount > 0 && <button onClick={markAllRead} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Mark all read</button>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12"><p className="text-4xl mb-3">🔔</p><p className="text-gray-500">No notifications yet</p></div>
        ) : notifications.map(n => (
          <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
            className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
              {iconMap[n.type] || '📢'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium text-gray-900 ${!n.isRead ? 'font-semibold' : ''}`}>{n.tznve}</p>
              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export { TrustPointsPage as default };
