// ============================================================
// donanim.js — v1.0.23 (V31.57)
//   v1.0.23 (V31.57): MY/FMY gorunurlugu DEPO bazli oldu + tedarik talebi.
//     loadDonanimListesi artik kcm_id yerine depo_id ile kapsam uyguluyor
//     (kullanicinin KCM ANA deposu + tum_kcm ortak stok). Yeni 'Sadece stokta
//     olanlar anahtari (varsayilan ACIK): kapatilinca tum katalog gorunur ve
//     stokta olmayan urun TALEP EDILEBILIR. Yeni Talepler sekmesi: MY kendi
//     taleplerini, donanim_yonet tumunu gorur ve Karsilandi/Reddedildi yapar.
//     Yeni: _donanimDepoHaritasi, _donanimAnaDepoId, _donanimMerkezDepoId,
//     _donanimSadeceStokAcik, donanimSadeceStokDegisti, _donanimListeBirlestir,
//     donanimTalepModalAc, donanimTalepMusteriAramaDebounce,
//     _donanimTalepMusteriAra, donanimTalepMusteriSec, donanimTalepMusteriTemizle,
//     donanimTalepGonder, loadDonanimTalepListesi, donanimTalepDurum,
//     _donanimTalepBadge. SQL: yok (stok_tedarik_talepleri Faz 1 de kuruldu).
// donanim.js — v1.0.22 (V31.56)
//   v1.0.22 (V31.56): Depo Stok Raporu — Depolar sekmesinde pivot rapor
//     (satir=urun, kolon=depo, hucre=adet) + 3 sayfali .xlsx cikti:
//     'Ozet' (pivot), 'Detay' (depo x urun; toplam/rezerve/on rezerve/musait/
//     ortak stok/aktif), 'Depo Ozet' (depo basina urun ve cihaz sayisi).
//     Rapor tamamen ADET bazlidir, IMEI hicbir sayfada yer almaz.
//     'Stogu olmayanlari da goster' anahtari ekran ve Excel'i birlikte etkiler.
//     Yeni: donanimRaporAc, _donanimRaporVeri, _donanimRaporRender,
//     donanimRaporBosDegisti, donanimRaporExcelIndir.
// donanim.js — v1.0.21 (V31.55)
//   v1.0.21 (V31.55): 'Depolar' sekmesi — Depo & Muhasebe dagitim ekrani.
//     Depo agaci (Merkez Depo + her KCM sanal depo + istege bagli birer cep
//     depo), depo bazli ozet kartlari, urun bazli dagitim modali. Merkez ->
//     diger depolara ADET tahsisi (seri/IMEI tasinmaz). Kurallar: toplam
//     dagitim havuzu asamaz; bir deponun tahsisi rezerve+on_rezerve altina
//     inemez (dogrulama TUMU yazilmadan once); adet 0 + rezervasyon yok ->
//     satir silinir; urun pasife alininca ayni malzeme_kodu'nun tum depo
//     satirlari pasif. Ortak stok (tum_kcm) anahtari urun bazinda.
//     SQL: Adim D onceden calistirildi (depolar, depolar_v, stok_urunleri.depo_id).
// donanim.js — v1.0.20 (V31.54)
//   v1.0.20 (V31.54): Excel stok yukleme ANA DEPOYA (cihaz havuzu) yapilir.
//     KCM/depo secimi kaldirildi; hedef her zaman katalog satiri
//     (stok_urunleri.kcm_id IS NULL). IMEI filtresi: yalnizca 15 haneli tam
//     sayisal seriler alinir (18 haneli ICCID vb. atlanir). Katalog satiri
//     SELECT->yoksa INSERT ile bulunur (PostgREST on_conflict kismi indeksi
//     hedefleyemedigi icin upsert kullanilamaz). toplam_adet artirilmaz,
//     'Depoda' seri sayisi olarak YENIDEN SAYILIR (idempotent). Ekran raporu
//     sadelesti (yuklenen+hata+mevcut); atlanan satirlar tek ozet satirinda,
//     tam liste indirilen Excel raporunda. Dosya ici mukerrer seri ayiklanir.
//     Yeni: _donanimSeriTemizle, _donanimImeiMi, _donanimKatalogSatiriBul,
//     _donanimKatalogAdetYenile.
// donanim.js — v1.0.19 (V31.26)
//   v1.0.19 (V31.26): Tedarik akışı bildirimi — Ana menü 'Donanım Takip'
//     ikonunda rozet: kullanıcının kendi (satan/rezerve eden) siparişlerinden
//     'Onaylandı' durumunda olan varsa sayı görünür (_donanimBadgeGuncelle,
//     initApp'te proaktif + Rezervasyonlar listesi her yüklendiğinde günceller).
//     Rezervasyon kartında kullanıcının kendi yeni-onaylanan siparişi turuncu
//     glow + '🔔 Onaylandı' rozetiyle öne çıkar.
// donanim.js — v1.0.18 (V31.25)
//   v1.0.18 (V31.25): Satış Tipi (Peşin/OLM/Turkcell Finansman) — ön rezervasyon
//     olusturmada zorunlu secim, rezervasyon karti + detay + duzenleme
//     modallarinda gosterilir/duzenlenebilir. Rezervasyon karti artik sepet_id
//     bazinda sipariş adimina gore renkli kenarlik alir (DONANIM_SUREC_ADIMLARI).
//     DB: stok_rezervasyonlari.satis_tipi (yeni kolon, kullanicinin calistirmasi
//     gerekir — bkz devir notu).
// donanim.js — v1.0.17 (V31.18)
//   v1.0.17 (V31.18): IMEI maskeleme (2.4) — donanim_imei_gor yetkisi olmayan
//     kullanicilar (MY/FMY vb.) atanmis IMEI'leri ilk4+son4 maskeli gorur.
//     Rezervasyon detayina atanan cihaz (IMEI) listesi eklendi (maskeli/tam).
// donanim.js — v1.0.16 (V31.10)
//   v1.0.16 (V31.10): IMEI modal acilista bostaki serileri otomatik listeler.
// donanim.js — v1.0.15 (V31.09)
//   v1.0.15 (V31.09): IMEI eslestirme modali (2.3) — barcode+arama, urun_id
//     (KÇM) kilidi, kismi eslestirme, seri durum Depoda->Ayrildi + kompanzasyon.
// donanim.js — v1.0.14 (V31.06)
//   v1.0.14 (V31.06): MY (rezerve eden) her aktif adimda kendi kaydini iptal
//     eder; iptal stok/seri geri doner. Liste PRT filtresi rezerve_eden_id dahil.
// donanim.js — v1.0.13 (V31.05)
//   v1.0.13 (V31.05): Surec ilerletme motoru (2.2) — durum makinesi butonlari
//     + donanimSurecIlerlet + _donanimSurecYetki (kapsam). IMEI modal placeholder.
// donanim.js — v1.0.12 (V31.03)
//   v1.0.12 (V31.03): _donanimRezHareketLog — rezervasyon olaylari urun_id +
//     Musteri(unvan+ncst) + Satan ile per-kalem loglanir (urun gecmisi).
// donanim.js — v1.0.11 (V31.02)
//   v1.0.11 (V31.02): openDonanimTimeline gerçek görünüm (stok_hareketleri).
// donanim.js — v1.0.10 (V31.01)
//   v1.0.10 (V31.01): Stok listesi tazeleme — Stok sekmesine geçiste ve
//     rezervasyon onay/red/iptal sonrasi loadDonanimListesi() cagrilir.
// donanim.js — v1.0.9 (V31.00)
//   v1.0.9 (V31.00): Rezervasyon paket düzenleme (1.3) — ekle/çıkar/adet +
//     durum-farkında stok diff + (sepet_id,urun_id) hedefli satır senkronu.
// donanim.js — v1.0.8 (V30.99)
//   v1.0.8 (V30.99): donanimRezervasyonRed (1.1) + donanimRezervasyonIptal (1.2).
// donanim.js — v1.0.7 (V30.98)
//   v1.0.7 (V30.98): Transfer onay akışı — onay1/onay2/red/iptal + stok taşıma
//     (müsait yeniden kontrol, çift-onay guard, hedef hata->kaynak kompanzasyon).
// donanim.js — v1.0.6 (V30.97)
//   v1.0.6 (V30.97): Transfer sekme butonu yetkiyle gizlenir (initDonanimPage).
// donanim.js — v1.0.5 (V30.96)
//   v1.0.5 (V30.96): Transfer sekmesi + Yeni Talep modalı + talep listesi.
// donanim.js — v1.0.4 (V30.94)
//   v1.0.4 (V30.94): _donanimRezOnayYetkisi -> getScope('donanim_takip').
// donanim.js — v1.0.3 (V30.92)
//   v1.0.3 (V30.92): Rezervasyon kartına Müşteri/Müşterinin MY'si/Rezerve eden.
// donanim.js — v1.0.2 (V30.91)
//   v1.0.2 (V30.91): openDonanimRezDetay embedded join (400) -> 2 sorgu.
// donanim.js — v1.0.1 (V30.90)
//   v1.0.1 (V30.90): Rezervasyon onay yetkisine Takım Lideri eklendi
//     (kendi ekibi = bagliMyIds). Yetki tek noktada: _donanimRezOnayYetkisi().
//     donanimRezervasyonOnayla() başına savunmacı guard.
// donanim.js — v1.0.0 (V30.84)
// ------------------------------------------------------------
// DONANIM TAKİP MODÜLÜ — MVP: liste + filtre + görüntüleme
//   • getScope('donanim'): MY/FMY=KÇM, TL/Müdür/Muhasebe&Depo/Admin=TÜM
//   • hasPerm('donanim_yonet'): ürün ekle/düzenle
//   • hasPerm('donanim_rezerve_et'): rezervasyon yap/iptal
// Bu dosya SADECE görüntüleme + filtre içerir (Adım 4a).
// Ekleme/düzenleme/rezervasyon formları sonraki adımlarda eklenecek.
// ============================================================
'use strict';

window._donanimList = [];
window._donanimKcmList = [];

window._donanimSepet = {}; // urun_id -> {urun, adet}
window._donanimSecimModu = false;

async function initDonanimPage(){
  const yonetBtn = document.getElementById('donanimYeniUrunBtn');
  if(yonetBtn) yonetBtn.style.display = hasPerm('donanim_yonet') ? '' : 'none';
  const excelBtn = document.getElementById('donanimExcelYukleBtn');
  if(excelBtn) excelBtn.style.display = hasPerm('donanim_yonet') ? '' : 'none';
  const rezBtn = document.getElementById('donanimRezervasyonBtn');
  if(rezBtn) rezBtn.style.display = hasPerm('donanim_on_rezerve_et') ? '' : 'none';
  // v30.97: Transfer sekmesi yalnız transfer yetkisi (talep VEYA onay) olanda görünür
  const transferTabBtn = document.getElementById('donanimTabTransferBtn');
  if(transferTabBtn){
    const transferYetki = hasPerm('donanim_transfer_talep') || hasPerm('donanim_transfer_onay1') || hasPerm('donanim_transfer_onay2');
    transferTabBtn.style.display = transferYetki ? '' : 'none';
  }
  // V31.55: Depolar sekmesi yalnız donanim_yonet yetkisinde görünür (Depo & Muhasebe)
  const depoTabBtn = document.getElementById('donanimTabDepoBtn');
  if(depoTabBtn) depoTabBtn.style.display = hasPerm('donanim_yonet') ? '' : 'none';
  // V31.57: Talepler sekmesi — talep açabilen VEYA karşılayan görür
  const talepTabBtn = document.getElementById('donanimTabTalepBtn');
  if(talepTabBtn) talepTabBtn.style.display = (hasPerm('donanim_on_rezerve_et') || hasPerm('donanim_yonet')) ? '' : 'none';
  window._donanimSepet = {};
  window._donanimSecimModu = false;
  window._donanimDepoCache = null;   // V31.57: her açılışta depo haritası tazelenir
  _donanimSepetBarGuncelle();

  await _loadDonanimKcmFiltre();
  await loadDonanimListesi();
  _donanimTalepBadge();
}

// KÇM filtre dropdown'unu doldurur (scope=TÜM olan roller için görünür)
async function _loadDonanimKcmFiltre(){
  const wrap = document.getElementById('donanimKcmFiltreWrap');
  const scope = getScope('donanim');
  if(scope !== 'TÜM'){
    if(wrap) wrap.style.display='none';
    return;
  }
  if(wrap) wrap.style.display='';
  if(window._donanimKcmList.length) return; // bir kez yükle
  const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
  window._donanimKcmList = data||[];
  const sel = document.getElementById('donanimKcmFiltre');
  if(sel){
    sel.innerHTML = '<option value="">Tüm KÇM\'ler</option>' +
      window._donanimKcmList.map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
  }
}

// Ana liste yükleme — scope + filtrelere göre
// Ana liste yükleme — V31.57: DEPO bazlı kapsam + "sadece stokta olanlar" anahtarı
//   Anahtar AÇIK  (varsayılan): yalnızca satılabilir ürünler (müsait > 0)
//   Anahtar KAPALI: tüm katalog görünür; stokta olmayanlarda "Talep Et"
async function loadDonanimListesi(){
  const listEl = document.getElementById('donanimListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  const scope = getScope('donanim');
  const sadeceStok = _donanimSadeceStokAcik();

  let hedefDepoId = null;   // kullanıcının (veya seçili KÇM'nin) ANA deposu
  let merkezDepoId = null;
  try{
    merkezDepoId = await _donanimMerkezDepoId();
    if(scope === 'TÜM'){
      const kcmFiltre = document.getElementById('donanimKcmFiltre')?.value;
      if(kcmFiltre) hedefDepoId = await _donanimAnaDepoId(parseInt(kcmFiltre));
    } else if(currentUser.kcm_id){
      hedefDepoId = await _donanimAnaDepoId(currentUser.kcm_id);
    }
  }catch(err){ console.error('[donanim] depo çözümlemesi:', err.message); }

  let q = sb.from('stok_musait').select('*').order('marka').order('model');

  if(hedefDepoId){
    // Kendi ana deposu + ortak stok (tum_kcm). Anahtar kapalıysa katalog da dahil.
    const parcalar = [`depo_id.eq.${hedefDepoId}`, 'tum_kcm.eq.true'];
    if(!sadeceStok && merkezDepoId) parcalar.push(`depo_id.eq.${merkezDepoId}`);
    q = q.or(parcalar.join(','));
  }
  // hedefDepoId yoksa (admin, KÇM filtresi seçilmemiş) kapsam kısıtı uygulanmaz

  // v30.85: kelime-bazlı arama (sıra önemsiz) — aciklama + malzeme_kodu içinde
  const aramaMetni = document.getElementById('donanimMarkaFiltre')?.value?.trim();
  if(aramaMetni){
    const kelimeler = aramaMetni.split(/\s+/).filter(Boolean);
    kelimeler.forEach(kelime=>{
      q = q.or(`aciklama.ilike.%${kelime}%,malzeme_kodu.ilike.%${kelime}%`);
    });
  }

  const {data, error} = await q;
  if(error){
    listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`;
    return;
  }
  window._donanimList = _donanimListeBirlestir(data||[], hedefDepoId, merkezDepoId, sadeceStok);
  _renderDonanimListesi(window._donanimList);
}

function _donanimSadeceStokAcik(){
  const el = document.getElementById('donanimSadeceStok');
  return el ? !!el.checked : true;
}

function donanimSadeceStokDegisti(){ loadDonanimListesi(); }

// Aynı malzeme_kodu için kendi deposundaki satır önceliklidir; yoksa katalog
// satırı 0 adetle gösterilir (talep edilebilsin diye).
function _donanimListeBirlestir(satirlar, hedefDepoId, merkezDepoId, sadeceStok){
  if(!hedefDepoId){
    return sadeceStok ? satirlar.filter(u => (u.musait_adet||0) > 0) : satirlar;
  }
  const kendi = {}, katalog = {};
  satirlar.forEach(u=>{
    const k = u.malzeme_kodu || ('#'+u.urun_id);
    const merkezSatiri = (merkezDepoId && u.depo_id === merkezDepoId && !u.tum_kcm);
    if(merkezSatiri){ katalog[k] = u; return; }
    if(!kendi[k] || (u.musait_adet||0) > (kendi[k].musait_adet||0)) kendi[k] = u;
  });

  const cikti = [];
  Object.keys(kendi).forEach(k=>{
    const u = kendi[k];
    if(sadeceStok && (u.musait_adet||0) <= 0) return;
    cikti.push(u);
  });
  if(!sadeceStok){
    Object.keys(katalog).forEach(k=>{
      if(kendi[k]) return;
      cikti.push(Object.assign({}, katalog[k], {toplam_adet:0, rezerve_adet:0, musait_adet:0}));
    });
  }
  cikti.sort((a,b)=> (a.aciklama||a.malzeme_kodu||'').localeCompare(b.aciklama||b.malzeme_kodu||'','tr'));
  return cikti;
}

function _renderDonanimListesi(list){
  const listEl = document.getElementById('donanimListesi');
  if(!listEl) return;
  if(!list.length){
    const sadeceStok = _donanimSadeceStokAcik();
    listEl.innerHTML = sadeceStok
      ? '<div class="empty">Stokta ürün yok.<br><span style="font-size:12px;color:var(--text3);">Tüm ürünleri görmek için üstteki “Sadece stokta olanlar” anahtarını kapatın.</span></div>'
      : '<div class="empty">Kayıtlı ürün bulunamadı.</div>';
    return;
  }
  const canYonet = hasPerm('donanim_yonet');
  const canRezerve = hasPerm('donanim_rezerve_et');
  const canOnRezerve = hasPerm('donanim_on_rezerve_et');
  const kcmAdMap = {};
  (window._donanimKcmList||[]).forEach(k=>{ kcmAdMap[k.kcm_id]=k.kcm_adi; });

  // v30.85: Gösterim artık ERP açıklaması bazlı (marka/model ayrıştırma yok)
  listEl.innerHTML = list.map(u=>{
    const musait = u.musait_adet ?? (u.toplam_adet - u.rezerve_adet);
    const renkli = musait > 0 ? 'var(--green)' : 'var(--red)';
    const kcmAd = kcmAdMap[u.kcm_id] || (u.kcm_id ? ('KÇM#'+u.kcm_id) : 'Ana depo');
    const baslik = u.aciklama || [u.marka,u.model,u.renk,u.gb_hafiza].filter(Boolean).join(' ') || 'İsimsiz ürün';
    // V31.57: stokta olmayan üründe satış yerine tedarik talebi
    const talepEdilebilir = (musait <= 0) && canOnRezerve;
    return `<div class="visit-card" style="margin-bottom:8px;${musait<=0?'opacity:.85;':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHTML(baslik)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px;">${escapeHTML(kcmAd)}${u.malzeme_kodu?' · Kod: '+escapeHTML(u.malzeme_kodu):''}${u.tum_kcm?' · ortak stok':''}</div>
        </div>
        ${canYonet?`<button class="icon-btn" onclick="openDonanimDuzenle(${u.urun_id})" title="Düzenle">✏️</button>`:''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
        <div>
          <span style="font-size:18px;font-weight:800;color:${renkli};">${musait}</span>
          <span style="font-size:11px;color:var(--text3);"> adet müsait</span>
          ${u.rezerve_adet>0?`<span style="font-size:11px;color:var(--amber);"> (${u.rezerve_adet} rezerve)</span>`:''}
        </div>
        ${u.fiyat?`<div style="font-size:13px;font-weight:700;">${Number(u.fiyat).toLocaleString('tr-TR')} ₺</div>`:'<div style="font-size:11px;color:var(--text3);">Fiyat girilmemiş</div>'}
      </div>
      ${window._donanimSecimModu && canOnRezerve && musait>0 ? `
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <input type="checkbox" id="donanimChk_${u.urun_id}" onchange="donanimSepetToggle(${u.urun_id})" style="width:18px;height:18px;" ${window._donanimSepet[u.urun_id]?'checked':''}>
        <label for="donanimChk_${u.urun_id}" style="font-size:12px;flex:1;">Seç</label>
        <input type="number" min="1" max="${musait}" value="${window._donanimSepet[u.urun_id]?.adet||1}" id="donanimAdet_${u.urun_id}" oninput="donanimSepetAdetGuncelle(${u.urun_id}, this.value)" style="width:60px;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px;font-size:13px;text-align:center;">
      </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="openDonanimTimeline(${u.urun_id})">📜 Geçmiş</button>
        ${talepEdilebilir?`<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="donanimTalepModalAc(${u.urun_id})">🛒 Talep Et</button>`:''}
      </div>
    </div>`;
  }).join('');
}

let _donanimFiltreTimer=null;
function donanimFiltreDegistiDebounce(){
  clearTimeout(_donanimFiltreTimer);
  _donanimFiltreTimer=setTimeout(loadDonanimListesi,350);
}
function donanimFiltreDegisti(){
  loadDonanimListesi();
}

// Placeholder'lar — sonraki adımlarda doldurulacak
function openDonanimDuzenle(urunId){ toast('Ürün düzenleme — bir sonraki adımda eklenecek','info'); }
function openDonanimRezervasyon(urunId){ toast('Rezervasyon formu — bir sonraki adımda eklenecek','info'); }
// v31.02: Stok geçmişi — stok_hareketleri kayıtlarını ürün bazında gösterir
async function openDonanimTimeline(urunId){
  const icerik = document.getElementById('donanimTimelineIcerik');
  const baslik = document.getElementById('donanimTimelineBaslik');
  icerik.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  baslik.textContent = '';
  openModal('donanimTimelineModal');

  const {data:urun} = await sb.from('stok_urunleri').select('aciklama,marka,model,renk,gb_hafiza,malzeme_kodu').eq('urun_id',urunId).single();
  if(urun){ baslik.textContent = (urun.aciklama || [urun.marka,urun.model,urun.gb_hafiza,urun.renk].filter(Boolean).join(' ')) + (urun.malzeme_kodu?` · ${urun.malzeme_kodu}`:''); }

  const {data, error} = await sb.from('stok_hareketleri').select('*').eq('urun_id',urunId).order('created_at',{ascending:false});
  if(error){ icerik.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ icerik.innerHTML = '<div class="empty">Bu ürün için hareket kaydı yok.</div>'; return; }

  const renk = {
    'Stok Girişi':'#27ae60','Excel Yükleme':'#27ae60','Excel Stok Girişi':'#27ae60','Ön Rezervasyon':'#e67e22',
    'Rezervasyon Onay':'#2980b9','Rezervasyon Onaylandı':'#2980b9','Rezervasyon Reddedildi':'#e74c3c',
    'Rezervasyon İptal':'#e74c3c','Rezervasyon Düzenlendi':'#8e44ad','Stok Transferi':'#16a085',
    'Transfer Talebi':'#e67e22','Transfer 1. Onay':'#2980b9','Transfer Reddedildi':'#e74c3c','Transfer İptal':'var(--text3)'
  };
  icerik.innerHTML = data.map(h=>{
    const c = renk[h.aksiyon]||'var(--text3)';
    return `<div style="border-left:3px solid ${c};padding:6px 10px;margin-bottom:6px;background:var(--navy3);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <span style="font-weight:600;font-size:12px;color:${c};">${escapeHTML(h.aksiyon)}</span>
        <span style="font-size:11px;color:var(--text3);white-space:nowrap;">${new Date(h.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</span>
      </div>
      ${h.detay?`<div style="font-size:12px;color:var(--text2);margin-top:2px;">${escapeHTML(h.detay)}</div>`:''}
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">${escapeHTML(h.user_ad||'—')}</div>
    </div>`;
  }).join('');
}

/* ============================================================
   EXCEL İLE STOK YÜKLEME — ANA DEPO / CİHAZ HAVUZU (V31.54)
   ------------------------------------------------------------
   ERP formatı: Ambar Adı | Barkod No | Malzeme Kodu | Malzeme
   Açıklaması | Seri No | Ana Birim | Fiili Stok | Gerçek Stok
   Sadece Malzeme Kodu + Malzeme Açıklaması + Seri No kullanılır.

   V31.54 ile değişenler:
   • KÇM / depo seçimi KALDIRILDI. Hedef her zaman ANA DEPO —
     yani katalog satırı (stok_urunleri.kcm_id IS NULL).
     KÇM'lere dağıtım ayrı ekranda (Depo & Muhasebe) yapılır.
   • IMEI FİLTRESİ: yalnızca 15 haneli, tamamı rakam seriler
     havuza alınır. 18 haneli ICCID ve diğer uzunluklar atlanır.
   • 'Ambar Adı' sütunu artık okunmuyor.
   • toplam_adet artırılmaz, YENİDEN SAYILIR (idempotent).
   ============================================================ */

async function openDonanimExcelYukle(){
  // V31.54: KÇM/depo seçimi yok — hedef her zaman ana depo (katalog, kcm_id IS NULL)
  document.getElementById('donanimExcelAdim1').classList.remove('hide');
  document.getElementById('donanimExcelAdim2').classList.add('hide');
  document.getElementById('donanimExcelSonuc').classList.add('hide');
  document.getElementById('donanimExcelDosya').value='';
  openModal('donanimExcelModal');
}

// Excel'i satır dizisine çevirir (Seri No'yu METİN olarak korur — bilimsel gösterim/baştaki 0 kaybı olmasın)
function _donanimExcelOku(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = (e)=>{
      try{
        const wb = XLSX.read(e.target.result, {type:'array'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        // raw:false -> hücreleri metin formatlı okur (Seri No sayısal bozulmasın)
        const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
        resolve(rows);
      }catch(err){ reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ---- V31.54 yardımcıları ---------------------------------- */

// Excel'den gelen seri no metnini temizler ("...058.0" gibi float artıklarını atar)
function _donanimSeriTemizle(s){
  return String(s==null?'':s).trim().replace(/[.,]0+$/,'');
}

// IMEI = 15 hane, tamamı rakam. 18 haneli ICCID ve diğer uzunluklar havuza girmez.
function _donanimImeiMi(s){
  return /^\d{15}$/.test(_donanimSeriTemizle(s));
}

// Katalog satırı (kcm_id IS NULL) bul, yoksa oluştur.
// upsert/onConflict KULLANILMAZ: katalog tekilliği kısmi indeksle sağlanıyor
// (ux_stok_urunleri_katalog ... WHERE kcm_id IS NULL) ve PostgREST'in on_conflict
// parametresi kısmi indeksi hedefleyemez (indeksin WHERE yüklemini üretemez).
// Bu yüzden SELECT -> yoksa INSERT deseni kullanılır.
async function _donanimKatalogSatiriBul(malzemeKodu, aciklama){
  const {data:mevcut, error:selErr} = await sb.from('stok_urunleri')
    .select('urun_id,aciklama').eq('malzeme_kodu', malzemeKodu).is('kcm_id', null).limit(1);
  if(selErr) return {hata:'Katalog sorgusu: '+selErr.message};
  if(mevcut && mevcut.length){
    if(!mevcut[0].aciklama && aciklama){
      await sb.from('stok_urunleri')
        .update({aciklama:aciklama, updated_at:new Date().toISOString()})
        .eq('urun_id', mevcut[0].urun_id);
    }
    return {urun_id: mevcut[0].urun_id, yeni:false};
  }
  const {data:yeni, error:insErr} = await sb.from('stok_urunleri')
    .insert({kcm_id:null, depo_adi:null, malzeme_kodu:malzemeKodu,
             aciklama:aciklama||malzemeKodu, toplam_adet:0, rezerve_adet:0,
             on_rezerve_adet:0, aktif:true, tum_kcm:false})
    .select('urun_id').single();
  if(insErr || !yeni){
    // Yarış durumu: aynı anda başka bir yükleme oluşturmuş olabilir -> tekrar ara
    const {data:tekrar} = await sb.from('stok_urunleri')
      .select('urun_id').eq('malzeme_kodu', malzemeKodu).is('kcm_id', null).limit(1);
    if(tekrar && tekrar.length) return {urun_id: tekrar[0].urun_id, yeni:false};
    return {hata:'Katalog satırı oluşturulamadı: '+(insErr?insErr.message:'bilinmeyen hata')};
  }
  return {urun_id: yeni.urun_id, yeni:true};
}

// toplam_adet ARTIRILMAZ, YENİDEN SAYILIR — aynı dosya iki kez yüklenirse sayı şişmez.
async function _donanimKatalogAdetYenile(urunIdler){
  for(const urunId of urunIdler){
    const {count, error} = await sb.from('stok_seri_no')
      .select('*',{count:'exact',head:true}).eq('urun_id', urunId).eq('durum','Depoda');
    if(error){ console.error('[donanim] adet sayım hatası urun_id='+urunId, error.message); continue; }
    const {error:updErr} = await sb.from('stok_urunleri')
      .update({toplam_adet: count||0, updated_at:new Date().toISOString()})
      .eq('urun_id', urunId);
    if(updErr) console.error('[donanim] adet yazma hatası urun_id='+urunId, updErr.message);
  }
}

async function donanimExcelIsle(){
  const dosya = document.getElementById('donanimExcelDosya').files[0];
  if(!dosya){ toast('Excel dosyası seçin','error'); return; }

  document.getElementById('donanimExcelAdim1').classList.add('hide');
  document.getElementById('donanimExcelAdim2').classList.remove('hide');
  document.getElementById('donanimExcelIlerleme').classList.remove('hide');
  document.getElementById('donanimExcelSonuc').classList.add('hide');
  const ilerlemeEl = document.getElementById('donanimExcelIlerlemeMetin');
  const CHUNK = 500;

  try{
    ilerlemeEl.textContent = 'Excel okunuyor...';
    const rows = await _donanimExcelOku(dosya);
    if(!rows.length){ toast('Excel boş görünüyor','error'); openDonanimExcelYukle(); return; }

    const kOf = (row, ...adaylar)=>{ for(const a of adaylar){ if(row[a]!==undefined) return row[a]; } return ''; };
    const ham = rows.map(r=>({
      seri_no: _donanimSeriTemizle(kOf(r,'Seri No','SERİ NO','Seri no')),
      malzeme_kodu: String(kOf(r,'Malzeme Kodu','MALZEME KODU')).trim(),
      aciklama: String(kOf(r,'Malzeme Acıklaması','Malzeme Açıklaması','MALZEME ACIKLAMASI','MALZEME AÇIKLAMASI','Malzeme Aciklamasi')).trim()
    })).filter(r=>r.seri_no);

    // 1) IMEI FİLTRESİ — sadece 15 haneli tam sayısal seriler havuza girer
    ilerlemeEl.textContent = `${ham.length} satır okundu. IMEI filtresi uygulanıyor...`;
    const adaylar = [], elenen = [];
    ham.forEach(s=>{
      if(!s.malzeme_kodu){ elenen.push({...s, sebep:'Malzeme kodu boş'}); return; }
      if(!_donanimImeiMi(s.seri_no)){ elenen.push({...s, sebep:`IMEI değil (${s.seri_no.length} hane)`}); return; }
      adaylar.push(s);
    });

    // 2) Dosya içi mükerrer seri no
    const gorulen = new Set(), dosyaMukerrer = [], tekil = [];
    adaylar.forEach(s=>{
      if(gorulen.has(s.seri_no)) dosyaMukerrer.push(s);
      else { gorulen.add(s.seri_no); tekil.push(s); }
    });

    if(!tekil.length){
      window._donanimExcelRapor = [];
      window._donanimExcelRaporTam = elenen.map(s=>({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Atlandı', aciklama:s.sebep}));
      document.getElementById('donanimExcelIlerleme').classList.add('hide');
      document.getElementById('donanimExcelSonuc').classList.remove('hide');
      document.getElementById('donanimExcelOzet').innerHTML =
        `⚠️ <span style="color:var(--red);">Yüklenecek IMEI bulunamadı.</span><br>`+
        `<span style="font-weight:400;color:var(--text2);font-size:12px;">`+
        `${ham.length} satır okundu · ${elenen.length} satır 15 haneli IMEI değil</span>`;
      document.getElementById('donanimExcelRaporTablo').innerHTML = '';
      toast('Dosyada 15 haneli IMEI bulunamadı','error');
      return;
    }

    // 3) Mevcut seri no'ları DB'de ara
    const mevcutSeriMap = {};
    const tumSeri = tekil.map(s=>s.seri_no);
    for(let i=0;i<tumSeri.length;i+=CHUNK){
      const parca = tumSeri.slice(i,i+CHUNK);
      const {data, error} = await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id').in('seri_no',parca);
      if(error) throw new Error('Mevcut stok kontrolünde hata: '+error.message);
      (data||[]).forEach(d=>{ mevcutSeriMap[d.seri_no]=d; });
      ilerlemeEl.textContent = `Mevcut havuz kontrol ediliyor... (${Math.min(i+CHUNK,tumSeri.length)}/${tumSeri.length})`;
    }

    const mevcutUrunIdler = [...new Set(Object.values(mevcutSeriMap).map(x=>x.urun_id))];
    const urunMalzemeMap = {};
    for(let i=0;i<mevcutUrunIdler.length;i+=200){
      const parca = mevcutUrunIdler.slice(i,i+200);
      const {data,error} = await sb.from('stok_urunleri').select('urun_id,malzeme_kodu').in('urun_id',parca);
      if(error) throw new Error('Ürün bilgisi çekilirken hata: '+error.message);
      (data||[]).forEach(d=>{ urunMalzemeMap[d.urun_id]=d.malzeme_kodu; });
    }

    const yeniSeriler = [], zatenMevcut = [], celiskiler = [];
    tekil.forEach(s=>{
      const eski = mevcutSeriMap[s.seri_no];
      if(!eski){ yeniSeriler.push(s); return; }
      if(urunMalzemeMap[eski.urun_id] === s.malzeme_kodu) zatenMevcut.push(s);
      else celiskiler.push({...s, mevcutKod: urunMalzemeMap[eski.urun_id]});
    });

    // 4) Katalog satırları (ANA DEPO — kcm_id NULL)
    const kodlar = [...new Set(yeniSeriler.map(s=>s.malzeme_kodu))];
    const katalogMap = {}, katalogHata = {};
    let yeniKatalogSayisi = 0;
    for(let i=0;i<kodlar.length;i++){
      const kod = kodlar[i];
      const ornek = yeniSeriler.find(s=>s.malzeme_kodu===kod);
      const sonuc = await _donanimKatalogSatiriBul(kod, ornek?ornek.aciklama:'');
      if(sonuc.hata) katalogHata[kod] = sonuc.hata;
      else { katalogMap[kod] = sonuc.urun_id; if(sonuc.yeni) yeniKatalogSayisi++; }
      ilerlemeEl.textContent = `Katalog satırları hazırlanıyor... (${i+1}/${kodlar.length})`;
    }

    // 5) Seri no kayıtları — her satırın gerçek insert sonucu izlenir
    const basarili = [], eklemeHatasi = [];
    yeniSeriler.filter(s=>katalogHata[s.malzeme_kodu]).forEach(s=>{
      eklemeHatasi.push({...s, sebep:'Katalog satırı hazırlanamadı: '+katalogHata[s.malzeme_kodu]});
    });
    const eklenecek = yeniSeriler.filter(s=>katalogMap[s.malzeme_kodu]);
    for(let i=0;i<eklenecek.length;i+=CHUNK){
      const parca = eklenecek.slice(i,i+CHUNK);
      const payload = parca.map(s=>({seri_no:s.seri_no, urun_id:katalogMap[s.malzeme_kodu], durum:'Depoda'}));
      const {data:insData, error:insErr} = await sb.from('stok_seri_no').insert(payload).select('seri_no');
      if(insErr){
        parca.forEach(s=> eklemeHatasi.push({...s, sebep:'Kayıt hatası: '+insErr.message}));
      } else {
        const eklenenSet = new Set((insData||[]).map(d=>d.seri_no));
        parca.forEach(s=>{
          if(eklenenSet.has(s.seri_no)) basarili.push(s);
          else eklemeHatasi.push({...s, sebep:'Kayıt doğrulanamadı (insert sonucu boş döndü)'});
        });
      }
      ilerlemeEl.textContent = `IMEI kayıtları ekleniyor... (${Math.min(i+CHUNK,eklenecek.length)}/${eklenecek.length})`;
    }

    // 6) Havuz adetleri — artırma değil, YENİDEN SAYIM
    ilerlemeEl.textContent = 'Havuz adetleri yeniden sayılıyor...';
    const etkilenen = [...new Set(basarili.map(s=>katalogMap[s.malzeme_kodu]))];
    await _donanimKatalogAdetYenile(etkilenen);

    // 7) Raporlar — EKRAN sade (yüklenen + hata + mevcut), EXCEL tam
    const ekranRapor = [];
    basarili.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'✅ Yüklendi', aciklama:''}));
    celiskiler.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'❌ HATA', aciklama:`Bu seri no başka bir üründe kayıtlı (mevcut kod: ${s.mevcutKod||'?'})`}));
    eklemeHatasi.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'❌ HATA', aciklama:s.sebep}));
    zatenMevcut.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Yüklenmedi', aciklama:'Zaten havuzda mevcut'}));

    const tamRapor = ekranRapor.slice();
    dosyaMukerrer.forEach(s=> tamRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Atlandı', aciklama:'Dosya içinde mükerrer'}));
    elenen.forEach(s=> tamRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Atlandı', aciklama:s.sebep}));

    window._donanimExcelRapor = ekranRapor;
    window._donanimExcelRaporTam = tamRapor;

    const hataSayisi = celiskiler.length + eklemeHatasi.length;
    const atlananToplam = elenen.length + dosyaMukerrer.length;

    // 8) Timeline'a tek özet log
    const {error:logErr} = await sb.from('stok_hareketleri').insert({
      aksiyon: 'Excel Stok Yükleme (Ana Depo)',
      detay: `${basarili.length} IMEI havuza eklendi · ${zatenMevcut.length} zaten mevcut · ${hataSayisi} hata · ${elenen.length} satır IMEI değil · ${yeniKatalogSayisi} yeni ürün — dosyada toplam ${ham.length} satır.`,
      user_id: currentUser.my_id,
      user_ad: currentUser.ad_soyad || String(currentUser.my_id)
    });
    if(logErr) console.error('Timeline log hatası:', logErr.message);

    // 9) Ekrana yaz
    document.getElementById('donanimExcelIlerleme').classList.add('hide');
    document.getElementById('donanimExcelSonuc').classList.remove('hide');
    document.getElementById('donanimExcelOzet').innerHTML =
      `✅ <span style="color:var(--green);">${basarili.length} IMEI yüklendi</span> · `+
      `⏭️ <span style="color:var(--text3);">${zatenMevcut.length} zaten havuzda</span> · `+
      `❌ <span style="color:var(--red);">${hataSayisi} hata</span><br>`+
      `<span style="font-weight:400;color:var(--text2);font-size:12px;">`+
      `Hedef: ANA DEPO · dosyada ${ham.length} satır · IMEI olmadığı için atlanan ${elenen.length} · `+
      `dosya içi mükerrer ${dosyaMukerrer.length} · yeni ürün ${yeniKatalogSayisi}</span>`;

    const ozetSatir = atlananToplam ? `<tr>
      <td colspan="4" style="padding:8px;border-bottom:1px solid var(--border);color:var(--text2);font-size:12px;">
        ⏭️ ${atlananToplam} satır burada listelenmedi (IMEI değil / dosya içi mükerrer) — tamamı &quot;Raporu İndir&quot; dosyasında.
      </td></tr>` : '';
    document.getElementById('donanimExcelRaporTablo').innerHTML = ozetSatir + ekranRapor.map(r=>`<tr>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.seri_no)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.urun_adi)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${r.durum}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.aciklama)}</td>
    </tr>`).join('');

    if(hataSayisi>0) toast(`Yükleme tamamlandı ama ${hataSayisi} HATA var — raporu kontrol edin`,'error');
    else toast(`Yükleme tamamlandı: ${basarili.length} IMEI ana depoya eklendi`,'success');
    loadDonanimListesi();
  }catch(err){
    console.error(err);
    document.getElementById('donanimExcelIlerleme').classList.add('hide');
    toast('Hata: '+err.message,'error');
    alert('Yükleme durdu, hiçbir kayıt yazılmamış olabilir:\n\n'+err.message);
  }
}

// Rapor Excel olarak indirilir (SheetJS ile)
// V31.54: ekranda sadeleştirilmiş liste gösterilir, indirilen dosya TAM raporu içerir.
function donanimExcelRaporIndir(){
  const rapor = window._donanimExcelRaporTam || window._donanimExcelRapor || [];
  if(!rapor.length){ toast('İndirilecek rapor yok','error'); return; }
  const ws = XLSX.utils.json_to_sheet(rapor.map(r=>({
    'Seri No': r.seri_no, 'Ürün': r.urun_adi, 'Durum': r.durum, 'Açıklama': r.aciklama
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Yükleme Raporu');
  const tarih = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `stok_yukleme_raporu_${tarih}.xlsx`);
}

/* ============================================================
   ÖN REZERVASYON — SEPET MEKANİZMASI (v30.87)
   ------------------------------------------------------------
   MY/FMY birden fazla ürünü işaretleyip adet girerek TEK bir
   "Ön Rezervasyon Talebi" (sepet_id ile gruplanmış) oluşturur.
   Stokta görünürlük DEĞİŞMEZ (on_rezerve_adet artar, musait_adet
   sabit kalır) — kesinleşme (OLM onayı) SONRAKİ fazda ele alınacak.
   ============================================================ */

function donanimSecimModunuAc(ilkUrunId){
  // v30.89: artık tek üst buton ile çağrılıyor (kartlarda tekil buton yok)
  window._donanimSecimModu = true;
  if(ilkUrunId){
    const u = (window._donanimList||[]).find(x=>x.urun_id===ilkUrunId);
    if(u) window._donanimSepet[ilkUrunId] = {urun:u, adet:1};
  }
  _renderDonanimListesi(window._donanimList);
  _donanimSepetBarGuncelle();
}

function donanimSepetToggle(urunId){
  const chk = document.getElementById('donanimChk_'+urunId);
  if(chk && chk.checked){
    const u = (window._donanimList||[]).find(x=>x.urun_id===urunId);
    const adetEl = document.getElementById('donanimAdet_'+urunId);
    window._donanimSepet[urunId] = {urun:u, adet: parseInt(adetEl?.value)||1};
  } else {
    delete window._donanimSepet[urunId];
  }
  _donanimSepetBarGuncelle();
}

function donanimSepetAdetGuncelle(urunId, deger){
  if(!window._donanimSepet[urunId]) return;
  const musait = window._donanimSepet[urunId].urun.musait_adet ?? 0;
  let adet = parseInt(deger)||1;
  if(adet<1) adet=1;
  if(adet>musait) adet=musait;
  window._donanimSepet[urunId].adet = adet;
  _donanimSepetBarGuncelle();
}

function _donanimSepetBarGuncelle(){
  const bar = document.getElementById('donanimSepetBar');
  const sayacEl = document.getElementById('donanimSepetSayac');
  const adet = Object.keys(window._donanimSepet||{}).length;
  if(!bar) return;
  if(adet>0){
    bar.classList.remove('hide');
    if(sayacEl) sayacEl.textContent = `${adet} ürün seçili`;
  } else {
    bar.classList.add('hide');
  }
}

// Sepet modalını açar: müşteri arama + satan MY listesini hazırlar
async function donanimSepetiAc(){
  const sepetKeys = Object.keys(window._donanimSepet||{});
  if(!sepetKeys.length){ toast('En az bir ürün seçin','error'); return; }

  const listEl = document.getElementById('donanimSepetListesi');
  listEl.innerHTML = sepetKeys.map(uid=>{
    const item = window._donanimSepet[uid];
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">
      <span>${escapeHTML(item.urun.aciklama||'')}</span>
      <span style="font-weight:700;">${item.adet} adet</span>
    </div>`;
  }).join('');

  document.getElementById('donanimSepetMusteriArama').value='';
  document.getElementById('donanimSepetMusteriSonuc').innerHTML='';
  document.getElementById('donanimSepetMusteriSecili').classList.add('hide');
  window._donanimSepetSeciliMusteri = null;

  // v31.25: Satış Tipi seçimini sıfırla (her yeni sepet açılışında zorunlu yeniden seçim)
  document.querySelectorAll('#donanimSepetSatisTipiBox .chip-btn').forEach(c=>c.classList.remove('selected'));
  window._donanimSepetSatisTipi = null;

  // v30.88: MY/FMY kendisi giriyorsa hiçbir seçim göstermeden otomatik kendisi olur.
  const kendiMY = (currentUser.yetki_seviyesi==='MY' || currentUser.yetki_seviyesi==='FMY');
  document.getElementById('donanimSatanSecimBlok').classList.toggle('hide', kendiMY);
  document.getElementById('donanimSatanKendisi').classList.toggle('hide', !kendiMY);
  if(kendiMY){
    document.getElementById('donanimSatanKendisi').innerHTML = `Satan: <b>${escapeHTML(currentUser.ad_soyad||'')} (Siz)</b>`;
  } else {
    // Kademeli seçim: KÇM listesi (bir kez yükle)
    const kcmSel = document.getElementById('donanimSepetKcm');
    if(kcmSel.options.length<=1){
      const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
      kcmSel.innerHTML = '<option value="">Seçiniz...</option>' +
        (data||[]).map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
    }
    document.getElementById('donanimSepetTl').innerHTML = '<option value="">Önce KÇM seçin...</option>';
    document.getElementById('donanimSepetSatanMy').innerHTML = '<option value="">Önce Takım Lideri seçin...</option>';
  }

  openModal('donanimSepetModal');
}

// Kademeli seçim: KÇM seçilince o KÇM'nin Takım Liderlerini yükler
async function _donanimTLListesiYukle(){
  const kcmId = document.getElementById('donanimSepetKcm').value;
  const tlSel = document.getElementById('donanimSepetTl');
  const mySel = document.getElementById('donanimSepetSatanMy');
  tlSel.innerHTML = '<option value="">Yükleniyor...</option>';
  mySel.innerHTML = '<option value="">Önce Takım Lideri seçin...</option>';
  if(!kcmId){ tlSel.innerHTML='<option value="">Önce KÇM seçin...</option>'; return; }
  const {data} = await sb.from('users').select('my_id,ad_soyad')
    .eq('yetki_seviyesi','TAKIM LİDERİ').eq('kcm_id',kcmId).eq('aktif',true).order('ad_soyad');
  tlSel.innerHTML = '<option value="">Seçiniz...</option>' +
    (data||[]).map(u=>`<option value="${u.my_id}">${escapeHTML(u.ad_soyad)}</option>`).join('');
}

// Kademeli seçim: Takım Lideri seçilince o ekibin MY/FMY'lerini yükler
async function _donanimMyListesiYukle(){
  const tlId = document.getElementById('donanimSepetTl').value;
  const mySel = document.getElementById('donanimSepetSatanMy');
  mySel.innerHTML = '<option value="">Yükleniyor...</option>';
  if(!tlId){ mySel.innerHTML='<option value="">Önce Takım Lideri seçin...</option>'; return; }
  const {data} = await sb.from('users').select('my_id,ad_soyad,yetki_seviyesi')
    .in('yetki_seviyesi',['MY','FMY']).eq('takim_lideri_id',tlId).eq('aktif',true).order('ad_soyad');
  mySel.innerHTML = '<option value="">Seçiniz...</option>' +
    (data||[]).map(u=>`<option value="${u.my_id}">${escapeHTML(u.ad_soyad)} (${u.yetki_seviyesi})</option>`).join('');
}

let _donanimMusteriAramaTimer=null;
function donanimMusteriAramaDebounce(){
  clearTimeout(_donanimMusteriAramaTimer);
  _donanimMusteriAramaTimer = setTimeout(_donanimMusteriAra, 350);
}
async function _donanimMusteriAra(){
  const terim = document.getElementById('donanimSepetMusteriArama').value.trim();
  const sonucEl = document.getElementById('donanimSepetMusteriSonuc');
  if(terim.length<2){ sonucEl.innerHTML=''; return; }
  let q = getCustomerBaseQuery(true); // forForm=true: KÇM scope, portföy dışına da erişim
  q = q.or(`unvan.ilike.%${terim}%,ncst.ilike.%${terim}%`).limit(8);
  const {data} = await q;
  sonucEl.innerHTML = (data||[]).map(c=>`
    <div class="visit-card" style="padding:8px;margin-bottom:4px;cursor:pointer;" onclick='donanimMusteriSec(${JSON.stringify(c)})'>
      <div style="font-size:13px;font-weight:700;">${escapeHTML(c.unvan||c.ncst)}</div>
      <div style="font-size:11px;color:var(--text3);">NCST: ${escapeHTML(c.ncst)}</div>
    </div>`).join('') || '<div style="font-size:12px;color:var(--text3);padding:6px;">Sonuç yok</div>';
}
function donanimMusteriSec(c){
  window._donanimSepetSeciliMusteri = c;
  document.getElementById('donanimSepetMusteriSonuc').innerHTML='';
  document.getElementById('donanimSepetMusteriArama').value='';
  const el = document.getElementById('donanimSepetMusteriSecili');
  el.classList.remove('hide');
  el.innerHTML = `✓ <b>${escapeHTML(c.unvan||c.ncst)}</b> (NCST: ${escapeHTML(c.ncst)}) <a href="#" onclick="event.preventDefault();donanimMusteriTemizle()" style="color:var(--red);margin-left:8px;">✕</a>`;
}
function donanimMusteriTemizle(){
  window._donanimSepetSeciliMusteri = null;
  document.getElementById('donanimSepetMusteriSecili').classList.add('hide');
}

// v31.25: Satış Tipi (Peşin/OLM/Turkcell Finansman) — sepet gönderiminde zorunlu
function donanimSatisTipiSec(el, tip){
  document.querySelectorAll('#donanimSepetSatisTipiBox .chip-btn').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  window._donanimSepetSatisTipi = tip;
}

// Sepeti gönderir: her ürün için ayrı rezervasyon satırı, ortak sepet_id, on_rezerve_adet artırılır
async function donanimSepetGonder(){
  const musteri = window._donanimSepetSeciliMusteri;
  const kendiMY = (currentUser.yetki_seviyesi==='MY' || currentUser.yetki_seviyesi==='FMY');
  const satanMyId = kendiMY ? currentUser.my_id : document.getElementById('donanimSepetSatanMy').value;
  const not = document.getElementById('donanimSepetNot').value.trim();
  if(!musteri){ toast('Müşteri seçin','error'); return; }
  if(!satanMyId){ toast('Cihazı satacak MY/FMY seçin','error'); return; }
  // v31.25: Satış Tipi zorunlu (Peşin/OLM/Turkcell Finansman)
  const satisTipi = window._donanimSepetSatisTipi;
  if(!satisTipi){ toast('Satış tipi seçin (Peşin / OLM / Turkcell Finansman)','error'); return; }

  const sepetKeys = Object.keys(window._donanimSepet||{});
  if(!sepetKeys.length){ toast('Sepet boş','error'); return; }

  const sepetId = crypto.randomUUID ? crypto.randomUUID() : (Date.now()+'-'+Math.random());
  const kayitlar = sepetKeys.map(uid=>{
    const item = window._donanimSepet[uid];
    return {
      urun_id: parseInt(uid),
      kcm_id: item.urun.kcm_id,
      adet: item.adet,
      ncst: musteri.ncst,
      musteri_my_id: musteri.my_id, // v30.87: donuk — kayıt anındaki portföy sahibi
      satan_my_id: parseInt(satanMyId),
      rezerve_eden_id: currentUser.my_id,
      durum: 'Ön Rezervasyon',
      sepet_id: sepetId,
      aciklama: not || null,
      satis_tipi: satisTipi
    };
  });

  const {error} = await sb.from('stok_rezervasyonlari').insert(kayitlar);
  if(error){ toast('Hata: '+error.message,'error'); return; }

  // on_rezerve_adet güncelle (stok GÖRÜNÜRLÜĞÜ etkilenmez — sadece bu sayaç artar)
  for(const uid of sepetKeys){
    const item = window._donanimSepet[uid];
    const yeniOnRezerve = (item.urun.on_rezerve_adet||0) + item.adet;
    await sb.from('stok_urunleri').update({on_rezerve_adet: yeniOnRezerve}).eq('urun_id', parseInt(uid));
  }

  // Timeline özet log
  await _donanimRezHareketLog('Ön Rezervasyon', kayitlar, {ncst:musteri.ncst, satan_my_id:satanMyId});

  toast('Ön rezervasyon talebi oluşturuldu','success');
  closeModal('donanimSepetModal');
  window._donanimSepet = {};
  window._donanimSecimModu = false;
  window._donanimSepetSatisTipi = null;
  _donanimSepetBarGuncelle();
  loadDonanimListesi();
}

function donanimSecimModunuKapat(){
  window._donanimSecimModu = false;
  window._donanimSepet = {};
  _donanimSepetBarGuncelle();
  _renderDonanimListesi(window._donanimList);
}

/* ============================================================
   SÜREÇ TAKİP EKRANI (v30.88)
   ------------------------------------------------------------
   Sekmeli yapı: "Stok" (mevcut liste) / "Rezervasyonlar" (süreç takibi)
   Görünürlük: getScope('donanim_takip')
     MY/FMY = PRT (sadece kendi sattığı) | TL/Müdür = KÇM | Admin/Depo/Direktör = TÜM
   ============================================================ */

// v30.90: Rezervasyon onay/red yetkisi — tek nokta.
// v30.94: kapsam Rol&Yetki ekranından — getScope('donanim_takip') (liste ile tutarlı).
//         Kodda sabit rol listesi YOK.
function _donanimRezOnayYetkisi(satanMyId, kcmId){
  if(!hasPerm('donanim_rezerve_et')) return false;
  const scope = getScope('donanim_takip');
  if(scope==='TÜM')   return true;
  if(scope==='KÇM')   return kcmId === currentUser.kcm_id;
  if(scope==='BAĞLI') return (bagliMyIds||[]).includes(satanMyId);
  return satanMyId === currentUser.my_id;   // PRT / PRT+
}

// v31.05: süreç adımı yetkisi — verilen izin + kapsam (getScope('donanim_takip'))
function _donanimSurecYetki(permKey, satanMyId, kcmId){
  if(!hasPerm(permKey)) return false;
  const scope = getScope('donanim_takip');
  if(scope==='TÜM')   return true;
  if(scope==='KÇM')   return kcmId === currentUser.kcm_id;
  if(scope==='BAĞLI') return (bagliMyIds||[]).includes(satanMyId);
  return satanMyId === currentUser.my_id;
}

const DONANIM_SUREC_ADIMLARI = {
  'Ön Rezervasyon':    {no:1, renk:'#e74c3c'},
  'Onaylandı':         {no:2, renk:'#e67e22'},
  'Hazırlanıyor':      {no:3, renk:'#f39c12'},
  'Kısmen Eşleştirildi':{no:3, renk:'#e59866'},
  'Eşleştirildi':      {no:4, renk:'#3498db'},
  'Fatura Kesildi':    {no:5, renk:'#9b59b6'},
  'Cihaz Gönderildi':  {no:6, renk:'#2ecc71'},
  'Reddedildi':        {no:0, renk:'#c0392b'},
  'İptal':             {no:0, renk:'#7f8c8d'}
};

// v31.25: Satış Tipi renkleri (Peşin/OLM/Turkcell Finansman) — rozet gösterimi için
const DONANIM_SATIS_TIPI_RENK = { 'Peşin':'#2ecc71', 'OLM':'#3498db', 'Turkcell Finansman':'#9b59b6' };

// ============================================================
// v31.26: Tedarik akışı bildirimi — Ana menüdeki 'Donanım Takip' ikonu üzerinde
// rozet. Kullanıcının kendi (satan veya rezerve eden olduğu) sipariş(ler)i
// 'Onaylandı' adımına geçtiğinde rozette sayı görünür (görev rozetiyle aynı
// desen: js/gorev.js updateGorevBadge/#gorevMenuBadge — okundu/okunmadı takibi
// yok, adım değişince rozet kendiliğinden güncellenir/kaybolur).
// ============================================================
async function _donanimBadgeGuncelle(){
  const badge = document.getElementById('donanimMenuBadge');
  if(!badge) return;
  const mid = currentUser?.my_id;
  if(!mid){ badge.style.display='none'; return; }
  const {data, error} = await sb.from('stok_rezervasyonlari')
    .select('sepet_id')
    .eq('durum','Onaylandı')
    .or(`satan_my_id.eq.${mid},rezerve_eden_id.eq.${mid}`);
  if(error){ console.warn('_donanimBadgeGuncelle:', error.message); return; }
  const sayi = new Set((data||[]).map(r=>r.sepet_id)).size;
  badge.textContent = sayi || '';
  badge.style.display = sayi > 0 ? 'inline-flex' : 'none';
}

// v30.96: 3 sekme — Stok / Rezervasyonlar / Transfer
function donanimTabGeç(hangi){
  const tabs = {
    stok:     {btn:'donanimTabStokBtn',     sekme:'donanimStokSekme'},
    rez:      {btn:'donanimTabRezBtn',      sekme:'donanimRezSekme'},
    transfer: {btn:'donanimTabTransferBtn', sekme:'donanimTransferSekme'},
    depo:     {btn:'donanimTabDepoBtn',     sekme:'donanimDepoSekme'},     // V31.55
    talep:    {btn:'donanimTabTalepBtn',    sekme:'donanimTalepSekme'}     // V31.57
  };
  const sepetBar = document.getElementById('donanimSepetBar');
  Object.keys(tabs).forEach(k=>{
    const t = tabs[k], aktif = (k===hangi);
    const btn = document.getElementById(t.btn), sekme = document.getElementById(t.sekme);
    if(btn){ btn.style.background = aktif?'var(--blue)':''; btn.classList.toggle('btn-ghost', !aktif); }
    if(sekme){ sekme.classList.toggle('hide', !aktif); }
  });
  if(hangi==='stok'){ if(sepetBar) _donanimSepetBarGuncelle(); loadDonanimListesi(); }
  else if(sepetBar){ sepetBar.classList.add('hide'); }
  if(hangi==='rez') loadDonanimRezervasyonlar();
  if(hangi==='transfer') loadDonanimTransferListesi();
  if(hangi==='depo') loadDonanimDepoSekme();                                // V31.55
  if(hangi==='talep') loadDonanimTalepListesi();                            // V31.57
}

// ============ TRANSFER (Adım 2: Talep) ============
const DONANIM_TRANSFER_DURUM_RENK = {
  'Aşama 1 Bekliyor':'#e67e22', 'Aşama 2 Bekliyor':'#f1c40f',
  'Onaylandı':'#27ae60', 'Reddedildi':'#e74c3c', 'İptal':'var(--text3)'
};

async function loadDonanimTransferListesi(){
  const listEl = document.getElementById('donanimTransferListesi');
  if(!listEl) return;
  const yeniBtn = document.getElementById('donanimTransferYeniBtn');
  if(yeniBtn) yeniBtn.style.display = hasPerm('donanim_transfer_talep') ? 'block' : 'none';

  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  // Görünürlük kapsamı — liste ile onay tutarlı olsun diye getScope('donanim_takip')
  const scope = getScope('donanim_takip');
  let q = sb.from('stok_transfer_talepleri').select('*').order('created_at',{ascending:false});
  if(scope==='TÜM'){ /* filtresiz */ }
  else if(scope==='KÇM' && currentUser.kcm_id){
    q = q.or(`kaynak_kcm_id.eq.${currentUser.kcm_id},hedef_kcm_id.eq.${currentUser.kcm_id}`);
  } else {
    q = q.eq('talep_eden_id', currentUser.my_id);
  }
  const {data, error} = await q;
  if(error){ listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ listEl.innerHTML = '<div class="empty">Transfer talebi yok.</div>'; return; }

  // Eşleme: KÇM adları, ürün açıklamaları, talep eden adı
  const kcmIds  = [...new Set(data.flatMap(t=>[t.kaynak_kcm_id,t.hedef_kcm_id]).filter(Boolean))];
  const urunIds = [...new Set(data.map(t=>t.kaynak_urun_id).filter(Boolean))];
  const myIds   = [...new Set(data.map(t=>t.talep_eden_id).filter(Boolean))];
  const kcmMap={}, urunMap={}, myMap={};
  if(kcmIds.length){ const {data:k}=await sb.from('kcm_groups').select('kcm_id,kcm_adi').in('kcm_id',kcmIds); (k||[]).forEach(x=>kcmMap[x.kcm_id]=x.kcm_adi); }
  if(urunIds.length){ const {data:u}=await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id',urunIds); (u||[]).forEach(x=>urunMap[x.urun_id]=x.aciklama); }
  if(myIds.length){ const {data:m}=await sb.from('users').select('my_id,ad_soyad').in('my_id',myIds); (m||[]).forEach(x=>myMap[x.my_id]=x.ad_soyad); }

  listEl.innerHTML = data.map(t=>{
    const renk = DONANIM_TRANSFER_DURUM_RENK[t.durum]||'var(--text3)';
    // v30.98: duruma + yetkiye göre aksiyon butonları
    const canOnay1  = t.durum==='Aşama 1 Bekliyor' && _donanimTransferOnay1Yetkisi(t.kaynak_kcm_id);
    const canOnay2  = t.durum==='Aşama 2 Bekliyor' && hasPerm('donanim_transfer_onay2');
    const canIptal  = ['Aşama 1 Bekliyor','Aşama 2 Bekliyor'].includes(t.durum) && t.talep_eden_id===currentUser.my_id;
    let butonlar='';
    if(canOnay1) butonlar += `<button class="btn btn-sm" style="flex:1;background:#27ae60;" onclick="donanimTransferOnay1(${t.id})">1. Onay</button>`;
    if(canOnay2) butonlar += `<button class="btn btn-sm" style="flex:1;background:#27ae60;" onclick="donanimTransferOnay2(${t.id})">2. Onay (Taşı)</button>`;
    if(canOnay1||canOnay2) butonlar += `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="donanimTransferReddet(${t.id})">Reddet</button>`;
    if(canIptal) butonlar += `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="donanimTransferIptal(${t.id})">İptal</button>`;
    const butonSatiri = butonlar ? `<div style="display:flex;gap:6px;margin-top:8px;">${butonlar}</div>` : '';
    return `<div class="visit-card" style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="font-weight:600;font-size:13px;">${escapeHTML(urunMap[t.kaynak_urun_id]||'Cihaz #'+t.kaynak_urun_id)}</div>
        <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${renk};color:#fff;white-space:nowrap;">${escapeHTML(t.durum)}</span>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">
        ${escapeHTML(kcmMap[t.kaynak_kcm_id]||'KÇM#'+t.kaynak_kcm_id)} &rarr; ${escapeHTML(kcmMap[t.hedef_kcm_id]||'KÇM#'+t.hedef_kcm_id)} · <b>${t.adet} adet</b>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">
        Talep eden: ${escapeHTML(myMap[t.talep_eden_id]||'—')} · ${new Date(t.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}
      </div>
      ${t.aciklama?`<div style="font-size:11px;color:var(--text3);margin-top:2px;">Not: ${escapeHTML(t.aciklama)}</div>`:''}
      ${t.red_neden?`<div style="font-size:11px;color:var(--red);margin-top:2px;">Red: ${escapeHTML(t.red_neden)}</div>`:''}
      ${butonSatiri}
    </div>`;
  }).join('');
}

// v30.98: 1. onay yetkisi — onay1 izni + kaynak KÇM kapsamı (getScope ile)
function _donanimTransferOnay1Yetkisi(kaynakKcmId){
  if(!hasPerm('donanim_transfer_onay1')) return false;
  const scope = getScope('donanim_takip');
  if(scope==='TÜM') return true;
  if(scope==='KÇM') return kaynakKcmId === currentUser.kcm_id;
  return false;
}

async function donanimTransferOnay1(id){
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  if(t.durum!=='Aşama 1 Bekliyor'){ toast('Bu talep 1. onay aşamasında değil','info'); loadDonanimTransferListesi(); return; }
  if(!_donanimTransferOnay1Yetkisi(t.kaynak_kcm_id)){ toast('1. onay yetkiniz yok','error'); return; }
  const {error:uErr} = await sb.from('stok_transfer_talepleri').update({
    durum:'Aşama 2 Bekliyor', asama1_onay_id:currentUser.my_id,
    asama1_tarih:new Date().toISOString(), updated_at:new Date().toISOString()
  }).eq('id',id).eq('durum','Aşama 1 Bekliyor');
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({ urun_id:t.kaynak_urun_id, aksiyon:'Transfer 1. Onay',
    detay:`Talep #${id} 1. onay (KÇM#${t.kaynak_kcm_id} → KÇM#${t.hedef_kcm_id}, ${t.adet} adet)`,
    user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });
  toast('1. onay verildi','success');
  loadDonanimTransferListesi();
}

async function donanimTransferOnay2(id){
  if(!hasPerm('donanim_transfer_onay2')){ toast('2. onay yetkiniz yok','error'); return; }
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  if(t.durum!=='Aşama 2 Bekliyor'){ toast('Bu talep 2. onay aşamasında değil','info'); loadDonanimTransferListesi(); return; }

  // Kaynak ürünü oku, müsait YENİDEN kontrol (talep sonrası stok değişmiş olabilir)
  const {data:kaynak, error:kErr} = await sb.from('stok_urunleri').select('*').eq('urun_id',t.kaynak_urun_id).single();
  if(kErr||!kaynak){ toast('Kaynak ürün bulunamadı','error'); return; }
  const musait = (kaynak.toplam_adet||0) - (kaynak.rezerve_adet||0);
  if(musait < t.adet){ toast(`Kaynak stok yetersiz (müsait: ${musait}, gerekli: ${t.adet}) — taşıma yapılmadı`,'error'); return; }

  // 1) Kaynağı düş (gte guard: eşzamanlı düşüşte negatif olmaz)
  const {data:kUpdData, error:kUpd} = await sb.from('stok_urunleri')
    .update({ toplam_adet: kaynak.toplam_adet - t.adet, updated_at:new Date().toISOString() })
    .eq('urun_id',kaynak.urun_id).gte('toplam_adet', t.adet).select('urun_id');
  if(kUpd || !kUpdData || !kUpdData.length){ toast('Kaynak stok güncellenemedi (eşzamanlı değişim?) — taşıma yapılmadı','error'); loadDonanimTransferListesi(); return; }

  // 2) Hedefe ekle (varsa +, yoksa yeni satır). Başarısız olursa kaynağı GERİ AL.
  const {data:hedef} = await sb.from('stok_urunleri').select('*')
    .eq('kcm_id',t.hedef_kcm_id).eq('malzeme_kodu',kaynak.malzeme_kodu).eq('depo_adi',kaynak.depo_adi).maybeSingle();
  let hedefErr=null;
  if(hedef){
    const {error:hUpd} = await sb.from('stok_urunleri')
      .update({ toplam_adet:(hedef.toplam_adet||0)+t.adet, updated_at:new Date().toISOString() }).eq('urun_id',hedef.urun_id);
    hedefErr = hUpd;
  } else {
    const {error:hIns} = await sb.from('stok_urunleri').insert({
      kcm_id:t.hedef_kcm_id, depo_adi:kaynak.depo_adi, malzeme_kodu:kaynak.malzeme_kodu,
      marka:kaynak.marka, model:kaynak.model, renk:kaynak.renk, gb_hafiza:kaynak.gb_hafiza,
      fiyat:kaynak.fiyat, aciklama:kaynak.aciklama, toplam_adet:t.adet, rezerve_adet:0, on_rezerve_adet:0, aktif:true
    });
    hedefErr = hIns;
  }
  if(hedefErr){
    // KOMPANZASYON: kaynağı eski haline döndür
    await sb.from('stok_urunleri').update({ toplam_adet: kaynak.toplam_adet, updated_at:new Date().toISOString() }).eq('urun_id',kaynak.urun_id);
    toast('Hedefe eklenemedi, işlem geri alındı: '+hedefErr.message,'error');
    loadDonanimTransferListesi();
    return;
  }

  // 3) Talebi Onaylandı yap + timeline
  await sb.from('stok_transfer_talepleri').update({ durum:'Onaylandı', asama2_onay_id:currentUser.my_id,
    asama2_tarih:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',id);
  await sb.from('stok_hareketleri').insert({ urun_id:kaynak.urun_id, aksiyon:'Stok Transferi',
    detay:`${t.adet} adet taşındı: KÇM#${t.kaynak_kcm_id} → KÇM#${t.hedef_kcm_id} (talep #${id})`,
    user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });

  toast('Transfer onaylandı, stok taşındı','success');
  loadDonanimTransferListesi();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

async function donanimTransferReddet(id){
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  let yetkili=false;
  if(t.durum==='Aşama 1 Bekliyor') yetkili=_donanimTransferOnay1Yetkisi(t.kaynak_kcm_id);
  else if(t.durum==='Aşama 2 Bekliyor') yetkili=hasPerm('donanim_transfer_onay2');
  if(!yetkili){ toast('Reddetme yetkiniz yok','error'); return; }
  const neden = (prompt('Red nedeni (opsiyonel):','')||'').trim();
  const {error:uErr} = await sb.from('stok_transfer_talepleri').update({ durum:'Reddedildi', red_neden:neden||null, updated_at:new Date().toISOString() }).eq('id',id);
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({ urun_id:t.kaynak_urun_id, aksiyon:'Transfer Reddedildi',
    detay:`Talep #${id} reddedildi${neden?': '+neden:''}`, user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });
  toast('Talep reddedildi','info');
  loadDonanimTransferListesi();
}

async function donanimTransferIptal(id){
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  if(t.talep_eden_id!==currentUser.my_id){ toast('Sadece talep eden iptal edebilir','error'); return; }
  if(!['Aşama 1 Bekliyor','Aşama 2 Bekliyor'].includes(t.durum)){ toast('Bu talep iptal edilemez','info'); return; }
  const {error:uErr} = await sb.from('stok_transfer_talepleri').update({ durum:'İptal', updated_at:new Date().toISOString() }).eq('id',id);
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({ urun_id:t.kaynak_urun_id, aksiyon:'Transfer İptal',
    detay:`Talep #${id} talep eden tarafından iptal edildi`, user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });
  toast('Talep iptal edildi','info');
  loadDonanimTransferListesi();
}

async function donanimTransferModalAc(){
  if(!hasPerm('donanim_transfer_talep')){ toast('Transfer talebi yetkiniz yok','error'); return; }
  const {data:kcms} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
  const kaynakSel = document.getElementById('donanimTransferKaynakKcm');
  const hedefSel  = document.getElementById('donanimTransferHedefKcm');
  const hedefWrap = document.getElementById('donanimTransferHedefWrap');

  // Kaynak: kendi KÇM'si hariç
  kaynakSel.innerHTML = '<option value="">Seçiniz...</option>' +
    (kcms||[]).filter(k=>k.kcm_id!==currentUser.kcm_id)
      .map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');

  // Hedef: kcm_id varsa otomatik (gizli); global kullanıcı ise seçtir
  if(currentUser.kcm_id){
    hedefWrap.style.display='none';
    window._transferHedefKcm = currentUser.kcm_id;
  } else {
    hedefWrap.style.display='block';
    hedefSel.innerHTML = '<option value="">Seçiniz...</option>' +
      (kcms||[]).map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
    window._transferHedefKcm = null;
  }

  document.getElementById('donanimTransferCihaz').innerHTML = '<option value="">Önce kaynak KÇM seçin</option>';
  document.getElementById('donanimTransferAdet').value = 1;
  document.getElementById('donanimTransferAciklama').value = '';
  window._transferMusaitMap = {};
  openModal('donanimTransferModal');
}

async function donanimTransferKaynakSecildi(){
  const kaynakKcm = document.getElementById('donanimTransferKaynakKcm').value;
  const cihazSel  = document.getElementById('donanimTransferCihaz');
  if(!kaynakKcm){ cihazSel.innerHTML='<option value="">Önce kaynak KÇM seçin</option>'; return; }
  cihazSel.innerHTML='<option value="">Yükleniyor...</option>';
  const {data, error} = await sb.from('stok_musait')
    .select('urun_id,aciklama,musait_adet').eq('kcm_id',parseInt(kaynakKcm)).gt('musait_adet',0).order('aciklama');
  if(error || !data || !data.length){ cihazSel.innerHTML='<option value="">Bu KÇM\'de müsait cihaz yok</option>'; return; }
  window._transferMusaitMap = {};
  data.forEach(u=>{ window._transferMusaitMap[u.urun_id]=u.musait_adet; });
  cihazSel.innerHTML = '<option value="">Seçiniz...</option>' +
    data.map(u=>`<option value="${u.urun_id}">${escapeHTML(u.aciklama||'Cihaz #'+u.urun_id)} (müsait: ${u.musait_adet})</option>`).join('');
}

async function donanimTransferKaydet(){
  if(!hasPerm('donanim_transfer_talep')){ toast('Yetkiniz yok','error'); return; }
  const kaynakKcm = document.getElementById('donanimTransferKaynakKcm').value;
  const urunId    = document.getElementById('donanimTransferCihaz').value;
  const adet      = parseInt(document.getElementById('donanimTransferAdet').value);
  const aciklama  = document.getElementById('donanimTransferAciklama').value.trim();
  const hedefKcm  = currentUser.kcm_id || document.getElementById('donanimTransferHedefKcm').value;

  if(!kaynakKcm){ toast('Kaynak KÇM seçin','error'); return; }
  if(!hedefKcm){ toast('Hedef KÇM seçin','error'); return; }
  if(String(kaynakKcm)===String(hedefKcm)){ toast('Kaynak ve hedef KÇM aynı olamaz','error'); return; }
  if(!urunId){ toast('Cihaz seçin','error'); return; }
  if(!adet || adet<1){ toast('Geçerli adet girin','error'); return; }
  const musait = (window._transferMusaitMap||{})[urunId] ?? 0;
  if(adet>musait){ toast(`Müsait stok yetersiz (müsait: ${musait})`,'error'); return; }

  const {error} = await sb.from('stok_transfer_talepleri').insert({
    kaynak_urun_id: parseInt(urunId),
    kaynak_kcm_id:  parseInt(kaynakKcm),
    hedef_kcm_id:   parseInt(hedefKcm),
    adet: adet,
    durum: 'Aşama 1 Bekliyor',
    talep_eden_id: currentUser.my_id,
    aciklama: aciklama || null
  });
  if(error){ toast('Hata: '+error.message,'error'); return; }

  await sb.from('stok_hareketleri').insert({
    urun_id: parseInt(urunId),
    aksiyon: 'Transfer Talebi',
    detay: `${adet} adet — kaynak KÇM#${kaynakKcm} → hedef KÇM#${hedefKcm}`,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  });

  toast('Transfer talebi oluşturuldu','success');
  closeModal('donanimTransferModal');
  loadDonanimTransferListesi();
}

async function loadDonanimRezervasyonlar(){
  const listEl = document.getElementById('donanimRezListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  const scope = getScope('donanim_takip');
  let q = sb.from('stok_rezervasyon_ozet').select('*').order('created_at',{ascending:false});
  if(scope==='PRT') q = q.or(`satan_my_id.eq.${currentUser.my_id},rezerve_eden_id.eq.${currentUser.my_id}`);
  else if(scope==='KÇM' && currentUser.kcm_id) q = q.eq('kcm_id', currentUser.kcm_id);
  // TÜM: filtresiz

  const {data, error} = await q;
  if(error){ listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ listEl.innerHTML = '<div class="empty">Kayıtlı rezervasyon yok.</div>'; return; }

  // v31.25: Satış Tipi — stok_rezervasyon_ozet view'ında yok, temel tablodan
  // sepet_id başına tek satır yeterli (aynı sepetteki tüm kalemler aynı satış tipini paylaşır).
  const sepetIds = [...new Set(data.map(r=>r.sepet_id).filter(Boolean))];
  const satisTipiMap = {};
  if(sepetIds.length){
    const {data:stRows} = await sb.from('stok_rezervasyonlari').select('sepet_id,satis_tipi').in('sepet_id', sepetIds);
    (stRows||[]).forEach(s=>{ if(s.satis_tipi && !satisTipiMap[s.sepet_id]) satisTipiMap[s.sepet_id]=s.satis_tipi; });
  }

  // MY/TL/KÇM adlarını toplu çek
  // v30.92: satan + rezerve eden + müşterinin MY'si isimleri için id kümesi genişletildi
  const myIds = [...new Set(data.flatMap(r=>[r.satan_my_id, r.rezerve_eden_id, r.musteri_my_id]).filter(Boolean))];
  const kcmIds = [...new Set(data.map(r=>r.kcm_id).filter(Boolean))];
  let myMap={}, kcmMap={};
  if(myIds.length){
    const {data:users} = await sb.from('users').select('my_id,ad_soyad,takim_lideri_id').in('my_id',myIds);
    (users||[]).forEach(u=>{ myMap[u.my_id]=u; });
    const tlIds=[...new Set((users||[]).map(u=>u.takim_lideri_id).filter(Boolean))];
    if(tlIds.length){
      const {data:tls} = await sb.from('users').select('my_id,ad_soyad').in('my_id',tlIds);
      (tls||[]).forEach(t=>{ myMap['TL_'+t.my_id]=t; });
    }
  }
  if(kcmIds.length){
    const {data:kcms} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').in('kcm_id',kcmIds);
    (kcms||[]).forEach(k=>{ kcmMap[k.kcm_id]=k.kcm_adi; });
  }

  // v30.92: müşteri ünvanlarını ncst ile toplu çek
  const ncstList = [...new Set(data.map(r=>r.ncst).filter(Boolean))];
  const musteriMap = {};
  if(ncstList.length){
    const {data:musteriler} = await sb.from('customers').select('ncst,unvan').in('ncst', ncstList);
    (musteriler||[]).forEach(m=>{ musteriMap[m.ncst]=m.unvan; });
  }

  // v30.89: onay yetkisi — KÇM Müdürü sadece kendi KÇM'si, Admin/Direktör/Depo hepsi
  // v30.90: yetki kontrolü _donanimRezOnayYetkisi() tek noktasına taşındı

  listEl.innerHTML = data.map(r=>{
    const adim = DONANIM_SUREC_ADIMLARI[r.durum] || {no:'?', renk:'var(--text3)'};
    const my = myMap[r.satan_my_id];
    const tlAd = my && my.takim_lideri_id ? (myMap['TL_'+my.takim_lideri_id]?.ad_soyad||'—') : '—';
    const buOnaylayabilir = r.durum==='Ön Rezervasyon' && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id);
    // v30.99: onaycı; Ön Rezervasyon'u reddedebilir, Onaylandı'yı iptal edebilir
    // v31.06: sahip MY (rezerve eden) her aktif adımda kendi kaydını iptal edebilir
    const _rezAktif = ['Ön Rezervasyon','Onaylandı','Hazırlanıyor','Eşleştirildi','Fatura Kesildi'].includes(r.durum);
    const _rezSahip = r.rezerve_eden_id === currentUser.my_id;
    const buIptalEdebilir = _rezAktif && (_rezSahip || (r.durum!=='Ön Rezervasyon' && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id)));
    // v31.00 (1.3): Ön Rezervasyon veya Onaylandı iken onaycı paketi düzenleyebilir
    const buDuzenleyebilir = ['Ön Rezervasyon','Onaylandı'].includes(r.durum) && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id);
    // v31.05: süreç ilerletme butonları (duruma + izne göre)
    const buHazirla  = r.durum==='Onaylandı'      && _donanimSurecYetki('donanim_surec_ilerlet', r.satan_my_id, r.kcm_id);
    const buEslestir = ['Hazırlanıyor','Kısmen Eşleştirildi'].includes(r.durum) && _donanimSurecYetki('donanim_imei_eslestir', r.satan_my_id, r.kcm_id);
    const buFatura   = r.durum==='Eşleştirildi'   && _donanimSurecYetki('donanim_sevk', r.satan_my_id, r.kcm_id);
    const buGonder   = r.durum==='Fatura Kesildi' && _donanimSurecYetki('donanim_sevk', r.satan_my_id, r.kcm_id);
    // v30.92: kartta gösterilecek yeni alanlar
    const musteriAd   = musteriMap[r.ncst] || r.ncst || '—';
    const musteriMyAd = myMap[r.musteri_my_id]?.ad_soyad || '—';
    const rezEdenAd   = myMap[r.rezerve_eden_id]?.ad_soyad || '—';
    // v31.25: Satış Tipi rozeti + kart, sipariş adımına göre renkli kenarlık alır
    const satisTipi = satisTipiMap[r.sepet_id];
    const satisTipiRozet = satisTipi ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${DONANIM_SATIS_TIPI_RENK[satisTipi]||'var(--text3)'};color:#fff;margin-left:6px;white-space:nowrap;">${escapeHTML(satisTipi)}</span>` : '';
    // v31.26: kullanıcının kendi (satan/rezerve eden olduğu) YENİ onaylanmış siparişi — dikkat çeksin
    const buKendiYeniOnay = r.durum==='Onaylandı' && (r.satan_my_id===currentUser.my_id || r.rezerve_eden_id===currentUser.my_id);
    const dikkatCek = buKendiYeniOnay ? 'background:rgba(230,126,34,0.10);box-shadow:0 0 0 1px rgba(230,126,34,0.5);' : '';
    const yeniOnayRozet = buKendiYeniOnay ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--red);color:#fff;margin-left:6px;white-space:nowrap;">🔔 Onaylandı</span>` : '';
    return `<div class="visit-card" style="margin-bottom:8px;border-left:3px solid ${adim.renk};${dikkatCek}">
      <div style="cursor:pointer;" onclick="openDonanimRezDetay('${r.sepet_id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:12px;color:var(--text3);">${escapeHTML(kcmMap[r.kcm_id]||'KÇM#'+r.kcm_id)} · ${escapeHTML(tlAd)} · <b>${escapeHTML(my?.ad_soyad||'MY#'+r.satan_my_id)}</b></div>
          <div style="width:26px;height:26px;border-radius:50%;background:${adim.renk};color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;">${adim.no}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span style="font-size:11px;color:${adim.renk};font-weight:700;">${escapeHTML(r.durum)}${satisTipiRozet}${yeniOnayRozet}</span>
          <span style="font-size:14px;font-weight:800;">${Number(r.toplam_tutar||0).toLocaleString('tr-TR')} ₺</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">${r.kalem_sayisi} kalem · ${new Date(r.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:4px;border-top:1px solid var(--border);padding-top:4px;">
          Müşteri: <b>${escapeHTML(musteriAd)}</b><br>
          Müşterinin MY'si: ${escapeHTML(musteriMyAd)} · Rezerve eden: ${escapeHTML(rezEdenAd)}
        </div>
      </div>
      ${(buOnaylayabilir||buIptalEdebilir||buDuzenleyebilir||buHazirla||buEslestir||buFatura||buGonder) ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        ${buOnaylayabilir ? `<button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="event.stopPropagation();donanimRezervasyonOnayla('${r.sepet_id}')">✅ Onayla</button><button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimRezervasyonRed('${r.sepet_id}')">Reddet</button>` : ''}
        ${buDuzenleyebilir ? `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimRezDuzenleAc('${r.sepet_id}')">Düzenle</button>` : ''}
        ${buIptalEdebilir ? `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimRezervasyonIptal('${r.sepet_id}')">İptal Et</button>` : ''}
        ${buHazirla ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="event.stopPropagation();donanimSurecIlerlet('${r.sepet_id}','Hazırlanıyor')">Hazırla</button>` : ''}
        ${buEslestir ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="event.stopPropagation();donanimImeiEslestirAc('${r.sepet_id}')">IMEI Eşleştir</button>` : ''}
        ${buFatura ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="event.stopPropagation();donanimSurecIlerlet('${r.sepet_id}','Fatura Kesildi')">Fatura Kesildi</button>` : ''}
        ${buGonder ? `<button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="event.stopPropagation();donanimSurecIlerlet('${r.sepet_id}','Cihaz Gönderildi')">Cihaz Gönderildi</button>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');

  _donanimBadgeGuncelle(); // v31.26
}

// v30.89: Ön Rezervasyon -> Rezervasyon (kesinleşme). SADECE bu adımda
// stoktan gerçekten düşer: on_rezerve_adet azalır, rezerve_adet artar.
async function donanimRezervasyonOnayla(sepetId){
  if(!confirm('Bu rezervasyon talebini onaylayıp kesinleştirmek istediğinize emin misiniz?\n\nOnaylanınca cihazlar stoktan düşecek.')) return;

  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }

  // v30.90: savunmacı yetki kontrolü — buton görünmese de fonksiyon korunur
  const ilkK = kalemler[0];
  if(!_donanimRezOnayYetkisi(ilkK.satan_my_id, ilkK.kcm_id)){
    toast('Bu rezervasyonu onaylama yetkiniz yok','error'); return;
  }

  for(const k of kalemler){
    const {data:urun} = await sb.from('stok_urunleri').select('on_rezerve_adet,rezerve_adet').eq('urun_id', k.urun_id).single();
    if(!urun) continue;
    const yeniOnRez = Math.max(0, (urun.on_rezerve_adet||0) - k.adet);
    const yeniRez = (urun.rezerve_adet||0) + k.adet;
    await sb.from('stok_urunleri').update({on_rezerve_adet:yeniOnRez, rezerve_adet:yeniRez, updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
  }

  await sb.from('stok_rezervasyonlari').update({durum:'Onaylandı', updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);

  await _donanimRezHareketLog('Rezervasyon Onaylandı', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});

  toast('Rezervasyon onaylandı, stoktan düşürüldü','success');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

// v31.03: rezervasyon olayını HER KALEM için urun_id ile logla — ürün geçmişi + "kime verilmiş" izi
async function _donanimRezHareketLog(aksiyon, kalemler, ctx){
  let musteri = ctx.ncst || '—';
  if(ctx.ncst){ const {data:m}=await sb.from('customers').select('unvan').eq('ncst',ctx.ncst).maybeSingle(); if(m?.unvan) musteri=m.unvan; }
  let satan = ctx.satan_my_id ? ('MY#'+ctx.satan_my_id) : '—';
  if(ctx.satan_my_id){ const {data:u}=await sb.from('users').select('ad_soyad').eq('my_id',ctx.satan_my_id).maybeSingle(); if(u?.ad_soyad) satan=u.ad_soyad; }
  const satirlar = (kalemler||[]).filter(k=>k.urun_id).map(k=>({
    urun_id: parseInt(k.urun_id),
    aksiyon,
    detay: `${k.adet} adet · Müşteri: ${musteri}${ctx.ncst?` (${ctx.ncst})`:''} · Satan: ${satan}`,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  }));
  if(satirlar.length) await sb.from('stok_hareketleri').insert(satirlar);
}

// v30.99 (1.1): Ön rezervasyon RED — on_rezerve geri alınır, müsait değişmez
async function donanimRezervasyonRed(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  if(!_donanimRezOnayYetkisi(ilkK.satan_my_id, ilkK.kcm_id)){ toast('Bu talebi reddetme yetkiniz yok','error'); return; }
  if(ilkK.durum!=='Ön Rezervasyon'){ toast('Sadece Ön Rezervasyon reddedilebilir','info'); loadDonanimRezervasyonlar(); return; }
  if(!confirm('Bu ön rezervasyonu reddetmek istediğinize emin misiniz?\n\nStok değişmez, yalnız ön rezerve kaydı geri alınır.')) return;

  for(const k of kalemler){
    const {data:urun} = await sb.from('stok_urunleri').select('on_rezerve_adet').eq('urun_id', k.urun_id).single();
    if(!urun) continue;
    const yeniOnRez = Math.max(0, (urun.on_rezerve_adet||0) - k.adet);
    await sb.from('stok_urunleri').update({on_rezerve_adet:yeniOnRez, updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
  }
  await sb.from('stok_rezervasyonlari').update({durum:'Reddedildi', updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);
  await _donanimRezHareketLog('Rezervasyon Reddedildi', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});
  toast('Ön rezervasyon reddedildi','info');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

// v30.99 (1.2): Onaylı rezervasyon İPTAL — rezerve geri alınır, cihaz müsait stoğa döner
async function donanimRezervasyonIptal(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  const sahipMy = ilkK.rezerve_eden_id === currentUser.my_id;
  const onayci  = _donanimRezOnayYetkisi(ilkK.satan_my_id, ilkK.kcm_id);
  if(!sahipMy && !onayci){ toast('Bu rezervasyonu iptal etme yetkiniz yok','error'); return; }

  const aktif = ['Ön Rezervasyon','Onaylandı','Hazırlanıyor','Eşleştirildi','Fatura Kesildi'];
  if(!aktif.includes(ilkK.durum)){ toast(`Bu kayıt iptal edilemez (${ilkK.durum})`,'info'); loadDonanimRezervasyonlar(); return; }
  const onRezDurum = ilkK.durum==='Ön Rezervasyon';
  if(!confirm(onRezDurum
      ? 'Bu ön rezervasyonu iptal etmek istediğinize emin misiniz?'
      : 'Bu rezervasyonu iptal etmek istediğinize emin misiniz?\n\nCihazlar müsait stoğa geri dönecek.')) return;

  for(const k of kalemler){
    const {data:urun} = await sb.from('stok_urunleri').select('on_rezerve_adet,rezerve_adet').eq('urun_id', k.urun_id).single();
    if(!urun) continue;
    if(onRezDurum){
      await sb.from('stok_urunleri').update({on_rezerve_adet:Math.max(0,(urun.on_rezerve_adet||0)-k.adet), updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
    } else {
      await sb.from('stok_urunleri').update({rezerve_adet:Math.max(0,(urun.rezerve_adet||0)-k.adet), updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
    }
  }
  // v31.06: bağlı IMEI/seri varsa havuza iade (eşleştirme yapılmış olabilir)
  await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null}).eq('sepet_id', sepetId);

  await sb.from('stok_rezervasyonlari').update({durum:'İptal', updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);
  await _donanimRezHareketLog('Rezervasyon İptal', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});
  toast('Rezervasyon iptal edildi'+(onRezDurum?'':', stok iade edildi'),'info');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

// v31.05 (2.2): Satış sürecini bir sonraki adıma ilerletir
const DONANIM_GECIS = { 'Onaylandı':'Hazırlanıyor', 'Eşleştirildi':'Fatura Kesildi', 'Fatura Kesildi':'Cihaz Gönderildi' };
const DONANIM_GECIS_PERM = { 'Hazırlanıyor':'donanim_surec_ilerlet', 'Fatura Kesildi':'donanim_sevk', 'Cihaz Gönderildi':'donanim_sevk' };

async function donanimSurecIlerlet(sepetId, yeniDurum){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Kayıt bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  const gerekli = DONANIM_GECIS_PERM[yeniDurum];
  if(!gerekli || !_donanimSurecYetki(gerekli, ilkK.satan_my_id, ilkK.kcm_id)){ toast('Bu işlem için yetkiniz yok','error'); return; }
  if(DONANIM_GECIS[ilkK.durum]!==yeniDurum){ toast(`Bu kayıt '${ilkK.durum}' durumunda; '${yeniDurum}' geçişi yapılamaz`,'info'); loadDonanimRezervasyonlar(); return; }

  const {error:uErr} = await sb.from('stok_rezervasyonlari').update({durum:yeniDurum, updated_at:new Date().toISOString()}).eq('sepet_id',sepetId).eq('durum',ilkK.durum);
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await _donanimRezHareketLog('Süreç: '+yeniDurum, kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});
  toast(`Durum güncellendi: ${yeniDurum}`,'success');
  loadDonanimRezervasyonlar();
}

// ============ 2.3: IMEI EŞLEŞTİRME (kısmi, barcode + arama, KÇM kilitli) ============
// v31.18 (2.4): IMEI maskeleme — donanim_imei_gor yetkisi yoksa ilk4+son4
// dışında kalan kısım '*' ile maskelenir. Yetkisi olan (Depo/Muhasebe vb.)
// numarayı tam görür. Aktif eşleştirme (arama/seçim/scan) alanları etkilenmez —
// sadece zaten atanmış/görüntülenen IMEI'ler maskelenir.
function _imeiMaskele(seriNo){
  const s = String(seriNo||'').trim();
  if(!s) return '';
  if(hasPerm('donanim_imei_gor')) return s;
  if(s.length<=8) return '*'.repeat(s.length);
  return s.slice(0,4) + '*'.repeat(s.length-8) + s.slice(-4);
}

async function donanimImeiEslestirAc(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Kayıt bulunamadı','error'); return; }
  const ilk = kalemler[0];
  if(!_donanimSurecYetki('donanim_imei_eslestir', ilk.satan_my_id, ilk.kcm_id)){ toast('IMEI eşleştirme yetkiniz yok','error'); return; }
  if(!['Hazırlanıyor','Kısmen Eşleştirildi'].includes(ilk.durum)){ toast('Bu durumda eşleştirme yapılamaz','info'); loadDonanimRezervasyonlar(); return; }

  const urunIds=[...new Set(kalemler.map(k=>k.urun_id))];
  const {data:urunler}=await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id',urunIds);
  const adMap={}; (urunler||[]).forEach(u=>adMap[u.urun_id]=u.aciklama);

  // Bu siparişe zaten bağlı seriler
  const {data:bagliSeri}=await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id').eq('sepet_id',sepetId);
  const bagliByUrun={}; (bagliSeri||[]).forEach(s=>{ (bagliByUrun[s.urun_id]=bagliByUrun[s.urun_id]||[]).push({seri_no_id:s.seri_no_id, seri_no:s.seri_no}); });

  window._imeiEslestir = {
    sepetId,
    kalemler: kalemler.map((k,i)=>({
      idx:i, urun_id:k.urun_id, ad:adMap[k.urun_id]||('Cihaz #'+k.urun_id), adet:k.adet,
      bagli:(bagliByUrun[k.urun_id]||[]).slice(),
      orijinal:(bagliByUrun[k.urun_id]||[]).map(s=>s.seri_no_id)
    }))
  };
  _imeiRender();
  openModal('donanimImeiModal');
}

function _imeiRender(){
  const st=window._imeiEslestir;
  const box=document.getElementById('donanimImeiIcerik');
  box.innerHTML = st.kalemler.map(k=>{
    const dolu=k.bagli.length, hedef=k.adet;
    const seriRows = k.bagli.map(s=>`
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
        <span style="flex:1;font-family:monospace;font-size:12px;">${escapeHTML(_imeiMaskele(s.seri_no))}</span>
        <button class="btn btn-sm btn-ghost" onclick="donanimImeiKaldir(${k.idx},${s.seri_no_id})">Kaldır</button>
      </div>`).join('');
    const arama = dolu<hedef ? `
      <input type="text" id="imeiAra_${k.idx}" placeholder="IMEI okut veya ara (min 2 karakter)..." autocomplete="off"
        oninput="donanimImeiAra(${k.idx}, this.value)"
        onkeydown="if(event.key==='Enter'){event.preventDefault();donanimImeiEnter(${k.idx}, this.value);}"
        style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;margin-top:6px;">
      <div id="imeiSonuc_${k.idx}"></div>`
      : `<div style="font-size:11px;color:#27ae60;margin-top:4px;">Bu ürün tamamlandı ✓</div>`;
    return `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:10px;">
      <div style="font-weight:600;font-size:13px;">${escapeHTML(k.ad)} <span style="color:var(--text3);font-weight:400;">(${dolu}/${hedef})</span></div>
      ${seriRows}${arama}
    </div>`;
  }).join('');
  // v31.10: açılışta boş kalemler için boştaki serileri otomatik listele
  st.kalemler.forEach(k=>{ if(k.bagli.length<k.adet) donanimImeiAra(k.idx,''); });
}

async function donanimImeiAra(idx, q){
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  const sonuc=document.getElementById('imeiSonuc_'+idx);
  if(!sonuc) return;
  q=(q||'').trim();
  // KÇM kilidi: yalnız bu ürünün (urun_id) Depoda serileri. Boş sorguda ilk N gösterilir.
  let query = sb.from('stok_seri_no').select('seri_no_id,seri_no').eq('urun_id',k.urun_id).eq('durum','Depoda');
  if(q.length>=1) query = query.ilike('seri_no','%'+q+'%');
  const {data}=await query.order('seri_no').limit(15);
  const bagliIds=new Set(k.bagli.map(s=>s.seri_no_id));
  const list=(data||[]).filter(s=>!bagliIds.has(s.seri_no_id));
  if(!list.length){ sonuc.innerHTML='<div style="font-size:11px;color:var(--text3);padding:4px;">'+(q?'Eşleşen boşta cihaz yok.':'Bu ürün için boşta (Depoda) IMEI bulunamadı.')+'</div>'; return; }
  sonuc.innerHTML=list.map(s=>`<div onclick="donanimImeiSec(${idx},${s.seri_no_id},'${escapeHTML(s.seri_no)}')" style="cursor:pointer;padding:6px 8px;font-family:monospace;font-size:12px;border-bottom:1px solid var(--border);background:var(--navy3);border-radius:4px;margin-top:3px;">${escapeHTML(s.seri_no)}</div>`).join('');
}

async function donanimImeiEnter(idx, val){
  val=(val||'').trim(); if(!val) return;
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  if(k.bagli.length>=k.adet){ toast('Bu ürün için tüm slotlar dolu','info'); return; }
  const {data}=await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id,durum').eq('seri_no',val).maybeSingle();
  if(!data){ toast('Seri bulunamadı: '+val,'error'); return; }
  if(data.urun_id!==k.urun_id){ toast('Bu IMEI bu ürüne/KÇM\'ye ait değil','error'); return; }
  if(data.durum!=='Depoda'){ toast(`Bu IMEI boşta değil (durum: ${data.durum})`,'error'); return; }
  if(k.bagli.some(s=>s.seri_no_id===data.seri_no_id)){ toast('Zaten eklendi','info'); return; }
  k.bagli.push({seri_no_id:data.seri_no_id, seri_no:data.seri_no});
  _imeiRender();
  const inp=document.getElementById('imeiAra_'+idx); if(inp) inp.focus();
}

function donanimImeiSec(idx, seriNoId, seriNo){
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  if(k.bagli.length>=k.adet){ toast('Bu ürün için tüm slotlar dolu','info'); return; }
  if(k.bagli.some(s=>s.seri_no_id===seriNoId)){ toast('Zaten eklendi','info'); return; }
  k.bagli.push({seri_no_id:seriNoId, seri_no:String(seriNo)});
  _imeiRender();
}

function donanimImeiKaldir(idx, seriNoId){
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  k.bagli=k.bagli.filter(s=>s.seri_no_id!==seriNoId);
  _imeiRender();
}

async function donanimImeiKaydet(){
  const st=window._imeiEslestir; if(!st) return;
  const sepetId=st.sepetId;
  const eklenen=[], cikarilan=[]; let toplamSlot=0, toplamDolu=0;
  for(const k of st.kalemler){
    toplamSlot+=k.adet; toplamDolu+=k.bagli.length;
    const su=new Set(k.bagli.map(s=>s.seri_no_id)); const orj=new Set(k.orijinal);
    k.bagli.forEach(s=>{ if(!orj.has(s.seri_no_id)) eklenen.push({seri_no_id:s.seri_no_id, urun_id:k.urun_id}); });
    k.orijinal.forEach(id=>{ if(!su.has(id)) cikarilan.push(id); });
  }

  // Eklenenleri bağla — savunmacı doğrulama + kompanzasyon
  const basarili=[];
  for(const s of eklenen){
    const {data:m}=await sb.from('stok_seri_no').select('seri_no_id,urun_id,durum').eq('seri_no_id',s.seri_no_id).maybeSingle();
    if(!m || m.urun_id!==s.urun_id || m.durum!=='Depoda'){
      for(const b of basarili){ await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:new Date().toISOString()}).eq('seri_no_id',b); }
      toast('Bir IMEI artık uygun değil (başka işlem olmuş olabilir) — kayıt geri alındı','error'); return;
    }
    const {data:upd, error:uErr}=await sb.from('stok_seri_no')
      .update({durum:'Ayrıldı', sepet_id:sepetId, updated_at:new Date().toISOString()})
      .eq('seri_no_id',s.seri_no_id).eq('durum','Depoda').select('seri_no_id');
    if(uErr || !upd?.length){
      for(const b of basarili){ await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:new Date().toISOString()}).eq('seri_no_id',b); }
      toast('IMEI bağlanamadı (eşzamanlı değişim?) — kayıt geri alındı','error'); return;
    }
    basarili.push(s.seri_no_id);
  }
  // Çıkarılanları havuza iade
  for(const id of cikarilan){
    await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:new Date().toISOString()}).eq('seri_no_id',id);
  }

  const yeniDurum = toplamDolu>=toplamSlot ? 'Eşleştirildi' : (toplamDolu>0 ? 'Kısmen Eşleştirildi' : 'Hazırlanıyor');
  await sb.from('stok_rezervasyonlari').update({durum:yeniDurum, updated_at:new Date().toISOString()}).eq('sepet_id',sepetId);

  const {data:kalemler}=await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id',sepetId);
  const ilk=kalemler?.[0]||{};
  await _donanimRezHareketLog(`IMEI Eşleştirme (${toplamDolu}/${toplamSlot})`, kalemler, {ncst:ilk.ncst, satan_my_id:ilk.satan_my_id});

  toast(`Eşleştirme kaydedildi (${toplamDolu}/${toplamSlot})`,'success');
  closeModal('donanimImeiModal');
  loadDonanimRezervasyonlar();
}

// ============ 1.3: REZERVASYON PAKET DÜZENLEME ============
async function donanimRezDuzenleAc(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Kayıt bulunamadı','error'); return; }
  const ilk = kalemler[0];
  if(!_donanimRezOnayYetkisi(ilk.satan_my_id, ilk.kcm_id)){ toast('Düzenleme yetkiniz yok','error'); return; }
  if(!['Ön Rezervasyon','Onaylandı'].includes(ilk.durum)){ toast('Bu durumda düzenlenemez','info'); return; }

  const urunIds = [...new Set(kalemler.map(k=>k.urun_id))];
  const {data:urunler} = await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id', urunIds);
  const adMap={}; (urunler||[]).forEach(u=>adMap[u.urun_id]=u.aciklama);

  window._rezDuzenle = {
    sepetId, durum: ilk.durum, kcmId: ilk.kcm_id,
    sablon: { kcm_id:ilk.kcm_id, ncst:ilk.ncst, musteri_my_id:ilk.musteri_my_id,
              satan_my_id:ilk.satan_my_id, rezerve_eden_id:ilk.rezerve_eden_id, durum:ilk.durum,
              satis_tipi: ilk.satis_tipi || null }, // v31.25
    kalemler: kalemler.map(k=>({ urun_id:k.urun_id, ad: adMap[k.urun_id]||('Cihaz #'+k.urun_id), adet:k.adet })),
    musaitMap: {}
  };

  document.getElementById('donanimRezDuzenleDurum').textContent =
    `Durum: ${ilk.durum}` + (ilk.durum==='Onaylandı' ? ' — adet artışı yalnız müsait stok varsa uygulanır' : ' — stok kilitlenmez');

  // v31.25: Satış Tipi chip seçimini mevcut değere göre işaretle
  document.querySelectorAll('#donanimRezDuzenleSatisTipiBox .chip-btn').forEach(c=>{
    c.classList.toggle('selected', c.getAttribute('data-tip')===ilk.satis_tipi);
  });

  const sel = document.getElementById('donanimRezDuzenleYeniCihaz');
  sel.innerHTML='<option value="">Yükleniyor...</option>';
  const {data:musait} = await sb.from('stok_musait').select('urun_id,aciklama,musait_adet').eq('kcm_id', ilk.kcm_id).order('aciklama');
  (musait||[]).forEach(u=>window._rezDuzenle.musaitMap[u.urun_id]=u.musait_adet);
  sel.innerHTML = '<option value="">Seçiniz...</option>' +
    (musait||[]).map(u=>`<option value="${u.urun_id}" data-ad="${escapeHTML(u.aciklama||'Cihaz #'+u.urun_id)}">${escapeHTML(u.aciklama||'Cihaz #'+u.urun_id)} (müsait: ${u.musait_adet})</option>`).join('');

  document.getElementById('donanimRezDuzenleYeniAdet').value=1;
  _donanimRezDuzenleRender();
  openModal('donanimRezDuzenleModal');
}

// v31.25: Rezervasyon düzenleme — Satış Tipi seçimi (kaydet'te uygulanır)
function donanimRezDuzenleSatisTipiSec(el, tip){
  document.querySelectorAll('#donanimRezDuzenleSatisTipiBox .chip-btn').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  if(window._rezDuzenle) window._rezDuzenle.sablon.satis_tipi = tip;
}

function _donanimRezDuzenleRender(){
  const box = document.getElementById('donanimRezDuzenleKalemler');
  const st = window._rezDuzenle;
  if(!st.kalemler.length){ box.innerHTML='<div class="empty" style="font-size:12px;">Kalem yok — en az bir cihaz olmalı.</div>'; return; }
  box.innerHTML = st.kalemler.map((k,i)=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="flex:1;font-size:12px;">${escapeHTML(k.ad)}</div>
      <input type="number" min="1" value="${k.adet}" onchange="donanimRezDuzenleAdet(${i}, this.value)" style="width:70px;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px;font-size:13px;">
      <button class="btn btn-sm btn-ghost" onclick="donanimRezDuzenleSil(${i})">Sil</button>
    </div>`).join('');
}

function donanimRezDuzenleAdet(i, val){
  const a = parseInt(val);
  if(!a || a<1){ toast('Adet en az 1 olmalı','error'); _donanimRezDuzenleRender(); return; }
  window._rezDuzenle.kalemler[i].adet = a;
}

function donanimRezDuzenleSil(i){
  window._rezDuzenle.kalemler.splice(i,1);
  _donanimRezDuzenleRender();
}

function donanimRezDuzenleCihazEkle(){
  const sel = document.getElementById('donanimRezDuzenleYeniCihaz');
  const urunId = parseInt(sel.value);
  const adet = parseInt(document.getElementById('donanimRezDuzenleYeniAdet').value);
  if(!urunId){ toast('Cihaz seçin','error'); return; }
  if(!adet || adet<1){ toast('Geçerli adet girin','error'); return; }
  const ad = sel.options[sel.selectedIndex]?.getAttribute('data-ad') || ('Cihaz #'+urunId);
  const st = window._rezDuzenle;
  const mevcut = st.kalemler.find(k=>k.urun_id===urunId);
  if(mevcut){ mevcut.adet += adet; } else { st.kalemler.push({ urun_id:urunId, ad, adet }); }
  _donanimRezDuzenleRender();
  document.getElementById('donanimRezDuzenleYeniAdet').value=1;
  sel.value='';
}

async function donanimRezDuzenleKaydet(){
  const st = window._rezDuzenle;
  if(!st) return;
  if(!st.kalemler.length){ toast('En az bir cihaz kalmalı (tümünü kaldırmak için İptal/Reddet kullanın)','error'); return; }

  // Guard: orijinali tekrar oku, durum değişmemiş mi
  const {data:orj, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', st.sepetId);
  if(error||!orj?.length){ toast('Kayıt bulunamadı','error'); return; }
  if(orj[0].durum!==st.durum){ toast('Durum değişmiş — düzenleme iptal, tekrar açın','error'); closeModal('donanimRezDuzenleModal'); loadDonanimRezervasyonlar(); return; }

  // urun_id bazında net delta
  const eskiMap={}; orj.forEach(k=>{ eskiMap[k.urun_id]=(eskiMap[k.urun_id]||0)+k.adet; });
  const yeniMap={}; st.kalemler.forEach(k=>{ yeniMap[k.urun_id]=(yeniMap[k.urun_id]||0)+k.adet; });
  const tumUrun = [...new Set([...Object.keys(eskiMap),...Object.keys(yeniMap)].map(Number))];
  const delta={}; tumUrun.forEach(u=>{ delta[u]=(yeniMap[u]||0)-(eskiMap[u]||0); });

  // Onaylandı: pozitif delta'lar için müsait ÖN-kontrol (kısmi uygulama olmasın)
  if(st.durum==='Onaylandı'){
    for(const u of tumUrun){
      if(delta[u]>0){
        const {data:urun} = await sb.from('stok_urunleri').select('toplam_adet,rezerve_adet').eq('urun_id',u).single();
        const musait=(urun?.toplam_adet||0)-(urun?.rezerve_adet||0);
        if(musait < delta[u]){ toast(`Müsait stok yetersiz (cihaz #${u}: müsait ${musait}, gerekli +${delta[u]}) — kaydedilmedi`,'error'); return; }
      }
    }
  }

  // Stok uygula (durum-farkında)
  for(const u of tumUrun){
    if(delta[u]===0) continue;
    const {data:urun} = await sb.from('stok_urunleri').select('on_rezerve_adet,rezerve_adet').eq('urun_id',u).single();
    if(!urun) continue;
    if(st.durum==='Ön Rezervasyon'){
      await sb.from('stok_urunleri').update({ on_rezerve_adet: Math.max(0,(urun.on_rezerve_adet||0)+delta[u]), updated_at:new Date().toISOString() }).eq('urun_id',u);
    } else {
      await sb.from('stok_urunleri').update({ rezerve_adet: Math.max(0,(urun.rezerve_adet||0)+delta[u]), updated_at:new Date().toISOString() }).eq('urun_id',u);
    }
  }

  // Satır senkronu — (sepet_id, urun_id) hedefli (delete-all riski yok)
  const yeniUrunSet = new Set(st.kalemler.map(k=>k.urun_id));
  for(const k of st.kalemler){
    const varMi = orj.find(o=>o.urun_id===k.urun_id);
    if(varMi){
      await sb.from('stok_rezervasyonlari').update({ adet:k.adet, updated_at:new Date().toISOString() }).eq('sepet_id',st.sepetId).eq('urun_id',k.urun_id);
    } else {
      const {error:iErr} = await sb.from('stok_rezervasyonlari').insert({
        sepet_id:st.sepetId, urun_id:k.urun_id, adet:k.adet,
        kcm_id:st.sablon.kcm_id, ncst:st.sablon.ncst, musteri_my_id:st.sablon.musteri_my_id,
        satan_my_id:st.sablon.satan_my_id, rezerve_eden_id:st.sablon.rezerve_eden_id, durum:st.sablon.durum,
        satis_tipi:st.sablon.satis_tipi
      });
      if(iErr){ toast('Hata: kalem eklenemedi: '+iErr.message,'error'); return; }
    }
  }
  const silUrun = orj.filter(o=>!yeniUrunSet.has(o.urun_id)).map(o=>o.urun_id);
  if(silUrun.length){ await sb.from('stok_rezervasyonlari').delete().eq('sepet_id',st.sepetId).in('urun_id',silUrun); }

  // v31.25: Satış Tipi değiştiyse sepetteki tüm satırlara uygula
  if(st.sablon.satis_tipi && st.sablon.satis_tipi !== orj[0].satis_tipi){
    await sb.from('stok_rezervasyonlari').update({ satis_tipi: st.sablon.satis_tipi, updated_at:new Date().toISOString() }).eq('sepet_id', st.sepetId);
  }

  await _donanimRezHareketLog('Rezervasyon Düzenlendi', st.kalemler, {ncst:st.sablon.ncst, satan_my_id:st.sablon.satan_my_id});

  toast('Rezervasyon güncellendi','success');
  closeModal('donanimRezDuzenleModal');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

async function openDonanimRezDetay(sepetId){
  const icerikEl = document.getElementById('donanimRezDetayIcerik');
  icerikEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  openModal('donanimRezDetayModal');

  // v30.91: embedded FK join (400) yerine 2 ayrı sorgu — iki tablo arası FK yok
  const {data:kalemler, error:kErr} = await sb.from('stok_rezervasyonlari')
    .select('*').eq('sepet_id', sepetId).order('created_at');
  if(kErr || !kalemler || !kalemler.length){ icerikEl.innerHTML='<div class="empty">Bulunamadı.</div>'; return; }

  // Ürün bilgisini ayrı çek ve eşle
  const urunIds = [...new Set(kalemler.map(k=>k.urun_id).filter(Boolean))];
  const urunMap = {};
  if(urunIds.length){
    const {data:urunler} = await sb.from('stok_urunleri').select('urun_id,aciklama,fiyat').in('urun_id', urunIds);
    (urunler||[]).forEach(u=>{ urunMap[u.urun_id] = u; });
  }

  // v31.18 (2.4): bu sepete atanmış IMEI/seri no'lar — donanim_imei_gor yoksa maskeli gösterilir
  const {data:seriler} = await sb.from('stok_seri_no').select('seri_no,urun_id').eq('sepet_id', sepetId);
  const seriByUrun = {};
  (seriler||[]).forEach(s=>{ (seriByUrun[s.urun_id]=seriByUrun[s.urun_id]||[]).push(s.seri_no); });

  const ilk = kalemler[0];
  const {data:myData} = await sb.from('users').select('ad_soyad,takim_lideri_id,kcm_id').eq('my_id',ilk.satan_my_id).single();
  let tlAd='—', kcmAd='—';
  if(myData?.takim_lideri_id){
    const {data:tl} = await sb.from('users').select('ad_soyad').eq('my_id',myData.takim_lideri_id).single();
    tlAd = tl?.ad_soyad||'—';
  }
  if(ilk.kcm_id){
    const {data:kcm} = await sb.from('kcm_groups').select('kcm_adi').eq('kcm_id',ilk.kcm_id).single();
    kcmAd = kcm?.kcm_adi||'—';
  }

  const adim = DONANIM_SUREC_ADIMLARI[ilk.durum] || {no:'?', renk:'var(--text3)'};
  let toplam=0;
  const satirlar = kalemler.map(k=>{
    const fiyat = urunMap[k.urun_id]?.fiyat||0;
    const satirToplam = fiyat * k.adet;
    toplam += satirToplam;
    const seriListesi = (seriByUrun[k.urun_id]||[]).map(sn=>escapeHTML(_imeiMaskele(sn))).join('<br>');
    return `<tr>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;">${escapeHTML(urunMap[k.urun_id]?.aciklama||'—')}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:center;">${k.adet}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:right;">${Number(fiyat).toLocaleString('tr-TR')} ₺</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:right;font-weight:700;">${Number(satirToplam).toLocaleString('tr-TR')} ₺</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:11px;font-family:monospace;color:var(--text2);">${seriListesi||'—'}</td>
    </tr>`;
  }).join('');

  icerikEl.innerHTML = `
    <div style="margin-bottom:10px;font-size:13px;">
      <div><b>KÇM:</b> ${escapeHTML(kcmAd)}</div>
      <div><b>Takım Lideri:</b> ${escapeHTML(tlAd)}</div>
      <div><b>MY/FMY:</b> ${escapeHTML(myData?.ad_soyad||'—')}</div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
        <span style="background:${adim.renk};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${adim.no}. ${escapeHTML(ilk.durum)}</span>
        ${ilk.satis_tipi ? `<span style="background:${DONANIM_SATIS_TIPI_RENK[ilk.satis_tipi]||'var(--text3)'};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${escapeHTML(ilk.satis_tipi)}</span>` : ''}
      </div>
    </div>
    <div style="overflow:auto;border:1px solid var(--border);border-radius:8px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:var(--navy2);">
          <th style="padding:6px;text-align:left;font-size:10px;color:var(--text3);">ÜRÜN</th>
          <th style="padding:6px;font-size:10px;color:var(--text3);">ADET</th>
          <th style="padding:6px;text-align:right;font-size:10px;color:var(--text3);">BİRİM</th>
          <th style="padding:6px;text-align:right;font-size:10px;color:var(--text3);">TOPLAM</th>
          <th style="padding:6px;text-align:left;font-size:10px;color:var(--text3);">IMEI</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
    </div>
    ${(!hasPerm('donanim_imei_gor') && Object.keys(seriByUrun).length) ? `<div style="font-size:10px;color:var(--text3);margin-top:4px;">IMEI numaraları güvenlik nedeniyle kısmi (ilk4+son4) gösterilir.</div>` : ''}
    <div style="text-align:right;margin-top:10px;font-size:16px;font-weight:800;">Genel Toplam: ${Number(toplam).toLocaleString('tr-TR')} ₺</div>
    ${ilk.aciklama ? `<div style="margin-top:8px;font-size:12px;color:var(--text2);">Not: ${escapeHTML(ilk.aciklama)}</div>` : ''}
  `;
}

/* ============================================================
   DEPO & DAĞITIM — Depo & Muhasebe ekranı (V31.55)
   ------------------------------------------------------------
   Merkez Depo = cihaz havuzu (depolar.kcm_id IS NULL, tip='ANA').
   Her KÇM aynı zamanda bir sanal depodur; istendiğinde her deponun
   altına TEK bir cep depo açılabilir — tekilliği veri tabanı
   indeksleri zorlar (ux_depolar_kcm_tip / ux_depolar_merkez_tip).

   Bu ekran Merkez -> diğer depolara ADET tahsisi yapar; seri (IMEI)
   TAŞIMAZ. IMEI'ler havuzda kalır, satışta eşleştirilir.
   Ana depo <-> cep depo hareketi transfer akışıyla yapılacak (Faz 6).

   Kurallar:
   • Σ (Merkez dışı depolar) <= Merkez toplam_adet
   • Bir deponun tahsisi rezerve_adet + on_rezerve_adet altına inemez
   • Adet 0 + rezervasyon yok  -> satır silinir
   • Ürün pasife alınırsa aynı malzeme_kodu'nun TÜM depo satırları pasif
   ============================================================ */

window._donanimDepolar  = window._donanimDepolar  || [];
window._donanimDepoUrun = window._donanimDepoUrun || {};
window._donanimDagitim  = window._donanimDagitim  || null;

// HTML attribute içindeki tek tırnaklı JS dizesi için kaçış
function _jsStr(s){
  return String(s==null?'':s)
    .replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    .replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

function _depoMerkez(){
  return (window._donanimDepolar||[]).find(d=> d.kcm_id===null && d.tip==='ANA') || null;
}

function _depoAd(d){
  if(!d) return '—';
  return d.tam_ad || d.depo_adi || ('Depo #'+d.depo_id);
}

async function _donanimDepolarYukle(zorla){
  if(!zorla && window._donanimDepolar.length) return window._donanimDepolar;
  const {data,error} = await sb.from('depolar_v').select('*').eq('aktif',true);
  if(error){ console.error('[donanim] depolar okunamadı:', error.message); return window._donanimDepolar; }
  const list = data||[];
  // Merkez önce; sonra KÇM adına göre, her ana deponun hemen ardından cebi
  list.sort((a,b)=>{
    const ak = (a.kcm_id===null)?0:1, bk = (b.kcm_id===null)?0:1;
    if(ak!==bk) return ak-bk;
    const an = (a.kcm_adi||a.depo_adi||''), bn = (b.kcm_adi||b.depo_adi||'');
    if(an!==bn) return an.localeCompare(bn,'tr');
    return (a.tip==='ANA'?0:1) - (b.tip==='ANA'?0:1);
  });
  window._donanimDepolar = list;
  return list;
}

// stok_urunleri'nden depoya bağlı TÜM satırlar — sayfalanarak (limit tuzağı yok)
async function _donanimDepoSatirlariYukle(){
  const kolon = 'urun_id,depo_id,kcm_id,depo_adi,malzeme_kodu,aciklama,toplam_adet,rezerve_adet,on_rezerve_adet,aktif,tum_kcm';
  const hepsi = []; const SAYFA = 1000;
  for(let bas=0; bas<20000; bas+=SAYFA){
    const {data,error} = await sb.from('stok_urunleri').select(kolon)
      .not('depo_id','is',null).order('urun_id').range(bas, bas+SAYFA-1);
    if(error) throw new Error('Depo satırları okunamadı: '+error.message);
    hepsi.push(...(data||[]));
    if(!data || data.length < SAYFA) break;
  }
  return hepsi;
}

async function loadDonanimDepoSekme(){
  const kartEl = document.getElementById('donanimDepoKartlari');
  const listEl = document.getElementById('donanimDepoUrunListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try{
    await _donanimDepolarYukle(true);
    const satirlar = await _donanimDepoSatirlariYukle();

    // Depo bazlı özet
    const ozet = {};
    (window._donanimDepolar||[]).forEach(d=>{ ozet[d.depo_id] = {urun:0, adet:0}; });
    satirlar.forEach(s=>{
      if(!ozet[s.depo_id]) ozet[s.depo_id] = {urun:0, adet:0};
      if((s.toplam_adet||0) > 0){ ozet[s.depo_id].urun++; ozet[s.depo_id].adet += (s.toplam_adet||0); }
    });
    if(kartEl) kartEl.innerHTML = _donanimDepoKartlari(ozet);

    // Ürün bazlı gruplama (malzeme_kodu)
    const merkez = _depoMerkez();
    const gruplar = {};
    satirlar.forEach(s=>{
      const k = s.malzeme_kodu || ('#'+s.urun_id);
      if(!gruplar[k]) gruplar[k] = {kod:k, aciklama:'', tum_kcm:false, aktif:true, merkez:null, satirlar:{}};
      const g = gruplar[k];
      g.satirlar[s.depo_id] = s;
      if(merkez && s.depo_id === merkez.depo_id){
        g.merkez = s; g.tum_kcm = !!s.tum_kcm; g.aktif = !!s.aktif;
        if(s.aciklama) g.aciklama = s.aciklama;
      }
      if(!g.aciklama) g.aciklama = s.aciklama || '';
    });
    window._donanimDepoUrun = gruplar;

    listEl.innerHTML = _donanimDepoUrunListesi();
  }catch(err){
    console.error(err);
    listEl.innerHTML = `<div style="padding:16px;color:var(--red);font-size:13px;">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

function _donanimDepoKartlari(ozet){
  const list = window._donanimDepolar||[];
  if(!list.length) return '<div style="padding:12px;color:var(--text2);font-size:13px;">Depo tanımlı değil.</div>';
  const cepVar = {};
  list.forEach(d=>{ if(d.tip==='CEP') cepVar[(d.kcm_id===null?'M':d.kcm_id)] = true; });
  return list.map(d=>{
    const o = ozet[d.depo_id] || {urun:0, adet:0};
    const cep = (d.tip==='CEP');
    const anahtar = (d.kcm_id===null?'M':d.kcm_id);
    const cepButonu = (!cep && !cepVar[anahtar] && hasPerm('donanim_yonet'))
      ? `<button class="btn btn-ghost btn-sm" onclick="donanimCepDepoAc(${d.kcm_id===null?'null':d.kcm_id})">+ Cep Depo</button>`
      : '';
    return `<div style="background:var(--navy3);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;${cep?'margin-left:18px;border-left:3px solid var(--blue);':''}">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:13px;">${escapeHTML(_depoAd(d))}${cep?' <span style="font-weight:400;color:var(--text3);font-size:11px;">(cep)</span>':''}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px;">${o.urun} ürün · ${o.adet} cihaz</div>
      </div>
      ${cepButonu}
    </div>`;
  }).join('');
}

function _donanimDepoUrunListesi(){
  const gruplar = window._donanimDepoUrun||{};
  const q = (document.getElementById('donanimDepoUrunAra')?.value||'').trim().toLocaleLowerCase('tr');
  const sadeceStoklu = !!document.getElementById('donanimDepoSadeceStoklu')?.checked;
  const merkez = _depoMerkez();

  let kodlar = Object.keys(gruplar);
  if(q){
    const kelimeler = q.split(/\s+/).filter(Boolean);
    kodlar = kodlar.filter(k=>{
      const metin = ((gruplar[k].aciklama||'') + ' ' + k).toLocaleLowerCase('tr');
      return kelimeler.every(w=> metin.includes(w));
    });
  }
  if(sadeceStoklu) kodlar = kodlar.filter(k=> ((gruplar[k].merkez && gruplar[k].merkez.toplam_adet) || 0) > 0);
  kodlar.sort((a,b)=> (gruplar[a].aciklama||a).localeCompare(gruplar[b].aciklama||b,'tr'));

  if(!kodlar.length) return '<div style="padding:16px;color:var(--text2);font-size:13px;">Kayıt bulunamadı.</div>';

  return `<div style="font-size:11px;color:var(--text3);margin-bottom:6px;">${kodlar.length} ürün</div>` +
  kodlar.map(k=>{
    const g = gruplar[k];
    const havuz = (g.merkez && g.merkez.toplam_adet) || 0;
    let dagitilan = 0;
    Object.keys(g.satirlar).forEach(id=>{
      if(!merkez || parseInt(id) !== merkez.depo_id) dagitilan += (g.satirlar[id].toplam_adet||0);
    });
    const kalan = havuz - dagitilan;
    return `<div style="background:var(--navy2);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;${g.aktif?'':'opacity:.55;'}">
      <div style="font-weight:700;font-size:13px;line-height:1.35;">${escapeHTML(g.aciklama||k)}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">${escapeHTML(k)}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:6px;">
        Havuzda: <b style="color:var(--text);">${havuz}</b> ·
        Dağıtılan: <b style="color:var(--text);">${dagitilan}</b> ·
        Merkez'de kalan: <b style="color:${kalan<0?'var(--red)':'var(--green)'};">${kalan}</b>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap;">
        <label style="font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" ${g.tum_kcm?'checked':''} onchange="donanimOrtakStokToggle('${_jsStr(k)}', this.checked)"> Ortak stok
        </label>
        <label style="font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" ${g.aktif?'checked':''} onchange="donanimUrunAktifToggle('${_jsStr(k)}', this.checked)"> Aktif
        </label>
        <button class="btn btn-sm" style="background:var(--blue);margin-left:auto;" onclick="donanimDagitimModalAc('${_jsStr(k)}')">Dağıt</button>
      </div>
    </div>`;
  }).join('');
}

let _donanimDepoAraT = null;
function donanimDepoUrunAraDebounce(){
  clearTimeout(_donanimDepoAraT);
  _donanimDepoAraT = setTimeout(donanimDepoFiltreDegisti, 250);
}
function donanimDepoFiltreDegisti(){
  const el = document.getElementById('donanimDepoUrunListesi');
  if(el) el.innerHTML = _donanimDepoUrunListesi();
}

// Cep depo aç — her deponun altında EN FAZLA bir tane (indeks zorlar)
async function donanimCepDepoAc(kcmId){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const kid = (kcmId===null || kcmId===undefined || kcmId==='') ? null : parseInt(kcmId);
  const ana = (window._donanimDepolar||[]).find(d=> d.tip==='ANA' && ((kid===null && d.kcm_id===null) || d.kcm_id===kid));
  const ad = (ana ? (ana.kcm_adi || ana.depo_adi) : 'Depo') + ' - Cep';
  const {error} = await sb.from('depolar').insert({kcm_id:kid, depo_adi:ad, tip:'CEP'});
  if(error){ toast('Cep depo açılamadı: '+error.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({
    aksiyon:'Cep Depo Açıldı', detay:ad,
    user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id)
  });
  toast('Cep depo açıldı: '+ad,'success');
  loadDonanimDepoSekme();
}

function donanimDagitimModalAc(kod){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const g = (window._donanimDepoUrun||{})[kod];
  if(!g){ toast('Ürün bulunamadı','error'); return; }
  const merkez = _depoMerkez();
  if(!merkez){ toast('Merkez Depo tanımlı değil','error'); return; }

  const satirlar = (window._donanimDepolar||[])
    .filter(d=> d.depo_id !== merkez.depo_id)
    .map(d=>{
      const s = g.satirlar[d.depo_id] || null;
      return {
        depo_id: d.depo_id, ad: _depoAd(d), kcm_id: d.kcm_id, depo_adi: d.depo_adi,
        urun_id: s ? s.urun_id : null,
        mevcut:  s ? (s.toplam_adet||0) : 0,
        alt:     s ? ((s.rezerve_adet||0) + (s.on_rezerve_adet||0)) : 0,
        adet:    s ? (s.toplam_adet||0) : 0
      };
    });

  window._donanimDagitim = {
    kod, aciklama: g.aciklama||kod,
    havuz: (g.merkez && g.merkez.toplam_adet) || 0,
    merkezUrunId: (g.merkez && g.merkez.urun_id) || null,
    tum_kcm: !!g.tum_kcm,
    satirlar
  };

  const bas = document.getElementById('donanimDagitimBaslik');
  if(bas) bas.textContent = 'Dağıt — ' + (g.aciklama||kod);
  _donanimDagitimRender();
  openModal('donanimDagitimModal');
}

function _donanimDagitimRender(){
  const D = window._donanimDagitim; if(!D) return;
  const el = document.getElementById('donanimDagitimSatirlar');
  if(el) el.innerHTML = D.satirlar.map((r,i)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">${escapeHTML(r.ad)}</div>
        ${r.alt>0?`<div style="font-size:11px;color:#f59e0b;">En az ${r.alt} olmalı (rezerve edilmiş)</div>`:''}
      </div>
      <input type="number" min="${r.alt}" step="1" value="${r.adet}"
             oninput="donanimDagitimAdet(${i}, this.value)"
             style="width:80px;text-align:center;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;font-size:14px;">
    </div>`).join('');
  _donanimDagitimToplamYaz();
}

function _donanimDagitimToplamYaz(){
  const D = window._donanimDagitim; if(!D) return;
  const toplam = D.satirlar.reduce((t,r)=> t + (parseInt(r.adet)||0), 0);
  const kalan = D.havuz - toplam;
  const asim = kalan < 0;
  const el = document.getElementById('donanimDagitimToplam');
  if(el) el.innerHTML =
    `<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:10px 0;">
       <span style="color:var(--text2);">Havuz: <b style="color:var(--text);">${D.havuz}</b></span>
       <span style="color:var(--text2);">Dağıtılan: <b style="color:var(--text);">${toplam}</b></span>
       <span style="color:${asim?'var(--red)':'var(--green)'};font-weight:700;">Kalan: ${kalan}</span>
     </div>
     ${asim?`<div style="font-size:12px;color:var(--red);">Toplam dağıtım havuzu ${-kalan} adet aşıyor.</div>`:''}`;
  const btn = document.getElementById('donanimDagitimKaydetBtn');
  if(btn){ btn.disabled = asim; btn.style.opacity = asim ? '.5' : '1'; }
}

function donanimDagitimAdet(i, val){
  const D = window._donanimDagitim; if(!D || !D.satirlar[i]) return;
  let v = parseInt(val); if(isNaN(v) || v < 0) v = 0;
  D.satirlar[i].adet = v;
  _donanimDagitimToplamYaz();
}

async function donanimDagitimKaydet(){
  const D = window._donanimDagitim; if(!D) return;
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }

  const toplam = D.satirlar.reduce((t,r)=> t + (parseInt(r.adet)||0), 0);
  if(toplam > D.havuz){ toast(`Toplam dağıtım havuzu aşıyor (${toplam} > ${D.havuz})`,'error'); return; }

  // Azaltma güvenliği — HİÇBİR ŞEY YAZILMADAN ÖNCE tümü doğrulanır
  for(const r of D.satirlar){
    if((parseInt(r.adet)||0) < r.alt){
      toast(`${r.ad}: tahsis ${r.alt} altına inemez (rezerve edilmiş)`,'error'); return;
    }
  }

  const btn = document.getElementById('donanimDagitimKaydetBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  const hatalar = [];
  for(const r of D.satirlar){
    const adet = parseInt(r.adet)||0;
    try{
      if(r.urun_id){
        if(adet === 0 && r.alt === 0){
          const {error} = await sb.from('stok_urunleri').delete().eq('urun_id', r.urun_id);
          if(error) throw new Error(error.message);
        } else if(adet !== r.mevcut){
          const {error} = await sb.from('stok_urunleri')
            .update({toplam_adet:adet, updated_at:new Date().toISOString()}).eq('urun_id', r.urun_id);
          if(error) throw new Error(error.message);
        }
      } else if(adet > 0){
        const {error} = await sb.from('stok_urunleri').insert({
          depo_id: r.depo_id, kcm_id: r.kcm_id, depo_adi: r.depo_adi,
          malzeme_kodu: D.kod, aciklama: D.aciklama,
          toplam_adet: adet, rezerve_adet: 0, on_rezerve_adet: 0,
          aktif: true, tum_kcm: !!D.tum_kcm
        });
        if(error) throw new Error(error.message);
      }
    }catch(e){ hatalar.push(`${r.ad}: ${e.message}`); }
  }

  const {error:logErr} = await sb.from('stok_hareketleri').insert({
    urun_id: D.merkezUrunId || null,
    aksiyon: 'Depo Dağıtımı',
    detay: `${D.aciklama} — havuz ${D.havuz}, dağıtılan ${toplam}` + (hatalar.length?` · ${hatalar.length} hata`:''),
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  });
  if(logErr) console.error('[donanim] dağıtım log hatası:', logErr.message);

  if(btn){ btn.disabled = false; btn.textContent = 'Kaydet'; }
  if(hatalar.length){
    console.error('[donanim] dağıtım hataları:', hatalar);
    toast('Bazı depolar kaydedilemedi: '+hatalar[0],'error');
  } else {
    toast('Dağıtım kaydedildi','success');
  }
  closeModal('donanimDagitimModal');
  loadDonanimDepoSekme();
}

// Ortak stok / aktiflik — aynı malzeme_kodu'nun TÜM depo satırlarına uygulanır
async function donanimOrtakStokToggle(kod, deger){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); loadDonanimDepoSekme(); return; }
  const {error} = await sb.from('stok_urunleri')
    .update({tum_kcm: !!deger, updated_at:new Date().toISOString()})
    .eq('malzeme_kodu', kod).not('depo_id','is',null);
  if(error) toast('Kaydedilemedi: '+error.message,'error');
  else toast(deger?'Ortak stok açıldı':'Ortak stok kapatıldı','success');
  loadDonanimDepoSekme();
}

async function donanimUrunAktifToggle(kod, deger){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); loadDonanimDepoSekme(); return; }
  const {error} = await sb.from('stok_urunleri')
    .update({aktif: !!deger, updated_at:new Date().toISOString()})
    .eq('malzeme_kodu', kod).not('depo_id','is',null);
  if(error) toast('Kaydedilemedi: '+error.message,'error');
  else toast(deger?'Ürün aktif edildi':'Ürün pasife alındı','success');
  loadDonanimDepoSekme();
}

/* ============================================================
   DEPO STOK RAPORU (V31.56)
   ------------------------------------------------------------
   Pivot: satır = ürün, kolon = depo, hücre = o depodaki ADET.
   Rezerve / müsait kırılımı ekranda değil, Excel'in 'Detay'
   sayfasındadır (karar: A — pivot tek sayı gösterir).
   IMEI hiçbir sayfada yer almaz; rapor tamamen adet bazlıdır.
   ============================================================ */

window._donanimRapor = window._donanimRapor || null;

// Pivot veri kümesini kurar. Kaynak: depolar_v + stok_urunleri (depo_id dolu satırlar)
function _donanimRaporVeri(satirlar){
  const depolar = (window._donanimDepolar||[]).slice();
  const merkez  = _depoMerkez();

  const gruplar = {};
  satirlar.forEach(s=>{
    const k = s.malzeme_kodu || ('#'+s.urun_id);
    if(!gruplar[k]){
      gruplar[k] = {kod:k, ad:'', hucre:{}, satir:{}, toplam:0,
                    rezerve:0, onRezerve:0, tum_kcm:false, aktif:true};
    }
    const g = gruplar[k];
    g.hucre[s.depo_id] = (g.hucre[s.depo_id]||0) + (s.toplam_adet||0);
    g.satir[s.depo_id] = s;
    g.toplam    += (s.toplam_adet||0);
    g.rezerve   += (s.rezerve_adet||0);
    g.onRezerve += (s.on_rezerve_adet||0);
    if(merkez && s.depo_id === merkez.depo_id){
      g.tum_kcm = !!s.tum_kcm; g.aktif = !!s.aktif;
      if(s.aciklama) g.ad = s.aciklama;
    }
    if(!g.ad) g.ad = s.aciklama || '';
  });

  const liste = Object.values(gruplar)
    .sort((a,b)=> (a.ad||a.kod).localeCompare(b.ad||b.kod,'tr'));

  const depoToplam = {}, depoUrun = {};
  depolar.forEach(d=>{ depoToplam[d.depo_id]=0; depoUrun[d.depo_id]=0; });
  liste.forEach(g=>{
    depolar.forEach(d=>{
      const v = g.hucre[d.depo_id]||0;
      depoToplam[d.depo_id] += v;
      if(v>0) depoUrun[d.depo_id]++;
    });
  });

  return {depolar, liste, depoToplam, depoUrun, merkez,
          genelToplam: liste.reduce((t,g)=> t+g.toplam, 0)};
}

async function donanimRaporAc(){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const govde = document.getElementById('donanimRaporGovde');
  if(govde) govde.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  openModal('donanimRaporModal');
  try{
    await _donanimDepolarYukle(true);
    const satirlar = await _donanimDepoSatirlariYukle();
    window._donanimRapor = _donanimRaporVeri(satirlar);
    _donanimRaporRender();
  }catch(err){
    console.error(err);
    if(govde) govde.innerHTML = `<div style="padding:16px;color:var(--red);font-size:13px;">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

function _donanimRaporRender(){
  const R = window._donanimRapor;
  const govde = document.getElementById('donanimRaporGovde');
  if(!R || !govde) return;

  const bosGoster = !!document.getElementById('donanimRaporBosGoster')?.checked;
  const liste = bosGoster ? R.liste : R.liste.filter(g=> g.toplam > 0);

  if(!liste.length){
    govde.innerHTML = '<div style="padding:16px;color:var(--text2);font-size:13px;">Gösterilecek kayıt yok.</div>';
    return;
  }

  const hd = R.depolar.map(d=>
    `<th style="padding:6px 8px;text-align:center;white-space:nowrap;border-bottom:1px solid var(--border);font-size:11px;">${escapeHTML(_depoAd(d))}</th>`).join('');

  const govdeSatir = liste.map(g=>{
    const hucreler = R.depolar.map(d=>{
      const v = g.hucre[d.depo_id]||0;
      return `<td style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);${v?'':'color:var(--text3);'}">${v}</td>`;
    }).join('');
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid var(--border);min-width:200px;">
        <div style="font-size:12px;font-weight:600;">${escapeHTML(g.ad||g.kod)}</div>
        <div style="font-size:10px;color:var(--text3);">${escapeHTML(g.kod)}${g.tum_kcm?' · ortak':''}${g.aktif?'':' · pasif'}</div>
      </td>
      ${hucreler}
      <td style="padding:6px 8px;text-align:center;font-weight:800;border-bottom:1px solid var(--border);">${g.toplam}</td>
    </tr>`;
  }).join('');

  const altSatir = R.depolar.map(d=>
    `<td style="padding:8px;text-align:center;font-weight:800;">${R.depoToplam[d.depo_id]||0}</td>`).join('');

  govde.innerHTML = `
    <div style="font-size:12px;color:var(--text2);margin-bottom:8px;">
      ${liste.length} ürün · ${R.depolar.length} depo · toplam
      <b style="color:var(--text);">${R.genelToplam}</b> cihaz
    </div>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:var(--navy3);">
          <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border);font-size:11px;">Ürün</th>
          ${hd}
          <th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:11px;">TOPLAM</th>
        </tr></thead>
        <tbody>${govdeSatir}</tbody>
        <tfoot><tr style="background:var(--navy3);">
          <td style="padding:8px;font-weight:800;">TOPLAM</td>
          ${altSatir}
          <td style="padding:8px;text-align:center;font-weight:800;">${R.genelToplam}</td>
        </tr></tfoot>
      </table>
    </div>`;
}

function donanimRaporBosDegisti(){ _donanimRaporRender(); }

// 3 sayfalık .xlsx: Ozet (pivot) · Detay (kırılım) · Depo Ozet
function donanimRaporExcelIndir(){
  const R = window._donanimRapor;
  if(!R || !R.liste.length){ toast('İndirilecek rapor yok','error'); return; }
  const bosGoster = !!document.getElementById('donanimRaporBosGoster')?.checked;
  const liste = bosGoster ? R.liste : R.liste.filter(g=> g.toplam > 0);
  if(!liste.length){ toast('İndirilecek rapor yok','error'); return; }

  const depoAdlari = R.depolar.map(d=> _depoAd(d));

  // --- Sayfa 1: Ozet (pivot) ---
  const ozet = [['Ürün','Malzeme Kodu', ...depoAdlari, 'TOPLAM']];
  liste.forEach(g=>{
    ozet.push([ g.ad||g.kod, g.kod,
                ...R.depolar.map(d=> g.hucre[d.depo_id]||0),
                g.toplam ]);
  });
  ozet.push(['TOPLAM','', ...R.depolar.map(d=> R.depoToplam[d.depo_id]||0), R.genelToplam]);
  const wsOzet = XLSX.utils.aoa_to_sheet(ozet);
  wsOzet['!cols'] = [{wch:46},{wch:26}, ...depoAdlari.map(a=>({wch:Math.max(10, a.length+2)})), {wch:10}];

  // --- Sayfa 2: Detay ---
  const detay = [['Depo','KÇM','Depo Tipi','Ürün','Malzeme Kodu',
                  'Toplam','Rezerve','Ön Rezerve','Müsait','Ortak Stok','Aktif']];
  R.depolar.forEach(d=>{
    liste.forEach(g=>{
      const s = g.satir[d.depo_id];
      if(!s) return;
      const toplam = s.toplam_adet||0, rez = s.rezerve_adet||0, onRez = s.on_rezerve_adet||0;
      detay.push([ _depoAd(d), d.kcm_adi||'—', d.tip, g.ad||g.kod, g.kod,
                   toplam, rez, onRez, toplam-rez,
                   s.tum_kcm?'Evet':'Hayır', s.aktif?'Evet':'Hayır' ]);
    });
  });
  const wsDetay = XLSX.utils.aoa_to_sheet(detay);
  wsDetay['!cols'] = [{wch:26},{wch:20},{wch:10},{wch:46},{wch:26},
                      {wch:9},{wch:9},{wch:12},{wch:9},{wch:11},{wch:8}];

  // --- Sayfa 3: Depo Ozet ---
  const depoOzet = [['Depo','KÇM','Tip','Ürün Sayısı','Cihaz Sayısı']];
  R.depolar.forEach(d=>{
    depoOzet.push([ _depoAd(d), d.kcm_adi||'—', d.tip,
                    R.depoUrun[d.depo_id]||0, R.depoToplam[d.depo_id]||0 ]);
  });
  depoOzet.push(['TOPLAM','','', '', R.genelToplam]);
  const wsDepo = XLSX.utils.aoa_to_sheet(depoOzet);
  wsDepo['!cols'] = [{wch:26},{wch:20},{wch:8},{wch:13},{wch:14}];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOzet,  'Ozet');
  XLSX.utils.book_append_sheet(wb, wsDetay, 'Detay');
  XLSX.utils.book_append_sheet(wb, wsDepo,  'Depo Ozet');

  const tarih = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `depo_stok_raporu_${tarih}.xlsx`);
  toast('Rapor indirildi','success');
}

/* ============================================================
   DEPO ÇÖZÜMLEMESİ + TEDARİK TALEBİ (V31.57)
   ------------------------------------------------------------
   MY/FMY artık kendi KÇM'sinin ANA deposunu görür (kcm_id değil,
   depo_id bazlı kapsam). Stokta olmayan ürün "Sadece stokta olanlar"
   anahtarı kapatılınca listelenir ve TALEP EDİLEBİLİR.

   Talep kaydı: stok_tedarik_talepleri
     durum: 'Talep Edildi' -> 'Karşılandı' | 'Reddedildi'
     ncst ZORUNLU (müşteri seçimi), adet ZORUNLU (CHECK adet > 0)
   IMEI bu akışın hiçbir yerinde görünmez.
   ============================================================ */

window._donanimDepoCache = window._donanimDepoCache || null;
window._donanimTalep     = window._donanimTalep     || null;

// depolar_v -> {merkez: depo_id, kcm: {kcm_id: depo_id}} (yalnız ANA depolar)
async function _donanimDepoHaritasi(){
  if(window._donanimDepoCache) return window._donanimDepoCache;
  const {data,error} = await sb.from('depolar_v').select('depo_id,kcm_id,tip,aktif').eq('aktif',true);
  if(error){ console.error('[donanim] depolar_v okunamadı:', error.message); return {merkez:null, kcm:{}}; }
  const harita = {merkez:null, kcm:{}};
  (data||[]).forEach(d=>{
    if(d.tip !== 'ANA') return;
    if(d.kcm_id === null) harita.merkez = d.depo_id;
    else harita.kcm[d.kcm_id] = d.depo_id;
  });
  window._donanimDepoCache = harita;
  return harita;
}
async function _donanimAnaDepoId(kcmId){
  if(!kcmId) return null;
  const h = await _donanimDepoHaritasi();
  return h.kcm[kcmId] || null;
}
async function _donanimMerkezDepoId(){
  const h = await _donanimDepoHaritasi();
  return h.merkez || null;
}

/* ---- Talep modalı ---- */

function donanimTalepModalAc(urunId){
  if(!hasPerm('donanim_on_rezerve_et')){ toast('Yetkiniz yok','error'); return; }
  const u = (window._donanimList||[]).find(x=> x.urun_id === urunId);
  if(!u){ toast('Ürün bulunamadı','error'); return; }
  window._donanimTalep = {
    urun_id: urunId,
    ad: u.aciklama || u.malzeme_kodu || 'İsimsiz ürün',
    kod: u.malzeme_kodu || '',
    musteri: null
  };
  const setEl = (id, val)=>{ const e=document.getElementById(id); if(e) e.value = val; };
  const bas = document.getElementById('donanimTalepUrun');
  if(bas) bas.textContent = window._donanimTalep.ad;
  setEl('donanimTalepAdet', 1);
  setEl('donanimTalepNot', '');
  setEl('donanimTalepMusteriArama', '');
  const son = document.getElementById('donanimTalepMusteriSonuc'); if(son) son.innerHTML = '';
  const sec = document.getElementById('donanimTalepMusteriSecili'); if(sec) sec.classList.add('hide');
  openModal('donanimTalepModal');
}

let _donanimTalepAraTimer = null;
function donanimTalepMusteriAramaDebounce(){
  clearTimeout(_donanimTalepAraTimer);
  _donanimTalepAraTimer = setTimeout(_donanimTalepMusteriAra, 300);
}

async function _donanimTalepMusteriAra(){
  const terim = (document.getElementById('donanimTalepMusteriArama')?.value||'').trim();
  const sonucEl = document.getElementById('donanimTalepMusteriSonuc');
  if(!sonucEl) return;
  if(terim.length < 2){ sonucEl.innerHTML=''; return; }
  let q = getCustomerBaseQuery(true); // forForm=true: KÇM kapsamı, portföy dışına da erişim
  q = q.or(`unvan.ilike.%${terim}%,ncst.ilike.%${terim}%`).limit(8);
  const {data,error} = await q;
  if(error){ sonucEl.innerHTML = `<div style="font-size:12px;color:var(--red);padding:6px;">Hata: ${escapeHTML(error.message)}</div>`; return; }
  sonucEl.innerHTML = (data||[]).map(c=>`
    <div class="visit-card" style="padding:8px;margin-bottom:4px;cursor:pointer;" onclick='donanimTalepMusteriSec(${JSON.stringify(c)})'>
      <div style="font-size:13px;font-weight:700;">${escapeHTML(c.unvan||c.ncst)}</div>
      <div style="font-size:11px;color:var(--text3);">NCST: ${escapeHTML(c.ncst)}</div>
    </div>`).join('') || '<div style="font-size:12px;color:var(--text3);padding:6px;">Sonuç yok</div>';
}

function donanimTalepMusteriSec(c){
  if(!window._donanimTalep) return;
  window._donanimTalep.musteri = c;
  const son = document.getElementById('donanimTalepMusteriSonuc'); if(son) son.innerHTML='';
  const ara = document.getElementById('donanimTalepMusteriArama'); if(ara) ara.value='';
  const el = document.getElementById('donanimTalepMusteriSecili');
  if(el){
    el.classList.remove('hide');
    el.innerHTML = `✓ <b>${escapeHTML(c.unvan||c.ncst)}</b> (NCST: ${escapeHTML(c.ncst)}) <a href="#" onclick="event.preventDefault();donanimTalepMusteriTemizle()" style="color:var(--red);margin-left:8px;">✕</a>`;
  }
}

function donanimTalepMusteriTemizle(){
  if(window._donanimTalep) window._donanimTalep.musteri = null;
  const el = document.getElementById('donanimTalepMusteriSecili');
  if(el) el.classList.add('hide');
}

async function donanimTalepGonder(){
  const T = window._donanimTalep;
  if(!T){ toast('Talep bilgisi kayboldu, tekrar deneyin','error'); return; }
  if(!hasPerm('donanim_on_rezerve_et')){ toast('Yetkiniz yok','error'); return; }
  if(!T.musteri){ toast('Müşteri seçin (zorunlu)','error'); return; }
  const adet = parseInt(document.getElementById('donanimTalepAdet')?.value);
  if(!adet || adet < 1){ toast('Geçerli adet girin','error'); return; }
  const not = (document.getElementById('donanimTalepNot')?.value||'').trim();

  const btn = document.getElementById('donanimTalepGonderBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Gönderiliyor...'; }

  const {error} = await sb.from('stok_tedarik_talepleri').insert({
    urun_id: T.urun_id,
    kcm_id: currentUser.kcm_id || null,
    talep_eden_id: currentUser.my_id,
    ncst: T.musteri.ncst,
    musteri_unvani: T.musteri.unvan || null,
    adet: adet,
    durum: 'Talep Edildi',
    aciklama: not || null
  });

  if(btn){ btn.disabled = false; btn.textContent = 'Talebi Gönder'; }
  if(error){ toast('Talep gönderilemedi: '+error.message,'error'); return; }

  const {error:logErr} = await sb.from('stok_hareketleri').insert({
    urun_id: T.urun_id,
    aksiyon: 'Tedarik Talebi',
    detay: `${adet} adet — ${T.ad} · ${T.musteri.unvan || T.musteri.ncst}`,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  });
  if(logErr) console.error('[donanim] talep log hatası:', logErr.message);

  toast('Tedarik talebi gönderildi','success');
  closeModal('donanimTalepModal');
  _donanimTalepBadge();
}

/* ---- Talep listesi ---- */

const DONANIM_TALEP_RENK = {
  'Talep Edildi': 'var(--amber)',
  'Karşılandı':   'var(--green)',
  'Reddedildi':   'var(--red)'
};

async function loadDonanimTalepListesi(){
  const listEl = document.getElementById('donanimTalepListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const yonet = hasPerm('donanim_yonet');
  try{
    let q = sb.from('stok_tedarik_talepleri').select('*')
              .order('created_at',{ascending:false}).limit(500);
    if(!yonet) q = q.eq('talep_eden_id', currentUser.my_id);
    const {data, error} = await q;
    if(error) throw new Error(error.message);
    const talepler = data||[];
    if(!talepler.length){
      listEl.innerHTML = '<div class="empty">Tedarik talebi yok.</div>';
      return;
    }

    // Ürün adları
    const urunIdler = [...new Set(talepler.map(t=>t.urun_id).filter(Boolean))];
    const urunMap = {};
    for(let i=0;i<urunIdler.length;i+=200){
      const {data:us} = await sb.from('stok_urunleri')
        .select('urun_id,aciklama,malzeme_kodu').in('urun_id', urunIdler.slice(i,i+200));
      (us||[]).forEach(u=>{ urunMap[u.urun_id]=u; });
    }
    // Kullanıcı adları
    const kisiIdler = [...new Set(talepler.flatMap(t=>[t.talep_eden_id,t.karsilayan_id]).filter(Boolean))];
    const kisiMap = {};
    for(let i=0;i<kisiIdler.length;i+=200){
      const {data:ks} = await sb.from('users')
        .select('my_id,ad_soyad').in('my_id', kisiIdler.slice(i,i+200));
      (ks||[]).forEach(k=>{ kisiMap[k.my_id]=k.ad_soyad; });
    }

    listEl.innerHTML = talepler.map(t=>{
      const u = urunMap[t.urun_id] || {};
      const ad = u.aciklama || u.malzeme_kodu || ('Ürün #'+t.urun_id);
      const renk = DONANIM_TALEP_RENK[t.durum] || 'var(--text3)';
      const acik = (t.durum === 'Talep Edildi');
      const tarih = (typeof fmtDate==='function' && t.created_at) ? fmtDate(t.created_at)
                    : (t.created_at ? String(t.created_at).slice(0,10) : '—');
      return `<div class="visit-card" style="margin-bottom:8px;border-left:3px solid ${renk};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHTML(ad)}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:3px;">
              ${escapeHTML(t.musteri_unvani || t.ncst)} · NCST: ${escapeHTML(t.ncst)}
            </div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${renk};white-space:nowrap;">${escapeHTML(t.durum)}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:6px;">
          <b style="color:var(--text);">${t.adet}</b> adet ·
          ${escapeHTML(kisiMap[t.talep_eden_id] || ('MY#'+t.talep_eden_id))} · ${escapeHTML(tarih)}
          ${t.karsilayan_id?` · karşılayan: ${escapeHTML(kisiMap[t.karsilayan_id]||('#'+t.karsilayan_id))}`:''}
        </div>
        ${t.aciklama?`<div style="font-size:12px;color:var(--text2);margin-top:4px;">Not: ${escapeHTML(t.aciklama)}</div>`:''}
        ${(yonet && acik)?`
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="donanimTalepDurum(${t.talep_id},'Karşılandı')">✓ Karşılandı</button>
          <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="donanimTalepDurum(${t.talep_id},'Reddedildi')">✕ Reddet</button>
        </div>`:''}
      </div>`;
    }).join('');
  }catch(err){
    console.error(err);
    listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

async function donanimTalepDurum(talepId, yeniDurum){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const yama = {durum: yeniDurum, updated_at: new Date().toISOString()};
  if(yeniDurum === 'Karşılandı' || yeniDurum === 'Reddedildi'){
    yama.karsilayan_id = currentUser.my_id;
    yama.karsilanma_tarihi = new Date().toISOString();
  }
  const {error} = await sb.from('stok_tedarik_talepleri').update(yama).eq('talep_id', talepId);
  if(error){ toast('Güncellenemedi: '+error.message,'error'); return; }
  toast('Talep durumu: '+yeniDurum,'success');
  loadDonanimTalepListesi();
  _donanimTalepBadge();
}

// Talepler sekmesindeki bekleyen sayısı (yalnız karşılayan rolde anlamlı)
async function _donanimTalepBadge(){
  const btn = document.getElementById('donanimTabTalepBtn');
  if(!btn) return;
  const temel = '📥 Talepler';
  if(!hasPerm('donanim_yonet')){ btn.textContent = temel; return; }
  const {count, error} = await sb.from('stok_tedarik_talepleri')
    .select('*',{count:'exact',head:true}).eq('durum','Talep Edildi');
  if(error){ btn.textContent = temel; return; }
  btn.textContent = (count||0) > 0 ? `${temel} (${count})` : temel;
}
