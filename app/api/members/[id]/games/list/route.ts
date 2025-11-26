import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    // Get games that this member has attended with member count, ordered by date DESC, limit 10
    const gamesResult = await db.execute({
      sql: `
        SELECT 
          g.id,
          g.date,
          g.note,
          g.created_at,
          (SELECT COUNT(*) FROM game_members gm2 WHERE gm2.game_id = g.id) as member_count
        FROM games g
        INNER JOIN game_members gm ON g.id = gm.game_id
        WHERE gm.member_id = ?
        GROUP BY g.id, g.date, g.note, g.created_at
        ORDER BY g.date DESC, g.created_at DESC
        LIMIT 10
      `,
      args: [memberId],
    });

    console.log(`[Member Games List] Member ID: ${memberId}, Raw rows count: ${gamesResult.rows.length}`);
    console.log(`[Member Games List] Raw rows:`, gamesResult.rows);

    const games = gamesResult.rows.map((row: any) => {
      // Access by column name (libSQL returns objects with column names as keys)
      const game = {
        id: Number(row.id ?? row[0]),
        date: String(row.date ?? row[1] ?? ''),
        note: String(row.note ?? row[2] ?? ''),
        created_at: String(row.created_at ?? row[3] ?? ''),
        member_count: Number(row.member_count ?? row[4] ?? 0),
      };
      console.log(`[Member Games List] Mapped game:`, game);
      return game;
    });

    console.log(`[Member Games List] Member ID: ${memberId}, Found ${games.length} games`);
    
    return NextResponse.json(games);
  } catch (error: any) {
    console.error('Member games list API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

