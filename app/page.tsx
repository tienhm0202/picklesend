'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, DollarSign, GamepadIcon, Wallet, AlertCircle, FileText, LogOut, Flame, Trophy, Target, X, ClipboardCheck, Award, Crown, Medal } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface Stats {
  clubFund: number;
  totalDeposits: number;
  totalGameCosts: number;
  isLowFund: boolean;
  isEmptyFund: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalWeeks: number;
  recentWeeks: Array<{ weekId: string; hasGame: boolean }>;
  nextMilestone: number;
  milestoneProgress: number;
}

interface Deposit {
  id: number;
  member_id: number | null;
  member_name: string;
  date: string;
  amount: number;
  created_at: string;
}

interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  created_at: string;
}

interface LeaderboardEntry {
  member_id: number;
  name: string;
  color?: string;
  letter?: string;
  games_attended: number;
  total_games: number;
  participation_rate: number;
}

const SPORTS_QUOTES = [
  "Thành công trong thể thao = 1% tài năng + 99% nỗ lực! 🏆",
  "Chơi hết mình mỗi ngày - đó là cách của CLB 5525! 🏓",
  "Không phải về việc bạn đánh tốt hay không, mà là đối thủ của bạn là ai!   😄",
  "Thể thao xây dựng tính cách và sức mạnh tinh thần! 💪",
  "Thất bại là mẹ thành công - mỗi lần thua là một bài học quý giá! 🎾",
  "Trong thể thao, không có gì là không thể khi bạn kiên trì! ⚡",
  "Thể thao không chỉ là sức mạnh thể chất, mà còn là ý chí mạnh mẽ! 🧠",
  "Chơi thể thao giúp bạn khỏe mạnh cả về thể chất lẫn tinh thần! 💪",
  "Mỗi ngày luyện tập là một bước tiến gần hơn đến mục tiêu! 🏆",
  "Thể thao là cuộc sống - sống hết mình mỗi ngày! 🎯",
  "Không có gì là không thể trong thể thao khi bạn có đam mê! 🚀",
  "Thể thao dạy bạn kiên trì và không bao giờ bỏ cuộc! 📊",
  "Chơi thể thao giúp bạn giải tỏa căng thẳng và tìm lại năng lượng! 😊",
  "Thể thao là không ngừng cố gắng và không ngừng tiến bộ! ⚖️",
  "Trong thể thao, điều quan trọng là tinh thần đồng đội và sự gắn kết! 👥",
  "Thể thao xây dựng sự tự tin và khả năng vượt qua thử thách! 💎",
  "Chơi thể thao giúp bạn sống lâu hơn và sống khỏe mạnh hơn! 🕐",
  "Thể thao không chỉ là vận động, mà còn là cách sống tích cực! 📈",
  "Tham gia đều đặn mỗi tuần - đó là bí quyết để tiến bộ! 🎪",
  "Mỗi lần chơi là một cơ hội để học hỏi và cải thiện! 🌟",
  "Thể thao không phân biệt tuổi tác - chỉ cần bạn có đam mê! 🔥",
  "Thể thao là không ngừng đóng quỹ! ⚖️",
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDepositsModal, setShowDepositsModal] = useState(false);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [randomQuote, setRandomQuote] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    // Initialize database on first load
    fetch('/api/init', { method: 'POST' });
    fetchStats();
    fetchStreak();
    fetchLeaderboard();
    checkAdmin();
    // Random quote on page load
    const randomIndex = Math.floor(Math.random() * SPORTS_QUOTES.length);
    setRandomQuote(SPORTS_QUOTES[randomIndex] || SPORTS_QUOTES[0]);
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/admin/login');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdmin(false);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const errorData = await res.json();
        console.error('Error fetching stats:', errorData);
        // Log detailed error for debugging
        if (errorData.error) {
          console.error('Error message:', errorData.error);
        }
        if (errorData.details) {
          console.error('Error details:', errorData.details);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreak = async () => {
    try {
      const res = await fetch('/api/streak');
      if (res.ok) {
        const data = await res.json();
        setStreakData(data);
      } else {
        console.error('Error fetching streak data');
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/leaderboard/monthly');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getCardColors = (participationRate: number) => {
    if (participationRate >= 80) {
      return {
        gradient: 'from-orange-500 via-red-500 to-orange-500',
        bg: 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500',
        bgSolid: 'bg-orange-500',
      };
    } else if (participationRate >= 51) {
      return {
        gradient: 'from-blue-400 via-indigo-400 to-blue-400',
        bg: 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400',
        bgSolid: 'bg-blue-500',
      };
    } else {
      return {
        gradient: 'from-gray-400 via-gray-500 to-gray-400',
        bg: 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400',
        bgSolid: 'bg-gray-500',
      };
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

  const handleShowDeposits = async () => {
    setShowDepositsModal(true);
    setLoadingDeposits(true);
    try {
      const res = await fetch('/api/deposits');
      if (res.ok) {
        const data = await res.json();
        setDeposits(data);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const handleShowGames = async () => {
    setShowGamesModal(true);
    setLoadingGames(true);
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { 
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Public menu items (visible to everyone)
  const publicMenuItems = [
    { href: '/checkin', label: 'Điểm danh', icon: ClipboardCheck, color: 'green' },
    { href: '/members', label: 'Thành viên', icon: Users, color: 'blue' },
    { href: '/report', label: 'Report', icon: FileText, color: 'indigo' },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { href: '/deposits', label: 'Nạp tiền', icon: DollarSign, color: 'purple' },
    { href: '/games', label: 'Game', icon: GamepadIcon, color: 'orange' },
  ];

  // Combine menu items based on admin status
  const menuItems = isAdmin 
    ? [...publicMenuItems, ...adminMenuItems]
    : publicMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 relative">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            CLB 5525
          </h1>
          <p className="text-xl text-gray-600">
            "{randomQuote || SPORTS_QUOTES[0]}"
          </p>
          {isAdmin && (
            <div className="absolute top-0 right-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout Admin
              </button>
            </div>
          )}
        </div>

        {/* Streak & Gamification Section */}
        {streakData && (
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                      <Flame className="w-8 h-8 text-yellow-300 animate-pulse" />
                      Streak Tuần Liên Tục
                    </h2>
                    <p className="text-orange-100 text-lg">{getStreakMessage(streakData.currentStreak)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-bold text-yellow-300">
                      {streakData.currentStreak}
                    </div>
                    <div className="text-orange-100 text-sm">tuần</div>
                  </div>
                </div>

                {/* Milestone Progress */}
                {streakData.currentStreak > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Mốc tiếp theo: {streakData.nextMilestone} tuần
                      </span>
                      <span className="text-sm">
                        {Math.round(streakData.milestoneProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-yellow-300 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${streakData.milestoneProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Recent Weeks Visualization */}
                <div className="mt-6">
                  <p className="text-sm font-medium mb-3 text-orange-100">8 tuần gần đây:</p>
                  <div className="flex gap-2">
                    {streakData.recentWeeks.map((week, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-12 rounded-lg flex items-center justify-center transition-all ${
                          week.hasGame
                            ? 'bg-yellow-300 text-orange-900 font-bold shadow-lg scale-105'
                            : 'bg-white/20 text-white/50'
                        }`}
                        title={week.weekId}
                      >
                        {week.hasGame ? '🔥' : '○'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
                  {streakData.longestStreak > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-300" />
                        <span className="text-orange-100">Kỷ lục streak:</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-300">
                        {streakData.longestStreak} tuần
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GamepadIcon className="w-6 h-6 text-yellow-300" />
                      <span className="text-orange-100">Tổng tuần đã chơi:</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-300">
                      {streakData.totalWeeks} tuần
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mb-8">
          {/* Alert for empty/low fund */}
          {stats && (stats.isEmptyFund || stats.isLowFund) && (
            <div className={`mb-6 p-4 rounded-lg ${
              stats.isEmptyFund 
                ? 'bg-red-100 border-2 border-red-500' 
                : 'bg-orange-100 border-2 border-orange-500'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-6 h-6 ${
                  stats.isEmptyFund ? 'text-red-600' : 'text-orange-600'
                }`} />
                <div>
                  <h3 className={`font-bold ${
                    stats.isEmptyFund ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {stats.isEmptyFund ? '⚠️ CẢNH BÁO: Quỹ CLB đã hết tiền!' : '⚠️ Quỹ CLB sắp hết tiền!'}
                  </h3>
                  <p className={`text-sm ${
                    stats.isEmptyFund ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    Quỹ hiện tại: <strong>{stats.clubFund.toLocaleString('vi-VN')} đ</strong>
                    {stats.isEmptyFund && ' - Vui lòng nạp tiền ngay!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Club Fund Card */}
            <div className={`bg-white rounded-lg shadow-lg p-6 ${
              stats?.isEmptyFund ? 'border-2 border-red-500' : stats?.isLowFund ? 'border-2 border-orange-500' : ''
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Quỹ CLB</h2>
                <Wallet className={`w-8 h-8 ${
                  stats?.isEmptyFund ? 'text-red-500' : stats?.isLowFund ? 'text-orange-500' : 'text-blue-500'
                }`} />
              </div>
              {loading ? (
                <p className="text-gray-500">Đang tải...</p>
              ) : (
                <p className={`text-3xl font-bold ${
                  stats?.isEmptyFund ? 'text-red-600' : stats?.isLowFund ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {stats?.clubFund?.toLocaleString('vi-VN') || '0'} đ
                </p>
              )}
            </div>

            {/* Total Deposits Card */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
              onClick={handleShowDeposits}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tổng nạp</h2>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              {loading ? (
                <p className="text-gray-500">Đang tải...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.totalDeposits?.toLocaleString('vi-VN') || '0'} đ
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Click để xem chi tiết</p>
                </>
              )}
            </div>

            {/* Total Game Costs Card */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
              onClick={handleShowGames}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tổng chi</h2>
                <GamepadIcon className="w-8 h-8 text-orange-500" />
              </div>
              {loading ? (
                <p className="text-gray-500">Đang tải...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats?.totalGameCosts?.toLocaleString('vi-VN') || '0'} đ
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Click để xem chi tiết</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Pick thủ chăm chỉ</h2>
              <span className="text-sm text-gray-500">
                ({new Date().toLocaleDateString('vi-VN', { 
                  month: 'long', 
                  year: 'numeric',
                  timeZone: 'Asia/Ho_Chi_Minh'
                })})
              </span>
            </div>
            
            {loadingLeaderboard ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có dữ liệu xếp hạng trong tháng này
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Hạng</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Thành viên</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Game đã chơi</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Tỷ lệ tham gia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => {
                      const colors = getCardColors(entry.participation_rate);
                      const rank = index + 1;
                      const getRankIcon = () => {
                        if (rank === 1) {
                          return <Crown className="w-7 h-7 text-yellow-500 drop-shadow-lg" />;
                        } else if (rank === 2) {
                          return <Medal className="w-7 h-7 text-slate-400 drop-shadow-md" />;
                        } else if (rank === 3) {
                          return <Medal className="w-6 h-6 text-orange-500" />;
                        }
                        return null;
                      };
                      
                      return (
                        <tr key={entry.member_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {getRankIcon() || <div className="w-6 h-6"></div>}
                              <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-lg shadow-md ${
                                rank === 1 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 shadow-yellow-300' :
                                rank === 2 ? 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white shadow-slate-300' :
                                rank === 3 ? 'bg-orange-200 text-orange-800' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {rank}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Link 
                              href={`/members/${entry.member_id}`}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              <div className={`${colors.bgSolid} rounded-full px-3 py-1 text-white font-semibold flex items-center gap-2`}>
                                <Avatar
                                  name={entry.name}
                                  color={entry.color}
                                  letter={entry.letter}
                                  size={24}
                                />
                                <span>{entry.name}</span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {entry.games_attended} / {entry.total_games}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold text-lg ${
                              entry.participation_rate >= 80 ? 'text-orange-600' : 
                              entry.participation_rate >= 51 ? 'text-blue-600' : 
                              'text-gray-600'
                            }`}>
                              {entry.participation_rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: 'bg-blue-500 hover:bg-blue-600',
              green: 'bg-green-500 hover:bg-green-600',
              purple: 'bg-purple-500 hover:bg-purple-600',
              orange: 'bg-orange-500 hover:bg-orange-600',
              red: 'bg-red-500 hover:bg-red-600',
              indigo: 'bg-indigo-500 hover:bg-indigo-600',
            };

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${colorClasses[item.color as keyof typeof colorClasses]} text-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
              >
                <div className="flex flex-col items-center">
                  <Icon className="w-16 h-16 mb-4" />
                  <h2 className="text-2xl font-semibold">{item.label}</h2>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Deposits Modal */}
      {showDepositsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                Chi tiết nạp tiền
              </h2>
              <button
                onClick={() => setShowDepositsModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {loadingDeposits ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : deposits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có giao dịch nạp tiền nào</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Thành viên</th>
                        <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                        <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((deposit) => (
                        <tr key={deposit.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {deposit.member_name || 'Không xác định'}
                          </td>
                          <td className="px-4 py-3">{formatDate(deposit.date)}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-semibold">
                            +{deposit.amount.toLocaleString('vi-VN')} đ
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
                          {deposits.reduce((sum, d) => sum + d.amount, 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Games Modal */}
      {showGamesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <GamepadIcon className="w-8 h-8 text-orange-500" />
                Chi tiết chi tiêu
              </h2>
              <button
                onClick={() => setShowGamesModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {loadingGames ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : games.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có game nào</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                        <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                        <th className="px-4 py-3 text-right font-semibold">Tiền sân</th>
                        <th className="px-4 py-3 text-right font-semibold">Tiền nước</th>
                        <th className="px-4 py-3 text-right font-semibold">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game) => {
                        const total = game.amount_san + game.amount_water;
                        return (
                          <tr key={game.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">{formatDate(game.date)}</td>
                            <td className="px-4 py-3">{game.note || '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {game.amount_san.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {game.amount_water.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                              {total.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 font-semibold text-right">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600 text-lg">
                          {games.reduce((sum, g) => sum + g.amount_san + g.amount_water, 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

