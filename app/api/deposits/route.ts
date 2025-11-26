import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentDateUTC7, getCurrentDateTimeUTC7 } from '@/lib/utils';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT d.*, m.name as member_name
      FROM deposits d
      LEFT JOIN members m ON d.member_id = m.id
      ORDER BY d.date DESC, d.created_at DESC
    `);
    
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

