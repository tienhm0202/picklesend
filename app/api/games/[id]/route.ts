import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
    }

    const { date, note, expenses } = await request.json();

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập ít nhất một chi phí' },
        { status: 400 }
      );
    }

    const expensesToSave: Array<{ name: string; amount: number }> = [];
    let totalAmount = 0;

    for (const expense of expenses) {
      if (!expense.name || String(expense.name).trim() === '') {
        return NextResponse.json(
          { error: 'Tên chi phí không được để trống' },
          { status: 400 }
        );
      }
      const amount = typeof expense.amount === 'string'
        ? parseFloat(String(expense.amount).replace(/,/g, ''))
        : Number(expense.amount);
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json(
          { error: 'Số tiền không hợp lệ' },
          { status: 400 }
        );
      }
      expensesToSave.push({ name: String(expense.name).trim(), amount });
      totalAmount += amount;
    }

    const sanExpense = expensesToSave.find(e => e.name.toLowerCase().includes('sân'));
    const waterExpense = expensesToSave.find(e => e.name.toLowerCase().includes('nước'));
    const amountSan = sanExpense ? sanExpense.amount : 0;
    const amountWater = waterExpense ? waterExpense.amount : 0;

    const gameDate = date || null;
    const gameNote = note ?? '';

    // Ensure game exists
    const existing = await db.execute({
      sql: 'SELECT id FROM games WHERE id = ?',
      args: [id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Game không tồn tại' }, { status: 404 });
    }

    // Update game
    if (gameDate) {
      await db.execute({
        sql: 'UPDATE games SET date = ?, note = ?, amount_san = ?, amount_water = ? WHERE id = ?',
        args: [gameDate, gameNote, amountSan, amountWater, id],
      });
    } else {
      await db.execute({
        sql: 'UPDATE games SET note = ?, amount_san = ?, amount_water = ? WHERE id = ?',
        args: [gameNote, amountSan, amountWater, id],
      });
    }

    // Replace expenses: delete old, insert new
    await db.execute({
      sql: 'DELETE FROM game_expenses WHERE game_id = ?',
      args: [id],
    });
    for (const expense of expensesToSave) {
      await db.execute({
        sql: 'INSERT INTO game_expenses (game_id, name, amount) VALUES (?, ?, ?)',
        args: [id, expense.name, expense.amount],
      });
    }

    const expensesResult = await db.execute({
      sql: 'SELECT * FROM game_expenses WHERE game_id = ? ORDER BY id',
      args: [id],
    });
    const updatedExpenses = expensesResult.rows.map((row: any) => ({
      id: Number(row.id),
      game_id: Number(row.game_id),
      name: String(row.name),
      amount: Number(row.amount),
      created_at: String(row.created_at),
    }));

    const gameRow = await db.execute({
      sql: 'SELECT date, note FROM games WHERE id = ?',
      args: [id],
    });
    const final = (gameRow.rows[0] as any) || {};

    return NextResponse.json({
      id,
      date: final.date,
      note: gameNote,
      amount_san: amountSan,
      amount_water: amountWater,
      expenses: updatedExpenses,
      total_amount: totalAmount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Delete related records first
    // Clean up old need_payments data if exists (for backward compatibility)
    try {
      await db.execute({
        sql: 'DELETE FROM need_payments WHERE game_id = ?',
        args: [id],
      });
    } catch (e: any) {
      // Ignore if table doesn't exist or no records
    }
    
    // Clean up old game_members data if exists (for backward compatibility)
    try {
      await db.execute({
        sql: 'DELETE FROM game_members WHERE game_id = ?',
        args: [id],
      });
    } catch (e: any) {
      // Ignore if table doesn't exist or no records
    }
    
    // Delete the game
    await db.execute({
      sql: 'DELETE FROM games WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

