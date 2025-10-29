import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    const id = parseInt(params.id);

    // Check if guest is promoted
    const guestResult = await db.execute({
      sql: 'SELECT promoted_to_member_id FROM guests WHERE id = ?',
      args: [id],
    });

    if (guestResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    if (guestResult.rows[0].promoted_to_member_id !== null) {
      return NextResponse.json(
        { error: 'Cannot edit guest that has been promoted to member' },
        { status: 403 }
      );
    }

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
    const { is_active } = await request.json();

    // Toggle is_active instead of deleting
    await db.execute({
      sql: 'UPDATE guests SET is_active = ? WHERE id = ?',
      args: [is_active ? 1 : 0, id],
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
  // Convert guest to member (promote)
  try {
    const guestId = parseInt(params.id);
    
    // Get guest info
    const guestResult = await db.execute({
      sql: 'SELECT name, promoted_to_member_id FROM guests WHERE id = ?',
      args: [guestId],
    });

    if (guestResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Check if already promoted
    if (guestResult.rows[0].promoted_to_member_id !== null) {
      return NextResponse.json(
        { error: 'Guest has already been promoted to member' },
        { status: 400 }
      );
    }

    const guestName = String(guestResult.rows[0].name);

    // Create member with same name
    const memberResult = await db.execute({
      sql: 'INSERT INTO members (name) VALUES (?)',
      args: [guestName],
    });

    const newMemberId = Number(memberResult.lastInsertRowid);

    // Lock the guest by setting promoted_to_member_id instead of deleting
    await db.execute({
      sql: 'UPDATE guests SET promoted_to_member_id = ? WHERE id = ?',
      args: [newMemberId, guestId],
    });

    return NextResponse.json({
      id: newMemberId,
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

