import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Testing Pricing & Checkout Removal ---');

// 1. src/seo.js text checks
const seoSource = fs.readFileSync(path.resolve('src/seo.js'), 'utf8');
const pageRoutesMatch = seoSource.match(/export const pageRoutes = \{([\s\S]*?)\};/);
assert.ok(pageRoutesMatch, 'src/seo.js should define pageRoutes');
const pageRoutesBlock = pageRoutesMatch[1];
assert.ok(!/\bpricing\s*:/.test(pageRoutesBlock), 'pageRoutes must not contain pricing key');
assert.ok(!/\bcheckout\s*:/.test(pageRoutesBlock), 'pageRoutes must not contain checkout key');
assert.ok(!/'\/fiyatlar'|"\/fiyatlar"/.test(pageRoutesBlock), 'pageRoutes must not contain /fiyatlar');
assert.ok(!/'\/checkout'|"\/checkout"/.test(pageRoutesBlock), 'pageRoutes must not contain /checkout');

const seoPagesMatch = seoSource.match(/export const seoPages = \{([\s\S]*?)\n\};/);
if (seoPagesMatch) {
  assert.ok(!/\bpricing\s*:\s*\{/.test(seoPagesMatch[1]), 'seoPages must not contain pricing entry');
}
console.log('✓ src/seo.js route and SEO checks passed');

// 2. src/App.jsx text checks
const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');
assert.ok(!/import\s+Pricing\b/.test(appSource), 'App.jsx must not import Pricing');
assert.ok(!/import\s+Checkout\b/.test(appSource), 'App.jsx must not import Checkout');
assert.ok(!/case\s+'pricing'/.test(appSource), "App.jsx must not have case 'pricing'");
assert.ok(!/case\s+'checkout'/.test(appSource), "App.jsx must not have case 'checkout'");
assert.ok(!/goToPage\(\s*'pricing'\s*\)/.test(appSource), "App.jsx must not call goToPage('pricing')");
assert.ok(!/onNavigate\(\s*'pricing'\s*\)/.test(appSource), "App.jsx must not call onNavigate('pricing')");
assert.ok(!/page\s*:\s*'pricing'/.test(appSource), "App.jsx must not have navigation target with page: 'pricing'");
assert.ok(
  appSource.includes('/fiyatlar') && appSource.includes('/checkout') && appSource.includes('replaceState'),
  'App.jsx must contain redirects with replaceState for /fiyatlar and /checkout'
);
console.log('✓ src/App.jsx imports and routing checks passed');

// 3. src/**/*.jsx navigation calls (skip Pricing.jsx and Checkout.jsx)
function getFilesRecursively(dir, extension = '.jsx') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

const jsxFiles = getFilesRecursively(path.resolve('src'), '.jsx');
const forbiddenNavPatterns = [
  /onNavigate\?\.\(\s*'pricing'\s*\)/,
  /onNavigate\(\s*'pricing'\s*\)/,
  /goToPage\(\s*'pricing'\s*\)/,
  /handleNav\([^,]+,\s*'pricing'\s*\)/,
];

for (const filePath of jsxFiles) {
  const baseName = path.basename(filePath);
  if (baseName === 'Pricing.jsx' || baseName === 'Checkout.jsx') {
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const pattern of forbiddenNavPatterns) {
    assert.ok(
      !pattern.test(content),
      `File ${path.relative('.', filePath)} must not match pricing navigation pattern: ${pattern}`
    );
  }
}
console.log('✓ No forbidden pricing navigation targets in src/**/*.jsx');

// 4. public/web.config, public/.htaccess and public/robots.txt
const webConfig = fs.readFileSync(path.resolve('public/web.config'), 'utf8');
const rulesMatch = webConfig.match(/<rules>([\s\S]*?)<\/rules>/);
assert.ok(rulesMatch, 'public/web.config must contain <rules>');
const rulesContent = rulesMatch[1];
const firstRuleMatch = rulesContent.match(/<rule\b[\s\S]*?<\/rule>/);
assert.ok(firstRuleMatch, 'public/web.config must have at least one rule');
const firstRule = firstRuleMatch[0];

assert.ok(
  /<match\s+url="\^\(fiyatlar\|checkout\)\/\?\$"/.test(firstRule),
  'public/web.config first rule must match ^(fiyatlar|checkout)/?$'
);
assert.ok(
  /<action\s+type="Redirect"\s+url="\/"\s+redirectType="Permanent"\s*\/>/.test(firstRule),
  'public/web.config first rule action must be a Permanent Redirect to /'
);

const firstRuleIdx = webConfig.indexOf(firstRule);
const unknownRoutesIdx = webConfig.indexOf('name="Unknown Routes"');
assert.ok(unknownRoutesIdx !== -1, 'public/web.config must contain "Unknown Routes" rule');
assert.ok(firstRuleIdx < unknownRoutesIdx, 'public/web.config redirect rule must be placed before "Unknown Routes"');

const remainingRules = rulesContent.slice(firstRuleMatch.index + firstRule.length);
assert.ok(!/fiyatlar/i.test(remainingRules), 'No other rule in public/web.config should mention "fiyatlar"');
assert.ok(!/checkout/i.test(remainingRules), 'No other rule in public/web.config should mention "checkout"');

const htaccess = fs.readFileSync(path.resolve('public/.htaccess'), 'utf8');
const rewriteBaseIdx = htaccess.indexOf('RewriteBase /');
assert.ok(rewriteBaseIdx !== -1, 'public/.htaccess must declare RewriteBase /');
const htaccessAfterBase = htaccess.slice(rewriteBaseIdx + 'RewriteBase /'.length);
const htaccess301Match = htaccessAfterBase.match(/RewriteRule\s+\^\(fiyatlar\|checkout\)\/\?\$\s+\/\s+\[R=301,L\]/);
assert.ok(htaccess301Match, 'public/.htaccess must have RewriteRule ^(fiyatlar|checkout)/?$ / [R=301,L] right after RewriteBase /');

const rule301FullIdx = htaccess.indexOf(htaccess301Match[0]);
const firstOtherRuleIdx = htaccess.search(/RewriteRule\s+\^/);
assert.strictEqual(rule301FullIdx, firstOtherRuleIdx, '301 redirect rule must be the first RewriteRule in public/.htaccess');

const htaccessWithout301 = htaccess.replace(htaccess301Match[0], '');
assert.ok(!/fiyatlar/i.test(htaccessWithout301), 'public/.htaccess must have no other occurrences of "fiyatlar"');
assert.ok(!/checkout/i.test(htaccessWithout301), 'public/.htaccess must have no other occurrences of "checkout"');

const robotsTxt = fs.readFileSync(path.resolve('public/robots.txt'), 'utf8');
assert.ok(!/Disallow:\s*\/fiyatlar\b/.test(robotsTxt), 'public/robots.txt must NOT contain "Disallow: /fiyatlar"');
assert.ok(/Disallow:\s*\/checkout\b/.test(robotsTxt), 'public/robots.txt must contain "Disallow: /checkout"');
console.log('✓ public/web.config, public/.htaccess and public/robots.txt checks passed');

// 5. Minor checks for TTS and Profile
const ttsSource = fs.readFileSync(path.resolve('src/pages/TTS.jsx'), 'utf8');
assert.ok(!ttsSource.includes("packagePopupTarget === 'pricing'"), 'TTS.jsx must not contain dead packagePopupTarget === "pricing" code');

const profileSource = fs.readFileSync(path.resolve('src/pages/Profile.jsx'), 'utf8');
assert.ok(!profileSource.includes('Kurumsal paket satın aldıktan'), 'Profile.jsx must not imply purchasing in enterprise API key help text');
assert.ok(profileSource.includes('Kurumsal hesabınız tanımlandıktan sonra'), 'Profile.jsx must use "Kurumsal hesabınız tanımlandıktan sonra ..."');
console.log('✓ TTS and Profile minor cleanup checks passed');

// 6. scripts/seo-content.mjs
const seoContent = fs.readFileSync(path.resolve('scripts/seo-content.mjs'), 'utf8');
const appPathsMatch = seoContent.match(/const appPaths = \[([\s\S]*?)\];/);
assert.ok(appPathsMatch, 'scripts/seo-content.mjs should define appPaths');
assert.ok(!appPathsMatch[1].includes('/fiyatlar'), 'scripts/seo-content.mjs appPaths must not include /fiyatlar');
console.log('✓ scripts/seo-content.mjs appPaths checks passed');

// 7. Build artifacts if dist/ exists
const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  const distFiyatlar = path.join(distDir, 'fiyatlar');
  assert.ok(!fs.existsSync(distFiyatlar), 'dist/fiyatlar directory must not exist');

  const sitemapPath = path.join(distDir, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    assert.ok(!sitemap.includes('/fiyatlar'), 'dist/sitemap.xml must not include /fiyatlar');
  }
  console.log('✓ dist/ checks passed');
}

// 8. No buy / browse packages wording in src/**/*.jsx (skip Pricing.jsx and Checkout.jsx)
const forbiddenWordingPatterns = [
  { pattern: /satin al(?!ma\b)/i, label: 'satin al' },
  { pattern: /satın al(?!ma\b)/i, label: 'satın al' },
  { pattern: /purchase a plan/i, label: 'purchase a plan' },
  { pattern: /purchase a package/i, label: 'purchase a package' },
  { pattern: /paketleri inceleyebilirsiniz/i, label: 'Paketleri inceleyebilirsiniz' },
  { pattern: /review packages/i, label: 'review packages' },
];

for (const filePath of jsxFiles) {
  const baseName = path.basename(filePath);
  if (baseName === 'Pricing.jsx' || baseName === 'Checkout.jsx') {
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const { pattern, label } of forbiddenWordingPatterns) {
    assert.ok(
      !pattern.test(content),
      `File ${path.relative('.', filePath)} must not match purchase wording pattern: ${label}`
    );
  }
}
console.log('✓ No forbidden purchase/browse wording in src/**/*.jsx');

// 9. Required replacement wording in ASR.jsx, Profile.jsx, and TTS.jsx
const asrSource = fs.readFileSync(path.resolve('src/pages/ASR.jsx'), 'utf8');
assert.ok(
  asrSource.includes('Ek kullanım hakkı gerekiyor') && asrSource.includes('Additional usage is required'),
  'ASR.jsx must contain new wording "Ek kullanım hakkı gerekiyor" / "Additional usage is required"'
);

const profileCurrentSource = fs.readFileSync(path.resolve('src/pages/Profile.jsx'), 'utf8');
assert.ok(
  profileCurrentSource.includes('Ücretsiz haklarınızla deneyebilir, ek kullanım için bizimle iletişime geçebilirsiniz.') &&
  profileCurrentSource.includes('You can try it with your free credits, or contact us for additional usage.'),
  'Profile.jsx must contain new wording "Ücretsiz haklarınızla deneyebilir, ek kullanım için bizimle iletişime geçebilirsiniz."'
);

const ttsCurrentSource = fs.readFileSync(path.resolve('src/pages/TTS.jsx'), 'utf8');
assert.ok(
  ttsCurrentSource.includes('Yetersiz karakter hakkı. Ek kullanım için bizimle iletişime geçebilirsiniz.') &&
  ttsCurrentSource.includes('Insufficient character quota. Contact us for additional usage.'),
  'TTS.jsx must contain new wording "Yetersiz karakter hakkı. Ek kullanım için bizimle iletişime geçebilirsiniz."'
);
console.log('✓ Required replacement wording in ASR, Profile, and TTS verified');

console.log('All pricing removal checks passed successfully!');
