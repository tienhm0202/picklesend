import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT d.*, m.name as member_name
      FROM deposits d
      JOIN members m ON d.member_id = m.id
      ORDER BY d.date DESC, d.created_at DESC
    `);
    
    const deposits = result.rows.map((row) => ({
      id: Number(row.id),
      member_id: Number(row.member_id),
      member_name: String(row.member_name),
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
    
    if (!member_id || !date || !amount) {
      return NextResponse.json(
        { error: 'member_id, date, and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: 'INSERT INTO deposits (member_id, date, amount) VALUES (?, ?, ?)',
      args: [member_id, date, amount],
    });

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      member_id,
      date,
      amount,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

