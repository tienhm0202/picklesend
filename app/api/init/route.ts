import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';

export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

