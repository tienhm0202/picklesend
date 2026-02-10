import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  calculateClubFundBalanceAtDate,
  calculateTotalSpendingInRange,
} from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodIdParam = searchParams.get('period_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let from_date: string;
    let to_date: string;
    let periodName: string | null = null;

    if (periodIdParam) {
      const periodId = parseInt(periodIdParam, 10);
      if (isNaN(periodId)) {
        return NextResponse.json(
          { error: 'Invalid period_id' },
          { status: 400 }
        );
      }
      const periodResult = await db.execute({
        sql: 'SELECT * FROM settlement_periods WHERE id = ?',
        args: [periodId],
      });
      if (periodResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Period not found' },
          { status: 404 }
        );
      }
      const row: any = periodResult.rows[0];
      from_date = String(row.from_date);
      to_date = String(row.to_date);
      periodName = row.name != null ? String(row.name) : null;
    } else if (fromDate && toDate) {
      from_date = fromDate;
      to_date = toDate;
    } else {
      return NextResponse.json(
        { error: 'Provide period_id or both from_date and to_date' },
        { status: 400 }
      );
    }

    if (from_date > to_date) {
      return NextResponse.json(
        { error: 'from_date must be <= to_date' },
        { status: 400 }
      );
    }

    // Total deposits in period
    const depositsResult = await db.execute({
      sql: 'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE date >= ? AND date <= ?',
      args: [from_date, to_date],
    });
    const total_deposits = Number(depositsResult.rows[0]?.total || 0);

    // Total spending in period
    const total_spending = await calculateTotalSpendingInRange(db, from_date, to_date);

    // Balance at end of period (at to_date)
    const balance_at_end = await calculateClubFundBalanceAtDate(db, to_date);

    // Per-member deposits in period
    const perMemberResult = await db.execute({
      sql: `
        SELECT d.member_id, m.name as member_name, COALESCE(SUM(d.amount), 0) as total
        FROM deposits d
        LEFT JOIN members m ON d.member_id = m.id
        WHERE d.date >= ? AND d.date <= ?
        GROUP BY d.member_id
        HAVING total > 0
        ORDER BY total DESC
      `,
      args: [from_date, to_date],
    });
    const per_member_deposits = perMemberResult.rows.map((row: any) => ({
      member_id: row.member_id != null ? Number(row.member_id) : null,
      member_name: row.member_name != null ? String(row.member_name) : 'Không xác định',
      total: Number(row.total),
    }));

    return NextResponse.json({
      from_date,
      to_date,
      name: periodName,
      total_deposits,
      total_spending,
      balance_at_end,
      per_member_deposits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
