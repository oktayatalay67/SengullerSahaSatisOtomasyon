'use strict';
/* ===== ZİYARET SEÇENEKLERİ YÖNETİMİ ===== */
// ===== ZİYARET SEÇENEKLERİ YÖNETİMİ =====
let _zoptAktifTip = 'amac';

async function initZiyaretOpt(){
  zoptTipSec('amac', document.getElementById('zoptBtn_amac'));
}

async function zoptTipSec(tip, btn){
  _zoptAktifTip = tip;
  document.querySelectorAll('#adminTabZiyaretOpt .btn').forEach(b=>{
    b.style.borderColor=''; b.style.color=''; b.style.background='';
  });
  if(btn){ btn.style.borderColor='var(--blue)'; btn.style.color='var(--blue)'; btn.style.background='rgba(77,159,255,.1)'; }
  await zoptListeYukle();
}

async function zoptListeYukle(){
  const el = document.getElementById('zoptList');
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const {data,error} = await sb.from('visit_results')
    .select('*').eq('tip',_zoptAktifTip).order('sira');
  if(error){ el.innerHTML=`<div style="color:var(--red);">${escapeHTML(error.message)}</div>`; return; }
  if(!data?.length){ el.innerHTML='<div class="empty">Kayıt yok.</div>'; return; }

  el.innerHTML = data.map(r=>`
    <div draggable="true" data-id="${r.result_id}" data-sira="${r.sira}"
      style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:8px;cursor:grab;touch-action:none;"
      ondragstart="zoptDragStart(event,${r.result_id})"
      ondragover="zoptDragOver(event)"
      ondrop="zoptDrop(event,${r.result_id})"
      ondragend="zoptDragEnd(event)">
      <span style="color:var(--text3);font-size:16px;cursor:grab;">☰</span>
      <div style="flex:1;font-size:13px;${r.aktif?'':'opacity:0.4;text-decoration:line-through;'}">${escapeHTML(r.sonuc_adi)}</div>
      <div style="display:flex;gap:4px;">
        <button onclick="zoptDuzenle(${r.result_id},'${escapeHTML(r.sonuc_adi)}',${r.sira})" class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 8px;">✏️</button>
        <button onclick="zoptAktifToggle(${r.result_id},${!r.aktif})" class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 8px;${r.aktif?'color:var(--green);':'color:var(--text3);'}">${r.aktif?'✅':'⭕'}</button>
        <button onclick="zoptSil(${r.result_id})" class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 8px;color:var(--red);">🗑</button>
      </div>
    </div>`).join('');

  // Drag & drop event'leri
  _zoptDragOrder = data.map(r=>r.result_id);
}

let _zoptDragSrc = null;
let _zoptDragOrder = [];

function zoptDragStart(e, id){
  _zoptDragSrc = id;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.style.opacity = '0.4';
}

function zoptDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const el = document.getElementById('zoptList');
  el.querySelectorAll('[data-id]').forEach(row=>{
    row.style.borderTop = '';
  });
  e.currentTarget.style.borderTop = '2px solid var(--blue)';
}

function zoptDrop(e, targetId){
  e.preventDefault();
  if(_zoptDragSrc === targetId) return;
  // Sıralamayı güncelle
  const srcIdx = _zoptDragOrder.indexOf(_zoptDragSrc);
  const tgtIdx = _zoptDragOrder.indexOf(targetId);
  _zoptDragOrder.splice(srcIdx, 1);
  _zoptDragOrder.splice(tgtIdx, 0, _zoptDragSrc);
  zoptSiralamaKaydet();
}

function zoptDragEnd(e){
  e.currentTarget.style.opacity = '';
  document.getElementById('zoptList').querySelectorAll('[data-id]').forEach(row=>{
    row.style.borderTop = '';
  });
}

async function zoptSiralamaKaydet(){
  // Batch update: her satıra yeni sira değeri yaz
  const updates = _zoptDragOrder.map((id,i)=>
    sb.from('visit_results').update({sira:i+1}).eq('result_id',id)
  );
  await Promise.all(updates);
  await zoptListeYukle();
  await buildTemasUI();
  toast('Sıralama kaydedildi','success');
}

function zoptYeniEkle(){
  const ad = prompt('Yeni seçenek adı:','');
  if(!ad?.trim()) return;
  zoptKaydet(null, ad.trim());
}

function zoptDuzenle(id, mevcutAd, mevcutSira){
  const yeniAd = prompt('Seçenek adını düzenle:', mevcutAd);
  if(yeniAd===null) return;
  if(!yeniAd.trim()){ toast('Ad boş olamaz','error'); return; }
  zoptKaydet(id, yeniAd.trim(), mevcutSira);
}

async function zoptKaydet(id, ad, sira){
  const payload = {sonuc_adi:ad, tip:_zoptAktifTip, aktif:true};
  let error;
  if(id){
    const res = await sb.from('visit_results').update({sonuc_adi:ad}).eq('result_id',id);
    error = res.error;
  } else {
    // En yüksek sira + 1
    const {data:maxRow} = await sb.from('visit_results').select('sira').eq('tip',_zoptAktifTip).order('sira',{ascending:false}).limit(1);
    payload.sira = (maxRow?.[0]?.sira||0) + 1;
    const res = await sb.from('visit_results').insert(payload);
    error = res.error;
  }
  if(error){ toast('Hata: '+error.message,'error'); return; }
  toast(id?'Güncellendi':'Eklendi','success');
  await zoptListeYukle();
  await buildTemasUI(); // Temas formunu güncelle
}

async function zoptAktifToggle(id, yeniDurum){
  const {error} = await sb.from('visit_results').update({aktif:yeniDurum}).eq('result_id',id);
  if(error){ toast('Hata','error'); return; }
  await zoptListeYukle();
  await buildTemasUI();
}

async function zoptSil(id){
  if(!confirm('Bu seçeneği silmek istediğinize emin misiniz?')) return;
  const {error} = await sb.from('visit_results').delete().eq('result_id',id);
  if(error){ toast('Hata: '+error.message,'error'); return; }
  toast('Silindi','success');
  await zoptListeYukle();
  await buildTemasUI();
}


let _tdmTalepId = null;
let _tdmIsAdmin = false;
let _tdmDurum = null;

async function talepDetayAc(talepId, isAdminView){
  _tdmTalepId = talepId;
  _tdmIsAdmin = isAdminView;
  document.getElementById('tdmMesajInp').value = '';
  document.getElementById('tdmRedNot').value = '';

  // Talep bilgilerini çek
  const {data:t} = await sb.from('feedback_requests').select('*').eq('id',talepId).single();
  if(!t) return;
  _tdmDurum = t.durum;

  // Başlık ve bilgi
  const durumColor = TALEP_DURUM_COLORS[t.durum]||'var(--text2)';
  const tipIcon = TALEP_TIP_ICONS[t.tip]||'💬';
  document.getElementById('tdmBaslik').innerHTML =
    `${tipIcon} ${escapeHTML(t.tip||'')} <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:${durumColor}22;color:${durumColor};">${escapeHTML(t.durum||'')}</span>`;
  document.getElementById('tdmBilgi').innerHTML = `
    ${t.menu_alani?`<div style="font-size:11px;color:var(--text2);margin-bottom:4px;">📍 ${escapeHTML(t.menu_alani)}</div>`:''}
    <div style="font-size:13px;line-height:1.5;margin-bottom:4px;">${escapeHTML(t.aciklama||'')}</div>
    ${isAdminView?`<div style="font-size:11px;color:var(--text3);">👤 ${escapeHTML(t.user_ad||'')} · ${escapeHTML(t.kcm_adi||'')} · ${fmtDate(t.olusturma_tarihi)}</div>`:`<div style="font-size:11px;color:var(--text3);">${fmtDate(t.olusturma_tarihi)}</div>`}`;

  // Admin paneli
  const adminPanel = document.getElementById('tdmAdminPanel');
  const onayPanel = document.getElementById('tdmOnayPanel');
  adminPanel.style.display = isAdminView ? '' : 'none';
  onayPanel.style.display = (!isAdminView && t.durum==='Tamamlandı') ? '' : 'none';

  // Admin durum butonlarını aktif et
  if(isAdminView) tdmDurumBtnGuncelle(t.durum);

  // Mesajları yükle
  await tdmMesajlariYukle(talepId, isAdminView);

  // Okundu işaretle
  if(isAdminView && !t.okundu){
    await sb.from('feedback_requests').update({okundu:true, guncelleme_tarihi:new Date().toISOString()}).eq('id',talepId);
  } else if(!isAdminView && !t.kullanici_okundu){
    await sb.from('feedback_requests').update({kullanici_okundu:true, guncelleme_tarihi:new Date().toISOString()}).eq('id',talepId);
  }

  openModal('talepDetayModal');
}

async function tdmMesajlariYukle(talepId, isAdminView){
  const el = document.getElementById('tdmMesajlar');
  el.innerHTML = '<div style="font-size:11px;color:var(--text3);">Yükleniyor...</div>';
  const {data, error} = await sb.from('feedback_messages')
    .select('*').eq('talep_id', talepId)
    .order('olusturma_tarihi', {ascending: true});
  if(error){ el.innerHTML=`<div style="color:var(--red);font-size:12px;">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data?.length){ el.innerHTML='<div style="font-size:11px;color:var(--text3);text-align:center;padding:16px;">Henüz mesaj yok.</div>'; return; }
  el.innerHTML = data.map(m=>{
    const mAdmin = m.gonderen_rol==='admin';
    const bg = mAdmin ? 'var(--blue)' : 'var(--navy3)';
    const align = mAdmin ? 'flex-end' : 'flex-start';
    const color = mAdmin ? '#fff' : 'var(--text)';
    return `<div style="display:flex;justify-content:${align};margin-bottom:8px;">
      <div style="max-width:85%;background:${bg};color:${color};padding:8px 10px;border-radius:10px;font-size:12px;">
        <div style="font-weight:700;font-size:10px;margin-bottom:2px;opacity:0.8;">${escapeHTML(m.gonderen_ad)}</div>
        ${escapeHTML(m.mesaj)}
        <div style="font-size:9px;opacity:0.6;margin-top:3px;text-align:right;">${fmtDate(m.olusturma_tarihi)}</div>
      </div>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
  // Okunmamış karşı taraf mesajlarını okundu yap
  const karsiRol = isAdminView ? 'kullanici' : 'admin';
  const okunmamis = data.filter(m=>!m.okundu&&m.gonderen_rol===karsiRol).map(m=>m.id);
  if(okunmamis.length) await sb.from('feedback_messages').update({okundu:true}).in('id',okunmamis);
}

async function tdmMesajGonder(){
  // v30.08: _tdmTalepId null guard
  if(!_tdmTalepId){ toast('Talep ID bulunamadı','error'); return; }
  const inp = document.getElementById('tdmMesajInp');
  const mesaj = inp.value.trim();
  if(!mesaj){ toast('Mesaj boş olamaz','error'); return; }
  const rol = _tdmIsAdmin ? 'admin' : 'kullanici';
  const {error} = await sb.from('feedback_messages').insert({
    talep_id: _tdmTalepId,
    gonderen_id: currentUser.my_id,
    gonderen_ad: currentUser.ad_soyad,
    gonderen_rol: rol,
    mesaj, okundu: false
  });
  if(error){ toast('Gönderilemedi: '+error.message,'error'); return; }
  // Karşı taraf okundu flag sıfırla + guncelleme_tarihi güncelle
  const flag = rol==='admin'
    ? {kullanici_okundu:false, guncelleme_tarihi:new Date().toISOString()}
    : {okundu:false, guncelleme_tarihi:new Date().toISOString()};
  await sb.from('feedback_requests').update(flag).eq('id',_tdmTalepId);
  inp.value = '';
  await tdmMesajlariYukle(_tdmTalepId, _tdmIsAdmin);
}

function tdmDurumBtnGuncelle(durum){
  const btnMap = {
    'Beklemede':'tdmBtn_Beklemede','İnceleniyor':'tdmBtn_inceleniyor',
    'İş Listesinde':'tdmBtn_islistesinde','Tamamlandı':'tdmBtn_tamamlandi',
    'Reddedildi':'tdmBtn_reddedildi'
  };
  Object.entries(btnMap).forEach(([d,id])=>{
    const btn = document.getElementById(id);
    if(!btn) return;
    const active = d===durum;
    btn.style.borderColor = active ? 'var(--blue)' : '';
    btn.style.color = active ? 'var(--blue)' : '';
    btn.style.background = active ? 'rgba(77,159,255,.1)' : '';
  });
}

async function tdmDurumGuncelle(durum){
  const {error} = await sb.from('feedback_requests')
    .update({durum, okundu:false, kullanici_okundu:false}).eq('id',_tdmTalepId);
  if(error){ toast('Hata: '+error.message,'error'); return; }
  _tdmDurum = durum;
  // Modal başlığındaki durum badge'ini güncelle
  const durumColor = TALEP_DURUM_COLORS[durum]||'var(--text2)';
  const baslik = document.getElementById('tdmBaslik');
  const badge = baslik?.querySelector('span');
  if(badge){ badge.textContent=durum; badge.style.color=durumColor; badge.style.background=durumColor+'22'; }
  tdmDurumBtnGuncelle(durum);
  // Arka plandaki kartta durum badge'ini güncelle (sayfa başa gitmesin)
  const kartBadge = document.querySelector(`[onclick*="talepDetayAc(${_tdmTalepId},"] span[style*="border-radius"]`);
  if(kartBadge){ kartBadge.textContent=durum; kartBadge.style.color=durumColor; kartBadge.style.background=durumColor+'22'; }
  // Otomatik mesaj ekle
  await sb.from('feedback_messages').insert({
    talep_id:_tdmTalepId, gonderen_id:currentUser.my_id,
    gonderen_ad:currentUser.ad_soyad, gonderen_rol:'admin',
    mesaj:`📋 Durum: ${durum}`, okundu:false
  });
  await tdmMesajlariYukle(_tdmTalepId, true);
  toast('Durum güncellendi','success');
}

async function tdmKullaniciOnayla(){
  // v30.08: _tdmTalepId null guard
  if(!_tdmTalepId){ toast('Talep ID bulunamadı','error'); return; }
  const {error} = await sb.from('feedback_requests')
    .update({durum:'Kapatıldı', kullanici_okundu:true, okundu:false}).eq('id',_tdmTalepId);
  if(error){ toast('Hata','error'); return; }
  await sb.from('feedback_messages').insert({
    talep_id:_tdmTalepId, gonderen_id:currentUser.my_id,
    gonderen_ad:currentUser.ad_soyad, gonderen_rol:'kullanici',
    mesaj:'✅ Onaylandı — Talep kapatıldı.', okundu:false
  });
  toast('Talep kapatıldı ✅','success');
  closeModal('talepDetayModal');
  loadTaleplerim();
}

async function tdmKullaniciReddet(){
  // v30.08: _tdmTalepId null guard
  if(!_tdmTalepId){ toast('Talep ID bulunamadı','error'); return; }
  const not = document.getElementById('tdmRedNot').value.trim();
  if(!not){ toast('Lütfen açıklama girin','error'); return; }
  await sb.from('feedback_messages').insert({
    talep_id:_tdmTalepId, gonderen_id:currentUser.my_id,
    gonderen_ad:currentUser.ad_soyad, gonderen_rol:'kullanici',
    mesaj:'❌ Tamamlanmadı: '+not, okundu:false
  });
  await sb.from('feedback_requests')
    .update({durum:'Tekrar Açıldı', okundu:false, kullanici_okundu:true}).eq('id',_tdmTalepId);
  toast('Talep tekrar açıldı','success');
  closeModal('talepDetayModal');
  loadTaleplerim();
}



async function loadTalepMesajlar(talepId, containerId){
  const el = document.getElementById(containerId);
  if(!el) { console.warn('loadTalepMesajlar: container yok:', containerId); return; }
  el.innerHTML = '<div style="font-size:11px;color:var(--text3);">Yükleniyor...</div>';
  try{
    console.log('loadTalepMesajlar:', talepId, typeof talepId);
    const {data, error} = await sb.from('feedback_messages')
      .select('*').eq('talep_id', talepId)
      .order('olusturma_tarihi', {ascending: true});
    console.log('feedback_messages sonuç:', data?.length, error);
    if(error){ el.innerHTML=`<div style="font-size:11px;color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
    if(!data?.length){ el.innerHTML='<div style="font-size:11px;color:var(--text3);text-align:center;padding:8px;">Henüz mesaj yok.</div>'; return; }
    el.innerHTML = data.map(m=>{
      const mAdmin = m.gonderen_rol==='admin';
      const bg = mAdmin ? 'var(--blue)' : 'var(--navy3)';
      const align = mAdmin ? 'flex-end' : 'flex-start';
      const color = mAdmin ? '#fff' : 'var(--text)';
      return `<div style="display:flex;justify-content:${align};margin-bottom:6px;">
        <div style="max-width:85%;background:${bg};color:${color};padding:7px 10px;border-radius:10px;font-size:12px;">
          <div style="font-weight:700;font-size:10px;margin-bottom:2px;opacity:0.8;">${escapeHTML(m.gonderen_ad)}</div>
          ${escapeHTML(m.mesaj)}
          <div style="font-size:9px;opacity:0.6;margin-top:2px;text-align:right;">${fmtDate(m.olusturma_tarihi)}</div>
        </div>
      </div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;

    // Okunmamışları okundu yap — admin ise kullanıcı mesajlarını, kullanıcı ise admin mesajlarını okundu yap
    const benim_rol = isAdmin() ? 'admin' : 'kullanici';
    const karsi_rol = isAdmin() ? 'kullanici' : 'admin';
    const okunmamis = data.filter(m=>!m.okundu && m.gonderen_rol===karsi_rol).map(m=>m.id);
    if(okunmamis.length){
      await sb.from('feedback_messages').update({okundu:true}).in('id', okunmamis);
      if(isAdmin()){
        await sb.from('feedback_requests').update({okundu:true}).eq('id',talepId);
      } else {
        await sb.from('feedback_requests').update({kullanici_okundu:true}).eq('id',talepId);
      }
    }
  }catch(e){
    el.innerHTML=`<div style="font-size:11px;color:var(--red);">Hata: ${escapeHTML(e.message)}</div>`;
  }
}

async function talepMesajGonder(talepId, inputId, containerId, gonderenRol){
  // Önce aktif focused element'i kontrol et, sonra id ile bul
  let mesaj = '';
  const input = document.getElementById(inputId);
  if(input){
    mesaj = input.value.trim();
  } else {
    // Fallback: tüm textarea'ları tara
    const all = document.querySelectorAll(`textarea[id="${inputId}"]`);
    if(all.length) mesaj = all[all.length-1].value.trim();
  }
  if(!mesaj){ toast('Mesaj bo\u015f olamaz','error'); return; }
  const rol = gonderenRol || (isAdmin() ? 'admin' : 'kullanici');
  const {error} = await sb.from('feedback_messages').insert({
    talep_id: talepId,
    gonderen_id: currentUser.my_id,
    gonderen_ad: currentUser.ad_soyad,
    gonderen_rol: rol,
    mesaj,
    okundu: false
  });
  if(error){ toast('Mesaj g\u00f6nderilemedi: '+error.message,'error'); return; }
  if(rol==='admin'){
    await sb.from('feedback_requests').update({kullanici_okundu:false}).eq('id',talepId);
  } else {
    await sb.from('feedback_requests').update({okundu:false}).eq('id',talepId);
  }
  if(input) input.value = '';
  await loadTalepMesajlar(talepId, containerId);
}

async function talepKullaniciOnayla(talepId){
  const {error} = await sb.from('feedback_requests')
    .update({durum:'Kapatıldı', okundu:false, kullanici_okundu:true})
    .eq('id', talepId);
  if(error){ toast('Hata: '+error.message,'error'); return; }
  toast('Talep kapatıldı ✅','success');
  loadTaleplerim();
}

async function talepKullaniciReddet(talepId, inputId){
  const input = document.getElementById(inputId);
  const not = input?.value?.trim()||'';
  if(!not){ toast('Lütfen bir not girin','error'); return; }
  // Mesaj olarak gönder
  await sb.from('feedback_messages').insert({
    talep_id: talepId,
    gonderen_id: currentUser.my_id,
    gonderen_ad: currentUser.ad_soyad,
    gonderen_rol: 'kullanici',
    mesaj: '❌ Tamamlanmadı: ' + not,
    okundu: false
  });
  const {error} = await sb.from('feedback_requests')
    .update({durum:'Tekrar Açıldı', okundu:false, kullanici_okundu:true})
    .eq('id', talepId);
  if(error){ toast('Hata: '+error.message,'error'); return; }
  toast('Talep tekrar açıldı','success');
  loadTaleplerim();
}

async function talepMesajOkunmamisSayisi(){
  // Dashboard için okunmamış mesaj sayısı
  const {data} = await sb.from('feedback_requests')
    .select('id')
    .eq('user_id', currentUser.my_id)
    .eq('kullanici_okundu', false)
    .in('durum',['Tamamlandı','Tekrar Açıldı','İnceleniyor','İş Listesinde','Beklemede']);
  return data?.length||0;
}

async function adminTalepOkunmamisSayisi(){
  const {data} = await sb.from('feedback_requests')
    .select('id').eq('okundu', false)
    .not('durum','in','("Kapatıldı")');
  return data?.length||0;
}



/* ===== EVRAK ONAY AKIŞI ===== */
// ===== EVRAK ONAY AKIŞI =====
async function evrakOnayla(oppId){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  if(!['ADMIN','SATIŞ DESTEK','SATIŞ KOORDİNATÖRÜ'].includes(r)){
    toast('Bu işlem için Satış Destek yetkisi gereklidir','error');return;
  }
  // Fırsat bilgilerini çek
  const{data:opp}=await sb.from('opportunities').select('*').eq('opp_id',oppId).single();
  if(!opp){toast('Fırsat bulunamadı','error');return;}

  const girenId = opp.my_id;
  const sahibiId = opp.musteri_my_id;

  if(girenId===sahibiId||!sahibiId){
    // Giren = Hesap sahibi → otomatik hedefine işle
    if(!confirm('Satış onaylanacak ve hedeflere otomatik işlenecek. Devam?')) return;
    await sb.from('opportunities').update({
      adim:'Gerçekleşen', durum:'Gerçekleşen',
      onay_durumu:'Onaylandı', onay_my_id:girenId
    }).eq('opp_id',oppId);
    // sales_declarations'a otomatik kayıt
    await hedefeOtomatikIsle(opp, girenId);
    await addLog('opportunities',oppId,'Evrak Onaylandı','Satış gerçekleşti - hedeflere işlendi');
    toast('Satış onaylandı ve hedeflere işlendi ✅','success');
  } else {
    // Giren ≠ Hesap sahibi → Müdür + Takım Lideri onayına gönder
    if(!confirm('Fırsatı giren ve hesap sahibi farklı. Müdür ve Takım Liderine onay gönderilecek. Devam?')) return;
    await sb.from('opportunities').update({
      adim:'Gerçekleşen', durum:'Gerçekleşen',
      onay_durumu:'Müdür Onayı Bekleniyor'
    }).eq('opp_id',oppId);
    await addLog('opportunities',oppId,'Evrak Onaylandı','Müdür/Takım Lideri onayı bekleniyor - giren: '+
      (myIdToName[girenId]||girenId)+' / hesap sahibi: '+(myIdToName[sahibiId]||sahibiId));
    toast('Satış onaylandı - Müdür/Takım Liderine onay gönderildi','success');
  }
  closeModal('oppModal');
  loadPipeline();
}

async function hedefeOtomatikIsle(opp, myId){
  // Ürünleri çek
  const{data:urunler}=await sb.from('opportunity_products').select('*').eq('opp_id',opp.opp_id);
  if(!urunler?.length) return;
  const ay = new Date().toISOString().slice(0,7) + '-01'; // v30.04: date kolonu YYYY-MM-01 gerektirir
  for(const u of urunler){
    // target_id'yi ürün adından bul
    const{data:prod}=await sb.from('products').select('target_id').eq('urun_adi',u.urun_adi).single();
    if(!prod?.target_id) continue;
    // Mevcut beyan var mı
    const{data:mevcut}=await sb.from('sales_declarations')
      .select('*').eq('user_id',myId).eq('target_id',prod.target_id).eq('ay',ay).single();
    if(mevcut){
      await sb.from('sales_declarations').update({
        declared_value:(mevcut.declared_value||0)+(u.adet||u.tutar||0),
        durum:'Gerçekleşen', opp_id:opp.opp_id
      }).eq('decl_id',mevcut.decl_id);
    } else {
      await sb.from('sales_declarations').insert({
        user_id:myId, target_id:prod.target_id, ay,
        declared_value:u.adet||u.tutar||0,
        durum:'Gerçekleşen', opp_id:opp.opp_id
      });
    }
  }
}

// Müdür/Takım Lideri - kimin hedefine sayılacağını seçer
async function mudurOnayiVer(oppId, secilenMyId){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  if(!['ADMIN','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ KOORDİNATÖRÜ'].includes(r)){
    toast('Bu işlem için Müdür yetkisi gereklidir','error');return;
  }
  if(!confirm((myIdToName[secilenMyId]||secilenMyId)+' adlı kişinin hedefine sayılacak. Onayla?')) return;
  const{data:opp}=await sb.from('opportunities').select('*').eq('opp_id',oppId).single();
  if(!opp) return;
  await sb.from('opportunities').update({
    onay_durumu:'Onaylandı', onay_my_id:secilenMyId
  }).eq('opp_id',oppId);
  await hedefeOtomatikIsle(opp, secilenMyId);
  await addLog('opportunities',oppId,'Müdür Onayı','Hedef: '+(myIdToName[secilenMyId]||secilenMyId));
  toast('Onay verildi ve hedeflere işlendi ✅','success');
  closeModal('oppModal');
  loadPipeline();
}

// İptal başlat
async function iptalBaslat(oppId){
  if(!confirm('Bu satışı iptal etmek istiyor musunuz? İptal onayı Müdür/Takım Liderine gönderilecek.')) return;
  await sb.from('opportunities').update({
    iptal_onay_durumu:'Bekliyor'
  }).eq('opp_id',oppId);
  await addLog('opportunities',oppId,'İptal Talebi','Müdür/Takım Lideri onayı bekleniyor');
  toast('İptal talebi gönderildi','success');
  closeModal('oppModal');
  loadPipeline();
}

// Müdür/Takım Lideri iptal onayı
async function iptalOnayla(oppId){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  if(!['ADMIN','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ KOORDİNATÖRÜ'].includes(r)){
    toast('Bu işlem için Müdür yetkisi gereklidir','error');return;
  }
  if(!confirm('İptal onaylanacak. Devam?')) return;
  await sb.from('opportunities').update({
    adim:'İptal', durum:'İptal',
    iptal_onay_durumu:'Onaylandı'
  }).eq('opp_id',oppId);
  await addLog('opportunities',oppId,'İptal Onaylandı','');
  toast('İptal onaylandı','success');
  closeModal('oppModal');
  loadPipeline();
}

// İptal reddet
async function iptalReddet(oppId){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  if(!['ADMIN','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ KOORDİNATÖRÜ'].includes(r)){
    toast('Bu işlem için Müdür yetkisi gereklidir','error');return;
  }
  if(!confirm('İptal talebi reddedilecek. Devam?')) return;
  await sb.from('opportunities').update({iptal_onay_durumu:null}).eq('opp_id',oppId);
  await addLog('opportunities',oppId,'İptal Reddedildi','');
  toast('İptal talebi reddedildi','success');
  closeModal('oppModal');
  loadPipeline();
}

function isAdmin(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  return r==='ADMIN'||r==='SATIŞ KOORDİNATÖRÜ';
}


async function downloadPipelineExcel(){
  const rows=window._lastPrData;
  if(!rows?.length){toast('Önce raporu getirin','error');return;}
  const headers=['KÇM','MY','Müşteri','NCST','Adım','Beklenen Ciro','Ürünler','Açıklama','Tarih'];

  const BOM='\uFEFF';
  const lines=[headers,...rows].map(r=>r.map(csvCell).join(','));
  const blob=new Blob([BOM+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='Pipeline_Raporu_'+new Date().toLocaleDateString('tr-TR').replace(/[/.]/g,'-')+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast(rows.length+' kayıt indirildi','success');
}


let prMusteriTimer=null;
let prSecilenNcst='';

/* ===== ADMİN SİLME FONKSİYONLARI ===== */
// ===== ADMİN SİLME FONKSİYONLARI =====

async function adminSilOnayla(msg, silFn){
  if(!isAdmin()){toast('Bu işlem için admin yetkisi gerekli','error');return;}
  if(!confirm(msg+' Bu işlem geri alınamaz!')) return;
  await silFn();
}

async function deleteOpportunity(oppId){
  await adminSilOnayla('Fırsat silinecek.', async()=>{
    await sb.from('opportunity_products').delete().eq('opp_id',oppId);
    const{error}=await sb.from('opportunities').delete().eq('opp_id',oppId);
    if(error){toast('Silme hatası: '+error.message,'error');return;}
    closeModal('oppModal');
    toast('Fırsat silindi','success');
    loadPipeline();
  });
}

async function deleteVisit(visitId){
  await adminSilOnayla('Temas kaydı silinecek.', async()=>{
    await sb.from('opportunities').update({visit_id:null}).eq('visit_id',visitId);
    await sb.from('tasks').update({visit_id:null}).eq('visit_id',visitId);
    const{error}=await sb.from('visits').delete().eq('visit_id',visitId);
    if(error){toast('Silme hatası: '+error.message,'error');return;}
    closeModal('editVisitModal');
    toast('Temas silindi','success');
    renderTemasList();
  });
}

async function deleteContact(contactId){
  await adminSilOnayla('Kontak silinecek.', async()=>{
    const{error}=await sb.from('contacts').delete().eq('contact_id',contactId);
    if(error){toast('Silme hatası: '+error.message,'error');return;}
    toast('Kontak silindi','success');
    if(selectedMusteri) loadMusteriKontaklar(selectedMusteri.ncst);
  });
}

async function adminTalepSil(id){
  if(!confirm('Bu talebi ve tüm mesajlarını silmek istediğinize emin misiniz?')) return;
  await sb.from('feedback_messages').delete().eq('talep_id', id);
  const {error} = await sb.from('feedback_requests').delete().eq('id', id);
  if(error){ toast('Silme hatası: '+error.message,'error'); return; }
  toast('Talep silindi','success');
  const kart = document.querySelector(`[onclick*="talepDetayAc(${id},"]`);
  if(kart) kart.remove();
}

async function deleteFeedback(id){
  await adminSilOnayla('Talep silinecek.', async()=>{
    await sb.from('feedback_messages').delete().eq('talep_id',id);
    const{error}=await sb.from('feedback_requests').delete().eq('id',id);
    if(error){toast('Silme hatası: '+error.message,'error');return;}
    toast('Talep silindi','success');
    loadTaleplerim();
  });
}

async function deleteMusteri(ncst){
  await adminSilOnayla('Müşteri ve tüm bağlı kayıtları silinecek.', async()=>{
    const opps=await sb.from('opportunities').select('opp_id').eq('ncst',ncst);
    if(opps.data?.length){
      const ids=opps.data.map(o=>o.opp_id);
      await sb.from('opportunity_products').delete().in('opp_id',ids);
    }
    await sb.from('opportunities').delete().eq('ncst',ncst);
    await sb.from('visits').delete().eq('ncst',ncst);
    await sb.from('contacts').delete().eq('ncst',ncst);
    const{error}=await sb.from('customers').delete().eq('ncst',ncst);
    if(error){toast('Silme hatası: '+error.message,'error');return;}
    toast('Müşteri silindi','success');
    clearMusteriSel();
    loadMusteriDefault();
  });
}


async function deleteKontakFromForm(contactId, adSoyad){
  if(!confirm(adSoyad+' silinecek. Onaylıyor musunuz?')) return;
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  let error;
  if(r==='ADMIN'||r==='SATIŞ KOORDİNATÖRÜ'){
    // Admin: tamamen sil
    ({error}=await sb.from('contacts').delete().eq('contact_id',contactId));
  } else {
    // Diğerleri: soft delete
    ({error}=await sb.from('contacts').update({aktif:false}).eq('contact_id',contactId));
  }
  if(error){toast('Silme hatası: '+error.message,'error');return;}
  selectedContactsMap.delete(contactId);
  // Kartı ekrandan kaldır
  const el=document.getElementById('citem_'+contactId);
  if(el) el.remove();
  toast('Kontak silindi','success');
}


async function loadOppKontaklar(ncst){
  const div=document.getElementById('oppKontakDiv');
  const list=document.getElementById('oppKontakListesi');
  if(!div||!list) return;
  if(!ncst){div.style.display='none';return;}
  div.style.display='';
  const{data}=await sb.from('contacts').select('*').eq('ncst',ncst).neq('aktif',false).order('ad_soyad');
  if(!data?.length){
    list.innerHTML='<div style="padding:8px;font-size:12px;color:var(--text3);">Kontak yok. Yeni kontak ekleyin.</div>';
    return;
  }
  list.innerHTML=data.map(c=>renderKontakItemForForm(c,'toggleOppContact','oppCcheck')).join('');
  // v30.30 BUG-6a: Çoklu kontak özet satırı
  let ozet=document.getElementById('oppKontakOzet');
  if(!ozet){
    ozet=document.createElement('div');
    ozet.id='oppKontakOzet';
    ozet.style.cssText='font-size:11px;color:var(--blue);margin-top:6px;font-style:italic;';
    list.parentElement.appendChild(ozet);
  }
}

// v30.30 BUG-6a: Çoklu kontak — Map ile sakla
let oppSecilenKontakId=null; // geriye uyumluluk için ilk kontak
let oppSecilenKontaklar=new Map(); // {id -> name}
function toggleOppContact(id, name){
  const cItem=document.getElementById('citem_'+id);
  const cCheck=document.getElementById('oppCcheck_'+id);
  if(oppSecilenKontaklar.has(id)){
    // Seçimi kaldır
    oppSecilenKontaklar.delete(id);
    cItem?.classList.remove('selected');
    cCheck?.classList.add('hide');
  } else {
    // Seç
    oppSecilenKontaklar.set(id,name);
    cItem?.classList.add('selected');
    cCheck?.classList.remove('hide');
  }
  // İlk seçili kontağı oppSecilenKontakId'ye yaz (geriye uyumluluk)
  const keys=[...oppSecilenKontaklar.keys()];
  oppSecilenKontakId=keys.length>0?keys[0]:null;
  // Seçili kontak özet
  const ozet=document.getElementById('oppKontakOzet');
  if(ozet){
    if(oppSecilenKontaklar.size===0) ozet.textContent='';
    else ozet.textContent=[...oppSecilenKontaklar.values()].join(', ');
  }
}


function clearOppCust(){
  oppSelectedNcst=null; oppSelectedUnvan=null;
  document.getElementById('oppCustSearch').value='';
  document.getElementById('oppSelectedCust').classList.add('hide');
  document.getElementById('oppKontakDiv').style.display='none';
  document.getElementById('oppMusteriOzetBox').classList.add('hide');
}



/* ===== ADMIN PANEL ===== */
/* ===== ADMIN PANEL ===== */
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}

function switchAdminTab(tab){
  // Eski tab sistemi — artık adminSayfaAc kullanılıyor, geriye uyumluluk için tutuldu
  adminSayfaAc(tab);
}

var _adminTabAdlar = {
  'urunler':'Ürünler','kullanicilar':'Kullanıcılar','talepler':'Talepler',
  'ziyaretOpt':'Ziyaret Seçenekleri','veriSagligi':'Veri Sağlığı','gorevTipleri':'Görev Tipleri'
};

function adminSayfaAc(tab){
  // Kutu menüyü gizle, nav bar'ı göster
  const menuEl = document.getElementById('adminMenuKutular');
  const altEl  = document.getElementById('adminAltSayfa');
  const baslik = document.getElementById('adminAltSayfaBaslik');
  if(menuEl) menuEl.style.display = 'none';
  if(altEl)  altEl.style.display  = 'flex';
  if(baslik) baslik.textContent   = _adminTabAdlar[tab] || tab;

  // Sadece seçili tab'ı göster
  ['urunler','kullanicilar','talepler','ziyaretOpt','veriSagligi','gorevTipleri'].forEach(function(t){
    const p = document.getElementById('adminTab'+capitalize(t));
    if(p) p.style.display = (t===tab) ? '' : 'none';
  });

  if(tab==='urunler')     loadAdminUrunler();
  if(tab==='kullanicilar')initKullaniciModulu();
  if(tab==='talepler')    loadAdminTalepler('tumu');
  if(tab==='ziyaretOpt')  initZiyaretOpt();
  if(tab==='gorevTipleri')renderGorevTipleriAdmin();
}

function adminMenueGeri(){
  const menuEl = document.getElementById('adminMenuKutular');
  const altEl  = document.getElementById('adminAltSayfa');
  if(menuEl) menuEl.style.display = '';
  if(altEl)  altEl.style.display  = 'none';
  // Tüm tab içeriklerini gizle
  ['urunler','kullanicilar','talepler','ziyaretOpt','veriSagligi','gorevTipleri'].forEach(function(t){
    const p = document.getElementById('adminTab'+capitalize(t));
    if(p) p.style.display = 'none';
  });
}
function switchYoneticiTab(tab){
  ['hedefKalem','urunHedef','hedefGiris','iptalOnay'].forEach(t=>{
    const p=document.getElementById('yoneticiTab'+capitalize(t));
    const b=document.getElementById('ytb'+capitalize(t));
    if(p)p.style.display=t===tab?'':'none';
    if(b)b.classList.toggle('active',t===tab);
  });
  if(tab==='hedefKalem')loadYoneticiHedefKalemler();
  if(tab==='urunHedef')loadYoneticiUrunHedefMap();
  if(tab==='hedefGiris'){initHedefGirisAylar();loadHedefGirisTable();}
  if(tab==='iptalOnay')loadIptalBekleyenler();
}
function initYoneticiPanel(){switchYoneticiTab('hedefKalem');}

async function loadAdminUrunler(){
  const c=document.getElementById('adminUrunList');
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    // Kategori sıralarını al
    const {data:cats} = await sb.from('product_categories').select('*').order('sira');
    const catOrder = (cats||[]).map(c=>c.kategori);

    const{data,error}=await sb.from('products').select('*').order('sira').order('urun_adi');
    if(error)throw error;
    if(!data||data.length===0){c.innerHTML='<div class="empty">Henüz ürün yok.</div>';return;}

    // Gruplama
    const grouped={};
    data.forEach(p=>{if(!grouped[p.kategori])grouped[p.kategori]=[];grouped[p.kategori].push(p);});

    // Kategori sırasına göre sırala — DB'deki sıra önce, bilinmeyenler sona
    const sortedCats = [
      ...catOrder.filter(k=>grouped[k]),
      ...Object.keys(grouped).filter(k=>!catOrder.includes(k))
    ];

    const dl=document.getElementById('kategoriler');
    if(dl)dl.innerHTML=sortedCats.map(k=>`<option value="${escapeHTML(k)}">`).join('');

    // Kategori sıra id map
    const catIdMap = {};
    (cats||[]).forEach(c=>catIdMap[c.kategori]=c.id);

    c.innerHTML=sortedCats.map(cat=>{
      const items=grouped[cat]||[];
      const catId=catIdMap[cat]||0;
      return `
      <div class="urun-cat-header" draggable="true" data-catid="${catId}" data-catname="${escapeHTML(cat)}"
        style="cursor:grab;"
        ondragstart="katDragStart(event,'${escapeHTML(cat)}',${catId})"
        ondragover="katDragOver(event)"
        ondrop="katDrop(event,'${escapeHTML(cat)}')"
        ondragend="katDragEnd(event)">
        <span>☰ ${escapeHTML(cat)}</span>
        <span style="font-size:10px;color:var(--text3);">${items.length} ürün</span>
      </div>
      <div class="urun-drag-group" data-kategori="${escapeHTML(cat)}">
        ${items.map(p=>`
          <div class="urun-row" draggable="true" data-pid="${p.product_id}" data-kat="${escapeHTML(cat)}"
            style="${!p.aktif?'opacity:0.45;':''}"
            ondragstart="urunDragStart(event,${p.product_id},'${escapeHTML(cat)}')"
            ondragover="urunDragOver(event)"
            ondrop="urunDrop(event,${p.product_id},'${escapeHTML(cat)}')"
            ondragend="urunDragEnd(event)">
            <span style="color:var(--text3);font-size:16px;cursor:grab;padding-right:6px;">☰</span>
            <div class="urun-row-info">
              <div class="urun-row-name">${escapeHTML(p.urun_adi)}</div>
              <div class="urun-row-meta">Birim: ${escapeHTML(p.unit_type||'Adet')}${!p.aktif?' | <span style="color:var(--red);">Pasif</span>':''}</div>
            </div>
            <div class="urun-row-actions">
              <button class="icon-btn" title="Düzenle" onclick="openEditUrunModal(${p.product_id})">✏️</button>
              <button class="icon-btn" title="${p.aktif?'Pasif Yap':'Aktif Yap'}" onclick="toggleUrunAktif(${p.product_id},${!p.aktif})">${p.aktif?'🔴':'🟢'}</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    }).join('');

    // Sıra listeleri
    window._urunDragOrder = {};
    sortedCats.forEach(cat=>{
      window._urunDragOrder[cat] = (grouped[cat]||[]).map(p=>p.product_id);
    });
    window._katDragOrder = sortedCats.map(k=>({kat:k,id:catIdMap[k]||0}));

  }catch(err){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;}
}

// ── Kategori sürükle-bırak ──
let _katDragSrc = null;

function katDragStart(e, kat, catId){
  _katDragSrc = kat;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
  e.currentTarget.style.opacity = '0.4';
}

function katDragOver(e){
  e.preventDefault();
  e.stopPropagation();
  document.querySelectorAll('.urun-cat-header').forEach(h=>h.style.borderTop='');
  e.currentTarget.style.borderTop = '2px solid var(--amber)';
}

function katDrop(e, targetKat){
  e.preventDefault();
  e.stopPropagation();
  if(_katDragSrc === targetKat || !window._katDragOrder) return;
  const order = window._katDragOrder;
  const srcIdx = order.findIndex(k=>k.kat===_katDragSrc);
  const tgtIdx = order.findIndex(k=>k.kat===targetKat);
  const [moved] = order.splice(srcIdx, 1);
  order.splice(tgtIdx, 0, moved);
  katSiralamaKaydet();
}

function katDragEnd(e){
  e.currentTarget.style.opacity = '';
  document.querySelectorAll('.urun-cat-header').forEach(h=>h.style.borderTop='');
}

async function katSiralamaKaydet(){
  const updates = window._katDragOrder.map((k,i)=>
    sb.from('product_categories').update({sira:i+1}).eq('id',k.id)
  );
  await Promise.all(updates);
  toast('Kategori sırası kaydedildi','success');
  await loadAdminUrunler();
  await loadProductsFromDB();
}

let _urunDragSrc = null;
let _urunDragKat = null;

function urunDragStart(e, id, kat){
  _urunDragSrc = id;
  _urunDragKat = kat;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.style.opacity = '0.4';
}

function urunDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  // Sadece aynı kategorideki öğeler üzerinde
  const tgtKat = e.currentTarget.dataset?.kat;
  if(tgtKat !== _urunDragKat) return;
  document.querySelectorAll('.urun-row').forEach(r=>r.style.borderTop='');
  e.currentTarget.style.borderTop = '2px solid var(--blue)';
}

function urunDrop(e, targetId, targetKat){
  e.preventDefault();
  if(_urunDragSrc === targetId || _urunDragKat !== targetKat) return;
  const order = window._urunDragOrder[targetKat];
  if(!order) return;
  const srcIdx = order.indexOf(_urunDragSrc);
  const tgtIdx = order.indexOf(targetId);
  order.splice(srcIdx, 1);
  order.splice(tgtIdx, 0, _urunDragSrc);
  urunSiralamaKaydet(targetKat, order);
}

function urunDragEnd(e){
  e.currentTarget.style.opacity = '';
  document.querySelectorAll('.urun-row').forEach(r=>r.style.borderTop='');
}

async function urunSiralamaKaydet(kat, order){
  const updates = order.map((id,i)=>
    sb.from('products').update({sira:i+1}).eq('product_id',id)
  );
  await Promise.all(updates);
  toast('Sıralama kaydedildi','success');
  await loadAdminUrunler();
  await loadProductsFromDB();
}

function openAddUrunModal(){
  document.getElementById('modalUrunTitle').textContent='Yeni Ürün';
  document.getElementById('editUrunId').value='';
  document.getElementById('urunKategori').value='';
  document.getElementById('urunAdi').value='';
  document.getElementById('urunBirim').value='Adet';
  document.getElementById('urunSira').value='0';
  openModal('modalUrun');
}

async function openEditUrunModal(id){
  try{
    const{data,error}=await sb.from('products').select('*').eq('product_id',id).single();
    if(error||!data)throw error||new Error('Ürün bulunamadı');
    document.getElementById('modalUrunTitle').textContent='Ürünü Düzenle';
    document.getElementById('editUrunId').value=id;
    document.getElementById('urunKategori').value=data.kategori||'';
    document.getElementById('urunAdi').value=data.urun_adi||'';
    document.getElementById('urunBirim').value=data.unit_type||'Adet';
    document.getElementById('urunSira').value=data.sira||0;
    openModal('modalUrun');
  }catch(err){toast('Ürün yüklenemedi: '+err.message,'error');}
}

async function saveUrun(){
  const id=document.getElementById('editUrunId').value;
  const kategori=document.getElementById('urunKategori').value.trim();
  const urun_adi=document.getElementById('urunAdi').value.trim();
  const unit_type=document.getElementById('urunBirim').value;
  const sira=parseInt(document.getElementById('urunSira').value)||0;
  if(!kategori||!urun_adi){toast('Kategori ve ürün adı zorunlu','error');return;}
  try{
    if(id){
      const{error}=await sb.from('products').update({kategori,urun_adi,unit_type,sira}).eq('product_id',id);
      if(error)throw error;
      toast('Ürün güncellendi','success');
    }else{
      const{error}=await sb.from('products').insert({kategori,urun_adi,unit_type,sira,aktif:true});
      if(error)throw error;
      toast('Ürün eklendi','success');
    }
    closeModal('modalUrun');
    await loadAdminUrunler();
    await loadProductsFromDB();
    await buildTemasUI();
    buildUrunSelects();
  }catch(err){toast('Kayıt hatası: '+err.message,'error');}
}

async function toggleUrunAktif(id,yeniDurum){
  try{
    const{error}=await sb.from('products').update({aktif:yeniDurum}).eq('product_id',id);
    if(error)throw error;
    toast(yeniDurum?'Ürün aktif yapıldı':'Ürün pasif yapıldı','success');
    await loadAdminUrunler();
    await loadProductsFromDB();
    await buildTemasUI();
    buildUrunSelects();
  }catch(err){toast('İşlem hatası: '+err.message,'error');}
}


/* ===== KULLANICI MODÜLÜ ===== */
/* ===== KULLANICI MODÜLÜ ===== */
let kullTumKullanicilar = [];
let kullKcmGruplari = [];
let kullAktifDurum = true;
let sifreSifirlaUserId = null;

async function initKullaniciModulu(){
  await Promise.all([loadKcmGruplariForKull(), loadAdminKullanicilar()]);
}

async function loadKcmGruplariForKull(){
  const{data}=await sb.from('kcm_groups').select('*').order('kcm_adi');
  kullKcmGruplari=data||[];
  const kcmFilter=document.getElementById('kullKcmFilter');
  if(kcmFilter){
    kcmFilter.innerHTML=`<option value="">Tüm KÇM'ler</option>`+
      kullKcmGruplari.map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
  }
}

// v30.15: KÇM değişince Takım Lideri listesini güncelle
async function kullKcmChanged(){
  const kcmId=document.getElementById('kullKcmFilter')?.value||'';
  const takimDiv=document.getElementById('kullTakimFilterDiv');
  const takimSel=document.getElementById('kullTakimFilter');
  if(takimSel){
    takimSel.innerHTML='<option value="">Tüm Takım Liderleri</option>';
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
    if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
    if(takimDiv) takimDiv.style.display=(data&&data.length>0)?'':'none';
  }
  filterKullanicilar();
}

async function loadAdminKullanicilar(){
  const c=document.getElementById('adminKullaniciList');
  if(!c)return;
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const{data,error}=await sb.from('users').select('*,kcm_groups(kcm_adi)').order('aktif',{ascending:false}).order('kcm_id').order('ad_soyad');
  if(error){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${error.message}</div>`;return;}
  kullTumKullanicilar=data||[];
  // Takım Liderlerini yükle (tümü için)
  const takimDiv=document.getElementById('kullTakimFilterDiv');
  const takimSel=document.getElementById('kullTakimFilter');
  if(takimSel&&takimSel.options.length<=1){
    const{data:tld}=await sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ').order('ad_soyad');
    (tld||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
    if(takimDiv) takimDiv.style.display=(tld&&tld.length>0)?'':'none';
  }
  filterKullanicilar();
}

function filterKullanicilar(){
  const arama=(document.getElementById('kullArama')?.value||'').toLowerCase();
  const kcmFilter=document.getElementById('kullKcmFilter')?.value||'';
  const takimFilter=document.getElementById('kullTakimFilter')?.value||'';
  // v30.16: Aktif/Pasif filtresi geri eklendi
  const aktifFilter=document.getElementById('kullAktifFilter')?.value||'';
  let liste=kullTumKullanicilar.filter(u=>{
    if(arama&&!u.ad_soyad.toLowerCase().includes(arama)&&!(u.email||'').toLowerCase().includes(arama))return false;
    if(kcmFilter&&String(u.kcm_id)!==kcmFilter)return false;
    if(takimFilter&&String(u.takim_lideri_id)!==takimFilter)return false;
    if(aktifFilter!==''&&String(u.aktif)!==aktifFilter)return false;
    return true;
  });
  renderKullanicilar(liste);
}

// v30.15: Aktif kullanıcılar (KÇM sırası) → Pasif kullanıcılar (KÇM sırası)
function renderKullanicilar(liste){
  const c=document.getElementById('adminKullaniciList');
  const sayac=document.getElementById('kullSayac');
  const aktifler=liste.filter(u=>u.aktif!==false);
  const pasifler=liste.filter(u=>u.aktif===false);
  // v30.16: Sayaç aktifFilter durumuna göre net bilgi verir
  const aktifFilter=document.getElementById('kullAktifFilter')?.value||'';
  let sayacText='';
  if(aktifFilter==='true') sayacText=`${aktifler.length} aktif kullanıcı`;
  else if(aktifFilter==='false') sayacText=`${pasifler.length} pasif kullanıcı`;
  else sayacText=`${aktifler.length} aktif · ${pasifler.length} pasif`;
  if(sayac)sayac.textContent=sayacText;
  if(!liste.length){c.innerHTML='<div class="empty">Kullanıcı bulunamadı.</div>';return;}

  function grupla(users){
    const grouped={};
    users.forEach(u=>{
      const kcm=u.kcm_groups?.kcm_adi||u.kcm_adi||'KÇM Belirtilmemiş';
      if(!grouped[kcm])grouped[kcm]=[];
      grouped[kcm].push(u);
    });
    return Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0],'tr'));
  }

  function kullaniciKart(u){
    return `
      <div class="urun-row" style="${!u.aktif?'opacity:.55;':''}margin-bottom:7px;">
        <div class="urun-row-info" style="cursor:pointer;" onclick="openEditKullaniciModal(${u.my_id})">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;border-radius:50%;background:${u.aktif?'var(--blue)':'var(--navy3)'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;">
              ${escapeHTML(u.ad_soyad.charAt(0).toUpperCase())}
            </div>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text);">${escapeHTML(u.ad_soyad)}</div>
              <div style="font-size:11px;color:var(--text2);">${escapeHTML(u.email)}</div>
            </div>
          </div>
          <div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;">
            <span class="tag tag-gray" style="font-size:10px;">${escapeHTML(u.yetki_seviyesi||u.role||'—')}</span>
            ${u.aktif?'<span class="tag tag-green" style="font-size:10px;">Aktif</span>':'<span class="tag tag-red" style="font-size:10px;">Pasif</span>'}
            ${u.telefon?`<span class="tag tag-gray" style="font-size:10px;">📞 ${escapeHTML(u.telefon)}</span>`:''}
          </div>
        </div>
        <div class="urun-row-actions" style="flex-direction:column;gap:5px;">
          <button class="icon-btn" title="Düzenle" onclick="openEditKullaniciModal(${u.my_id})">✏️</button>
          <button class="icon-btn" title="Şifre Sıfırla" onclick="openSifreSifirlaModal(${u.my_id},'${escapeHTML(u.ad_soyad)}')">🔑</button>
          <button class="icon-btn" title="${u.aktif?'Pasif Yap':'Aktif Yap'}" onclick="toggleKullAktifDb(${u.my_id},${!u.aktif})">${u.aktif?'🔴':'🟢'}</button>
        </div>
      </div>`;
  }

  function renderGrup(baslik, icon, users, renkClass){
    if(!users.length) return '';
    const grupHtml=grupla(users).map(([kcm,klist])=>`
      <div style="margin-bottom:14px;">
        <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border);">
          ${escapeHTML(kcm)} <span style="font-weight:400;">(${klist.length})</span>
        </div>
        ${klist.map(kullaniciKart).join('')}
      </div>`).join('');
    return `<div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;padding:8px 10px;background:var(--navy2);border-radius:8px;border-left:3px solid var(${renkClass});">
        ${icon} ${baslik} (${users.length})
      </div>
      ${grupHtml}
    </div>`;
  }

  c.innerHTML=renderGrup('Aktif Kullanıcılar','✅',aktifler,'--green')+renderGrup('Pasif Kullanıcılar','🔴',pasifler,'--red');
}

async function openAddKullaniciModal(){
  document.getElementById('modalKullaniciTitle').textContent='Yeni Kullanıcı';
  document.getElementById('editKullId').value='';
  document.getElementById('kullAdSoyad').value='';
  document.getElementById('kullEmail').value='';
  document.getElementById('kullTelefon').value='';
  document.getElementById('kullKcmId').value='';
  document.getElementById('kullYetki').value='MY';
  document.getElementById('kullSifre').value='';
  document.getElementById('kullSifreTekrar').value='';
  document.getElementById('kullSifreInfo').classList.add('hide');
  document.getElementById('kullSifreZorunlu').style.display='';
  const gtEl2=document.getElementById('kullGorevTanimi');
  if(gtEl2) gtEl2.value='';
  await loadTakimLiderleri(null);
  // KÇM select doldur
  fillKcmSelect('kullKcmId');
  // Aktif toggle - başlangıçta aktif
  kullAktifDurum=true;
  updateKullAktifToggle();
  openModal('modalKullanici');
}

async function openEditKullaniciModal(userId){
  const u=kullTumKullanicilar.find(x=>x.my_id===userId);
  if(!u){toast('Kullanıcı bulunamadı','error');return;}
  document.getElementById('modalKullaniciTitle').textContent='Kullanıcıyı Düzenle';
  document.getElementById('editKullId').value=userId;
  document.getElementById('kullAdSoyad').value=u.ad_soyad||'';
  document.getElementById('kullEmail').value=u.email||'';
  document.getElementById('kullTelefon').value=u.telefon||'';
  document.getElementById('kullSifre').value='';
  document.getElementById('kullSifreTekrar').value='';
  document.getElementById('kullSifreInfo').classList.remove('hide');
  document.getElementById('kullSifreZorunlu').style.display='none';
  const gtEl=document.getElementById('kullGorevTanimi');
  if(gtEl) gtEl.value=u.gorev_tanimi||'';
  // Takım liderleri listesini doldur
  await loadTakimLiderleri(u.takim_lideri_id||null);
  // KÇM select doldur ve seç
  fillKcmSelect('kullKcmId');
  document.getElementById('kullKcmId').value=u.kcm_id||'';
  document.getElementById('kullYetki').value=u.yetki_seviyesi||u.role||'MY';
  kullAktifDurum=u.aktif!==false;
  updateKullAktifToggle();
  openModal('modalKullanici');
}

function fillKcmSelect(selectId){
  const sel=document.getElementById(selectId);
  if(!sel)return;
  sel.innerHTML='<option value="">KÇM Seçin</option>'+
    kullKcmGruplari.map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
}

function toggleKullAktif(){
  kullAktifDurum=!kullAktifDurum;
  updateKullAktifToggle();
}
function updateKullAktifToggle(){
  const toggle=document.getElementById('kullAktifToggle');
  const dot=document.getElementById('kullAktifDot');
  const label=document.getElementById('kullAktifLabel');
  if(!toggle)return;
  toggle.style.background=kullAktifDurum?'var(--green)':'var(--navy3)';
  dot.style.left=kullAktifDurum?'22px':'3px';
  if(label)label.textContent=kullAktifDurum?'Aktif':'Pasif';
}

function toggleSifreGoster(inputId,btn){
  const inp=document.getElementById(inputId);
  if(!inp)return;
  inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'👁':'🙈';
}

async function loadTakimLiderleri(secilenId=null){
  const sel=document.getElementById('kullTakimLideri');
  if(!sel)return;
  const{data}=await sb.from('users').select('my_id,ad_soyad').eq('yetki_seviyesi','TAKIM LİDERİ').eq('aktif',true).order('ad_soyad');
  sel.innerHTML='<option value="">-- Seçilmedi --</option>';
  (data||[]).forEach(u=>{
    const opt=document.createElement('option');
    opt.value=u.my_id;
    opt.textContent=u.ad_soyad;
    if(u.my_id===secilenId) opt.selected=true;
    sel.appendChild(opt);
  });
}

async function saveKullanici(){
  const btn=document.getElementById('kullSaveBtn');
  const id=document.getElementById('editKullId').value;
  const adSoyad=document.getElementById('kullAdSoyad').value.trim();
  const email=document.getElementById('kullEmail').value.trim().toLowerCase();
  const telefon=document.getElementById('kullTelefon').value.trim();
  const kcmId=document.getElementById('kullKcmId').value||null;
  const yetki=document.getElementById('kullYetki').value;
  const gorevTanimi=document.getElementById('kullGorevTanimi')?.value.trim()||null;
  const sifre=document.getElementById('kullSifre').value;
  const sifreTekrar=document.getElementById('kullSifreTekrar').value;
  if(!adSoyad||!email){toast('Ad Soyad ve E-Posta zorunlu','error');return;}
  if(!id&&!sifre){toast('Yeni kullanıcı için şifre zorunlu','error');return;}
  if(sifre&&sifre!==sifreTekrar){toast('Şifreler eşleşmiyor','error');return;}
  if(sifre&&sifre.length<4){toast('Şifre en az 4 karakter olmalı','error');return;}
  // KÇM adını bul
  const kcmGrup=kullKcmGruplari.find(k=>String(k.kcm_id)===String(kcmId));
  const kcmAdi=kcmGrup?.kcm_adi||null;
  const takimLideriId=document.getElementById('kullTakimLideri')?.value;
  const payload={
    ad_soyad:adSoyad,email,telefon:telefon||null,
    kcm_id:kcmId?parseInt(kcmId):null,kcm_adi:kcmAdi,
    yetki_seviyesi:yetki,role:yetki,aktif:kullAktifDurum,
    gorev_tanimi:gorevTanimi,
    takim_lideri_id:takimLideriId?parseInt(takimLideriId):null
  };
  if(sifre)payload.sifre_hash=sifre;
  if(btn){btn.textContent='Kaydediliyor...';btn.disabled=true;}
  try{
    if(id){
      const{error}=await sb.from('users').update(payload).eq('my_id',id);
      if(error)throw error;
      toast('Kullanıcı güncellendi','success');
    }else{
      const{error}=await sb.from('users').insert(payload);
      if(error)throw error;
      toast('Kullanıcı eklendi','success');
    }
    closeModal('modalKullanici');
    await loadAdminKullanicilar();
  }catch(e){
    toast('Hata: '+(e.message||String(e)),'error');
  }finally{
    if(btn){btn.textContent='Kaydet';btn.disabled=false;}
  }
}

async function toggleKullAktifDb(userId,yeniDurum){
  try{
    const{error}=await sb.from('users').update({aktif:yeniDurum}).eq('my_id',userId);
    if(error)throw error;
    toast(yeniDurum?'Kullanıcı aktif yapıldı':'Kullanıcı pasif yapıldı','success');
    await loadAdminKullanicilar();
  }catch(e){toast('Hata: '+e.message,'error');}
}

// Şifre sıfırla
function openSifreSifirlaModal(userId,adSoyad){
  sifreSifirlaUserId=userId;
  document.getElementById('sifreSifirlaKull').textContent=adSoyad+' için şifre sıfırlanacak';
  document.getElementById('yeniSifre').value='';
  document.getElementById('yeniSifreTekrar').value='';
  openModal('modalSifreSifirla');
}

async function saveSifreSifirla(){
  const sifre=document.getElementById('yeniSifre').value;
  const tekrar=document.getElementById('yeniSifreTekrar').value;
  if(!sifre){toast('Şifre boş olamaz','error');return;}
  if(sifre!==tekrar){toast('Şifreler eşleşmiyor','error');return;}
  if(sifre.length<4){toast('En az 4 karakter','error');return;}
  try{
    const{error}=await sb.from('users').update({sifre_hash:sifre}).eq('my_id',sifreSifirlaUserId);
    if(error)throw error;
    toast('Şifre güncellendi','success');
    closeModal('modalSifreSifirla');
  }catch(e){toast('Hata: '+e.message,'error');}
}

function showSifreUnuttum(){
  toast('Yöneticinizle iletişime geçin — Admin panelinden şifreniz sıfırlanabilir.','info');
}


// ============================================================
// v30.18: VERİ SAĞLIĞI — KÇM bilgisi eksik kayıtları tespit ve düzelt
// ============================================================
async function veriSagligiTara(){
  const sonucDiv=document.getElementById('veriSagligiSonuc');
  sonucDiv.innerHTML='<div class="loader"><div class="spinner"></div></div><div style="text-align:center;font-size:12px;color:var(--text2);margin-top:8px;">Taranıyor...</div>';

  try{
    // 1. KÇM eksik fırsatlar
    const{data:oppNull,error:e1}=await sb.from('opportunities')
      .select('opp_id,ncst,my_id,musteri_my_id,adim,beklenen_ciro,kcm_id')
      .is('kcm_id',null).order('opp_id');
    if(e1) throw e1;

    // 2. KÇM eksik temas kayıtları
    const{data:visNull,error:e2}=await sb.from('visits')
      .select('visit_id,ncst,my_id,musteri_my_id,durum,kcm_id')
      .is('kcm_id',null).order('visit_id');
    if(e2) throw e2;

    const oppList=oppNull||[];
    const visList=visNull||[];

    if(oppList.length===0&&visList.length===0){
      sonucDiv.innerHTML='<div style="padding:20px;text-align:center;color:var(--green);font-size:14px;">✅ Tüm kayıtlarda KÇM bilgisi mevcut. Sorun yok!</div>';
      return;
    }

    // 3. Etkilenen NCST'lerin müşteri KÇM bilgisini çek
    const allNcst=[...new Set([...oppList.map(o=>o.ncst),...visList.map(v=>v.ncst)].filter(Boolean))];
    let custKcmMap={}, custMyMap={};
    if(allNcst.length){
      const{data:custs}=await sb.from('customers').select('ncst,kcm_id,my_id,unvan').in('ncst',allNcst);
      (custs||[]).forEach(c=>{custKcmMap[c.ncst]=c.kcm_id; custMyMap[c.ncst]={my_id:c.my_id,unvan:c.unvan};});
    }

    // 4. Aynı zamanda my_id'den kcm_id çek (fallback)
    const allMyIds=[...new Set([...oppList.map(o=>o.my_id),...visList.map(v=>v.my_id)].filter(Boolean))];
    let userKcmMap={};
    if(allMyIds.length){
      const{data:usrs}=await sb.from('users').select('my_id,kcm_id,ad_soyad').in('my_id',allMyIds);
      (usrs||[]).forEach(u=>{userKcmMap[u.my_id]={kcm_id:u.kcm_id,ad:u.ad_soyad};});
    }

    // Tablo oluştur
    const rowStyle='padding:8px;border-bottom:1px solid var(--border);font-size:12px;';
    const thStyle='padding:8px;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;';

    let html=`<div style="margin-bottom:12px;">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;">
        📊 Eksik: <span style="color:var(--red);">${oppList.length} fırsat</span> + <span style="color:var(--amber);">${visList.length} temas</span>
      </div>`;

    if(oppList.length>0){
      html+=`<div style="margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">💼 KÇM Eksik Fırsatlar (${oppList.length})</div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background:var(--navy2);">
              <th style="${thStyle}">opp_id</th><th style="${thStyle}">Müşteri</th>
              <th style="${thStyle}">Giren MY</th><th style="${thStyle}">Adım</th>
              <th style="${thStyle}">Düzeltme KÇM</th>
            </tr>
            ${oppList.map(o=>{
              const cust=custMyMap[o.ncst]||{};
              const guessKcm=custKcmMap[o.ncst]||userKcmMap[o.my_id]?.kcm_id;
              const girenAd=userKcmMap[o.my_id]?.ad||('MY#'+o.my_id);
              return `<tr>
                <td style="${rowStyle}">#${o.opp_id}</td>
                <td style="${rowStyle}">${escapeHTML(cust.unvan||o.ncst||'?')}</td>
                <td style="${rowStyle}">${escapeHTML(girenAd)}</td>
                <td style="${rowStyle}">${escapeHTML(o.adim||'?')}</td>
                <td style="${rowStyle};color:${guessKcm?'var(--green)':'var(--red);'}">
                  ${guessKcm?'KÇM#'+guessKcm:'❌ Bulunamadı'}
                </td>
              </tr>`;
            }).join('')}
          </table>
        </div>
      </div>`;
    }

    if(visList.length>0){
      html+=`<div style="margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">📞 KÇM Eksik Temas Kayıtları (${visList.length})</div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background:var(--navy2);">
              <th style="${thStyle}">visit_id</th><th style="${thStyle}">Müşteri</th>
              <th style="${thStyle}">Giren MY</th><th style="${thStyle}">Durum</th>
              <th style="${thStyle}">Düzeltme KÇM</th>
            </tr>
            ${visList.map(v=>{
              const cust=custMyMap[v.ncst]||{};
              const guessKcm=custKcmMap[v.ncst]||userKcmMap[v.my_id]?.kcm_id;
              const girenAd=userKcmMap[v.my_id]?.ad||('MY#'+v.my_id);
              return `<tr>
                <td style="${rowStyle}">#${v.visit_id}</td>
                <td style="${rowStyle}">${escapeHTML(cust.unvan||v.ncst||'?')}</td>
                <td style="${rowStyle}">${escapeHTML(girenAd)}</td>
                <td style="${rowStyle}">${escapeHTML(v.durum||'?')}</td>
                <td style="${rowStyle};color:${guessKcm?'var(--green)':'var(--red);'}">
                  ${guessKcm?'KÇM#'+guessKcm:'❌ Bulunamadı'}
                </td>
              </tr>`;
            }).join('')}
          </table>
        </div>
      </div>`;
    }

    // Düzelt butonu
    const duzeltilebilenOpp=oppList.filter(o=>custKcmMap[o.ncst]||userKcmMap[o.my_id]?.kcm_id);
    const duzeltilebilenVis=visList.filter(v=>custKcmMap[v.ncst]||userKcmMap[v.my_id]?.kcm_id);
    html+=`<button class="btn" style="width:100%;background:var(--green);" onclick="veriSagligiDuzelt()">
      ✅ ${duzeltilebilenOpp.length} fırsat + ${duzeltilebilenVis.length} temas kaydını otomatik düzelt
    </button>`;
    html+='</div>';

    // Düzeltme verisini sakla
    window._vsDuzeltOpp=oppList.map(o=>({id:o.opp_id,kcm:custKcmMap[o.ncst]||userKcmMap[o.my_id]?.kcm_id,musteri_my_id:custMyMap[o.ncst]?.my_id||o.musteri_my_id})).filter(x=>x.kcm);
    window._vsDuzeltVis=visList.map(v=>({id:v.visit_id,kcm:custKcmMap[v.ncst]||userKcmMap[v.my_id]?.kcm_id,musteri_my_id:custMyMap[v.ncst]?.my_id||v.musteri_my_id})).filter(x=>x.kcm);

    sonucDiv.innerHTML=html;
  }catch(err){
    sonucDiv.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;
    console.error(err);
  }
}

async function veriSagligiDuzelt(){
  const oList=window._vsDuzeltOpp||[];
  const vList=window._vsDuzeltVis||[];
  if(!oList.length&&!vList.length){toast('Düzeltilecek kayıt yok','info');return;}
  if(!confirm(`${oList.length} fırsat ve ${vList.length} temas kaydı güncellenecek. Onaylıyor musunuz?`)) return;

  const sonucDiv=document.getElementById('veriSagligiSonuc');
  sonucDiv.innerHTML='<div class="loader"><div class="spinner"></div></div><div style="text-align:center;font-size:12px;color:var(--text2);margin-top:8px;">Düzeltiliyor...</div>';

  let hatalar=[], ok=0;
  try{
    // Fırsatları güncelle
    for(const o of oList){
      const upd={kcm_id:o.kcm};
      if(o.musteri_my_id) upd.musteri_my_id=o.musteri_my_id;
      const{error}=await sb.from('opportunities').update(upd).eq('opp_id',o.id);
      if(error) hatalar.push('opp#'+o.id+': '+error.message);
      else ok++;
    }
    // Temas kayıtlarını güncelle
    for(const v of vList){
      const upd={kcm_id:v.kcm};
      if(v.musteri_my_id) upd.musteri_my_id=v.musteri_my_id;
      const{error}=await sb.from('visits').update(upd).eq('visit_id',v.id);
      if(error) hatalar.push('visit#'+v.id+': '+error.message);
      else ok++;
    }
    if(hatalar.length){
      sonucDiv.innerHTML=`<div style="color:var(--red);font-size:12px;">${ok} başarılı, ${hatalar.length} hata:<br>${hatalar.join('<br>')}</div>`;
    } else {
      sonucDiv.innerHTML=`<div style="padding:20px;text-align:center;color:var(--green);font-size:14px;">✅ ${ok} kayıt başarıyla güncellendi!</div>
        <button class="btn" style="width:100%;margin-top:8px;" onclick="veriSagligiTara()">🔍 Tekrar Tara</button>`;
      toast(`${ok} kayıt düzeltildi!`,'success');
    }
  }catch(err){
    sonucDiv.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

