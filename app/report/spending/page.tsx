'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface GameExpense {
  id: number;
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

function getTodayUTC7(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function gameTotal(game: Game): number {
  if (game.expenses && game.expenses.length > 0) {
    return game.expenses.reduce((sum, e) => sum + e.amount, 0);
  }
  return game.amount_san + game.amount_water;
}

export default function ReportSpendingPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  useEffect(() => {
    initFiltersAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initFiltersAndData = async () => {
    try {
      const today = getTodayUTC7();
      const latestRes = await fetch('/api/settlement-periods/latest');
      if (latestRes.ok) {
        const latest = await latestRes.json();
        const defaultFrom = latest?.to_date || '2000-01-01';
        setFilterFromDate(defaultFrom);
        setFilterToDate(today);
        await fetchGamesWithFilter(defaultFrom, today);
      } else {
        setFilterFromDate('2000-01-01');
        setFilterToDate(today);
        await fetchGamesWithFilter('2000-01-01', today);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGamesWithFilter = async (from: string, to: string) => {
    try {
      const res = await fetch(`/api/games?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}`);
      const data = await res.ok ? res.json() : [];
      setGames(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    }
  };

  const handleApplyFilter = () => {
    if (!filterFromDate || !filterToDate) return;
    if (filterFromDate > filterToDate) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng đến ngày');
      return;
    }
    setLoading(true);
    fetchGamesWithFilter(filterFromDate, filterToDate).finally(() => setLoading(false));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const totalSpending = games.reduce((sum, g) => sum + gameTotal(g), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/report" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về Report
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Báo cáo tiêu tiền</h1>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Lọc theo kỳ</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
              >
                Áp dụng
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có game nào trong khoảng thời gian này.</div>
          ) : (
            <>
              <div className="mb-4 text-right">
                <span className="font-semibold text-gray-700">Tổng chi trong kỳ: </span>
                <span className="text-red-600 font-bold">{totalSpending.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                      <th className="px-4 py-3 text-left font-semibold">Game</th>
                      <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                      <th className="px-4 py-3 text-right font-semibold">Chi phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr key={game.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(game.date)}</td>
                        <td className="px-4 py-3">#{game.id}</td>
                        <td className="px-4 py-3 text-gray-600">{game.note || '—'}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-semibold">
                          {gameTotal(game).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
