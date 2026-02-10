import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentDateUTC7 } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let fromDate = searchParams.get('from_date');
    let toDate = searchParams.get('to_date');

    if (!fromDate || !toDate) {
      const today = getCurrentDateUTC7();
      try {
        const latestResult = await db.execute(`
          SELECT to_date FROM settlement_periods ORDER BY to_date DESC LIMIT 1
        `);
        const defaultFrom = latestResult.rows.length > 0
          ? String((latestResult.rows[0] as any).to_date)
          : '2000-01-01';
        fromDate = fromDate ?? defaultFrom;
        toDate = toDate ?? today;
      } catch {
        fromDate = fromDate ?? '2000-01-01';
        toDate = toDate ?? getCurrentDateUTC7();
      }
    }

    const result = await db.execute({
      sql: `
        SELECT d.*, m.name as member_name
        FROM deposits d
        LEFT JOIN members m ON d.member_id = m.id
        WHERE d.date >= ? AND d.date <= ?
        ORDER BY d.date DESC, d.created_at DESC
      `,
      args: [fromDate, toDate],
    });

    const deposits = result.rows.map((row: any) => ({
      id: Number(row.id),
      member_id: row.member_id ? Number(row.member_id) : null,
      member_name: row.member_name ? String(row.member_name) : 'Không xác định',
      date: String(row.date),
      amount: Number(row.amount),
      created_at: String(row.created_at),
    }));

    return NextResponse.json(deposits);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { member_id, date, amount } = await request.json();
    
    // Use current date in UTC+7 if not provided
    const depositDate = date || getCurrentDateUTC7();
    
    if (!amount) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // All deposits go to club fund
    // member_id is optional - just for tracking who deposited
    const result = await db.execute({
      sql: 'INSERT INTO deposits (member_id, date, amount) VALUES (?, ?, ?)',
      args: [member_id || null, depositDate, amount],
    });

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      member_id: member_id || null,
      date: depositDate,
      amount,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

