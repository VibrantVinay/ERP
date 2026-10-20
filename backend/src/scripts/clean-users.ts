import { initDatabase, getDb } from '../core/database';
import { authService, SEED_PERSONAS } from '../apps/auth/service';

async function cleanUsers() {
  console.log('\n🧹 --- RIFT ERP: Clean & Reset Users ---');
  await initDatabase();
  const db = getDb();

  console.log(`[Cleaner] Truncating/Resetting users table in ${db.type.toUpperCase()}...`);
  await db.execute('DELETE FROM users');

  console.log('[Cleaner] Re-seeding default restaurant staff personas...');
  await authService.initDatabaseSchema();

  const users = await db.query('SELECT id, name, email, role, pin, active_branch FROM users');
  console.log('\n✅ Successfully cleaned and restored default restaurant users:');
  console.table(users);
  console.log('--------------------------------------------------\n');
  process.exit(0);
}

cleanUsers().catch(err => {
  console.error('Error cleaning users:', err);
  process.exit(1);
});

