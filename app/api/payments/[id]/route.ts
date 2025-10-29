import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_paid, paid_from_club_fund, cover_member_ids } = await request.json();
    const id = parseInt(params.id);

    // Get payment details to check if it's a guest payment
    const paymentResult = await db.execute({
      sql: 'SELECT guest_id, member_id, amount FROM need_payments WHERE id = ?',
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
    const paymentAmount = Number(payment.amount);

    if (!isGuestPayment) {
      return NextResponse.json(
        { error: 'Cover feature is only available for guest payments' },
        { status: 400 }
      );
    }

    // Delete existing covers for this payment
    try {
      await db.execute({
        sql: 'DELETE FROM payment_covers WHERE payment_id = ?',
        args: [id],
      });
    } catch (e: any) {
      // Table might not exist yet
    }

    let finalPaidFromClubFund = 0;

    if (is_paid) {
      if (cover_member_ids && Array.isArray(cover_member_ids) && cover_member_ids.length > 0) {
        // Cover by members: divide amount equally and round up
        const memberCount = cover_member_ids.length;
        const amountPerMember = Math.ceil(paymentAmount / memberCount);

        // Create cover records for each member
        for (const memberId of cover_member_ids) {
          await db.execute({
            sql: 'INSERT INTO payment_covers (payment_id, member_id, amount) VALUES (?, ?, ?)',
            args: [id, memberId, amountPerMember],
          });
        }
        finalPaidFromClubFund = 0;
      } else if (paid_from_club_fund) {
        // Cover by club fund
        finalPaidFromClubFund = 1;
      } else {
        // Regular payment (guest paid themselves)
        finalPaidFromClubFund = 0;
      }
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

