'use strict';
// ===== GERİ BİLDİRİM / TALEP SİSTEMİ =====
const TALEP_DURUM_COLORS = {
  'Beklemede':'var(--amber)','İnceleniyor':'var(--blue)',
  'İş Listesinde':'var(--purple)','Tamamlandı':'var(--green)',
  'Reddedildi':'var(--red)','Kapatıldı':'var(--text3)',
  'Tekrar Açıldı':'var(--red)'
};
const TALEP_TIP_ICONS = {
  'Bug':'🐛','İyileştirme':'✨','Acil':'🚨','Kullanıcı Deneyimi':'🎯','Yeni Özellik':'🆕','Diğer':'💬'
};

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

async function loadTaleplerim(){
  const el=document.getElementById('taleplerimList');
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    const{data,error}=await sb.from('feedback_requests')
      .select('*').eq('user_id',currentUser.my_id)
      .order('olusturma_tarihi',{ascending:false});
    if(error)throw error;
    if(!data?.length){el.innerHTML='<div class="empty">Henüz talep girmediniz.</div>';return;}

    // Okunmamış tamamlanan/reddedilen talepleri işaretle (okundu=false veya null)
    const okunmamis = data.filter(t=>
      (t.durum==='Tamamland\u0131'||t.durum==='Reddedildi') && !t.okundu
    );
    el.innerHTML = data.map(t=>renderTalepKart(t,false)).join('');
    // Her talep için mesajları yükle
    for(const t of data){
      const containerId = `msgs_${t.id}`;
      const container = document.getElementById(containerId);
      if(container) await loadTalepMesajlar(t.id, containerId);
    }

    // Okunmamışları okundu yap
    if(okunmamis.length){
      const ids = okunmamis.map(t=>t.id);
      await sb.from('feedback_requests').update({okundu:true}).in('id',ids);
    }
  }catch(e){el.innerHTML='<div class="empty" style="color:var(--red)">'+escapeHTML(e.message)+'</div>';}
}

async function loadAdminTalepler(durum){
  adminFiltreDurum=durum||'tumu';
  adminFiltreTip='tumu';
  adminFiltreOnc='tumu';
  // Filtre butonlarını sıfırla
  document.querySelectorAll('#adminTalepFiltreler .chip-btn').forEach((b,i)=>{
    b.classList.toggle('selected', i===0); // İlk buton (Tümü) seçili
  });
  loadAdminTaleplerFiltreli();
}

// Aktif admin filtreler
let adminFiltreDurum='Beklemede', adminFiltreTip='tumu', adminFiltreOnc='tumu';

function filterAdminTalepler(durum,el){
  document.querySelectorAll('#adminTalepFiltreler .chip-btn').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  adminFiltreDurum=durum;
  loadAdminTaleplerFiltreli();
}
function filterAdminTip(tip,el){
  document.querySelectorAll('#adminTalepTipFiltre .chip-btn').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  adminFiltreTip=tip;
  loadAdminTaleplerFiltreli();
}
function filterAdminOnc(onc,el){
  document.querySelectorAll('#adminTalepOncFiltre .chip-btn').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  adminFiltreOnc=onc;
  loadAdminTaleplerFiltreli();
}
let _adminTalepYukleniyor = false;
async function loadAdminTaleplerFiltreli(){
  if(_adminTalepYukleniyor) return;
  _adminTalepYukleniyor = true;
  const el=document.getElementById('adminTaleplerListDiv');
  if(!el){ _adminTalepYukleniyor=false; return; }
  const scrollPos = el.scrollTop;
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    let q=sb.from('feedback_requests').select('*');
    if(adminFiltreDurum&&adminFiltreDurum!=='tumu') q=q.eq('durum',adminFiltreDurum);
    if(adminFiltreTip&&adminFiltreTip!=='tumu') q=q.eq('tip',adminFiltreTip);
    if(adminFiltreOnc&&adminFiltreOnc!=='tumu') q=q.eq('oncelik',adminFiltreOnc);
    const{data,error}=await q;
    if(error)throw error;
    if(!data?.length){el.innerHTML='<div class="empty">Talep bulunamad\u0131.</div>';_adminTalepYukleniyor=false;return;}
    function durumSira(t){
      if(t.durum==='Beklemede'||t.durum==='Tekrar A\u00e7\u0131ld\u0131'){
        return t.okundu ? 4 : 1;
      }
      const map={'\u0130nceleniyor':2,'\u0130\u015f Listesinde':3,'Tamamland\u0131':5,'Reddedildi':6,'Kapat\u0131ld\u0131':7};
      return map[t.durum]||8;
    }
    const sorted=[...data].sort((a,b)=>{
      const da=durumSira(a), db=durumSira(b);
      if(da!==db) return da-db;
      const ta=new Date(a.guncelleme_tarihi||a.olusturma_tarihi);
      const tb=new Date(b.guncelleme_tarihi||b.olusturma_tarihi);
      return tb-ta;
    });
    el.innerHTML=sorted.map(t=>renderTalepKart(t,true)).join('');
    for(const t of sorted){
      const containerId=`msgs_${t.id}`;
      const container=document.getElementById(containerId);
      if(container) await loadTalepMesajlar(t.id,containerId);
    }
    el.scrollTop=scrollPos;
  }catch(e){el.innerHTML='<div class="empty" style="color:var(--red)">'+escapeHTML(e.message)+'</div>';}
  finally{_adminTalepYukleniyor=false;}
}

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
    ${isAdmin?`<div style="margin-top:8px;text-align:right;"><button onclick="event.stopPropagation();adminTalepSil(${t.id})" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;">🗑 Sil</button></div>`:''}
  </div>`;
}

async function updateTalepDurum(id, durum, btn){
  try{
    const updateData={durum, okundu:false, kullanici_okundu:false, guncelleme_tarihi:new Date().toISOString()};
    const{error}=await sb.from('feedback_requests').update(updateData).eq('id',id);
    if(error)throw error;
    await sb.from('feedback_messages').insert({
      talep_id:id, gonderen_id:currentUser.my_id,
      gonderen_ad:currentUser.ad_soyad, gonderen_rol:'admin',
      mesaj:`📋 Durum: ${durum}`, okundu:false
    });
    toast('Durum güncellendi: '+durum,'success');
    const kart=document.getElementById(`talepkart_${id}`);
    if(kart){
      const durumColor=TALEP_DURUM_COLORS[durum]||'var(--text2)';
      const badge=kart.querySelector('[style*="border-radius:8px"]');
      if(badge){badge.textContent=durum;badge.style.color=durumColor;badge.style.background=durumColor+'22';}
      await loadTalepMesajlar(id,`msgs_${id}`);
    } else {
      loadAdminTaleplerFiltreli();
    }
  }catch(e){toast('Hata: '+e.message,'error');}
}

// v30.06: Eksik adminTalepSil fonksiyonu eklendi
async function adminTalepSil(id){
  if(!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
  try{
    await sb.from('feedback_messages').delete().eq('talep_id',id);
    const{error}=await sb.from('feedback_requests').delete().eq('id',id);
    if(error) throw error;
    const kart=document.getElementById('talepkart_'+id);
    if(kart) kart.remove();
    toast('Talep silindi','success');
  }catch(e){toast('Silme hatası: '+e.message,'error');}
}


