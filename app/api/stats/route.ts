import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { calculateMemberBalance } from '@/lib/utils';

export async function GET() {
  try {
    // Calculate total fund: all deposits - all paid payments from members
    let totalDeposits = 0;
    let totalPaidPayments = 0;
    
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

    try {
      // Sum of paid payments from members (not from club fund)
      const paidPaymentsResult = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM need_payments 
        WHERE member_id IS NOT NULL AND is_paid = 1
      `);
      totalPaidPayments = Number(paidPaymentsResult.rows[0]?.total || 0);
    } catch (error: any) {
      // If need_payments table doesn't exist, return 0
      if (!error.message?.includes('no such table') && !error.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Calculate club fund: donations - payments paid from club fund
    let clubFundDonations = 0;
    let clubFundPayments = 0;
    try {
      const clubDonationsResult = await db.execute(
        'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE member_id IS NULL'
      );
      clubFundDonations = Number(clubDonationsResult.rows[0]?.total || 0);
    } catch (error: any) {
      // Ignore errors
    }

    try {
      const clubPaymentsResult = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM need_payments 
        WHERE paid_from_club_fund = 1 AND is_paid = 1
      `);
      clubFundPayments = Number(clubPaymentsResult.rows[0]?.total || 0);
    } catch (error: any) {
      // Ignore errors
    }

    const clubFund = clubFundDonations - clubFundPayments;
    const totalFund = totalDeposits - totalPaidPayments;

    // Get all members with balance calculation
    let members: Array<{ id: number; name: string; balance: number; created_at: string }> = [];
    
    try {
      const membersResult = await db.execute('SELECT * FROM members ORDER BY name');
      members = membersResult.rows.map((row: any) => ({
        id: Number(row.id),
        name: String(row.name),
        balance: Number(row.balance),
        created_at: String(row.created_at),
      }));

      // Calculate actual balance for each member
      for (const member of members) {
        try {
          member.balance = await calculateMemberBalance(member.id, db);
        } catch (error: any) {
          // If calculation fails, use 0
          console.error(`Error calculating balance for member ${member.id}:`, error);
          member.balance = 0;
        }
      }
    } catch (error: any) {
      // If members table doesn't exist, use empty array
      if (!error.message?.includes('no such table') && !error.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Filter members with balance < 100,000
    const lowBalanceMembers = members.filter((member) => member.balance < 100000);

    return NextResponse.json({
      totalFund,
      clubFund,
      lowBalanceMembers: lowBalanceMembers.map((m) => ({
        id: m.id,
        name: m.name,
        balance: m.balance,
      })),
    });
  } catch (error: any) {
    // If table doesn't exist, try to initialize
    if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      try {
        await initDatabase();
        return NextResponse.json({
          totalFund: 0,
          lowBalanceMembers: [],
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

