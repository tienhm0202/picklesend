import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT * FROM games ORDER BY date DESC, created_at DESC
    `);
    
    const games = result.rows.map((row) => ({
      id: Number(row.id),
      date: String(row.date),
      note: String(row.note || ''),
      amount_san: Number(row.amount_san),
      amount_water: Number(row.amount_water),
      created_at: String(row.created_at),
    }));

    // Get members and guests for each game
    for (const game of games) {
      const membersResult = await db.execute({
        sql: `
          SELECT m.id, m.name, m.color, m.letter
          FROM game_members gm
          JOIN members m ON gm.member_id = m.id
          WHERE gm.game_id = ?
        `,
        args: [game.id],
      });
      game.members = membersResult.rows.map((row: any) => ({
        id: Number(row.id),
        name: String(row.name),
        color: row.color ? String(row.color) : undefined,
        letter: row.letter ? String(row.letter) : undefined,
      }));

      const guestsResult = await db.execute({
        sql: `
          SELECT g.id, g.name
          FROM game_guests gg
          JOIN guests g ON gg.guest_id = g.id
          WHERE gg.game_id = ?
        `,
        args: [game.id],
      });
      game.guests = guestsResult.rows.map((row: any) => ({
        id: Number(row.id),
        name: String(row.name),
      }));
    }

    return NextResponse.json(games);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, note, amount_san, amount_water, member_ids, guest_ids } = await request.json();
    
    if (!date || !amount_san || !amount_water) {
      return NextResponse.json(
        { error: 'date, amount_san, and amount_water are required' },
        { status: 400 }
      );
    }

    const memberIds = member_ids || [];
    const guestIds = guest_ids || [];
    const totalParticipants = memberIds.length + guestIds.length;

    if (totalParticipants === 0) {
      return NextResponse.json(
        { error: 'At least one member or guest must be selected' },
        { status: 400 }
      );
    }

    // Create game
    const gameResult = await db.execute({
      sql: 'INSERT INTO games (date, note, amount_san, amount_water) VALUES (?, ?, ?, ?)',
      args: [date, note || '', amount_san, amount_water],
    });

    const gameId = Number(gameResult.lastInsertRowid);
    const totalAmount = amount_san + amount_water;
    const amountPerPerson = totalAmount / totalParticipants;

    // Add game members
    for (const memberId of memberIds) {
      await db.execute({
        sql: 'INSERT INTO game_members (game_id, member_id) VALUES (?, ?)',
        args: [gameId, memberId],
      });

      // Create payment record for member (automatically marked as paid, deducted from balance)
      await db.execute({
        sql: 'INSERT INTO need_payments (game_id, member_id, amount, is_paid) VALUES (?, ?, ?, 1)',
        args: [gameId, memberId, amountPerPerson],
      });
    }

    // Add game guests
    for (const guestId of guestIds) {
      await db.execute({
        sql: 'INSERT INTO game_guests (game_id, guest_id) VALUES (?, ?)',
        args: [gameId, guestId],
      });

      // Create payment record for guest (not paid, needs to collect)
      await db.execute({
        sql: 'INSERT INTO need_payments (game_id, guest_id, amount, is_paid) VALUES (?, ?, ?, 0)',
        args: [gameId, guestId, amountPerPerson],
      });
    }

    return NextResponse.json({
      id: gameId,
      date,
      note: note || '',
      amount_san,
      amount_water,
      member_ids: memberIds,
      guest_ids: guestIds,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

