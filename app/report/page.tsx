'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface GameMember {
  id: number;
  name: string;
  color?: string;
  letter?: string;
}

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
  members?: GameMember[];
  expenses?: GameExpense[];
}

export default function ReportPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get first and last day of current month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay, daysInMonth: lastDay.getDate() };
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfWeek = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Format date to YYYY-MM-DD in UTC+7 timezone
  const formatDateUTC7 = (date: Date): string => {
    // Create date in UTC+7 timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Format as YYYY-MM-DD (treat as UTC+7 date, not UTC)
    const yearStr = String(year);
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  // Get games for a specific date
  const getGamesForDate = (date: Date): Game[] => {
    const dateStr = formatDateUTC7(date);
    return games.filter((game) => game.date === dateStr);
  };

  const { daysInMonth, firstDay } = getDaysInMonth(currentDate);
  const startDay = getFirstDayOfWeek(currentDate);
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Create calendar cells
  const calendarCells = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }

  // Cells for each day of month
  // Create dates in local timezone (UTC+7)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    calendarCells.push(date);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo Game</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-700 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {/* Day headers */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center font-semibold text-gray-600 text-sm"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar cells */}
                {calendarCells.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="p-2 min-h-[100px]" />;
                  }

                  const dayGames = getGamesForDate(date);
                  const isToday =
                    date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        p-2 border border-gray-200 rounded-lg min-h-[100px]
                        ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                        ${dayGames.length > 0 ? 'hover:shadow-md' : ''}
                      `}
                    >
                      <div
                        className={`
                          text-sm font-medium mb-2
                          ${isToday ? 'text-blue-600' : 'text-gray-700'}
                        `}
                      >
                        {date.getDate()}
                      </div>
                      {dayGames.length > 0 && (
                        <div className="space-y-2">
                          {dayGames.map((game) => (
                            <div
                              key={game.id}
                              className="bg-orange-50 rounded p-1 border border-orange-200"
                            >
                              <div className="text-xs font-semibold text-orange-800 mb-1">
                                Game #{game.id}
                              </div>
                              {game.note && (
                                <div className="text-xs text-gray-600 mb-1 truncate">
                                  {game.note}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {game.members && game.members.length > 0 && (
                                  <>
                                    {game.members.map((member) => (
                                      <Avatar
                                        key={member.id}
                                        name={member.name}
                                        color={member.color}
                                        letter={member.letter}
                                        size={24}
                                      />
                                    ))}
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const total = game.expenses && game.expenses.length > 0
                                    ? game.expenses.reduce((sum, exp) => sum + exp.amount, 0)
                                    : game.amount_san + game.amount_water;
                                  return total.toLocaleString('vi-VN') + ' đ';
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

