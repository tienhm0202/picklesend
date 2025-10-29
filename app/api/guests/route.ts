import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM guests ORDER BY name');
    const guests = result.rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      promoted_to_member_id: row.promoted_to_member_id ? Number(row.promoted_to_member_id) : null,
      is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
      created_at: String(row.created_at),
    }));

    return NextResponse.json(guests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: 'INSERT INTO guests (name) VALUES (?)',
      args: [name.trim()],
    });

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      name: name.trim(),
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

