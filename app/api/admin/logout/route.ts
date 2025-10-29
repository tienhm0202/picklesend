import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear admin cookie
  response.cookies.delete('admin');
  return response;
}

