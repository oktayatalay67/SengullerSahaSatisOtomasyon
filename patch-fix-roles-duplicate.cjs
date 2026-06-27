const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(process.cwd(), 'public', 'js', 'modules', 'admin.js');
const indexPath = path.join(process.cwd(), 'public', 'index.html');

if (!fs.existsSync(adminJsPath)) {
  console.error('❌ admin.js bulunamadı:', adminJsPath);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html bulunamadı:', indexPath);
  process.exit(1);
}

let adminJs = fs.readFileSync(adminJsPath, 'utf8');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const adminBackup = adminJsPath + `.backup-fix-roles-duplicate-${Date.now()}`;
const indexBackup = indexPath + `.backup-fix-roles-duplicate-${Date.now()}`;

fs.writeFileSync(adminBackup, adminJs, 'utf8');
fs.writeFileSync(indexBackup, indexHtml, 'utf8');

console.log('✅ Yedek alındı:', adminBackup);
console.log('✅ Yedek alındı:', indexBackup);

// Roller butonu event göndererek çalışsın
indexHtml = indexHtml.replace(
  /onclick=["']openRolesWithPermissionsTab\(\)["']/g,
  'onclick="openRolesWithPermissionsTab(event)"'
);

// openRolesWithPermissionsTab fonksiyonunu eski showAdminTab çağrısı olmadan değiştir
const fnRegex = /async function openRolesWithPermissionsTab\s*\([^)]*\)\s*\{[\s\S]*?\n\}/;

if (!fnRegex.test(adminJs)) {
  console.error('❌ openRolesWithPermissionsTab fonksiyonu bulunamadı.');
  process.exit(1);
}

const newFn = `
async function openRolesWithPermissionsTab(evt) {
  if (evt && typeof evt.preventDefault === 'function') {
    evt.preventDefault();
  }

  if (evt && typeof evt.stopPropagation === 'function') {
    evt.stopPropagation();
  }

  // Eski showAdminTab('roles') çağrılmıyor.
  // Çünkü o eski Roller ekranını da yükleyip çift görünüm oluşturuyor.
  currentAdminTab = 'roles';

  document.querySelectorAll('.admin-tab').forEach(function(button) {
    button.classList.toggle('active', button.dataset.adminTab === 'roles');
  });

  const duplicateHost = document.getElementById('roles-permissions-host');
  if (duplicateHost) duplicateHost.innerHTML = '';

  await loadRolesWithPermissions();
}
`;

adminJs = adminJs.replace(fnRegex, newFn);

fs.writeFileSync(adminJsPath, adminJs, 'utf8');
fs.writeFileSync(indexPath, indexHtml, 'utf8');

console.log('✅ Çift Roller ekranı sorunu düzeltildi.');
