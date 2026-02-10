 'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

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

const ITEMS_PER_PAGE = 50;

export default function ReportPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    initDefaultRangeAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initDefaultRangeAndFetch = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const { firstDay, lastDay } = getDaysInMonth(today);
      const defaultFrom = formatDateUTC7(firstDay);
      const defaultTo = formatDateUTC7(lastDay);
      setFromDate(defaultFrom);
      setToDate(defaultTo);
      await fetchGames(defaultFrom, defaultTo);
    } catch (error) {
      console.error('Error initializing report range:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async (from: string, to: string) => {
    try {
      const res = await fetch(
        `/api/games?from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(to)}`
      );
      if (res.ok) {
        const data = await res.json();
        setGames(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    }
  };

  // Get first and last day of month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  // Format date to YYYY-MM-DD in UTC+7 timezone
  const formatDateUTC7 = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const yearStr = String(year);
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');

    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  const formatDisplayDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00+07:00').toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

  const handleApplyFilter = async () => {
    if (!fromDate || !toDate) return;
    if (fromDate > toDate) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng đến ngày');
      return;
    }
    setLoading(true);
    try {
      await fetchGames(fromDate, toDate);
    } finally {
      setLoading(false);
    }
  };

  const totalGames = games.length;
  const totalPages = Math.max(1, Math.ceil(totalGames / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const currentPageGames = games.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const overallTotalSpending = games.reduce((sum, game) => {
    const gameExpenses =
      game.expenses && game.expenses.length > 0
        ? game.expenses
        : [
            { name: 'Tiền sân', amount: game.amount_san },
            { name: 'Tiền nước', amount: game.amount_water },
          ];
    return sum + gameExpenses.reduce((s, e) => s + e.amount, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </Link>
          <Link
            href="/report/spending"
            className="inline-flex items-center text-orange-600 hover:text-orange-800"
          >
            Báo cáo tiêu tiền
          </Link>
          <Link
            href="/report/settlement"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            Chốt kỳ đối soát
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Báo cáo Game</h1>

          {/* Bộ lọc theo from_date, to_date */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Lọc theo khoảng ngày</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                Áp dụng
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : totalGames === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có game nào trong khoảng thời gian này.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                <div className="text-sm text-gray-600">
                  Khoảng thời gian:{' '}
                  <span className="font-medium">
                    {formatDisplayDate(fromDate)} – {formatDisplayDate(toDate)}
                  </span>
                  <span className="ml-3">
                    ({totalGames.toLocaleString('vi-VN')} game)
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Tổng chi trong khoảng:</span>{' '}
                  <span className="text-orange-600 font-bold">
                    {overallTotalSpending.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                      <th className="px-4 py-3 text-left font-semibold">Game</th>
                      <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                      <th className="px-4 py-3 text-left font-semibold">Chi tiết chi phí</th>
                      <th className="px-4 py-3 text-right font-semibold">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageGames.map((game) => {
                      const gameExpenses =
                        game.expenses && game.expenses.length > 0
                          ? game.expenses
                          : [
                              { id: 0, name: 'Tiền sân', amount: game.amount_san },
                              { id: 1, name: 'Tiền nước', amount: game.amount_water },
                            ];
                      const total = gameExpenses.reduce((sum, exp) => sum + exp.amount, 0);

                      return (
                        <tr key={game.id} className="border-b hover:bg-gray-50 align-top">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDisplayDate(game.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">#{game.id}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {game.note && game.note.trim() !== '' ? game.note : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <ul className="space-y-1 text-sm text-gray-700">
                              {gameExpenses.map((expense, idx) => (
                                <li
                                  key={expense.id ?? idx}
                                  className="flex justify-between gap-4"
                                >
                                  <span>{expense.name}:</span>
                                  <span className="text-gray-800 tabular-nums whitespace-nowrap">
                                    {expense.amount.toLocaleString('vi-VN')} đ
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600 font-semibold whitespace-nowrap">
                            {total.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 font-semibold text-right">
                        Tổng cộng (trang hiện tại):
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600 text-lg">
                        {currentPageGames
                          .reduce((sum, game) => {
                            const ex =
                              game.expenses && game.expenses.length > 0
                                ? game.expenses
                                : [
                                    {
                                      name: '',
                                      amount: game.amount_san + game.amount_water,
                                    },
                                  ];
                            return sum + ex.reduce((s, e) => s + e.amount, 0);
                          }, 0)
                          .toLocaleString('vi-VN')}{' '}
                        đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Phân trang 50 items / trang */}
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-gray-600">
                  Trang {currentPageSafe} / {totalPages} ·{' '}
                  <span>
                    Hiển thị{' '}
                    {`${startIndex + 1}-${Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      totalGames
                    )}`}{' '}
                    trong tổng số {totalGames.toLocaleString('vi-VN')} game
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={currentPageSafe === 1}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm ${
                      currentPageSafe === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPageSafe === totalPages}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm ${
                      currentPageSafe === totalPages
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
