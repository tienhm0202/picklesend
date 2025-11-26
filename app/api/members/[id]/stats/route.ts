import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      created_at: String(memberResult.rows[0].created_at),
    };

    // Get all deposits for this member
    const depositsResult = await db.execute({
      sql: `
        SELECT 
          id,
          date,
          amount,
          created_at
        FROM deposits 
        WHERE member_id = ?
        ORDER BY date DESC, created_at DESC
      `,
      args: [memberId],
    });

    const deposits = depositsResult.rows.map((row: any) => ({
      id: Number(row.id),
      date: String(row.date),
      amount: Number(row.amount),
      created_at: String(row.created_at),
    }));

    const depositCount = deposits.length;
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      member,
      depositCount,
      totalDeposits,
      deposits,
    });
  } catch (error: any) {
    console.error('Error fetching member stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

