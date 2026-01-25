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

    // Fetch expenses for each game
    const gamesWithExpenses = await Promise.all(
      games.map(async (game) => {
        const expensesResult = await db.execute({
          sql: 'SELECT * FROM game_expenses WHERE game_id = ? ORDER BY id',
          args: [game.id],
        });
        
        const expenses = expensesResult.rows.map((row: any) => ({
          id: Number(row.id),
          game_id: Number(row.game_id),
          name: String(row.name),
          amount: Number(row.amount),
          created_at: String(row.created_at),
        }));

        return {
          ...game,
          expenses,
        };
      })
    );

    return NextResponse.json(gamesWithExpenses);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, note, expenses, amount_san, amount_water } = await request.json();
    
    // Use current date in UTC+7 if not provided
    const gameDate = date || getCurrentDateUTC7();
    
    let totalAmount = 0;
    let expensesToSave: Array<{ name: string; amount: number }> = [];
    let amountSan = 0;
    let amountWater = 0;

    // Support new expenses array format
    if (expenses && Array.isArray(expenses) && expenses.length > 0) {
      // Validate expenses
      for (const expense of expenses) {
        if (!expense.name || expense.name.trim() === '') {
          return NextResponse.json(
            { error: 'Tên chi phí không được để trống' },
            { status: 400 }
          );
        }
        const amount = typeof expense.amount === 'string' 
          ? parseFloat(expense.amount.replace(/,/g, '')) 
          : Number(expense.amount);
        if (isNaN(amount) || amount < 0) {
          return NextResponse.json(
            { error: 'Số tiền không hợp lệ' },
            { status: 400 }
          );
        }
        expensesToSave.push({ name: expense.name.trim(), amount });
        totalAmount += amount;
      }
      
      // For backward compatibility, calculate amount_san and amount_water from expenses
      // If "Tiền sân" exists, use it; otherwise 0
      const sanExpense = expensesToSave.find(e => e.name.toLowerCase().includes('sân'));
      const waterExpense = expensesToSave.find(e => e.name.toLowerCase().includes('nước'));
      amountSan = sanExpense ? sanExpense.amount : 0;
      amountWater = waterExpense ? waterExpense.amount : 0;
    } else {
      // Backward compatibility: use amount_san and amount_water
      if (amount_san === null || amount_san === undefined || amount_water === null || amount_water === undefined) {
        return NextResponse.json(
          { error: 'Vui lòng nhập ít nhất một chi phí hoặc amount_san và amount_water' },
          { status: 400 }
        );
      }

      amountSan = Number(amount_san);
      amountWater = Number(amount_water);

      if (amountSan < 0 || amountWater < 0) {
        return NextResponse.json(
          { error: 'Amounts cannot be negative' },
          { status: 400 }
        );
      }

      totalAmount = amountSan + amountWater;
      
      // Create default expenses for backward compatibility
      expensesToSave = [
        { name: 'Tiền sân', amount: amountSan },
        { name: 'Tiền nước', amount: amountWater },
      ];
    }

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
      args: [gameDate, note || '', amountSan, amountWater],
    });

    const gameId = Number(gameResult.lastInsertRowid);

    // Insert expenses
    if (expensesToSave.length > 0) {
      for (const expense of expensesToSave) {
        await db.execute({
          sql: 'INSERT INTO game_expenses (game_id, name, amount) VALUES (?, ?, ?)',
          args: [gameId, expense.name, expense.amount],
        });
      }
    }

    // Fetch created expenses
    const expensesResult = await db.execute({
      sql: 'SELECT * FROM game_expenses WHERE game_id = ? ORDER BY id',
      args: [gameId],
    });
    
    const createdExpenses = expensesResult.rows.map((row: any) => ({
      id: Number(row.id),
      game_id: Number(row.game_id),
      name: String(row.name),
      amount: Number(row.amount),
      created_at: String(row.created_at),
    }));

    return NextResponse.json({
      id: gameId,
      date: gameDate,
      note: note || '',
      amount_san: amountSan,
      amount_water: amountWater,
      expenses: createdExpenses,
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

