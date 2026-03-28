import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import { notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  HomeIcon, ArrowsRightLeftIcon, ArrowDownTrayIcon,
  ArrowUpTrayIcon, ShieldCheckIcon, StarIcon,
  UserGroupIcon, UserCircleIcon, BellIcon,
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard',              label: 'Dashboard',     icon: HomeIcon,                end: true },
  { to: '/dashboard/transfer',     label: 'Transfer',      icon: ArrowsRightLeftIcon },
  { to: '/dashboard/deposit',      label: 'Deposit',       icon: ArrowDownTrayIcon },
  { to: '/dashboard/withdraw',     label: 'Withdraw',      icon: ArrowUpTrayIcon },
  { to: '/dashboard/transactions', label: 'Transactions',  icon: ArrowsRightLeftIcon },
  { to: '/dashboard/kyc',          label: 'KYC Verify',    icon: ShieldCheckIcon },
  { to: '/dashboard/trust-points', label: 'Trust Points',  icon: StarIcon },
  { to: '/dashboard/partner',      label: 'Partner',       icon: UserGroupIcon },
  { to: '/dashboard/profile',      label: 'Profile',       icon: UserCircleIcon },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    notificationAPI.getAll({ unreadOnly: true, limit: 1 })
      .then(r => setUnreadCount(r.data.unreadCount))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const Sidebar = ({ mobile }) => (
    <div className={`flex flex-col h-full bg-gray-900 ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Zn</span>
          </div>
          <span className="text-white font-bold text-lg">Zenvio</span>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-semibold text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-400 text-xs truncate">{user?.accountNumber}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            user?.kyc?.status === 'approved' ? 'bg-green-900 text-green-300' :
            user?.kyc?.status === 'pending'  ? 'bg-yellow-900 text-yellow-300' :
            'bg-red-900 text-red-300'
          }`}>
            KYC: {user?.kyc?.status || 'Not Submitted'}
          </span>
          <span className="text-xs text-yellow-400 font-medium">⭐ {user?.trustPoints || 0} pts</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mx-4 mt-4 p-3 bg-primary-600 rounded-xl">
        <p className="text-primary-200 text-xs">Available Balance</p>
        <p className="text-white text-xl font-bold">${(user?.balance || 0).toFixed(2)}</p>
        <p className="text-primary-200 text-xs">{user?.currency || 'USD'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Admin link if admin */}
        {['admin', 'superadmin'].includes(user?.role) && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 border-t border-gray-700 pt-4 ${
                isActive ? 'bg-red-700 text-white' : 'text-red-400 hover:bg-gray-800 hover:text-red-300'
              }`
            }
          >
            <ShieldCheckIcon className="w-5 h-5" />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-sm text-gray-500">Welcome back, <span className="font-semibold text-gray-900">{user?.firstName}</span></h1>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button
              onClick={() => navigate('/dashboard/notifications')}
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-semibold">{user?.firstName?.[0]}</span>
                  }
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.firstName}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-slide-down">
                  <button onClick={() => { navigate('/dashboard/profile'); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    My Profile
                  </button>
                  <button onClick={() => { navigate('/dashboard/kyc'); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    KYC Verification
                  </button>
                  <hr className="my-1" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
