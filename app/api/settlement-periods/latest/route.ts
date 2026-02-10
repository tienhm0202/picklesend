import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT * FROM settlement_periods
      ORDER BY to_date DESC
      LIMIT 1
    `);
    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }
    const row: any = result.rows[0];
    return NextResponse.json({
      id: Number(row.id),
      from_date: String(row.from_date),
      to_date: String(row.to_date),
      name: row.name != null ? String(row.name) : null,
      created_at: String(row.created_at),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
