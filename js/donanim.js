// ============================================================
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
  window._donanimSepet = {};
  window._donanimSecimModu = false;
  _donanimSepetBarGuncelle();

  await _loadDonanimKcmFiltre();
  await loadDonanimListesi();
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
async function loadDonanimListesi(){
  const listEl = document.getElementById('donanimListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  let q = sb.from('stok_musait').select('*').order('marka').order('model');

  const scope = getScope('donanim');
  if(scope === 'KÇM' && currentUser.kcm_id){
    // v30.89: tum_kcm=true ürünler KÇM'den bağımsız her yerde görünür
    q = q.or(`kcm_id.eq.${currentUser.kcm_id},tum_kcm.eq.true`);
  } else if(scope === 'TÜM'){
    const kcmFiltre = document.getElementById('donanimKcmFiltre')?.value;
    if(kcmFiltre) q = q.or(`kcm_id.eq.${kcmFiltre},tum_kcm.eq.true`);
  }

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
  window._donanimList = data||[];
  _renderDonanimListesi(window._donanimList);
}

function _renderDonanimListesi(list){
  const listEl = document.getElementById('donanimListesi');
  if(!listEl) return;
  if(!list.length){
    listEl.innerHTML = '<div class="empty">Kayıtlı ürün bulunamadı. Excel ile stok yükleyin.</div>';
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
    const kcmAd = kcmAdMap[u.kcm_id] || ('KÇM#'+u.kcm_id);
    const baslik = u.aciklama || [u.marka,u.model,u.renk,u.gb_hafiza].filter(Boolean).join(' ') || 'İsimsiz ürün';
    return `<div class="visit-card" style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHTML(baslik)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px;">${escapeHTML(kcmAd)}${u.depo_adi?' · '+escapeHTML(u.depo_adi):''}${u.malzeme_kodu?' · Kod: '+escapeHTML(u.malzeme_kodu):''}</div>
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
   EXCEL İLE STOK YÜKLEME (v30.85)
   ------------------------------------------------------------
   ERP formatı: Ambar Adı | Barkod No | Malzeme Kodu | Malzeme
   Açıklaması | Seri No | Ana Birim | Fiili Stok | Gerçek Stok
   Sadece Malzeme Kodu + Malzeme Açıklaması + Seri No kullanılır.
   KÇM/Depo kullanıcı tarafından ÖNCEDEN seçilir (dosyadan gelmez).
   ============================================================ */

async function openDonanimExcelYukle(){
  const sel = document.getElementById('donanimExcelKcm');
  if(sel && sel.options.length<=1){
    const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
    sel.innerHTML = '<option value="">Seçiniz...</option>' +
      (data||[]).map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
  }
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

async function donanimExcelIsle(){
  const kcmId = document.getElementById('donanimExcelKcm').value;
  const depoAdi = document.getElementById('donanimExcelDepoAdi').value.trim() || ''; // v30.86: null değil boş string
  const dosya = document.getElementById('donanimExcelDosya').files[0];
  if(!kcmId){ toast('KÇM seçin','error'); return; }
  if(!dosya){ toast('Excel dosyası seçin','error'); return; }

  document.getElementById('donanimExcelAdim1').classList.add('hide');
  document.getElementById('donanimExcelAdim2').classList.remove('hide');
  document.getElementById('donanimExcelIlerleme').classList.remove('hide');
  document.getElementById('donanimExcelSonuc').classList.add('hide');
  const ilerlemeEl = document.getElementById('donanimExcelIlerlemeMetin');

  try{
    ilerlemeEl.textContent = 'Excel okunuyor...';
    const rows = await _donanimExcelOku(dosya);
    if(!rows.length){ toast('Excel boş görünüyor','error'); openDonanimExcelYukle(); return; }

    const kOf = (row, ...adaylar)=>{ for(const a of adaylar){ if(row[a]!==undefined) return row[a]; } return ''; };
    const satirlar = rows.map(r=>({
      seri_no: String(kOf(r,'Seri No','SERİ NO','Seri no')).trim(),
      malzeme_kodu: String(kOf(r,'Malzeme Kodu','MALZEME KODU')).trim(),
      aciklama: String(kOf(r,'Malzeme Acıklaması','Malzeme Açıklaması','MALZEME ACIKLAMASI','MALZEME AÇIKLAMASI','Malzeme Aciklamasi')).trim()
    })).filter(r=>r.seri_no);

    ilerlemeEl.textContent = `${satirlar.length} satır bulundu. Mevcut stok kontrol ediliyor...`;

    // 1) Excel'deki tüm seri no'ları DB'de ara
    const tumSeriNo = satirlar.map(s=>s.seri_no);
    const mevcutSeriMap = {};
    const CHUNK=500;
    for(let i=0;i<tumSeriNo.length;i+=CHUNK){
      const parca = tumSeriNo.slice(i,i+CHUNK);
      const {data, error} = await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id').in('seri_no',parca);
      if(error) throw new Error('Mevcut stok kontrolünde hata: '+error.message);
      (data||[]).forEach(d=>{ mevcutSeriMap[d.seri_no]=d; });
      ilerlemeEl.textContent = `Mevcut stok kontrol ediliyor... (${Math.min(i+CHUNK,tumSeriNo.length)}/${tumSeriNo.length})`;
    }

    const urunIdleri=[...new Set(Object.values(mevcutSeriMap).map(x=>x.urun_id))];
    const urunMalzemeMap={};
    if(urunIdleri.length){
      const {data,error} = await sb.from('stok_urunleri').select('urun_id,malzeme_kodu').in('urun_id',urunIdleri);
      if(error) throw new Error('Ürün bilgisi çekilirken hata: '+error.message);
      (data||[]).forEach(d=>{ urunMalzemeMap[d.urun_id]=d.malzeme_kodu; });
    }

    ilerlemeEl.textContent = 'Ürün grupları hazırlanıyor...';
    const {data:mevcutUrunler, error:muErr} = await sb.from('stok_urunleri')
      .select('urun_id,malzeme_kodu,toplam_adet').eq('kcm_id',kcmId).eq('depo_adi',depoAdi);
    if(muErr) throw new Error('Mevcut ürünler çekilirken hata: '+muErr.message);
    const urunMap = {};
    (mevcutUrunler||[]).forEach(u=>{ if(u.malzeme_kodu) urunMap[u.malzeme_kodu]=u; });

    // 2) Satır satır sınıflandır — bu SADECE bir ÖN-DEĞERLENDİRME, nihai rapor
    //    gerçek DB yazma sonuçlarına göre AŞAĞIDA yeniden kurulacak (v30.86 fix).
    const yeniSeriNolar = [];
    const yeniUrunGerekli = {};
    const zatenMevcut = []; // {seri_no, aciklama}
    const celiskiler = []; // {seri_no, aciklama, mevcutKod}

    satirlar.forEach(satir=>{
      const eski = mevcutSeriMap[satir.seri_no];
      if(!eski){
        if(!urunMap[satir.malzeme_kodu] && !yeniUrunGerekli[satir.malzeme_kodu]){
          yeniUrunGerekli[satir.malzeme_kodu] = {aciklama:satir.aciklama, adet:0};
        }
        if(yeniUrunGerekli[satir.malzeme_kodu]) yeniUrunGerekli[satir.malzeme_kodu].adet++;
        yeniSeriNolar.push(satir);
      } else {
        const mevcutMalzemeKodu = urunMalzemeMap[eski.urun_id];
        if(mevcutMalzemeKodu === satir.malzeme_kodu){
          zatenMevcut.push(satir);
        } else {
          celiskiler.push({...satir, mevcutKod:mevcutMalzemeKodu});
        }
      }
    });

    // 3) Yeni ürün gruplarını oluştur — HATA VARSA o malzeme_kodu'na ait TÜM
    //    satırlar HATA olarak işaretlenecek (sessizce atlanmayacak, v30.86 fix)
    ilerlemeEl.textContent = `${Object.keys(yeniUrunGerekli).length} yeni ürün grubu oluşturuluyor...`;
    const urunOlusturmaHatasi = {}; // malzeme_kodu -> hata mesajı
    for(const malzemeKodu of Object.keys(yeniUrunGerekli)){
      const bilgi = yeniUrunGerekli[malzemeKodu];
      const {data:yeniUrun, error:uErr} = await sb.from('stok_urunleri')
        .upsert({kcm_id:parseInt(kcmId), depo_adi:depoAdi, malzeme_kodu:malzemeKodu,
                 aciklama:bilgi.aciklama, toplam_adet:0, rezerve_adet:0, aktif:true},
                {onConflict:'kcm_id,depo_adi,malzeme_kodu'})
        .select('urun_id').single();
      if(uErr || !yeniUrun){
        urunOlusturmaHatasi[malzemeKodu] = uErr ? uErr.message : 'Bilinmeyen hata (ürün oluşturulamadı)';
      } else {
        urunMap[malzemeKodu] = {urun_id:yeniUrun.urun_id, toplam_adet:0};
      }
    }

    // 4) Yeni seri no kayıtlarını ekle — HER SATIR için gerçek insert sonucu izlenir
    ilerlemeEl.textContent = `Seri no kayıtları ekleniyor...`;
    const basariliEklenen = []; // {seri_no, aciklama}
    const eklemeHatasi = []; // {seri_no, aciklama, sebep}
    const eklenecekler = yeniSeriNolar.filter(s => !urunOlusturmaHatasi[s.malzeme_kodu]);
    // Ürün oluşturulamayanları hataya yaz
    yeniSeriNolar.filter(s => urunOlusturmaHatasi[s.malzeme_kodu]).forEach(s=>{
      eklemeHatasi.push({seri_no:s.seri_no, aciklama:s.aciklama, sebep:'Ürün grubu oluşturulamadı: '+urunOlusturmaHatasi[s.malzeme_kodu]});
    });

    for(let i=0;i<eklenecekler.length;i+=CHUNK){
      const parca = eklenecekler.slice(i,i+CHUNK);
      const payload = parca.map(s=>({ seri_no:s.seri_no, urun_id:urunMap[s.malzeme_kodu].urun_id, durum:'Depoda' }));
      const {data:insData, error:insErr} = await sb.from('stok_seri_no').insert(payload).select('seri_no');
      if(insErr){
        // Bu chunk'ın tamamı hata aldı — hepsini hataya yaz (sessizce atlanmaz)
        parca.forEach(s=> eklemeHatasi.push({seri_no:s.seri_no, aciklama:s.aciklama, sebep:'Kayıt hatası: '+insErr.message}));
      } else {
        const eklenenSeriler = new Set((insData||[]).map(d=>d.seri_no));
        parca.forEach(s=>{
          if(eklenenSeriler.has(s.seri_no)) basariliEklenen.push(s);
          else eklemeHatasi.push({seri_no:s.seri_no, aciklama:s.aciklama, sebep:'Kayıt doğrulanamadı (insert sonucu boş döndü)'});
        });
      }
      ilerlemeEl.textContent = `Seri no ekleniyor... (${Math.min(i+CHUNK,eklenecekler.length)}/${eklenecekler.length})`;
    }

    // 5) toplam_adet güncelle — SADECE gerçekten eklenen kayıtlar sayılır
    ilerlemeEl.textContent = 'Stok adetleri güncelleniyor...';
    const artisMap = {};
    basariliEklenen.forEach(s=>{ const uid=urunMap[s.malzeme_kodu].urun_id; artisMap[uid]=(artisMap[uid]||0)+1; });
    for(const urunId of Object.keys(artisMap)){
      const mevcut = Object.values(urunMap).find(u=>u.urun_id==urunId);
      const yeniToplam = (mevcut?.toplam_adet||0) + artisMap[urunId];
      const {error:updErr} = await sb.from('stok_urunleri').update({toplam_adet:yeniToplam, updated_at:new Date().toISOString()}).eq('urun_id',urunId);
      if(updErr) console.error('Adet güncelleme hatası (urun_id='+urunId+'):', updErr.message);
    }

    // 6) NİHAİ RAPOR — gerçek sonuçlara göre kurulur (v30.86: artık iyimser değil)
    const rapor = [];
    basariliEklenen.forEach(s=> rapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'✅ Yüklendi', aciklama:''}));
    zatenMevcut.forEach(s=> rapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Yüklenmedi', aciklama:'Zaten stokta mevcut'}));
    celiskiler.forEach(s=> rapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'❌ HATA', aciklama:`Bu seri no başka bir üründe kayıtlı (mevcut kod: ${s.mevcutKod||'?'})`}));
    eklemeHatasi.forEach(s=> rapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'❌ HATA', aciklama:s.sebep}));

    const yeniSayisi=basariliEklenen.length, mevcutSayisi=zatenMevcut.length, hataSayisi=celiskiler.length+eklemeHatasi.length;

    // 7) Timeline'a TEK özet log
    const {error:logErr} = await sb.from('stok_hareketleri').insert({
      aksiyon: 'Excel Stok Yükleme',
      detay: `${yeniSayisi} yeni, ${mevcutSayisi} zaten mevcut, ${hataSayisi} hata — Toplam ${satirlar.length} satır işlendi.`,
      user_id: currentUser.my_id,
      user_ad: currentUser.ad_soyad || String(currentUser.my_id)
    });
    if(logErr) console.error('Timeline log hatası:', logErr.message);

    // 8) Rapor ekranda göster
    window._donanimExcelRapor = rapor;
    document.getElementById('donanimExcelIlerleme').classList.add('hide');
    document.getElementById('donanimExcelSonuc').classList.remove('hide');
    document.getElementById('donanimExcelOzet').innerHTML =
      `✅ <span style="color:var(--green);">${yeniSayisi} yeni</span> · `+
      `⏭️ <span style="color:var(--text3);">${mevcutSayisi} mevcut</span> · `+
      `❌ <span style="color:var(--red);">${hataSayisi} hata</span> (Toplam ${satirlar.length} satır)`;
    document.getElementById('donanimExcelRaporTablo').innerHTML = rapor.map(r=>`<tr>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.seri_no)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.urun_adi)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${r.durum}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.aciklama)}</td>
    </tr>`).join('');

    if(hataSayisi>0) toast(`Yükleme tamamlandı ama ${hataSayisi} HATA var — raporu kontrol edin`,'error');
    else toast(`Yükleme tamamlandı: ${yeniSayisi} yeni kayıt`,'success');
    loadDonanimListesi();
  }catch(err){
    console.error(err);
    document.getElementById('donanimExcelIlerleme').classList.add('hide');
    toast('Hata: '+err.message,'error');
    alert('Yükleme durdu, hiçbir kayıt yazılmamış olabilir:\n\n'+err.message);
  }
}

// Rapor Excel olarak indirilir (SheetJS ile)
function donanimExcelRaporIndir(){
  const rapor = window._donanimExcelRapor||[];
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

// Sepeti gönderir: her ürün için ayrı rezervasyon satırı, ortak sepet_id, on_rezerve_adet artırılır
async function donanimSepetGonder(){
  const musteri = window._donanimSepetSeciliMusteri;
  const kendiMY = (currentUser.yetki_seviyesi==='MY' || currentUser.yetki_seviyesi==='FMY');
  const satanMyId = kendiMY ? currentUser.my_id : document.getElementById('donanimSepetSatanMy').value;
  const not = document.getElementById('donanimSepetNot').value.trim();
  if(!musteri){ toast('Müşteri seçin','error'); return; }
  if(!satanMyId){ toast('Cihazı satacak MY/FMY seçin','error'); return; }

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
      aciklama: not || null
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

// v30.96: 3 sekme — Stok / Rezervasyonlar / Transfer
function donanimTabGeç(hangi){
  const tabs = {
    stok:     {btn:'donanimTabStokBtn',     sekme:'donanimStokSekme'},
    rez:      {btn:'donanimTabRezBtn',      sekme:'donanimRezSekme'},
    transfer: {btn:'donanimTabTransferBtn', sekme:'donanimTransferSekme'}
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
    return `<div class="visit-card" style="margin-bottom:8px;">
      <div style="cursor:pointer;" onclick="openDonanimRezDetay('${r.sepet_id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:12px;color:var(--text3);">${escapeHTML(kcmMap[r.kcm_id]||'KÇM#'+r.kcm_id)} · ${escapeHTML(tlAd)} · <b>${escapeHTML(my?.ad_soyad||'MY#'+r.satan_my_id)}</b></div>
          <div style="width:26px;height:26px;border-radius:50%;background:${adim.renk};color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;">${adim.no}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span style="font-size:11px;color:${adim.renk};font-weight:700;">${escapeHTML(r.durum)}</span>
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
        <span style="flex:1;font-family:monospace;font-size:12px;">${escapeHTML(s.seri_no)}</span>
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
              satan_my_id:ilk.satan_my_id, rezerve_eden_id:ilk.rezerve_eden_id, durum:ilk.durum },
    kalemler: kalemler.map(k=>({ urun_id:k.urun_id, ad: adMap[k.urun_id]||('Cihaz #'+k.urun_id), adet:k.adet })),
    musaitMap: {}
  };

  document.getElementById('donanimRezDuzenleDurum').textContent =
    `Durum: ${ilk.durum}` + (ilk.durum==='Onaylandı' ? ' — adet artışı yalnız müsait stok varsa uygulanır' : ' — stok kilitlenmez');

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
        satan_my_id:st.sablon.satan_my_id, rezerve_eden_id:st.sablon.rezerve_eden_id, durum:st.sablon.durum
      });
      if(iErr){ toast('Hata: kalem eklenemedi: '+iErr.message,'error'); return; }
    }
  }
  const silUrun = orj.filter(o=>!yeniUrunSet.has(o.urun_id)).map(o=>o.urun_id);
  if(silUrun.length){ await sb.from('stok_rezervasyonlari').delete().eq('sepet_id',st.sepetId).in('urun_id',silUrun); }

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
    return `<tr>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;">${escapeHTML(urunMap[k.urun_id]?.aciklama||'—')}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:center;">${k.adet}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:right;">${Number(fiyat).toLocaleString('tr-TR')} ₺</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:right;font-weight:700;">${Number(satirToplam).toLocaleString('tr-TR')} ₺</td>
    </tr>`;
  }).join('');

  icerikEl.innerHTML = `
    <div style="margin-bottom:10px;font-size:13px;">
      <div><b>KÇM:</b> ${escapeHTML(kcmAd)}</div>
      <div><b>Takım Lideri:</b> ${escapeHTML(tlAd)}</div>
      <div><b>MY/FMY:</b> ${escapeHTML(myData?.ad_soyad||'—')}</div>
      <div style="margin-top:6px;"><span style="background:${adim.renk};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${adim.no}. ${escapeHTML(ilk.durum)}</span></div>
    </div>
    <div style="overflow:auto;border:1px solid var(--border);border-radius:8px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:var(--navy2);">
          <th style="padding:6px;text-align:left;font-size:10px;color:var(--text3);">ÜRÜN</th>
          <th style="padding:6px;font-size:10px;color:var(--text3);">ADET</th>
          <th style="padding:6px;text-align:right;font-size:10px;color:var(--text3);">BİRİM</th>
          <th style="padding:6px;text-align:right;font-size:10px;color:var(--text3);">TOPLAM</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
    </div>
    <div style="text-align:right;margin-top:10px;font-size:16px;font-weight:800;">Genel Toplam: ${Number(toplam).toLocaleString('tr-TR')} ₺</div>
    ${ilk.aciklama ? `<div style="margin-top:8px;font-size:12px;color:var(--text2);">Not: ${escapeHTML(ilk.aciklama)}</div>` : ''}
  `;
}
