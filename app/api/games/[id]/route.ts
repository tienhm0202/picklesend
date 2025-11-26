import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

