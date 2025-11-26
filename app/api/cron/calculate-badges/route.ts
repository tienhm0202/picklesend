import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verify the request is from Vercel Cron
// Vercel Cron requests are automatically protected by Vercel infrastructure
// But we can add an extra layer of security with CRON_SECRET
function verifyCronRequest(request: NextRequest): boolean {
  // Vercel Cron jobs are automatically protected - only Vercel can call them
  // However, if CRON_SECRET is set, we verify it for extra security
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    // If no CRON_SECRET is set, trust Vercel's built-in protection
    // In production, it's recommended to set CRON_SECRET
    return true;
  }
  
  // Verify CRON_SECRET if it's set
  // Vercel doesn't automatically add this, so you'd need to add it manually
  // or use it as a query parameter: ?secret=your-secret
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check query parameter as alternative
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  if (secretParam === cronSecret) {
    return true;
  }
  
  // If CRON_SECRET is set but doesn't match, reject
  return false;
}

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

export async function GET(request: NextRequest) {
  try {
    // Verify this is a valid cron request
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current date in UTC+7
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateParts = dateFormatter.formatToParts(now);
    const currentDay = parseInt(dateParts.find(p => p.type === 'day')?.value || '0');
    const isFirstDayOfMonth = currentDay === 1;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    let year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    let month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    
    // Get previous month (the month that just ended)
    const targetMonth = month - 1 <= 0 ? 12 : month - 1;
    const targetYear = month - 1 <= 0 ? year - 1 : year;

    // If not the first day of month, check if badges already exist
    if (!isFirstDayOfMonth) {
      const existingBadgesResult = await db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM member_badges
          WHERE month = ? AND year = ?
        `,
        args: [targetMonth, targetYear],
      });
      const existingCount = Number(existingBadgesResult.rows[0]?.count || 0);
      
      if (existingCount > 0) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `Badges for ${targetMonth}/${targetYear} already exist. Skipping calculation.`,
          month: targetMonth,
          year: targetYear,
          existing_badges_count: existingCount,
        });
      }
    }

    const monthStart = getMonthStart(targetYear, targetMonth);
    const monthEnd = getMonthEnd(targetYear, targetMonth);

    // Get all games in this month
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
      return NextResponse.json({
        success: true,
        message: `No games found for ${targetMonth}/${targetYear}, skipping badge calculation`,
        month: targetMonth,
        year: targetYear,
      });
    }

    // Get all members who participated in games this month
    const membersResult = await db.execute({
      sql: `
        SELECT DISTINCT m.id, m.name
        FROM members m
        INNER JOIN game_members gm ON m.id = gm.member_id
        INNER JOIN games g ON gm.game_id = g.id
        WHERE g.date >= ? AND g.date <= ?
      `,
      args: [monthStart, monthEnd],
    });

    const members = membersResult.rows.map((row: any) => ({
      id: Number(row.id),
      name: String(row.name),
    }));

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No members participated in ${targetMonth}/${targetYear}`,
        month: targetMonth,
        year: targetYear,
      });
    }

    // Calculate badges for each member and save to database
    const badgesCalculated = [];
    const badgesToInsert = [];
    
    for (const member of members) {
      // Get member's games attended
      const memberGamesResult = await db.execute({
        sql: `
          SELECT COUNT(DISTINCT gm.game_id) as games_attended
          FROM game_members gm
          INNER JOIN games g ON gm.game_id = g.id
          WHERE gm.member_id = ? AND g.date >= ? AND g.date <= ?
        `,
        args: [member.id, monthStart, monthEnd],
      });
      const gamesAttended = Number(memberGamesResult.rows[0]?.games_attended || 0);
      const participationRate = totalGames > 0 ? (gamesAttended / totalGames) * 100 : 0;

      // Get all members with their participation for ranking
      const allMembersResult = await db.execute({
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

      const allMembers = allMembersResult.rows.map((row: any) => ({
        id: Number(row.id),
        games_attended: Number(row.games_attended || 0),
      }));

      const membersWithRates = allMembers.map(m => ({
        ...m,
        participation_rate: totalGames > 0 ? (m.games_attended / totalGames) * 100 : 0,
      }));

      membersWithRates.sort((a, b) => {
        if (b.participation_rate !== a.participation_rate) {
          return b.participation_rate - a.participation_rate;
        }
        return b.games_attended - a.games_attended;
      });

      const memberIndex = membersWithRates.findIndex(m => m.id === member.id);
      const rank = memberIndex >= 0 ? memberIndex + 1 : null;

      const participationRateRounded = Math.round(participationRate * 100) / 100;

      badgesCalculated.push({
        member_id: member.id,
        member_name: member.name,
        month: targetMonth,
        year: targetYear,
        participation_rate: participationRateRounded,
        rank,
        games_attended: gamesAttended,
        total_games: totalGames,
      });

      // Prepare for database insertion
      badgesToInsert.push({
        member_id: member.id,
        month: targetMonth,
        year: targetYear,
        participation_rate: participationRateRounded,
        rank: rank || null,
        games_attended: gamesAttended,
        total_games: totalGames,
      });
    }

    // Insert badges into database (using INSERT OR IGNORE to handle duplicates)
    for (const badge of badgesToInsert) {
      try {
        await db.execute({
          sql: `
            INSERT OR REPLACE INTO member_badges 
            (member_id, month, year, participation_rate, rank, games_attended, total_games)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            badge.member_id,
            badge.month,
            badge.year,
            badge.participation_rate,
            badge.rank,
            badge.games_attended,
            badge.total_games,
          ],
        });
      } catch (error: any) {
        console.error(`Error inserting badge for member ${badge.member_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Badges calculated and saved for ${targetMonth}/${targetYear}`,
      month: targetMonth,
      year: targetYear,
      is_first_day: isFirstDayOfMonth,
      badges_calculated: badgesCalculated.length,
      badges: badgesCalculated,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

