import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get start of month in UTC+7
function getMonthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

// Get end of month in UTC+7
function getMonthEnd(year: number, month: number): string {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const firstDayNextMonth = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+07:00`);
  const lastDay = new Date(firstDayNextMonth.getTime() - 1);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(lastDay);
  const lastDayNum = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;
}

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

    // Get current date in UTC+7
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const currentYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const currentMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');

    // Get badges for last 12 months (including current month)
    const badges: Array<{
      month: number;
      year: number;
      participation_rate: number;
      rank: number | null;
      total_members: number;
    }> = [];

    // First, try to get cached badges from database
    const cachedBadges = new Map<string, any>();
    try {
      const cachedBadgesResult = await db.execute({
        sql: `
          SELECT month, year, participation_rate, rank, games_attended, total_games
          FROM member_badges
          WHERE member_id = ?
          ORDER BY year DESC, month DESC
          LIMIT 12
        `,
        args: [memberId],
      });

      cachedBadgesResult.rows.forEach((row: any) => {
        const key = `${row.year}-${row.month}`;
        cachedBadges.set(key, {
          month: Number(row.month),
          year: Number(row.year),
          participation_rate: Number(row.participation_rate),
          rank: row.rank ? Number(row.rank) : null,
          games_attended: Number(row.games_attended),
          total_games: Number(row.total_games),
        });
      });
    } catch (error: any) {
      // Table might not exist yet, ignore and calculate real-time
      console.log('member_badges table not found, calculating real-time');
    }

    for (let i = 11; i >= 0; i--) {
      let year = currentYear;
      let month = currentMonth - i;
      
      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const cacheKey = `${year}-${month}`;
      
      // Check if badge exists in cache
      if (cachedBadges.has(cacheKey)) {
        const cachedBadge = cachedBadges.get(cacheKey)!;
        // Get total members count for this month (for display)
        const monthStart = getMonthStart(year, month);
        const monthEnd = getMonthEnd(year, month);
        const membersCountResult = await db.execute({
          sql: `
            SELECT COUNT(DISTINCT m.id) as total
            FROM members m
            INNER JOIN game_members gm ON m.id = gm.member_id
            INNER JOIN games g ON gm.game_id = g.id
            WHERE g.date >= ? AND g.date <= ?
          `,
          args: [monthStart, monthEnd],
        });
        const totalMembers = Number(membersCountResult.rows[0]?.total || 0);
        
        badges.push({
          month: cachedBadge.month,
          year: cachedBadge.year,
          participation_rate: cachedBadge.participation_rate,
          rank: cachedBadge.rank,
          total_members: totalMembers,
        });
        continue;
      }

      // If not in cache, calculate real-time
      const monthStart = getMonthStart(year, month);
      const monthEnd = getMonthEnd(year, month);

      // Get total games in this month
      const gamesResult = await db.execute({
        sql: `
          SELECT COUNT(*) as total 
          FROM games 
          WHERE date >= ? AND date <= ?
        `,
        args: [monthStart, monthEnd],
      });
      const totalGames = Number(gamesResult.rows[0]?.total || 0);

      if (totalGames === 0) {
        // No games in this month, skip
        continue;
      }

      // Get member's games attended in this month
      const memberGamesResult = await db.execute({
        sql: `
          SELECT COUNT(DISTINCT gm.game_id) as games_attended
          FROM game_members gm
          INNER JOIN games g ON gm.game_id = g.id
          WHERE gm.member_id = ? AND g.date >= ? AND g.date <= ?
        `,
        args: [memberId, monthStart, monthEnd],
      });
      const gamesAttended = Number(memberGamesResult.rows[0]?.games_attended || 0);
      const participationRate = totalGames > 0 ? (gamesAttended / totalGames) * 100 : 0;

      // Get member's rank in this month (only if member has attended at least one game)
      let rank: number | null = null;
      let totalMembers = 0;
      
      if (gamesAttended > 0) {
        const rankResult = await db.execute({
          sql: `
            SELECT 
              m.id,
              COUNT(DISTINCT gm.game_id) as games_attended
            FROM members m
            LEFT JOIN game_members gm ON m.id = gm.member_id
            LEFT JOIN games g ON gm.game_id = g.id AND g.date >= ? AND g.date <= ?
            GROUP BY m.id
            HAVING games_attended > 0
          `,
          args: [monthStart, monthEnd],
        });

        const members = rankResult.rows.map((row: any) => ({
          id: Number(row.id),
          games_attended: Number(row.games_attended || 0),
        }));

        totalMembers = members.length;

        // Calculate participation rates for ranking
        const membersWithRates = members.map(m => ({
          ...m,
          participation_rate: totalGames > 0 ? (m.games_attended / totalGames) * 100 : 0,
        }));

        // Sort by participation rate descending, then by games attended descending
        membersWithRates.sort((a, b) => {
          if (b.participation_rate !== a.participation_rate) {
            return b.participation_rate - a.participation_rate;
          }
          return b.games_attended - a.games_attended;
        });

        // Find member's rank
        const memberIndex = membersWithRates.findIndex(m => m.id === memberId);
        rank = memberIndex >= 0 ? memberIndex + 1 : null;
      }

      badges.push({
        month,
        year,
        participation_rate: Math.round(participationRate * 100) / 100,
        rank,
        total_members: totalMembers,
      });
    }

    return NextResponse.json(badges);
  } catch (error: any) {
    console.error('Badges API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

