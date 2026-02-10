'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

interface Member {
  id: number;
  name: string;
}

interface Deposit {
  id: number;
  member_id: number | null;
  member_name: string;
  date: string;
  amount: number;
}

function getTodayUTC7(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  useEffect(() => {
    checkAdmin();
    initFiltersAndData();
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
    } catch (error) {
      router.push('/');
    }
  };

  const initFiltersAndData = async () => {
    try {
      const today = getTodayUTC7();
      const latestRes = await fetch('/api/settlement-periods/latest');
      if (latestRes.ok) {
        const latest = await latestRes.json();
        const defaultFrom = latest?.to_date || '2000-01-01';
        setFilterFromDate(defaultFrom);
        setFilterToDate(today);
        await fetchDepositsWithFilter(defaultFrom, today);
      } else {
        setFilterFromDate('2000-01-01');
        setFilterToDate(today);
        await fetchDepositsWithFilter('2000-01-01', today);
      }
      const membersRes = await fetch('/api/members');
      const membersData = await membersRes.json();
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepositsWithFilter = async (from: string, to: string) => {
    try {
      const res = await fetch(`/api/deposits?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}`);
      const data = await res.ok ? res.json() : [];
      setDeposits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      setDeposits([]);
    }
  };

  const fetchData = async () => {
    if (filterFromDate && filterToDate) {
      await fetchDepositsWithFilter(filterFromDate, filterToDate);
    }
    const membersRes = await fetch('/api/members');
    const membersData = await membersRes.json();
    setMembers(membersData);
  };

  const handleApplyFilter = () => {
    if (!filterFromDate || !filterToDate) return;
    if (filterFromDate > filterToDate) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng đến ngày');
      return;
    }
    setLoading(true);
    fetchDepositsWithFilter(filterFromDate, filterToDate).finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      const parsedAmount = parseFormattedNumber(amount);
      if (parsedAmount <= 0) {
        alert('Số tiền phải lớn hơn 0');
        return;
      }

      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId ? parseInt(memberId) : null,
          date: date || undefined, // Let API use current date if not provided
          amount: parsedAmount,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Có lỗi xảy ra');
        return;
      }
      
      setMemberId('');
      setDate('');
      setAmount('');
      setShowAddForm(false);
      if (filterFromDate && filterToDate) {
        fetchDepositsWithFilter(filterFromDate, filterToDate);
      }
      const membersRes = await fetch('/api/members');
      setMembers(await membersRes.json());
    } catch (error) {
      console.error('Error saving deposit:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;

    try {
      await fetch(`/api/deposits/${id}`, { method: 'DELETE' });
      if (filterFromDate && filterToDate) {
        fetchDepositsWithFilter(filterFromDate, filterToDate);
      }
    } catch (error) {
      console.error('Error deleting deposit:', error);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nạp tiền</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm nạp tiền
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Lọc theo kỳ</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                Áp dụng
              </button>
            </div>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Tất cả tiền nạp sẽ vào quỹ chung của CLB. Chọn thành viên chỉ để theo dõi ai nạp tiền.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Chọn thành viên (tùy chọn)</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ngày nạp (mặc định: hôm nay)"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formatNumberInput(amount)}
                    onChange={(e) => {
                      // Allow only digits, commas, and decimal point
                      const cleaned = e.target.value.replace(/[^\d,.]/g, '');
                      // Replace multiple commas with single comma
                      const normalized = cleaned.replace(/,+/g, ',');
                      setAmount(normalized);
                    }}
                    onBlur={(e) => {
                      // Format on blur to ensure proper formatting
                      const parsed = parseFormattedNumber(e.target.value);
                      if (parsed > 0) {
                        setAmount(formatNumberInput(parsed));
                      }
                    }}
                    placeholder="Số tiền (ví dụ: 100,000)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setMemberId('');
                      setDate('');
                      setAmount('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có giao dịch nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Thành viên</th>
                    <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                    <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                    <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {deposit.member_name || 'Không xác định'}
                      </td>
                      <td className="px-4 py-3">{new Date(deposit.date + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        +{deposit.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(deposit.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
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

