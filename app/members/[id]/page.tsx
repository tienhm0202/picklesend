'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flame, Trophy, Target, GamepadIcon, Calendar, Percent, Badge, Award, Crown, Medal, Star } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface Deposit {
  id: number;
  date: string;
  amount: number;
  created_at: string;
}

interface MemberStats {
  member: {
    id: number;
    name: string;
    color?: string;
    letter?: string;
    created_at: string;
  };
  depositCount: number;
  totalDeposits: number;
  deposits: Deposit[];
}

interface GameStats {
  currentStreak: number;
  longestStreak: number;
  totalGames: number;
  totalClubGames: number;
  participationRate: number;
  totalWeeks: number;
  recentWeeks: Array<{ weekId: string; hasGame: boolean }>;
  nextMilestone: number;
  milestoneProgress: number;
}

interface BadgeData {
  month: number;
  year: number;
  participation_rate: number;
  rank: number | null;
  total_members: number;
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      fetchMemberStats();
      fetchGameStats();
      fetchBadges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchGameStats = async () => {
    try {
      const res = await fetch(`/api/members/${memberId}/games`);
      if (res.ok) {
        const data = await res.json();
        setGameStats(data);
      }
    } catch (error) {
      console.error('Error fetching game stats:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch(`/api/members/${memberId}/badges`);
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const getStreakMessage = (streak: number): string => {
    if (streak === 0) return 'Hãy bắt đầu streak của bạn!';
    if (streak < 5) return 'Tiếp tục phát huy! 🔥';
    if (streak < 10) return 'Tuyệt vời! Đang trên đà! 🚀';
    if (streak < 20) return 'Ấn tượng! Streak đang rất tốt! 💪';
    if (streak < 50) return 'Xuất sắc! Bạn là người kiên trì! ⭐';
    return 'Huyền thoại! Streak không thể tin được! 🏆';
  };

  const getCardColors = (participationRate: number) => {
    if (participationRate >= 80) {
      // Màu hiện tại - orange-red gradient (xuất sắc)
      return {
        gradient: 'from-orange-500 via-red-500 to-orange-500',
        textPrimary: 'text-orange-100',
        textSecondary: 'text-orange-200',
        accent: 'text-yellow-300',
        accentBg: 'bg-yellow-300',
        weekActive: 'bg-yellow-300 text-orange-900',
        weekInactive: 'bg-white/20 text-white/50',
        border: 'border-white/20',
      };
    } else if (participationRate >= 51) {
      // Màu nhạt hơn - blue gradient (tốt)
      return {
        gradient: 'from-blue-400 via-indigo-400 to-blue-400',
        textPrimary: 'text-blue-100',
        textSecondary: 'text-blue-200',
        accent: 'text-blue-200',
        accentBg: 'bg-blue-200',
        weekActive: 'bg-blue-200 text-blue-900',
        weekInactive: 'bg-white/20 text-white/50',
        border: 'border-white/20',
      };
    } else {
      // Màu kém hơn - gray gradient (cần cải thiện)
      return {
        gradient: 'from-gray-400 via-gray-500 to-gray-400',
        textPrimary: 'text-gray-100',
        textSecondary: 'text-gray-200',
        accent: 'text-gray-200',
        accentBg: 'bg-gray-200',
        weekActive: 'bg-gray-200 text-gray-900',
        weekInactive: 'bg-white/20 text-white/50',
        border: 'border-white/20',
      };
    }
  };

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
              <p className="text-gray-600">
                Tham gia vào ngày{' '}
                {new Date(stats.member.created_at).toLocaleDateString('vi-VN', {
                  timeZone: 'Asia/Ho_Chi_Minh',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Game Stats Infographic */}
        {gameStats && (() => {
          const colors = getCardColors(gameStats.participationRate);
          return (
            <div className="mb-6">
              <div className={`bg-gradient-to-r ${colors.gradient} rounded-xl shadow-2xl p-8 text-white relative overflow-hidden`}>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Flame className={`w-8 h-8 ${colors.accent} animate-pulse`} />
                        Streak Tuần Liên Tục
                      </h2>
                      <p className={`${colors.textPrimary} text-lg`}>{getStreakMessage(gameStats.currentStreak)}</p>
                      <p className={`${colors.textSecondary} text-sm mt-1`}>CLB 55 - Hừng hừng khí thế!</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-6xl font-bold ${colors.accent}`}>
                        {gameStats.currentStreak}
                      </div>
                      <div className={`${colors.textPrimary} text-sm`}>tuần</div>
                    </div>
                  </div>

                  {/* Milestone Progress */}
                  {gameStats.currentStreak > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium flex items-center gap-2 ${colors.textPrimary}`}>
                          <Target className="w-4 h-4" />
                          Mốc tiếp theo: {gameStats.nextMilestone} tuần
                        </span>
                        <span className={`text-sm ${colors.textPrimary}`}>
                          {Math.round(gameStats.milestoneProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                        <div 
                          className={`${colors.accentBg} h-full rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${gameStats.milestoneProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Recent Weeks Visualization */}
                  <div className="mt-6">
                    <p className={`text-sm font-medium mb-3 ${colors.textPrimary}`}>8 tuần gần đây:</p>
                    <div className="flex gap-2">
                      {gameStats.recentWeeks.map((week, index) => (
                        <div
                          key={index}
                          className={`flex-1 h-12 rounded-lg flex items-center justify-center transition-all ${
                            week.hasGame
                              ? `${colors.weekActive} font-bold shadow-lg scale-105`
                              : colors.weekInactive
                          }`}
                          title={week.weekId}
                        >
                          {week.hasGame ? '🔥' : '○'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className={`mt-6 pt-6 border-t ${colors.border} grid grid-cols-2 gap-4`}>
                    {gameStats.longestStreak > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className={`w-6 h-6 ${colors.accent}`} />
                          <span className={colors.textPrimary}>Kỷ lục streak:</span>
                        </div>
                        <span className={`text-xl font-bold ${colors.accent}`}>
                          {gameStats.longestStreak} tuần
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GamepadIcon className={`w-6 h-6 ${colors.accent}`} />
                        <span className={colors.textPrimary}>Tổng game đã chơi:</span>
                      </div>
                      <span className={`text-xl font-bold ${colors.accent}`}>
                        {gameStats.totalGames} game
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Percent className={`w-6 h-6 ${colors.accent}`} />
                        <span className={colors.textPrimary}>Tỷ lệ tham gia:</span>
                      </div>
                      <span className={`text-xl font-bold ${colors.accent}`}>
                        {gameStats.participationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-6 h-6 ${colors.accent}`} />
                        <span className={colors.textPrimary}>Tổng tuần đã chơi:</span>
                      </div>
                      <span className={`text-xl font-bold ${colors.accent}`}>
                        {gameStats.totalWeeks} tuần
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Số lần nạp tiền</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.depositCount}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Tổng số tiền đã nạp</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDeposits.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-gray-500 mt-2">
              (Tất cả tiền nạp vào quỹ chung CLB)
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Participation Badges */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Badge Tham Gia</h3>
                <div className="flex flex-wrap gap-3">
                  {badges.map((badge) => {
                    const getParticipationBadgeColor = () => {
                      if (badge.participation_rate >= 80) {
                        return 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white';
                      } else if (badge.participation_rate >= 51) {
                        return 'bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-500 text-white';
                      } else {
                        return 'bg-gray-400 text-white';
                      }
                    };

                    const getParticipationIcon = () => {
                      if (badge.participation_rate >= 80) {
                        return <Star className="w-5 h-5" />;
                      } else if (badge.participation_rate >= 51) {
                        return <Award className="w-5 h-5" />;
                      } else {
                        return <Badge className="w-5 h-5" />;
                      }
                    };

                    return (
                      <div
                        key={`participation-${badge.year}-${badge.month}`}
                        className={`${getParticipationBadgeColor()} rounded-full px-4 py-2 flex items-center gap-2 shadow-md`}
                      >
                        {getParticipationIcon()}
                        <span className="font-semibold text-sm">
                          {badge.month}/{badge.year}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rank Badges */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Badge Thứ Hạng</h3>
                <div className="flex flex-wrap gap-3">
                  {badges
                    .filter((badge) => badge.rank !== null)
                    .map((badge) => {
                      const getRankBadgeColor = () => {
                        if (badge.rank === 1) {
                          return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900';
                        } else if (badge.rank === 2) {
                          return 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white';
                        } else if (badge.rank === 3) {
                          return 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 text-white';
                        } else {
                          return 'bg-gray-300 text-gray-700';
                        }
                      };

                      const getRankIcon = () => {
                        if (badge.rank === 1) {
                          return <Crown className="w-5 h-5" />;
                        } else if (badge.rank === 2) {
                          return <Medal className="w-5 h-5" />;
                        } else if (badge.rank === 3) {
                          return <Medal className="w-5 h-5" />;
                        } else {
                          return <Trophy className="w-5 h-5" />;
                        }
                      };

                      return (
                        <div
                          key={`rank-${badge.year}-${badge.month}`}
                          className={`${getRankBadgeColor()} rounded-full px-4 py-2 flex items-center gap-2 shadow-md`}
                        >
                          {getRankIcon()}
                          <span className="font-semibold text-sm">
                            Hạng {badge.rank} - {badge.month}/{badge.year}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposits List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh sách nạp tiền</h2>
          
          {stats.deposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Chưa có giao dịch nạp tiền nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">STT</th>
                    <th className="px-4 py-3 text-left font-semibold">Ngày nạp</th>
                    <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                    <th className="px-4 py-3 text-left font-semibold">Thời gian tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.deposits.map((deposit, index) => (
                    <tr key={deposit.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {stats.deposits.length - index}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(deposit.date + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        +{deposit.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(deposit.created_at).toLocaleString('vi-VN', { 
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-semibold text-right">
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
                      {stats.totalDeposits.toLocaleString('vi-VN')} đ
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
