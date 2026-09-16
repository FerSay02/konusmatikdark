import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const bannedVisibleText = [
  'Userlar',
  'Paymentler',
  'Packageler',
  'Downloadme',
  'Durationsiz',
  'Yeni API Key Create',
  'Yeni Package Al',
  'Usage ozeti',
  'Key adi',
];

const sourceFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
    } else if (/\.(jsx?|tsx?|json|html)$/.test(entry.name)) {
      sourceFiles.push(filePath);
    }
  }
}

walk(srcDir);

const failures = [];

if (!/<meta\s+charset=["']UTF-8["']\s*\/?>/i.test(indexHtml)) {
  failures.push('index.html is missing <meta charset="UTF-8" />.');
}

for (const filePath of sourceFiles) {
  const relative = path.relative(root, filePath);
  if (relative === path.join('src', 'lib', 'language.js')) continue;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const phrase of bannedVisibleText) {
    if (text.includes(phrase)) failures.push(`${relative}: contains banned mixed-language text "${phrase}".`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('i18n smoke check passed.');
