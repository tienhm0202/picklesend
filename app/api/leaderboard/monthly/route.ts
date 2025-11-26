import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get current month start and end dates in UTC+7
    const now = new Date();
    const utc7Date = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const year = utc7Date.getFullYear();
    const month = utc7Date.getMonth();
    
    // Start of current month
    const monthStart = new Date(year, month, 1);
    const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    
    // End of current month
    const monthEnd = new Date(year, month + 1, 0);
    const monthEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

    // Get all games in current month
    const gamesResult = await db.execute({
      sql: `
        SELECT id, date 
        FROM games 
        WHERE date >= ? AND date <= ?
        ORDER BY date ASC
      `,
      args: [monthStartStr, monthEndStr],
    });

    const monthGames = gamesResult.rows.map((row: any) => ({
      id: Number(row.id),
      date: String(row.date),
    }));

    const totalMonthGames = monthGames.length;

    if (totalMonthGames === 0) {
      return NextResponse.json([]);
    }

    // Get all members with their game participation in current month
    const membersResult = await db.execute({
      sql: `
        SELECT 
          m.id,
          m.name,
          m.color,
          m.letter,
          COUNT(DISTINCT gm.game_id) as games_attended
        FROM members m
        LEFT JOIN game_members gm ON m.id = gm.member_id
        LEFT JOIN games g ON gm.game_id = g.id AND g.date >= ? AND g.date <= ?
        GROUP BY m.id, m.name, m.color, m.letter
        HAVING games_attended > 0
        ORDER BY games_attended DESC, m.name ASC
        LIMIT 10
      `,
      args: [monthStartStr, monthEndStr],
    });

    const leaderboard = membersResult.rows.map((row: any) => {
      const gamesAttended = Number(row.games_attended || 0);
      const participationRate = totalMonthGames > 0 
        ? (gamesAttended / totalMonthGames) * 100 
        : 0;

      return {
        member_id: Number(row.id),
        name: String(row.name),
        color: row.color ? String(row.color) : undefined,
        letter: row.letter ? String(row.letter) : undefined,
        games_attended: gamesAttended,
        total_games: totalMonthGames,
        participation_rate: Math.round(participationRate * 100) / 100,
      };
    });

    // Sort by participation rate descending, then by games attended descending
    leaderboard.sort((a, b) => {
      if (b.participation_rate !== a.participation_rate) {
        return b.participation_rate - a.participation_rate;
      }
      return b.games_attended - a.games_attended;
    });

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

