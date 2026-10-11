// ============================================================
// utils.js — v1.0.5
// Son güncelleme: 2026-10-08
// Değişiklikler:
//   v1.0.5 (V31.169) — FIX: Tarayıcı yakınlaştırması %100 değilken (Ctrl +/-)
//            topbar ve alt versiyon barı titriyordu (Görev > Düzenle > Kapat
//            ile başlıyor, Ctrl+0 ile kesiliyordu). Sebep: V31.30'daki
//            visualViewport senkronu her resize/scroll olayında kesirli piksel
//            değerini (örn. 0.4px) koşulsuz yazıyordu; bu değerler topbar ve
//            footer'ın translateY'sine gidip her olayda yeniden boyama
//            tetikliyordu. Artık: (1) kilitleme yalnızca gerçek pinch-zoom
//            varken (vv.scale > 1.01) uygulanır, aksi halde değerler 0'dır;
//            (2) değerler tam sayıya yuvarlanır; (3) değer değişmediyse CSS
//            yazılmaz; (4) olaylar kare başına tek yazıma indirilir
//            (requestAnimationFrame). Pinch-zoom davranışı (V31.30) korunur.
//   v1.0.4 (V31.101) — navTo: pageHangiMusteri için initHangiMusteri() çağrısı
//            eklendi (yeni "Hangi Müşteri?" modülü, js/gorev.js içinde).
//   v1.0.3 (V31.33) — navTo: pageDuyuru için loadDuyurular() çağrısı eklendi
//            (Duyurular modülü, js/duyuru.js).
//   v1.0.2 (V31.30) — FIX: Masaüstünde trackpad/Ctrl ile pinch-tarzı zoom
//            yapıldığında (visualViewport, layout viewport'tan kayıp/küçülüyor)
//            topbar ve alt versiyon barı görünür alanın dışında kalıp
//            kayboluyordu. window.visualViewport API'si ile topbar/alt bar
//            AYRI AYRI görünen alanın üstüne/altına kilitlenir (tek parça
//            kaydırma matematiksel olarak yetersiz kalıyordu — bkz. changelog
//            detayı config.js'te). Zoom/pan yokken hiçbir etkisi yok. Tarayıcı
//            visualViewport'u desteklemiyorsa fonksiyon hiçbir şey yapmaz.
//   v1.0.1 — fmtDateTime: cihazın saat dilimi ayarından bağımsız hale getirildi,
//            artık her zaman explicit 'Europe/Istanbul' kullanıyor.
// ============================================================
'use strict';
/* ===== VISUAL VIEWPORT SENKRONU (V31.30) =====
   Amaç: pinch/trackpad-zoom sırasında topbar HER ZAMAN görünen alanın en
   üstüne, alt versiyon barı HER ZAMAN görünen alanın en altına kilitli kalsın.
   Tek bir .page kaydırması matematiksel olarak yetmiyor: topbar ve alt bar
   sayfanın iki ucunda (~800px ara), aşırı zoomda görünen alan bundan çok
   daha dar olabiliyor — ikisi aynı anda tek kaydırmayla görünür alana sığmaz.
   Bu yüzden ikisi BAĞIMSIZ hesaplanıp ayrı ayrı konumlandırılır. */
(function(){
  if(!window.visualViewport) return;
  const vv = window.visualViewport;
  // V31.169: son yazılan değerler ve bekleyen kare. Değer değişmediyse CSS'e
  // yazılmaz; aynı karedeki birden fazla olay tek yazıma indirilir.
  let lastTop = null, lastBottom = null, rafId = 0;
  function applyVisualViewport(){
    rafId = 0;
    let top = 0, bottom = 0;
    // Kilitleme yalnızca gerçek pinch-zoom varken gerekir (vv.scale > 1).
    // Tarayıcı yakınlaştırması (Ctrl +/-) vv.scale'i değiştirmez; orada
    // vv.height ile innerHeight arasındaki kesirli fark titremeye yol açıyordu.
    if((vv.scale || 1) > 1.01){
      top = Math.round(vv.offsetTop || 0);
      bottom = Math.round((vv.offsetTop||0) + (vv.height||window.innerHeight) - window.innerHeight);
    }
    if(top === lastTop && bottom === lastBottom) return;
    lastTop = top; lastBottom = bottom;
    document.documentElement.style.setProperty('--vvy-top', top+'px');
    document.documentElement.style.setProperty('--vvy-bottom', bottom+'px');
  }
  function syncVisualViewport(){
    if(rafId) return;
    rafId = requestAnimationFrame(applyVisualViewport);
  }
  vv.addEventListener('resize', syncVisualViewport);
  vv.addEventListener('scroll', syncVisualViewport);
  applyVisualViewport();
})();

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
  // v1.0.1: Cihazın kendi saat dilimi ayarına bağımlı olmaktan çıkarıldı —
  // artık her zaman explicit 'Europe/Istanbul' kullanılıyor, cihaz yanlış
  // ayarlı olsa bile doğru sonuç garanti edilir.
  const d=new Date(dt);
  return d.toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric'})+' '+
    d.toLocaleTimeString('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'});
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
    loadTemasDashboard();
    initTemasPersonelFilter();
  }
  if(pid==='pagePipeline'){loadPipeline();initPpPersonelFilter();}
  if(pid==='pageDuyuru'){ if(typeof loadDuyurular==='function') loadDuyurular(); }
  if(pid==='pageFirsatForm'){if(reset)initFirsatForm();else initFirsatForm();}
  if(pid==='pageGorev'){initGorevModulu();}
  if(pid==='pageHangiMusteri'){ if(typeof initHangiMusteri==='function') initHangiMusteri(); }
  if(pid==='pageArama'){ if(typeof initAramaEkrani==='function') initAramaEkrani(); }
  if(pid==='pageSevkiyat'){ if(typeof initSevkiyatPage==='function') initSevkiyatPage(); }   // V31.65
  if(pid==='pageGorevAdmin'){renderGorevTipleriAdmin();}
  if(pid==='pageAdmin'){ adminMenueGeri(); }
  if(pid==='pageMusteri')initMusteriPage();
  if(pid==='pageMenuDonanim'){initDonanimPage();}
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