// ============================================================
// gorev_yonlendir.js — v1.0.0 (V31.195)
// Son guncelleme: 17.10.2026
//
// AMAC: Gorevleri baska bir kisiye YONLENDIRMEK (tek gorev + toplu).
//   Sahipsiz portfoy gorevleri, isten ayrilan personelin gorevleri ve is yuku
//   dengeleme icin. Gorev tipi ayrimi yoktur: tum tipler yonlendirilebilir.
//
// KURALLAR (Oktay'in kararlari, 17.10.2026):
//   - Yetki: hasPerm('gorev_yonlendir'). Hicbir role otomatik verilmez;
//     Rol&Yetki ekranindan verilir. KCM kapsamli: gorev_tumunu_gor yetkisi olmayan
//     kullanici yalniz KENDI KCM'indeki gorevleri yonlendirir.
//   - Hedef listesi: gorevin KCM'indeki aktif, sanal olmayan kullanicilar.
//     "MY TANIMSIZ" gibi yer tutucu (is_sanal) kullanicilar listede CIKMAZ.
//   - Tamamlandi / Iptal / Reddedildi gorev yonlendirilemez.
//   - Yonlendirme notu ZORUNLU: parametrik sablon (gorev_yonlendirme_notlari
//     tablosu) ve/veya serbest metin; en az biri dolu olmali.
//   - Kayit YENI tabloya degil, mevcut task_logs'a yazilir:
//     aksiyon='Yonlendirildi', detay='Eski -> Yeni. Not: ...'.
//   - Yeni sorumluya HER gorev icin ayri e-posta gider (toplu islemde de).
//     Gonderim tek noktadan: bildirim.js -> bildirimGonder(), fromKey 'sifre'
//     (Sikayet gorevi e-postasiyla ayni hat). E-posta hatasi yonlendirmeyi
//     GERI ALMAZ; sonunda uyari verilir.
//   - Durum degismez; yalnizca tasks.atanan_id degisir.
//
// BAGIMLILIK: gorev.js (GOREV, filteredGorevler, renderGorevListesi,
//   loadGorevler, openGorevDetay), bildirim.js, config.js (hasPerm, getScope,
//   escapeHTML, toast, openModal, closeModal). index.html'de gorev.js'ten SONRA
//   yuklenir.
// ============================================================
'use strict';

var GYON = {
  secili:      new Set(),   // toplu secimdeki task_id'ler
  gorevIds:    [],          // acik pencerenin gorevleri
  kcmId:       null,
  adaylar:     [],          // hedef kisiler
  notlar:      [],          // not sablonlari
  secilenNot:  null,        // secili sablon (not_id)
  calisiyor:   false
};

var GYON_KAPALI = ['Tamamlandı', 'İptal', 'Reddedildi'];

// ---- Yetki / uygunluk ----------------------------------------------------
function _gyTumKcm() {
  return hasPerm('gorev_tumunu_gor') && getScope('gorev') !== 'KÇM';
}

function _gyKcmOf(t) {
  if (t.kcm_id) return Number(t.kcm_id);
  return _gyTumKcm() ? null : (Number(currentUser.kcm_id) || null);
}

function gorevYonlendirilebilir(t) {
  if (!t || !hasPerm('gorev_yonlendir')) return false;
  if (GYON_KAPALI.includes(t.durum)) return false;
  const k = _gyKcmOf(t);
  if (!k) return false;
  if (!_gyTumKcm() && k !== Number(currentUser.kcm_id)) return false;
  return true;
}

// ---- gorev.js'in cagirdigi HTML parcalari --------------------------------
function gorevYonlendirKartCheckbox(t) {
  if (!gorevYonlendirilebilir(t)) return '';
  return '<input type="checkbox" title="Toplu yönlendirme için seç" ' +
    (GYON.secili.has(t.task_id) ? 'checked ' : '') +
    'onclick="event.stopPropagation()" ' +
    'onchange="gorevYonlendirSecDegis(' + t.task_id + ',this.checked)" ' +
    'style="width:16px;height:16px;margin:0;cursor:pointer;">';
}

function gorevYonlendirKartButon(t) {
  if (!gorevYonlendirilebilir(t)) return '';
  return '<button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:11px;" ' +
    'onclick="gorevYonlendirAc(' + t.task_id + ')">↪ Yönlendir</button> ';
}

function gorevYonlendirDetayButon(t) {
  if (!gorevYonlendirilebilir(t)) return '';
  return '<button class="btn btn-ghost btn-sm" style="padding:6px 12px;" ' +
    'onclick="gorevYonlendirAc(' + t.task_id + ')">↪ Yönlendir</button>';
}

// ---- Toplu secim cubugu --------------------------------------------------
function gorevYonlendirSecDegis(id, on) {
  if (on) GYON.secili.add(id); else GYON.secili.delete(id);
  gorevYonlendirBarGuncelle();
}

function gorevYonlendirTumunuSec(on) {
  const liste = filteredGorevler().filter(gorevYonlendirilebilir);
  liste.forEach(function (t) {
    if (on) GYON.secili.add(t.task_id); else GYON.secili.delete(t.task_id);
  });
  renderGorevListesi();
}

function gorevYonlendirSeciminiTemizle() {
  GYON.secili.clear();
  renderGorevListesi();
}

function gorevYonlendirBarGuncelle() {
  const el = document.getElementById('gorevYonlendirBar');
  if (!el) return;
  if (!hasPerm('gorev_yonlendir')) { el.innerHTML = ''; return; }

  // Secimi guncel listeyle uyumla (yenileme / kapanan gorevler)
  const gecerli = new Set(GOREV.tasks.filter(gorevYonlendirilebilir).map(function (t) { return t.task_id; }));
  GYON.secili.forEach(function (id) { if (!gecerli.has(id)) GYON.secili.delete(id); });

  const gorunen = filteredGorevler().filter(gorevYonlendirilebilir);
  if (!gorunen.length && !GYON.secili.size) { el.innerHTML = ''; return; }

  const hepsi = gorunen.length > 0 && gorunen.every(function (t) { return GYON.secili.has(t.task_id); });
  const n = GYON.secili.size;
  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;' +
    'background:var(--navy2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:12px;">' +
      '<label style="display:flex;align-items:center;gap:6px;color:var(--text2);cursor:pointer;">' +
        '<input type="checkbox" ' + (hepsi ? 'checked ' : '') +
        'onchange="gorevYonlendirTumunuSec(this.checked)" style="width:16px;height:16px;margin:0;">' +
        'Görünen ' + gorunen.length + ' görevi seç' +
      '</label>' +
      (n ? '<button class="btn btn-sm" style="padding:6px 12px;font-size:12px;background:var(--blue);color:#fff;margin-left:auto;" ' +
           'onclick="gorevYonlendirAc(Array.from(GYON.secili))">↪ Seçilenleri Yönlendir (' + n + ')</button>' +
           '<button class="btn btn-ghost btn-sm" style="padding:6px 10px;font-size:12px;" ' +
           'onclick="gorevYonlendirSeciminiTemizle()">Temizle</button>' : '') +
    '</div>';
}

// ---- Pencere -------------------------------------------------------------
async function gorevYonlendirAc(idler) {
  idler = Array.isArray(idler) ? idler : [idler];
  const gorevler = idler
    .map(function (id) { return GOREV.tasks.find(function (t) { return t.task_id === id; }); })
    .filter(Boolean)
    .filter(gorevYonlendirilebilir);

  if (!gorevler.length) {
    toast('Yönlendirilebilir görev yok (tamamlanan, iptal ve reddedilen görevler yönlendirilemez)', 'error');
    return;
  }
  const kcmler = Array.from(new Set(gorevler.map(_gyKcmOf)));
  if (kcmler.length !== 1) {
    toast('Seçilen görevler farklı KÇM\'lere ait. Tek bir KÇM\'nin görevlerini seçin.', 'error');
    return;
  }
  const kcmId = kcmler[0];
  const elenen = idler.length - gorevler.length;

  GYON.gorevIds   = gorevler.map(function (t) { return t.task_id; });
  GYON.kcmId      = kcmId;
  GYON.secilenNot = null;

  const [ru, rn] = await Promise.all([
    sb.from('users').select('my_id,ad_soyad,email,yetki_seviyesi')
      .eq('kcm_id', kcmId).eq('aktif', true).or('is_sanal.is.null,is_sanal.eq.false')
      .order('ad_soyad'),
    sb.from('gorev_yonlendirme_notlari').select('not_id,metin,sira')
      .eq('aktif', true).or('kcm_id.is.null,kcm_id.eq.' + kcmId)
      .order('sira').order('not_id')
  ]);
  if (ru.error) { toast('Kişi listesi alınamadı: ' + ru.error.message, 'error'); return; }
  if (rn.error) console.error('[gorev_yonlendir] not sablonlari alinamadi:', rn.error.message);
  GYON.adaylar = ru.data || [];
  GYON.notlar  = rn.data || [];

  if (!GYON.adaylar.length) {
    toast('Bu KÇM\'de yönlendirilecek aktif kullanıcı bulunamadı', 'error');
    return;
  }

  const tekGorev = gorevler.length === 1 ? gorevler[0] : null;
  const mevcutId = tekGorev ? tekGorev.atanan_id : null;

  const baslik = tekGorev
    ? '<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;">' + escapeHTML(tekGorev.baslik) + '</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:12px;">Şu an: ' +
        (tekGorev.atanan_id ? escapeHTML(tekGorev.atanan ? tekGorev.atanan.ad_soyad : '#' + tekGorev.atanan_id) : 'Atanmamış') + '</div>'
    : '<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px;">' +
        gorevler.length + ' görev yönlendirilecek</div>';

  const uyari = elenen > 0
    ? '<div style="font-size:11px;color:var(--amber);margin-bottom:10px;">' + elenen +
      ' görev yönlendirilemediği için (kapalı veya yetki dışı) listeden çıkarıldı.</div>'
    : '';

  const kisiSecenekleri = '<option value="">Kişi seçin...</option>' +
    GYON.adaylar.map(function (u) {
      return '<option value="' + u.my_id + '">' + escapeHTML(u.ad_soyad) +
        (u.yetki_seviyesi ? ' (' + escapeHTML(u.yetki_seviyesi) + ')' : '') +
        (u.my_id === mevcutId ? ' — mevcut' : '') + '</option>';
    }).join('');

  const notChipleri = GYON.notlar.length
    ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">' +
        GYON.notlar.map(function (n) {
          return '<div class="chip-btn gy-not-chip" data-id="' + n.not_id + '" onclick="gorevYonlendirNotSec(' + n.not_id + ')">' +
            escapeHTML(n.metin) + '</div>';
        }).join('') +
      '</div>'
    : '';

  const stil = 'width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;font-size:13px;';
  document.getElementById('gorevYonlendirIcerik').innerHTML =
    baslik + uyari +
    '<label style="display:block;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase;">Yeni sorumlu</label>' +
    '<select id="gyHedef" style="' + stil + 'margin-bottom:14px;">' + kisiSecenekleri + '</select>' +
    '<label style="display:block;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase;">Yönlendirme notu (zorunlu)</label>' +
    notChipleri +
    '<textarea id="gyNotSerbest" placeholder="Ek açıklama (şablon seçtiysen isteğe bağlı)" style="' + stil + 'min-height:60px;resize:vertical;"></textarea>' +
    '<div style="font-size:11px;color:var(--text3);margin-top:8px;">Yeni sorumluya her görev için ayrı e-posta gider.</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;">' +
      '<button class="btn-iptal" onclick="closeModal(\'gorevYonlendirModal\')">✕ İptal</button>' +
      '<button class="btn-kaydet" id="gyUygulaBtn" onclick="gorevYonlendirUygula()">↪ Yönlendir</button>' +
    '</div>';

  openModal('gorevYonlendirModal');
}

function gorevYonlendirNotSec(notId) {
  GYON.secilenNot = (GYON.secilenNot === notId) ? null : notId;
  document.querySelectorAll('#gorevYonlendirIcerik .gy-not-chip').forEach(function (c) {
    c.classList.toggle('selected', Number(c.dataset.id) === GYON.secilenNot);
  });
}

// ---- Uygulama ------------------------------------------------------------
async function gorevYonlendirUygula() {
  if (GYON.calisiyor) return;

  const hedef = parseInt(document.getElementById('gyHedef').value, 10);
  if (!hedef) { toast('Yeni sorumluyu seçin', 'error'); return; }
  const aday = GYON.adaylar.find(function (u) { return u.my_id === hedef; });
  if (!aday) { toast('Seçilen kişi geçerli değil', 'error'); return; }

  const sablon = GYON.notlar.find(function (n) { return n.not_id === GYON.secilenNot; });
  const serbest = (document.getElementById('gyNotSerbest').value || '').trim();
  const not = [sablon ? sablon.metin : '', serbest].filter(Boolean).join(' — ');
  if (!not) { toast('Yönlendirme notu zorunlu: bir not seçin veya yazın', 'error'); return; }

  GYON.calisiyor = true;
  const btn = document.getElementById('gyUygulaBtn');
  if (btn) btn.disabled = true;

  const sonuc = { tamam: 0, atlanan: 0, hata: 0, logHata: 0, mailOk: 0, mailAdresYok: 0, mailHata: 0, mailGerekmedi: 0 };
  const n = GYON.gorevIds.length;
  for (let i = 0; i < n; i++) {
    if (btn) btn.textContent = 'İşleniyor ' + (i + 1) + '/' + n;
    let r;
    try { r = await _gyTekYonlendir(GYON.gorevIds[i], aday, not); }
    catch (e) { console.error('[gorev_yonlendir] beklenmeyen hata:', e); r = { durum: 'hata' }; }

    if (r.durum === 'tamam') {
      sonuc.tamam++;
      if (r.logHata) sonuc.logHata++;
      if (r.mail === 'ok') sonuc.mailOk++;
      else if (r.mail === 'adres_yok') sonuc.mailAdresYok++;
      else if (r.mail === 'gerekmedi') sonuc.mailGerekmedi++;
      else sonuc.mailHata++;
    } else if (r.durum === 'atlandi') sonuc.atlanan++;
    else sonuc.hata++;
  }
  GYON.calisiyor = false;

  GYON.secili.clear();
  closeModal('gorevYonlendirModal');
  closeModal('gorevDetayModal');

  const parcalar = [sonuc.tamam + ' görev ' + aday.ad_soyad + ' kişisine yönlendirildi'];
  if (sonuc.atlanan) parcalar.push(sonuc.atlanan + ' görev atlandı (kapandı veya başkası değiştirdi)');
  if (sonuc.hata) parcalar.push(sonuc.hata + ' görevde hata oluştu');
  if (sonuc.mailAdresYok) parcalar.push(sonuc.mailAdresYok + ' e-posta gitmedi: alıcının adresi tanımlı değil');
  if (sonuc.mailHata) parcalar.push(sonuc.mailHata + ' e-posta gönderilemedi');
  if (sonuc.logHata) parcalar.push(sonuc.logHata + ' görevde geçmiş kaydı yazılamadı');
  const sorunlu = sonuc.atlanan || sonuc.hata || sonuc.mailAdresYok || sonuc.mailHata || sonuc.logHata;
  toast(parcalar.join('. '), sorunlu ? 'error' : 'success');

  await loadGorevler(true);
}

async function _gyTekYonlendir(taskId, aday, not) {
  // 1) Guncel durumu DB'den dogrula (liste eskimis olabilir)
  const { data: g, error } = await sb.from('tasks')
    .select('task_id,baslik,durum,atanan_id,ncst,deadline')
    .eq('task_id', taskId).maybeSingle();
  if (error || !g) return { durum: 'hata' };
  if (GYON_KAPALI.includes(g.durum)) return { durum: 'atlandi' };
  if (g.atanan_id === aday.my_id) return { durum: 'atlandi' };

  let eskiAd = 'Atanmamış';
  if (g.atanan_id) {
    const { data: u } = await sb.from('users').select('ad_soyad').eq('my_id', g.atanan_id).maybeSingle();
    eskiAd = (u && u.ad_soyad) ? u.ad_soyad : '#' + g.atanan_id;
  }

  // 2) Atamayi degistir. Baskasi arada degistirdiyse (eski atanan farkli) 0 satir doner.
  let upd = sb.from('tasks')
    .update({ atanan_id: aday.my_id, guncelleme_tarihi: new Date().toISOString() })
    .eq('task_id', taskId);
  upd = (g.atanan_id == null) ? upd.is('atanan_id', null) : upd.eq('atanan_id', g.atanan_id);
  const { data: guncel, error: e2 } = await upd.select('task_id');
  if (e2) { console.error('[gorev_yonlendir] guncelleme hatasi:', e2.message); return { durum: 'hata' }; }
  if (!guncel || !guncel.length) return { durum: 'atlandi' };

  // 3) Gorev gecmisine yaz (mevcut task_logs)
  const { error: e3 } = await sb.from('task_logs').insert({
    task_id: taskId,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad,
    aksiyon: 'Yönlendirildi',
    detay:   eskiAd + ' → ' + aday.ad_soyad + '. Not: ' + not
  });
  if (e3) console.error('[gorev_yonlendir] log hatasi:', e3.message);

  // 4) Yeni sorumluya e-posta (kendine yonlendirmede gerekmez)
  let mail = 'gerekmedi';
  if (aday.my_id !== currentUser.my_id) {
    mail = await _gyMailGonder(g, aday, eskiAd, not);
  }
  return { durum: 'tamam', logHata: !!e3, mail: mail };
}

// Donus: 'ok' | 'adres_yok' | 'hata'
async function _gyMailGonder(g, aday, eskiAd, not) {
  try {
    if (!aday.email) return 'adres_yok';
    const c = GOREV.tasks.find(function (t) { return t.task_id === g.task_id; });
    const musteri = (c && c.musteri && c.musteri.unvan) || g.ncst || '-';
    const tip = (c && c.task_types && c.task_types.tip_adi) || '-';
    const deadline = g.deadline || '-';
    const konu = 'Görev Yönlendirildi — ' + g.baslik;
    const text = 'Aşağıdaki görev size yönlendirildi.\n\n' +
      'Görev: ' + g.baslik + '\n' +
      'Görev tipi: ' + tip + '\n' +
      'Müşteri: ' + musteri + '\n' +
      'Deadline: ' + deadline + '\n' +
      'Yönlendiren: ' + currentUser.ad_soyad + '\n' +
      'Önceki sorumlu: ' + eskiAd + '\n' +
      'Yönlendirme notu: ' + not + '\n' +
      'Görev No: #' + g.task_id + '\n\n' +
      'Bu e-posta Şengüller Saha Satış Uygulaması tarafından otomatik gönderilmiştir.';
    const html = '<p>Aşağıdaki görev size yönlendirildi.</p>' +
      '<p><b>Görev:</b> ' + escapeHTML(g.baslik) + '<br>' +
      '<b>Görev tipi:</b> ' + escapeHTML(tip) + '<br>' +
      '<b>Müşteri:</b> ' + escapeHTML(musteri) + '<br>' +
      '<b>Deadline:</b> ' + escapeHTML(deadline) + '<br>' +
      '<b>Yönlendiren:</b> ' + escapeHTML(currentUser.ad_soyad) + '<br>' +
      '<b>Önceki sorumlu:</b> ' + escapeHTML(eskiAd) + '<br>' +
      '<b>Yönlendirme notu:</b> ' + escapeHTML(not).replace(/\n/g, '<br>') + '<br>' +
      '<b>Görev No:</b> #' + escapeHTML(String(g.task_id)) + '</p>' +
      '<p style="color:#888;font-size:12px;">Bu e-posta Şengüller Saha Satış Uygulaması tarafından otomatik gönderilmiştir.</p>';
    const ok = await bildirimGonder([aday.email], konu, text, html, 'sifre');
    return ok ? 'ok' : 'hata';
  } catch (e) {
    console.error('[gorev_yonlendir] e-posta hatasi:', e && e.message ? e.message : e);
    return 'hata';
  }
}

console.log('Görev yönlendirme modülü yüklendi ✓');
