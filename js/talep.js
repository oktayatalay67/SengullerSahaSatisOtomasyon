// ============================================================
// talep.js — v1.0.3
// Son güncelleme: 2026-06-24
// Değişiklikler:
//   v1.0.3 — KRİTİK DÜZELTME: loadAdminTalepler/loadAdminTaleplerFiltreli/
//            renderTalepKart hiçbir dosyada tanımlı değildi (admin.js sadece
//            ÇAĞIRIYORDU, tanımı yoktu — admin panelinde Talepler sekmesi
//            hata veriyordu). loadTaleplerim de var olmayan loadTalepMesajlar'ı
//            çağırıp eski/kullanılmayan bir kart-içi-mesaj yapısını arıyordu.
//            Tümü admin.js'in GERÇEK fonksiyon imzasına (talepDetayAc(id,isAdmin),
//            feedback_requests.id alanı) göre yeniden yazıldı.
//   v1.0.2 — admin.js ile çakışan fonksiyonlar kaldırıldı (HATALI — bu sefer
//            gerçekte var olmayan fonksiyonlar da yanlışlıkla "duplicate" sayılmış)
//   v1.0.1 — Eksik fonksiyonlar eklendi (hatalı)
//   v1.0.0 — İlk versiyon
// ============================================================
'use strict';

// ===== SABİTLER — admin.js tarafından da kullanılır =====
const TALEP_DURUM_COLORS = {
  'Beklemede':'var(--amber)','İnceleniyor':'var(--blue)',
  'İş Listesinde':'var(--purple)','Tamamlandı':'var(--green)',
  'Reddedildi':'var(--red)','Kapatıldı':'var(--text3)',
  'Tekrar Açıldı':'var(--red)'
};
const TALEP_TIP_ICONS = {
  'Bug':'🐛','İyileştirme':'✨','Acil':'🚨','Kullanıcı Deneyimi':'🎯','Yeni Özellik':'🆕','Diğer':'💬'
};

// ===== TALEP GİR FORMU =====
function initTalepGir(){
  document.getElementById('talepTip').value='';
  document.getElementById('talepMenu').value='';
  document.getElementById('talepAciklama').value='';
  document.querySelectorAll('.talep-tip-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('.talep-onc-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelector('.talep-onc-btn[data-onc="Normal"]')?.classList.add('selected');
  document.getElementById('talepOnc').value='Normal';
}

function selectTalepTip(tip){
  document.querySelectorAll('.talep-tip-btn').forEach(b=>b.classList.toggle('selected',b.dataset.tip===tip));
  document.getElementById('talepTip').value=tip;
}

function selectTalepOnc(onc){
  document.querySelectorAll('.talep-onc-btn').forEach(b=>b.classList.toggle('selected',b.dataset.onc===onc));
  document.getElementById('talepOnc').value=onc;
}

async function saveTalep(){
  const tip=document.getElementById('talepTip').value;
  const menu=document.getElementById('talepMenu').value;
  const aciklama=document.getElementById('talepAciklama').value.trim();
  const onc=document.getElementById('talepOnc').value||'Normal';
  if(!tip){toast('Talep tipi seçin','error');return;}
  if(!aciklama){toast('Açıklama zorunlu','error');return;}
  try{
    const{error}=await sb.from('feedback_requests').insert({
      user_id:currentUser.my_id,
      user_ad:currentUser.ad_soyad,
      kcm_adi:currentUser.kcm_adi||'',
      tip, menu_alani:menu, aciklama, oncelik:onc,
      durum:'Beklemede',
      olusturma_tarihi:new Date().toISOString()
    });
    if(error)throw error;
    toast('Talebiniz gönderildi ✅','success');
    initTalepGir();
    navTo('pageTaleplerim');
  }catch(e){
    toast('Hata: '+e.message,'error');
    console.error('saveTalep hata:',e);
  }
}

// ===== TALEPLERİM (kullanıcı ekranı) =====
async function loadTaleplerim(){
  const el=document.getElementById('taleplerimList');
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    const{data,error}=await sb.from('feedback_requests')
      .select('*').eq('user_id',currentUser.my_id)
      .order('olusturma_tarihi',{ascending:false});
    if(error)throw error;
    if(!data?.length){el.innerHTML='<div class="empty">Henüz talep girmediniz.</div>';return;}
    el.innerHTML=data.map(t=>renderTalepKart(t,false)).join('');
  }catch(e){
    el.innerHTML='<div class="empty" style="color:var(--red)">'+escapeHTML(e.message)+'</div>';
  }
}

// ===== ADMİN TALEP LİSTESİ =====
let adminFiltreDurum='tumu', adminFiltreTip='tumu', adminFiltreOnc='tumu';
let _adminTalepYukleniyor=false;

async function loadAdminTalepler(durum){
  adminFiltreDurum=durum||'tumu';
  adminFiltreTip='tumu';
  adminFiltreOnc='tumu';
  document.querySelectorAll('#adminTalepFiltreler .btn,#adminTalepFiltreler .chip-btn').forEach((b,i)=>{
    b.classList.toggle('selected', i===0);
  });
  await loadAdminTaleplerFiltreli();
}

function filterAdminTalepler(durum,el){
  document.querySelectorAll('#adminTalepFiltreler .btn,#adminTalepFiltreler .chip-btn').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  adminFiltreDurum=durum;
  loadAdminTaleplerFiltreli();
}
function filterAdminTip(tip,el){
  document.querySelectorAll('#adminTalepTipFiltre .btn,#adminTalepTipFiltre .chip-btn').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  adminFiltreTip=tip;
  loadAdminTaleplerFiltreli();
}
function filterAdminOnc(onc,el){
  document.querySelectorAll('#adminTalepOncFiltre .btn,#adminTalepOncFiltre .chip-btn').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  adminFiltreOnc=onc;
  loadAdminTaleplerFiltreli();
}

async function loadAdminTaleplerFiltreli(){
  if(_adminTalepYukleniyor) return;
  _adminTalepYukleniyor=true;
  const el=document.getElementById('adminTaleplerListDiv');
  if(!el){ _adminTalepYukleniyor=false; return; }
  const scrollPos=el.scrollTop;
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    let q=sb.from('feedback_requests').select('*');
    if(adminFiltreDurum&&adminFiltreDurum!=='tumu') q=q.eq('durum',adminFiltreDurum);
    if(adminFiltreTip&&adminFiltreTip!=='tumu') q=q.eq('tip',adminFiltreTip);
    if(adminFiltreOnc&&adminFiltreOnc!=='tumu') q=q.eq('oncelik',adminFiltreOnc);
    const{data,error}=await q.order('olusturma_tarihi',{ascending:false});
    if(error)throw error;
    if(!data?.length){el.innerHTML='<div class="empty">Talep bulunamadı.</div>';_adminTalepYukleniyor=false;return;}
    function durumSira(t){
      if(t.durum==='Beklemede'||t.durum==='Tekrar Açıldı') return t.okundu?4:1;
      const map={'İnceleniyor':2,'İş Listesinde':3,'Tamamlandı':5,'Reddedildi':6,'Kapatıldı':7};
      return map[t.durum]||8;
    }
    const sorted=[...data].sort((a,b)=>{
      const da=durumSira(a),db=durumSira(b);
      if(da!==db) return da-db;
      return new Date(b.guncelleme_tarihi||b.olusturma_tarihi)-new Date(a.guncelleme_tarihi||a.olusturma_tarihi);
    });
    el.innerHTML=sorted.map(t=>renderTalepKart(t,true)).join('');
    el.scrollTop=scrollPos;
  }catch(e){
    el.innerHTML='<div class="empty" style="color:var(--red)">'+escapeHTML(e.message)+'</div>';
  } finally{
    _adminTalepYukleniyor=false;
  }
}

// renderTalepKart: admin.js'in gerçek talepDetayAc(id, isAdminView) imzasını çağırır
function renderTalepKart(t, isAdmin){
  const durumColor=TALEP_DURUM_COLORS[t.durum]||'var(--text2)';
  const tipIcon=TALEP_TIP_ICONS[t.tip]||'💬';
  const oncelikTag=t.oncelik==='Kritik'
    ?'<span style="background:rgba(224,4,42,.2);color:var(--red);padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">🔴 KRİTİK</span>'
    :t.oncelik==='Yüksek'
      ?'<span style="background:rgba(255,180,0,.2);color:var(--amber);padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">⚡ YÜKSEK</span>':'';
  const isYeni=!isAdmin&&!t.kullanici_okundu&&t.durum!=='Beklemede'&&t.durum!=='Kapatıldı';
  const adminYeni=isAdmin&&!t.okundu&&t.durum!=='Kapatıldı';
  const vurgu=isYeni||adminYeni;
  return `<div id="talepkart_${t.id}" onclick="talepDetayAc(${t.id},${isAdmin})" style="background:var(--card);border:1px solid ${vurgu?durumColor:'var(--border)'};border-left:3px solid ${durumColor};border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:pointer;${vurgu?'box-shadow:0 0 0 2px '+durumColor+'33;':''}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="font-size:13px;font-weight:700;">${tipIcon} ${escapeHTML(t.tip||'')} ${oncelikTag}</div>
      <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px;background:${durumColor}22;color:${durumColor};">${escapeHTML(t.durum||'')}</span>
    </div>
    ${t.menu_alani?`<div style="font-size:11px;color:var(--text2);margin-bottom:4px;">📍 ${escapeHTML(t.menu_alani)}</div>`:''}
    <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(t.aciklama||'')}</div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;align-items:center;">
      ${isAdmin?`<span style="font-size:10px;color:var(--text3);">👤 ${escapeHTML(t.user_ad||'')}</span>`:'<span></span>'}
      <span style="font-size:10px;color:var(--text3);">${fmtDate(t.olusturma_tarihi)}</span>
      ${vurgu?`<span style="font-size:10px;font-weight:700;color:${durumColor};">🔔 Yeni</span>`:''}
    </div>
  </div>`;
}