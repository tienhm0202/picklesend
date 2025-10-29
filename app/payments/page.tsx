'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  useEffect(() => {
    fetchPayments();
  }, []);

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

  const handleTogglePaid = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paid: !currentStatus }),
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
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            payment.member_id
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {payment.member_id ? 'Thành viên' : 'Khách'}
                        </span>
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
                        <button
                          onClick={() => handleTogglePaid(payment.id, payment.is_paid)}
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

