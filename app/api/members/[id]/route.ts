import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateLetter } from '@/components/Avatar';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, color, letter } = await request.json();
    const id = parseInt(params.id);

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const memberLetter = letter || generateLetter(trimmedName);

    await db.execute({
      sql: 'UPDATE members SET name = ?, color = ?, letter = ? WHERE id = ?',
      args: [trimmedName, color || null, memberLetter, id],
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
      sql: 'DELETE FROM members WHERE id = ?',
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

