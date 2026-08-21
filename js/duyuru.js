// ============================================================
// duyuru.js — v1.0.0
// Son güncelleme: 2026-08-20
// Değişiklikler:
//   v1.0.0 (V31.33) — İLK VERSİYON. Duyurular modülü canlandırıldı.
//     Fırsat (opportunities) Beyan veya Evrak adımına her geçtiğinde
//     (js/firsat.js saveOpp() → _duyuruFeedEkle çağrısı) duyuru_feed
//     tablosuna bir satır düşer. Bu ekran o akışı listeler:
//       • En yeni en üstte (olusturma_tarihi DESC)
//       • Beyan = mor, Evrak = mavi renk ile ayrışır
//       • Karta tıklayınca openEditOppModal(opp_id) ile fırsatın GÜNCEL
//         detayı açılır (js/firsat.js, zaten var olan fonksiyon)
//       • Görünürlük Fırsat modülüyle BİREBİR AYNI — applyRBAC(q), ek
//         yetki/scope YOK (Rol & Yetki ekranındaki mevcut kapsamı kullanır)
//       • Kullanıcı bazlı okundu takibi: duyuru_okundu tablosu. Sayfa
//         açılıp liste render edildiğinde o an ekrandaki kayıtlar okundu
//         sayılır (upsert). Ana menüdeki "Duyurular" kutusu üzerindeki
//         kırmızı rozet, okunmamış sayısını gösterir — girişte
//         (auth.js:initApp → _duyuruBadgeGuncelle) ve yeni duyuru
//         eklendiğinde (bu dosya) otomatik güncellenir.
//     DB migration gerekiyor: duyuru_feed + duyuru_okundu tabloları
//     (bkz. 03_DUYURU_MODULU.sql). RLS açık, USING(true)/WITH CHECK(true)
//     politikalarıyla (mevcut tasks/task_types deseniyle aynı disiplin —
//     bkz. GUVENLIK-EYLEM-PLANI, "advisory kapatan ama uygulamayı
//     kırmayan" Faz 0 yaklaşımı). Kapsam/erişim kısıtı DB'de değil,
//     bugünkü tüm modüllerde olduğu gibi uygulama katmanında (applyRBAC).
// ============================================================

const DUYURU = { items: [], okunanSet: new Set(), yukleniyor: false };

// ============================================================
// LİSTE — Duyurular sayfası açıldığında (navTo → utils.js) çağrılır
// ============================================================
async function loadDuyurular(){
  const list = document.getElementById('duyuruListesi');
  if(DUYURU.yukleniyor) return;
  DUYURU.yukleniyor = true;
  if(list) list.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try{
    let q = sb.from('duyuru_feed').select('*');
    q = applyRBAC(q); // Fırsat modülüyle BİREBİR AYNI kapsam — bkz. js/firsat.js applyRBAC(q) çağrıları
    const{data,error} = await q.order('olusturma_tarihi',{ascending:false}).limit(200);
    if(error) throw error;
    DUYURU.items = data||[];

    // Bu kullanıcının okuduğu kayıtları çek
    const ids = DUYURU.items.map(x=>x.duyuru_id);
    let okunanIds = [];
    if(ids.length){
      const{data:okunan} = await sb.from('duyuru_okundu').select('duyuru_id').eq('user_id',currentUser.my_id).in('duyuru_id',ids);
      okunanIds = (okunan||[]).map(o=>o.duyuru_id);
    }
    DUYURU.okunanSet = new Set(okunanIds);

    renderDuyuruListesi();
    _duyuruTumunuOkunduIsaretle(); // ekrana geldi = okundu
  }catch(e){
    console.error('loadDuyurular hatası:', e);
    if(list) list.innerHTML = '<div class="empty" style="color:var(--red);">Duyurular yüklenemedi: '+(e.message||'Bilinmeyen hata')+'</div>';
  }finally{
    DUYURU.yukleniyor = false;
  }
}

function renderDuyuruListesi(){
  const list = document.getElementById('duyuruListesi');
  if(!list) return;
  if(!DUYURU.items.length){ list.innerHTML = '<div class="empty">Henüz duyuru yok. Bir fırsat Beyan veya Evrak adımına geçtiğinde burada görünecek.</div>'; return; }
  list.innerHTML = DUYURU.items.map(d=>{
    const beyan = d.adim==='Beyan';
    const renk = beyan ? 'var(--purple)' : 'rgba(77,159,255,.85)';
    const bg   = beyan ? 'rgba(168,85,247,.08)' : 'rgba(77,159,255,.08)';
    const emoji = beyan ? '📋' : '📄';
    const okunmadi = !DUYURU.okunanSet.has(d.duyuru_id);
    return `<div class="pipeline-card" style="border-left:3px solid ${renk};background:${bg};position:relative;" onclick="openEditOppModal(${d.opp_id})">
      ${okunmadi?'<span style="position:absolute;top:12px;right:12px;width:8px;height:8px;border-radius:50%;background:var(--red);"></span>':''}
      <div class="pipeline-header">
        <div>
          <div class="pipeline-firm">${escapeHTML(d.unvan||d.ncst||'—')}</div>
          <div class="pipeline-meta">NCST: ${escapeHTML(String(d.ncst||'—'))} | ${fmtDateTime(d.olusturma_tarihi)}</div>
        </div>
        <span class="tag" style="background:${bg};color:${renk};font-weight:800;white-space:nowrap;">${emoji} ${escapeHTML(d.adim)}</span>
      </div>
      <div style="font-size:12px;color:var(--text2);margin:2px 0 4px;">👤 ${escapeHTML(d.my_adi||'—')}</div>
      <div style="font-size:12px;font-weight:700;color:var(--text);">📦 ${escapeHTML(d.urun_ozeti||'—')}</div>
      ${d.toplam_tutar?`<div style="font-size:14px;font-weight:800;color:var(--green);margin-top:4px;">${fmtTL(d.toplam_tutar)}</div>`:''}
      ${d.not_metni?`<div style="font-size:11px;color:var(--text2);margin-top:5px;">📝 ${escapeHTML(d.not_metni)}</div>`:''}
    </div>`;
  }).join('');
}

// Ekrandaki (o an yüklü) kayıtları bu kullanıcı için okundu işaretle
async function _duyuruTumunuOkunduIsaretle(){
  const okunmamis = DUYURU.items.filter(d=>!DUYURU.okunanSet.has(d.duyuru_id));
  if(!okunmamis.length) return;
  const rows = okunmamis.map(d=>({duyuru_id:d.duyuru_id, user_id:currentUser.my_id}));
  try{
    const{error} = await sb.from('duyuru_okundu').upsert(rows,{onConflict:'duyuru_id,user_id'});
    if(error) throw error;
    okunmamis.forEach(d=>DUYURU.okunanSet.add(d.duyuru_id));
    renderDuyuruListesi(); // kırmızı noktaları kaldır
    _duyuruBadgeGuncelle();
  }catch(e){ console.warn('_duyuruTumunuOkunduIsaretle:', e.message||e); }
}

// ============================================================
// EKLEME — js/firsat.js saveOpp() içinden çağrılır (adım Beyan/Evrak'a geçince)
// ============================================================
async function _duyuruFeedEkle(d){
  try{
    const{error} = await sb.from('duyuru_feed').insert({
      opp_id: d.oppId,
      adim: d.adim,
      ncst: d.ncst,
      unvan: d.unvan,
      my_id: d.myId,
      my_adi: d.myAdi,
      kcm_id: d.kcmId,
      urun_ozeti: d.urunOzeti,
      toplam_tutar: d.toplamTutar,
      not_metni: d.not
    });
    if(error) throw error;
    // Kendi ekranındaysa rozeti anlık güncelle (diğer kullanıcılar bir sonraki
    // girişte veya sayfa yenilemede görecek — realtime kapsam dışı, V31.33)
    if(typeof _duyuruBadgeGuncelle==='function') _duyuruBadgeGuncelle();
  }catch(e){
    // Duyuru kaydı fırsatın kendisini asla bloklamamalı — sessiz uyarı yeterli
    console.warn('_duyuruFeedEkle hatası:', e.message||e);
  }
}

// ============================================================
// BADGE — ana menüdeki "Duyurular" kutusunda okunmamış sayısı
// (js/auth.js initApp'te girişte, ve _duyuruFeedEkle'de yeni kayıt sonrası çağrılır)
// ============================================================
async function _duyuruBadgeGuncelle(){
  const badge = document.getElementById('duyuruMenuBadge');
  if(!badge) return;
  const mid = currentUser?.my_id;
  if(!mid){ badge.style.display='none'; return; }
  try{
    let q = sb.from('duyuru_feed').select('duyuru_id');
    q = applyRBAC(q);
    const{data,error} = await q.order('olusturma_tarihi',{ascending:false}).limit(200);
    if(error) throw error;
    const ids = (data||[]).map(r=>r.duyuru_id);
    if(!ids.length){ badge.style.display='none'; return; }
    const{data:okunan,error:e2} = await sb.from('duyuru_okundu').select('duyuru_id').eq('user_id',mid).in('duyuru_id',ids);
    if(e2) throw e2;
    const okunanSet = new Set((okunan||[]).map(o=>o.duyuru_id));
    const sayi = ids.filter(id=>!okunanSet.has(id)).length;
    badge.textContent = sayi>99 ? '99+' : (sayi || '');
    badge.style.display = sayi>0 ? 'inline-flex' : 'none';
  }catch(e){ console.warn('_duyuruBadgeGuncelle:', e.message||e); }
}