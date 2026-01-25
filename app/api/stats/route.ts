import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { calculateClubFundBalance } from '@/lib/utils';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Calculate club fund: all deposits - all game costs
    const clubFundBalance = await calculateClubFundBalance(db);

    // Get total deposits
    let totalDeposits = 0;
    try {
      const depositsResult = await db.execute(
        'SELECT COALESCE(SUM(amount), 0) as total FROM deposits'
      );
      totalDeposits = Number(depositsResult.rows[0]?.total || 0);
    } catch (error: any) {
      // If deposits table doesn't exist, return 0
      if (!error.message?.includes('no such table') && !error.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Get total game costs
    // Sum expenses for games that have them, and amount_san + amount_water for games that don't
    let totalGameCosts = 0;
    try {
      // Get total from expenses table (for games that have expenses)
      let expensesTotal = 0;
      try {
        const expensesResult = await db.execute(
          'SELECT COALESCE(SUM(amount), 0) as total FROM game_expenses'
        );
        expensesTotal = Number(expensesResult.rows[0]?.total || 0);
      } catch (e: any) {
        // Expenses table might not exist yet, continue with games table
      }
      
      // For games without expenses (old games), use amount_san + amount_water
      // We only count games that don't have any expenses
      let gamesWithoutExpensesTotal = 0;
      try {
        const gamesWithoutExpensesResult = await db.execute(
          `SELECT COALESCE(SUM(amount_san + amount_water), 0) as total 
           FROM games 
           WHERE id NOT IN (SELECT DISTINCT game_id FROM game_expenses)`
        );
        gamesWithoutExpensesTotal = Number(gamesWithoutExpensesResult.rows[0]?.total || 0);
      } catch (e: any) {
        // If the query fails (e.g., expenses table doesn't exist), fall back to all games
        const gamesResult = await db.execute(
          'SELECT COALESCE(SUM(amount_san + amount_water), 0) as total FROM games'
        );
        gamesWithoutExpensesTotal = Number(gamesResult.rows[0]?.total || 0);
      }
      
      totalGameCosts = expensesTotal + gamesWithoutExpensesTotal;
    } catch (error: any) {
      // If games table doesn't exist, return 0
      if (!error.message?.includes('no such table') && !error.message?.includes('does not exist')) {
        throw error;
      }
    }

    return NextResponse.json({
      clubFund: clubFundBalance,
      totalDeposits,
      totalGameCosts,
      isLowFund: clubFundBalance < 100000,
      isEmptyFund: clubFundBalance <= 0,
    });
  } catch (error: any) {
    // If table doesn't exist, try to initialize
    if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      try {
        await initDatabase();
        return NextResponse.json({
          clubFund: 0,
          totalDeposits: 0,
          totalGameCosts: 0,
          isLowFund: true,
          isEmptyFund: true,
        });
      } catch (initError: any) {
        console.error('Database initialization error:', initError);
        return NextResponse.json(
          { 
            error: `Database initialization failed: ${initError.message}`,
            details: initError.stack 
          },
          { status: 500 }
        );
      }
    }
    
    console.error('Stats API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        details: error.stack 
      },
      { status: 500 }
    );
  }
}
