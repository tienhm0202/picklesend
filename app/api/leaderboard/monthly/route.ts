import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get current month start and end dates in UTC+7 (Asia/Ho_Chi_Minh)
    // Use Intl.DateTimeFormat to get accurate date in UTC+7 timezone
    const now = new Date();
    
    // Get current date in UTC+7 timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const monthNum = parseInt(parts.find(p => p.type === 'month')?.value || '0'); // 1-12
    
    // Start of current month in UTC+7
    const monthStartStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    
    // End of current month in UTC+7
    // Calculate last day: get first day of next month in UTC+7, then subtract 1 day
    const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
    const nextYear = monthNum === 12 ? year + 1 : year;
    
    // Create date for first day of next month at midnight UTC+7
    const firstDayNextMonthUTC7 = new Date(`${nextYear}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00+07:00`);
    // Subtract 1 day to get last day of current month
    const lastDayUTC7 = new Date(firstDayNextMonthUTC7.getTime() - 1);
    
    // Format last day in UTC+7 timezone
    const lastDayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const lastDayParts = lastDayFormatter.formatToParts(lastDayUTC7);
    const lastDay = parseInt(lastDayParts.find(p => p.type === 'day')?.value || '0');
    
    const monthEndStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

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

