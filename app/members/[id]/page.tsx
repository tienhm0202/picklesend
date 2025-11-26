'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface Deposit {
  id: number;
  date: string;
  amount: number;
  created_at: string;
}

interface MemberStats {
  member: {
    id: number;
    name: string;
    color?: string;
    letter?: string;
  };
  depositCount: number;
  totalDeposits: number;
  deposits: Deposit[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      fetchMemberStats();
    }
  }, [memberId]);

  const fetchMemberStats = async () => {
    try {
      const res = await fetch(`/api/members/${memberId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        router.push('/members');
      }
    } catch (error) {
      console.error('Error fetching member stats:', error);
      router.push('/members');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center py-16">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link href="/members" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách thành viên
        </Link>

        {/* Member Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={stats.member.name}
              color={stats.member.color}
              letter={stats.member.letter}
              size={80}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stats.member.name}</h1>
              <p className="text-gray-600">Lịch sử nạp tiền</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Số lần nạp tiền</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.depositCount}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Tổng số tiền đã nạp</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDeposits.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-gray-500 mt-2">
              (Tất cả tiền nạp vào quỹ chung CLB)
            </div>
          </div>
        </div>

        {/* Deposits List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh sách nạp tiền</h2>
          
          {stats.deposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Chưa có giao dịch nạp tiền nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">STT</th>
                    <th className="px-4 py-3 text-left font-semibold">Ngày nạp</th>
                    <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                    <th className="px-4 py-3 text-left font-semibold">Thời gian tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.deposits.map((deposit, index) => (
                    <tr key={deposit.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {stats.deposits.length - index}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(deposit.date + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        +{deposit.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(deposit.created_at).toLocaleString('vi-VN', { 
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-semibold text-right">
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
                      {stats.totalDeposits.toLocaleString('vi-VN')} đ
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
