// =====================================================================
// js/roles-loader.js  —  Yetki verisini DB'den yükler (kod içinde tutmaz)
// ---------------------------------------------------------------------
// Bu modül, config.js içindeki SABİT PERM objesinin yerini alır.
// PERM'i roles + role_permissions tablolarından kurar ve window.PERM'e
// koyar. getScope() / hasPermission() gibi mevcut fonksiyonlar aynı
// şekli gördüğü için DEĞİŞMEDEN çalışır.
//
// Bağımlılık: sb (supabase client). auth.js login akışında,
//   loadKcmMyIds()'ten ÖNCE  await loadPermFromDB()  çağrılmalı.
// =====================================================================

// PERM aynı şekle sahip olacak: { scope: { modul: {rol:kod} }, <action>: [rol,...] }
window.PERM = window.PERM || { scope: {} };

// Rol listesi (dropdown + genel kullanım için) — {kod, gorunen_ad, aktif, sira}
window.ROLES = window.ROLES || [];

async function loadPermFromDB() {
  // 1) Roller
  const { data: roles, error: rErr } = await sb
    .from('roles')
    .select('kod,gorunen_ad,sira,aktif')
    .order('sira', { ascending: true });
  if (rErr) { console.error('roles yüklenemedi:', rErr); return false; }
  window.ROLES = roles || [];

  // 2) İzinler
  const { data: perms, error: pErr } = await sb
    .from('role_permissions')
    .select('role_kod,perm_tip,perm_key,deger');
  if (pErr) { console.error('role_permissions yüklenemedi:', pErr); return false; }

  // 3) PERM objesini yeniden kur (koddaki sabit yapının birebir aynısı)
  const PERM = { scope: {} };
  (perms || []).forEach(p => {
    if (p.perm_tip === 'scope') {
      if (!PERM.scope[p.perm_key]) PERM.scope[p.perm_key] = {};
      PERM.scope[p.perm_key][p.role_kod] = p.deger;         // {modul:{rol:kod}}
    } else if (p.perm_tip === 'action') {
      if (!PERM[p.perm_key]) PERM[p.perm_key] = [];
      if (p.deger === '1') PERM[p.perm_key].push(p.role_kod); // {action:[rol,...]}
    }
  });
  window.PERM = PERM;
  return true;
}

// Rol dropdown'ını DB'den doldurur (index.html'deki sabit <option>'ların yerine).
// selectEl: <select> elemanı | selectedVal: önceden seçili yetki_seviyesi (edit için)
function populateRoleDropdown(selectEl, selectedVal) {
  if (!selectEl) return;
  const roller = (window.ROLES || []).filter(r => r.aktif);
  selectEl.innerHTML = '';
  roller.forEach(r => {
    const o = document.createElement('option');
    o.value = r.kod;
    o.textContent = r.gorunen_ad;
    if (selectedVal && r.kod === selectedVal) o.selected = true;
    selectEl.appendChild(o);
  });
}
