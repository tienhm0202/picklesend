'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  is_active?: boolean;
}

interface Guest {
  id: number;
  name: string;
  promoted_to_member_id: number | null;
  is_active?: boolean;
}

interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  members?: { id: number; name: string }[];
  guests?: { id: number; name: string }[];
}

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [amountSan, setAmountSan] = useState('');
  const [amountWater, setAmountWater] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);

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
      const [gamesRes, membersRes, guestsRes] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/members'),
        fetch('/api/guests'),
      ]);
      const gamesData = await gamesRes.json();
      const membersData = await membersRes.json();
      const guestsData = await guestsRes.json();
      // Filter out promoted guests and inactive guests from the list
      const activeGuests = guestsData.filter(
        (guest: Guest) => guest.promoted_to_member_id === null && guest.is_active !== false
      );
      // Filter out inactive members from the list
      const activeMembers = membersData.filter((member: Member) => member.is_active !== false);
      setGames(gamesData);
      setMembers(activeMembers);
      setGuests(activeGuests);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || amountSan === '' || amountWater === '') return;
    if (selectedMembers.length === 0 && selectedGuests.length === 0) {
      alert('Vui lòng chọn ít nhất một thành viên hoặc khách');
      return;
    }

    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          note,
          amount_san: parseFloat(amountSan),
          amount_water: parseFloat(amountWater),
          member_ids: selectedMembers,
          guest_ids: selectedGuests,
        }),
      });
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setAmountSan('');
      setAmountWater('');
      setSelectedMembers([]);
      setSelectedGuests([]);
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

  const toggleMember = (id: number) => {
    setSelectedMembers((prev: number[]) =>
      prev.includes(id) ? prev.filter((m: number) => m !== id) : [...prev, id]
    );
  };

  const toggleGuest = (id: number) => {
    setSelectedGuests((prev: number[]) =>
      prev.includes(id) ? prev.filter((g: number) => g !== id) : [...prev, id]
    );
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
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
                    type="number"
                    step="0.01"
                    value={amountSan}
                    onChange={(e) => setAmountSan(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tiền nước</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountWater}
                    onChange={(e) => setAmountWater(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Thành viên</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {members.map((member) => (
                      <label key={member.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="mr-2"
                        />
                        <span>{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Khách</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {guests.length > 0 ? (
                      guests.map((guest) => (
                        <label key={guest.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGuests.includes(guest.id)}
                            onChange={() => toggleGuest(guest.id)}
                            className="mr-2"
                            disabled={guest.promoted_to_member_id !== null}
                          />
                          <span className={guest.promoted_to_member_id !== null ? 'text-gray-400 line-through' : ''}>
                            {guest.name}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-2">Không có khách nào</p>
                    )}
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
                    setDate(new Date().toISOString().split('T')[0]);
                    setNote('');
                    setAmountSan('');
                    setAmountWater('');
                    setSelectedMembers([]);
                    setSelectedGuests([]);
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
                const totalParticipants = (game.members?.length || 0) + (game.guests?.length || 0);
                const amountPerPerson = totalParticipants > 0 ? totalAmount / totalParticipants : 0;

                return (
                  <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {new Date(game.date).toLocaleDateString('vi-VN')}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-500">Tiền sân:</span>
                        <p className="font-semibold">{game.amount_san.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tiền nước:</span>
                        <p className="font-semibold">{game.amount_water.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tổng:</span>
                        <p className="font-semibold">{totalAmount.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Mỗi người:</span>
                        <p className="font-semibold text-orange-600">{amountPerPerson.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {game.members && game.members.length > 0 && (
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-sm text-gray-500">Thành viên:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {game.members.map((m) => (
                              <span key={m.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {m.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {game.guests && game.guests.length > 0 && (
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-sm text-gray-500">Khách:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {game.guests.map((g) => (
                              <span key={g.id} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                {g.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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

