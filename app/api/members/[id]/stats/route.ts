import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateMemberBalance } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    // Get member info
    const memberResult = await db.execute({
      sql: 'SELECT * FROM members WHERE id = ?',
      args: [memberId],
    });

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const member = {
      id: Number(memberResult.rows[0].id),
      name: String(memberResult.rows[0].name),
      color: memberResult.rows[0].color ? String(memberResult.rows[0].color) : undefined,
      letter: memberResult.rows[0].letter ? String(memberResult.rows[0].letter) : undefined,
    };

    // Calculate account balance
    const balance = await calculateMemberBalance(memberId, db);

    // Get deposit count and total
    const depositsResult = await db.execute({
      sql: 'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM deposits WHERE member_id = ?',
      args: [memberId],
    });
    const depositCount = Number(depositsResult.rows[0]?.count || 0);
    const totalDeposits = Number(depositsResult.rows[0]?.total || 0);

    // Get total spent (from paid payments)
    const paymentsResult = await db.execute({
      sql: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM need_payments 
        WHERE member_id = ? AND is_paid = 1
      `,
      args: [memberId],
    });
    const totalSpent = Number(paymentsResult.rows[0]?.total || 0);

    // Get total covers (amount covered for guests)
    let totalCovers = 0;
    try {
      const coversResult = await db.execute({
        sql: `
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM payment_covers 
          WHERE member_id = ?
        `,
        args: [memberId],
      });
      totalCovers = Number(coversResult.rows[0]?.total || 0);
    } catch (e: any) {
      // Table might not exist yet
    }

    // Get games this member participated in with details
    const gamesResult = await db.execute({
      sql: `
        SELECT 
          g.id,
          g.date,
          g.note,
          g.amount_san,
          g.amount_water,
          np.amount as member_amount
        FROM games g
        JOIN game_members gm ON g.id = gm.game_id
        JOIN need_payments np ON np.game_id = g.id AND np.member_id = ?
        WHERE gm.member_id = ?
        ORDER BY g.date DESC
      `,
      args: [memberId, memberId],
    });

    const games = gamesResult.rows.map((row: any) => ({
      id: Number(row.id),
      date: String(row.date),
      note: String(row.note || ''),
      amount_san: Number(row.amount_san),
      amount_water: Number(row.amount_water),
      member_amount: Number(row.member_amount),
      total_amount: Number(row.amount_san) + Number(row.amount_water),
    }));

    return NextResponse.json({
      member,
      balance,
      depositCount,
      totalDeposits,
      totalSpent: totalSpent + totalCovers, // Include covers in total spent
      totalCovers,
      games,
    });
  } catch (error: any) {
    console.error('Error fetching member stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

