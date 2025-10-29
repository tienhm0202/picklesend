'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, DollarSign, GamepadIcon, Receipt, Wallet, AlertCircle, FileText } from 'lucide-react';

interface Stats {
  totalFund: number;
  lowBalanceMembers: Array<{
    id: number;
    name: string;
    balance: number;
  }>;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize database on first load
    fetch('/api/init', { method: 'POST' });
    fetchStats();
  }, []);

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

  const menuItems = [
    { href: '/members', label: 'Thành viên', icon: Users, color: 'blue' },
    { href: '/guests', label: 'Khách', icon: UserPlus, color: 'green' },
    { href: '/deposits', label: 'Nạp tiền', icon: DollarSign, color: 'purple' },
    { href: '/games', label: 'Game', icon: GamepadIcon, color: 'orange' },
    { href: '/payments', label: 'Cần thu', icon: Receipt, color: 'red' },
    { href: '/report', label: 'Report', icon: FileText, color: 'indigo' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            PickleSpend
          </h1>
          <p className="text-xl text-gray-600">
            Quản lý chi tiêu và thanh toán cho nhóm chơi Pickleball
          </p>
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Fund Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Tổng quỹ</h2>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
            {loading ? (
              <p className="text-gray-500">Đang tải...</p>
            ) : (
              <p className="text-3xl font-bold text-blue-600">
                {stats?.totalFund?.toLocaleString('vi-VN') || '0'} đ
              </p>
            )}
          </div>

          {/* Low Balance Members Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Thành viên số dư thấp</h2>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            {loading ? (
              <p className="text-gray-500">Đang tải...</p>
            ) : stats && stats.lowBalanceMembers.length > 0 ? (
              <div className="space-y-2">
                {stats.lowBalanceMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-orange-50 rounded"
                  >
                    <span className="font-medium text-gray-800">{member.name}</span>
                    <span className="text-orange-600 font-semibold">
                      {member.balance.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
                <p className="text-sm text-gray-500 mt-2">
                  Có {stats.lowBalanceMembers.length} thành viên có số dư dưới 100.000 đ
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Không có thành viên nào có số dư dưới 100.000 đ</p>
            )}
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

