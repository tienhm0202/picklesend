import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT 
        np.*,
        g.date as game_date,
        g.note as game_note,
        g.amount_san,
        g.amount_water,
        m.name as member_name,
        gu.name as guest_name
      FROM need_payments np
      JOIN games g ON np.game_id = g.id
      LEFT JOIN members m ON np.member_id = m.id
      LEFT JOIN guests gu ON np.guest_id = gu.id
      ORDER BY np.is_paid ASC, g.date DESC
    `);
    
    const payments = result.rows.map((row) => ({
      id: Number(row.id),
      game_id: Number(row.game_id),
      game_date: String(row.game_date),
      game_note: String(row.game_note || ''),
      amount_san: Number(row.amount_san),
      amount_water: Number(row.amount_water),
      member_id: row.member_id ? Number(row.member_id) : null,
      member_name: row.member_name ? String(row.member_name) : null,
      guest_id: row.guest_id ? Number(row.guest_id) : null,
      guest_name: row.guest_name ? String(row.guest_name) : null,
      amount: Number(row.amount),
      is_paid: Boolean(row.is_paid),
      created_at: String(row.created_at),
    }));

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

