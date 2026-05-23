'use strict';
/* ===== YARDIMCILAR ===== */
/* ===== YARDIMCILAR ===== */
function escapeHTML(s){if(!s)return '';return String(s).replace(/[&<>'"]/g,t=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));}

function csvCell(v){const s=String(v||'').replace(/"/g,'""');return(s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s+'"':s;}
function fmtTL(n){if(!n&&n!==0)return '—';return new Intl.NumberFormat('tr-TR',{minimumFractionDigits:0}).format(n)+' ₺';}
function fmtDate(d){if(!d)return '—';try{return new Date(d).toLocaleDateString('tr-TR');}catch{return d;}}


/* ===== LOG / NOT SİSTEMİ ===== */
async function addLog(tabloAdi, kayitId, aksiyon, detay=''){
  try{
    await sb.from('activity_logs').insert({
      tablo_adi: tabloAdi,
      kayit_id: String(kayitId),
      user_id: currentUser.my_id,
      user_ad: currentUser.ad_soyad,
      aksiyon, detay
    });
    // İlgili tablonun guncelleme_tarihi'ni güncelle
    const now = new Date().toISOString();
    if(tabloAdi==='opportunities'){
      await sb.from('opportunities').update({guncelleme_tarihi:now}).eq('opp_id',kayitId);
    } else if(tabloAdi==='visits'){
      await sb.from('visits').update({guncelleme_tarihi:now}).eq('visit_id',kayitId);
    } else if(tabloAdi==='customers'){
      await sb.from('customers').update({guncelleme_tarihi:now}).eq('ncst',String(kayitId));
    }
  }catch(e){ console.warn('Log yazılamadı:',e); }
}

async function loadLogs(tabloAdi, kayitId){
  if(!kayitId){console.warn('loadLogs: kayitId boş!');return[];}
  console.log('loadLogs:',tabloAdi,kayitId);
  const{data,error}=await sb.from('activity_logs')
    .select('*')
    .eq('tablo_adi',tabloAdi)
    .eq('kayit_id',String(kayitId))
    .order('olusturma_tarihi',{ascending:false})
    .limit(50);
  if(error)console.error('loadLogs hata:',error);
  return data||[];
}

function renderLoglar(logs){
  if(!logs.length) return '<div style="font-size:12px;color:var(--text3);padding:8px 0;">Henüz kayıt yok.</div>';
  return logs.map(l=>`
    <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06);display:flex;gap:10px;align-items:flex-start;">
      <div style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:var(--blue);margin-top:5px;"></div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
          <span style="font-size:12px;font-weight:700;color:var(--text);">${escapeHTML(l.aksiyon)}</span>
          <span style="font-size:10px;color:var(--text3);">${fmtDateTime(l.olusturma_tarihi)}</span>
        </div>
        ${l.detay?`<div style="font-size:12px;color:var(--text2);">${escapeHTML(l.detay)}</div>`:''}
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">👤 ${escapeHTML(l.user_ad||'')}</div>
      </div>
    </div>`).join('');
}

function fmtDateTime(dt){
  if(!dt)return'—';
  const d=new Date(dt);
  return d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+
    d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
}

async function saveNot(tabloAdi, kayitId, containerId){
  const inp=document.getElementById('notInput_'+containerId);
  if(!inp||!inp.value.trim()){toast('Not boş olamaz','error');return;}
  await addLog(tabloAdi, kayitId, 'Not Eklendi', inp.value.trim());
  inp.value='';
  // Listeyi yenile
  const logs=await loadLogs(tabloAdi, kayitId);
  const logEl=document.getElementById('logList_'+containerId);
  if(logEl) logEl.innerHTML=renderLoglar(logs);
  toast('Not eklendi','success');
}

function renderLogSection(tabloAdi, kayitId, logs, containerId){
  return `<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;">
    <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">📋 Geçmiş</div>
    <div id="logList_${containerId}">${renderLoglar(logs)}</div>
  </div>`;
}


/* ===== NAVİGASYON ===== */
/* ===== NAVİGASYON ===== */
function showPage(pid){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(pid).classList.add('active');}
let navHistory=[];
function navTo(pid,reset=false){
  // Mevcut sayfayı history'ye ekle
  const current=document.querySelector('.page.active')?.id;
  if(current && current!==pid){
    if(pid==='pageDash'){
      navHistory=[];
    } else {
      navHistory.push(current);
      if(navHistory.length>20) navHistory.shift();
    }
  }
  showPage(pid);
  if(pid==='pageDash')loadDashboard();
  if(pid==='pageTemasForm'){initTemasForm();if(!selectedCustomer)loadDefaultCustomers('formDefaultCustList','selC');}
  if(pid==='pageMenuTemas'){
    // v30.29 BUG-1: Her girişte filtreler ve zaman filtresi sıfırlanır
    _resetTemasFilters();
    loadTemasDashboard();
    initTemasPersonelFilter();
  }
  if(pid==='pagePipeline'){loadPipeline();initPpPersonelFilter();}
  if(pid==='pageFirsatForm'){if(reset)initFirsatForm();else initFirsatForm();}
  if(pid==='pageGorev'){initGorevModulu();}
  if(pid==='pageGorevAdmin'){renderGorevTipleriAdmin();}
  if(pid==='pageAdmin'){ adminMenueGeri(); }
  if(pid==='pageMusteri')initMusteriPage();
  if(pid==='pageMenuHedef')initHedefTakip();
  if(pid==='pageYonetici')initYoneticiPanel();
  if(pid==='pageHedefKalem'){loadYoneticiHedefKalemler();}
  if(pid==='pageUrunHedef'){loadYoneticiUrunHedefMap();}
  if(pid==='pageHedefGiris'){initHedefGirisAylar();loadHedefGirisTable();}
  if(pid==='pageOnayIslemleri'){loadIptalBekleyenler();}
  if(pid==='pageTalepGir')initTalepGir();
  if(pid==='pageTaleplerim')loadTaleplerim();
  if(pid==='pagePipelineRapor')initPipelineRapor().then(()=>fetchPipelineReport());
  if(pid==='pageTemasRapor')initTemasRapor();
  if(pid==='pageMusteriRapor')initMusteriRapor();
}
function goBack(){
  if(navHistory.length>0){
    const prev=navHistory.pop();
    showPage(prev);
    // Sayfaya göre içerik yenile
    if(prev==='pageMenuTemas') loadTemasDashboard();
    else if(prev==='pagePipeline') loadPipeline();
    else if(prev==='pageMusteri') initMusteriPage();
    else if(prev==='pageMenuHedef') initHedefTakip();
    else if(prev==='pageYonetici') initYoneticiPanel();
    else if(prev==='pageAdmin') adminMenueGeri(); // kutu menüyü göster
    else if(prev==='pageMenuRapor'){/* rapor sayfası */}
    else if(prev==='pageDash') loadDashboard();
  }else{
    navTo('pageDash');
  }
}
function closeModal(id){document.getElementById(id).classList.remove('show');}
function openModal(id){document.getElementById(id).classList.add('show');}
function toast(msg,type='info'){const c=document.getElementById('toastContainer');const t=document.createElement('div');t.className='toast '+type;t.innerHTML=msg;c.appendChild(t);setTimeout(()=>t.remove(),3800);}


// v30.41 utils loaded
