import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      member_name: row.member_name ? String(row.member_name) : 'Quỹ CLB (Donate)',
      date: String(row.date),
      amount: Number(row.amount),
      created_at: String(row.created_at),
      is_donation: row.member_id === null,
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
    const { member_id, date, amount, is_donation } = await request.json();
    
    if (!date || !amount) {
      return NextResponse.json(
        { error: 'date and amount are required' },
        { status: 400 }
      );
    }

    // If is_donation is true, member_id should be null
    // If is_donation is false, member_id is required
    if (!is_donation && !member_id) {
      return NextResponse.json(
        { error: 'member_id is required when not donating' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const finalMemberId = is_donation ? null : member_id;

    const result = await db.execute({
      sql: 'INSERT INTO deposits (member_id, date, amount) VALUES (?, ?, ?)',
      args: [finalMemberId, date, amount],
    });

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      member_id: finalMemberId,
      date,
      amount,
      is_donation: is_donation || false,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

