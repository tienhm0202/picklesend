import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    const id = parseInt(params.id);

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    await db.execute({
      sql: 'UPDATE guests SET name = ? WHERE id = ?',
      args: [name.trim(), id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await db.execute({
      sql: 'DELETE FROM guests WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Convert guest to member
  try {
    const guestId = parseInt(params.id);
    
    // Get guest info
    const guestResult = await db.execute({
      sql: 'SELECT name FROM guests WHERE id = ?',
      args: [guestId],
    });

    if (guestResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    const guestName = String(guestResult.rows[0].name);

    // Create member with same name
    const memberResult = await db.execute({
      sql: 'INSERT INTO members (name) VALUES (?)',
      args: [guestName],
    });

    // Optionally delete the guest
    await db.execute({
      sql: 'DELETE FROM guests WHERE id = ?',
      args: [guestId],
    });

    return NextResponse.json({
      id: Number(memberResult.lastInsertRowid),
      name: guestName,
      balance: 0,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

