'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface SettlementPeriod {
  id: number;
  from_date: string;
  to_date: string;
  name: string | null;
  created_at: string;
}

interface SettlementReport {
  from_date: string;
  to_date: string;
  name: string | null;
  total_deposits: number;
  total_spending: number;
  balance_at_end: number;
  per_member_deposits: Array<{ member_id: number | null; member_name: string; total: number }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export default function ReportSettlementPage() {
  const [periods, setPeriods] = useState<SettlementPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchReport(selectedPeriodId);
    } else {
      setReport(null);
    }
  }, [selectedPeriodId]);

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/settlement-periods');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data);
        if (data.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchReport = async (periodId: number) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/reports/settlement?period_id=${periodId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link href="/report" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về Report
          </Link>
          <Link href="/report/spending" className="inline-flex items-center text-orange-600 hover:text-orange-800">
            Báo cáo tiêu tiền
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Báo cáo chốt kỳ đối soát</h1>

          {loadingPeriods ? (
            <div className="text-center py-8 text-gray-500">Đang tải danh sách kỳ...</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có kỳ chốt nào.</div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn kỳ</label>
                <select
                  value={selectedPeriodId ?? ''}
                  onChange={(e) => setSelectedPeriodId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || `Kỳ ${p.id}`} ({formatDate(p.from_date)} – {formatDate(p.to_date)})
                    </option>
                  ))}
                </select>
              </div>

              {loadingReport ? (
                <div className="text-center py-8 text-gray-500">Đang tải báo cáo...</div>
              ) : report ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 font-medium">Tổng nạp trong kỳ</p>
                      <p className="text-2xl font-bold text-green-800">
                        {report.total_deposits.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium">Tổng chi trong kỳ</p>
                      <p className="text-2xl font-bold text-red-800">
                        {report.total_spending.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">Số dư cuối kỳ</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {report.balance_at_end.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>

                  {report.per_member_deposits.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Nạp theo thành viên trong kỳ</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Thành viên</th>
                              <th className="px-4 py-3 text-right font-semibold">Tổng nạp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.per_member_deposits.map((row, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{row.member_name}</td>
                                <td className="px-4 py-3 text-right text-green-600 font-semibold">
                                  +{row.total.toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
