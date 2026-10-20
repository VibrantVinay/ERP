import { createApp } from './app';
import { config } from './core/config';

async function bootstrap() {
  try {
    const app = await createApp();
    app.listen(config.port, () => {
      console.log(`🚀 Rift ERP Backend running on http://localhost:${config.port}`);
      console.log(`📡 REST API base prefix: ${config.apiPrefix}`);
      console.log(`🔌 Battery Apps registered: pos, orders, kitchen, tables, menu, inventory, auth\n`);
    });
  } catch (error) {
    console.error('Fatal error starting Rift backend server:', error);
    process.exit(1);
  }
}

bootstrap();

