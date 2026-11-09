// ============================================================
// surum.js — v1.0.0
// Son güncelleme: 2026-10-20
// Değişiklikler:
//   v1.0.0 — (V31.199) YENİ: Sürüm takibi + eski sürüm uyarısı.
//     1) surumKaydet(): giriş/sayfa açılışında kullanıcının çalıştırdığı APP_VERSION ve son görülme
//        zamanı kullanici_surum tablosuna yazılır (kullanıcı başına tek satır). "Profil Görüntüle"
//        (impersonation) sırasında YAZILMAZ — yoksa yöneticinin sürümü başkasının adına kaydolur.
//     2) surumKontrol(): sayfa açıkken 15 dakikada bir sunucudaki version.json okunur (statik dosya,
//        veritabanına istek YOK). Sunucu sürümü çalışan sürümden farklıysa ekranın altında
//        "Yeni sürüm var" bandı çıkar. Sekme arka plandaysa kontrol yapılmaz.
//     3) surumListeAc(): Admin Panel > Kullanıcı Sürümleri ekranı. Hangi kullanıcı hangi sürümde,
//        en son ne zaman görüldü; eski sürümdekiler kırmızı.
//   Her teslimatta version.json, config.js içindeki APP_VERSION ile BİRLİKTE güncellenir.
// ============================================================
var SURUM = { sunucu: null, tur: 0, sonKontrol: 0, timer: null, dinleyici: false };
var SURUM_KONTROL_MS = 15 * 60 * 1000;

function _surumGercekKullanici() {
  return !!currentUser && localStorage.getItem('impersonating') !== '1';
}

async function surumKaydet() {
  if (!_surumGercekKullanici()) return;
  const { error } = await sb.from('kullanici_surum').upsert({
    my_id: currentUser.my_id,
    ad_soyad: currentUser.ad_soyad,
    surum: APP_VERSION,
    son_gorulme: new Date().toISOString(),
    tarayici: (navigator.userAgent || '').slice(0, 200)
  }, { onConflict: 'my_id' });
  if (error) console.warn('[surum] kayıt yazılamadı:', error.message);
}

// Sunucudaki güncel sürüm (version.json). Okunamazsa null — uyarı çıkarılmaz.
async function surumSunucuOku() {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    return j.surum || null;
  } catch (e) { return null; }   // yerel çalışmada dosya yok / SPA yönlendirmesi: sessizce geç
}

function surumBandiGoster(sunucuSurum) {
  let b = document.getElementById('surumBandi');
  if (!b) {
    b = document.createElement('div');
    b.id = 'surumBandi';
    b.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;' +
      'background:#f59e0b;color:#1f1300;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;' +
      'box-shadow:0 4px 18px rgba(0,0,0,.45);display:flex;align-items:center;gap:12px;max-width:92vw;';
    document.body.appendChild(b);
  }
  b.innerHTML = '<span>Yeni sürüm var (' + escapeHTML(sunucuSurum) + '). Çalışan: ' + escapeHTML(APP_VERSION) + '.</span>' +
    '<button onclick="location.reload()" style="background:#1f1300;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer;">Yenile</button>';
  b.style.display = 'flex';
}

function surumBandiGizle() {
  const b = document.getElementById('surumBandi');
  if (b) b.style.display = 'none';
}

async function surumKontrol() {
  if (document.hidden) return;          // arka plan sekmesinde istek yok
  SURUM.tur++;
  SURUM.sonKontrol = Date.now();
  const s = await surumSunucuOku();
  if (s) {
    SURUM.sunucu = s;
    if (s !== APP_VERSION) surumBandiGoster(s); else surumBandiGizle();
  }
  if (SURUM.tur % 2 === 0) surumKaydet();   // son görülme: yaklaşık 30 dakikada bir
}

function surumKontrolBaslat() {
  if (SURUM.timer) clearInterval(SURUM.timer);
  surumKaydet();
  surumKontrol();
  SURUM.timer = setInterval(surumKontrol, SURUM_KONTROL_MS);
  if (!SURUM.dinleyici) {
    SURUM.dinleyici = true;
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && Date.now() - SURUM.sonKontrol > SURUM_KONTROL_MS) surumKontrol();
    });
  }
}

function _surumTarayici(ua) {
  ua = String(ua || '');
  const mobil = /Mobile|Android|iPhone|iPad/i.test(ua) ? ' (mobil)' : '';
  if (/Edg\//.test(ua)) return 'Edge' + mobil;
  if (/OPR\//.test(ua)) return 'Opera' + mobil;
  if (/Firefox\//.test(ua)) return 'Firefox' + mobil;
  if (/Chrome\//.test(ua)) return 'Chrome' + mobil;
  if (/Safari\//.test(ua)) return 'Safari' + mobil;
  return ua ? 'Diğer' : '-';
}

// Admin Panel > Kullanıcı Sürümleri
async function surumListeAc() {
  const el = document.getElementById('surumListesi');
  if (!el) return;
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const guncel = (await surumSunucuOku()) || APP_VERSION;
  const sonuc = await Promise.all([
    sb.from('kullanici_surum').select('my_id,ad_soyad,surum,son_gorulme,tarayici'),
    sb.from('users').select('my_id,ad_soyad,yetki_seviyesi,kcm_adi,is_sanal').eq('aktif', true)
  ]);
  if (sonuc[0].error || sonuc[1].error) {
    const msg = (sonuc[0].error || sonuc[1].error).message;
    el.innerHTML = '<div class="empty" style="color:var(--red);">Yüklenemedi: ' + escapeHTML(msg) + '</div>';
    return;
  }
  const kayit = {};
  (sonuc[0].data || []).forEach(function (k) { kayit[k.my_id] = k; });
  const satirlar = (sonuc[1].data || []).filter(function (u) { return !u.is_sanal; }).map(function (u) {
    const k = kayit[u.my_id];
    let durum = 'kayit_yok';
    if (k) durum = (k.surum === guncel) ? 'guncel' : 'eski';
    return { u: u, k: k, durum: durum };
  });
  const sira = { eski: 0, kayit_yok: 1, guncel: 2 };
  satirlar.sort(function (a, b) {
    return (sira[a.durum] - sira[b.durum]) || String(a.u.ad_soyad).localeCompare(String(b.u.ad_soyad), 'tr');
  });
  const say = { guncel: 0, eski: 0, kayit_yok: 0 };
  satirlar.forEach(function (s) { say[s.durum]++; });

  const TH = 'padding:6px 8px;border:1px solid var(--border);text-align:left;font-size:11px;background:var(--navy3);white-space:nowrap;';
  const TD = 'padding:6px 8px;border:1px solid var(--border);font-size:12px;';
  const renk = { guncel: 'var(--green)', eski: 'var(--red)', kayit_yok: 'var(--amber)' };
  const etiket = { guncel: 'Güncel', eski: 'Eski sürüm', kayit_yok: 'Kayıt yok' };

  let h = '<div style="font-size:12px;color:var(--text2);margin-bottom:10px;">Güncel sürüm: <b>' + escapeHTML(guncel) + '</b>. ' +
    'Sürüm, kullanıcı uygulamayı her açtığında kaydedilir. "Kayıt yok": takip başladığından beri hiç açmamış.</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
    '<div class="summary-box"><div class="summary-val" style="color:var(--green);">' + say.guncel + '</div><div class="summary-label">Güncel</div></div>' +
    '<div class="summary-box"><div class="summary-val" style="color:var(--red);">' + say.eski + '</div><div class="summary-label">Eski sürüm</div></div>' +
    '<div class="summary-box"><div class="summary-val" style="color:var(--amber);">' + say.kayit_yok + '</div><div class="summary-label">Kayıt yok</div></div></div>' +
    '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr>' +
    '<th style="' + TH + '">Kullanıcı</th><th style="' + TH + '">Rol</th><th style="' + TH + '">KÇM</th>' +
    '<th style="' + TH + '">Sürüm</th><th style="' + TH + '">Son görülme</th><th style="' + TH + '">Tarayıcı</th>' +
    '<th style="' + TH + '">Durum</th></tr></thead><tbody>' +
    satirlar.map(function (s) {
      const son = s.k && s.k.son_gorulme ? new Date(s.k.son_gorulme).toLocaleString('tr-TR') : '-';
      return '<tr><td style="' + TD + '">' + escapeHTML(s.u.ad_soyad || '') + '</td>' +
        '<td style="' + TD + '">' + escapeHTML(s.u.yetki_seviyesi || '') + '</td>' +
        '<td style="' + TD + '">' + escapeHTML(s.u.kcm_adi || '') + '</td>' +
        '<td style="' + TD + '">' + escapeHTML(s.k ? (s.k.surum || '-') : '-') + '</td>' +
        '<td style="' + TD + '">' + escapeHTML(son) + '</td>' +
        '<td style="' + TD + '">' + escapeHTML(s.k ? _surumTarayici(s.k.tarayici) : '-') + '</td>' +
        '<td style="' + TD + 'color:' + renk[s.durum] + ';font-weight:700;">' + etiket[s.durum] + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div style="margin-top:12px;"><button class="btn btn-sm" onclick="surumListeAc()">Yenile</button></div>';
  el.innerHTML = h;
}
