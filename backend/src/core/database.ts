import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Pool, PoolConfig } from 'pg';
import { config, DatabaseType } from './config';

export interface DatabaseAdapter {
  type: DatabaseType;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number; lastInsertRowid?: number | bigint }>;
  close(): Promise<void>;
}

class SqliteAdapter implements DatabaseAdapter {
  public type: DatabaseType = 'sqlite';
  private db: Database.Database;

  constructor(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    console.log(`[Database] Connected to SQLite database at: ${filePath}`);
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; lastInsertRowid?: number | bigint }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      affectedRows: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  public async close(): Promise<void> {
    this.db.close();
    console.log('[Database] SQLite database connection closed.');
  }
}

class PostgresAdapter implements DatabaseAdapter {
  public type: DatabaseType = 'postgres';
  private pool: Pool;

  constructor(pgConfig: typeof config.db.postgres) {
    const poolConfig: PoolConfig = pgConfig.connectionString
      ? {
          connectionString: pgConfig.connectionString,
          ssl: pgConfig.ssl ? { rejectUnauthorized: false } : undefined,
        }
      : {
          host: pgConfig.host,
          port: pgConfig.port,
          user: pgConfig.user,
          password: pgConfig.password,
          database: pgConfig.database,
          ssl: pgConfig.ssl ? { rejectUnauthorized: false } : undefined,
        };

    this.pool = new Pool(poolConfig);
    console.log(
      `[Database] Connected to PostgreSQL pool (${
        pgConfig.connectionString ? 'via Connection URI' : `${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`
      })`
    );
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // Normalize parameter syntax if needed ($1, $2)
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  public async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; lastInsertRowid?: number | bigint }> {
    const result = await this.pool.query(sql, params);
    return {
      affectedRows: result.rowCount || 0,
    };
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('[Database] PostgreSQL pool drained and closed.');
  }
}

let activeDb: DatabaseAdapter | null = null;

export function getDb(): DatabaseAdapter {
  if (!activeDb) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return activeDb;
}

export async function initDatabase(): Promise<DatabaseAdapter> {
  if (activeDb) {
    return activeDb;
  }

  const dbType = config.db.type;

  if (dbType === 'sqlite') {
    activeDb = new SqliteAdapter(config.db.sqlite.filePath);
  } else if (dbType === 'postgres') {
    activeDb = new PostgresAdapter(config.db.postgres);
  } else {
    throw new Error(`Unsupported database type: ${dbType}`);
  }

  // Bootstrap initial base tables
  await bootstrapBaseTables(activeDb);

  return activeDb;
}

async function bootstrapBaseTables(db: DatabaseAdapter): Promise<void> {
  const isSqlite = db.type === 'sqlite';

  const createMetaTable = isSqlite
    ? `CREATE TABLE IF NOT EXISTS system_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS system_meta (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`;

  await db.execute(createMetaTable);
}

