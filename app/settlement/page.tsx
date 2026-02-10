'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';

interface SettlementPeriod {
  id: number;
  from_date: string;
  to_date: string;
  name: string | null;
  created_at: string;
}

export default function SettlementPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<SettlementPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    checkAdmin();
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      router.push('/');
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/settlement-periods');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data);
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      alert('Vui lòng nhập từ ngày và đến ngày');
      return;
    }
    if (fromDate > toDate) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng đến ngày');
      return;
    }
    try {
      const res = await fetch('/api/settlement-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_date: fromDate,
          to_date: toDate,
          name: name.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Có lỗi xảy ra');
        return;
      }
      setFromDate('');
      setToDate('');
      setName('');
      setShowForm(false);
      fetchPeriods();
    } catch (error) {
      console.error('Error creating period:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00+07:00').toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Chốt kỳ đối soát</h1>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tạo kỳ chốt
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                Tạo một chặng (kỳ) để đối soát nạp tiền, chi tiêu và số dư. Từ ngày / đến ngày xác định khoảng thời gian kỳ.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên kỳ (tùy chọn)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Kỳ 1 - T2/2026"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFromDate('');
                      setToDate('');
                      setName('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có kỳ chốt nào. Tạo kỳ đầu tiên để bắt đầu.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Từ ngày</th>
                    <th className="px-4 py-3 text-left font-semibold">Đến ngày</th>
                    <th className="px-4 py-3 text-left font-semibold">Tên kỳ</th>
                    <th className="px-4 py-3 text-left font-semibold">Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDate(p.from_date)}</td>
                      <td className="px-4 py-3">{formatDate(p.to_date)}</td>
                      <td className="px-4 py-3">{p.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(p.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
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
