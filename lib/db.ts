import { createClient } from '@libsql/client';

const url = 'libsql://picklespend-tienhm.aws-ap-northeast-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;
// const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjE3MzA2ODEsImlkIjoiMjYxMjA0YTgtZmQ5ZS00Y2ZlLTgyYzAtNGI3OWMzNTVkNjM2IiwicmlkIjoiYmYzMDI3OGEtNzMyNy00NWQxLWFhZWEtNzIxMTRhY2UwNGJlIn0.TkBUeQYuBmu_eRIGoPp51JWsrql5TQAY2_y6mgvxLUTmAevQhLaja6UJIeYl6OoxJOGOy-FltOE2rf2tWSxBDg";

export const db = createClient({
  url,
  authToken: authToken || undefined,
});

// Database schema types
export interface Member {
  id: number;
  name: string;
  balance: number; // Calculated from deposits and games
  created_at: string;
}

export interface Guest {
  id: number;
  name: string;
  created_at: string;
}

export interface Deposit {
  id: number;
  member_id: number;
  date: string;
  amount: number;
  created_at: string;
}

export interface Game {
  id: number;
  date: string;
  note: string;
  amount_san: number;
  amount_water: number;
  created_at: string;
}

export interface GameMember {
  id: number;
  game_id: number;
  member_id: number;
  created_at: string;
}

export interface GameGuest {
  id: number;
  game_id: number;
  guest_id: number;
  created_at: string;
}

export interface NeedPayment {
  id: number;
  game_id: number;
  guest_id: number | null;
  member_id: number | null;
  amount: number;
  is_paid: boolean;
  created_at: string;
}

// Initialize database schema
export async function initDatabase() {
  // Create Members table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      color TEXT,
      letter TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add color and letter columns if they don't exist (for existing databases)
  try {
    await db.execute(`ALTER TABLE members ADD COLUMN color TEXT`);
  } catch (e: any) {
    // Column already exists, ignore
  }
  
  try {
    await db.execute(`ALTER TABLE members ADD COLUMN letter TEXT`);
  } catch (e: any) {
    // Column already exists, ignore
  }

  // Create Guests table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Deposits table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id)
    )
  `);

  // Create Games table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      note TEXT,
      amount_san REAL NOT NULL,
      amount_water REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Game Members table (many-to-many)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(game_id, member_id)
    )
  `);

  // Create Game Guests table (many-to-many)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      guest_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (guest_id) REFERENCES guests(id),
      UNIQUE(game_id, guest_id)
    )
  `);

  // Create Need Payments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS need_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      guest_id INTEGER,
      member_id INTEGER,
      amount REAL NOT NULL,
      is_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (guest_id) REFERENCES guests(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      CHECK ((guest_id IS NOT NULL AND member_id IS NULL) OR (guest_id IS NULL AND member_id IS NOT NULL))
    )
  `);
}

