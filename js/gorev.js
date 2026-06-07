// ============================================================
// gorev.js — v1.2.0
// Son güncelleme: 2026-06-08
// Değişiklikler:
//   v1.2.0 — C: gorevZiyaretOlustur direkt DB kaydı (form açmıyor)
//             task_id visits tablosuna yazılır, göreve visit_id set edilir
//   v1.1.0 — gorevMusteriAra KÇM scope (getCustomerBaseQuery(true))
// ============================================================
// ===== GÖREV MODÜLÜ =====
// ============================================================
// GÖREV YÖNETİMİ MODÜLÜ — senguller_gorev.js
// v1.0 — Ana uygulamadan bağımsız, mevcut koda dokunmaz
// Bağımlılıklar: sb (supabase client), currentUser, myIdToName,
//               navTo, showPage, toast, escapeHTML, addLog,
//               navHistory, selC
// ============================================================

'use strict';

// ---- STATE ----
var GOREV = {
  taskTypes:   [],        // task_types listesi
  tasks:       [],        // yüklü görev listesi
  filter:      'hepsi',   // hepsi / bana / benimki / atadim
  sortBy:      'deadline',
  editingId:   null,      // düzenleme modunda task_id
  timer:       null,      // otomatik yenileme
  unread:      0,         // bildirim sayısı
};

// Görev durumları
var GOREV_DURUMLAR = ['Başladı','Devam','Beklemede','Tamamlandı','Reddedildi','İptal'];
var GOREV_DURUM_RENK = {
  'Başladı':    '#4f9cf9',
  'Devam':      '#34d399',
  'Beklemede':  '#fbbf24',
  'Tamamlandı': '#10b981',
  'Reddedildi': '#f87171',
  'İptal':      '#6b7280',
};

// ============================================================
// INIT — sayfa açılınca
// ============================================================
async function initGorevModulu() {
  await loadTaskTypes();
  await loadGorevler();
  renderGorevFiltreler();
  startGorevTimer();
}

function startGorevTimer() {
  if (GOREV.timer) clearInterval(GOREV.timer);
  GOREV.timer = setInterval(function() {
    loadGorevler(true); // sessiz yenile
  }, 60000);
}

// ============================================================
// TASK TYPES
// ============================================================
async function loadTaskTypes() {
  const { data } = await sb.from('task_types')
    .select('*').eq('aktif', true).order('sira');
  GOREV.taskTypes = data || [];
}

// ============================================================
// GÖREV LİSTESİ YÜKLEME
// ============================================================
async function loadGorevler(silent) {
  const listEl = document.getElementById('gorevListesi');
  if (!silent && listEl) listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {

  const mid = currentUser.my_id;
  // v30.36: Basit select, join yok - KÇM yöneticisi için ayrı user/customer çekimi
  let q = sb.from('tasks')
    .select('task_id,type_id,baslik,aciklama,ncst,durum,baslama_tarihi,deadline,tamamlanma_tarihi,onay_tarihi,atayan_id,atanan_id,onaylayan_id,visit_id,opp_id,olusturma_tarihi,guncelleme_tarihi')
    .order('deadline', { ascending: true })
    .limit(200);

  // Yönetici tümünü görür, diğerleri sadece ilgili olanları
  const r = (currentUser.yetki_seviyesi || '').toUpperCase();
  const YETKILI = ['ADMIN','SATIŞ DİREKTÖRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ','OPERASYON MÜDÜRÜ'];
  if (!YETKILI.includes(r)) {
    q = q.or('atayan_id.eq.' + mid + ',atanan_id.eq.' + mid);
  } else if (currentUser.kcm_id) {
    // KÇM yöneticisi: kendi KÇM'indeki görevler
    const { data: kcmUsers } = await sb.from('users')
      .select('my_id').eq('kcm_id', currentUser.kcm_id).eq('aktif', true);
    const ids = (kcmUsers || []).map(u => u.my_id);
    if (ids.length) q = q.or('atayan_id.in.(' + ids.join(',') + '),atanan_id.in.(' + ids.join(',') + ')');
  }

  const { data, error } = await q;
  if (error) { console.error('Görev yükleme hatası:', error); return; }

  const tasks = data || [];

  // Tip bilgisi çek
  await loadTaskTypes();
  const tipMap = {};
  GOREV.taskTypes.forEach(function(t) { tipMap[t.type_id] = t; });

  // Kullanıcı ve müşteri bilgilerini batch çek
  const allUserIds = [...new Set(tasks.flatMap(function(t) { return [t.atayan_id, t.atanan_id].filter(Boolean); }))];
  const allNcst    = [...new Set(tasks.map(function(t) { return t.ncst; }).filter(Boolean))];

  let userMap = {}, musteriMap = {};
  if (allUserIds.length) {
    const { data: users } = await sb.from('users').select('my_id,ad_soyad').in('my_id', allUserIds);
    (users||[]).forEach(function(u) { userMap[u.my_id] = u; });
  }
  if (allNcst.length) {
    const { data: custs } = await sb.from('customers').select('ncst,unvan').in('ncst', allNcst);
    (custs||[]).forEach(function(c) { musteriMap[c.ncst] = c; });
  }

  // Task'lara ilişkili verileri ekle
  GOREV.tasks = tasks.map(function(t) {
    return Object.assign({}, t, {
      task_types: tipMap[t.type_id] || null,
      atayan:  userMap[t.atayan_id]  || { my_id: t.atayan_id, ad_soyad: '#'+t.atayan_id },
      atanan:  userMap[t.atanan_id]  || { my_id: t.atanan_id, ad_soyad: '#'+t.atanan_id },
      musteri: musteriMap[t.ncst]    || (t.ncst ? { ncst: t.ncst, unvan: t.ncst } : null),
    });
  });

  updateGorevBadge();
  renderGorevListesi();
  } catch(err) {
    console.error('loadGorevler hatası:', err);
    const listEl2 = document.getElementById('gorevListesi');
    if(listEl2) listEl2.innerHTML = '<div class="empty" style="color:var(--red);">Görevler yüklenemedi: ' + (err.message||'Bilinmeyen hata') + '</div>';
  }
}

// ============================================================
// BADGE — bildirim sayısı
// ============================================================
function updateGorevBadge() {
  const mid = currentUser.my_id;
  const bekleyen = GOREV.tasks.filter(t =>
    t.atanan_id === mid &&
    !['Tamamlandı','Reddedildi','İptal'].includes(t.durum)
  ).length;
  GOREV.unread = bekleyen;
  const badge = document.getElementById('gorevMenuBadge');
  if (badge) {
    badge.textContent = bekleyen || '';
    badge.style.display = bekleyen > 0 ? 'inline-flex' : 'none';
  }
}

// ============================================================
// FİLTRELER
// ============================================================
function renderGorevFiltreler() {
  // Filtre butonları zaten HTML'de — sadece aktif durumunu güncelle
  document.querySelectorAll('.gorev-filter-btn').forEach(function(b) {
    b.classList.toggle('selected', b.dataset.filter === GOREV.filter);
  });
}

function setGorevFilter(f) {
  GOREV.filter = f;
  renderGorevFiltreler();
  renderGorevListesi();
}

function filteredGorevler() {
  const mid = currentUser.my_id;
  return GOREV.tasks.filter(function(t) {
    if (GOREV.filter === 'bana')    return t.atanan_id === mid;
    if (GOREV.filter === 'benimki') return t.atanan_id === mid || t.atayan_id === mid;
    if (GOREV.filter === 'atadim')  return t.atayan_id === mid && t.atanan_id !== mid;
    if (GOREV.filter === 'bekleyen') return t.atanan_id === mid && !['Tamamlandı','Reddedildi','İptal'].includes(t.durum);
    if (GOREV.filter === 'onay')    return t.atayan_id === mid && t.durum === 'Tamamlandı' && !t.onay_tarihi;
    return true; // hepsi
  });
}

// ============================================================
// RENDER — GÖREV LİSTESİ
// ============================================================
function renderGorevListesi() {
  const listEl = document.getElementById('gorevListesi');
  if (!listEl) return;

  const list = filteredGorevler();
  if (!list.length) {
    listEl.innerHTML = '<div class="empty">Görev bulunamadı.</div>';
    return;
  }

  // Gruplama: Gecikmiş / Bugün / Yakında / Diğer
  const now   = new Date();
  const today = now.toISOString().slice(0,10);

  function getGrup(t) {
    if (['Tamamlandı','Reddedildi','İptal'].includes(t.durum)) return 'Tamamlanan';
    if (!t.deadline) return 'Tarihi Yok';
    if (t.deadline < today) return 'Gecikmiş';
    if (t.deadline === today) return 'Bugün';
    const d7 = new Date(now); d7.setDate(d7.getDate()+7);
    if (new Date(t.deadline) <= d7) return 'Bu Hafta';
    return 'İleride';
  }

  const grupSira = ['Gecikmiş','Bugün','Bu Hafta','İleride','Tarihi Yok','Tamamlanan'];
  const gruplar  = {};
  list.forEach(function(t) {
    const g = getGrup(t);
    if (!gruplar[g]) gruplar[g] = [];
    gruplar[g].push(t);
  });

  const html = grupSira.filter(g => gruplar[g]).map(function(g) {
    const renk = g === 'Gecikmiş' ? '#f87171' : g === 'Bugün' ? '#fbbf24' : 'var(--text3)';
    return '<div style="margin-bottom:16px;">' +
      '<div style="font-size:10px;font-weight:700;color:' + renk + ';text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);">' +
        escapeHTML(g) + ' <span style="opacity:.6;">(' + gruplar[g].length + ')</span>' +
      '</div>' +
      gruplar[g].map(renderGorevKarti).join('') +
    '</div>';
  }).join('');

  listEl.innerHTML = html;
}

function renderGorevKarti(t) {
  const mid   = currentUser.my_id;
  const renk  = GOREV_DURUM_RENK[t.durum] || '#6b7280';
  const tip   = t.task_types ? t.task_types.tip_adi : 'Görev';
  const atanan  = t.atanan  ? t.atanan.ad_soyad  : '#' + t.atanan_id;
  const atayan  = t.atayan  ? t.atayan.ad_soyad  : '#' + t.atayan_id;
  const musteri = t.musteri ? t.musteri.unvan     : t.ncst || '';

  const gecikti = t.deadline && t.deadline < new Date().toISOString().slice(0,10)
    && !['Tamamlandı','Reddedildi','İptal'].includes(t.durum);

  const benimGorevim = t.atanan_id === mid;
  const benimatadim  = t.atayan_id === mid;

  // Aksiyon butonları
  let aksiyonlar = '';
  if (benimGorevim && !['Tamamlandı','Reddedildi','İptal'].includes(t.durum)) {
    aksiyonlar += '<button class="btn btn-green btn-sm" style="padding:5px 10px;font-size:11px;" onclick="gorevDurumGuncelle(' + t.task_id + ',\'Tamamlandı\')">✓ Tamamla</button> ';
    if (t.durum !== 'Beklemede')
      aksiyonlar += '<button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:11px;" onclick="gorevDurumGuncelle(' + t.task_id + ',\'Beklemede\')">⏸ Beklet</button> ';
  }
  if (benimatadim && t.durum === 'Tamamlandı' && !t.onay_tarihi) {
    aksiyonlar += '<button class="btn btn-green btn-sm" style="padding:5px 10px;font-size:11px;background:var(--green);" onclick="gorevOnayla(' + t.task_id + ')">✓ Onayla</button> ';
    aksiyonlar += '<button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:11px;color:var(--red);" onclick="gorevReddet(' + t.task_id + ')">✗ Reddet</button> ';
  }
  if ((benimatadim || (currentUser.yetki_seviyesi||'').toUpperCase()==='ADMIN')
    && !['Tamamlandı','İptal'].includes(t.durum)) {
    aksiyonlar += '<button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:11px;" onclick="openGorevEdit(' + t.task_id + ')">✏️</button> ';
  }
  // Bağlı ziyaret/fırsat butonu
  if (t.visit_id) aksiyonlar += '<button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:11px;" onclick="gorevZiyaretAc(' + t.task_id + ')">📍 Ziyaret</button> ';
  if (t.opp_id)   aksiyonlar += '<button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:11px;" onclick="openEditOppModal(' + t.opp_id + ')">💼 Fırsat</button> ';

  return '<div class="visit-card" style="margin-bottom:8px;cursor:pointer;border-left:3px solid ' + renk + ';' + (gecikti ? 'background:rgba(248,113,113,.05);' : '') + '">' +
    '<div onclick="openGorevDetay(' + t.task_id + ')" style="flex:1;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
        '<span style="font-size:10px;padding:2px 8px;border-radius:12px;background:' + renk + '22;color:' + renk + ';font-weight:600;">' + escapeHTML(t.durum) + '</span>' +
        '<span style="font-size:10px;color:var(--text3);">' + escapeHTML(tip) + '</span>' +
        (t.onay_tarihi ? '<span style="font-size:10px;color:var(--green);">✓ Onaylandı</span>' : '') +
        (gecikti ? '<span style="font-size:10px;color:var(--red);font-weight:700;">⚠ Gecikmiş</span>' : '') +
      '</div>' +
      '<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;">' + escapeHTML(t.baslik) + '</div>' +
      (musteri ? '<div style="font-size:12px;color:var(--text2);margin-bottom:3px;">🏢 ' + escapeHTML(musteri) + '</div>' : '') +
      '<div style="font-size:11px;color:var(--text3);">' +
        '👤 ' + escapeHTML(atayan) + ' → ' + escapeHTML(atanan) +
        (t.deadline ? ' &nbsp;|&nbsp; 📅 ' + t.deadline : '') +
      '</div>' +
    '</div>' +
    (aksiyonlar ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">' + aksiyonlar + '</div>' : '') +
  '</div>';
}

// ============================================================
// GÖREV DETAY MODAL
// ============================================================
async function openGorevDetay(taskId) {
  const t = GOREV.tasks.find(function(x) { return x.task_id === taskId; });
  if (!t) return;

  // Logları yükle
  const { data: logs } = await sb.from('task_logs')
    .select('*').eq('task_id', taskId).order('olusturma_tarihi', { ascending: true });

  const tip    = t.task_types ? t.task_types.tip_adi : 'Görev';
  const atanan = t.atanan  ? t.atanan.ad_soyad  : '#' + t.atanan_id;
  const atayan = t.atayan  ? t.atayan.ad_soyad  : '#' + t.atayan_id;
  const musteri= t.musteri ? t.musteri.unvan     : t.ncst || '';
  const renk   = GOREV_DURUM_RENK[t.durum] || '#6b7280';

  const logHTML = (logs || []).map(function(l) {
    const zaman = new Date(l.olusturma_tarihi).toLocaleString('tr-TR');
    return '<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:2px;">' +
        '<span style="font-weight:600;color:var(--text);">' + escapeHTML(l.user_ad||'') + '</span>' +
        '<span style="color:var(--text3);">' + zaman + '</span>' +
      '</div>' +
      '<span style="color:' + (GOREV_DURUM_RENK[l.aksiyon]||'var(--blue)') + ';font-size:11px;margin-right:6px;">' + escapeHTML(l.aksiyon||'') + '</span>' +
      (l.detay ? '<span style="color:var(--text2);">' + escapeHTML(l.detay) + '</span>' : '') +
    '</div>';
  }).join('') || '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Henüz kayıt yok.</div>';

  const mid = currentUser.my_id;
  const benimGorevim  = t.atanan_id === mid;
  const benimatadim   = t.atayan_id === mid;
  const kapali = ['Tamamlandı','Reddedildi','İptal'].includes(t.durum);

  let aksiyonHTML = '';
  if (benimGorevim && !kapali) {
    GOREV_DURUMLAR.filter(function(d) { return d !== t.durum && !['Reddedildi'].includes(d); })
    .forEach(function(d) {
      const r = d === 'Tamamlandı' ? 'var(--green)' : d === 'İptal' ? 'var(--red)' : 'var(--blue)';
      aksiyonHTML += '<button class="btn btn-ghost btn-sm" style="padding:6px 12px;border-color:' + r + ';color:' + r + ';" onclick="gorevDurumGuncelle(' + taskId + ',\'' + d + '\');closeModal(\'gorevDetayModal\')">' + d + '</button>';
    });
  }
  if (benimatadim && t.durum === 'Tamamlandı' && !t.onay_tarihi) {
    aksiyonHTML += '<button class="btn" style="background:var(--green);padding:6px 12px;" onclick="gorevOnayla(' + taskId + ');closeModal(\'gorevDetayModal\')">✓ Tamamlandı Onayla</button>';
    aksiyonHTML += '<button class="btn btn-ghost btn-sm" style="padding:6px 12px;color:var(--red);border-color:var(--red);" onclick="gorevReddet(' + taskId + ');closeModal(\'gorevDetayModal\')">✗ Reddet</button>';
  }

  // Not ekleme
  const notHTML = !kapali ? '<div style="margin-top:12px;">' +
    '<textarea id="gorevDetayNot" placeholder="Not ekle..." style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;font-size:13px;min-height:60px;resize:vertical;"></textarea>' +
    '<button class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="gorevNotEkle(' + taskId + ')">Not Ekle</button>' +
  '</div>' : '';

  // Deadline değiştirme
  const deadlineHTML = (benimGorevim || benimatadim) && !kapali ? '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">' +
    '<label style="font-size:11px;color:var(--text3);">Deadline:</label>' +
    '<input type="date" id="gorevDetayDeadline" value="' + (t.deadline||'') + '" style="background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:4px 8px;font-size:12px;">' +
    '<button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:11px;" onclick="gorevDeadlineGuncelle(' + taskId + ')">Güncelle</button>' +
  '</div>' : '';

  document.getElementById('gorevDetayIcerik').innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
      '<span style="background:' + renk + '22;color:' + renk + ';padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">' + escapeHTML(t.durum) + '</span>' +
      '<span style="font-size:12px;color:var(--text3);">' + escapeHTML(tip) + '</span>' +
    '</div>' +
    '<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;">' + escapeHTML(t.baslik) + '</div>' +
    (musteri ? '<div style="font-size:12px;color:var(--text2);margin-bottom:6px;">🏢 ' + escapeHTML(musteri) + '</div>' : '') +
    (t.aciklama ? '<div style="font-size:13px;color:var(--text2);background:var(--navy2);border-radius:8px;padding:10px;margin-bottom:10px;">' + escapeHTML(t.aciklama) + '</div>' : '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;font-size:12px;">' +
      '<div style="color:var(--text3);">Atayan: <span style="color:var(--text);">' + escapeHTML(atayan) + '</span></div>' +
      '<div style="color:var(--text3);">Atanan: <span style="color:var(--text);">' + escapeHTML(atanan) + '</span></div>' +
      '<div style="color:var(--text3);">Başlama: <span style="color:var(--text);">' + (t.baslama_tarihi ? new Date(t.baslama_tarihi).toLocaleDateString('tr-TR') : '—') + '</span></div>' +
      '<div style="color:var(--text3);">Deadline: <span style="color:' + (t.deadline && t.deadline < new Date().toISOString().slice(0,10) && !kapali ? 'var(--red)' : 'var(--text)') + ';">' + (t.deadline||'—') + '</span></div>' +
    '</div>' +
    deadlineHTML +
    (aksiyonHTML ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0;">' + aksiyonHTML + '</div>' : '') +
    '<div style="margin-top:12px;">' +
      '<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Timeline</div>' +
      logHTML +
    '</div>' +
    notHTML;

  openModal('gorevDetayModal');
}

// ============================================================
// GÖREV OLUŞTURMA / DÜZENLEME
// ============================================================
async function openYeniGorev() {
  GOREV.editingId = null;
  await loadTaskTypes();

  // Kullanıcı listesi
  const { data: kullanicilar } = await sb.from('users')
    .select('my_id,ad_soyad,kcm_id')
    .eq('aktif', true)
    .order('ad_soyad');

  const tipOpts = GOREV.taskTypes.map(function(t) {
    return '<option value="' + t.type_id + '" data-form="' + (t.bagli_form||'genel') + '">' + escapeHTML(t.tip_adi) + '</option>';
  }).join('');

  const kulOpts = (kullanicilar||[]).map(function(u) {
    const secili = u.my_id === currentUser.my_id ? ' selected' : '';
    return '<option value="' + u.my_id + '"' + secili + '>' + escapeHTML(u.ad_soyad) + '</option>';
  }).join('');

  document.getElementById('gorevFormIcerik').innerHTML =
    '<div class="field"><label>Görev Tipi *</label>' +
    '<select id="gfTip" onchange="gorevTipDegisti()" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;">' +
    tipOpts + '</select></div>' +

    '<div class="field"><label>Başlık *</label>' +
    '<input type="text" id="gfBaslik" placeholder="Görev başlığı..." style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;"></div>' +

    '<div class="field"><label>Açıklama</label>' +
    '<textarea id="gfAciklama" placeholder="Detaylar..." style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;min-height:70px;resize:vertical;"></textarea></div>' +

    '<div class="field"><label>Atanacak Kişi *</label>' +
    '<select id="gfAtanan" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;">' +
    kulOpts + '</select></div>' +

    '<div class="field"><label>Müşteri</label>' +
    '<div style="position:relative;">' +
    '<input type="text" id="gfMusteriAra" placeholder="Müşteri ara..." oninput="gorevMusteriAra(this.value)" autocomplete="off" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;">' +
    '<div id="gfMusteriSonuc" style="position:absolute;top:100%;left:0;right:0;background:var(--card);border:1px solid var(--border);border-radius:8px;z-index:200;max-height:180px;overflow-y:auto;display:none;"></div>' +
    '</div>' +
    '<div id="gfMusteriSecili" style="display:none;margin-top:4px;padding:6px 10px;background:rgba(77,159,255,.1);border:1px solid var(--blue);border-radius:6px;font-size:12px;color:var(--blue);"></div>' +
    '<input type="hidden" id="gfMusteriNcst"></div>' +

    '<div class="field"><label>Deadline</label>' +
    '<input type="date" id="gfDeadline" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;"></div>' +

    '<div id="gfBagliFormDiv" style="display:none;padding:10px;background:rgba(77,159,255,.08);border:1px solid rgba(77,159,255,.2);border-radius:8px;margin-bottom:8px;font-size:12px;color:var(--blue);">ℹ️ Bu görev tipi otomatik <span id="gfBagliFormTip"></span> oluşturacak.</div>';

  gorevTipDegisti();
  openModal('gorevFormModal');
}

function gorevTipDegisti() {
  const sel = document.getElementById('gfTip');
  if (!sel) return;
  const opt  = sel.options[sel.selectedIndex];
  const form = opt ? opt.dataset.form : 'genel';
  const div  = document.getElementById('gfBagliFormDiv');
  const tip  = document.getElementById('gfBagliFormTip');
  if (!div || !tip) return;
  if (form && form !== 'genel') {
    const formAd = { 'ziyaret':'ziyaret formu', 'firsat':'ziyaret + fırsat formu', 'ziyaret_firsat':'ziyaret + fırsat formu' };
    tip.textContent = formAd[form] || form;
    div.style.display = '';
  } else {
    div.style.display = 'none';
  }
}

// Müşteri arama görev formunda
var _gfMusteriTimer = null;
function gorevMusteriAra(val) {
  clearTimeout(_gfMusteriTimer);
  const res = document.getElementById('gfMusteriSonuc');
  if (!val || val.length < 2) { if(res) res.style.display='none'; return; }
  _gfMusteriTimer = setTimeout(async function() {
    const { data } = await getCustomerBaseQuery(true)
      .select('ncst,unvan').ilike('unvan','%'+val+'%').limit(8);
    if (!res) return;
    if (!data || !data.length) { res.style.display='none'; return; }
    res.innerHTML = (data||[]).map(function(c) {
      return '<div class="search-item" onclick="gorevMusteriSec(\'' + c.ncst + '\',\'' + escapeHTML(c.unvan).replace(/'/g,"\\'") + '\')" style="padding:10px 14px;cursor:pointer;font-size:13px;">' + escapeHTML(c.unvan) + '</div>';
    }).join('');
    res.style.display = '';
  }, 300);
}

function gorevMusteriSec(ncst, unvan) {
  document.getElementById('gfMusteriNcst').value = ncst;
  document.getElementById('gfMusteriAra').value  = unvan;
  const secili = document.getElementById('gfMusteriSecili');
  if (secili) { secili.innerHTML = '🏢 ' + escapeHTML(unvan); secili.style.display = ''; }
  const res = document.getElementById('gfMusteriSonuc');
  if (res) res.style.display = 'none';
}

// ============================================================
// GÖREV KAYDET
// ============================================================
async function saveGorev() {
  const tipId   = parseInt(document.getElementById('gfTip').value);
  const baslik  = (document.getElementById('gfBaslik').value||'').trim();
  const aciklama= (document.getElementById('gfAciklama').value||'').trim();
  const atananId= parseInt(document.getElementById('gfAtanan').value);
  const ncst    = document.getElementById('gfMusteriNcst').value||null;
  const deadline= document.getElementById('gfDeadline').value||null;

  if (!baslik)    { toast('Başlık zorunlu','error'); return; }
  if (!atananId)  { toast('Atanacak kişi seçin','error'); return; }

  const tip = GOREV.taskTypes.find(function(t) { return t.type_id === tipId; });
  const form = tip ? tip.bagli_form : 'genel';

  const payload = {
    type_id:       tipId,
    baslik:        baslik,
    aciklama:      aciklama||null,
    ncst:          ncst,
    atayan_id:     currentUser.my_id,
    atanan_id:     atananId,
    durum:         'Başladı',
    baslama_tarihi:new Date().toISOString(),
    deadline:      deadline,
    guncelleme_tarihi: new Date().toISOString(),
  };

  const { data: gorevData, error } = await sb.from('tasks').insert(payload).select().single();
  if (error) { toast('Görev kaydedilemedi: '+error.message,'error'); return; }

  const gorevId = gorevData.task_id;

  // Log ekle
  await sb.from('task_logs').insert({
    task_id: gorevId,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad,
    aksiyon: 'Oluşturuldu',
    detay:   'Görev oluşturuldu' + (ncst ? ' — Müşteri: '+ncst : ''),
  });

  // Bağlı form otomatik aç
  closeModal('gorevFormModal');
  toast('Görev oluşturuldu ✅','success');
  await loadGorevler();

  // Görev tipine göre otomatik form aç
  if (ncst && (form === 'ziyaret' || form === 'ziyaret_firsat')) {
    await gorevZiyaretOlustur(gorevId, ncst, tip, form === 'ziyaret_firsat');
  }
}

// ============================================================
// OTOMATİK ZİYARET OLUŞTURMA
// ============================================================
// v1.2.0 (C): Form açmak yerine direkt DB'ye planlanmış ziyaret kaydı oluşturur.
// Temas kaydında task_id set edilir — görev bazlı temas raporu için izlenebilirlik.
async function gorevZiyaretOlustur(gorevId, ncst, tip, firstatDa) {
  const ziyaretAmaci = tip && tip.ziyaret_amaci ? tip.ziyaret_amaci : 'Genel Ziyaret';
  const bugun = trDateStr(new Date()); // 'YYYY-MM-DD' TR timezone

  // Müşterinin my_id ve kcm_id bilgisini al (scope için)
  const { data: cust } = await sb.from('customers').select('my_id,kcm_id').eq('ncst', ncst).single();

  const visitPayload = {
    ncst:             ncst,
    my_id:            currentUser.my_id,
    kcm_id:           currentUser.kcm_id || (cust ? cust.kcm_id : null),
    musteri_my_id:    cust ? cust.my_id : null,
    durum:            'Planlandı',
    planlanan_tarih:  bugun,
    ziyaret_amaci:    ziyaretAmaci,
    temas_turu:       'Fiziksel Ziyaret',
    task_id:          gorevId,
    guncelleme_tarihi: new Date().toISOString(),
  };

  const { data: visitData, error: visitError } = await sb.from('visits').insert(visitPayload).select().single();
  if (visitError) {
    toast('Otomatik ziyaret oluşturulamadı: ' + visitError.message, 'error');
    return;
  }

  const visitId = visitData.visit_id;

  // Göreve visit_id yaz
  await sb.from('tasks').update({ visit_id: visitId, guncelleme_tarihi: new Date().toISOString() }).eq('task_id', gorevId);

  // Görev loguna kaydet
  await sb.from('task_logs').insert({
    task_id:  gorevId,
    user_id:  currentUser.my_id,
    user_ad:  currentUser.ad_soyad,
    aksiyon:  'Otomatik Ziyaret Oluşturuldu',
    detay:    'Planlanan ziyaret otomatik oluşturuldu. Visit ID: ' + visitId + ' — Amaç: ' + ziyaretAmaci,
  });

  toast('Planlanan ziyaret otomatik oluşturuldu ✅', 'success');
}

// ============================================================
// DURUM GÜNCELLEME
// ============================================================
async function gorevDurumGuncelle(taskId, yeniDurum) {
  const { error } = await sb.from('tasks')
    .update({ durum: yeniDurum, guncelleme_tarihi: new Date().toISOString() })
    .eq('task_id', taskId);
  if (error) { toast('Hata: '+error.message,'error'); return; }

  await sb.from('task_logs').insert({
    task_id: taskId,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad,
    aksiyon: yeniDurum,
    detay:   'Durum güncellendi: ' + yeniDurum,
  });

  toast('Durum güncellendi','success');
  await loadGorevler();
}

async function gorevOnayla(taskId) {
  const { error } = await sb.from('tasks')
    .update({ onay_tarihi: new Date().toISOString(), onaylayan_id: currentUser.my_id, durum: 'Tamamlandı', guncelleme_tarihi: new Date().toISOString() })
    .eq('task_id', taskId);
  if (error) { toast('Hata: '+error.message,'error'); return; }
  await sb.from('task_logs').insert({
    task_id: taskId, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad,
    aksiyon: 'Onaylandı', detay: currentUser.ad_soyad + ' tarafından onaylandı',
  });
  toast('Görev onaylandı ✅','success');
  await loadGorevler();
}

async function gorevReddet(taskId) {
  const sebep = prompt('Reddetme sebebi (isteğe bağlı):') || '';
  const { error } = await sb.from('tasks')
    .update({ durum: 'Reddedildi', guncelleme_tarihi: new Date().toISOString() })
    .eq('task_id', taskId);
  if (error) { toast('Hata: '+error.message,'error'); return; }
  await sb.from('task_logs').insert({
    task_id: taskId, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad,
    aksiyon: 'Reddedildi', detay: sebep || 'Reddedildi',
  });
  toast('Görev reddedildi','info');
  await loadGorevler();
}

async function gorevNotEkle(taskId) {
  const not = (document.getElementById('gorevDetayNot').value||'').trim();
  if (!not) { toast('Not boş olamaz','error'); return; }
  await sb.from('task_logs').insert({
    task_id: taskId, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad,
    aksiyon: 'Not', detay: not,
  });
  document.getElementById('gorevDetayNot').value = '';
  await openGorevDetay(taskId);
}

async function gorevDeadlineGuncelle(taskId) {
  const deadline = document.getElementById('gorevDetayDeadline').value;
  const { error } = await sb.from('tasks')
    .update({ deadline: deadline||null, guncelleme_tarihi: new Date().toISOString() })
    .eq('task_id', taskId);
  if (error) { toast('Hata: '+error.message,'error'); return; }
  await sb.from('task_logs').insert({
    task_id: taskId, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad,
    aksiyon: 'Deadline Güncellendi', detay: 'Yeni deadline: ' + (deadline||'—'),
  });
  toast('Deadline güncellendi','success');
  await loadGorevler();
  await openGorevDetay(taskId);
}

async function gorevZiyaretAc(taskId) {
  const t = GOREV.tasks.find(function(x) { return x.task_id === taskId; });
  if (!t || !t.visit_id) return;
  closeModal('gorevDetayModal');
  const { data: visit } = await sb.from('visits').select('*').eq('visit_id', t.visit_id).single();
  if (!visit) { toast('Ziyaret bulunamadı','error'); return; }
  // Flag ÖNCE set et, sonra navTo çağır — initTemasForm flag'i görür ve atlar
  window._temasEditMode = true;
  window.currentEditingVisitId = visit.visit_id;
  openTemasFormForEdit(visit, true);
}

// ============================================================
// GÖREV SİLME
// ============================================================
async function gorevSil(taskId) {
  if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
  const { error } = await sb.from('task_logs').delete().eq('task_id', taskId);
  const { error: e2 } = await sb.from('tasks').delete().eq('task_id', taskId);
  if (e2) { toast('Hata: '+e2.message,'error'); return; }
  toast('Görev silindi','success');
  await loadGorevler();
}

// ============================================================
// GÖREV EDİT (sadece atayan değiştirebilir)
// ============================================================
async function openGorevEdit(taskId) {
  const t = GOREV.tasks.find(function(x) { return x.task_id === taskId; });
  if (!t) return;
  if (t.atayan_id !== currentUser.my_id && (currentUser.yetki_seviyesi||'').toUpperCase() !== 'ADMIN') {
    toast('Sadece atayan kişi düzenleyebilir','error'); return;
  }
  GOREV.editingId = taskId;
  await openYeniGorev();
  // openYeniGorev modal açar ve formu render eder — DOM'un hazır olması için küçük bekleme
  await new Promise(function(r){ setTimeout(r, 100); });
  const baslikEl = document.getElementById('gfBaslik');
  const aclEl    = document.getElementById('gfAciklama');
  const dlEl     = document.getElementById('gfDeadline');
  const tipEl    = document.getElementById('gfTip');
  const atananEl = document.getElementById('gfAtanan');
  if (baslikEl) baslikEl.value = t.baslik || '';
  if (aclEl)    aclEl.value   = t.aciklama || '';
  if (dlEl)     dlEl.value    = t.deadline || '';
  if (tipEl)    tipEl.value   = t.type_id || '';
  if (atananEl) atananEl.value = t.atanan_id || '';
  if (t.ncst && t.musteri) gorevMusteriSec(t.ncst, t.musteri.unvan || t.ncst);
}

// ============================================================
// ADMIN — GÖREV TİPLERİ YÖNETİMİ
// ============================================================
async function renderGorevTipleriAdmin() {
  await loadTaskTypes();
  const el = document.getElementById('gorevTipleriListesi');
  if (!el) return;

  // Ziyaret amaçlarını DB'den yükle → gtYeniAmac select'ini doldur
  const amacSel = document.getElementById('gtYeniAmac');
  if (amacSel && amacSel.options.length <= 1) {
    // visit_purposes veya ziyaret_amaclari tablosu yoksa window._dbAmaclar'dan al
    const amaclar = window._dbAmaclar || [];
    amaclar.forEach(function(a) {
      const o = document.createElement('option');
      o.value = a; o.textContent = a;
      amacSel.appendChild(o);
    });
    // Eğer _dbAmaclar boşsa, visits tablosundan distinct çek
    if (!amaclar.length) {
      const { data } = await sb.from('visits').select('ziyaret_amaci').limit(500);
      const set = new Set();
      (data||[]).forEach(function(v) {
        (v.ziyaret_amaci||'').split(',').forEach(function(a) {
          const t = a.trim(); if(t) set.add(t);
        });
      });
      [...set].sort().forEach(function(a) {
        const o = document.createElement('option');
        o.value = a; o.textContent = a;
        amacSel.appendChild(o);
      });
    }
  }

  const rows = GOREV.taskTypes.map(function(t) {
    const formAdlar = {'genel':'Genel','ziyaret':'Ziyaret Formu','ziyaret_firsat':'Ziyaret+Fırsat'};
    return '<div class="urun-row" style="margin-bottom:6px;" id="gt_row_'+t.type_id+'">' +
      '<div class="urun-row-info">' +
        '<div style="font-size:13px;font-weight:600;">' + escapeHTML(t.tip_adi) + '</div>' +
        '<div style="font-size:11px;color:var(--text3);">Form: ' + escapeHTML(formAdlar[t.bagli_form]||t.bagli_form||'Genel') +
          (t.ziyaret_amaci ? ' | Amaç: ' + escapeHTML(t.ziyaret_amaci) : '') + '</div>' +
      '</div>' +
      '<div class="urun-row-actions">' +
        '<button class="icon-btn" title="Düzenle" onclick="gorevTipiEdit('+t.type_id+')">✏️</button>' +
        '<button class="icon-btn" title="Sil" onclick="gorevTipiSil('+t.type_id+')">🗑️</button>' +
      '</div>' +
    '</div>' +
    '<div id="gt_edit_'+t.type_id+'" style="display:none;background:var(--navy2);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;">' +
      '<div class="field"><label style="font-size:11px;">Tip Adı</label>' +
        '<input id="gt_adi_'+t.type_id+'" value="'+escapeHTML(t.tip_adi)+'" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:7px;font-size:13px;"></div>' +
      '<div class="field"><label style="font-size:11px;">Bağlı Form</label>' +
        '<select id="gt_form_'+t.type_id+'" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:7px;font-size:13px;">' +
          '<option value="genel"'+(t.bagli_form==='genel'?' selected':'')+'>Genel</option>' +
          '<option value="ziyaret"'+(t.bagli_form==='ziyaret'?' selected':'')+'>Ziyaret Formu</option>' +
          '<option value="ziyaret_firsat"'+(t.bagli_form==='ziyaret_firsat'?' selected':'')+'>Ziyaret+Fırsat</option>' +
        '</select></div>' +
      '<div class="field"><label style="font-size:11px;">Otomatik Ziyaret Amacı</label>' +
        '<input id="gt_amac_'+t.type_id+'" value="'+escapeHTML(t.ziyaret_amaci||'')+'" placeholder="Boş bırakılabilir" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:7px;font-size:13px;"></div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-green btn-sm" onclick="gorevTipiKaydet('+t.type_id+')">Kaydet</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="gorevTipiEditKapat('+t.type_id+')">İptal</button>' +
      '</div>' +
    '</div>';
  }).join('') || '<div class="empty">Görev tipi yok.</div>';

  el.innerHTML = rows;
}

async function gorevTipiEkle() {
  const adi   = (document.getElementById('gtYeniAdi').value||'').trim();
  const form  = document.getElementById('gtYeniForm').value || 'genel';
  const amacSel = document.getElementById('gtYeniAmac');
  const amac  = amacSel ? (amacSel.value||'').trim() : '';
  if (!adi) { toast('Tip adı zorunlu','error'); return; }
  const { error } = await sb.from('task_types').insert({
    tip_adi: adi, bagli_form: form, ziyaret_amaci: amac||null,
    aktif: true, sira: GOREV.taskTypes.length + 1,
  });
  if (error) { toast('Hata: '+error.message,'error'); return; }
  toast('Görev tipi eklendi','success');
  document.getElementById('gtYeniAdi').value = '';
  await renderGorevTipleriAdmin();
}

function gorevTipiEdit(typeId) {
  document.getElementById('gt_edit_'+typeId).style.display = '';
}
function gorevTipiEditKapat(typeId) {
  document.getElementById('gt_edit_'+typeId).style.display = 'none';
}
async function gorevTipiKaydet(typeId) {
  const adi  = document.getElementById('gt_adi_'+typeId).value.trim();
  const form = document.getElementById('gt_form_'+typeId).value;
  const amac = document.getElementById('gt_amac_'+typeId).value.trim();
  if(!adi){ toast('Tip adı boş olamaz','error'); return; }
  const { error } = await sb.from('task_types').update({
    tip_adi: adi, bagli_form: form, ziyaret_amaci: amac||null
  }).eq('type_id', typeId);
  if(error){ toast('Hata: '+error.message,'error'); return; }
  toast('Görev tipi güncellendi','success');
  await renderGorevTipleriAdmin();
}

async function gorevTipiSil(typeId) {
  if (!confirm('Bu görev tipini silmek istediğinize emin misiniz?')) return;
  const { error } = await sb.from('task_types').update({ aktif: false }).eq('type_id', typeId);
  if (error) { toast('Hata: '+error.message,'error'); return; }
  toast('Görev tipi silindi','success');
  await renderGorevTipleriAdmin();
}

// ============================================================
// saveTemas HOOK — görevle bağlantılı ziyaret kaydedilince
// ============================================================
// Ana uygulamadaki saveTemas'ın sonuna bu çağrılacak
// Ana kod değişmez — window._gorevId global ile iletişim kurulur
async function gorevZiyaretKaydedildi(visitId) {
  const gorevId = window._gorevId;
  if (!gorevId || !visitId) return;

  // Göreve visit_id bağla
  await sb.from('tasks').update({
    visit_id: visitId,
    durum: 'Devam',
    guncelleme_tarihi: new Date().toISOString(),
  }).eq('task_id', gorevId);

  await sb.from('task_logs').insert({
    task_id: gorevId,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad,
    aksiyon: 'Ziyaret Oluşturuldu',
    detay: 'visit_id: ' + visitId,
  });

  // Fırsat da oluşturulacaksa flag
  if (window._gorevFirsatDa) {
    window._gorevFirsatDa = false;
    // Fırsat formunu aç — visit'ten müşteri alınır
    toast('Fırsat formunu da doldurun','info');
  }

  window._gorevId = null;
  toast('Görev güncellendi — ziyaret bağlandı','info');
}

console.log('Görev modülü yüklendi ✓');

