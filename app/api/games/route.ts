import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface GameMember {
  id: number;
  name: string;
  color?: string;
  letter?: string;
}

interface GameGuest {
  id: number;
  name: string;
}

interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  created_at: string;
  members?: GameMember[];
  guests?: GameGuest[];
}

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT * FROM games ORDER BY date DESC, created_at DESC
    `);
    
    const games: Game[] = result.rows.map((row: any) => ({
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
      const members: GameMember[] = membersResult.rows.map((row: any) => ({
        id: Number(row.id),
        name: String(row.name),
        color: row.color ? String(row.color) : undefined,
        letter: row.letter ? String(row.letter) : undefined,
      }));
      game.members = members;

      // Get guests, but also check if any were promoted to members
      const guestsResult = await db.execute({
        sql: `
          SELECT 
            g.id, 
            g.name, 
            g.promoted_to_member_id, 
            m.id as member_id, 
            m.name as member_name,
            m.color as member_color,
            m.letter as member_letter
          FROM game_guests gg
          JOIN guests g ON gg.guest_id = g.id
          LEFT JOIN members m ON g.promoted_to_member_id = m.id
          WHERE gg.game_id = ?
        `,
        args: [game.id],
      });
      
      // Separate promoted guests (should be in members column) and active guests
      const activeGuests: GameGuest[] = [];
      
      guestsResult.rows.forEach((row: any) => {
        if (row.promoted_to_member_id !== null && row.member_id) {
          // If promoted, add to members list instead
          const existingMember = game.members?.find((m: any) => m.id === Number(row.member_id));
          if (!existingMember) {
            // Add to members if not already there
            if (!game.members) game.members = [];
            game.members.push({
              id: Number(row.member_id),
              name: String(row.member_name),
              color: row.member_color ? String(row.member_color) : undefined,
              letter: row.member_letter ? String(row.member_letter) : undefined,
            });
          }
        } else {
          activeGuests.push({
            id: Number(row.id),
            name: String(row.name),
          });
        }
      });
      
      game.guests = activeGuests;
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
    
    if (!date || amount_san === null || amount_san === undefined || amount_water === null || amount_water === undefined) {
      return NextResponse.json(
        { error: 'date, amount_san, and amount_water are required' },
        { status: 400 }
      );
    }

    const memberIds = member_ids || [];
    let guestIds = guest_ids || [];

    // Filter out promoted guests and inactive guests
    if (guestIds.length > 0) {
      const guestCheckResult = await db.execute({
        sql: 'SELECT id, promoted_to_member_id, is_active FROM guests WHERE id IN (' + guestIds.map(() => '?').join(',') + ')',
        args: guestIds,
      });
      
      const promotedGuestIds = guestCheckResult.rows
        .filter((row: any) => row.promoted_to_member_id !== null)
        .map((row: any) => Number(row.id));
      
      const inactiveGuestIds = guestCheckResult.rows
        .filter((row: any) => row.is_active === 0 || row.is_active === null)
        .map((row: any) => Number(row.id));
      
      if (promotedGuestIds.length > 0) {
        return NextResponse.json(
          { error: 'Cannot select guests that have been promoted to members' },
          { status: 400 }
        );
      }

      if (inactiveGuestIds.length > 0) {
        return NextResponse.json(
          { error: 'Cannot select inactive guests' },
          { status: 400 }
        );
      }
    }

    // Check inactive members
    if (memberIds.length > 0) {
      const memberCheckResult = await db.execute({
        sql: 'SELECT id, is_active FROM members WHERE id IN (' + memberIds.map(() => '?').join(',') + ')',
        args: memberIds,
      });
      
      const inactiveMemberIds = memberCheckResult.rows
        .filter((row: any) => row.is_active === 0 || row.is_active === null)
        .map((row: any) => Number(row.id));
      
      if (inactiveMemberIds.length > 0) {
        return NextResponse.json(
          { error: 'Cannot select inactive members' },
          { status: 400 }
        );
      }
    }

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

