import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';
import { describeConnection, closeDatabase, initialiseDatabase } from './db/data-source';

async function main() {
  await initialiseDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    const engine = env.aiEnabled
      ? `Claude (${env.AI_PLANNING_MODEL})`
      : 'offline planning engine';

    console.log('');
    console.log('  BuildFlow API');
    console.log(`  ▸ http://localhost:${env.PORT}/api`);
    console.log(`  ▸ database   ${describeConnection()}`);
    console.log(`  ▸ ai engine  ${engine}`);
    if (!env.aiEnabled) {
      console.log('               set ANTHROPIC_API_KEY to use Claude instead');
    }
    console.log('');
  });

  // Let in-flight requests finish before dropping the DB connection, so a
  // restart during a generate call doesn't leave a half-written plan.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('\n✖ Failed to start BuildFlow API\n');
  console.error(error);
  process.exit(1);
});
