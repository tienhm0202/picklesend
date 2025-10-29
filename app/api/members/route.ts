import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { calculateMemberBalance } from '@/lib/utils';
import { generateLetter } from '@/components/Avatar';

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM members ORDER BY name');
    const members = result.rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      balance: Number(row.balance),
      color: row.color ? String(row.color) : undefined,
      letter: row.letter ? String(row.letter) : undefined,
      created_at: String(row.created_at),
    }));

    // Calculate actual balance for each member
    for (const member of members) {
      member.balance = await calculateMemberBalance(member.id, db);
    }

    return NextResponse.json(members);
  } catch (error: any) {
    // If table doesn't exist, try to initialize
    if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      try {
        await initDatabase();
        // Retry after initialization
        const result = await db.execute('SELECT * FROM members ORDER BY name');
        return NextResponse.json([]);
      } catch (initError: any) {
        return NextResponse.json(
          { error: `Database initialization failed: ${initError.message}` },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Parse request body once
  const body = await request.json();
  const { name, color, letter } = body;
  
  if (!name || name.trim() === '') {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  const memberLetter = letter || generateLetter(trimmedName);

  try {
    const result = await db.execute({
      sql: 'INSERT INTO members (name, color, letter) VALUES (?, ?, ?)',
      args: [trimmedName, color || null, memberLetter],
    });

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      name: trimmedName,
      balance: 0,
      color: color || undefined,
      letter: memberLetter,
    }, { status: 201 });
  } catch (error: any) {
    // If table doesn't exist, try to initialize
    if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      try {
        await initDatabase();
        // Retry after initialization
        const result = await db.execute({
          sql: 'INSERT INTO members (name, color, letter) VALUES (?, ?, ?)',
          args: [trimmedName, color || null, memberLetter],
        });
        return NextResponse.json({
          id: Number(result.lastInsertRowid),
          name: trimmedName,
          balance: 0,
          color: color || undefined,
          letter: memberLetter,
        }, { status: 201 });
      } catch (initError: any) {
        return NextResponse.json(
          { error: `Database initialization failed: ${initError.message}` },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

