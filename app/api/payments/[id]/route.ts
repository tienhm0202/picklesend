import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_paid, paid_from_club_fund } = await request.json();
    const id = parseInt(params.id);

    // Get payment details to check if it's a guest payment
    const paymentResult = await db.execute({
      sql: 'SELECT guest_id, member_id FROM need_payments WHERE id = ?',
      args: [id],
    });

    if (paymentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = paymentResult.rows[0] as any;
    const isGuestPayment = payment.guest_id !== null;

    // Only allow paid_from_club_fund for guest payments
    let finalPaidFromClubFund = 0;
    if (isGuestPayment && paid_from_club_fund && is_paid) {
      finalPaidFromClubFund = 1;
    }

    await db.execute({
      sql: 'UPDATE need_payments SET is_paid = ?, paid_from_club_fund = ? WHERE id = ?',
      args: [is_paid ? 1 : 0, finalPaidFromClubFund, id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

