'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import Avatar, { generateLetter, defaultColors, generateColor } from '@/components/Avatar';

interface Member {
  id: number;
  name: string;
  balance: number;
  color?: string;
  letter?: string;
  is_active?: boolean;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('');
  const [letter, setLetter] = useState<string>('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error fetching members:', errorData.error);
        alert(`Lỗi: ${errorData.error || 'Không thể tải danh sách thành viên'}`);
        setMembers([]);
        return;
      }
      const data = await res.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        console.error('Invalid response format:', data);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Có lỗi xảy ra khi tải danh sách thành viên');
      setMembers([]);
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
      // Nếu đang edit, chỉ cập nhật 1 thành viên
      if (editMember) {
        const url = `/api/members/${editMember.id}`;
        const memberLetter = letter.trim() || generateLetter(name.trim());
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: name.trim(),
            color: color.trim() || undefined,
            letter: memberLetter,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert(`Lỗi: ${errorData.error || 'Không thể cập nhật thành viên'}`);
          return;
        }

        setName('');
        setColor('');
        setLetter('');
        setEditMember(null);
        setShowAddForm(false);
        fetchMembers();
        return;
      }

      // Nếu đang thêm mới, parse nhiều tên
      const names = parseNames(name);
      if (names.length === 0) {
        alert('Vui lòng nhập ít nhất một tên thành viên');
        return;
      }

      // Tạo nhiều thành viên cùng lúc
      const results = await Promise.allSettled(
        names.map(async (name) => {
          const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) {
            throw new Error(`Failed to create member: ${name}`);
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
          `Đã tạo ${successCount} thành viên thành công. ${failedCount} thành viên gặp lỗi.`
        );
      } else {
        alert(`Đã tạo ${successCount} thành viên thành công!`);
      }

      setName('');
      setColor('');
      setLetter('');
      setShowAddForm(false);
      fetchMembers();
    } catch (error) {
      console.error('Error saving members:', error);
      alert('Có lỗi xảy ra khi lưu thành viên');
    }
  };

  const handleEdit = (member: Member) => {
    setEditMember(member);
    setName(member.name);
    setColor(member.color || '');
    setLetter(member.letter || generateLetter(member.name));
    setShowAddForm(true);
  };

  const handleToggleActive = async (member: Member) => {
    const newStatus = !member.is_active;
    const action = newStatus ? 'kích hoạt' : 'vô hiệu hóa';
    
    if (!confirm(`Bạn có chắc muốn ${action} thành viên này?`)) return;

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error || `Không thể ${action} thành viên`}`);
        return;
      }
      
      fetchMembers();
    } catch (error) {
      console.error('Error toggling member active status:', error);
      alert('Có lỗi xảy ra');
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
            <h1 className="text-3xl font-bold text-gray-900">Quản lý thành viên</h1>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditMember(null);
                setName('');
                setColor('');
                setLetter('');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm thành viên
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                {editMember ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!letter.trim()) {
                          setLetter(generateLetter(e.target.value));
                        }
                      }}
                      placeholder="Tên thành viên"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Chữ cái (tối đa 2 ký tự)</label>
                        <input
                          type="text"
                          value={letter}
                          onChange={(e) => setLetter(e.target.value.substring(0, 2).toUpperCase())}
                          placeholder="Auto"
                          maxLength={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Màu nền</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={color || generateColor(name)}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <div className="flex-1 grid grid-cols-5 gap-1">
                            {defaultColors.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className="w-8 h-8 rounded border-2"
                                style={{
                                  backgroundColor: c,
                                  borderColor: color === c ? '#3B82F6' : '#E5E7EB',
                                }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Xem trước:</span>
                      <Avatar name={name} color={color || undefined} letter={letter || generateLetter(name)} size={50} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên thành viên, phân tách bằng dấu phẩy (ví dụ: Nguyễn Văn A, Trần Thị B, Lê Văn C)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Nhập nhiều tên thành viên, phân tách bằng dấu phẩy (,)
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                  >
                    {editMember ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditMember(null);
                      setName('');
                      setColor('');
                      setLetter('');
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
          ) : !Array.isArray(members) || members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có thành viên nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Thành viên</th>
                    <th className="px-4 py-3 text-left font-semibold">Số dư</th>
                    <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(members) && members.map((member) => (
                    <tr key={member.id} className={`border-b hover:bg-gray-50 ${member.is_active === false ? 'bg-gray-100 opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/members/${member.id}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <Avatar
                            name={member.name}
                            color={member.color}
                            letter={member.letter}
                            size={40}
                          />
                          <span className={`font-medium ${member.is_active === false ? 'text-gray-500' : 'text-blue-600 hover:text-blue-800'} cursor-pointer`}>
                            {member.name}
                            {member.is_active === false && <span className="ml-2 text-xs text-gray-400">(Đã vô hiệu hóa)</span>}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={member.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {member.balance >= 0 ? '+' : ''}
                          {member.balance.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-500 hover:text-blue-700 mr-3"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={member.is_active === false ? 'text-green-500 hover:text-green-700' : 'text-orange-500 hover:text-orange-700'}
                          title={member.is_active === false ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                        >
                          {member.is_active === false ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

