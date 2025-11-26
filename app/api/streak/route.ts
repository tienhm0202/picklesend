import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentDateUTC7 } from '@/lib/utils';

// Get start of week (Monday) in UTC+7
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get week identifier (YYYY-WW format)
function getWeekId(date: Date): string {
  const startOfWeek = getStartOfWeek(date);
  const year = startOfWeek.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((startOfWeek.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

export async function GET() {
  try {
    // Get all games
    const gamesResult = await db.execute(`
      SELECT DISTINCT date FROM games ORDER BY date ASC
    `);
    
    const gameDates = gamesResult.rows.map((row: any) => String(row.date));
    
    if (gameDates.length === 0) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        totalWeeks: 0,
        weeksWithGames: new Set(),
        recentWeeks: [],
        nextMilestone: 5,
        milestoneProgress: 0,
      });
    }

    // Get unique weeks that have games
    const weeksWithGames = new Set<string>();
    gameDates.forEach((dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00+07:00');
      const weekId = getWeekId(date);
      weeksWithGames.add(weekId);
    });

    const sortedWeeks = Array.from(weeksWithGames).sort();
    const totalWeeks = sortedWeeks.length;

    // Calculate current streak (consecutive weeks from most recent)
    let currentStreak = 0;
    const today = new Date();
    
    // Start checking from the most recent week that has games
    // Go backwards week by week to find consecutive weeks
    let checkDate = new Date(today);
    let foundFirstWeek = false;
    
    for (let i = 0; i < 200; i++) { // Max 200 weeks back
      const weekId = getWeekId(checkDate);
      if (weeksWithGames.has(weekId)) {
        if (!foundFirstWeek) {
          foundFirstWeek = true;
        }
        currentStreak++;
      } else {
        // If we found at least one week and then hit a gap, streak is broken
        if (foundFirstWeek) {
          break;
        }
      }
      // Go back 7 days
      checkDate = new Date(checkDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const allWeeks = sortedWeeks;
    
    for (let i = 0; i < allWeeks.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        // Parse week IDs to compare
        const prevWeek = allWeeks[i - 1];
        const currWeek = allWeeks[i];
        
        // Simple comparison: if weeks are consecutive
        const prevParts = prevWeek.split('-W');
        const currParts = currWeek.split('-W');
        
        if (prevParts[0] === currParts[0]) {
          // Same year
          const prevWeekNum = parseInt(prevParts[1]);
          const currWeekNum = parseInt(currParts[1]);
          if (currWeekNum === prevWeekNum + 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        } else {
          // Different year - check if it's week 1 of next year
          const prevYear = parseInt(prevParts[0]);
          const currYear = parseInt(currParts[0]);
          const currWeekNum = parseInt(currParts[1]);
          
          if (currYear === prevYear + 1 && currWeekNum === 1) {
            // Check if previous week was last week of previous year
            const lastWeekOfYear = getWeeksInYear(prevYear);
            if (parseInt(prevParts[1]) === lastWeekOfYear) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Get recent weeks (last 8 weeks)
    const recentWeeks: Array<{ weekId: string; hasGame: boolean }> = [];
    let recentCheckDate = new Date(today);
    for (let i = 0; i < 8; i++) {
      const weekId = getWeekId(recentCheckDate);
      recentWeeks.unshift({
        weekId,
        hasGame: weeksWithGames.has(weekId),
      });
      recentCheckDate = new Date(recentCheckDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Calculate next milestone and progress
    const milestones = [5, 10, 15, 20, 25, 30, 50, 100];
    let nextMilestone = milestones.find(m => m > currentStreak) || 100;
    const milestoneProgress = nextMilestone > 0 ? (currentStreak / nextMilestone) * 100 : 0;

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalWeeks,
      weeksWithGames: Array.from(weeksWithGames),
      recentWeeks,
      nextMilestone,
      milestoneProgress: Math.min(milestoneProgress, 100),
    });
  } catch (error: any) {
    console.error('Streak API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

// Helper function to get number of weeks in a year
function getWeeksInYear(year: number): number {
  const dec31 = new Date(year, 11, 31);
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((dec31.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + jan1.getDay() + 1) / 7);
}

