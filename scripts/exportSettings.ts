// Exports system_settings to an idempotent SQL file (upsert by key) to load into another environment.
// Read-only against the source DB (DATABASE_URL). The file contains secrets in plain text: never commit it,
// move it over a trusted channel and delete it after loading. Values are never printed to the console.
// Usage: npx tsx scripts/exportSettings.ts [output.sql]
//   Load:  psql "$PROD_DATABASE_URL" -f output.sql
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { prisma } from '../src/shared/infrastructure/database';

const lit = (v: string | null) => (v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`);

async function main() {
    const out = process.argv[2] ?? 'settings-export.sql';
    const rows = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });

    const lines = rows.map((r) => {
        const json = r.value === null ? 'NULL' : `${lit(JSON.stringify(r.value))}::jsonb`;
        return `  (${lit(r.key)}, ${lit(r.group)}, ${json}, ${lit(r.value_type)}, ${r.is_secret}, ${lit(r.description)})`;
    });

    const sql = [
        '-- system_settings export. CONTAINS SECRETS IN PLAIN TEXT: do not commit, delete after loading.',
        'BEGIN;',
        'INSERT INTO system_settings (key, "group", value, value_type, is_secret, description) VALUES',
        lines.join(',\n'),
        'ON CONFLICT (key) DO UPDATE SET',
        '  "group" = EXCLUDED."group", value = EXCLUDED.value, value_type = EXCLUDED.value_type,',
        '  is_secret = EXCLUDED.is_secret, description = EXCLUDED.description, updated_at = now();',
        'COMMIT;',
        '',
    ].join('\n');

    writeFileSync(out, sql, { mode: 0o600 });
    console.log(`${rows.length} setting(s) (${rows.filter((r) => r.is_secret).length} secret) written to ${out}`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); }).finally(() => prisma.$disconnect());
