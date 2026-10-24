// Runs every tests/**/*.test.ts with node:test through tsx.
// Node 20 does not expand globs, so the files are collected here.
// --test-force-exit: importing the BullMQ queues opens a Redis connection that would keep the process alive.
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = 'tests';

function collect(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return collect(path);
        return path.endsWith('.test.ts') ? [relative(process.cwd(), path)] : [];
    });
}

const files = collect(ROOT);
if (files.length === 0) {
    console.log(`No test files found under ${ROOT}/`);
    process.exit(0);
}

const { status } = spawnSync('npx', ['tsx', '--test', '--test-force-exit', ...files], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'test' },
});
process.exit(status ?? 1);
