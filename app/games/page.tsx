'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';


interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
}

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [amountSan, setAmountSan] = useState('');
  const [amountWater, setAmountWater] = useState('');
  const [clubFundBalance, setClubFundBalance] = useState<number | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountSan === '' || amountWater === '') {
      alert('Vui lòng nhập tiền sân và tiền nước');
      return;
    }

    const parsedAmountSan = parseFormattedNumber(amountSan);
    const parsedAmountWater = parseFormattedNumber(amountWater);

    if (parsedAmountSan < 0 || parsedAmountWater < 0) {
      alert('Số tiền không được âm');
      return;
    }

    const totalAmount = parsedAmountSan + parsedAmountWater;
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
          amount_san: parsedAmountSan,
          amount_water: parsedAmountWater,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Có lỗi xảy ra');
        return;
      }

      setDate('');
      setNote('');
      setAmountSan('');
      setAmountWater('');
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
                <div>
                  <label className="block text-sm font-medium mb-2">Tiền sân</label>
                  <input
                    type="text"
                    value={formatNumberInput(amountSan)}
                    onChange={(e) => {
                      // Allow only digits, commas, and decimal point
                      const cleaned = e.target.value.replace(/[^\d,.]/g, '');
                      // Replace multiple commas with single comma
                      const normalized = cleaned.replace(/,+/g, ',');
                      setAmountSan(normalized);
                    }}
                    onBlur={(e) => {
                      // Format on blur to ensure proper formatting
                      const parsed = parseFormattedNumber(e.target.value);
                      if (parsed >= 0) {
                        setAmountSan(formatNumberInput(parsed));
                      }
                    }}
                    placeholder="0 (ví dụ: 100,000)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tiền nước</label>
                  <input
                    type="text"
                    value={formatNumberInput(amountWater)}
                    onChange={(e) => {
                      // Allow only digits, commas, and decimal point
                      const cleaned = e.target.value.replace(/[^\d,.]/g, '');
                      // Replace multiple commas with single comma
                      const normalized = cleaned.replace(/,+/g, ',');
                      setAmountWater(normalized);
                    }}
                    onBlur={(e) => {
                      // Format on blur to ensure proper formatting
                      const parsed = parseFormattedNumber(e.target.value);
                      if (parsed >= 0) {
                        setAmountWater(formatNumberInput(parsed));
                      }
                    }}
                    placeholder="0 (ví dụ: 50,000)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
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
                    setAmountSan('');
                    setAmountWater('');
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
                const totalAmount = game.amount_san + game.amount_water;

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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Tiền sân:</span>
                        <p className="font-semibold">{game.amount_san.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tiền nước:</span>
                        <p className="font-semibold">{game.amount_water.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tổng chi:</span>
                        <p className="font-semibold text-red-600">{totalAmount.toLocaleString('vi-VN')} đ</p>
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

