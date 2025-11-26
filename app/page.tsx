'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, DollarSign, GamepadIcon, Wallet, AlertCircle, FileText, LogOut } from 'lucide-react';

interface Stats {
  clubFund: number;
  totalDeposits: number;
  totalGameCosts: number;
  isLowFund: boolean;
  isEmptyFund: boolean;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Initialize database on first load
    fetch('/api/init', { method: 'POST' });
    fetchStats();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/admin/login');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdmin(false);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const errorData = await res.json();
        console.error('Error fetching stats:', errorData);
        // Log detailed error for debugging
        if (errorData.error) {
          console.error('Error message:', errorData.error);
        }
        if (errorData.details) {
          console.error('Error details:', errorData.details);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Public menu items (visible to everyone)
  const publicMenuItems = [
    { href: '/members', label: 'Thành viên', icon: Users, color: 'blue' },
    { href: '/report', label: 'Report', icon: FileText, color: 'indigo' },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { href: '/deposits', label: 'Nạp tiền', icon: DollarSign, color: 'purple' },
    { href: '/games', label: 'Game', icon: GamepadIcon, color: 'orange' },
  ];

  // Combine menu items based on admin status
  const menuItems = isAdmin 
    ? [...publicMenuItems, ...adminMenuItems]
    : publicMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 relative">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            PickleSpend
          </h1>
          <p className="text-xl text-gray-600">
            Quản lý chi tiêu và thanh toán cho nhóm chơi Pickleball
          </p>
          {isAdmin && (
            <div className="absolute top-0 right-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout Admin
              </button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mb-8">
          {/* Alert for empty/low fund */}
          {stats && (stats.isEmptyFund || stats.isLowFund) && (
            <div className={`mb-6 p-4 rounded-lg ${
              stats.isEmptyFund 
                ? 'bg-red-100 border-2 border-red-500' 
                : 'bg-orange-100 border-2 border-orange-500'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-6 h-6 ${
                  stats.isEmptyFund ? 'text-red-600' : 'text-orange-600'
                }`} />
                <div>
                  <h3 className={`font-bold ${
                    stats.isEmptyFund ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {stats.isEmptyFund ? '⚠️ CẢNH BÁO: Quỹ CLB đã hết tiền!' : '⚠️ Quỹ CLB sắp hết tiền!'}
                  </h3>
                  <p className={`text-sm ${
                    stats.isEmptyFund ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    Quỹ hiện tại: <strong>{stats.clubFund.toLocaleString('vi-VN')} đ</strong>
                    {stats.isEmptyFund && ' - Vui lòng nạp tiền ngay!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Club Fund Card */}
            <div className={`bg-white rounded-lg shadow-lg p-6 ${
              stats?.isEmptyFund ? 'border-2 border-red-500' : stats?.isLowFund ? 'border-2 border-orange-500' : ''
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Quỹ CLB</h2>
                <Wallet className={`w-8 h-8 ${
                  stats?.isEmptyFund ? 'text-red-500' : stats?.isLowFund ? 'text-orange-500' : 'text-blue-500'
                }`} />
              </div>
              {loading ? (
                <p className="text-gray-500">Đang tải...</p>
              ) : (
                <p className={`text-3xl font-bold ${
                  stats?.isEmptyFund ? 'text-red-600' : stats?.isLowFund ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {stats?.clubFund?.toLocaleString('vi-VN') || '0'} đ
                </p>
              )}
            </div>

            {/* Total Deposits Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tổng nạp</h2>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              {loading ? (
                <p className="text-gray-500">Đang tải...</p>
              ) : (
                <p className="text-3xl font-bold text-green-600">
                  {stats?.totalDeposits?.toLocaleString('vi-VN') || '0'} đ
                </p>
              )}
            </div>

            {/* Total Game Costs Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tổng chi</h2>
                <GamepadIcon className="w-8 h-8 text-orange-500" />
              </div>
              {loading ? (
                <p className="text-gray-500">Đang tải...</p>
              ) : (
                <p className="text-3xl font-bold text-orange-600">
                  {stats?.totalGameCosts?.toLocaleString('vi-VN') || '0'} đ
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: 'bg-blue-500 hover:bg-blue-600',
              green: 'bg-green-500 hover:bg-green-600',
              purple: 'bg-purple-500 hover:bg-purple-600',
              orange: 'bg-orange-500 hover:bg-orange-600',
              red: 'bg-red-500 hover:bg-red-600',
              indigo: 'bg-indigo-500 hover:bg-indigo-600',
            };

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${colorClasses[item.color as keyof typeof colorClasses]} text-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
              >
                <div className="flex flex-col items-center">
                  <Icon className="w-16 h-16 mb-4" />
                  <h2 className="text-2xl font-semibold">{item.label}</h2>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

