/**
 * Start script for Render:
 * 1) prisma migrate deploy
 * 2) if DB already had schema without history (P3005), baseline existing migrations
 * 3) npm run start:prod
 */
import { execSync } from 'node:child_process';

const MIGRATIONS = [
  '20260730233000_sync_schema_with_prisma_app',
  '20260802153000_admin_roles_support',
  '20260802162000_order_form_fields',
  '20260802190000_reviews_and_profiles',
  '20260802223000_item_categories_array',
  '20260802230000_user_last_seen',
];

function run(cmd, { inherit = true } = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, {
    stdio: inherit ? 'inherit' : ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: process.env,
  });
}

function migrateDeploy() {
  try {
    run('npx prisma migrate deploy');
    return { ok: true };
  } catch (error) {
    const output = [
      error?.stdout?.toString?.() ?? '',
      error?.stderr?.toString?.() ?? '',
      error?.message ?? '',
    ].join('\n');
    return { ok: false, output };
  }
}

function baselineExisting() {
  console.log('P3005: banco já tem schema. Marcando migrations existentes como applied...');
  for (const name of MIGRATIONS) {
    try {
      run(`npx prisma migrate resolve --applied "${name}"`);
    } catch {
      console.log(`(ok) ${name} já estava marcada ou não pôde ser reaplicada`);
    }
  }
}

const first = migrateDeploy();
if (!first.ok) {
  if (first.output.includes('P3005')) {
    baselineExisting();
    const second = migrateDeploy();
    if (!second.ok) {
      console.error(second.output);
      process.exit(1);
    }
  } else {
    console.error(first.output);
    process.exit(1);
  }
}

run('npm run start:prod');
