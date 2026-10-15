// ============================================================
// gorev_toplu.js — v1.0.0
// Son guncelleme: 2026-10-15
// Degisiklikler:
//   v1.0.0 — (V31.191) YENI MODUL: Veri Yonetimi > "Toplu Gorev" sekmesi.
//     Excel/CSV ile toplu gorev atamasi. Dosya kolonlari: KCM Adi, Gorev Tipi,
//     NCST, MY ID, Gorev Aciklamasi (+ istege bagli: MY Adi, Termin, Baslik).
//     Excel te bos veya karsiligi olmayan KCM / gorev tipi / aciklama / termin
//     ekrandaki ortak degerlerden doldurulur, satir bazinda elle duzeltilebilir.
//     Akis (Cagri Merkezi lead yuklemesi ve Veri Yonetimi sekmeleriyle ayni):
//       sablon indir -> dosya oku -> kolon esleme -> ANALIZ (hicbir kayit yazilmaz)
//       -> onizleme (yazilacak / uyari / mukerrer / hata) -> onayla ve yaz
//       -> detayli rapor Excel (otomatik iner).
//     Kurallar: MY ID bos ise musterinin portfoy MY sine atanir; KCM belirtilmisse
//       MY o KCM de olmali (celiski = hata); acik gorev varsa (ayni NCST + gorev
//       tipi + MY) satir ATLANIR; dosyada tekrar eden satir atlanir; sistemde
//       olmayan NCST yazilmaz (hata). Gorevler "Atandi" durumunda acilir; MY nin
//       Gorevler rozetindeki bekleyen gorev sayisi kendiliginden artar.
//     Ek ozellikler: MY basina yuk dagilimi (esik asilirsa uyari), hatali satirlari
//       duzeltilip tekrar yuklenebilir Excel olarak indirme, her yuklemeye PARTI
//       numarasi (gorev gecmisine yazilir), "Son yuklemeler" listesi ve baslamamis
//       gorevleri toplu IPTAL (geri alma), cift tiklama korumasi, parca parca
//       yazma, veri cikis izi (denetim).
//     Yetki: gorev_toplu_ata (Rol ve Yetki > Yonetim) + veri_yonetimi ekrani.
// Bagimlilik: sb, currentUser, hasPerm, toast, escapeHTML, ensureXLSX (rapor.js),
//   veriCikisiKaydet (denetim.js), veriyonetimi.js (vyTab ile sekme acilir).
// ============================================================
'use strict';

const GT_KAPALI = ['Tamamlandı', 'Reddedildi', 'İptal'];
const GT_SAYFA = 100;
const GT_YUK_ESIK = 25;          // bir MY ye tek yuklemede bu sayidan fazla gorev giderse uyari
const GT_PARCA = 100;            // yazma parca boyu
const GT_TERMIN_SECENEK = [0, 1, 2, 3, 5, 7, 10, 15, 20, 30];

const GT = {
  hazir: false,
  tipler: [], kullanicilar: [], kcmler: [], tatil: {},
  ayar: { kcmId: '', tipId: '', aciklama: '', terminGun: 3, portfoyMY: true },
  dosyaAd: '', basliklar: [], satirlar: [], esleme: [],
  kayitlar: [], sonuc: null, sec: {}, filtre: 'tum', sayfa: 0, duzelt: null,
  busy: false, done: false, parti: '', gecmis: [], iptalOnay: ''
};

const GT_ALAN = [
  ['kcm', 'KÇM Adı'], ['tip', 'Görev Tipi'], ['ncst', 'NCST'], ['myId', 'MY ID'],
  ['myAd', 'MY Adı (MY ID yoksa)'], ['aciklama', 'Görev Açıklaması'],
  ['termin', 'Termin (isteğe bağlı)'], ['baslik', 'Başlık (isteğe bağlı)']
];
const GT_SOZLUK = {
  'KCM ADI': 'kcm', 'KCM': 'kcm', 'KCM ISMI': 'kcm',
  'GOREV TIPI': 'tip', 'GOREV TURU': 'tip', 'TIP': 'tip',
  'NCST': 'ncst',
  'MY ID': 'myId', 'MYID': 'myId', 'MY NO': 'myId',
  'MY ADI': 'myAd', 'MY AD SOYAD': 'myAd', 'AD SOYAD': 'myAd', 'ATANAN': 'myAd', 'MY': 'myAd',
  'GOREV ACIKLAMASI': 'aciklama', 'ACIKLAMA': 'aciklama', 'GOREV ACIKLAMA': 'aciklama',
  'TERMIN': 'termin', 'DEADLINE': 'termin', 'SON TARIH': 'termin', 'BITIS TARIHI': 'termin',
  'BASLIK': 'baslik', 'GOREV BASLIGI': 'baslik'
};

/* ============================================================
   1) SAF YARDIMCILAR (test edilebilir)
   ============================================================ */
function _gtNorm(s) {
  return String(s == null ? '' : s)
    .replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g').replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o').replace(/Ç/g, 'C').replace(/ç/g, 'c')
    .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}
function gtNcstNorm(v) {
  let s = String(v == null ? '' : v).trim().replace(/\s+/g, '');
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
  return s;
}
function _gtBugun() { return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10); }
function _gtGunEkle(str, n) {
  const d = new Date(str + 'T00:00:00Z');
  return new Date(d.getTime() + n * 86400000).toISOString().slice(0, 10);
}
function _gtGercekTarih(y, m, d) {
  if (!(y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.toISOString().slice(0, 10);
}
// Excel termin degerini YYYY-MM-DD ye cevirir. Tek sayili tarihler GUN/AY/YIL okunur.
function gtTarihParse(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return _gtGercekTarih(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return _gtGercekTarih(y, +m[2], +m[1]); }
  if (/^\d{5}$/.test(s)) {            // Excel seri numarasi
    const t = new Date(Date.UTC(1899, 11, 30) + (+s) * 86400000);
    return t.toISOString().slice(0, 10);
  }
  return null;
}
// bugunden itibaren n is gunu sonrasi (hafta sonu ve tam gun resmi tatil haric)
function gtIsGunuEkle(n, bugun, tatil) {
  let d = bugun, kalan = n;
  while (kalan > 0) {
    d = _gtGunEkle(d, 1);
    const dow = new Date(d + 'T00:00:00Z').getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (tatil && tatil[d] === 'tam') continue;
    kalan--;
  }
  return d;
}

// Tek satiri cozer. h: ham kayit, c: baglam. Veri yazmaz.
function gtCozumle(h, c) {
  const r = { satir: h.satir, h: h, ncst: '', unvan: '', tip: null, kcm: null, my: null, myKaynak: '',
              aciklama: '', baslik: '', deadline: null, hata: [], uyari: [], atla: '', durum: 'ok' };
  const ov = h.ov || {};

  // --- NCST ---
  r.ncst = gtNcstNorm(h.ncst);
  let cust = null;
  if (r.ncst) {
    cust = c.musteri[r.ncst] || null;
    if (!cust) r.hata.push('NCST sistemde yok');
    else {
      r.unvan = cust.unvan || '';
      if (cust.aktif === false) r.uyari.push('Müşteri pasif');
    }
  }

  // --- Gorev tipi ---
  if (ov.tipId && c.tipById[String(ov.tipId)]) r.tip = c.tipById[String(ov.tipId)];
  else if (_gtNorm(h.tipAd)) {
    r.tip = c.tipByNorm[_gtNorm(h.tipAd)] || null;
    if (!r.tip) {
      if (c.ayar.tipId && c.tipById[String(c.ayar.tipId)]) {
        r.tip = c.tipById[String(c.ayar.tipId)];
        r.uyari.push('Görev tipi eşleşmedi ("' + h.tipAd + '"), ortak seçim kullanıldı');
      } else r.hata.push('Görev tipi eşleşmedi: ' + h.tipAd);
    }
  } else if (c.ayar.tipId && c.tipById[String(c.ayar.tipId)]) r.tip = c.tipById[String(c.ayar.tipId)];
  else r.hata.push('Görev tipi yok (Excel boş, ortak seçim yok)');

  // --- KCM (Excel > ortak secim) ---
  let kcmKaynak = '';
  if (_gtNorm(h.kcmAd)) {
    r.kcm = c.kcmByNorm[_gtNorm(h.kcmAd)] || null;
    if (r.kcm) kcmKaynak = 'excel';
    else if (c.ayar.kcmId && c.kcmById[String(c.ayar.kcmId)]) {
      r.kcm = c.kcmById[String(c.ayar.kcmId)]; kcmKaynak = 'ortak';
      r.uyari.push('KÇM eşleşmedi ("' + h.kcmAd + '"), ortak seçim kullanıldı');
    } else r.hata.push('KÇM eşleşmedi: ' + h.kcmAd);
  } else if (c.ayar.kcmId && c.kcmById[String(c.ayar.kcmId)]) { r.kcm = c.kcmById[String(c.ayar.kcmId)]; kcmKaynak = 'ortak'; }

  // --- MY ---
  let u = null;
  if (ov.myId && c.kullanici[String(ov.myId)]) { u = c.kullanici[String(ov.myId)]; r.myKaynak = 'elle seçildi'; }
  else if (String(h.myId == null ? '' : h.myId).trim() !== '') {
    const id = String(h.myId).trim().replace(/\.0+$/, '');
    u = c.kullanici[id] || null;
    if (u) r.myKaynak = 'Excel';
    else r.hata.push('MY ID geçersiz veya pasif: ' + h.myId);
  } else if (_gtNorm(h.myAd)) {
    const aday = c.kullaniciAd[_gtNorm(h.myAd)] || [];
    if (aday.length === 1) { u = aday[0]; r.myKaynak = 'Excel (ad)'; }
    else if (aday.length > 1) r.hata.push('MY adı birden fazla kişiyle eşleşti: ' + h.myAd);
    else r.hata.push('MY adı eşleşmedi: ' + h.myAd);
  } else if (c.ayar.portfoyMY && cust && cust.my_id != null) {
    u = c.kullanici[String(cust.my_id)] || null;
    if (u) r.myKaynak = 'portföy sahibi';
    else r.hata.push('Portföy MY si pasif veya bulunamadı (my_id ' + cust.my_id + ')');
  } else if (!r.ncst || cust) {
    r.hata.push('MY belirlenemedi (MY ID boş' + (c.ayar.portfoyMY ? ', portföy MY si yok' : '') + ')');
  }
  r.my = u;

  // --- KCM / MY tutarliligi ---
  if (u) {
    if (r.kcm && String(r.kcm.kcm_id) !== String(u.kcm_id)) {
      r.hata.push('KÇM-MY çelişkisi: ' + u.ad_soyad + ' ' + (u.kcm_adi || ('KÇM ' + u.kcm_id)) + ' ekibinde, seçilen KÇM: ' + r.kcm.ad +
        (kcmKaynak === 'ortak' ? ' (ortak seçim)' : ''));
    } else if (!r.kcm) r.kcm = { kcm_id: u.kcm_id, ad: u.kcm_adi || ('KÇM ' + u.kcm_id) };
    if (cust && cust.my_id != null && String(cust.my_id) !== String(u.my_id)) r.uyari.push('MY, müşterinin portföy sahibinden farklı');
    if (cust && cust.kcm_id != null && String(cust.kcm_id) !== String(u.kcm_id)) r.uyari.push('Müşteri başka KÇM de (KÇM ' + cust.kcm_id + ')');
  }

  // --- Aciklama / baslik ---
  r.aciklama = (ov.aciklama != null && String(ov.aciklama).trim() !== '') ? String(ov.aciklama).trim()
             : (String(h.aciklama == null ? '' : h.aciklama).trim() || c.ayar.aciklama || '');
  if (!r.aciklama) r.hata.push('Görev açıklaması yok (Excel boş, ortak metin yok)');
  const bas = String(h.baslik == null ? '' : h.baslik).trim();
  r.baslik = (bas || ((r.tip ? r.tip.tip_adi : 'Görev') + ' — ' + (r.unvan || r.ncst || 'Genel'))).slice(0, 200);

  // --- Termin ---
  const tstr = String(h.termin == null ? '' : h.termin).trim();
  if (tstr) {
    const t = gtTarihParse(tstr);
    if (!t) r.hata.push('Termin okunamadı: ' + tstr + ' (GG.AA.YYYY veya YYYY-AA-GG)');
    else if (t < c.bugun) r.hata.push('Termin geçmişte: ' + t);
    else r.deadline = t;
  } else if (c.ayar.terminGun > 0) r.deadline = gtIsGunuEkle(c.ayar.terminGun, c.bugun, c.tatil);

  r.durum = r.hata.length ? 'hata' : (r.uyari.length ? 'uyari' : 'ok');
  return r;
}

// Tum satirlari cozer, mukerrerleri isaretler (acik gorev + dosyada tekrar)
function gtCozumleTum(kayitlar, c) {
  const gorulen = {};
  return kayitlar.map(function (h) {
    const r = gtCozumle(h, c);
    if (r.durum !== 'hata' && r.ncst && r.tip && r.my) {
      const anahtar = r.ncst + '|' + r.tip.type_id + '|' + r.my.my_id;
      if (c.acik[anahtar]) { r.atla = 'Mükerrer: açık görev #' + c.acik[anahtar]; r.durum = 'atla'; }
      else if (gorulen[anahtar]) { r.atla = 'Dosyada tekrar (satır ' + gorulen[anahtar] + ')'; r.durum = 'atla'; }
      else gorulen[anahtar] = r.satir;
    }
    return r;
  });
}

/* ============================================================
   2) VERI YUKLEME
   ============================================================ */
async function _gtSayfala(kur) {
  const out = [];
  let from = 0;
  for (;;) {
    const r = await kur().range(from, from + 999);
    if (r.error) throw r.error;
    const d = r.data || [];
    for (let i = 0; i < d.length; i++) out.push(d[i]);
    if (d.length < 1000) break;
    from += 1000;
  }
  return out;
}
function _gtParcala(arr, n) { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }

async function gtRefYukle() {
  const t = await sb.from('task_types').select('type_id,tip_adi,bagli_form,sira').eq('aktif', true).order('sira');
  if (t.error) throw t.error;
  GT.tipler = t.data || [];
  GT.kullanicilar = await _gtSayfala(function () {
    return sb.from('users').select('my_id,ad_soyad,kcm_id,kcm_adi,yetki_seviyesi,ext_kod,is_sanal')
      .eq('aktif', true).order('my_id');
  });
  GT.kullanicilar = GT.kullanicilar.filter(function (u) { return !u.is_sanal; });
  const km = {};
  GT.kullanicilar.forEach(function (u) {
    if (u.kcm_id == null) return;
    if (!km[u.kcm_id]) km[u.kcm_id] = { kcm_id: u.kcm_id, ad: u.kcm_adi || ('KÇM ' + u.kcm_id) };
    else if (u.kcm_adi && km[u.kcm_id].ad.indexOf('KÇM ') === 0) km[u.kcm_id].ad = u.kcm_adi;
  });
  GT.kcmler = Object.keys(km).map(function (k) { return km[k]; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
  try {
    const bugun = _gtBugun();
    const r = await sb.from('resmi_tatiller').select('tarih,yarim_gun').gte('tarih', bugun).lte('tarih', _gtGunEkle(bugun, 120));
    GT.tatil = {};
    (r.data || []).forEach(function (x) { GT.tatil[String(x.tarih).slice(0, 10)] = x.yarim_gun ? 'yarim' : 'tam'; });
  } catch (e) { GT.tatil = {}; }
  GT.hazir = true;
}

function gtCtxKur(musteriSatirlari, acikGorevler) {
  const c = { bugun: _gtBugun(), ayar: GT.ayar, tatil: GT.tatil, tipByNorm: {}, tipById: {}, kcmByNorm: {}, kcmById: {},
              kullanici: {}, kullaniciAd: {}, musteri: {}, acik: {} };
  GT.tipler.forEach(function (t) { c.tipByNorm[_gtNorm(t.tip_adi)] = t; c.tipById[String(t.type_id)] = t; });
  GT.kcmler.forEach(function (k) { c.kcmByNorm[_gtNorm(k.ad)] = k; c.kcmById[String(k.kcm_id)] = k; });
  GT.kullanicilar.forEach(function (u) {
    c.kullanici[String(u.my_id)] = u;
    const n = _gtNorm(u.ad_soyad);
    (c.kullaniciAd[n] = c.kullaniciAd[n] || []).push(u);
  });
  (musteriSatirlari || []).forEach(function (m) { c.musteri[String(m.ncst)] = m; });
  (acikGorevler || []).forEach(function (t) { c.acik[String(t.ncst) + '|' + t.type_id + '|' + t.atanan_id] = t.task_id; });
  return c;
}

async function _gtMusteriVeAcik(ncstler) {
  const tekil = Array.from(new Set(ncstler.filter(Boolean)));
  const musteri = [], acik = [];
  const parcalar = _gtParcala(tekil, 100);
  for (let i = 0; i < parcalar.length; i++) {
    const p = parcalar[i];
    const m = await sb.from('customers').select('ncst,unvan,my_id,kcm_id,aktif').in('ncst', p);
    if (m.error) throw m.error;
    (m.data || []).forEach(function (x) { musteri.push(x); });
    const a = await sb.from('tasks').select('task_id,ncst,type_id,atanan_id,durum').in('ncst', p)
      .not('durum', 'in', '("Tamamlandı","Reddedildi","İptal")');
    if (a.error) throw a.error;
    if ((a.data || []).length >= 1000) console.warn('[gorev_toplu] acik gorev parcasi 1000 satira ulasti, mukerrer kontrolu eksik olabilir');
    (a.data || []).forEach(function (x) { acik.push(x); });
  }
  return { musteri: musteri, acik: acik };
}

/* ============================================================
   3) EKRAN
   ============================================================ */
const _GT_INP = 'background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px 10px;font-size:13px;';
function _gtKart(icerik, ekstra) {
  return '<div style="background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px;' + (ekstra || '') + '">' + icerik + '</div>';
}

async function gtInit() {
  const box = document.getElementById('vyGorevPanel');
  if (!box) return;
  if (!hasPerm('gorev_toplu_ata')) {
    box.innerHTML = _gtKart('<div style="font-size:13px;">Bu bölüm için <b>gorev_toplu_ata</b> yetkisi gerekir. Rol ve Yetki ekranından verilebilir.</div>');
    return;
  }
  box.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try { if (!GT.hazir) await gtRefYukle(); }
  catch (e) { box.innerHTML = _gtKart('<div style="color:#ff6b6b;font-size:13px;">Referans veriler yüklenemedi: ' + escapeHTML(e.message || String(e)) + '</div>'); return; }
  GT.busy = false; GT.done = false;
  GT.kayitlar = []; GT.sonuc = null; GT.sec = {}; GT.dosyaAd = ''; GT.basliklar = []; GT.satirlar = []; GT.esleme = [];
  const kcmOpt = '<option value="">(seçilmedi)</option>' + GT.kcmler.map(function (k) { return '<option value="' + k.kcm_id + '">' + escapeHTML(k.ad) + '</option>'; }).join('');
  const tipOpt = '<option value="">(seçilmedi)</option>' + GT.tipler.map(function (t) { return '<option value="' + t.type_id + '">' + escapeHTML(t.tip_adi) + '</option>'; }).join('');
  const terOpt = GT_TERMIN_SECENEK.map(function (n) { return '<option value="' + n + '"' + (n === 3 ? ' selected' : '') + '>' + (n === 0 ? 'Termin yok' : n + ' iş günü') + '</option>'; }).join('');
  box.innerHTML =
    _gtKart('<div style="font-weight:700;margin-bottom:6px;">1. Şablon</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:10px;">Kolonlar: <b>KÇM Adı, Görev Tipi, NCST, MY ID, Görev Açıklaması</b> (isteğe bağlı: MY Adı, Termin, Başlık). ' +
      'Şablonun "Listeler" sayfasında geçerli görev tipleri, KÇM adları ve MY ID listesi vardır.</div>' +
      '<button class="btn" onclick="gtSablonIndir()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">Boş şablonu indir</button>') +
    _gtKart('<div style="font-weight:700;margin-bottom:6px;">2. Ortak değerler</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:10px;">Excel te boş veya karşılığı bulunamayan alanlar buradan doldurulur. KÇM seçerseniz her satırdaki MY o KÇM de olmalıdır.</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">' +
      '<div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;">KÇM</div><select id="gtAyKcm" style="width:100%;' + _GT_INP + '">' + kcmOpt + '</select></div>' +
      '<div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;">Görev tipi</div><select id="gtAyTip" style="width:100%;' + _GT_INP + '">' + tipOpt + '</select></div>' +
      '<div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;">Termin (Excel te yoksa)</div><select id="gtAyTermin" style="width:100%;' + _GT_INP + '">' + terOpt + '</select></div>' +
      '</div>' +
      '<div style="margin-top:10px;"><div style="font-size:11px;color:var(--text2);margin-bottom:3px;">Ortak görev açıklaması (Excel te boşsa)</div>' +
      '<textarea id="gtAyAciklama" rows="2" style="width:100%;' + _GT_INP + '"></textarea></div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12px;"><input type="checkbox" id="gtAyPortfoy" checked> MY ID boşsa görevi müşterinin portföy MY sine ata</label>') +
    _gtKart('<div style="font-weight:700;margin-bottom:6px;">3. Dosya</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
      '<input type="file" id="gtFile" accept=".xlsx,.xls,.csv" onchange="gtDosyaSecildi()" style="font-size:13px;color:var(--text);"/>' +
      '<button id="gtOkuBtn" class="btn-primary" onclick="gtDosyaOku()" disabled style="padding:8px 16px;font-size:13px;">Dosyayı Oku</button></div>' +
      '<div id="gtInfo" style="font-size:13px;margin-top:8px;"></div>') +
    '<div id="gtEsleme"></div><div id="gtSonuc"></div><div id="gtGecmis"></div>';
  gtGecmisYukle();
}

function gtDosyaSecildi() {
  const fi = document.getElementById('gtFile'), b = document.getElementById('gtOkuBtn');
  if (b) b.disabled = !(fi && fi.files && fi.files.length);
}

async function gtSablonIndir() {
  if (!await ensureXLSX()) { toast('Excel kütüphanesi yüklenemedi', 'error'); return; }
  if (!GT.hazir) { try { await gtRefYukle(); } catch (e) { toast('Liste yüklenemedi', 'error'); return; } }
  const wb = XLSX.utils.book_new();
  const ana = [['KÇM Adı', 'Görev Tipi', 'NCST', 'MY ID', 'Görev Açıklaması', 'Termin', 'Başlık'],
               [GT.kcmler[0] ? GT.kcmler[0].ad : '', GT.tipler[0] ? GT.tipler[0].tip_adi : '', '1234567', '', 'Örnek açıklama', '', '']];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ana), 'Görevler');
  const liste = [['Görev Tipleri', '', 'KÇM Adları', '', 'MY ID', 'MY Adı', 'KÇM', 'Rol']];
  const n = Math.max(GT.tipler.length, GT.kcmler.length, GT.kullanicilar.length);
  const ku = GT.kullanicilar.slice().sort(function (a, b) { return String(a.ad_soyad).localeCompare(String(b.ad_soyad), 'tr'); });
  for (let i = 0; i < n; i++) {
    const u = ku[i];
    liste.push([GT.tipler[i] ? GT.tipler[i].tip_adi : '', '', GT.kcmler[i] ? GT.kcmler[i].ad : '', '',
                u ? u.my_id : '', u ? u.ad_soyad : '', u ? (u.kcm_adi || '') : '', u ? u.yetki_seviyesi : '']);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(liste), 'Listeler');
  const not = [['Notlar'], ['NCST ve (MY ID veya MY Adı) dışındaki kolonlar boş bırakılabilir; boşlar ekrandaki ortak değerlerle doldurulur.'],
               ['MY ID boşsa ve "portföy MY sine ata" açıksa görev müşterinin MY sine gider.'],
               ['Termin: GG.AA.YYYY veya YYYY-AA-GG. Boşsa ekrandaki iş günü kullanılır.'],
               ['Aynı NCST + görev tipi + MY için açık görev varsa satır atlanır.']];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(not), 'Notlar');
  XLSX.writeFile(wb, 'toplu_gorev_sablon.xlsx');
}

async function gtDosyaOku() {
  const fi = document.getElementById('gtFile');
  if (!fi || !fi.files || !fi.files.length) { toast('Önce dosya seçin', 'error'); return; }
  if (!await ensureXLSX()) { toast('Excel kütüphanesi yüklenemedi', 'error'); return; }
  const file = fi.files[0], ext = (file.name.split('.').pop() || '').toLowerCase();
  const info = document.getElementById('gtInfo'); if (info) info.textContent = 'Okunuyor...';
  try {
    let aoa;
    if (ext === 'csv') { const wb = XLSX.read(await file.text(), { type: 'string' }); aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false }); }
    else if (ext === 'xlsx' || ext === 'xls') { const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' }); aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false }); }
    else { toast('Sadece .xlsx, .xls veya .csv', 'error'); if (info) info.textContent = ''; return; }
    if (!aoa || !aoa.length) { toast('Dosya boş', 'error'); if (info) info.textContent = ''; return; }
    const basliklar = (aoa[0] || []).map(function (h) { return String(h == null ? '' : h).trim(); });
    const satirlar = [];
    for (let i = 1; i < aoa.length; i++) {
      const r = aoa[i];
      if (r.some(function (c) { return String(c == null ? '' : c).trim().length > 0; })) satirlar.push({ no: i + 1, v: r });
    }
    GT.dosyaAd = file.name; GT.basliklar = basliklar; GT.satirlar = satirlar;
    GT.esleme = basliklar.map(function (h) { return GT_SOZLUK[_gtNorm(h)] || ''; });
    GT.kayitlar = []; GT.sonuc = null; GT.sec = {}; GT.done = false; GT.duzelt = null;
    if (info) info.innerHTML = '<b>' + escapeHTML(file.name) + '</b> — ' + satirlar.length + ' satır, ' + basliklar.length + ' kolon.';
    document.getElementById('gtSonuc').innerHTML = '';
    gtEslemeCiz();
  } catch (e) { console.error(e); toast('Dosya okunamadı: ' + (e.message || e), 'error'); if (info) info.textContent = ''; }
}

function gtEslemeCiz() {
  const box = document.getElementById('gtEsleme'); if (!box) return;
  const opt = function (sel) {
    return '<option value="">(kullanma)</option>' + GT_ALAN.map(function (a) { return '<option value="' + a[0] + '"' + (sel === a[0] ? ' selected' : '') + '>' + escapeHTML(a[1]) + '</option>'; }).join('');
  };
  let h = '<div style="font-weight:700;margin-bottom:8px;">4. Kolon eşleme</div><div style="display:grid;grid-template-columns:1fr auto 1fr;gap:6px 10px;align-items:center;font-size:12px;">';
  GT.basliklar.forEach(function (b, i) {
    const ornek = GT.satirlar[0] ? String(GT.satirlar[0].v[i] == null ? '' : GT.satirlar[0].v[i]).slice(0, 30) : '';
    h += '<div><b>' + escapeHTML(b || ('Kolon ' + (i + 1))) + '</b><div style="color:var(--text3);font-size:11px;">' + escapeHTML(ornek) + '</div></div><div>→</div>' +
      '<select onchange="gtEslemeDegis(' + i + ',this.value)" style="' + _GT_INP + '">' + opt(GT.esleme[i]) + '</select>';
  });
  h += '</div><button class="btn-primary" onclick="gtAnaliz()" style="margin-top:12px;padding:9px 18px;font-size:13px;">Analiz Et (kayıt yapılmaz)</button>';
  box.innerHTML = _gtKart(h);
}
function gtEslemeDegis(i, v) { GT.esleme[i] = v; }

function gtAyarOku() {
  const v = function (id) { const e = document.getElementById(id); return e ? e.value : ''; };
  const pm = document.getElementById('gtAyPortfoy');
  GT.ayar = { kcmId: v('gtAyKcm'), tipId: v('gtAyTip'), aciklama: v('gtAyAciklama').trim(), terminGun: parseInt(v('gtAyTermin'), 10) || 0, portfoyMY: pm ? pm.checked : true };
}

function _gtKayitlariKur() {
  const idx = {};
  GT.esleme.forEach(function (a, i) { if (a && idx[a] === undefined) idx[a] = i; });
  const al = function (r, a) { return idx[a] === undefined ? '' : r[idx[a]]; };
  const eski = {};
  GT.kayitlar.forEach(function (k) { eski[k.satir] = k.ov; });
  return GT.satirlar.map(function (s) {
    return { satir: s.no, ncst: al(s.v, 'ncst'), kcmAd: al(s.v, 'kcm'), tipAd: al(s.v, 'tip'), myId: al(s.v, 'myId'), myAd: al(s.v, 'myAd'),
             aciklama: al(s.v, 'aciklama'), termin: al(s.v, 'termin'), baslik: al(s.v, 'baslik'), ov: eski[s.no] || {} };
  });
}

async function gtAnaliz() {
  if (!hasPerm('gorev_toplu_ata')) { toast('Yetkiniz yok', 'error'); return; }
  if (GT.busy) return;
  if (GT.esleme.indexOf('ncst') < 0) { toast('NCST kolonu eşlenmeli', 'error'); return; }
  if (GT.esleme.indexOf('myId') < 0 && GT.esleme.indexOf('myAd') < 0 && !document.getElementById('gtAyPortfoy').checked) {
    toast('MY ID / MY Adı kolonu yok: "portföy MY sine ata" açık olmalı', 'error'); return;
  }
  gtAyarOku();
  GT.kayitlar = _gtKayitlariKur();
  GT.done = false; GT.duzelt = null; GT.sec = {}; GT.filtre = 'tum'; GT.sayfa = 0;
  const el = document.getElementById('gtSonuc');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div><div style="text-align:center;font-size:12px;color:var(--text2);">Müşteri ve açık görevler kontrol ediliyor...</div>';
  try {
    const d = await _gtMusteriVeAcik(GT.kayitlar.map(function (k) { return gtNcstNorm(k.ncst); }));
    GT._musteri = d.musteri; GT._acik = d.acik;
  } catch (e) { console.error(e); el.innerHTML = _gtKart('<div style="color:#ff6b6b;font-size:13px;">Kontrol başarısız: ' + escapeHTML(e.message || String(e)) + '</div>'); return; }
  gtYenidenCozumle(true);
}

function gtYenidenCozumle(ilk) {
  GT.ctx = gtCtxKur(GT._musteri, GT._acik);
  GT.sonuc = gtCozumleTum(GT.kayitlar, GT.ctx);
  const yeniSec = {};
  GT.sonuc.forEach(function (r) {
    const yazilir = (r.durum === 'ok' || r.durum === 'uyari');
    if (yazilir && (ilk || GT.sec[r.satir] !== false)) yeniSec[r.satir] = true;
    else if (yazilir) yeniSec[r.satir] = false;
  });
  GT.sec = yeniSec;
  gtSonucCiz();
}

function _gtYazilacaklar() {
  return (GT.sonuc || []).filter(function (r) { return (r.durum === 'ok' || r.durum === 'uyari') && GT.sec[r.satir]; });
}

const _GT_DURUM = {
  ok: { ad: 'Yazılacak', renk: '#34d399' }, uyari: { ad: 'Uyarı', renk: '#fbbf24' },
  atla: { ad: 'Atlanacak', renk: '#9ca3af' }, hata: { ad: 'Hata', renk: '#ff6b6b' }
};

function gtFiltre(f) { GT.filtre = f; GT.sayfa = 0; gtSonucCiz(); }
function gtSayfaGit(d) {
  const n = Math.max(1, Math.ceil(_gtGorunen().length / GT_SAYFA));
  GT.sayfa = Math.min(n - 1, Math.max(0, GT.sayfa + d)); gtSonucCiz();
}
function _gtGorunen() {
  return (GT.sonuc || []).filter(function (r) { return GT.filtre === 'tum' || r.durum === GT.filtre; });
}
function gtSecimToggle(satir, el) { GT.sec[satir] = !!el.checked; gtSonucCiz(); }
function gtSecimTumu(durum) {
  _gtGorunen().forEach(function (r) { if (r.durum === 'ok' || r.durum === 'uyari') GT.sec[r.satir] = !!durum; });
  gtSonucCiz();
}

function gtSonucCiz() {
  const el = document.getElementById('gtSonuc'); if (!el || !GT.sonuc) return;
  const say = { ok: 0, uyari: 0, atla: 0, hata: 0 };
  GT.sonuc.forEach(function (r) { say[r.durum]++; });
  const yaz = _gtYazilacaklar();
  const kutu = function (f, ad, n, renk) {
    return '<div onclick="gtFiltre(\'' + f + '\')" style="cursor:pointer;flex:1 1 110px;padding:10px;border-radius:10px;border:1px solid ' + (GT.filtre === f ? renk : 'var(--line)') + ';background:var(--bg2);text-align:center;">' +
      '<div style="font-size:20px;font-weight:800;color:' + renk + ';">' + n + '</div><div style="font-size:11px;color:var(--text2);">' + ad + '</div></div>';
  };
  let h = '<div style="font-weight:700;margin-bottom:8px;">5. Analiz sonucu <span style="font-weight:400;color:var(--text2);font-size:12px;">(henüz hiçbir kayıt yapılmadı)</span></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
    kutu('tum', 'Toplam satır', GT.sonuc.length, 'var(--text)') + kutu('ok', 'Yazılacak', say.ok, '#34d399') + kutu('uyari', 'Uyarılı (yazılır)', say.uyari, '#fbbf24') +
    kutu('atla', 'Atlanacak (mükerrer)', say.atla, '#9ca3af') + kutu('hata', 'Hatalı', say.hata, '#ff6b6b') + '</div>';

  // MY basina yuk dagilimi (secili satirlar)
  const yuk = {};
  yaz.forEach(function (r) { const k = r.my.my_id; yuk[k] = yuk[k] || { my: r.my, n: 0 }; yuk[k].n++; });
  const yukListe = Object.keys(yuk).map(function (k) { return yuk[k]; }).sort(function (a, b) { return b.n - a.n; });
  const asan = yukListe.filter(function (x) { return x.n > GT_YUK_ESIK; });
  h += '<details ' + (asan.length ? 'open' : '') + ' style="margin-bottom:12px;"><summary style="cursor:pointer;font-size:12px;color:var(--text2);">MY başına yük dağılımı (' + yukListe.length + ' kişi' +
    (asan.length ? ', <span style="color:#fbbf24;">' + asan.length + ' kişide ' + GT_YUK_ESIK + ' üzeri</span>' : '') + ')</summary>' +
    '<div style="max-height:220px;overflow:auto;margin-top:6px;"><table style="width:100%;font-size:12px;border-collapse:collapse;">' +
    yukListe.map(function (x) {
      return '<tr><td style="padding:3px 6px;">' + escapeHTML(x.my.ad_soyad) + ' <span style="color:var(--text3);">' + escapeHTML(x.my.kcm_adi || '') + '</span></td><td style="padding:3px 6px;text-align:right;' +
        (x.n > GT_YUK_ESIK ? 'color:#fbbf24;font-weight:700;' : '') + '">' + x.n + (x.n > GT_YUK_ESIK ? ' (yüksek)' : '') + '</td></tr>';
    }).join('') + '</table></div></details>';

  const liste = _gtGorunen();
  const sayfaSayisi = Math.max(1, Math.ceil(liste.length / GT_SAYFA));
  if (GT.sayfa >= sayfaSayisi) GT.sayfa = sayfaSayisi - 1;
  const dilim = liste.slice(GT.sayfa * GT_SAYFA, (GT.sayfa + 1) * GT_SAYFA);

  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;font-size:12px;">' +
    '<button class="btn" onclick="gtSecimTumu(true)" style="padding:5px 10px;border-radius:7px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">Görünenleri seç</button>' +
    '<button class="btn" onclick="gtSecimTumu(false)" style="padding:5px 10px;border-radius:7px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">Seçimi kaldır</button>' +
    '<button class="btn" onclick="gtHataExcel()" style="padding:5px 10px;border-radius:7px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">Hatalı/atlanan satırları Excel indir</button>' +
    '<span style="color:var(--text2);">' + liste.length + ' satır · sayfa ' + (GT.sayfa + 1) + '/' + sayfaSayisi + '</span>' +
    '<button class="btn" onclick="gtSayfaGit(-1)" style="padding:4px 9px;border-radius:7px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">‹</button>' +
    '<button class="btn" onclick="gtSayfaGit(1)" style="padding:4px 9px;border-radius:7px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">›</button></div>';

  h += '<div style="overflow-x:auto;"><table style="width:100%;font-size:12px;border-collapse:collapse;min-width:900px;"><thead><tr style="color:var(--text2);text-align:left;">' +
    '<th style="padding:6px;"></th><th style="padding:6px;">Satır</th><th style="padding:6px;">NCST / Unvan</th><th style="padding:6px;">Görev tipi</th><th style="padding:6px;">KÇM</th>' +
    '<th style="padding:6px;">MY</th><th style="padding:6px;">Termin</th><th style="padding:6px;">Açıklama</th><th style="padding:6px;">Durum</th><th style="padding:6px;"></th></tr></thead><tbody>';
  dilim.forEach(function (r) {
    const d = _GT_DURUM[r.durum];
    const yazilir = (r.durum === 'ok' || r.durum === 'uyari');
    const mesaj = r.durum === 'atla' ? [r.atla] : r.hata.concat(r.uyari);
    h += '<tr style="border-top:1px solid var(--line);vertical-align:top;">' +
      '<td style="padding:6px;">' + (yazilir ? '<input type="checkbox" ' + (GT.sec[r.satir] ? 'checked' : '') + ' onchange="gtSecimToggle(' + r.satir + ',this)">' : '') + '</td>' +
      '<td style="padding:6px;">' + r.satir + '</td>' +
      '<td style="padding:6px;">' + escapeHTML(r.ncst || '-') + '<div style="color:var(--text3);">' + escapeHTML(r.unvan) + '</div></td>' +
      '<td style="padding:6px;">' + escapeHTML(r.tip ? r.tip.tip_adi : '-') + '</td>' +
      '<td style="padding:6px;">' + escapeHTML(r.kcm ? r.kcm.ad : '-') + '</td>' +
      '<td style="padding:6px;">' + (r.my ? escapeHTML(r.my.ad_soyad) + '<div style="color:var(--text3);">#' + r.my.my_id + ' · ' + escapeHTML(r.myKaynak) + '</div>' : '-') + '</td>' +
      '<td style="padding:6px;">' + escapeHTML(r.deadline || '-') + '</td>' +
      '<td style="padding:6px;max-width:220px;">' + escapeHTML((r.aciklama || '').slice(0, 80)) + '</td>' +
      '<td style="padding:6px;"><span style="color:' + d.renk + ';font-weight:700;">' + d.ad + '</span>' +
      (mesaj.length ? '<div style="color:var(--text2);">' + mesaj.map(escapeHTML).join('<br>') + '</div>' : '') + '</td>' +
      '<td style="padding:6px;">' + ((r.durum === 'hata' || r.durum === 'uyari') ? '<button class="btn" onclick="gtDuzeltAc(' + r.satir + ')" style="padding:3px 8px;border-radius:7px;border:1px solid var(--line);background:var(--bg2);color:var(--text);">Düzelt</button>' : '') + '</td></tr>';
    if (GT.duzelt === r.satir) h += gtDuzeltSatiri(r);
  });
  if (!dilim.length) h += '<tr><td colspan="10" style="padding:14px;text-align:center;color:var(--text2);">Bu filtrede satır yok</td></tr>';
  h += '</tbody></table></div>';

  h += '<div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
    '<button id="gtYazBtn" class="btn-primary" onclick="gtYaz()" ' + ((yaz.length && !GT.busy && !GT.done) ? '' : 'disabled') + ' style="padding:10px 20px;font-size:14px;">Onayla ve Görevleri Aç (' + yaz.length + ')</button>' +
    '<span style="font-size:12px;color:var(--text2);">Görevler "Atandı" durumunda açılır, atanan kişinin Görevler rozeti güncellenir. İşlem sonunda detay rapor Excel i iner.</span></div>' +
    '<div id="gtYazDurum" style="font-size:13px;margin-top:8px;"></div>';
  el.innerHTML = _gtKart(h);
}

function gtDuzeltAc(satir) { GT.duzelt = (GT.duzelt === satir) ? null : satir; gtSonucCiz(); }
function gtDuzeltSatiri(r) {
  const tipOpt = '<option value="">(değiştirme)</option>' + GT.tipler.map(function (t) { return '<option value="' + t.type_id + '"' + ((r.h.ov && String(r.h.ov.tipId) === String(t.type_id)) ? ' selected' : '') + '>' + escapeHTML(t.tip_adi) + '</option>'; }).join('');
  const ku = GT.kullanicilar.slice().sort(function (a, b) { return String(a.ad_soyad).localeCompare(String(b.ad_soyad), 'tr'); });
  const myOpt = '<option value="">(değiştirme)</option>' + ku.map(function (u) {
    return '<option value="' + u.my_id + '"' + ((r.h.ov && String(r.h.ov.myId) === String(u.my_id)) ? ' selected' : '') + '>' + escapeHTML(u.ad_soyad + ' — ' + (u.kcm_adi || '-') + ' (' + u.yetki_seviyesi + ')') + '</option>';
  }).join('');
  return '<tr style="background:rgba(96,165,250,.08);"><td colspan="10" style="padding:10px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">' +
    '<div><div style="font-size:11px;color:var(--text2);">Görev tipi</div><select id="gtDzTip" style="width:100%;' + _GT_INP + '">' + tipOpt + '</select></div>' +
    '<div><div style="font-size:11px;color:var(--text2);">MY</div><select id="gtDzMy" style="width:100%;' + _GT_INP + '">' + myOpt + '</select></div>' +
    '<div><div style="font-size:11px;color:var(--text2);">Açıklama</div><input id="gtDzAc" type="text" value="' + escapeHTML((r.h.ov && r.h.ov.aciklama) || '') + '" style="width:100%;' + _GT_INP + '"></div></div>' +
    '<button class="btn-primary" onclick="gtDuzeltUygula(' + r.satir + ')" style="margin-top:8px;padding:6px 14px;font-size:12px;">Uygula</button></td></tr>';
}
function gtDuzeltUygula(satir) {
  const k = GT.kayitlar.filter(function (x) { return x.satir === satir; })[0]; if (!k) return;
  const tip = document.getElementById('gtDzTip').value, my = document.getElementById('gtDzMy').value, ac = document.getElementById('gtDzAc').value.trim();
  k.ov = { tipId: tip || null, myId: my || null, aciklama: ac || null };
  GT.duzelt = null;
  GT.sec[satir] = true;
  gtYenidenCozumle(false);
}

/* ============================================================
   4) YAZMA
   ============================================================ */
function _gtPartiNo() {
  const d = new Date(Date.now() + 3 * 3600000).toISOString().replace(/[-:T]/g, '').slice(0, 12);
  return 'TG-' + d + '-' + currentUser.my_id;
}

async function gtYaz() {
  if (!hasPerm('gorev_toplu_ata')) { toast('Yetkiniz yok', 'error'); return; }
  if (GT.busy) { toast('İşlem sürüyor, bekleyin', 'error'); return; }
  if (GT.done) { toast('Bu yükleme tamamlandı. Yeni işlem için dosyayı yeniden seçin.', 'error'); return; }
  const yaz = _gtYazilacaklar();
  if (!yaz.length) { toast('Yazılacak satır yok', 'error'); return; }
  GT.busy = true;
  gtSonucCiz();
  const durum = document.getElementById('gtYazDurum');
  const parti = _gtPartiNo(); GT.parti = parti;
  const simdi = new Date().toISOString();
  const payload = yaz.map(function (r) {
    return { type_id: r.tip.type_id, baslik: r.baslik, aciklama: r.aciklama, ncst: r.ncst || null,
             atayan_id: currentUser.my_id, atanan_id: r.my.my_id, durum: 'Atandı',
             baslama_tarihi: simdi, olusturma_tarihi: simdi, deadline: r.deadline, guncelleme_tarihi: simdi };
  });
  const sonuc = new Array(yaz.length);    // {id} | {hata}
  const parcalar = _gtParcala(payload.map(function (p, i) { return i; }), GT_PARCA);
  let yazilan = 0;
  for (let pi = 0; pi < parcalar.length; pi++) {
    const idxler = parcalar[pi];
    const ins = await sb.from('tasks').insert(idxler.map(function (i) { return payload[i]; })).select('task_id');
    if (!ins.error && ins.data && ins.data.length === idxler.length) {
      idxler.forEach(function (i, k) { sonuc[i] = { id: ins.data[k].task_id }; });
    } else {
      // parca basarisiz: satir satir dene, sorunlu satiri ayir
      if (!ins.error && ins.data && ins.data.length) console.warn('[gorev_toplu] parca eksik dondu, satir satir yeniden denenmeyecek');
      if (ins.error || !ins.data || !ins.data.length) {
        for (let k = 0; k < idxler.length; k++) {
          const i = idxler[k];
          const tek = await sb.from('tasks').insert(payload[i]).select('task_id');
          sonuc[i] = (tek.error || !tek.data || !tek.data.length) ? { hata: (tek.error && tek.error.message) || 'bilinmeyen hata' } : { id: tek.data[0].task_id };
        }
      } else {
        idxler.forEach(function (i) { sonuc[i] = { hata: 'parca sonucu belirsiz, görev listesini kontrol edin' }; });
      }
    }
    yazilan += idxler.length;
    if (durum) durum.textContent = 'Yazılıyor... ' + yazilan + ' / ' + yaz.length;
  }

  // gorev gecmisi (parti no burada tutulur — iptal ve izleme icin)
  const loglar = [];
  yaz.forEach(function (r, i) {
    if (sonuc[i] && sonuc[i].id) loglar.push({ task_id: sonuc[i].id, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad, aksiyon: 'Oluşturuldu',
      detay: 'Toplu görev ataması — Parti: ' + parti + (r.ncst ? ' — Müşteri: ' + r.ncst : '') });
  });
  let logHata = 0;
  const lp = _gtParcala(loglar, 200);
  for (let i = 0; i < lp.length; i++) { const l = await sb.from('task_logs').insert(lp[i]); if (l.error) logHata += lp[i].length; }

  yaz.forEach(function (r, i) {
    const s = sonuc[i] || { hata: 'sonuç yok' };
    r.sonuc = s.id ? ('Açıldı #' + s.id) : ('Yazılamadı: ' + s.hata);
    r.gorevId = s.id || null;
  });
  const acildi = yaz.filter(function (r) { return r.gorevId; }).length;
  const basarisiz = yaz.length - acildi;
  GT.busy = false; GT.done = true;
  gtSonucCiz();
  const dd = document.getElementById('gtYazDurum');
  if (dd) dd.innerHTML = '<b>' + acildi + ' görev açıldı</b>' + (basarisiz ? ', <span style="color:#ff6b6b;">' + basarisiz + ' satır yazılamadı</span>' : '') +
    (logHata ? ', <span style="color:#fbbf24;">' + logHata + ' görev geçmişi kaydı yazılamadı</span>' : '') + '. Parti: <b>' + escapeHTML(parti) + '</b>. Rapor indiriliyor...';
  toast(acildi + ' görev açıldı', 'success');
  await gtRapor(parti);
  gtGecmisYukle();
}

function _gtRaporSatiri(r) {
  const secili = GT.sec[r.satir];
  let sonuc = r.sonuc;
  if (!sonuc) {
    if (r.durum === 'hata') sonuc = 'Hata: ' + r.hata.join('; ');
    else if (r.durum === 'atla') sonuc = 'Atlandı: ' + r.atla;
    else sonuc = secili ? 'Yazılmadı' : 'Seçilmedi';
  }
  return [r.satir, r.ncst, r.unvan, r.kcm ? r.kcm.ad : '', r.tip ? r.tip.tip_adi : '', r.my ? r.my.my_id : '', r.my ? r.my.ad_soyad : '', r.myKaynak,
          r.baslik, r.aciklama, r.deadline || '', _GT_DURUM[r.durum].ad, sonuc, r.gorevId || '', r.uyari.join('; ')];
}

async function gtRapor(parti) {
  if (!await ensureXLSX()) return;
  const sonuc = GT.sonuc || [];
  const say = { acildi: 0, yazilamadi: 0, atla: 0, hata: 0, secilmedi: 0 };
  sonuc.forEach(function (r) {
    if (r.gorevId) say.acildi++;
    else if (r.sonuc) say.yazilamadi++;
    else if (r.durum === 'atla') say.atla++;
    else if (r.durum === 'hata') say.hata++;
    else say.secilmedi++;
  });
  const ozet = [['Toplu Görev Atama Raporu', ''], ['Parti', parti || ''], ['Dosya', GT.dosyaAd], ['Yükleyen', currentUser.ad_soyad], ['Tarih', new Date().toLocaleString('tr-TR')],
    ['Toplam satır', sonuc.length], ['Açılan görev', say.acildi], ['Yazılamayan', say.yazilamadi], ['Atlanan (mükerrer / dosyada tekrar)', say.atla], ['Hatalı', say.hata], ['Seçilmeyen', say.secilmedi]];
  const bas = ['Satır', 'NCST', 'Unvan', 'KÇM', 'Görev Tipi', 'MY ID', 'MY Adı', 'MY Kaynağı', 'Başlık', 'Açıklama', 'Termin', 'Durum', 'Sonuç', 'Görev No', 'Uyarılar'];
  const det = [bas].concat(sonuc.map(_gtRaporSatiri));
  const myOz = {};
  sonuc.forEach(function (r) { if (r.gorevId && r.my) { const k = r.my.my_id; myOz[k] = myOz[k] || { ad: r.my.ad_soyad, kcm: r.my.kcm_adi || '', n: 0 }; myOz[k].n++; } });
  const myRows = [['MY ID', 'MY Adı', 'KÇM', 'Açılan görev']].concat(Object.keys(myOz).map(function (k) { return [k, myOz[k].ad, myOz[k].kcm, myOz[k].n]; }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ozet), 'Özet');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(det), 'Detay');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(myRows), 'MY Özeti');
  const ad = 'toplu_gorev_rapor_' + (parti || 'analiz') + '.xlsx';
  try {
    veriCikisiKaydet({ tur: 'disa_aktarim', modul: 'veriyonetimi', fonksiyon: 'gtRapor', rapor_adi: 'Toplu Görev Atama Raporu', bicim: 'xlsx',
      dosya_adi: ad, satir_sayisi: sonuc.length, kapsam: { ozet: ozet.slice(5).map(function (r) { return { ad: r[0], adet: r[1] }; }) } });
  } catch (e) { /* denetim kaydi best-effort */ }
  XLSX.writeFile(wb, ad);
}

// Hatali ve atlanan satirlar: sablon formatinda + hata nedeni; duzeltilip tekrar yuklenebilir
async function gtHataExcel() {
  if (!GT.sonuc) return;
  if (!await ensureXLSX()) { toast('Excel kütüphanesi yüklenemedi', 'error'); return; }
  const sorunlu = GT.sonuc.filter(function (r) { return r.durum === 'hata' || r.durum === 'atla'; });
  if (!sorunlu.length) { toast('Hatalı veya atlanan satır yok', 'success'); return; }
  const rows = [['KÇM Adı', 'Görev Tipi', 'NCST', 'MY ID', 'Görev Açıklaması', 'Termin', 'Başlık', 'Sorun']];
  sorunlu.forEach(function (r) {
    rows.push([r.h.kcmAd || '', r.h.tipAd || '', r.h.ncst || '', r.h.myId || '', r.h.aciklama || '', r.h.termin || '', r.h.baslik || '',
               r.durum === 'atla' ? r.atla : r.hata.join('; ')]);
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Düzeltilecek');
  const ad = 'toplu_gorev_duzeltilecek.xlsx';
  try { veriCikisiKaydet({ tur: 'disa_aktarim', modul: 'veriyonetimi', fonksiyon: 'gtHataExcel', rapor_adi: 'Toplu Görev Düzeltilecek Satırlar', bicim: 'xlsx', dosya_adi: ad, satir_sayisi: sorunlu.length, kapsam: {} }); } catch (e) { /* best-effort */ }
  XLSX.writeFile(wb, ad);
}

/* ============================================================
   5) SON YUKLEMELER ve GERI ALMA (baslamamis gorevleri iptal)
   ============================================================ */
async function gtGecmisYukle() {
  const el = document.getElementById('gtGecmis'); if (!el) return;
  try {
    const r = await sb.from('task_logs').select('task_id,detay,olusturma_tarihi')
      .eq('user_id', currentUser.my_id).like('detay', 'Toplu görev ataması — Parti: %')
      .order('olusturma_tarihi', { ascending: false }).limit(1000);
    if (r.error) throw r.error;
    const grup = {};
    (r.data || []).forEach(function (x) {
      const m = String(x.detay).match(/Parti: (TG-[0-9]+-[0-9]+)/);
      if (!m) return;
      const g = grup[m[1]] = grup[m[1]] || { parti: m[1], n: 0, tarih: x.olusturma_tarihi };
      g.n++;
    });
    GT.gecmis = Object.keys(grup).map(function (k) { return grup[k]; }).sort(function (a, b) { return String(b.tarih).localeCompare(String(a.tarih)); }).slice(0, 10);
  } catch (e) { GT.gecmis = []; console.warn('[gorev_toplu] gecmis okunamadi', e); }
  gtGecmisCiz();
}
function gtGecmisCiz() {
  const el = document.getElementById('gtGecmis'); if (!el) return;
  if (!GT.gecmis.length) { el.innerHTML = ''; return; }
  let h = '<div style="font-weight:700;margin-bottom:6px;">Son yüklemelerim</div><div style="font-size:12px;color:var(--text2);margin-bottom:8px;">' +
    '"İptal et" yalnızca henüz başlanmamış ("Atandı" durumundaki) görevleri iptal eder; başlanmış veya tamamlanmış görevlere dokunmaz.</div>' +
    '<table style="width:100%;font-size:12px;border-collapse:collapse;">';
  GT.gecmis.forEach(function (g) {
    const onay = GT.iptalOnay === g.parti;
    h += '<tr style="border-top:1px solid var(--line);"><td style="padding:6px;">' + escapeHTML(g.parti) + '</td>' +
      '<td style="padding:6px;">' + escapeHTML(new Date(g.tarih).toLocaleString('tr-TR')) + '</td><td style="padding:6px;">' + g.n + ' görev</td>' +
      '<td style="padding:6px;text-align:right;"><button class="btn" onclick="gtBatchIptal(\'' + g.parti + '\')" style="padding:4px 10px;border-radius:7px;border:1px solid ' + (onay ? '#ff6b6b' : 'var(--line)') +
      ';background:' + (onay ? '#ff6b6b' : 'var(--bg2)') + ';color:' + (onay ? '#fff' : 'var(--text)') + ';">' + (onay ? 'Emin misiniz? Tekrar tıklayın' : 'İptal et') + '</button></td></tr>';
  });
  el.innerHTML = _gtKart(h + '</table>');
}

async function gtBatchIptal(parti) {
  if (!hasPerm('gorev_toplu_ata')) { toast('Yetkiniz yok', 'error'); return; }
  if (!/^TG-[0-9]+-[0-9]+$/.test(parti)) return;
  if (GT.iptalOnay !== parti) { GT.iptalOnay = parti; gtGecmisCiz(); setTimeout(function () { if (GT.iptalOnay === parti) { GT.iptalOnay = ''; gtGecmisCiz(); } }, 6000); return; }
  GT.iptalOnay = '';
  if (GT.busy) return;
  GT.busy = true;
  try {
    const loglar = await _gtSayfala(function () {
      return sb.from('task_logs').select('task_id').eq('user_id', currentUser.my_id).like('detay', 'Toplu görev ataması — Parti: ' + parti + '%').order('task_id');
    });
    const ids = Array.from(new Set(loglar.map(function (x) { return x.task_id; })));
    let iptal = 0, atlanan = 0;
    const simdi = new Date().toISOString();
    const parcalar = _gtParcala(ids, 100);
    for (let i = 0; i < parcalar.length; i++) {
      const u = await sb.from('tasks').update({ durum: 'İptal', guncelleme_tarihi: simdi }).in('task_id', parcalar[i]).eq('durum', 'Atandı').select('task_id');
      if (u.error) throw u.error;
      const yapilan = (u.data || []).map(function (x) { return x.task_id; });
      iptal += yapilan.length;
      if (yapilan.length) {
        await sb.from('task_logs').insert(yapilan.map(function (id) {
          return { task_id: id, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad, aksiyon: 'İptal', detay: 'Toplu atama iptali — Parti: ' + parti };
        }));
      }
    }
    atlanan = ids.length - iptal;
    toast(iptal + ' görev iptal edildi' + (atlanan ? ', ' + atlanan + ' görev başlanmış/kapanmış olduğu için dokunulmadı' : ''), 'success');
  } catch (e) { console.error(e); toast('İptal başarısız: ' + (e.message || e), 'error'); }
  GT.busy = false;
  gtGecmisYukle();
}
