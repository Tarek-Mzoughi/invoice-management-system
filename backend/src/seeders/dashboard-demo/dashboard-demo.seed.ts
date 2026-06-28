/**
 * Dashboard Demo Seed
 * ===================
 * Creates realistic business data for the Invoicing System dashboard.
 *
 * Usage:
 *   ALLOW_DEMO_SEED=true yarn seed:dashboard-demo
 *   ALLOW_DEMO_SEED=true yarn seed:dashboard-demo --reset
 *
 * Safety:
 *   - Blocked if NODE_ENV === 'production'
 *   - Blocked if ALLOW_DEMO_SEED !== 'true'
 *   - All demo data uses 'DEMO-' prefixed references / names
 *   - --reset only deletes rows with DEMO- prefix
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDemoDataSource } from './seed-datasource';
import { seedDashboardDemo } from './seed-runner';
import { resetDemoData } from './seed-reset';

// ─── Safety guards ───────────────────────────────────────────────────────────
function assertSafeEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '\x1b[31m✖ Dashboard demo seed is disabled in production.\x1b[0m',
    );
    process.exit(1);
  }
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    console.error(
      '\x1b[31m✖ Set ALLOW_DEMO_SEED=true to run this development seed.\x1b[0m',
    );
    process.exit(1);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  assertSafeEnvironment();

  const isReset = process.argv.includes('--reset');
  let dataSource: DataSource | undefined;

  try {
    dataSource = buildDemoDataSource();
    await dataSource.initialize();
    console.log('✔ Database connected');

    if (isReset) {
      await resetDemoData(dataSource);
    } else {
      await resetDemoData(dataSource);
      await seedDashboardDemo(dataSource);
    }
  } catch (error) {
    console.error('\x1b[31m✖ Seed failed:\x1b[0m', error);
    process.exit(1);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('✔ Database connection closed');
    }
  }
}

main();
