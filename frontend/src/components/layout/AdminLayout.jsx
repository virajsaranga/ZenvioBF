import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import { HomeIcon, UsersIcon, ArrowsRightLeftIcon, ShieldCheckIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const adminNav = [
  { to: '/admin',              label: 'Dashboard',    icon: HomeIcon,              end: true },
  { to: '/admin/users',        label: 'Users',         icon: UsersIcon },
  { to: '/admin/transactions', label: 'Transactions',  icon: ArrowsRightLeftIcon },
  { to: '/admin/kyc',          label: 'KYC Reviews',   icon: ShieldCheckIcon },
  { to: '/admin/deposits',     label: 'Deposits',      icon: ArrowDownTrayIcon },
  { to: '/admin/withdrawals',  label: 'Withdrawals',   icon: ArrowUpTrayIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); toast.success('Logged out'); navigate('/login'); };

  const Sidebar = ({ mobile }) => (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-white font-bold">Admin Panel</span>
        </div>
        {mobile && <button onClick={() => setSidebarOpen(false)} className="text-gray-400"><XMarkIcon className="w-5 h-5" /></button>}
      </div>
      <div className="px-4 py-4 border-b border-gray-800">
        <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
        <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-red-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        <NavLink to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white mt-4 border-t border-gray-800 pt-4">
          <HomeIcon className="w-5 h-5" />
          User Dashboard
        </NavLink>
      </nav>
      <div className="px-3 py-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="hidden lg:flex lg:flex-shrink-0"><div className="w-60"><Sidebar /></div></div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full"><Sidebar mobile /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">Zenvio <span className="text-red-600 font-semibold">Admin Panel</span></span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
