'use strict';
/* ===== ORTAK MÜŞTERİ ARAMA ===== */
// ===== ORTAK MÜŞTERİ ARAMA =====
// opts: { timerId, resultsId, onSelect, limit, useShowClass, promptId, promptBtnId, onPrompt }
const _searchTimers = {};
async function searchMusteri(val, opts){
  clearTimeout(_searchTimers[opts.timerId]);
  const r = document.getElementById(opts.resultsId);
  if(!r) return;
  const prompt = opts.promptId ? document.getElementById(opts.promptId) : null;
  if(val.length < 2){
    opts.useShowClass ? r.classList.remove('show') : (r.style.display='none');
    if(prompt) prompt.classList.add('hide');
    return;
  }
  _searchTimers[opts.timerId] = setTimeout(async()=>{
    const {data} = await getCustomerBaseQuery()
      .select('ncst,unvan')
      .or(`ncst.ilike.%${val}%,unvan.ilike.%${val}%`)
      .limit(opts.limit||20);
    if(!data?.length){
      opts.useShowClass ? r.classList.remove('show') : (r.style.display='none');
      if(prompt){
        prompt.classList.remove('hide');
        const btn = opts.promptBtnId ? document.getElementById(opts.promptBtnId) : null;
        if(btn && opts.onPrompt) btn.onclick = ()=>opts.onPrompt(val);
      }
      return;
    }
    if(prompt) prompt.classList.add('hide');
    // Fragment ile oluştur — addEventListener güvenli
    r.innerHTML = '';
    data.forEach(c=>{
      const div = document.createElement('div');
      if(opts.useShowClass){
        div.className = 'search-item';
        div.innerHTML = `${escapeHTML(c.unvan)}<span style="color:var(--text2);font-size:11px;margin-left:8px;">${c.ncst}</span>`;
      } else {
        div.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);';
        div.innerHTML = `<b>${escapeHTML(c.unvan||c.ncst)}</b> <span style="color:var(--text3);font-size:11px;">${c.ncst}</span>`;
        div.onmouseover = ()=>div.style.background='var(--navy3)';
        div.onmouseout = ()=>div.style.background='';
      }
      div.addEventListener('click', ()=>opts.onSelect(c));
      r.appendChild(div);
    });
    opts.useShowClass ? r.classList.add('show') : (r.style.display='');
  }, 300);
}

function searchPrMusteri(val){ searchMusteri(val,{timerId:'pr',resultsId:'prMusteriResults',onSelect:c=>selectPrMusteri(c.ncst,c.unvan||c.ncst)}); }
function searchRepMusteri(val){ searchMusteri(val,{timerId:'rep',resultsId:'repMusteriResults',onSelect:c=>selectRepMusteri(c.ncst,c.unvan||c.ncst)}); }
// v30.14: MY rolü için ayrı div içindeki input da destekleniyor
function searchPpMusteri(val,srcId){
  if(srcId==='ppMusteriAraMy'){
    const main=document.getElementById('ppMusteriAra');
    if(main) main.value=val;
  }
  searchMusteri(val,{timerId:'pp',resultsId:'ppMusteriResults',onSelect:c=>selectPpMusteri(c.ncst,c.unvan||c.ncst)});
}
// v30.14: MY rolü için ayrı div içindeki input da destekleniyor
function searchTmsMusteri(val,srcId){
  // tmsMusteriAraMy kullanılıyorsa val'i tmsMusteriAra'ya da yaz (NCST hidden input ortaktır)
  if(srcId==='tmsMusteriAraMy'){
    const main=document.getElementById('tmsMusteriAra');
    if(main) main.value=val;
  }
  searchMusteri(val,{timerId:'tms',resultsId:'tmsMusteriResults',onSelect:c=>selectTmsMusteri(c.ncst,c.unvan||c.ncst)});
}
function searchOppCust(val){ searchMusteri(val,{timerId:'opp',resultsId:'oppCustResults',useShowClass:true,limit:8,onSelect:c=>selectOppCust(c.ncst,c.unvan)}); }

function searchCustomers(val){ searchMusteri(val,{timerId:'temas',resultsId:'custResults',useShowClass:true,limit:10,promptId:'newCustPrompt',promptBtnId:'newCustPromptBtn',onPrompt:v=>selectNewCustomer(v),onSelect:c=>selC(c)}); }


function selectPrMusteri(ncst, unvan){
  prSecilenNcst=ncst;
  document.getElementById('prMusteriNcst').value=ncst;
  document.getElementById('prMusteriAra').value='';
  document.getElementById('prMusteriResults').style.display='none';
  const secili=document.getElementById('prMusteriSecili');
  if(secili){secili.style.display='';secili.textContent='🏢 '+unvan+' ('+ncst+')';}
}

function clearPrMusteri(){
  prSecilenNcst='';
  document.getElementById('prMusteriNcst').value='';
  document.getElementById('prMusteriAra').value='';
  document.getElementById('prMusteriResults').style.display='none';
  const secili=document.getElementById('prMusteriSecili');
  if(secili){secili.style.display='none';secili.textContent='';}
}


async function getTakimMyIds(takimLiderId){
  if(!takimLiderId) return [];
  const{data}=await sb.from('users').select('my_id').eq('takim_lideri_id',takimLiderId).eq('aktif',true);
  return (data||[]).map(u=>u.my_id);
}

async function _kcmChanged(prefix, onDone){
  const kcmId=document.getElementById(prefix+'KcmFilter')?.value||'';
  const takimSel=document.getElementById(prefix+'TakimFilter');
  if(takimSel){
    takimSel.innerHTML='<option value="">Tümü</option>';
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
    if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
  }
  const mySel=document.getElementById(prefix+'MyFilter');
  if(mySel){
    mySel.innerHTML='<option value="">Tümü</option>';
    let q2=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
    if(kcmId) q2=q2.eq('kcm_id',parseInt(kcmId));
    const{data:myler}=await q2.order('ad_soyad');
    (myler||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
  }
  if(onDone) onDone();
}

async function _takimChanged(prefix, onDone){
  const takimId=document.getElementById(prefix+'TakimFilter')?.value||'';
  const kcmId=document.getElementById(prefix+'KcmFilter')?.value||'';
  const mySel=document.getElementById(prefix+'MyFilter');
  if(!mySel) return;
  mySel.innerHTML='<option value="">Tümü</option>';
  let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
  if(takimId) q=q.eq('takim_lideri_id',parseInt(takimId));
  else if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
  else if(currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
  const{data}=await q.order('ad_soyad');
  (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
  if(onDone) onDone();
}

function prKcmChanged(){ _kcmChanged('pr', fetchPipelineReport); }
function repKcmChanged(){ _kcmChanged('rep', null); }
function prTakimChanged(){ _takimChanged('pr', fetchPipelineReport); }
function repTakimChanged(){ _takimChanged('rep', null); }

let repMusteriTimer=null;


function selectRepMusteri(ncst,unvan){
  document.getElementById('repMusteriNcst').value=ncst;
  document.getElementById('repMusteriAra').value='';
  document.getElementById('repMusteriResults').style.display='none';
  const s=document.getElementById('repMusteriSecili');
  if(s){s.style.display='';s.textContent='🏢 '+unvan+' ('+ncst+')';}
}

function clearRepMusteri(){
  document.getElementById('repMusteriNcst').value='';
  document.getElementById('repMusteriAra').value='';
  document.getElementById('repMusteriResults').style.display='none';
  const s=document.getElementById('repMusteriSecili');
  if(s){s.style.display='none';s.textContent='';}
}

function setRepPeriod(p,el){
  document.querySelectorAll('.form-section .chip-btn').forEach(b=>{
    if(b.onclick?.toString().includes('setRepPeriod')) b.classList.remove('active');
  });
  el?.classList.add('active');
  const now=new Date();
  const sd=document.getElementById('repStartDate');
  const ed=document.getElementById('repEndDate');
  if(p==='bugun'){sd.value=ed.value=now.toISOString().slice(0,10);}
  else if(p==='hafta'){
    const mon=new Date(now); mon.setDate(now.getDate()-now.getDay()+1);
    sd.value=mon.toISOString().slice(0,10); ed.value=now.toISOString().slice(0,10);
  } else if(p==='ay'){
    sd.value=now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-01';
    ed.value=now.toISOString().slice(0,10);
  }
}



async function initTemasRapor(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const full=['ADMIN','SATIŞ DİREKTÖRÜ','KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ','SATIŞ DESTEK','TAKIM LİDERİ'];
  const myRoller=['MY','FMY','USER'];

  // KÇM - sadece admin/koordinatör
  const kcmDiv=document.getElementById('repKcmFilterDiv');
  if(kcmDiv){
    if(full.includes(r)){
      kcmDiv.style.display='';
      const kcmSel=document.getElementById('repKcmFilter');
      if(kcmSel&&kcmSel.options.length<=1){
        const{data:kcmler}=await sb.from('kcm_groups').select('*').order('kcm_id');
        (kcmler||[]).forEach(k=>{const o=document.createElement('option');o.value=k.kcm_id;o.textContent=k.kcm_adi;kcmSel.appendChild(o);});
      }
    } else { kcmDiv.style.display='none'; }
  }

  // Takım Lideri - MY hariç
  const takimDiv=document.getElementById('repTakimFilterDiv');
  if(takimDiv){
    if(!myRoller.includes(r)){
      takimDiv.style.display='';
      const takimSel=document.getElementById('repTakimFilter');
      if(takimSel&&takimSel.options.length<=1){
        let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
        if(!full.includes(r)&&currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
        const{data}=await q.order('ad_soyad');
        (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
      }
    } else { takimDiv.style.display='none'; }
  }

  // MY - MY hariç
  const myDiv=document.getElementById('repMyFilterDiv');
  if(myDiv){
    if(!myRoller.includes(r)){
      myDiv.style.display='';
      const mySel=document.getElementById('repMyFilter');
      if(mySel&&mySel.options.length<=1){
        let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
        if(!full.includes(r)&&currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
        const{data}=await q.order('ad_soyad');
        (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
      }
    } else { myDiv.style.display='none'; }
  }
}


let ppMusteriTimer=null;
let ppSecilenNcst='';



function selectPpMusteri(ncst,unvan){
  ppSecilenNcst=ncst;
  document.getElementById('ppMusteriNcst').value=ncst;
  document.getElementById('ppMusteriAra').value='';
  document.getElementById('ppMusteriResults').style.display='none';
  const s=document.getElementById('ppMusteriSecili');
  if(s){s.style.display='';s.textContent='🏢 '+unvan+' ('+ncst+')';}
  loadPipeline();
}

function clearPpMusteri(srcId){
  ppSecilenNcst='';
  const ncstEl=document.getElementById('ppMusteriNcst');
  if(ncstEl) ncstEl.value='';
  const araEl=document.getElementById('ppMusteriAra');
  if(araEl) araEl.value='';
  const araMyEl=document.getElementById('ppMusteriAraMy');
  if(araMyEl) araMyEl.value='';
  const res=document.getElementById('ppMusteriResults');
  if(res) res.style.display='none';
  const s=document.getElementById('ppMusteriSecili');
  if(s){s.style.display='none';s.textContent='';}
  loadPipeline();
}


let tmsMusteriTimer=null;
let tmsSecilenNcst='';



function selectTmsMusteri(ncst,unvan){
  tmsSecilenNcst=ncst;
  document.getElementById('tmsMusteriNcst').value=ncst;
  document.getElementById('tmsMusteriAra').value='';
  document.getElementById('tmsMusteriResults').style.display='none';
  const s=document.getElementById('tmsMusteriSecili');
  if(s){s.style.display='';s.textContent='🏢 '+unvan+' ('+ncst+')';}
  renderTemasList();
}

function clearTmsMusteri(srcId){
  tmsSecilenNcst='';
  const ncstEl=document.getElementById('tmsMusteriNcst');
  if(ncstEl) ncstEl.value='';
  const araEl=document.getElementById('tmsMusteriAra');
  if(araEl) araEl.value='';
  const araMyEl=document.getElementById('tmsMusteriAraMy');
  if(araMyEl) araMyEl.value='';
  const res=document.getElementById('tmsMusteriResults');
  if(res) res.style.display='none';
  const s=document.getElementById('tmsMusteriSecili');
  if(s){s.style.display='none';s.textContent='';}
  renderTemasList();
}



/* ===== FIRSAT FORMU YARDIMCILARI ===== */
// ===== FIRSAT FORMU (TAM SAYFA) =====



function setPpZaman(val, el){
  document.querySelectorAll('#pagePipeline .chip-btn[onclick*="setPpZaman"]').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  ppTimeFilter = val==='ozel' ? 'tarih' : val;
  const now=new Date();
  const sd=document.getElementById('ppStartDate');
  const ed=document.getElementById('ppEndDate');
  const tarihDiv=document.getElementById('ppTarihArasiDiv');
  if(val==='tumu'){
    if(sd) sd.value=''; if(ed) ed.value='';
    if(tarihDiv) tarihDiv.classList.add('hide');
  } else if(val==='ay'){
    if(sd) sd.value=now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-01';
    if(ed) ed.value=now.toISOString().slice(0,10);
    if(tarihDiv) tarihDiv.classList.add('hide');
  } else if(val==='hafta'){
    const mon=new Date(now); mon.setDate(now.getDate()-now.getDay()+1);
    if(sd) sd.value=mon.toISOString().slice(0,10);
    if(ed) ed.value=now.toISOString().slice(0,10);
    if(tarihDiv) tarihDiv.classList.add('hide');
  } else if(val==='bugun'){
    if(sd) sd.value=now.toISOString().slice(0,10);
    if(ed) ed.value=now.toISOString().slice(0,10);
    if(tarihDiv) tarihDiv.classList.add('hide');
  } else if(val==='ozel'){
    if(tarihDiv) tarihDiv.classList.remove('hide');
    return; // Kullanıcı tarihleri seçip Filtrele butonuna basacak
  }
  loadPipeline();
}


let firsatSelectedMusteri=null;
let firsatSecilenKontaklar=new Map();
let firsatSelectedAdim='Fırsat';
let firsatUrunCount=0;


async function selFirsatC(c){if(typeof c==='string'){const{data}=await sb.from('customers').select('*').eq('ncst',c).single();if(data)c=data;else return;}firsatSelectedMusteri=c;document.getElementById('firsatSelCustNameHtml').innerHTML=renderCustomerSummaryHTML(c);document.getElementById('firsatSelectedCustBox').classList.remove('hide');document.getElementById('firsatCustSearchBox').classList.add('hide');document.getElementById('firsatCustResults').classList.remove('show');document.getElementById('firsatRestOfForm').classList.remove('hide');await loadFirsatKontaklar(c.ncst);}

function toggleContactSelect(id,name){
  const el=document.getElementById('citem_'+id);
  if(selectedContactsMap.has(id)){
    selectedContactsMap.delete(id);
    el.classList.remove('selected');
    el.querySelector('.c-check').classList.add('hide');
  }else{
    selectedContactsMap.set(id,name);
    el.classList.add('selected');
    el.querySelector('.c-check').classList.remove('hide');
  }
  // v30.23: Kontak seçimine göre form alanlarını aç/kilitle
  _updateKontakFormState();
}

function _updateKontakFormState(){
  const hasKontak = selectedContactsMap.size > 0;
  // Kontak seçilmemişse uyarı göster, form alanlarını kilitle
  const uyariEl = document.getElementById('kontakZorunluUyari');
  if(uyariEl) uyariEl.style.display = hasKontak ? 'none' : '';
  // Kaydet butonu
  const saveBtn = document.getElementById('saveTemasBtn');
  if(saveBtn) saveBtn.disabled = !hasKontak;
  // Gerçekleşen alanlar (sonuç, notlar vb.) — kontak olmadan gri
  const gerceklesenEl = document.getElementById('gerceklesenAlanlar');
  if(gerceklesenEl){
    gerceklesenEl.style.opacity = hasKontak ? '' : '0.4';
    gerceklesenEl.style.pointerEvents = hasKontak ? '' : 'none';
  }
}


function searchFirsatCust(val){ searchMusteri(val,{timerId:'firsat',resultsId:'firsatCustResults',useShowClass:true,limit:10,promptId:'firsatNewCustPrompt',promptBtnId:'firsatNewCustPromptBtn',onPrompt:v=>selectNewCustomer(v),onSelect:c=>selFirsatC(c)}); }


function updateFirsatUrunRowType(id){_urunSatiriTipGuncelle(id);}

function updateFirsatUrunRow(id){_urunSatiriTipGuncelle(id);}

// openYeniFirsatKontak - aşağıda tanımlı


// ===== FIRSAT FORMU (TAM SAYFA) =====
let firsatUrunSayac=0;

async function initFirsatForm(prefillNcst=null){
  firsatSelectedMusteri=null;
  firsatSecilenKontaklar=new Map();
  firsatSelectedAdim='Fırsat';
  firsatUrunSayac=0;
  // Formu sıfırla
  const els=['firsatCustSearch','firsatAciklama','firsatKapanis'];
  els.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('firsatCustResults').innerHTML='';
  document.getElementById('firsatSelectedCustBox')?.classList.add('hide');
  document.getElementById('firsatCustSearchBox')?.classList.remove('hide');
  document.getElementById('firsatRestOfForm')?.classList.add('hide');
  document.getElementById('firsatUrunListesi').innerHTML='';
  // Adım sıfırla
  document.querySelectorAll('#pageFirsatForm .chip-btn:not(.olasilik-btn)').forEach(b=>b.classList.remove('selected'));
  document.getElementById('firsatAdimFirsat')?.classList.add('selected');
  // Olasılık sıfırla
  selectFirsatOlasilik(10);
  // İlk ürün satırı
  addFirsatUrunRow();
  // Müşteri listesi
  loadDefaultCustomers('firsatDefaultCustList','selFirsatC');
  // Prefill
  if(prefillNcst){
    const{data}=await sb.from('customers').select('*').eq('ncst',prefillNcst).single();
    if(data) selFirsatC(data);
  }
}



function clearFirsatCustomer(){firsatSelectedMusteri=null;firsatSecilenKontaklar=new Map();document.getElementById('firsatSelectedCustBox').classList.add('hide');document.getElementById('firsatCustSearchBox').classList.remove('hide');document.getElementById('firsatRestOfForm').classList.add('hide');document.getElementById('firsatCustSearch').value='';loadDefaultCustomers('firsatDefaultCustList','selFirsatC');}




async function loadFirsatKontaklar(ncst){
  const container=document.getElementById('firsatKontakListesi');
  container.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  selectedContactsMap.clear();
  const{data}=await sb.from('contacts').select('*').eq('ncst',ncst).neq('aktif',false).order('ad_soyad');
  if(data&&data.length>0){
    container.innerHTML=data.map(c=>renderKontakItemForForm(c,'toggleFirsatKontak','firsatCcheck')).join('');
  } else {
    container.innerHTML='<div style="padding:8px;font-size:12px;color:var(--text3);">Kontak yok. Yeni kontak ekleyin.</div>';
  }
}



function toggleFirsatKontak(id, name){
  const el=document.getElementById('citem_'+id);
  const chk=document.getElementById('firsatCcheck_'+id);
  if(firsatSecilenKontaklar.has(id)){
    firsatSecilenKontaklar.delete(id);
    el?.classList.remove('selected');
    chk?.classList.add('hide');
  } else {
    firsatSecilenKontaklar.set(id,name);
    el?.classList.add('selected');
    chk?.classList.remove('hide');
  }
}

function openYeniKontakModal(source){
  const ncst = source==='temas' ? selectedCustomer?.ncst
             : source==='firsat_form' ? firsatSelectedMusteri?.ncst
             : source==='firsat' ? oppSelectedNcst
             : selectedMusteri?.ncst;
  if(!ncst){toast('Önce müşteri seçin','error');return;}
  window._newKontakNcst = ncst;
  window._newKontakSource = source;
  window._editingKontakId = null;
  ['newContactName','newContactTitle','newContactPhone','newContactEmail'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  openModal('newContactModal');
}

function openYeniFirsatKontak(){ openYeniKontakModal('firsat_form'); }

function setFirsatAdim(adim, el){
  firsatSelectedAdim=adim;
  document.querySelectorAll('#pageFirsatForm .chip-btn:not(.olasilik-btn)').forEach(b=>b.classList.remove('selected'));
  el?.classList.add('selected');
  const map={'Fırsat':10,'Teklif':25,'Beyan':50,'Evrak':75};
  if(map[adim]) selectFirsatOlasilik(map[adim]);
}

function selectFirsatOlasilik(val){
  document.querySelectorAll('#pageFirsatForm .olasilik-btn').forEach(b=>{
    b.classList.toggle('selected', parseInt(b.dataset.val)===parseInt(val));
  });
  document.getElementById('firsatOlasilik').value=val;
}

function addFirsatUrunRow(urunAdi='',adet=1,tutar=0){firsatUrunSayac++;_urunSatiriEkle({prefix:'furow_',containerId:'firsatUrunListesi',rowsArr:null,removeFn:null,updateFn:'_urunSatiriTipGuncelle',urunAdi,adet,tutar,sayac:firsatUrunSayac});}

function updateFirsatUrunTip(id){_urunSatiriTipGuncelle(id);}

function getFirsatUrunData(){return _urunSatiriGetData('firsatUrunListesi',false);}




// ===== PORTFÖY YÖNETİMİ =====
// portfoyData rapor.js'de tanımlı


/* ===== MÜŞTERİ MODÜLÜ ===== */
/* ===== MÜŞTERİ MODÜLÜ ===== */
let selectedMusteri = null;
let musteriSearchTimer = null;
let musteriPage = 0;
const MUSTERI_PAGE_SIZE = 10;
let musteriAllLoaded = false;

async function initMusteriPage(){
  if(kcmMyIds.length === 0) await loadKcmMyIds();
  musteriPage = 0; musteriAllLoaded = false;
  selectedMusteri = null;
  const lb = document.getElementById('musteriSelBox'); if(lb) lb.classList.add('hide');
  const db = document.getElementById('musteriDetailBox'); if(db) db.classList.add('hide');
  const sb2 = document.getElementById('musteriSearchBox'); if(sb2) sb2.classList.remove('hide');
  const si = document.getElementById('musteriSearchInp'); if(si) si.value='';
  const lo = document.getElementById('musteriListeOzetRow'); if(lo) lo.style.display='grid';
  const ko = document.getElementById('musteriKartOzetRow'); if(ko) ko.style.display='none';
  const tab = document.getElementById('musteriTabMusteri'); if(tab) tab.style.display='';
  const btn = document.getElementById('mTabMusteri'); if(btn) btn.classList.add('active');

  // v30.22: Müşteri filtresi — ortak initPersonelFiltre kullanıyor
  await initPersonelFiltre({
    filterDivId:'musteriFilterDiv',
    kcmDivId:'musteriKcmFilterDiv', kcmSelId:'musteriKcmFilter',
    takimDivId:'musteriTakimFilterDiv', takimSelId:'musteriTakimFilter',
    myDivId:'musteriMyFilterDiv', mySelId:'musteriMyFilter'
  });
  // MY listesi ayrıca yükleniyor (aktif olmayanlar dahil)
  const mySel=document.getElementById('musteriMyFilter');
  if(mySel&&mySel.options.length<=1) await musteriMyListYukle();

  await loadMusteriOzetler();
  await loadMusteriDefault();
}

function switchMusteriTab(tab){
  ['musteri','kontak'].forEach(t=>{
    const panel = document.getElementById('musteriTab'+capitalize(t));
    const btn = document.getElementById('mTab'+capitalize(t));
    if(panel) panel.style.display = t===tab ? '' : 'none';
    if(btn) btn.classList.toggle('active', t===tab);
  });
  if(tab==='kontak') loadKontaklar();
}

async function loadMusteriOzetler(){
  try{
    // Filtre select değerleri
    const fMyId = document.getElementById('musteriMyFilter')?.value||'';
    const fTakimId = document.getElementById('musteriTakimFilter')?.value||'';
    const fKcmId = document.getElementById('musteriKcmFilter')?.value||'';

    // Müşteri sayısı
    const _scope = getScope('musteri');
    let toplamC = 0;
    let _ncstList = null;

    if(fMyId){
      const {count} = await sb.from('customers').select('*',{count:'exact',head:true}).eq('aktif',true).eq('my_id',parseInt(fMyId));
      toplamC = count||0;
    } else if(fTakimId){
      const{data:tm}=await sb.from('users').select('my_id').eq('takim_lideri_id',parseInt(fTakimId)).eq('aktif',true);
      const ids=(tm||[]).map(u=>u.my_id);
      if(ids.length){const{count}=await sb.from('customers').select('*',{count:'exact',head:true}).eq('aktif',true).in('my_id',ids);toplamC=count||0;}
    } else if(fKcmId){
      const {count} = await sb.from('customers').select('*',{count:'exact',head:true}).eq('aktif',true).eq('kcm_id',parseInt(fKcmId));
      toplamC = count||0;
    } else if(_scope==='TÜM'){
      const {count} = await sb.from('customers').select('*',{count:'exact',head:true}).eq('aktif',true);
      toplamC = count||0;
    } else if(_scope==='KÇM'){
      const r2=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
      if(r2==='MY'||r2==='USER'){
        const {count:myCount} = await sb.from('customers').select('*',{count:'exact',head:true}).eq('my_id',currentUser.my_id).eq('aktif',true);
        toplamC = myCount||0;
      } else {
        const {count:kcmCount} = await sb.from('customers').select('*',{count:'exact',head:true}).eq('kcm_id',currentUser.kcm_id).eq('aktif',true);
        toplamC = kcmCount||0;
      }
    } else {
      const {count:prtCount} = await sb.from('customers').select('*',{count:'exact',head:true}).eq('my_id',currentUser.my_id).eq('aktif',true);
      toplamC = prtCount||0;
    }
    document.getElementById('moToplamMusteri').textContent = toplamC;

    // Temas ve fırsat sorguları - filtre varsa uygula, yoksa applyRBAC
    const birYilOnce = new Date(); birYilOnce.setFullYear(birYilOnce.getFullYear()-1);
    let temasQ = sb.from('visits').select('ncst,durum').eq('durum','Gerçekleşti').gte('tarih_saat', birYilOnce.toISOString()).limit(100000);
    let temasPlanlananQ = sb.from('visits').select('ncst,durum').eq('durum','Planlandı').limit(100000);
    let oppQ = sb.from('opportunities').select('adim,durum,beklenen_ciro').limit(100000);

    if(fMyId){
      temasQ=temasQ.eq('my_id',parseInt(fMyId));
      temasPlanlananQ=temasPlanlananQ.eq('my_id',parseInt(fMyId));
      oppQ=oppQ.eq('my_id',parseInt(fMyId));
    } else if(fTakimId){
      const{data:tm}=await sb.from('users').select('my_id').eq('takim_lideri_id',parseInt(fTakimId)).eq('aktif',true);
      const ids=(tm||[]).map(u=>u.my_id);
      if(ids.length){temasQ=temasQ.in('my_id',ids);temasPlanlananQ=temasPlanlananQ.in('my_id',ids);oppQ=oppQ.in('my_id',ids);}
    } else if(fKcmId){
      temasQ=temasQ.eq('kcm_id',parseInt(fKcmId));
      temasPlanlananQ=temasPlanlananQ.eq('kcm_id',parseInt(fKcmId));
      oppQ=oppQ.eq('kcm_id',parseInt(fKcmId));
    } else {
      temasQ = applyRBAC(temasQ);
      temasPlanlananQ = applyRBAC(temasPlanlananQ);
      oppQ = applyRBAC(oppQ);
    }
    const [{data:temasGercekData},{data:temasPlanlananData}] = await Promise.all([temasQ, temasPlanlananQ]);
    const temasData = [...(temasGercekData||[]), ...(temasPlanlananData||[])];
    const temasGercekC = (temasData||[]).filter(v=>v.durum==='Gerçekleşti').length;
    const temasPlanlananC = (temasData||[]).filter(v=>v.durum==='Planlandı').length;
    const moTG=document.getElementById('moTemasGercek');
    const moTP=document.getElementById('moTemasPlanlanan');
    if(moTG) moTG.textContent = temasGercekC;
    if(moTP) moTP.textContent = temasPlanlananC;
    const {data:oppData2} = await oppQ;
    const oppData = oppData2||[];
    const getAdim = o => o.adim||o.durum||'Fırsat';
    const cnt = a => oppData.filter(o=>getAdim(o)===a).length;
    document.getElementById('moFirsat').textContent = cnt('Fırsat');
    document.getElementById('moTeklif').textContent = cnt('Teklif');
    document.getElementById('moBeyan').textContent = cnt('Beyan');
    document.getElementById('moEvrak').textContent = cnt('Evrak');
    // Kutulara tıklama - pipeline filtreli aç (hem mo hem mk id'leri)
    [
      {adim:'Fırsat',      ids:['moFirsat','mkFirsat']},
      {adim:'Teklif',      ids:['moTeklif','mkTeklif']},
      {adim:'Beyan',       ids:['moBeyan','mkBeyan']},
      {adim:'Evrak',       ids:['moEvrak','mkEvrak']},
      {adim:'Gerçekleşen', ids:['moGerceklesen','mkGerceklesen']},
    ].forEach(({adim,ids})=>{
      ids.forEach(id=>{
        const el=document.getElementById(id);
        if(el){
          el.parentElement.style.cursor='pointer';
          el.parentElement.onclick=()=>{
            ppAdimSec=adim;
            ppAdimFilter=adim;
            navTo('pagePipeline');
          };
        }
      });
    });
    // Gerçekleşen ve Pipeline tutarı
    const gerceklesC = cnt('Gerçekleşen');
    const elGerceklesen = document.getElementById('moGerceklesen');
    if(elGerceklesen) elGerceklesen.textContent = gerceklesC;
    const pipelineTutar = oppData
      .filter(o=>!['Gerçekleşen','İptal'].includes(getAdim(o)))
      .reduce((sum,o)=>sum+(o.beklenen_ciro||0),0);
    const elPipeline = document.getElementById('moPipeline');
    if(elPipeline) elPipeline.textContent = fmtTL(pipelineTutar);
  }catch(e){ console.error('Özet yüklenemedi:',e); }
}

async function loadMusteriKartOzet(ncst){
  try{
    const [
      {count:temasGercek},
      {count:temasPlanlanan},
      {data:oppData},
      {data:custData}
    ] = await Promise.all([
      sb.from('visits').select('durum',{count:'exact',head:true}).eq('ncst',ncst).eq('durum','Gerçekleşti'),
      sb.from('visits').select('durum',{count:'exact',head:true}).eq('ncst',ncst).eq('durum','Planlandı'),
      sb.from('opportunities').select('adim,durum').eq('ncst',ncst),
      sb.from('customers').select('my_id,unvan').eq('ncst',ncst).single()
    ]);

    const getAdim = o => o.adim||o.durum||'Fırsat';
    const cnt = a => (oppData||[]).filter(o=>getAdim(o)===a).length;
    document.getElementById('mkTemasGercek').textContent = temasGercek||0;
    document.getElementById('mkTemasPlanlanan').textContent = temasPlanlanan||0;
    document.getElementById('mkFirsat').textContent = cnt('Fırsat');
    document.getElementById('mkTeklif').textContent = cnt('Teklif');
    document.getElementById('mkBeyan').textContent = cnt('Beyan');
    document.getElementById('mkEvrak').textContent = cnt('Evrak');
    document.getElementById('mkGerceklesen').textContent = cnt('Gerçekleşen');
    // Liste özeti gizle, kart özeti göster
    document.getElementById('musteriListeOzetRow').style.display = 'none';
    document.getElementById('musteriKartOzetRow').style.display = 'grid';
  }catch(e){ console.warn('Kart özet yüklenemedi:',e); }
}

async function musteriMyListYukle(){
  const mySel=document.getElementById('musteriMyFilter');
  if(!mySel) return;
  const takimId=document.getElementById('musteriTakimFilter')?.value||'';
  const kcmId=document.getElementById('musteriKcmFilter')?.value||'';
  mySel.innerHTML='<option value="">Tüm MY\'ler</option>';
  let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
  if(takimId) q=q.eq('takim_lideri_id',parseInt(takimId));
  else if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
  else if(currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
  const{data}=await q.order('ad_soyad');
  (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
}

// v30.11: Ortak KÇM dropdown güncelleyicisi + müşteri özgü yenileme
async function musteriKcmChanged(){
  const kcmId=document.getElementById('musteriKcmFilter')?.value||'';
  await _hiyerarsikKcmChanged('musteriKcmFilter','musteriTakimFilter','musteriMyFilter', null);
  musteriPage=0; musteriAllLoaded=false;
  await loadMusteriDefault();
  loadMusteriOzetler();
}

async function musteriTakimChanged(){
  await _hiyerarsikTakimChanged('musteriTakimFilter','musteriKcmFilter','musteriMyFilter', null);
  musteriPage=0; musteriAllLoaded=false;
  await loadMusteriDefault();
  loadMusteriOzetler();
}

async function loadMusteriDefault(append=false){
  if(musteriAllLoaded) return;
  if(Object.keys(myIdToName).length===0) await loadKcmMyIds();
  const c = document.getElementById('musteriDefaultList');
  if(!append) c.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const _rDef=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const myFilterVal=document.getElementById('musteriMyFilter')?.value||'';
  const takimFilterVal=document.getElementById('musteriTakimFilter')?.value||'';
  const kcmFilterVal=document.getElementById('musteriKcmFilter')?.value||'';
  let defQ = getCustomerBaseQuery();
  // MY rolü: varsayılan olarak kendi portföyü, filtre seçilmişse o MY'nin portföyü
  if(_rDef==='MY'||_rDef==='USER'){
    const hedefMyId = myFilterVal ? parseInt(myFilterVal) : currentUser.my_id;
    defQ = sb.from('customers').select('ncst,my_id,kcm_id,unvan,il,ilce,musteri_tipi,aktif').eq('aktif',true).eq('my_id',hedefMyId);
  } else {
    if(myFilterVal) defQ=defQ.eq('my_id',parseInt(myFilterVal));
    else if(takimFilterVal){
      const{data:takimMyler}=await sb.from('users').select('my_id').eq('takim_lideri_id',parseInt(takimFilterVal));
      const ids=(takimMyler||[]).map(u=>u.my_id);
      if(ids.length) defQ=defQ.in('my_id',ids);
    } else if(kcmFilterVal) defQ=defQ.eq('kcm_id',parseInt(kcmFilterVal));
  }
  const {data} = await defQ.order('guncelleme_tarihi',{ascending:false,nullsFirst:false}).order('unvan').range(musteriPage*MUSTERI_PAGE_SIZE, (musteriPage+1)*MUSTERI_PAGE_SIZE-1).limit(MUSTERI_PAGE_SIZE);
  if(!data || data.length===0){
    if(!append) c.innerHTML = '<div class="empty">Müşteri bulunamadı.</div>';
    musteriAllLoaded = true; return;
  }
  if(data.length < MUSTERI_PAGE_SIZE) musteriAllLoaded = true;
  const html = data.map(d=>{
    const myAd = d.my_id ? (myIdToName[d.my_id]||'') : '';
    return `<div class="visit-card" onclick="selectMusteri('${d.ncst}')">
      <div class="visit-firm">${escapeHTML(d.unvan)}</div>
      <div class="visit-my" style="display:flex;justify-content:space-between;align-items:center;">
        <span>NCST: ${d.ncst}${d.il?' | '+escapeHTML(d.il):''}</span>
        ${myAd?`<span style="font-size:11px;color:var(--text2);">👤 ${escapeHTML(myAd)}</span>`:''}
      </div>
      ${d.musteri_tipi?`<div style="font-size:11px;color:var(--text3);margin-top:2px;">${escapeHTML(d.musteri_tipi)}</div>`:''}
    </div>`;
  }).join('');
  if(append) c.innerHTML += html;
  else c.innerHTML = html;
  if(!musteriAllLoaded){
    c.innerHTML += `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" onclick="loadMoreMusteri()">Daha Fazla Yükle</button>`;
  }
  musteriPage++;
}

async function loadMoreMusteri(){
  // load more butonunu kaldır
  const btn = document.getElementById('musteriDefaultList').querySelector('button');
  if(btn) btn.remove();
  await loadMusteriDefault(true);
}

async function onMusteriSearch(val){
  clearTimeout(musteriSearchTimer);
  const r = document.getElementById('musteriSearchResults');
  if(val.length < 2){
    r.classList.remove('show');
    musteriPage=0; musteriAllLoaded=false;
    await loadMusteriDefault();
    return;
  }
  document.getElementById('musteriDefaultList').innerHTML = '';
  musteriSearchTimer = setTimeout(async()=>{
    const {data} = await getCustomerBaseQuery()
      .or(`ncst.ilike.%${val}%,unvan.ilike.%${val}%,vergi_no.ilike.%${val}%`)
      .limit(10);
    if(!data || !data.length){
      r.innerHTML = `<div class="search-item" style="color:var(--text2);">Bulunamadı — <span style="color:var(--blue);cursor:pointer;" onclick="openYeniMusteriModal('${val.replace(/'/g,"\'")}')">+ Yeni müşteri ekle</span></div>`;
      r.classList.add('show');
      return;
    }
    r.innerHTML = data.map(c=>`
      <div class="search-item" onclick='selectMusteri(${JSON.stringify(c.ncst)})'>${escapeHTML(c.unvan)}<span style="font-size:11px;color:var(--text2);margin-left:8px;">${c.ncst}</span></div>
    `).join('');
    r.classList.add('show');
  }, 300);
}

async function selectMusteri(ncst){
  document.getElementById('musteriSearchResults').classList.remove('show');
  document.getElementById('musteriSearchInp').value = '';
  document.getElementById('musteriDefaultList').innerHTML = '';
  const {data, error} = await sb.from('customers').select('*').eq('ncst', ncst).single();
  if(error || !data){ toast('Müşteri yüklenemedi', 'error'); return; }
  selectedMusteri = data;
  document.getElementById('musteriSearchBox').classList.add('hide');
  document.getElementById('musteriSelBox').classList.remove('hide');
  document.getElementById('musteriSelNameHtml').innerHTML = renderCustomerSummaryHTML(data);
  document.getElementById('musteriDetailBox').classList.remove('hide');
  await Promise.all([
    loadMusteriKartOzet(ncst),
    loadMusteriKontaklar(ncst),
    loadMusteriTemas(ncst),
    loadMusteriFirsatlar(ncst)
  ]);
}

function clearMusteriSel(){
  selectedMusteri = null;
  document.getElementById('musteriSelBox').classList.add('hide');
  document.getElementById('musteriDetailBox').classList.add('hide');
  document.getElementById('musteriSearchBox').classList.remove('hide');
  document.getElementById('musteriSearchInp').value = '';
  document.getElementById('musteriSearchResults').classList.remove('show');
  // Kart özetini gizle, liste özetini göster
  const listeOzet=document.getElementById('musteriListeOzetRow');
  const kartOzet=document.getElementById('musteriKartOzetRow');
  if(listeOzet)listeOzet.style.display='grid';
  if(kartOzet)kartOzet.style.display='none';
  musteriPage=0; musteriAllLoaded=false;
  // loadMusteriDefault initMusteriPage'de çağrılıyor
}

async function loadMusteriKontaklar(ncst){
  const c = document.getElementById('musteriKontakListesi');
  c.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const {data} = await sb.from('contacts').select('*').eq('ncst', ncst).neq('aktif',false).order('ad_soyad');
  if(!data || !data.length){
    c.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Kontak yok.</div>';
    return;
  }
  // İlk 3 görünür, kalanlar gizli
  const ilk3 = data.slice(0,3);
  const kalanlar = data.slice(3);
  c.innerHTML = ilk3.map(k=>renderKontakKarti(k, ncst)).join('') +
    (kalanlar.length ? `
      <div id="kalanKontaklar" class="hide">${kalanlar.map(k=>renderKontakKarti(k,ncst)).join('')}</div>
      <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:4px;" onclick="document.getElementById('kalanKontaklar').classList.remove('hide');this.remove()">
        Tümünü Gör (${kalanlar.length} kişi daha)
      </button>` : '');
}

function renderKontakKarti(k, ncst){
  return `<div class="visit-card" id="citem_${k.contact_id}" style="margin-bottom:7px;cursor:pointer;" onclick="openKontakDetay(${k.contact_id})">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:14px;font-weight:700;">${escapeHTML(k.ad_soyad)}</div>
        <div style="font-size:12px;color:var(--text2);">${escapeHTML(k.gorev_unvani||'—')}</div>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="icon-btn" onclick="event.stopPropagation();openEditKontakModal(${k.contact_id})" title="Düzenle">✏️</button>
        <button onclick="event.stopPropagation();deleteKontakFromForm(${k.contact_id},'${escapeHTML(k.ad_soyad)}')" style="background:rgba(255,80,80,.15);border:1px solid var(--red);border-radius:6px;cursor:pointer;font-size:12px;padding:3px 7px;color:var(--red);" title="Sil">🗑</button>
      </div>
    </div>
    ${k.telefon?`<div style="font-size:12px;color:var(--blue);margin-top:4px;">📞 ${escapeHTML(k.telefon)}</div>`:''}
    ${k.email?`<div style="font-size:12px;color:var(--text2);">✉️ ${escapeHTML(k.email)}</div>`:''}
  </div>`;
}

async function openKontakDetay(contactId){
  const {data:k} = await sb.from('contacts').select('*').eq('contact_id',contactId).single();
  if(!k) return;
  // Kontak detay modalını aç
  document.getElementById('kdAd').textContent = k.ad_soyad||'—';
  document.getElementById('kdGorev').textContent = k.gorev_unvani||'—';
  document.getElementById('kdTel').textContent = k.telefon||'—';
  document.getElementById('kdEmail').textContent = k.email||'—';
  document.getElementById('kdMusteriBtn').onclick = ()=>{ closeModal('modalKontakDetay'); selectMusteri(k.ncst); };
  // Müşteri adını yükle
  if(k.ncst){
    const {data:cust} = await sb.from('customers').select('unvan').eq('ncst',k.ncst).single();
    document.getElementById('kdMusteri').textContent = cust?.unvan||k.ncst;
  }
  window._editingKontakId = contactId;
  openModal('modalKontakDetay');
}

async function loadMusteriTemas(ncst){
  const c = document.getElementById('musteriTemasListesi');
  c.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const {data} = await sb.from('visits')
    .select('visit_id,tarih_saat,temas_turu,ziyaret_amaci,ziyaret_sonucu,durum')
    .eq('ncst', ncst).order('tarih_saat',{ascending:false}).limit(10);
  if(!data || !data.length){ c.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Kayıt yok.</div>'; return; }
  c.innerHTML = data.map(v=>{
    const tarih = v.tarih_saat ? new Date(v.tarih_saat).toLocaleDateString('tr-TR') : '—';
    const tagCls = v.durum==='Planlandı'?'tag-amber':'tag-green';
    return `<div class="visit-card" style="margin-bottom:7px;cursor:pointer;" onclick="showEditVisitModalById(${v.visit_id})">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="visit-firm" style="font-size:13px;">${escapeHTML(v.ziyaret_amaci||'—')}</div>
        <span class="tag ${tagCls}" style="flex-shrink:0;">${escapeHTML(v.durum||'')}</span>
      </div>
      <div class="visit-my">${tarih} | ${escapeHTML(v.temas_turu||'')}</div>
      ${v.ziyaret_sonucu?`<div style="font-size:11px;color:var(--text2);margin-top:4px;">${escapeHTML(v.ziyaret_sonucu)}</div>`:''}
    </div>`;
  }).join('');
}

async function loadMusteriFirsatlar(ncst){
  const c = document.getElementById('musteriFirsatListesi');
  c.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const {data} = await sb.from('opportunities')
    .select('opp_id,urun_adi,beklenen_ciro,adim,durum,olusturma_tarihi')
    .eq('ncst', ncst).order('olusturma_tarihi',{ascending:false}).limit(10);
  if(!data || !data.length){ c.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Fırsat yok.</div>'; return; }
  c.innerHTML = data.map(o=>{
    const adim = o.adim||o.durum||'Fırsat';
    const tagCls = OPP_ADIM_TAGS[adim]||'tag-gray';
    return `<div class="visit-card" style="margin-bottom:7px;cursor:pointer;" onclick="openEditOppModal(${o.opp_id})">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="visit-firm" style="font-size:13px;">${escapeHTML(o.urun_adi||'—')}</div>
        ${o.beklenen_ciro?`<div style="font-size:13px;font-weight:800;color:var(--green);">${fmtTL(o.beklenen_ciro)}</div>`:''}
      </div>
      <div class="visit-tags" style="margin-top:5px;">
        <span class="tag ${tagCls}">${adim}</span>
      </div>
    </div>`;
  }).join('');
}

function navToTemasForMusteri(){
  navTo('pageTemasForm', true);
  if(selectedMusteri) setTimeout(()=>selC(selectedMusteri), 100);
}

function navToFirsatForMusteri(){
  if(!selectedMusteri) return;
  const ncst = selectedMusteri.ncst;
  navHistory.push(document.querySelector('.page.active')?.id||'pageMusteri');
  showPage('pageFirsatForm');
  initFirsatForm(ncst);
}

function openYeniMusteriModal(prefillUnvan='', source='temas'){
  window._yeniMusteriSource = source;
  selectNewCustomer(prefillUnvan);
}

function openYeniKontakModalMusteri(){ openYeniKontakModal('musteri'); }

/* ===== KONTAKLAR SEKMESİ ===== */
let kontakSearchTimer = null;

async function loadKontaklar(searchVal=''){
  const c = document.getElementById('kontakListesi');
  c.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try{
    const r = (currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    const full = ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ'];
    const kcm = ['KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ DESTEK','ÇÖZÜM SATIŞ TEMSİLCİSİ','ÇÖZÜM SATIŞ UZMANI','TURKCELL BÖLGE YÖNETİCİSİ'];
    // Önce erişilebilir müşteri NCST'lerini al
    let ncstList = null;
    if(!full.includes(r)){
      const cq = getCustomerBaseQuery().select('ncst');
      const {data:custData} = await cq;
      ncstList = (custData||[]).map(c=>c.ncst);
      if(!ncstList.length){ c.innerHTML='<div class="empty">Kontak yok.</div>'; return; }
    }
    let q = sb.from('contacts').select('*').order('ad_soyad').limit(50);
    if(searchVal.length>=2){
      q = q.or(`ad_soyad.ilike.%${searchVal}%,gorev_unvani.ilike.%${searchVal}%,telefon.ilike.%${searchVal}%`);
    }
    if(ncstList) q = q.in('ncst', ncstList);
    const {data,error} = await q;
    if(error) throw error;
    if(!data||!data.length){ c.innerHTML='<div class="empty">Kontak bulunamadı.</div>'; return; }
    // Unvanları ayrı sorguyla çek (FK bağımlılığı olmadan)
    const kontakNcstList = [...new Set((data||[]).map(k=>k.ncst).filter(Boolean))];
    let unvanMap = {};
    if(kontakNcstList.length>0){
      const {data:custData} = await sb.from('customers').select('ncst,unvan').in('ncst',kontakNcstList);
      (custData||[]).forEach(c=>{ unvanMap[c.ncst]=c.unvan; });
    }
    c.innerHTML = data.map(k=>`
      <div class="visit-card" style="cursor:pointer;" onclick="openKontakDetay(${k.contact_id})">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:14px;font-weight:700;">${escapeHTML(k.ad_soyad)}</div>
            <div style="font-size:12px;color:var(--text2);">${escapeHTML(k.gorev_unvani||'—')}</div>
          </div>
          <button class="icon-btn" onclick="event.stopPropagation();openEditKontakModal(${k.contact_id})">✏️</button>
        </div>
        ${unvanMap[k.ncst]?`<div style="font-size:12px;color:var(--blue);margin-top:5px;cursor:pointer;" onclick="event.stopPropagation();switchMusteriTab('musteri');selectMusteri('${k.ncst}')">🏢 ${escapeHTML(unvanMap[k.ncst])}</div>`:''}
        ${k.telefon?`<div style="font-size:12px;color:var(--text2);margin-top:2px;">📞 ${escapeHTML(k.telefon)}</div>`:''}
      </div>`).join('');
  }catch(err){ c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`; }
}

function onKontakSearch(val){
  clearTimeout(kontakSearchTimer);
  kontakSearchTimer = setTimeout(()=>loadKontaklar(val), 350);
}

async function openEditKontakModal(contactId){
  const {data:k} = await sb.from('contacts').select('*').eq('contact_id',contactId).single();
  if(!k) return;
  window._newKontakNcst = k.ncst||'';
  document.getElementById('newContactName').value = k.ad_soyad||'';
  document.getElementById('newContactTitle').value = k.gorev_unvani||'';
  document.getElementById('newContactPhone').value = k.telefon||'';
  document.getElementById('newContactEmail').value = k.email||'';
  window._editingKontakId = contactId;
  window._newKontakSource = 'edit';
  openModal('newContactModal');
}

/* ===== MÜŞTERİ FIRSAT ÖZET (oppModal) ===== */
async function loadOppMusteriOzet(ncst){
  try{
    const {data} = await sb.from('opportunities').select('adim,durum').eq('ncst',ncst);
    const getAdim = o => o.adim||o.durum||'Fırsat';
    const cnt = a => (data||[]).filter(o=>getAdim(o)===a).length;
    document.getElementById('ozFirsat').textContent = cnt('Fırsat');
    document.getElementById('ozTeklif').textContent = cnt('Teklif');
    document.getElementById('ozBeyan').textContent = cnt('Beyan');
    document.getElementById('ozEvrak').textContent = cnt('Evrak');
    document.getElementById('ozGercek').textContent = cnt('Gerçekleşen');
    document.getElementById('ozIptal').textContent = cnt('İptal');
    document.getElementById('oppMusteriOzetBox').classList.remove('hide');
  }catch(e){}
}

