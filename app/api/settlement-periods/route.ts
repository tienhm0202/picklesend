import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT * FROM settlement_periods
      ORDER BY to_date DESC, created_at DESC
    `);
    const periods = result.rows.map((row: any) => ({
      id: Number(row.id),
      from_date: String(row.from_date),
      to_date: String(row.to_date),
      name: row.name != null ? String(row.name) : null,
      created_at: String(row.created_at),
    }));
    return NextResponse.json(periods);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCookie = request.cookies.get('admin');
    if (adminCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from_date, to_date, name } = await request.json();
    if (!from_date || !to_date) {
      return NextResponse.json(
        { error: 'from_date and to_date are required' },
        { status: 400 }
      );
    }
    if (from_date > to_date) {
      return NextResponse.json(
        { error: 'from_date must be less than or equal to to_date' },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: 'INSERT INTO settlement_periods (from_date, to_date, name) VALUES (?, ?, ?)',
      args: [from_date, to_date, name || null],
    });

    return NextResponse.json(
      {
        id: Number(result.lastInsertRowid),
        from_date,
        to_date,
        name: name || null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
