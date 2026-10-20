import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export type DatabaseType = 'sqlite' | 'postgres';

export interface DatabaseConfig {
  /** 'sqlite' for local development or 'postgres' for cloud/external production */
  type: DatabaseType;
  sqlite: {
    filePath: string;
  };
  postgres: {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
  };
}

export const dbConfig: DatabaseConfig = {
  // Toggle active database driver here or via process.env.DB_TYPE
  type: (process.env.DB_TYPE as DatabaseType) || 'sqlite',

  sqlite: {
    filePath: process.env.SQLITE_PATH || path.resolve(__dirname, '../../data/rift.sqlite'),
  },

  postgres: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rift_erp',
    ssl: process.env.DB_SSL === 'true',
  },
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'rift-erp-dev-secret-key-change-in-prod',
  apiPrefix: '/api/v1',
  db: dbConfig,
};
