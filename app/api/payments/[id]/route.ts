import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_paid } = await request.json();
    const id = parseInt(params.id);

    await db.execute({
      sql: 'UPDATE need_payments SET is_paid = ? WHERE id = ?',
      args: [is_paid ? 1 : 0, id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

