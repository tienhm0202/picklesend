'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';


interface GameExpense {
  id?: number;
  name: string;
  amount: number;
}

interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  expenses?: GameExpense[];
}

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [expenses, setExpenses] = useState<Array<{ name: string; amount: string }>>([
    { name: 'Tiền sân', amount: '' },
    { name: 'Tiền nước', amount: '' },
  ]);
  const [clubFundBalance, setClubFundBalance] = useState<number | null>(null);

  useEffect(() => {
    checkAdmin();
    fetchData();
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

  const fetchData = async () => {
    try {
      const [gamesRes, statsRes] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/stats'),
      ]);
      const gamesData = await gamesRes.json();
      const statsData = await statsRes.json();
      setGames(gamesData);
      setClubFundBalance(statsData.clubFund || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpenseRow = () => {
    setExpenses([...expenses, { name: '', amount: '' }]);
  };

  const removeExpenseRow = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index));
    }
  };

  const updateExpense = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate expenses
    const validExpenses = expenses.filter(exp => exp.name.trim() !== '' && exp.amount.trim() !== '');
    if (validExpenses.length === 0) {
      alert('Vui lòng nhập ít nhất một chi phí');
      return;
    }

    // Parse and validate amounts
    const parsedExpenses = validExpenses.map(exp => {
      const parsedAmount = parseFormattedNumber(exp.amount);
      if (parsedAmount < 0) {
        throw new Error('Số tiền không được âm');
      }
      return {
        name: exp.name.trim(),
        amount: parsedAmount,
      };
    });

    const totalAmount = parsedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    if (clubFundBalance !== null && clubFundBalance < totalAmount) {
      alert(`Quỹ CLB không đủ tiền! Hiện tại: ${clubFundBalance.toLocaleString('vi-VN')} đ, Cần: ${totalAmount.toLocaleString('vi-VN')} đ`);
      return;
    }

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date || undefined, // Let API use current date if not provided
          note,
          expenses: parsedExpenses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Có lỗi xảy ra');
        return;
      }

      setDate('');
      setNote('');
      setExpenses([
        { name: 'Tiền sân', amount: '' },
        { name: 'Tiền nước', amount: '' },
      ]);
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa game này?')) return;

    try {
      await fetch(`/api/games/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Có lỗi xảy ra');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Game</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm game
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Quỹ CLB hiện tại:</strong>{' '}
                  {clubFundBalance !== null 
                    ? `${clubFundBalance.toLocaleString('vi-VN')} đ`
                    : 'Đang tải...'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Tiền sẽ tự động trừ vào quỹ CLB khi tạo game
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày (mặc định: hôm nay)</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ghi chú</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Chi phí</label>
                  <button
                    type="button"
                    onClick={addExpenseRow}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm dòng
                  </button>
                </div>
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={expense.name}
                          onChange={(e) => updateExpense(index, 'name', e.target.value)}
                          placeholder="Tên chi phí (ví dụ: Tiền sân, Tiền nước, Tiền thuê nhặt bóng...)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formatNumberInput(expense.amount)}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d,.]/g, '');
                            const normalized = cleaned.replace(/,+/g, ',');
                            updateExpense(index, 'amount', normalized);
                          }}
                          onBlur={(e) => {
                            const parsed = parseFormattedNumber(e.target.value);
                            if (parsed >= 0) {
                              updateExpense(index, 'amount', formatNumberInput(parsed));
                            }
                          }}
                          placeholder="Số tiền (ví dụ: 100,000)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExpenseRow(index)}
                        disabled={expenses.length === 1}
                        className="px-3 py-2 text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Tổng cộng:</span>
                    <span className="text-lg font-bold text-orange-600">
                      {expenses
                        .filter(exp => exp.amount.trim() !== '')
                        .reduce((sum, exp) => {
                          const parsed = parseFormattedNumber(exp.amount);
                          return sum + (isNaN(parsed) ? 0 : parsed);
                        }, 0)
                        .toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Thêm game
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setDate('');
                    setNote('');
                    setExpenses([
                      { name: 'Tiền sân', amount: '' },
                      { name: 'Tiền nước', amount: '' },
                    ]);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có game nào</div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => {
                // Use expenses if available, otherwise fall back to amount_san + amount_water
                const gameExpenses = game.expenses && game.expenses.length > 0
                  ? game.expenses
                  : [
                      { id: 0, name: 'Tiền sân', amount: game.amount_san },
                      { id: 1, name: 'Tiền nước', amount: game.amount_water },
                    ];
                const totalAmount = gameExpenses.reduce((sum, exp) => sum + exp.amount, 0);

                return (
                  <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {new Date(game.date + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                        </h3>
                        {game.note && <p className="text-gray-600 text-sm">{game.note}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(game.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2 mb-3">
                      {gameExpenses.map((expense, idx) => (
                        <div key={expense.id || idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600">{expense.name}:</span>
                          <span className="font-semibold text-gray-800">{expense.amount.toLocaleString('vi-VN')} đ</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Tổng chi:</span>
                        <span className="text-lg font-bold text-red-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

