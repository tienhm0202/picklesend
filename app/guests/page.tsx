'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, UserPlus, Star, Eye, EyeOff } from 'lucide-react';

interface Guest {
  id: number;
  name: string;
  promoted_to_member_id: number | null;
  is_active?: boolean;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    checkAdmin();
    fetchGuests();
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

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/guests');
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error fetching guests:', errorData.error);
        alert(`Lỗi: ${errorData.error || 'Không thể tải danh sách khách'}`);
        setGuests([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setGuests(data);
      } else {
        console.error('Invalid response format:', data);
        setGuests([]);
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      alert('Có lỗi xảy ra khi tải danh sách khách');
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const parseNames = (input: string): string[] => {
    // Tách theo dấu phẩy, loại bỏ whitespace trước và sau, lọc bỏ empty strings
    return input
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // Nếu đang edit, chỉ cập nhật 1 khách
      if (editGuest) {
        const url = `/api/guests/${editGuest.id}`;
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert(`Lỗi: ${errorData.error || 'Không thể cập nhật khách'}`);
          return;
        }

        setName('');
        setEditGuest(null);
        setShowAddForm(false);
        fetchGuests();
        return;
      }

      // Nếu đang thêm mới, parse nhiều tên
      const names = parseNames(name);
      if (names.length === 0) {
        alert('Vui lòng nhập ít nhất một tên khách');
        return;
      }

      // Tạo nhiều khách cùng lúc
      const results = await Promise.allSettled(
        names.map(async (name) => {
          const res = await fetch('/api/guests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) {
            throw new Error(`Failed to create guest: ${name}`);
          }
          return res.json();
        })
      );

      const successCount = results.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        alert(
          `Đã tạo ${successCount} khách thành công. ${failedCount} khách gặp lỗi.`
        );
      } else {
        alert(`Đã tạo ${successCount} khách thành công!`);
      }

      setName('');
      setShowAddForm(false);
      fetchGuests();
    } catch (error) {
      console.error('Error saving guests:', error);
      alert('Có lỗi xảy ra khi lưu khách');
    }
  };

  const handleEdit = (guest: Guest) => {
    if (guest.promoted_to_member_id) {
      alert('Không thể chỉnh sửa khách đã được promote lên thành viên');
      return;
    }
    setEditGuest(guest);
    setName(guest.name);
    setShowAddForm(true);
  };

  const handleToggleActive = async (guest: Guest) => {
    if (guest.promoted_to_member_id) {
      alert('Không thể thay đổi trạng thái khách đã được promote lên thành viên');
      return;
    }

    const newStatus = !guest.is_active;
    const action = newStatus ? 'kích hoạt' : 'vô hiệu hóa';
    
    if (!confirm(`Bạn có chắc muốn ${action} khách này?`)) return;

    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error || `Không thể ${action} khách`}`);
        return;
      }
      
      fetchGuests();
    } catch (error) {
      console.error('Error toggling guest active status:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleConvertToMember = async (id: number) => {
    if (!confirm('Chuyển khách này thành thành viên? Khách này sẽ không thể được chọn trong game nữa và sẽ hiển thị trong cột Members.')) return;

    try {
      const res = await fetch(`/api/guests/${id}`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error || 'Không thể chuyển thành thành viên'}`);
        return;
      }
      alert('Đã chuyển thành thành viên thành công. Tên của họ giờ sẽ hiện trong cột Members.');
      fetchGuests();
    } catch (error) {
      console.error('Error converting guest:', error);
      alert('Có lỗi xảy ra khi chuyển thành thành viên');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý khách</h1>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditGuest(null);
                  setName('');
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm khách
              </button>
            )}
          </div>

          {isAdmin && showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                {editGuest ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên khách"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                ) : (
                  <div>
                    <textarea
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên khách, phân tách bằng dấu phẩy (ví dụ: Nguyễn Văn A, Trần Thị B, Lê Văn C)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Nhập nhiều tên khách, phân tách bằng dấu phẩy (,)
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                  >
                    {editGuest ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditGuest(null);
                      setName('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : !Array.isArray(guests) || guests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có khách nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tên</th>
                    {isAdmin && <th className="px-4 py-3 text-right font-semibold">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(guests) && guests.map((guest) => {
                    const isPromoted = guest.promoted_to_member_id !== null;
                    const isInactive = guest.is_active === false;
                    return (
                      <tr key={guest.id} className={`border-b hover:bg-gray-50 ${isPromoted ? 'bg-yellow-50' : ''} ${isInactive && !isPromoted ? 'bg-gray-100 opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isPromoted && (
                              <span title="Đã là thành viên (Membership)">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              </span>
                            )}
                            <span className={isInactive && !isPromoted ? 'text-gray-500' : ''}>
                              {guest.name}
                              {isInactive && !isPromoted && <span className="ml-2 text-xs text-gray-400">(Đã vô hiệu hóa)</span>}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            {!isPromoted && (
                              <button
                                onClick={() => handleConvertToMember(guest.id)}
                                className="text-purple-500 hover:text-purple-700 mr-3"
                                title="Chuyển thành thành viên"
                              >
                                <UserPlus className="w-5 h-5" />
                              </button>
                            )}
                            {!isPromoted ? (
                              <>
                                <button
                                  onClick={() => handleEdit(guest)}
                                  className="text-blue-500 hover:text-blue-700 mr-3"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(guest)}
                                  className={isInactive ? 'text-green-500 hover:text-green-700' : 'text-orange-500 hover:text-orange-700'}
                                  title={isInactive ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                                >
                                  {isInactive ? (
                                    <Eye className="w-5 h-5" />
                                  ) : (
                                    <EyeOff className="w-5 h-5" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Đã là thành viên</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

