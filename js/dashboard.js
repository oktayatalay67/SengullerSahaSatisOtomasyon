// ============================================================
// dashboard.js — v1.0.0
// Son guncelleme: 2026-10-15
// Degisiklikler:
//   v1.0.0 — (V31.189) YENI MODUL: KCM karsilastirmali Dashboard. Ana Menu >
//     Dashboard. TV Box dashboard dosyasindan (dashboard_v5_16.html) BAGIMSIZDIR,
//     ona dokunmaz.
//     Dort bolum, her biri KCM bazli yan yana karsilastirma (satir = gosterge,
//     sutun = KCM, yoneticiler icin ayrica Toplam):
//       1) Ziyaret   — sayi, kisi basina ortalama, hedef gerceklesme, penetrasyon,
//                      hic ziyaret edilmeyen musteri, ziyaret girmeyen kisi sayisi
//       2) Firsat    — donemde olusan, acik pipeline, agirlikli pipeline, Evrakta
//                      bekleyen, yas, dokunulmamis, tutar doluluk, ziyaretten cikan
//       3) Teyit     — ulasilabilirlik, numara dogrulugu, ziyaret teyit Evet orani,
//                      SLA ile kapanis orani, memnuniyet (ayri, n ile)
//       4) Temiz veri— kontak puani (4 alan x 25 puan)
//     Donem: tarih araligi secici. Tum hesaplar tarayicida yapilir (RPC yok,
//     platforma ozel ozellik yok) — baska bir platformda ayni sekilde calisir.
//     Gunluk ziyaret hedefi (MY=3, FMY=4) sistem_ayarlari tablosundan okunur
//     (dash_ziyaret_hedef_my / dash_ziyaret_hedef_fmy), Admin Panel > Uygulama
//     Ayarlari > Dashboard Ayarlari sekmesinden duzenlenir. Satir yoksa
//     varsayilan 3 / 4 kullanilir.
//     Yetki: dashboard_gor eylemi + dashboard modulu kapsami (Rol ve Yetki).
//     Kapsam TUM ise tum KCM, aksi halde yalniz kullanicinin kendi KCM si.
//     NOT: KCM kisiti simdilik istemci tarafindadir (RLS acigi suruyor).
// Bagimlilik: sb, currentUser, hasPerm, getScope, toast, escapeHTML,
//   veri_kalitesi.js (loadVeriKalitesiAyar, adSoyadGecerli, telefonGecerli,
//   emailGecerli, kontakTipiGecerli), navTo/goBack.
// ============================================================
'use strict';

const DKM = {
  donem: { bas: null, bit: null },
  ayar: { hedefMY: 3, hedefFMY: 4 },
  istek: 0,
  sonuc: null
};

// Teyit gorevi durum gruplari (arama.js ile ayni degerler)
const DKM_KAPANAN_DURUM = ['Tamamlandı', 'Ulaşılamıyor', 'Aramadan Kapatıldı', 'Arama Yapılmadı'];
const DKM_ACIK_DURUM = ['Aranacak', 'Tekrar Aranacak'];
// Resmi tatil takviminin son tarihi (bu tarihten sonrasi icin uyari verilir)
const DKM_TAKVIM_SONU = '2027-10-29';
// Firsat asamalari (config.js OPP_ADIM_OLASILIK ile ayni)
const DKM_ACIK_ASAMA = ['Fırsat', 'Teklif', 'Beyan'];

const DKM_AYAR_TANIM = [
  { tip: 'dash_ziyaret_hedef_my',  ad: 'Günlük ziyaret hedefi — MY (ziyaret / iş günü)',  varsayilan: 3, sira: 30 },
  { tip: 'dash_ziyaret_hedef_fmy', ad: 'Günlük ziyaret hedefi — FMY (ziyaret / iş günü)', varsayilan: 4, sira: 31 }
];

/* ============================================================
   1) KUCUK YARDIMCILAR
   ============================================================ */
function _dkmBugun() {
  // Istanbul (UTC+3) takvim gunu, YYYY-MM-DD
  return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
}
function _dkmParse(str) { return new Date(str + 'T00:00:00Z'); }
function _dkmStr(d) { return d.toISOString().slice(0, 10); }
function _dkmGunEkle(str, n) { return _dkmStr(new Date(_dkmParse(str).getTime() + n * 86400000)); }
function _dkmIso(str) { return str + 'T00:00:00+03:00'; }

function _dkmFmt(n, d) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: d === undefined ? 1 : d });
}
function _dkmPct(n) { return (n === null || n === undefined || isNaN(n)) ? '-' : _dkmFmt(n, 1) + '%'; }
function _dkmOran(a, b) { return b > 0 ? (a / b) * 100 : null; }
function _dkmBol(a, b) { return b > 0 ? a / b : null; }
function _dkmMedyan(arr) {
  if (!arr || !arr.length) return null;
  const s = arr.slice().sort(function (x, y) { return x - y; });
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function _dkmOrt(arr) {
  if (!arr || !arr.length) return null;
  let t = 0; arr.forEach(function (x) { t += x; });
  return t / arr.length;
}
function _dkmParcala(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
function _dkmAnahtar(v) { return (v === null || v === undefined) ? '' : String(v); }

// Es zamanli islem calistirici (en fazla "limit" istek ayni anda)
async function _dkmParalel(isler, limit) {
  const sonuc = new Array(isler.length);
  let i = 0;
  async function isci() {
    while (i < isler.length) { const k = i++; sonuc[k] = await isler[k](); }
  }
  const n = Math.min(limit, isler.length);
  const iscilar = [];
  for (let j = 0; j < n; j++) iscilar.push(isci());
  await Promise.all(iscilar);
  return sonuc;
}

// 1000 satir sinirini asmak icin ardisik sayfalama (kur her seferinde yeni sorgu dondurur)
async function _dkmSayfala(kur) {
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

// Buyuk tablolar icin: once sayim, sonra sayfalar es zamanli (siraKolon tekil olmali)
async function _dkmTumSatirlar(tablo, kolonlar, uygula, siraKolon) {
  const say = await uygula(sb.from(tablo).select('*', { count: 'exact', head: true }));
  if (say.error) throw say.error;
  const toplam = say.count || 0;
  const n = Math.ceil(toplam / 1000);
  const isler = [];
  for (let i = 0; i < n; i++) {
    isler.push(async function () {
      const r = await uygula(sb.from(tablo).select(kolonlar).order(siraKolon)).range(i * 1000, i * 1000 + 999);
      if (r.error) throw r.error;
      return r.data || [];
    });
  }
  const parcalar = await _dkmParalel(isler, 5);
  const out = [];
  parcalar.forEach(function (p) { for (let k = 0; k < p.length; k++) out.push(p[k]); });
  return out;
}

// in() sorgusunu parcalara bolerek calistirir (anahtar listesi uzun olabilir)
async function _dkmInSorgu(ids, parcaBoyu, kur) {
  const tekil = Array.from(new Set(ids.filter(function (x) { return x !== null && x !== undefined; })));
  const isler = _dkmParcala(tekil, parcaBoyu).map(function (p) {
    return async function () {
      const r = await kur(p);
      if (r.error) throw r.error;
      if ((r.data || []).length >= 1000) console.warn('[dashboard] in() parcasi 1000 satira ulasti, sonuc eksik olabilir');
      return r.data || [];
    };
  });
  const parcalar = await _dkmParalel(isler, 5);
  const out = [];
  parcalar.forEach(function (p) { for (let k = 0; k < p.length; k++) out.push(p[k]); });
  return out;
}

/* ============================================================
   2) KAPSAM (kimin hangi KCM yi gorecegi)
   ============================================================ */
// scope TUM ise tum KCM. Aksi halde kullanicinin kendi KCM si.
// KCM si olmayan ve kapsami acikca KCM olan kullanici veri gormez.
// KCM si olmayan, kapsami tanimsiz kullanici (ornegin yonetici) tum KCM leri gorur.
function _dkmKapsam() {
  let scope = '';
  try { scope = getScope('dashboard'); } catch (e) { scope = ''; }
  const kcm = (currentUser && currentUser.kcm_id) ? currentUser.kcm_id : null;
  if (scope === 'TÜM') return { tum: true, kcmId: null, bos: false };
  if (kcm) return { tum: false, kcmId: kcm, bos: false };
  if (scope === 'KÇM') return { tum: false, kcmId: null, bos: true };
  return { tum: true, kcmId: null, bos: false };
}

/* ============================================================
   3) IS GUNU (hafta sonu ve resmi tatil haric, yarim gun = 0,5)
   ============================================================ */
function dkmIsGunu(bas, bit, tatilMap) {
  if (!bas || !bit || bas > bit) return 0;
  let toplam = 0;
  let d = _dkmParse(bas);
  const son = _dkmParse(bit);
  while (d <= son) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      const t = tatilMap[_dkmStr(d)];
      toplam += (t === undefined) ? 1 : (t === 'yarim' ? 0.5 : 0);
    }
    d = new Date(d.getTime() + 86400000);
  }
  return toplam;
}

/* ============================================================
   4) VERI YUKLEME
   ============================================================ */
async function _dkmAyarYukle() {
  DKM.ayar = { hedefMY: 3, hedefFMY: 4 };
  try {
    const r = await sb.from('sistem_ayarlari').select('ayar_tipi,deger')
      .in('ayar_tipi', ['dash_ziyaret_hedef_my', 'dash_ziyaret_hedef_fmy', 'arama_sla_gun']).eq('aktif', true);
    (r.data || []).forEach(function (a) {
      const n = parseFloat(a.deger);
      if (!(n > 0)) return;
      if (a.ayar_tipi === 'dash_ziyaret_hedef_my') DKM.ayar.hedefMY = n;
      else if (a.ayar_tipi === 'dash_ziyaret_hedef_fmy') DKM.ayar.hedefFMY = n;
      else if (a.ayar_tipi === 'arama_sla_gun') DKM.ayar.slaGun = n;
    });
  } catch (e) { console.warn('[dashboard] ayar okunamadi, varsayilan kullanildi', e); }
  if (!DKM.ayar.slaGun) DKM.ayar.slaGun = 7;
}

async function _dkmKadroYukle(k) {
  const satirlar = await _dkmSayfala(function () {
    let q = sb.from('users').select('my_id,ad_soyad,kcm_id,kcm_adi,yetki_seviyesi,is_sanal')
      .eq('aktif', true).in('yetki_seviyesi', ['MY', 'FMY']).order('my_id');
    if (!k.tum) q = q.eq('kcm_id', k.kcmId);
    return q;
  });
  return satirlar;
}

async function _dkmTatilYukle(bas, bit) {
  const map = {};
  let takvimSonu = null;
  const r = await sb.from('resmi_tatiller').select('tarih,yarim_gun').gte('tarih', bas).lte('tarih', bit);
  if (r.error) throw r.error;
  (r.data || []).forEach(function (t) { map[String(t.tarih).slice(0, 10)] = t.yarim_gun ? 'yarim' : 'tam'; });
  try {
    const m = await sb.from('resmi_tatiller').select('tarih').order('tarih', { ascending: false }).limit(1);
    if (m.data && m.data.length) takvimSonu = String(m.data[0].tarih).slice(0, 10);
  } catch (e) { /* takvim sonu okunamadi: uyari verilemez, hesap etkilenmez */ }
  return { map: map, takvimSonu: takvimSonu };
}

async function _dkmZiyaretYukle(k, basIso, bitIso) {
  return _dkmTumSatirlar('visits', 'visit_id,ncst,my_id,kcm_id,contact_id,tarih_saat', function (q) {
    q = q.eq('temas_turu', 'Ziyaret').eq('durum', 'Gerçekleşti').gte('tarih_saat', basIso).lt('tarih_saat', bitIso);
    if (!k.tum) q = q.eq('kcm_id', k.kcmId);
    return q;
  }, 'visit_id');
}

async function _dkmZiyaretTumYukle() {
  return _dkmTumSatirlar('visits', 'visit_id,ncst,my_id', function (q) {
    return q.eq('temas_turu', 'Ziyaret').eq('durum', 'Gerçekleşti');
  }, 'visit_id');
}

async function _dkmMusteriYukle(k) {
  return _dkmTumSatirlar('customers', 'ncst,my_id,kcm_id', function (q) {
    if (!k.tum) q = q.eq('kcm_id', k.kcmId);
    return q;
  }, 'ncst');
}

async function _dkmFirsatYukle(k) {
  return _dkmSayfala(function () {
    let q = sb.from('opportunities')
      .select('opp_id,my_id,kcm_id,adim,durum,olasilik,beklenen_ciro,olusturma_tarihi,guncelleme_tarihi,visit_id')
      .order('opp_id');
    if (!k.tum) q = q.eq('kcm_id', k.kcmId);
    return q;
  });
}

// Evrak a giris tarihi: ilk "Evrak" ile baslayan Olusturuldu/Guncellendi logu
async function _dkmEvrakLogYukle(oppIds) {
  const satirlar = await _dkmInSorgu(oppIds.map(String), 40, function (parca) {
    return sb.from('activity_logs').select('kayit_id,olusturma_tarihi')
      .eq('tablo_adi', 'opportunities').in('kayit_id', parca)
      .in('aksiyon', ['Güncellendi', 'Oluşturuldu']).like('detay', 'Evrak%');
  });
  const map = {};
  satirlar.forEach(function (s) {
    const t = new Date(s.olusturma_tarihi).getTime();
    if (isNaN(t)) return;
    const a = String(s.kayit_id);
    if (map[a] === undefined || t < map[a]) map[a] = t;
  });
  return map;
}

async function _dkmTeyitYukle(visitIds) {
  let typeId = null;
  const t = await sb.from('task_types').select('type_id').eq('tip_adi', 'Ziyaret Teyit Araması').maybeSingle();
  if (t.data) typeId = t.data.type_id;
  if (!typeId) return { gorevler: [], aramalar: [], tipYok: true };
  const gorevler = await _dkmInSorgu(visitIds, 80, function (parca) {
    return sb.from('tasks').select('task_id,visit_id,durum').eq('type_id', typeId).in('visit_id', parca);
  });
  const aramalar = await _dkmInSorgu(visitIds, 80, function (parca) {
    return sb.from('arama_sonuclari')
      .select('visit_id,ulasildi,ulasilamama_neden,ziyaret_dogrulandi,memnuniyet')
      .in('visit_id', parca);
  });
  return { gorevler: gorevler, aramalar: aramalar, tipYok: false };
}

async function _dkmKontakYukle(contactIds) {
  return _dkmInSorgu(contactIds, 80, function (parca) {
    return sb.from('contacts').select('contact_id,ad_soyad,telefon,email,kontak_tipi').in('contact_id', parca);
  });
}

/* ============================================================
   5) HESAPLAMA (saf fonksiyon — veri alir, kova dondurur; test edilebilir)
   ============================================================ */
function _dkmKova(kcmId, kcmAd) {
  return {
    kcmId: kcmId, ad: kcmAd || ('KÇM ' + kcmId),
    // 1) Ziyaret
    kadroMY: 0, kadroFMY: 0, kisiSifir: 0, ziyaret: 0, hedef: 0,
    portfoy: 0, penDonem: 0, penTum: 0, hicZiyaretsiz: 0,
    // 2) Firsat
    donemOlusan: 0, donemCiroDolu: 0, donemZiyaretli: 0,
    adimSay: { 'Fırsat': 0, 'Teklif': 0, 'Beyan': 0, 'Evrak': 0 },
    gerceklesen: 0, agirlikli: 0,
    evrakGun: [], acikYas: [], acik30: 0, acikDokunulmamis: 0, acikSay: 0,
    // 3) Teyit
    gorevToplam: 0, gorevKapanan: 0, gorevSla: 0, gorevAcik: 0, gorevAcikOlgunlasmamis: 0,
    aramaN: 0, ulasildi: 0, yanlisNo: 0, zvN: 0, zvEvet: 0, memN: 0, memToplam: 0,
    // 4) Temiz veri
    kontakN: 0, adOk: 0, telOk: 0, mailOk: 0, tipOk: 0
  };
}

function _dkmBirlestir(kovalar) {
  const t = _dkmKova('toplam', 'Toplam');
  kovalar.forEach(function (b) {
    Object.keys(t).forEach(function (a) {
      if (a === 'kcmId' || a === 'ad') return;
      if (Array.isArray(t[a])) { t[a] = t[a].concat(b[a]); }
      else if (typeof t[a] === 'object') { Object.keys(t[a]).forEach(function (z) { t[a][z] += b[a][z]; }); }
      else { t[a] += b[a]; }
    });
  });
  return t;
}

function _dkmGercekArama(r) {
  const n = String(r.ulasilamama_neden || '');
  if (n.indexOf('Arama Yapılmadı (SLA') === 0) return false;   // SLA ile otomatik kapanis
  if (n.indexOf('Aramadan Kapatıldı') === 0) return false;     // aramadan kapat kaydi
  return r.ulasildi === true || r.ulasildi === false;
}

function dkmHesapla(g) {
  const simdi = g.simdi || new Date();
  const sanal = {};
  (g.sanalIds || []).forEach(function (x) { sanal[_dkmAnahtar(x)] = true; });

  // --- KCM listesi: yalniz kadroda KCM si olan MY/FMY ler ---
  const kovalar = {};
  const kadroMap = {};
  g.kadro.forEach(function (u) {
    if (u.is_sanal || u.kcm_id === null || u.kcm_id === undefined) return;
    const kid = _dkmAnahtar(u.kcm_id);
    if (!kovalar[kid]) kovalar[kid] = _dkmKova(u.kcm_id, u.kcm_adi);
    if (!kovalar[kid].ad || kovalar[kid].ad === ('KÇM ' + u.kcm_id)) { if (u.kcm_adi) kovalar[kid].ad = u.kcm_adi; }
    if (u.yetki_seviyesi === 'FMY') kovalar[kid].kadroFMY++; else kovalar[kid].kadroMY++;
    kadroMap[_dkmAnahtar(u.my_id)] = u;
  });
  const notlar = { kcmsizZiyaret: 0, kcmUyumsuz: 0, kcmsizMusteri: 0 };

  // --- 1) ZIYARET ---
  const ziyaretKisi = {};
  const ziyaretler = g.ziyaret.filter(function (v) { return !sanal[_dkmAnahtar(v.my_id)]; });
  ziyaretler.forEach(function (v) {
    ziyaretKisi[_dkmAnahtar(v.my_id)] = (ziyaretKisi[_dkmAnahtar(v.my_id)] || 0) + 1;
    const kid = _dkmAnahtar(v.kcm_id);
    if (!kid) { notlar.kcmsizZiyaret++; return; }
    if (!kovalar[kid]) return;
    kovalar[kid].ziyaret++;
    const sahip = kadroMap[_dkmAnahtar(v.my_id)];
    if (sahip && _dkmAnahtar(sahip.kcm_id) !== kid) notlar.kcmUyumsuz++;
  });
  Object.keys(kadroMap).forEach(function (mid) {
    if (!ziyaretKisi[mid]) kovalar[_dkmAnahtar(kadroMap[mid].kcm_id)].kisiSifir++;
  });
  Object.keys(kovalar).forEach(function (kid) {
    const b = kovalar[kid];
    b.hedef = (b.kadroMY * g.ayar.hedefMY + b.kadroFMY * g.ayar.hedefFMY) * g.isGunu;
  });

  // Penetrasyon ve hic ziyaret edilmeyen: portfoy ici = ziyareti yapan MY musterinin guncel sahibi
  const musteriMap = {};
  g.musteri.forEach(function (m) { musteriMap[_dkmAnahtar(m.ncst)] = m; });
  const kimseZiyaretEtmedi = {};
  (g.ziyaretTum || []).forEach(function (v) { kimseZiyaretEtmedi[_dkmAnahtar(v.ncst)] = true; });
  const donemSet = {}, tumSet = {};
  g.musteri.forEach(function (m) {
    if (m.kcm_id === null || m.kcm_id === undefined) { notlar.kcmsizMusteri++; return; }
    if (m.my_id === null || m.my_id === undefined) return;
    const kid = _dkmAnahtar(m.kcm_id);
    if (!kovalar[kid]) return;
    kovalar[kid].portfoy++;
    if (!kimseZiyaretEtmedi[_dkmAnahtar(m.ncst)]) kovalar[kid].hicZiyaretsiz++;
  });
  function portfoyIciIsle(liste, set, alan) {
    liste.forEach(function (v) {
      const m = musteriMap[_dkmAnahtar(v.ncst)];
      if (!m || m.kcm_id === null || m.kcm_id === undefined) return;
      if (_dkmAnahtar(m.my_id) !== _dkmAnahtar(v.my_id)) return;
      const kid = _dkmAnahtar(m.kcm_id);
      if (!kovalar[kid]) return;
      const anahtar = kid + '|' + _dkmAnahtar(v.ncst);
      if (set[anahtar]) return;
      set[anahtar] = true;
      kovalar[kid][alan]++;
    });
  }
  portfoyIciIsle(ziyaretler, donemSet, 'penDonem');
  portfoyIciIsle((g.ziyaretTum || []).filter(function (v) { return !sanal[_dkmAnahtar(v.my_id)]; }), tumSet, 'penTum');

  // --- 2) FIRSAT ---
  const basMs = g.basMs, bitMs = g.bitMs;
  g.firsat.forEach(function (o) {
    const kid = _dkmAnahtar(o.kcm_id);
    const b = kovalar[kid];
    if (!b) return;
    const adim = o.adim || o.durum || 'Fırsat';
    const olus = new Date(o.olusturma_tarihi).getTime();
    if (!isNaN(olus) && olus >= basMs && olus < bitMs) {
      b.donemOlusan++;
      if (o.beklenen_ciro !== null && o.beklenen_ciro !== undefined && o.beklenen_ciro !== '') b.donemCiroDolu++;
      if (o.visit_id !== null && o.visit_id !== undefined) b.donemZiyaretli++;
    }
    if (adim === 'Gerçekleşen') { b.gerceklesen++; return; }
    if (adim === 'İptal') return;
    if (b.adimSay[adim] !== undefined) b.adimSay[adim]++;
    b.agirlikli += (parseFloat(o.olasilik) || 0) / 100;
    if (adim === 'Evrak') {
      // Evrak = onay/surec bekleyen asama: yas ve dokunulmamis hesabindan haric
      const logMs = g.evrakLog ? g.evrakLog[_dkmAnahtar(o.opp_id)] : undefined;
      let giris = olus;
      if (logMs !== undefined && !isNaN(olus) && logMs >= olus - 86400000) giris = logMs;
      else if (logMs !== undefined && isNaN(olus)) giris = logMs;
      if (!isNaN(giris)) b.evrakGun.push(Math.max(0, Math.floor((simdi.getTime() - giris) / 86400000)));
      return;
    }
    b.acikSay++;
    if (!isNaN(olus)) {
      const yas = Math.max(0, Math.floor((simdi.getTime() - olus) / 86400000));
      b.acikYas.push(yas);
      if (yas >= 30) b.acik30++;
    }
    const son = new Date(o.guncelleme_tarihi || o.olusturma_tarihi).getTime();
    if (!isNaN(son) && (simdi.getTime() - son) >= 14 * 86400000) b.acikDokunulmamis++;
  });

  // --- 3) TEYIT ---
  const visitKcm = {};
  const visitMs = {};
  ziyaretler.forEach(function (v) { visitKcm[_dkmAnahtar(v.visit_id)] = _dkmAnahtar(v.kcm_id); visitMs[_dkmAnahtar(v.visit_id)] = new Date(v.tarih_saat).getTime(); });
  const slaMs = (g.ayar.slaGun || 7) * 86400000;
  (g.gorevler || []).forEach(function (t) {
    const b = kovalar[visitKcm[_dkmAnahtar(t.visit_id)]];
    if (!b) return;
    b.gorevToplam++;
    if (DKM_KAPANAN_DURUM.indexOf(t.durum) >= 0) {
      b.gorevKapanan++;
      if (t.durum === 'Arama Yapılmadı') b.gorevSla++;
    } else if (DKM_ACIK_DURUM.indexOf(t.durum) >= 0) {
      b.gorevAcik++;
      const vm = visitMs[_dkmAnahtar(t.visit_id)];
      if (!isNaN(vm) && (simdi.getTime() - vm) < slaMs) b.gorevAcikOlgunlasmamis++;
    }
  });
  (g.aramalar || []).forEach(function (r) {
    const b = kovalar[visitKcm[_dkmAnahtar(r.visit_id)]];
    if (!b || !_dkmGercekArama(r)) return;
    b.aramaN++;
    if (r.ulasildi === true) b.ulasildi++;
    if (r.ulasilamama_neden === 'Yanlış numara') b.yanlisNo++;
    if (r.ziyaret_dogrulandi === 'Evet' || r.ziyaret_dogrulandi === 'Hayır' || r.ziyaret_dogrulandi === 'Emin değil') {
      b.zvN++;
      if (r.ziyaret_dogrulandi === 'Evet') b.zvEvet++;
    }
    if (r.memnuniyet !== null && r.memnuniyet !== undefined && !isNaN(parseFloat(r.memnuniyet))) {
      b.memN++; b.memToplam += parseFloat(r.memnuniyet);
    }
  });

  // --- 4) TEMIZ VERI (kontak puani): donemde ziyarette kullanilan tekil kontaklar, KCM basina ---
  const kontakMap = {};
  (g.kontaklar || []).forEach(function (c) { kontakMap[_dkmAnahtar(c.contact_id)] = c; });
  const goruldu = {};
  ziyaretler.forEach(function (v) {
    if (v.contact_id === null || v.contact_id === undefined) return;
    const kid = _dkmAnahtar(v.kcm_id);
    const b = kovalar[kid];
    if (!b) return;
    const anahtar = kid + '|' + _dkmAnahtar(v.contact_id);
    if (goruldu[anahtar]) return;
    goruldu[anahtar] = true;
    const c = kontakMap[_dkmAnahtar(v.contact_id)];
    if (!c) return;
    const s = g.kontakKontrol(c);
    b.kontakN++;
    if (s.ad) b.adOk++;
    if (s.tel) b.telOk++;
    if (s.mail) b.mailOk++;
    if (s.tip) b.tipOk++;
  });

  const liste = Object.keys(kovalar).map(function (k) { return kovalar[k]; })
    .sort(function (a, b) { return Number(a.kcmId) - Number(b.kcmId); });
  return { kovalar: liste, toplam: _dkmBirlestir(liste), notlar: notlar };
}

// Bir kontagin 4 alanini dogrular (veri_kalitesi.js fonksiyonlari ile ayni kurallar)
function dkmKontakKontrol(c) {
  let tipler = c.kontak_tipi;
  if (typeof tipler === 'string') { try { tipler = JSON.parse(tipler); } catch (e) { tipler = []; } }
  if (!Array.isArray(tipler)) tipler = [];
  return {
    ad: adSoyadGecerli(c.ad_soyad).ok,
    tel: telefonGecerli(c.telefon).ok,
    mail: emailGecerli(c.email).ok,
    tip: kontakTipiGecerli(tipler).ok
  };
}

/* ============================================================
   6) GOSTERGE TANIMLARI (satirlar)
   ============================================================ */
function _dkmKisi(b) { return b.kadroMY + b.kadroFMY; }

const DKM_BOLUMLER = [
  { id: 'ziyaret', baslik: '1. Ziyaret', satirlar: [
    { e: 'Ziyaret sayısı', v: function (b) { return b.ziyaret; }, f: function (x) { return _dkmFmt(x, 0); }, iyi: 'yuksek' },
    { e: 'Kadro (MY + FMY)', v: function (b) { return _dkmKisi(b); }, f: function (x, b) { return _dkmFmt(x, 0) + ' (' + b.kadroMY + ' + ' + b.kadroFMY + ')'; } },
    { e: 'Kişi başı ziyaret', v: function (b) { return _dkmBol(b.ziyaret, _dkmKisi(b)); }, f: function (x) { return _dkmFmt(x, 1); }, iyi: 'yuksek' },
    { e: 'Hedef', v: function (b) { return b.hedef; }, f: function (x) { return _dkmFmt(x, 0); } },
    { e: 'Hedef gerçekleşme', v: function (b) { return _dkmOran(b.ziyaret, b.hedef); }, f: _dkmPct, iyi: 'yuksek', bar: true },
    { e: 'Ziyaret girmeyen kişi', v: function (b) { return b.kisiSifir; }, f: function (x, b) { return _dkmFmt(x, 0) + ' / ' + _dkmKisi(b); }, iyi: 'dusuk' },
    { e: 'Portföy müşteri', v: function (b) { return b.portfoy; }, f: function (x) { return _dkmFmt(x, 0); } },
    { e: 'Penetrasyon (dönem)', v: function (b) { return _dkmOran(b.penDonem, b.portfoy); }, f: _dkmPct, iyi: 'yuksek', bar: true },
    { e: 'Penetrasyon (tüm zamanlar)', v: function (b) { return _dkmOran(b.penTum, b.portfoy); }, f: _dkmPct, iyi: 'yuksek', bar: true },
    { e: 'Hiç ziyaret edilmeyen müşteri', v: function (b) { return _dkmOran(b.hicZiyaretsiz, b.portfoy); }, f: function (x, b) { return _dkmFmt(b.hicZiyaretsiz, 0) + ' (' + _dkmPct(x) + ')'; }, iyi: 'dusuk' }
  ] },
  { id: 'firsat', baslik: '2. Fırsat', satirlar: [
    { e: 'Dönemde oluşan fırsat', v: function (b) { return b.donemOlusan; }, f: function (x) { return _dkmFmt(x, 0); }, iyi: 'yuksek' },
    { e: 'Kişi başı (dönem)', v: function (b) { return _dkmBol(b.donemOlusan, _dkmKisi(b)); }, f: function (x) { return _dkmFmt(x, 2); }, iyi: 'yuksek' },
    { e: 'Açık pipeline (Evrak hariç)', v: function (b) { return b.acikSay; }, f: function (x, b) { return _dkmFmt(x, 0) + ' (F ' + b.adimSay['Fırsat'] + ' / T ' + b.adimSay['Teklif'] + ' / B ' + b.adimSay['Beyan'] + ')'; } },
    { e: 'Evrakta bekleyen', v: function (b) { return b.adimSay['Evrak']; }, f: function (x) { return _dkmFmt(x, 0); } },
    { e: 'Evrak bekleme (medyan gün)', v: function (b) { return _dkmMedyan(b.evrakGun); }, f: function (x) { return _dkmFmt(x, 0); }, iyi: 'dusuk' },
    { e: 'Evrakta 30+ gün', v: function (b) { return b.evrakGun.filter(function (x) { return x >= 30; }).length; }, f: function (x) { return _dkmFmt(x, 0); }, iyi: 'dusuk' },
    { e: 'Ağırlıklı pipeline (Evrak dahil)', v: function (b) { return b.agirlikli; }, f: function (x) { return _dkmFmt(x, 1); } },
    { e: 'Açık fırsat yaşı (ort. gün)', v: function (b) { return _dkmOrt(b.acikYas); }, f: function (x) { return _dkmFmt(x, 0); }, iyi: 'dusuk' },
    { e: 'Açık, 30+ gün eski', v: function (b) { return _dkmOran(b.acik30, b.acikSay); }, f: function (x, b) { return _dkmFmt(b.acik30, 0) + ' (' + _dkmPct(x) + ')'; }, iyi: 'dusuk' },
    { e: 'Açık, 14+ gün dokunulmamış', v: function (b) { return _dkmOran(b.acikDokunulmamis, b.acikSay); }, f: function (x, b) { return _dkmFmt(b.acikDokunulmamis, 0) + ' (' + _dkmPct(x) + ')'; }, iyi: 'dusuk' },
    { e: 'Gerçekleşen (tüm zamanlar)', v: function (b) { return b.gerceklesen; }, f: function (x) { return _dkmFmt(x, 0); }, iyi: 'yuksek' },
    { e: 'Tutar doluluğu (dönem)', v: function (b) { return _dkmOran(b.donemCiroDolu, b.donemOlusan); }, f: function (x, b) { return _dkmPct(x) + ' (' + b.donemCiroDolu + '/' + b.donemOlusan + ')'; }, iyi: 'yuksek', bar: true },
    { e: 'Ziyaretten çıkan (dönem)', v: function (b) { return _dkmOran(b.donemZiyaretli, b.donemOlusan); }, f: function (x, b) { return _dkmPct(x) + ' (' + b.donemZiyaretli + '/' + b.donemOlusan + ')'; }, iyi: 'yuksek' }
  ] },
  { id: 'teyit', baslik: '3. Müşteri teyit araması', satirlar: [
    { e: 'Teyit görevi', v: function (b) { return b.gorevToplam; }, f: function (x, b) { return _dkmFmt(x, 0) + ' (kapanan ' + b.gorevKapanan + ', açık ' + b.gorevAcik + ')'; } },
    { e: 'Gerçek arama (deneme)', v: function (b) { return b.aramaN; }, f: function (x) { return _dkmFmt(x, 0); } },
    { e: 'Ulaşılabilirlik', v: function (b) { return _dkmOran(b.ulasildi, b.aramaN); }, f: _dkmPct, iyi: 'yuksek', bar: true },
    { e: 'Numara doğruluğu', v: function (b) { return b.aramaN > 0 ? 100 - _dkmOran(b.yanlisNo, b.aramaN) : null; }, f: _dkmPct, iyi: 'yuksek', bar: true },
    { e: 'Ziyaret teyit "Evet"', v: function (b) { return _dkmOran(b.zvEvet, b.zvN); }, f: function (x, b) { return _dkmPct(x) + ' (n=' + b.zvN + ')'; }, iyi: 'yuksek', bar: true },
    { e: 'SLA ile aranamadan kapanan', v: function (b) { return _dkmOran(b.gorevSla, b.gorevKapanan); }, f: function (x, b) { return _dkmPct(x) + ' (' + b.gorevSla + '/' + b.gorevKapanan + ')'; }, iyi: 'dusuk' },
    { e: 'SLA süresi dolmamış açık görev', v: function (b) { return b.gorevAcikOlgunlasmamis; }, f: function (x) { return _dkmFmt(x, 0); } },
    { e: 'Memnuniyet (ort.)', v: function (b) { return _dkmBol(b.memToplam, b.memN); }, f: function (x, b) { return _dkmFmt(x, 2) + ' (n=' + b.memN + ')'; } }
  ] },
  { id: 'veri', baslik: '4. Temiz veri (kontak puanı)', satirlar: [
    { e: 'Kontak sayısı (dönem, tekil)', v: function (b) { return b.kontakN; }, f: function (x) { return _dkmFmt(x, 0); } },
    { e: 'Kontak puanı (0-100)', v: function (b) { return b.kontakN > 0 ? 25 * (b.adOk + b.telOk + b.mailOk + b.tipOk) / b.kontakN : null; }, f: function (x) { return _dkmFmt(x, 1); }, iyi: 'yuksek', bar: true },
    { e: 'Ad-soyad geçerli', v: function (b) { return _dkmOran(b.adOk, b.kontakN); }, f: _dkmPct, iyi: 'yuksek' },
    { e: 'Telefon geçerli', v: function (b) { return _dkmOran(b.telOk, b.kontakN); }, f: _dkmPct, iyi: 'yuksek' },
    { e: 'E-posta geçerli', v: function (b) { return _dkmOran(b.mailOk, b.kontakN); }, f: _dkmPct, iyi: 'yuksek' },
    { e: 'Kontak tipi geçerli', v: function (b) { return _dkmOran(b.tipOk, b.kontakN); }, f: _dkmPct, iyi: 'yuksek' }
  ] }
];

const DKM_TANIMLAR = [
  ['Ziyaret', 'Temas türü "Ziyaret", durumu "Gerçekleşti", sanal kullanıcılar hariç. KÇM = ziyaret kaydındaki KÇM.'],
  ['Hedef', '(MY sayısı x MY günlük hedefi + FMY sayısı x FMY günlük hedefi) x iş günü. İş günü: hafta sonu ve resmi tatil hariç, yarım gün 0,5. Dönem bugünü aşıyorsa bugüne kadar sayılır. Tüm aktif MY/FMY kadrosu dahildir.'],
  ['Penetrasyon', 'Portföy içi ziyaret edilen tekil müşteri / portföy müşteri sayısı. Portföy içi: ziyareti yapan MY, müşterinin güncel sahibi olmalı.'],
  ['Açık pipeline', 'Fırsat, Teklif ve Beyan aşamaları. Evrak aşaması onay/süreç bekleyen kabul edilir, yaş ve dokunulmamış hesabına girmez, ayrı gösterilir.'],
  ['Evrak bekleme', 'Giriş tarihi: ilk "Evrak" kaydı (fırsat geçmişi); kayıt yoksa oluşturma tarihi.'],
  ['Dokunulmamış', 'Son 14 günde güncelleme, not veya aşama değişikliği olmayan açık fırsat.'],
  ['Gerçekleşen', 'Kapanış tarihi tutulmadığı için tüm zamanlar sayılır, dönem filtresi uygulanmaz.'],
  ['Tutar doluluğu', 'Dönemde oluşan fırsatlardan beklenen ciro girilmiş olanların oranı. Tutar toplamı gösterilmez, çünkü çoğu fırsatta boş.'],
  ['Teyit', 'Dönem tarihi = ziyaret tarihi. Sistemin otomatik SLA kapanışları ve "aramadan kapat" kayıtları gerçek arama sayılmaz.'],
  ['Ulaşılabilirlik', 'Ulaşılan arama / gerçek arama sayısı.'],
  ['Numara doğruluğu', '100 eksi "Yanlış numara" nedeniyle ulaşılamayan aramaların oranı.'],
  ['SLA ile kapanan', 'Aranamadan SLA süresi dolduğu için kapanan görevlerin, kapanan görevlere oranı (düşük iyi).'],
  ['Kontak puanı', 'Dönemde ziyarette kullanılan tekil kontaklar. Ad-soyad, telefon, e-posta ve kontak tipi, her biri 25 puan. Doğrulama kuralları kontak kayıt ekranıyla aynı.']
];

/* ============================================================
   7) EKRAN
   ============================================================ */
function _dkmStilEkle() {
  if (document.getElementById('dkmStil')) return;
  const s = document.createElement('style');
  s.id = 'dkmStil';
  s.textContent =
    '.dkm-wrap{padding:12px 12px 40px;}' +
    '.dkm-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px;}' +
    '.dkm-bar .f{display:flex;flex-direction:column;gap:4px;flex:1 1 130px;}' +
    '.dkm-bar label{font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;}' +
    '.dkm-bar input{background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;width:100%;}' +
    '.dkm-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}' +
    '.dkm-chip{background:var(--navy3);border:1px solid var(--border);border-radius:16px;color:var(--text);padding:6px 12px;font-size:12px;cursor:pointer;}' +
    '.dkm-btn{background:var(--blue);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;padding:10px 16px;cursor:pointer;}' +
    '.dkm-kart{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:14px;overflow:hidden;}' +
    '.dkm-kart h3{font-size:13px;font-weight:800;padding:11px 12px;border-bottom:1px solid var(--border);letter-spacing:.3px;}' +
    '.dkm-kaydir{overflow-x:auto;}' +
    '.dkm-tbl{width:100%;border-collapse:collapse;font-size:12px;}' +
    '.dkm-tbl th{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--text2);text-align:right;padding:8px 10px;white-space:nowrap;border-bottom:1px solid var(--border);}' +
    '.dkm-tbl th:first-child,.dkm-tbl td:first-child{text-align:left;position:sticky;left:0;background:var(--card);min-width:150px;}' +
    '.dkm-tbl td{text-align:right;padding:8px 10px;border-bottom:1px solid var(--border);white-space:nowrap;}' +
    '.dkm-tbl td:first-child{color:var(--text2);white-space:normal;}' +
    '.dkm-tbl .tp{font-weight:700;border-left:1px solid var(--border);}' +
    '.dkm-iyi{color:var(--green);font-weight:700;}' +
    '.dkm-kotu{color:#ff6b6b;font-weight:700;}' +
    '.dkm-cubuk{height:3px;background:var(--navy3);border-radius:2px;margin-top:4px;overflow:hidden;}' +
    '.dkm-cubuk i{display:block;height:100%;background:var(--blue);}' +
    '.dkm-not{background:rgba(255,180,0,.1);border:1px solid rgba(255,180,0,.35);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:12px;line-height:1.5;}' +
    '.dkm-hata{background:rgba(224,4,42,.1);border:1px solid rgba(224,4,42,.4);border-radius:10px;padding:10px 12px;margin:10px 12px;font-size:12px;}' +
    '.dkm-tan{font-size:12px;color:var(--text2);line-height:1.55;padding:6px 12px 12px;}' +
    '.dkm-tan b{color:var(--text);}';
  document.head.appendChild(s);
}

function _dkmDonemHazir(ad) {
  const bugun = _dkmBugun();
  let bas, bit;
  if (ad === 'buay') { bas = bugun.slice(0, 8) + '01'; bit = bugun; }
  else if (ad === 'gecenay') {
    const d = _dkmParse(bugun.slice(0, 8) + '01');
    const son = new Date(d.getTime() - 86400000);
    bit = _dkmStr(son); bas = bit.slice(0, 8) + '01';
  } else { bit = bugun; bas = _dkmGunEkle(bugun, -29); }   // son 30 gun
  return { bas: bas, bit: bit };
}

function dkmDonemSec(ad) {
  const d = _dkmDonemHazir(ad);
  document.getElementById('dkmBas').value = d.bas;
  document.getElementById('dkmBit').value = d.bit;
  dkmYukle();
}

function initDashboardKcm() {
  _dkmStilEkle();
  const kap = document.getElementById('dkmIcerik');
  if (!kap) return;
  if (typeof hasPerm === 'function' && !hasPerm('dashboard_gor')) {
    kap.innerHTML = '<div class="empty" style="padding:30px;">Bu ekranı görüntüleme yetkiniz yok.</div>';
    return;
  }
  if (!DKM.donem.bas) { const d = _dkmDonemHazir('son30'); DKM.donem.bas = d.bas; DKM.donem.bit = d.bit; }
  kap.innerHTML =
    '<div class="dkm-wrap">' +
    '<div class="dkm-bar">' +
    '<div class="f"><label>Başlangıç</label><input type="date" id="dkmBas" value="' + DKM.donem.bas + '"></div>' +
    '<div class="f"><label>Bitiş</label><input type="date" id="dkmBit" value="' + DKM.donem.bit + '"></div>' +
    '<button class="dkm-btn" onclick="dkmYukle()">Göster</button>' +
    '</div>' +
    '<div class="dkm-chips">' +
    '<span class="dkm-chip" onclick="dkmDonemSec(\'son30\')">Son 30 gün</span>' +
    '<span class="dkm-chip" onclick="dkmDonemSec(\'buay\')">Bu ay</span>' +
    '<span class="dkm-chip" onclick="dkmDonemSec(\'gecenay\')">Geçen ay</span>' +
    '</div>' +
    '<div id="dkmSonuc"></div></div>';
  dkmYukle();
}

function _dkmGoster(html) {
  const el = document.getElementById('dkmSonuc');
  if (el) el.innerHTML = html;
}

async function dkmYukle() {
  const bas = (document.getElementById('dkmBas') || {}).value;
  const bit = (document.getElementById('dkmBit') || {}).value;
  if (!bas || !bit || bas > bit) { toast('Geçerli bir tarih aralığı seçin', 'error'); return; }
  DKM.donem.bas = bas; DKM.donem.bit = bit;
  const kap = _dkmKapsam();
  if (kap.bos) { _dkmGoster('<div class="empty" style="padding:24px;">Hesabınıza KÇM atanmamış, dashboard gösterilemiyor.</div>'); return; }
  const istek = ++DKM.istek;
  _dkmGoster('<div class="loader"><div class="spinner"></div></div><div style="text-align:center;font-size:12px;color:var(--text2);">Veriler yükleniyor, ilk açılışta biraz sürebilir...</div>');

  const hatalar = {};
  const basIso = _dkmIso(bas);
  const bitIso = _dkmIso(_dkmGunEkle(bit, 1));
  const bugun = _dkmBugun();
  const hedefBit = bit > bugun ? bugun : bit;          // hedef bugunu asmaz
  const g = {
    kadro: [], ziyaret: [], ziyaretTum: [], musteri: [], firsat: [], evrakLog: {},
    gorevler: [], aramalar: [], kontaklar: [], sanalIds: [],
    ayar: DKM.ayar, isGunu: 0, simdi: new Date(),
    basMs: new Date(basIso).getTime(), bitMs: new Date(bitIso).getTime(),
    kontakKontrol: dkmKontakKontrol
  };
  let tatil = { map: {}, takvimSonu: null };

  try {
    await _dkmAyarYukle();
    g.ayar = DKM.ayar;
    // 1. asama: birbirinden bagimsiz yuklemeler
    const sonuclar = await Promise.all([
      _dkmKadroYukle(kap).catch(function (e) { hatalar.kadro = e; return []; }),
      _dkmZiyaretYukle(kap, basIso, bitIso).catch(function (e) { hatalar.ziyaret = e; return []; }),
      _dkmMusteriYukle(kap).catch(function (e) { hatalar.musteri = e; return []; }),
      _dkmZiyaretTumYukle().catch(function (e) { hatalar.ziyaretTum = e; return []; }),
      _dkmFirsatYukle(kap).catch(function (e) { hatalar.firsat = e; return []; }),
      _dkmTatilYukle(bas, hedefBit).catch(function (e) { hatalar.tatil = e; return { map: {}, takvimSonu: null }; }),
      (typeof loadVeriKalitesiAyar === 'function' && !(window.VKAYAR && (window.VKAYAR.kontak_tipleri || []).length))
        ? loadVeriKalitesiAyar().catch(function () { return false; }) : Promise.resolve(true)
    ]);
    if (istek !== DKM.istek) return;   // arada baska bir istek baslatildi
    g.kadro = sonuclar[0]; g.ziyaret = sonuclar[1]; g.musteri = sonuclar[2];
    g.ziyaretTum = sonuclar[3]; g.firsat = sonuclar[4]; tatil = sonuclar[5];
    g.sanalIds = g.kadro.filter(function (u) { return u.is_sanal; }).map(function (u) { return u.my_id; });
    if (Array.isArray(window.sanalMyIds)) g.sanalIds = g.sanalIds.concat(window.sanalMyIds);
    g.isGunu = dkmIsGunu(bas, hedefBit, tatil.map);

    // 2. asama: ziyaret ve firsat sonuclarina bagli yuklemeler
    const ziyaretIds = g.ziyaret.map(function (v) { return v.visit_id; });
    const contactIds = g.ziyaret.map(function (v) { return v.contact_id; });
    const evrakIds = g.firsat.filter(function (o) { return (o.adim || o.durum) === 'Evrak'; }).map(function (o) { return o.opp_id; });
    const s2 = await Promise.all([
      _dkmEvrakLogYukle(evrakIds).catch(function (e) { hatalar.evrakLog = e; return {}; }),
      _dkmTeyitYukle(ziyaretIds).catch(function (e) { hatalar.teyit = e; return { gorevler: [], aramalar: [], tipYok: false }; }),
      _dkmKontakYukle(contactIds).catch(function (e) { hatalar.kontak = e; return []; })
    ]);
    if (istek !== DKM.istek) return;
    g.evrakLog = s2[0]; g.gorevler = s2[1].gorevler; g.aramalar = s2[1].aramalar; g.kontaklar = s2[2];
    if (s2[1].tipYok) hatalar.teyitTip = new Error('Ziyaret Teyit Araması görev tipi bulunamadı');
  } catch (e) {
    console.error('[dashboard] yukleme hatasi', e);
    _dkmGoster('<div class="dkm-hata">Veriler yüklenemedi: ' + escapeHTML((e && e.message) || String(e)) + '</div>');
    return;
  }

  const sonuc = dkmHesapla(g);
  DKM.sonuc = sonuc;
  _dkmCiz(sonuc, kap, { bas: bas, bit: bit, hedefBit: hedefBit, isGunu: g.isGunu, tatil: tatil, hatalar: hatalar });
}

function _dkmHucre(satir, b, sinif, tum) {
  const x = satir.v(b);
  const metin = (x === null || x === undefined || isNaN(x)) ? '-' : satir.f(x, b);
  let bar = '';
  if (satir.bar && x !== null && x !== undefined && !isNaN(x)) {
    const w = Math.max(0, Math.min(100, x));
    bar = '<div class="dkm-cubuk"><i style="width:' + w + '%"></i></div>';
  }
  return '<td class="' + (sinif || '') + (tum ? ' tp' : '') + '">' + escapeHTML(metin) + bar + '</td>';
}

function _dkmCiz(sonuc, kap, ctx) {
  const kovalar = sonuc.kovalar;
  const coklu = kovalar.length > 1;
  let html = '';

  // Uyarilar
  const uyar = [];
  if (!kovalar.length) uyar.push('Seçilen kapsamda MY/FMY kadrosu bulunamadı.');
  if (ctx.hedefBit < ctx.bit) uyar.push('Dönem bugünü aşıyor: hedef ' + ctx.bas + ' ile ' + ctx.hedefBit + ' arası ' + _dkmFmt(ctx.isGunu, 1) + ' iş günü üzerinden hesaplandı.');
  else uyar.push('Hedef ' + _dkmFmt(ctx.isGunu, 1) + ' iş günü üzerinden hesaplandı (hafta sonu ve resmi tatil hariç).');
  if (ctx.bit > DKM_TAKVIM_SONU || (ctx.tatil.takvimSonu && ctx.hedefBit > ctx.tatil.takvimSonu)) {
    uyar.push('Resmi tatil takvimi ' + (ctx.tatil.takvimSonu || DKM_TAKVIM_SONU) + ' tarihinde bitiyor. Sonrası için tatiller tanımlanmadığından hedef fazla çıkabilir.');
  }
  if (sonuc.notlar.kcmsizZiyaret > 0) uyar.push('KÇM bilgisi boş ' + sonuc.notlar.kcmsizZiyaret + ' ziyaret karşılaştırmaya dahil edilmedi.');
  if (sonuc.notlar.kcmUyumsuz > 0) uyar.push(sonuc.notlar.kcmUyumsuz + ' ziyaret, ziyareti giren kişinin kadrosundan farklı bir KÇM ye yazılmış (müşterinin KÇM si esas alındı).');
  if (sonuc.notlar.kcmsizMusteri > 0) uyar.push('KÇM bilgisi boş ' + sonuc.notlar.kcmsizMusteri + ' müşteri portföy hesabına girmiyor.');
  html += '<div class="dkm-not">' + uyar.map(escapeHTML).join('<br>') + '</div>';

  const hataAd = { kadro: 'Kadro', ziyaret: 'Ziyaret', musteri: 'Müşteri', ziyaretTum: 'Tüm zamanlar ziyaret', firsat: 'Fırsat', tatil: 'Resmi tatil takvimi', evrakLog: 'Evrak geçmişi', teyit: 'Teyit', teyitTip: 'Teyit görev tipi', kontak: 'Kontak' };
  const hk = Object.keys(ctx.hatalar);
  if (hk.length) {
    html += '<div class="dkm-hata"><b>Bazı veriler yüklenemedi, ilgili göstergeler eksik veya hatalı olabilir:</b><br>' +
      hk.map(function (k) { return escapeHTML((hataAd[k] || k) + ': ' + ((ctx.hatalar[k] && ctx.hatalar[k].message) || ctx.hatalar[k])); }).join('<br>') + '</div>';
  }

  DKM_BOLUMLER.forEach(function (bol) {
    html += '<div class="dkm-kart"><h3>' + escapeHTML(bol.baslik) + '</h3><div class="dkm-kaydir"><table class="dkm-tbl"><thead><tr><th>Gösterge</th>' +
      kovalar.map(function (b) { return '<th>' + escapeHTML(b.ad) + '</th>'; }).join('') +
      (coklu ? '<th class="tp">Toplam</th>' : '') + '</tr></thead><tbody>';
    bol.satirlar.forEach(function (s) {
      // en iyi / en kotu KCM i isaretle (en az iki KCM varsa)
      const degerler = kovalar.map(function (b) { const x = s.v(b); return (x === null || x === undefined || isNaN(x)) ? null : x; });
      const gecerli = degerler.filter(function (x) { return x !== null; });
      let enIyi = null, enKotu = null;
      if (s.iyi && gecerli.length > 1) {
        const mx = Math.max.apply(null, gecerli), mn = Math.min.apply(null, gecerli);
        if (mx !== mn) { enIyi = s.iyi === 'yuksek' ? mx : mn; enKotu = s.iyi === 'yuksek' ? mn : mx; }
      }
      html += '<tr><td>' + escapeHTML(s.e) + '</td>';
      kovalar.forEach(function (b, i) {
        let sinif = '';
        if (degerler[i] !== null && enIyi !== null) { if (degerler[i] === enIyi) sinif = 'dkm-iyi'; else if (degerler[i] === enKotu) sinif = 'dkm-kotu'; }
        html += _dkmHucre(s, b, sinif, false);
      });
      if (coklu) html += _dkmHucre(s, sonuc.toplam, '', true);
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
  });

  html += '<div class="dkm-kart"><h3>Tanımlar</h3><div class="dkm-tan">' +
    DKM_TANIMLAR.map(function (t) { return '<p style="margin-bottom:6px;"><b>' + escapeHTML(t[0]) + ':</b> ' + escapeHTML(t[1]) + '</p>'; }).join('') +
    '</div></div>';

  _dkmGoster(html);
}

/* ============================================================
   8) ADMIN: DASHBOARD AYARLARI (Admin Panel > Uygulama Ayarlari sekmesi)
   ============================================================ */
async function renderDashboardAyarlari() {
  const el = document.getElementById('dashboardAyarlariListesi');
  if (!el) return;
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const r = await sb.from('sistem_ayarlari').select('id,ayar_tipi,deger,gorunen_ad')
    .in('ayar_tipi', DKM_AYAR_TANIM.map(function (a) { return a.tip; })).eq('aktif', true);
  if (r.error) { el.innerHTML = '<div class="empty">Yüklenemedi: ' + escapeHTML(r.error.message) + '</div>'; return; }
  const mevcut = {};
  (r.data || []).forEach(function (a) { mevcut[a.ayar_tipi] = a; });
  el.innerHTML = DKM_AYAR_TANIM.map(function (t) {
    const m = mevcut[t.tip];
    const deger = m ? m.deger : t.varsayilan;
    return '<div class="field" style="margin-bottom:12px;"><label>' + escapeHTML(t.ad) + '</label>' +
      '<div style="display:flex;gap:8px;">' +
      '<input type="number" min="0.5" step="0.5" id="dkmAyar_' + t.tip + '" value="' + escapeHTML(String(deger)) + '" ' +
      'style="flex:1;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;">' +
      '<button class="btn btn-sm" style="background:var(--green);color:#04301f;" onclick="dashboardAyarKaydet(\'' + t.tip + '\')">💾 Kaydet</button>' +
      '</div>' + (m ? '' : '<div style="font-size:11px;color:var(--text3);margin-top:4px;">Kayıt henüz yok, varsayılan değer kullanılıyor. Kaydedince oluşturulur.</div>') +
      '</div>';
  }).join('');
}

async function dashboardAyarKaydet(tip) {
  const tanim = DKM_AYAR_TANIM.filter(function (a) { return a.tip === tip; })[0];
  const el = document.getElementById('dkmAyar_' + tip);
  if (!tanim || !el) return;
  const v = parseFloat(el.value);
  if (!(v > 0)) { toast('Geçerli bir sayı girin (0 dan büyük)', 'error'); return; }
  const var1 = await sb.from('sistem_ayarlari').select('id').eq('ayar_tipi', tip).maybeSingle();
  let hata = null;
  if (var1.data && var1.data.id !== undefined) {
    const u = await sb.from('sistem_ayarlari').update({ deger: String(v), aktif: true }).eq('id', var1.data.id);
    hata = u.error;
  } else {
    const i = await sb.from('sistem_ayarlari').insert({ ayar_tipi: tip, deger: String(v), gorunen_ad: tanim.ad, sira: tanim.sira, aktif: true });
    hata = i.error;
  }
  if (hata) { toast('Kaydedilemedi: ' + hata.message, 'error'); return; }
  toast('Kaydedildi', 'success');
  renderDashboardAyarlari();
}
