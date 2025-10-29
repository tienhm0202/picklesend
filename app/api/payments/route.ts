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
        gu.name as guest_name,
        COALESCE(np.paid_from_club_fund, 0) as paid_from_club_fund
      FROM need_payments np
      JOIN games g ON np.game_id = g.id
      LEFT JOIN members m ON np.member_id = m.id
      LEFT JOIN guests gu ON np.guest_id = gu.id
      ORDER BY np.is_paid ASC, g.date DESC
    `);
    
    const payments = result.rows.map((row: any) => ({
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
      paid_from_club_fund: Boolean(row.paid_from_club_fund || false),
      created_at: String(row.created_at),
    }));

    // Get covers for each payment
    for (const payment of payments) {
      try {
        const coversResult = await db.execute({
          sql: `
            SELECT pc.*, m.name as member_name
            FROM payment_covers pc
            JOIN members m ON pc.member_id = m.id
            WHERE pc.payment_id = ?
          `,
          args: [payment.id],
        });
        (payment as any).covers = coversResult.rows.map((row: any) => ({
          id: Number(row.id),
          member_id: Number(row.member_id),
          member_name: String(row.member_name),
          amount: Number(row.amount),
        }));
      } catch (e: any) {
        // Table might not exist yet
        (payment as any).covers = [];
      }
    }

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

