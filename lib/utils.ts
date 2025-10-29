// Helper function to calculate member balance
export async function calculateMemberBalance(
  memberId: number,
  db: any
): Promise<number> {
  // Get all deposits
  const deposits = await db.execute({
    sql: 'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE member_id = ?',
    args: [memberId],
  });
  const totalDeposits = deposits.rows[0]?.total || 0;

  // Get all payments from games (deducted from balance)
  const payments = await db.execute({
    sql: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM need_payments 
      WHERE member_id = ? AND is_paid = 1
    `,
    args: [memberId],
  });
  const totalPayments = payments.rows[0]?.total || 0;

  // Get all payment covers (amount members covered for guests)
  let totalCovers = 0;
  try {
    const covers = await db.execute({
      sql: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payment_covers 
        WHERE member_id = ?
      `,
      args: [memberId],
    });
    totalCovers = Number(covers.rows[0]?.total || 0);
  } catch (e: any) {
    // Table might not exist yet, ignore
  }

  return Number(totalDeposits) - Number(totalPayments) - totalCovers;
}

