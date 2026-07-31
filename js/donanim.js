// ============================================================
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
    q = q.eq('kcm_id', currentUser.kcm_id);
  } else if(scope === 'TÜM'){
    const kcmFiltre = document.getElementById('donanimKcmFiltre')?.value;
    if(kcmFiltre) q = q.eq('kcm_id', parseInt(kcmFiltre));
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
        ${!window._donanimSecimModu && canOnRezerve && musait>0 ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="donanimSecimModunuAc(${u.urun_id})">📌 Ön Rezerve Et</button>` : ''}
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
function openDonanimTimeline(urunId){ toast('Geçmiş görünümü — bir sonraki adımda eklenecek','info'); }

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

  const satanSel = document.getElementById('donanimSepetSatanMy');
  if(satanSel.options.length<=1){
    const {data} = await sb.from('users').select('my_id,ad_soyad,yetki_seviyesi')
      .in('yetki_seviyesi',['MY','FMY']).eq('aktif',true).order('ad_soyad');
    satanSel.innerHTML = '<option value="">Seçiniz...</option>' +
      (data||[]).map(u=>`<option value="${u.my_id}">${escapeHTML(u.ad_soyad)} (${u.yetki_seviyesi})</option>`).join('');
  }
  // Kendisi MY/FMY ise varsayılan olarak kendini seçili getir
  if(currentUser.yetki_seviyesi==='MY' || currentUser.yetki_seviyesi==='FMY'){
    satanSel.value = String(currentUser.my_id);
  }

  openModal('donanimSepetModal');
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
  const satanMyId = document.getElementById('donanimSepetSatanMy').value;
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
  await sb.from('stok_hareketleri').insert({
    aksiyon: 'Ön Rezervasyon Talebi',
    detay: `${sepetKeys.length} ürün, müşteri: ${musteri.unvan||musteri.ncst}, satan: MY#${satanMyId}`,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  });

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
