import fs from 'node:fs';

const [, , messageFile, source] = process.argv;

if (!messageFile || !fs.existsSync(messageFile)) {
  process.exit(0);
}

// Preserve merge/squash generated commit messages.
if (source === 'merge' || source === 'squash') {
  process.exit(0);
}

const raw = fs.readFileSync(messageFile, 'utf8');
if (!raw.trim()) {
  process.exit(0);
}

const lines = raw.split(/\r?\n/);
const header = lines[0] ?? '';

// Accept either gitmoji code (:sparkles:) or a non-ASCII emoji-like prefix.
const hasGitmojiCode = /^:[a-z0-9_+-]+:\s/.test(header);
const hasEmojiPrefix = /^[^\x00-\x7F]+\s/.test(header);

if (hasGitmojiCode || hasEmojiPrefix) {
  process.exit(0);
}

lines[0] = `:sparkles: ${header}`;
fs.writeFileSync(messageFile, lines.join('\n'));
