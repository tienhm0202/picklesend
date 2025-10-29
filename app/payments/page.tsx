'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';

interface Payment {
  id: number;
  game_id: number;
  game_date: string;
  game_note: string;
  member_id: number | null;
  member_name: string | null;
  guest_id: number | null;
  guest_name: string | null;
  amount: number;
  is_paid: boolean;
  paid_from_club_fund?: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  useEffect(() => {
    checkAdmin();
    fetchPayments();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/admin/login');
      if (res.ok) {
        const data = await res.json();
        if (!data.isAdmin) {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (id: number, currentStatus: boolean, isGuestPayment: boolean, paidFromClubFund: boolean = false) => {
    try {
      const newStatus = !currentStatus;
      // Only allow paid_from_club_fund for guest payments when marking as paid
      const useClubFund = isGuestPayment && newStatus && paidFromClubFund;

      await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_paid: newStatus,
          paid_from_club_fund: useClubFund,
        }),
      });
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.is_paid;
    return !payment.is_paid;
  });

  const unpaidPayments = payments.filter((p) => !p.is_paid);
  const totalUnpaid = unpaidPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý cần thu</h1>
              {totalUnpaid > 0 && (
                <p className="text-red-600 font-semibold mt-2">
                  Tổng cần thu: {totalUnpaid.toLocaleString('vi-VN')} đ
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('unpaid')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'unpaid'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Chưa thu
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'paid'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Đã thu
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filter === 'unpaid' ? 'Không còn khoản nào cần thu' : 'Không có dữ liệu'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ngày game</th>
                    <th className="px-4 py-3 text-left font-semibold">Người</th>
                    <th className="px-4 py-3 text-left font-semibold">Loại</th>
                    <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                    <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                    <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`border-b hover:bg-gray-50 ${
                        payment.is_paid ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        {new Date(payment.game_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {payment.member_name || payment.guest_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              payment.member_id
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {payment.member_id ? 'Thành viên' : 'Khách'}
                          </span>
                          {payment.paid_from_club_fund && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                              Từ quỹ CLB
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.game_note || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {payment.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 text-center">
                        {payment.is_paid ? (
                          <span className="text-green-600 font-semibold">Đã thu</span>
                        ) : (
                          <span className="text-red-600 font-semibold">Chưa thu</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!payment.is_paid && !payment.member_id ? (
                          // Guest payment - show options to pay from club fund or regular payment
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              onClick={() => handleTogglePaid(payment.id, payment.is_paid, true, false)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                              title="Đánh dấu đã thu (khách tự trả)"
                            >
                              Đã thu
                            </button>
                            <button
                              onClick={() => handleTogglePaid(payment.id, payment.is_paid, true, true)}
                              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg"
                              title="Thanh toán từ quỹ CLB"
                            >
                              Trừ quỹ CLB
                            </button>
                          </div>
                        ) : (
                          // Already paid or member payment
                          <button
                            onClick={() => handleTogglePaid(payment.id, payment.is_paid, !!payment.guest_id, payment.paid_from_club_fund || false)}
                            className={`p-2 rounded-full hover:bg-gray-200 ${
                              payment.is_paid ? 'text-green-600' : 'text-gray-400'
                            }`}
                            title={payment.is_paid ? 'Đánh dấu chưa thu' : 'Đánh dấu đã thu'}
                          >
                            {payment.is_paid ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

