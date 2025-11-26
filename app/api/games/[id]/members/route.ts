import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id);

    const result = await db.execute({
      sql: `
        SELECT gm.member_id, m.name, m.color, m.letter
        FROM game_members gm
        JOIN members m ON gm.member_id = m.id
        WHERE gm.game_id = ?
        ORDER BY m.name
      `,
      args: [gameId],
    });

    const members = result.rows.map((row: any) => ({
      member_id: Number(row.member_id),
      name: String(row.name),
      color: row.color ? String(row.color) : undefined,
      letter: row.letter ? String(row.letter) : undefined,
    }));

    return NextResponse.json(members);
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
  try {
    const gameId = parseInt(params.id);
    const { member_id } = await request.json();

    if (!member_id) {
      return NextResponse.json(
        { error: 'member_id is required' },
        { status: 400 }
      );
    }

    // Check if game exists
    const gameResult = await db.execute({
      sql: 'SELECT id FROM games WHERE id = ?',
      args: [gameId],
    });

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if member exists
    const memberResult = await db.execute({
      sql: 'SELECT id FROM members WHERE id = ?',
      args: [member_id],
    });

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Insert into game_members (UNIQUE constraint will prevent duplicates)
    try {
      const result = await db.execute({
        sql: 'INSERT INTO game_members (game_id, member_id) VALUES (?, ?)',
        args: [gameId, member_id],
      });

      return NextResponse.json({
        id: Number(result.lastInsertRowid),
        game_id: gameId,
        member_id: member_id,
        success: true,
      }, { status: 201 });
    } catch (error: any) {
      // If UNIQUE constraint violation, member is already in the game
      if (error.message?.includes('UNIQUE constraint') || error.message?.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'Member is already registered for this game', already_exists: true },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
