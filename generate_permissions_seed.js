#!/usr/bin/env node
/* =====================================================================
 * generate_permissions_seed.js
 * ---------------------------------------------------------------------
 * SENİN gerçek config.js dosyandaki PERM objesini okur ve
 * role_permissions için 03_role_permissions_seed.sql üretir.
 *
 * AMAÇ: Yetki eşlemesini elle transkript ETMEMEK. Ne koddaysa
 *       birebir o DB'ye gider. Tahmin/hafıza yok.
 *
 * KULLANIM (repo/test klasöründe):
 *   node generate_permissions_seed.js ./js/config.js
 *
 * Çıktı: ./03_role_permissions_seed.sql
 * Ayrıca ekrana özet döker (kaç scope, kaç action satırı üretildi).
 * ===================================================================== */

const fs = require('fs');

const configPath = process.argv[2] || './js/config.js';
const outPath    = process.argv[3] || './03_role_permissions_seed.sql';

const src = fs.readFileSync(configPath, 'utf8');

// --- PERM objesini kaynak koddan ayıkla (brace-matching) --------------
function extractObjectLiteral(text, varNames) {
  for (const name of varNames) {
    const re = new RegExp('(?:const|let|var)?\\s*' + name + '\\s*=\\s*\\{');
    const m = re.exec(text);
    if (!m) continue;
    const start = text.indexOf('{', m.index);
    let depth = 0, inStr = null, esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (esc) { esc = false; }
        else if (c === '\\') { esc = true; }
        else if (c === inStr) { inStr = null; }
      } else {
        if (c === '"' || c === "'" || c === '`') inStr = c;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
      }
    }
  }
  return null;
}

const permLiteral = extractObjectLiteral(src, ['PERM']);
if (!permLiteral) {
  console.error('HATA: config.js içinde PERM objesi bulunamadı. Değişken adını kontrol et.');
  process.exit(1);
}

let PERM;
try {
  // Sadece nesne literali eval edilir; config.js'in geri kalanı çalıştırılmaz.
  PERM = eval('(' + permLiteral + ')');
} catch (e) {
  console.error('HATA: PERM eval edilemedi:', e.message);
  process.exit(1);
}

// --- SQL üret ---------------------------------------------------------
const esc = s => String(s).replace(/'/g, "''");
const rows = [];
const roleSet = new Set();
let scopeCount = 0, actionCount = 0;

// 1) scope: PERM.scope[module][role] = kod
if (PERM.scope && typeof PERM.scope === 'object') {
  for (const modul of Object.keys(PERM.scope)) {
    const roleMap = PERM.scope[modul];
    if (!roleMap || typeof roleMap !== 'object') continue;
    for (const role of Object.keys(roleMap)) {
      const deger = roleMap[role];
      rows.push(`  ('${esc(role)}','scope','${esc(modul)}','${esc(deger)}')`);
      roleSet.add(role);
      scopeCount++;
    }
  }
}

// 2) action: PERM'in scope dışındaki, değeri DİZİ olan her anahtarı
for (const key of Object.keys(PERM)) {
  if (key === 'scope') continue;
  const val = PERM[key];
  if (!Array.isArray(val)) continue;
  for (const role of val) {
    rows.push(`  ('${esc(role)}','action','${esc(key)}','1')`);
    roleSet.add(role);
    actionCount++;
  }
}

const distinctRoles = [...roleSet].map(r => `  '${esc(r)}'`).join(',\n');

const header = `-- =====================================================================
-- 03_role_permissions_seed.sql  (OTOMATİK ÜRETİLDİ)
-- Kaynak: ${configPath}
-- Üretim: generate_permissions_seed.js
-- scope satırı: ${scopeCount} | action satırı: ${actionCount} | toplam: ${rows.length}
-- Elle düzenleme yapma — config.js değişince script'i yeniden çalıştır.
-- =====================================================================
-- Idempotent: önce bu rollerin mevcut izinleri silinir, sonra yeniden yazılır.

BEGIN;

DELETE FROM public.role_permissions
WHERE role_kod IN (
${distinctRoles}
);

INSERT INTO public.role_permissions (role_kod, perm_tip, perm_key, deger) VALUES
${rows.join(',\n')}
ON CONFLICT (role_kod, perm_tip, perm_key) DO UPDATE SET deger = EXCLUDED.deger;

COMMIT;
`;

fs.writeFileSync(outPath, header, 'utf8');
console.log('OK ->', outPath);
console.log('scope satırı :', scopeCount);
console.log('action satırı:', actionCount);
console.log('toplam       :', rows.length);
console.log('\nPERM.scope modülleri:', Object.keys(PERM.scope || {}).join(', '));
console.log('PERM action anahtarları:',
  Object.keys(PERM).filter(k => k !== 'scope' && Array.isArray(PERM[k])).join(', '));
