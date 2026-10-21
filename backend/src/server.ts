import { createApp } from './app';
import { config } from './core/config';
import { initDatabase } from './core/database';

async function bootstrap() {
  try {
    // 1. Initialize Pluggable Database (SQLite or Postgres based on config / .env)
    const db = await initDatabase();
    console.log(`🗄️  Active Database Engine: ${db.type.toUpperCase()}`);

    // 2. Initialize App and mount battery apps
    const app = await createApp();

    // 3. Start HTTP Server
    app.listen(config.port, () => {
      console.log(`🚀 Rift ERP Backend running on http://localhost:${config.port}`);
      console.log(`📡 REST API base prefix: ${config.apiPrefix}`);
      console.log(`🔌 Battery Apps registered: auth, pos, orders, kitchen, tables, reservations, delivery, recipes, menu, inventory, suppliers\n`);
    });
  } catch (error) {
    console.error('Fatal error starting Rift backend server:', error);
    process.exit(1);
  }
}

bootstrap();
