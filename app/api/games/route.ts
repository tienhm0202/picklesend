import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentDateUTC7, calculateClubFundBalance } from '@/lib/utils';

interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  created_at: string;
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
    const { date, note, amount_san, amount_water } = await request.json();
    
    // Use current date in UTC+7 if not provided
    const gameDate = date || getCurrentDateUTC7();
    
    if (amount_san === null || amount_san === undefined || amount_water === null || amount_water === undefined) {
      return NextResponse.json(
        { error: 'amount_san and amount_water are required' },
        { status: 400 }
      );
    }

    if (amount_san < 0 || amount_water < 0) {
      return NextResponse.json(
        { error: 'Amounts cannot be negative' },
        { status: 400 }
      );
    }

    const totalAmount = amount_san + amount_water;

    // Check if club fund has enough balance
    const clubFundBalance = await calculateClubFundBalance(db);
    
    if (clubFundBalance < totalAmount) {
      return NextResponse.json(
        { 
          error: 'Quỹ CLB không đủ tiền',
          clubFundBalance,
          requiredAmount: totalAmount,
          shortfall: totalAmount - clubFundBalance
        },
        { status: 400 }
      );
    }

    // Create game - automatically deducts from club fund
    const gameResult = await db.execute({
      sql: 'INSERT INTO games (date, note, amount_san, amount_water) VALUES (?, ?, ?, ?)',
      args: [gameDate, note || '', amount_san, amount_water],
    });

    const gameId = Number(gameResult.lastInsertRowid);

    return NextResponse.json({
      id: gameId,
      date: gameDate,
      note: note || '',
      amount_san,
      amount_water,
      total_amount: totalAmount,
      club_fund_balance: clubFundBalance - totalAmount,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

