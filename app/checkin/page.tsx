'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface Member {
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
  expenses?: GameExpense[];
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [attending, setAttending] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attendedMembers, setAttendedMembers] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchMembers();
    fetchGames();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = members.filter(member =>
      member.name.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  useEffect(() => {
    if (selectedGame) {
      // Reset attended members when game changes
      setAttendedMembers(new Set());
      fetchAttendedMembers(selectedGame);
    } else {
      setAttendedMembers(new Set());
    }
  }, [selectedGame]);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        // Get recent games (last 30 days or last 10 games)
        const recentGames = data.slice(0, 10);
        setGames(recentGames);
        // Auto-select today's game or most recent game
        if (recentGames.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayGame = recentGames.find((g: Game) => g.date === today);
          setSelectedGame(todayGame ? todayGame.id : recentGames[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchAttendedMembers = async (gameId: number) => {
    try {
      const res = await fetch(`/api/games/${gameId}/members`);
      if (res.ok) {
        const data = await res.json();
        // Only update if still on the same game
        setAttendedMembers(prev => {
          // Create new Set with only members from this game
          return new Set(data.map((m: { member_id: number }) => m.member_id));
        });
      } else {
        // If API fails, reset to empty set
        setAttendedMembers(new Set());
      }
    } catch (error) {
      // API might not exist yet, reset to empty set
      console.error('Error fetching attended members:', error);
      setAttendedMembers(new Set());
    }
  };

  const handleAttend = async (memberId: number) => {
    if (!selectedGame) {
      setMessage({ type: 'error', text: 'Vui lòng chọn game trước' });
      return;
    }

    setAttending(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/games/${selectedGame}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã điểm danh thành công!' });
        // Refresh attended members for current game
        if (selectedGame) {
          fetchAttendedMembers(selectedGame);
        }
        setSearchQuery('');
        setFilteredMembers([]);
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json();
        if (errorData.already_exists) {
          setMessage({ type: 'error', text: 'Thành viên đã được điểm danh cho game này' });
        } else {
          setMessage({ type: 'error', text: errorData.error || 'Có lỗi xảy ra' });
        }
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi điểm danh' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setAttending(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên thành viên' });
      return;
    }

    setCreatingMember(true);
    setMessage(null);

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });

      if (res.ok) {
        const newMember = await res.json();
        setMembers(prev => [...prev, newMember]);
        setNewMemberName('');
        setShowCreateForm(false);
        setMessage({ type: 'success', text: `Đã tạo thành viên "${newMember.name}"` });
        setTimeout(() => {
          setMessage(null);
          // Auto-attend if game is selected
          if (selectedGame) {
            handleAttend(newMember.id);
          }
        }, 1000);
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'Không thể tạo thành viên' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi tạo thành viên' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setCreatingMember(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Điểm danh</h1>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Game Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn game
            </label>
            {loading ? (
              <div className="text-gray-500">Đang tải...</div>
            ) : games.length === 0 ? (
              <div className="text-gray-500">Chưa có game nào</div>
            ) : (
              <select
                value={selectedGame || ''}
                onChange={(e) => setSelectedGame(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {formatDate(game.date)} - {game.note || 'Không có ghi chú'} ({game.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Member */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm thành viên
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên thành viên..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={attending}
              />
            </div>

            {/* Search Results */}
            {filteredMembers.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                {filteredMembers.map((member) => {
                  const isAttended = attendedMembers.has(member.id);
                  return (
                    <div
                      key={member.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between ${
                        isAttended ? 'bg-green-50' : ''
                      }`}
                      onClick={() => !isAttended && handleAttend(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.name}
                          color={member.color}
                          letter={member.letter}
                          size={32}
                        />
                        <span className="font-medium">{member.name}</span>
                      </div>
                      {isAttended ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Đã điểm danh</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttend(member.id);
                          }}
                          disabled={attending || !selectedGame}
                          className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {attending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            'Điểm danh'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {searchQuery.trim() !== '' && filteredMembers.length === 0 && !loading && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Không tìm thấy thành viên &quot;{searchQuery}&quot;
                  </span>
                  {!showCreateForm && (
                    <button
                      onClick={() => {
                        setShowCreateForm(true);
                        setNewMemberName(searchQuery);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Tạo mới
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Member Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">Tạo thành viên mới</h3>
              <form onSubmit={handleCreateMember}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Tên thành viên"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={creatingMember}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={creatingMember || !newMemberName.trim()}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creatingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Tạo
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewMemberName('');
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
                    disabled={creatingMember}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

