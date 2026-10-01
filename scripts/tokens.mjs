import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const tokens = JSON.parse(readFileSync(new URL('design/tokens.json', root), 'utf8'));
const output = `// Generated from design/tokens.json. Run npm run tokens:generate after editing.\nexport const tokens = ${JSON.stringify(tokens, null, 2)} as const;\n`;
const target = new URL('src/theme/tokens.ts', root);
if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  if (current !== output) throw new Error('Design tokens are out of sync. Run npm run tokens:generate.');
  console.log('Design tokens match the app.');
} else {
  mkdirSync(fileURLToPath(new URL('src/theme/', root)), { recursive: true });
  writeFileSync(target, output);
  console.log('Generated src/theme/tokens.ts');
}
