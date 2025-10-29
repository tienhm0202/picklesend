'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

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
  is_donation?: boolean;
}

export default function DepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDonation, setIsDonation] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    checkAdmin();
    fetchData();
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

  const fetchData = async () => {
    try {
      const [depositsRes, membersRes] = await Promise.all([
        fetch('/api/deposits'),
        fetch('/api/members'),
      ]);
      const depositsData = await depositsRes.json();
      const membersData = await membersRes.json();
      setDeposits(depositsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!isDonation && !memberId) || !date || !amount) return;

    try {
      await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: isDonation ? null : parseInt(memberId),
          date,
          amount: parseFloat(amount),
          is_donation: isDonation,
        }),
      });
      setMemberId('');
      setAmount('');
      setIsDonation(false);
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving deposit:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;

    try {
      await fetch(`/api/deposits/${id}`, { method: 'DELETE' });
      fetchData();
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

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDonation}
                    onChange={(e) => {
                      setIsDonation(e.target.checked);
                      if (e.target.checked) {
                        setMemberId('');
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold text-purple-600">Đây là khoản donate vào quỹ CLB</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!isDonation ? (
                  <select
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required={!isDonation}
                  >
                    <option value="">Chọn thành viên</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2 border-2 border-purple-300 bg-purple-50 rounded-lg flex items-center">
                    <span className="font-semibold text-purple-700">Quỹ CLB (Donate)</span>
                  </div>
                )}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Số tiền"
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
                      setAmount('');
                      setIsDonation(false);
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
                    <tr key={deposit.id} className={`border-b hover:bg-gray-50 ${deposit.is_donation ? 'bg-purple-50' : ''}`}>
                      <td className="px-4 py-3">
                        {deposit.is_donation ? (
                          <span className="font-semibold text-purple-700">{deposit.member_name}</span>
                        ) : (
                          deposit.member_name
                        )}
                      </td>
                      <td className="px-4 py-3">{new Date(deposit.date).toLocaleDateString('vi-VN')}</td>
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

