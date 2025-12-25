// Timezone utilities for UTC+7 (Asia/Ho_Chi_Minh)
export function getCurrentDateUTC7(): string {
  const now = new Date();
  // Get current date in UTC+7 timezone
  const utc7Date = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const year = utc7Date.getFullYear();
  const month = String(utc7Date.getMonth() + 1).padStart(2, '0');
  const day = String(utc7Date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentDateTimeUTC7(): string {
  const now = new Date();
  // Get current datetime in UTC+7 timezone
  return now.toLocaleString('en-US', { 
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatDateUTC7(dateString: string): string {
  // If dateString is already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Parse date and format in UTC+7
  const date = new Date(dateString);
  const utc7Date = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const year = utc7Date.getFullYear();
  const month = String(utc7Date.getMonth() + 1).padStart(2, '0');
  const day = String(utc7Date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeUTC7(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function formatDateDisplayUTC7(dateString: string): string {
  // Format date for display in Vietnamese locale with UTC+7
  const date = new Date(dateString + 'T00:00:00+07:00');
  return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// Calculate club fund balance: total deposits - total game costs
export async function calculateClubFundBalance(db: any): Promise<number> {
  // Get all deposits (all go to club fund)
  let totalDeposits = 0;
  try {
    const depositsResult = await db.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM deposits'
    );
    totalDeposits = Number(depositsResult.rows[0]?.total || 0);
  } catch (e: any) {
    // Table might not exist, ignore
  }

  // Get all game costs (total amount_san + amount_water)
  let totalGameCosts = 0;
  try {
    const gamesResult = await db.execute(
      'SELECT COALESCE(SUM(amount_san + amount_water), 0) as total FROM games'
    );
    totalGameCosts = Number(gamesResult.rows[0]?.total || 0);
  } catch (e: any) {
    // Table might not exist, ignore
  }

  return totalDeposits - totalGameCosts;
}

// Format number for input display (e.g., 100000 -> "100,000")
export function formatNumberInput(value: string | number): string {
  if (!value && value !== 0) return '';
  
  // Remove all non-digit characters except decimal point
  const cleaned = String(value).replace(/[^\d.]/g, '');
  
  // Split by decimal point
  const parts = cleaned.split('.');
  const integerPart = parts[0] || '';
  const decimalPart = parts[1] ? '.' + parts[1] : '';
  
  // Format integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return formattedInteger + decimalPart;
}

// Parse formatted number string to number (e.g., "100,000" -> 100000)
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Get club name from environment variable
// Supports both server-side (CLUB_NAME) and client-side (NEXT_PUBLIC_CLUB_NAME)
export function getClubName(): string {
  return process.env.NEXT_PUBLIC_CLUB_NAME || process.env.CLUB_NAME || 'CLB 5525';
}

// Get club slogan from environment variable
// Supports both server-side (CLUB_SLOGAN) and client-side (NEXT_PUBLIC_CLUB_SLOGAN)
export function getClubSlogan(): string {
  return process.env.NEXT_PUBLIC_CLUB_SLOGAN || process.env.CLUB_SLOGAN || 'Hừng hừng khí thế';
}

