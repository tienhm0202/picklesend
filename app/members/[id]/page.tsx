'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  member_amount: number;
  total_amount: number;
}

interface MemberStats {
  member: {
    id: number;
    name: string;
    color?: string;
    letter?: string;
  };
  balance: number;
  depositCount: number;
  totalDeposits: number;
  totalSpent: number;
  games: Game[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (memberId) {
      fetchMemberStats();
    }
  }, [memberId]);

  const fetchMemberStats = async () => {
    try {
      const res = await fetch(`/api/members/${memberId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        router.push('/members');
      }
    } catch (error) {
      console.error('Error fetching member stats:', error);
      router.push('/members');
    } finally {
      setLoading(false);
    }
  };

  // Get days in month for calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay, daysInMonth: lastDay.getDate() };
  };

  const getFirstDayOfWeek = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getGamesForDate = (date: Date): Game[] => {
    if (!stats) return [];
    const dateStr = date.toISOString().split('T')[0];
    return stats.games.filter((game) => game.date === dateStr);
  };

  const { daysInMonth, firstDay } = getDaysInMonth(currentDate);
  const startDay = getFirstDayOfWeek(currentDate);
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const calendarCells = [];
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    calendarCells.push(date);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center py-16">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link href="/members" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách thành viên
        </Link>

        {/* Member Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={stats.member.name}
              color={stats.member.color}
              letter={stats.member.letter}
              size={80}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stats.member.name}</h1>
              <p className="text-gray-600">Thông tin chi tiết thành viên</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Số dư tài khoản</div>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.balance >= 0 ? '+' : ''}
              {stats.balance.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Số lần nạp tiền</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.depositCount}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Tổng: {stats.totalDeposits.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Tổng số tiền đã tiêu</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalSpent.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Số game đã tham gia</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.games.length}
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Lịch sử tham gia Game</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-700 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

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
                  return <div key={`empty-${index}`} className="p-2 min-h-[120px]" />;
                }

                const dayGames = getGamesForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    className={`
                      p-2 border border-gray-200 rounded-lg min-h-[120px]
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
                            className="bg-orange-50 rounded p-2 border border-orange-200"
                          >
                            <div className="text-xs font-semibold text-orange-800 mb-1">
                              Game #{game.id}
                            </div>
                            {game.note && (
                              <div className="text-xs text-gray-600 mb-1 truncate">
                                {game.note}
                              </div>
                            )}
                            <div className="text-xs font-semibold text-orange-600">
                              {game.member_amount.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Tổng: {game.total_amount.toLocaleString('vi-VN')} đ
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
        </div>
      </div>
    </div>
  );
}

