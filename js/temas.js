// ============================================================
// temas.js — v2.9.0
// Son güncelleme: 2026-05-28
// Değişiklikler:
//   v2.9.0 — B4 fix: listTimeFilter kullanımı, renderTemasList zaman bloğu
//   v2.8.0 — countVisitsForNcst tanım sırası düzeltildi (before initialization hatası)
//   v2.7.9 — Takım/MY filtresinde Temas Edilen Toplam portföy bazlı hesaplanıyor
//   v2.7.8 — Paralel sorgu optimizasyonu (countCust+getNcstSet+totalVisit paralele alındı)
//   v2.7.7 — KÇM/Takım filtresi ilk seçimde çalışmıyor (await reloadFn eklendi)
//   v2.7.6 — getTotalContacted filtre mantığı düzeltildi (takım/MY bazlı)
//   v2.7.5 — Temas Edilen Toplam portföy dışı müşterileri de kapsar (3.026+958=3.984)
//   v2.7.4 — Temas MY/FMY = portföy müşterilerine yapılan ziyaret SAYISI
//             Temas Edilen kartı ismi güncellendi
//   v2.7.3 — Temas kartı MY/FMY contacted değerleri düzeltildi
//   v2.7.2 — countContacted pagination eklendi (visits 1000 limit aşımı)
//   v2.7.1 — getNcstSet pagination eklendi (Supabase 1000 limit aşımı)
//   v2.7.0 — users!inner join kaldırıldı, iki adımlı my_id fetch ile düzeltildi
//   v2.6.0 — SQL ile birebir eşleşen hesap, portföy/temas/penetrasyon doğrulandı
//   v2.5.1 — toplam temas kcm_id bazlı düzeltildi
//   v2.5.0 — loadTemasDashboard tamamen yeniden yazıldı
//   v2.4.2 — repTypeArr çift tanım hatası giderildi
//   v2.4.1 — scopeMyIds takım lideri fix, repTypeArr init fix
//   v2.4.0 — MY/FMY penetrasyon kırılımı, dashboard yeniden yazıldı
//   v2.3.0 — countVisitForIds portföy fix
//   v1.0.0 — ilk versiyon
// ============================================================
'use strict';
/* ===== TEMAS UI ===== */
async function buildTemasUI(){
  const {data} = await sb.from('visit_results')
    .select('*').eq('aktif',true).order('sira');
  const amaclar = (data||[]).filter(r=>r.tip==='amac');
  const sonuclar = (data||[]).filter(r=>r.tip==='sonuc');
  const aksiyonlar = (data||[]).filter(r=>r.tip==='aksiyon');
  const takipIslemler = (data||[]).filter(r=>r.tip==='takip_islem');

  const amacList = amaclar.length ? amaclar.map(r=>r.sonuc_adi) : DEFAULT_PURPOSES;
  const sonucList = sonuclar.length ? sonuclar.map(r=>r.sonuc_adi) : DEFAULT_RESULTS;
  const aksList = aksiyonlar.length ? aksiyonlar.map(r=>r.sonuc_adi) : DEFAULT_ACTIONS;
  const takipList = takipIslemler.length ? takipIslemler.map(r=>r.sonuc_adi)
    : ['Teklif Değerlendirme/Sunma','Eksik Evrak','Sözleşme İmza','Kimlik / Vekalet Tamamlama','Ürün Uzmanı ile Toplantı','Ertelenen Ziyaret'];

  window._dbAmaclar = amacList;
  window._dbSonuclar = sonucList;
  window._dbAksiyonlar = aksList;
  window._dbTakipIslemler = takipList;

  document.getElementById('temasAmacGrid').innerHTML=amacList.map(p=>`<div class="product-chip" onclick="toggleChip(selectedPurposes,'${escapeHTML(p)}',this)">${escapeHTML(p)}</div>`).join('');
  document.getElementById('temasProductGrid').innerHTML=FALLBACK_PRODUCTS.map(c=>`<div class="product-category">${c.cat}</div><div class="product-grid">${c.items.map(i=>`<div class="product-chip" onclick="toggleChip(selectedProducts,'${i.n}',this)">${i.n}</div>`).join('')}</div>`).join('');
  document.getElementById('temasResultGrid').innerHTML=sonucList.map(r=>`<div class="sonuc-item" onclick="selectResult(this,'${escapeHTML(r)}')">${escapeHTML(r)}</div>`).join('');
  document.getElementById('temasActionGrid').innerHTML=aksList.map(a=>`<div class="product-chip" onclick="toggleChip(selectedActions,'${escapeHTML(a)}',this)">${escapeHTML(a)}</div>`).join('');

  // Takip işlem select
  const takipSel = document.getElementById('takipIslem');
  if(takipSel){
    const current = takipSel.value;
    takipSel.innerHTML = takipList.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
    if(current) takipSel.value = current;
  }
}
function buildUrunSelects(){
  // Fırsat ekranları için sadece gerçek ürünler
  const firsatProds = window.FIRSAT_PRODUCTS || FALLBACK_PRODUCTS;
  let opts='<option value="" data-type="">-- Ürün Seçin --</option>';
  firsatProds.forEach(c=>{opts+=`<optgroup label="${c.cat}">`+c.items.map(i=>`<option value="${i.n}" data-type="${i.t}">${i.n}</option>`).join('')+`</optgroup>`;});
  const tmsFirsatEl=document.getElementById('tmsFirsatUrun');
  if(tmsFirsatEl)tmsFirsatEl.innerHTML=opts;
  // oppUrun artık dinamik çoklu ürün listesinde - buildUrunSelects burada set etmez
}
function toggleChip(arr,val,el){el.classList.toggle('selected');const i=arr.indexOf(val);if(i>-1)arr.splice(i,1);else arr.push(val);}
function setTemasDurumu(val){
  selectedTemasDurumuStr=val;
  document.getElementById('btnDurumGerceklesen').classList.toggle('selected',val==='Gerçekleşti');
  document.getElementById('btnDurumPlanlanan').classList.toggle('selected',val==='Planlandı');
  if(val==='Planlandı'){
    document.getElementById('temasTarihiBox').classList.remove('hide');
    document.getElementById('gerceklesenAlanlar').classList.add('hide');
    // v30.09: gerçekleşen tarih kutusunu gizle
    const gtBox=document.getElementById('temasGercTarihBox');
    if(gtBox) gtBox.classList.add('hide');
  }else{
    document.getElementById('temasTarihiBox').classList.add('hide');
    document.getElementById('gerceklesenAlanlar').classList.remove('hide');
    // v30.09: gerçekleşen tarih kutusunu göster, default şimdiki zaman
    const gtBox=document.getElementById('temasGercTarihBox');
    const gtInp=document.getElementById('temasGercTarih');
    if(gtBox) gtBox.classList.remove('hide');
    if(gtInp&&!gtInp.value){
      const now=new Date();
      now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
      gtInp.value=now.toISOString().slice(0,16);
    }
  }
}
function setTemasYontemi(el,val){document.querySelectorAll('#temasYontemiGrid .chip-btn').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');selectedTemasYontemiStr=val;}
function toggleFirsatFields(prefix){const sel=document.getElementById(prefix+'FirsatUrun');if(!sel)return;const type=sel.options[sel.selectedIndex]?.getAttribute('data-type');document.getElementById(prefix+'AdetBox').classList.toggle('hide',type==='Tutar');document.getElementById(prefix+'TutarBox').classList.toggle('hide',type!=='Tutar');}
function toggleOppFields(){/* oppUrun artık dinamik satırlarda - toggleOppFields kullanılmıyor */}
function addBasket(prefix){
  const u=document.getElementById(prefix+'FirsatUrun');
  const type=u.options[u.selectedIndex]?.getAttribute('data-type');
  const a=document.getElementById(prefix+'FirsatAdet');
  const t=document.getElementById(prefix+'FirsatTutar');
  const tarih=document.getElementById(prefix+'FirsatTarih')?.value||'';
  if(!u.value){toast('Ürün seçin','error');return;}
  let str='',numVal=0,adet=1;
  if(type==='Adet'){if(!a.value){toast('Adet girin','error');return;}str=a.value+' Adet';adet=parseInt(a.value)||1;}
  else{if(!t.value){toast('Tutar girin','error');return;}str=t.value+' TL';numVal=parseFloat(t.value);}
  activeBasket.push({id:Date.now(),urun:u.value,str,adet,tutar:numVal,tarih});
  renderBasket(prefix);u.value='';a.value='1';t.value='';
}
function removeBasket(id,prefix){activeBasket=activeBasket.filter(b=>b.id!==id);renderBasket(prefix);}
function renderBasket(prefix){const list=document.getElementById(prefix+'BasketList');if(activeBasket.length===0){list.classList.add('hide');return;}list.classList.remove('hide');list.innerHTML=activeBasket.map(b=>`<div class="basket-item"><div><strong>${escapeHTML(b.urun)}</strong>${b.tarih?`<div style="font-size:10px;color:var(--text2)">Kapanış: ${b.tarih}</div>`:''}</div><span>${b.str} <span class="basket-del" onclick="removeBasket(${b.id},'${prefix}')">×</span></span></div>`).join('');}
function selectResult(el,val){document.querySelectorAll('#temasResultGrid .sonuc-item').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');selectedResult=val;const isNoShow=val==='Ziyaret Yapılamadı';const isFollowUp=val==='Tekrar Ziyaret Edilecek'||val==='Ürün Sorumlusu/Uzmanı ile Toplantı Yapılacak';document.getElementById('ziyaretIptalNedeniBox').classList.toggle('hide',!isNoShow);document.getElementById('yeniPlanlamaBox').classList.toggle('hide',!(isNoShow||isFollowUp));if(isNoShow)document.getElementById('takipIslem').value='Ertelenen Ziyaret';}
function renderCustomerSummaryHTML(c){const by=c.beyaz_yakali_sayi||'-';const it=c.it_ekibi?'Var':'Yok';const sube=c.sube_lokasyon?'Var':'Yok';const fw=c.firewall_kullanimi?'Var':'Yok';return `<div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:4px;line-height:1.3;">${escapeHTML(c.unvan)}</div><div style="font-size:12px;color:var(--text2);margin-bottom:12px;">NCST: ${c.ncst}</div><div style="display:flex;gap:10px;font-size:11px;color:var(--text3);flex-wrap:wrap;background:var(--navy2);padding:10px;border-radius:8px;border:1px solid var(--border);"><div style="flex:1;min-width:40%;">👔 Beyaz Yaka: <strong style="color:var(--text)">${by}</strong></div><div style="flex:1;min-width:40%;">💻 IT: <strong style="color:var(--text)">${it}</strong></div><div style="flex:1;min-width:40%;">🏢 Şube: <strong style="color:var(--text)">${sube}</strong></div><div style="flex:1;min-width:40%;">🛡️ FW: <strong style="color:var(--text)">${fw}</strong></div></div>`;}
async function loadDefaultCustomers(containerId,actionFn){
  const c=document.getElementById(containerId);
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  // Son ziyaret yapılan müşterileri önce göster - applyRBAC ile
  let visitQ=sb.from('visits').select('ncst,musteri_my_id').order('guncelleme_tarihi',{ascending:false,nullsFirst:false}).order('tarih_saat',{ascending:false}).limit(1000);
  visitQ=applyRBAC(visitQ);
  const{data:visitData}=await visitQ;
  // Unique NCST - sırayla
  const seenNcst=new Set();
  const orderedNcst=[];
  (visitData||[]).forEach(v=>{if(!seenNcst.has(v.ncst)){seenNcst.add(v.ncst);orderedNcst.push(v.ncst);}});
  // Bu NCST'lere ait müşteri bilgilerini çek
  let html='';
  if(orderedNcst.length>0){
    const _rDC2=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    let dcQ;
    if(_rDC2==='MY'||_rDC2==='USER'){
      // MY: sadece kendi portföyündeki müşteriler (my_id)
      dcQ=sb.from('customers').select('ncst,my_id,kcm_id,unvan,il,musteri_tipi,aktif')
        .eq('aktif',true).eq('my_id',currentUser.my_id).in('ncst',orderedNcst.slice(0,100));
    } else {
      dcQ=getCustomerBaseQuery().in('ncst',orderedNcst.slice(0,100));
    }
    const{data:custData}=await dcQ.limit(100);
    // Temas sırasına göre sırala
    const custMap={};(custData||[]).forEach(d=>custMap[d.ncst]=d);
    const sorted=orderedNcst.slice(0,100).map(n=>custMap[n]).filter(Boolean);
    html=sorted.map(d=>`<div class="visit-card" onclick="${actionFn}('${d.ncst}')"><div class="visit-firm">${escapeHTML(d.unvan)}</div><div class="visit-my">NCST: ${d.ncst}${d.il?' | '+escapeHTML(d.il):''}</div></div>`).join('');
  }
  c.innerHTML=html||'<div class="empty" style="padding:10px">Henüz temas kaydı yok.</div>';
}

async function selectNewCustomer(prefillUnvan=''){
  // Müşteri bilgi formunu aç
  document.getElementById('ymUnvan').value = prefillUnvan||'';
  document.getElementById('ymVergiNo').value = '';
  document.getElementById('ymIl').value = '';
  document.getElementById('ymIlce').value = '';
  document.getElementById('ymHat').value = '';
  // Admin/Koord için KÇM seçici
  const ymKcmDiv=document.getElementById('ymKcmDiv');
  const ymKcmSel=document.getElementById('ymKcm');
  const _rYm=(currentUser.yetki_seviyesi||'').toUpperCase();
  const isAdminKoord=['ADMIN','SATIŞ DİREKTÖRÜ'].includes(_rYm);
  if(ymKcmDiv) ymKcmDiv.style.display=isAdminKoord?'':'none';
  if(isAdminKoord&&ymKcmSel&&ymKcmSel.options.length<=1){
    const{data:kcmler}=await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_id');
    (kcmler||[]).forEach(k=>{const o=document.createElement('option');o.value=k.kcm_id;o.textContent=k.kcm_adi;ymKcmSel.appendChild(o);});
  }
  openModal('yeniMusteriModal');
}

async function saveYeniMusteri(){
  const unvan = document.getElementById('ymUnvan').value.trim();
  if(!unvan){toast('Firma ünvanı zorunlu','error');return;}
  const vergiNo = document.getElementById('ymVergiNo').value.trim()||null;
  const il = document.getElementById('ymIl').value.trim()||null;
  const ilce = document.getElementById('ymIlce').value.trim()||null;
  const hat = parseInt(document.getElementById('ymHat').value)||0;
  const ncst = 'TMP' + Date.now();
  const _rSaveYm=(currentUser.yetki_seviyesi||'').toUpperCase();
  let ymKcmId=currentUser.kcm_id;
  if(['ADMIN','SATIŞ DİREKTÖRÜ'].includes(_rSaveYm)){
    const selKcm=parseInt(document.getElementById('ymKcm')?.value);
    if(!selKcm){toast('KÇM seçin','error');return;}
    ymKcmId=selKcm;
  }
  const{error} = await sb.from('customers').insert({
    ncst, unvan, vergi_no:vergiNo, il, ilce,
    toplam_hat:hat, my_id:currentUser.my_id,
    kcm_id:ymKcmId, musteri_tipi:'POTANSİYEL', aktif:true
  });
  if(error){toast('Müşteri kaydedilemedi: '+error.message,'error');return;}
  closeModal('yeniMusteriModal');
  toast('Müşteri eklendi ✅','success');
  // Nereden açıldığına göre davran
  const source = window._yeniMusteriSource || 'temas';
  window._yeniMusteriSource = null;
  if(source === 'musteri'){
    initMusteriPage();
  } else {
    const custData = {ncst, unvan, il, ilce, musteri_tipi:'POTANSİYEL'};
    selC(custData);
  }
}
function openPlannedAsNewTemas(visit){
  // Planlanan temas: mevcut kayıt ID'si sakla, form yeni temas gibi açılır
  window.currentEditingVisitId = visit.visit_id;
  window._plannedVisitData = visit;
  navTo('pageTemasForm', true);
  // Form başlangıç değerleri
  setTimeout(()=>{
    // Durumu Gerçekleşti yap
    setTemasDurumu('Gerçekleşti');
    // Müşteri seç
    sb.from('customers').select('*').eq('ncst', visit.ncst).single().then(({data})=>{
      if(data) selC(data);
    });
    // Yöntemi seç
    if(visit.temas_turu){
      document.querySelectorAll('#temasYontemiGrid .chip-btn').forEach(btn=>{
        if(btn.textContent.trim()===visit.temas_turu){
          btn.classList.add('selected');
          window._temasYontemi=visit.temas_turu;
        }
      });
    }
    // Amaçları seç
    if(visit.ziyaret_amaci){
      const amaclar=visit.ziyaret_amaci.split(',').map(x=>x.trim()).filter(Boolean);
      document.querySelectorAll('#temasAmacGrid .product-chip').forEach(chip=>{
        if(amaclar.includes(chip.textContent.trim())) chip.click();
      });
    }
    // Ürünleri seç
    if(visit.urun_gruplari){
      const urunler=visit.urun_gruplari.split(',').map(x=>x.trim()).filter(Boolean);
      document.querySelectorAll('#temasProductGrid .product-chip').forEach(chip=>{
        if(urunler.includes(chip.textContent.trim())) chip.click();
      });
    }
    // Notu doldur
    if(visit.ziyaret_amaci_detay){
      const notEl=document.getElementById('temasNotes');
      if(notEl) notEl.value=visit.ziyaret_amaci_detay;
    }
  }, 300);
}

async function initTemasForm(){
  // v30.32: Edit modunda bu fonksiyon atlanır - openTemasFormForEdit kendi doldurur
  if(window._temasEditMode){ window._temasEditMode=false; return; }
  // v30.30: Yeni temas formunda timeline gizli
  const tlSec=document.getElementById('temasTimelineSection');
  if(tlSec) tlSec.style.display='none';
  clearCustomer();
  tmsEklenmisFirsatList=[];
  renderTmsEklenmisFirsatlar();
  // Durum ve yöntem sıfırla
  setTemasDurumu('Ger\u00e7ekle\u015fti');
  selectedTemasDurumuStr='Ger\u00e7ekle\u015fti';
  selectedTemasYontemiStr='Ziyaret';
  const ilkYontem=document.querySelectorAll('#temasYontemiGrid .chip-btn')[0];
  if(ilkYontem) ilkYontem.click();
  // Notlar
  const notEl=document.getElementById('temasNotes');
  if(notEl) notEl.value='';
  // Tarih
  const tarihEl=document.getElementById('temasTarihi');
  if(tarihEl) tarihEl.value='';
  // v30.09: gerçekleşen tarih sıfırla ve varsayılan ata
  const gtInp=document.getElementById('temasGercTarih');
  if(gtInp){const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());gtInp.value=now.toISOString().slice(0,16);}
  // Sepet ve seçimler
  activeBasket=[];
  renderBasket('tms');
  selectedPurposes=[];
  selectedProducts=[];
  selectedActions=[];
  selectedResult='';
  // Chip'leri sıfırdan render et — seçim state'i garantili temizlenir
  await buildTemasUI();
  // Chip seçimlerini temizle (buildTemasUI sonrası kalanlar için)
  document.querySelectorAll('.product-chip,.sonuc-item,.opp-adim-btn').forEach(e=>e.classList.remove('selected'));
  // Gizli kutular
  document.getElementById('yeniPlanlamaBox').classList.add('hide');
  document.getElementById('ziyaretIptalNedeniBox').classList.add('hide');
  // Fırsat onay butonları sıfırla
  isOpportunityConfirmed=false;
  var ok=document.getElementById('oppConfirmOk');
  var xb=document.getElementById('oppConfirmX');
  if(ok){ok.style.background='rgba(0,214,143,.15)';ok.style.borderColor='rgba(0,214,143,.4)';ok.style.color='var(--green)';}
  if(xb){xb.style.background='transparent';xb.style.borderColor='var(--border)';xb.style.color='var(--text2)';}
  document.getElementById('firsatUrunBox').classList.add('hide');
  // Edit ID sıfırla
  window.currentEditingVisitId=null;
  // temasRestOfForm gizle
  const restOf=document.getElementById('temasRestOfForm');
  if(restOf) restOf.classList.add('hide');
}
async function selC(c){
  if(typeof c==='string'){const{data}=await sb.from('customers').select('*').eq('ncst',c).single();if(data)c=data;else return;}
  selectedCustomer=c;
  selectedContactsMap.clear();
  document.getElementById('selCustNameHtml').innerHTML=renderCustomerSummaryHTML(c);
  document.getElementById('selectedCustBox').classList.remove('hide');
  document.getElementById('custSearchBox').classList.add('hide');
  document.getElementById('custResults').classList.remove('show');
  document.getElementById('temasRestOfForm').classList.remove('hide');
  // v30.23: Kontak seçilmeden form kilitli başlar
  _updateKontakFormState();
  loadContacts(c.ncst);
}
function clearCustomer(){selectedCustomer=null;selectedContactsMap.clear();document.getElementById('selectedCustBox').classList.add('hide');document.getElementById('custSearchBox').classList.remove('hide');document.getElementById('temasRestOfForm').classList.add('hide');document.getElementById('custSearch').value='';loadDefaultCustomers('formDefaultCustList','selC');}
function setOpportunityConfirm(val){
  isOpportunityConfirmed=val;
  const okBtn=document.getElementById('oppConfirmOk');
  const xBtn=document.getElementById('oppConfirmX');
  if(val){
    okBtn.style.background='rgba(0,214,143,.3)';
    okBtn.style.borderColor='var(--green)';
    okBtn.style.color='var(--green)';
    xBtn.style.background='';
    xBtn.style.borderColor='';
    xBtn.style.color='';
  } else {
    xBtn.style.background='rgba(224,4,42,.2)';
    xBtn.style.borderColor='var(--red)';
    xBtn.style.color='var(--red)';
    okBtn.style.background='transparent';
    okBtn.style.borderColor='rgba(0,214,143,.4)';
    okBtn.style.color='var(--text2)';
    document.getElementById('firsatUrunBox').classList.add('hide');
    tmsEklenmisFirsatList=[];
    renderTmsEklenmisFirsatlar();
  }
}

// Temas ekranından fırsat modalı aç
let tmsEklenmisFirsatList = []; // {urun, adet, tutar, adim, olasilik, kapanis, aciklama}

function openFirsatFromTemas(){
  isOpportunityConfirmed=true;
  const okBtn=document.getElementById('oppConfirmOk');
  const xBtn=document.getElementById('oppConfirmX');
  okBtn.style.background='rgba(0,214,143,.3)';
  okBtn.style.borderColor='var(--green)';
  okBtn.style.color='var(--green)';
  xBtn.style.background='';
  xBtn.style.borderColor='';
  xBtn.style.color='';
  document.getElementById('firsatUrunBox').classList.remove('hide');
  // Fırsat modalını müşteri prefill ile aç
  const ncst = selectedCustomer?.ncst||null;
  currentEditingOppId = null;
  oppSelectedNcst = ncst;
  oppSelectedUnvan = selectedCustomer?.unvan||null;
  // Modal başlığını güncelle
  document.getElementById('oppModalTitle').textContent = '💼 Yeni Fırsat Ekle';
  document.getElementById('oppCustField').classList.add('hide');
  document.getElementById('oppEditCustInfo').textContent = selectedCustomer?.unvan||'';
  document.getElementById('oppEditCustInfo').classList.remove('hide');
  document.getElementById('oppMusteriOzetBox').classList.add('hide');
  document.getElementById('oppAciklama').value='';
  document.getElementById('oppKapanis').value='';
  clearOppUrunRows();
  setTimeout(()=>{
    addOppUrunRow();
    selectOppAdim('Fırsat');
    // Kaydet butonu → temasa ekle
    document.getElementById('oppSaveBtn').onclick = saveOppToTemas;
    document.getElementById('oppSaveBtn').textContent = '➕ Fırsatı Temasa Ekle';
  },50);
  openModal('oppModal');
}

function saveOppToTemas(){
  const urunData = getOppUrunData();
  if(urunData.length===0){toast('En az bir ürün ekleyin','error');return;}
  const adim = document.getElementById('oppDurum').value;
  const olasilik = parseInt(document.getElementById('oppOlasilikVal')?.value)||10;
  const kapanis = document.getElementById('oppKapanis').value||null;
  const aciklama = document.getElementById('oppAciklama').value||'';
  // Her ürün için ayrı fırsat ekle
  urunData.forEach(u=>{
    tmsEklenmisFirsatList.push({urun:u.urun,adet:u.adet,tutar:u.tutar,adim,olasilik,kapanis,aciklama});
  });
  renderTmsEklenmisFirsatlar();
  closeModal('oppModal');
  // Kaydet butonunu geri al
  document.getElementById('oppSaveBtn').onclick = saveOpp;
  document.getElementById('oppSaveBtn').textContent = '💾 Kaydet';
  toast(urunData.length+' fırsat eklendi','success');
}

function renderTmsEklenmisFirsatlar(){
  const el = document.getElementById('tmsEklenmisFirsatlar');
  if(!el) return;
  if(tmsEklenmisFirsatList.length===0){el.innerHTML='';return;}
  el.innerHTML = tmsEklenmisFirsatList.map((f,i)=>`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;">${escapeHTML(f.urun)}</div>
        <div style="font-size:11px;color:var(--text2);">${f.adim} · %${f.olasilik}${f.tutar?' · '+fmtTL(f.tutar):''}${f.adet>1?' · '+f.adet+' adet':''}</div>
      </div>
      <button onclick="removeTmsFirsat(${i})" style="background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;">✕</button>
    </div>`).join('');
}

function removeTmsFirsat(i){
  tmsEklenmisFirsatList.splice(i,1);
  renderTmsEklenmisFirsatlar();
  if(tmsEklenmisFirsatList.length===0){
    setOpportunityConfirm(false);
  }
}

/* ===== MÜŞTERİ DÜZENLE ===== */
function openCustEditModal(c, source){
  if(!c){toast('Müşteri seçili değil','error');return;}
  currentEditingCustNcst = c.ncst;
  const adm = (currentUser.yetki_seviyesi||'').toUpperCase()==='ADMIN';
  if(adm){
    document.getElementById('adminFields').classList.remove('hide');
    document.getElementById('editCustNcst').value = c.ncst||'';
    document.getElementById('editCustUnvan').value = c.unvan||'';
    document.getElementById('editCustVergiNo').value = c.vergi_no||'';
    const tm=document.getElementById('editCustMusteriTipi'); if(tm) tm.value=c.musteri_tipi||'MEVCUT';
  } else { document.getElementById('adminFields').classList.add('hide'); }
  document.getElementById('editCustIl').value = c.il||'';
  document.getElementById('editCustIlce').value = c.ilce||'';
  document.getElementById('editCustSektor').value = c.sektor||'';
  document.getElementById('editCustBY').value = c.beyaz_yakali_sayi||0;
  _setToggle('it', c.it_ekibi===true);
  document.getElementById('editItSayisi').value = c.it_ekip_sayisi||0;
  _setToggle('sunucu', c.sunucu_altyapisi===true);
  document.getElementById('editSunucuDetay').value = c.sunucu_detay||'';
  _setToggle('sube', c.sube_lokasyon===true);
  document.getElementById('editSubeDetay').value = c.sube_detay||'';
  _setToggle('fw', c.firewall_kullanimi===true);
  document.getElementById('editFwMarka').value = c.firewall_detay||'';
  document.getElementById('editCustAdres').value = c.adres||'';
  document.getElementById('editCustTelefon').value = c.telefon||'';
  window._custUpdateSource = source||'temas';
  openModal('custEditModal');
}
function openCustEditFromTemas(){
  if(!hasPerm('musteri_duzenle')){toast('Müşteri düzenleme yetkiniz yok','error');return;}
  openCustEditModal(selectedCustomer,'temas');
}
function openCustEditFromFirsat(){
  if(!hasPerm('musteri_duzenle')){toast('Müşteri düzenleme yetkiniz yok','error');return;}
  openCustEditModal(firsatSelectedMusteri,'firsat');
}
function openMusteriEdit(){
  if(!hasPerm('musteri_duzenle')){toast('Müşteri düzenleme yetkiniz yok','error');return;}
  openCustEditModal(selectedMusteri,'musteri');
}
function _setToggle(type,val){
  editToggleState[type]=val;
  const map={
    it:{evet:'editItEvet',hayir:'editItHayir',box:'editItSayisiBox'},
    sunucu:{evet:'editSunucuEvet',hayir:'editSunucuHayir',box:'editSunucuDetayBox'},
    sube:{evet:'editSubeEvet',hayir:'editSubeHayir',box:'editSubeDetayBox'},
    fw:{evet:'editFwEvet',hayir:'editFwHayir',box:'editFwDetayBox'}
  };
  if(!map[type])return;
  document.getElementById(map[type].evet).classList.toggle('selected',val===true);
  document.getElementById(map[type].hayir).classList.toggle('selected',val===false);
  const box=document.getElementById(map[type].box);
  if(box)box.classList.toggle('hide',!val);
}
async function submitCustUpdate(){
  if(!currentEditingCustNcst)return;
  if(!hasPerm('musteri_duzenle')){toast('Müşteri düzenleme yetkiniz yok','error');closeModal('custEditModal');return;}
  // Sadece customers tablosunda gerçekten var olan sütunlar
  const upd={
    il:document.getElementById('editCustIl').value||null,
    ilce:document.getElementById('editCustIlce').value||null,
    sektor:document.getElementById('editCustSektor').value||null,
    beyaz_yakali_sayi:parseInt(document.getElementById('editCustBY').value)||null,
    it_ekibi:editToggleState.it===true,
    it_ekip_sayisi:editToggleState.it===true?parseInt(document.getElementById('editItSayisi').value)||null:null,
    sunucu_altyapisi:editToggleState.sunucu===true,
    sunucu_detay:editToggleState.sunucu===true?document.getElementById('editSunucuDetay').value||null:null,
    sube_lokasyon:editToggleState.sube===true,
    sube_detay:editToggleState.sube===true?document.getElementById('editSubeDetay').value||null:null,
    firewall_kullanimi:editToggleState.fw===true,
    firewall_detay:editToggleState.fw===true?document.getElementById('editFwMarka').value||null:null,
    adres:document.getElementById('editCustAdres').value||null,
    telefon:document.getElementById('editCustTelefon').value||null
  };
  const isAdmin=(currentUser.yetki_seviyesi||'').toUpperCase()==='ADMIN';
  if(isAdmin){
    const nn=document.getElementById('editCustNcst').value;
    const nu=document.getElementById('editCustUnvan').value;
    const nv=document.getElementById('editCustVergiNo').value;
    const nt=document.getElementById('editCustMusteriTipi').value;
    if(nn&&nn!==currentEditingCustNcst)upd.ncst=nn;
    if(nu)upd.unvan=nu;
    if(nv)upd.vergi_no=nv;
    if(nt)upd.musteri_tipi=nt;
  }
  upd.guncelleme_tarihi=new Date().toISOString();
  const{error}=await sb.from('customers').update(upd).eq('ncst',currentEditingCustNcst);
  if(error){toast('Güncelleme hatası: '+error.message,'error');return;}
  toast('Müşteri güncellendi','success');
  // Müşteri modülü açıksa orayı da güncelle
  if(window._custUpdateSource==='musteri'&&selectedMusteri){
    const {data} = await sb.from('customers').select('*').eq('ncst',currentEditingCustNcst).single();
    if(data){selectedMusteri=data;document.getElementById('musteriSelNameHtml').innerHTML=renderCustomerSummaryHTML(data);}
    window._custUpdateSource=null;
  }
  closeModal('custEditModal');
  const targetNcst=upd.ncst||currentEditingCustNcst;
  if(selectedCustomer&&selectedCustomer.ncst===currentEditingCustNcst){
    const{data:fresh}=await sb.from('customers').select('*').eq('ncst',targetNcst).single();
    if(fresh){selectedCustomer=fresh;const sd=document.getElementById('selCustNameHtml');if(sd)sd.innerHTML=renderCustomerSummaryHTML(fresh);}
  }
  // Bağımsız fırsat ekranı açıksa firsatSelectedMusteri güncelle
  if(window._custUpdateSource==='firsat'&&firsatSelectedMusteri&&firsatSelectedMusteri.ncst===currentEditingCustNcst){
    const{data:fresh}=await sb.from('customers').select('*').eq('ncst',targetNcst).single();
    if(fresh){
      firsatSelectedMusteri=fresh;
      const sd=document.getElementById('firsatSelCustNameHtml');
      if(sd) sd.innerHTML=renderCustomerSummaryHTML(fresh);
    }
    window._custUpdateSource=null;
  }
}

/* ===== KONTAKLAR ===== */
function renderKontakItemForForm(c, onSelectFn, onCheckId){
  return `<div class="contact-item" id="citem_${c.contact_id}" style="display:flex;align-items:center;gap:6px;">
  <div style="flex:1;cursor:pointer;" onclick="${onSelectFn}(${c.contact_id},'${escapeHTML(c.ad_soyad)}')">
    <strong>${escapeHTML(c.ad_soyad)}</strong>
    <span style="font-size:11px;color:var(--text2);"> · ${escapeHTML(c.gorev_unvani||'-')}</span>
    ${c.telefon?`<span style="font-size:11px;color:var(--text3);"> 📞${escapeHTML(c.telefon)}</span>`:''}
  </div>
  <div class="c-check hide" id="${onCheckId}_${c.contact_id}" style="color:var(--green);font-size:16px;pointer-events:none;">✓</div>
  <button onclick="event.stopPropagation();openEditKontakModal(${c.contact_id})" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px;" title="Düzenle">✏️</button>
  <button onclick="event.stopPropagation();deleteKontakFromForm(${c.contact_id},'${escapeHTML(c.ad_soyad)}')" style="background:rgba(255,80,80,.15);border:1px solid var(--red);border-radius:6px;cursor:pointer;font-size:12px;padding:3px 7px;color:var(--red);" title="Sil">🗑</button>
</div>`;
}

async function loadContacts(ncst){
  const container=document.getElementById('contactListContainer');
  container.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  selectedContactsMap.clear();
  const{data}=await sb.from('contacts').select('*').eq('ncst',ncst).neq('aktif',false).order('ad_soyad');
  if(data&&data.length>0){
    container.innerHTML=data.map(c=>renderKontakItemForForm(c,'toggleContactSelect','ccheck')).join('');
  } else {
    container.innerHTML='<div style="padding:8px;font-size:12px;color:var(--text3);">Kontak yok. Yeni kontak ekleyin.</div>';
  }
  // BUG-1 FIX: Kontak listesi yüklenince formu aç — kontak yoksa da kaydet butonu aktif
  // saveTemas zaten kontak kontrolü yapıyor, burada engellemek UX'i bozuyor
  const saveBtn=document.getElementById('saveTemasBtn');
  if(saveBtn) saveBtn.disabled=false;
  const uyariEl=document.getElementById('kontakZorunluUyari');
  if(uyariEl) uyariEl.style.display='none';
  const gerceklesenEl=document.getElementById('gerceklesenAlanlar');
  if(gerceklesenEl){gerceklesenEl.style.opacity='';gerceklesenEl.style.pointerEvents='';}
}


async function saveNewContact(){
  const name=document.getElementById('newContactName').value;
  const title=document.getElementById('newContactTitle').value;
  const phone=document.getElementById('newContactPhone').value;
  const email=document.getElementById('newContactEmail').value;
  if(!name){toast('Ad Soyad zorunlu','error');return;}
  const source = window._newKontakSource;
  const editId = source==='edit' ? window._editingKontakId : null;
  let ncst;
  if(source==='musteri') ncst=selectedMusteri?.ncst;
  else if(source==='firsat_form') ncst=firsatSelectedMusteri?.ncst;
  else if(source==='firsat') ncst=oppSelectedNcst;
  else if(source==='edit') ncst=null;
  else ncst=selectedCustomer?.ncst;
  if(editId){
    // Düzenleme modu
    const upd={ad_soyad:name,gorev_unvani:title,telefon:phone,email:email};
    const{error}=await sb.from('contacts').update(upd).eq('contact_id',editId);
    if(!error){
      toast('Kontak güncellendi','success');
      closeModal('newContactModal');
      if(selectedMusteri) loadMusteriKontaklar(selectedMusteri.ncst);
      else if(selectedCustomer) loadContacts(selectedCustomer.ncst);
    } else { toast('Hata: '+error.message,'error'); }
  } else {
    if(!ncst){toast('Müşteri seçili değil','error');return;}
    const{error}=await sb.from('contacts').insert({ncst,ad_soyad:name,gorev_unvani:title,telefon:phone,email:email});
    if(!error){
      toast('Kontak eklendi','success');
      closeModal('newContactModal');
      if(source==='firsat_form' && firsatSelectedMusteri) loadFirsatKontaklar(firsatSelectedMusteri.ncst);
      else if(source==='firsat' && oppSelectedNcst) loadOppKontaklar(oppSelectedNcst);
      else if(source==='musteri' && selectedMusteri) loadMusteriKontaklar(selectedMusteri.ncst);
      else if(selectedCustomer) loadContacts(selectedCustomer.ncst);
      window._newKontakSource=null;
    } else { toast('Hata: '+error.message,'error'); }
  }
}

/* ===== TEMAS KAYDET ===== */
async function saveTemas(){
  try{
  const isPlan=selectedTemasDurumuStr==='Planlandı';
  if(selectedPurposes.length===0){toast('Görüşme Amacı seçin','error');return;}
  if(!isPlan&&!selectedResult){toast('Temas Sonucu seçin','error');return;}
  if(isPlan&&!document.getElementById('temasTarihi').value){toast('Planlanan tarih zorunlu','error');return;}
  if(!isPlan&&isOpportunityConfirmed&&tmsEklenmisFirsatList.length===0){toast('Fırsat işaretlendi ama henüz fırsat eklenmedi','error');return;}
  let finalNotes=document.getElementById('temasNotes').value;
  // v30.23: Kontak zorunlu — kontak seçilmeden kayıt yapılamaz
  if(selectedContactsMap.size===0){
    toast('Lütfen en az bir müşteri kontağı seçin','error');
    document.getElementById('saveTemasBtn').disabled=false;
    // Kontak listesine scroll
    const kontakEl=document.getElementById('contactListContainer');
    if(kontakEl) kontakEl.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  let mainContactId=null;
  if(selectedContactsMap.size>0){const keys=Array.from(selectedContactsMap.keys());mainContactId=keys[0];if(keys.length>1)finalNotes='[Kişiler: '+Array.from(selectedContactsMap.values()).join(', ')+']\n'+finalNotes;}
  if(selectedActions.length>0)finalNotes='[Aksiyonlar: '+selectedActions.join(', ')+']\n'+finalNotes;
  if(selectedResult==='Ziyaret Yapılamadı')finalNotes='[İptal: '+document.getElementById('iptalNedeni').value+']\n'+finalNotes;
  document.getElementById('saveTemasBtn').disabled=true;
  let ncst=selectedCustomer.ncst;
  if(!ncst){
    const unvan=selectedCustomer.unvan;
    if(!unvan){toast('Firma ünvanı gerekli','error');document.getElementById('saveTemasBtn').disabled=false;return;}
    const tempNcst='TMP'+Date.now();
    const{error:ce}=await sb.from('customers').insert({ncst:tempNcst,unvan,my_id:currentUser.my_id,kcm_id:currentUser.kcm_id,musteri_tipi:'POTANSİYEL',aktif:true});
    if(ce){toast('Müşteri kaydedilemedi: '+ce.message,'error');document.getElementById('saveTemasBtn').disabled=false;return;}
    ncst=tempNcst;selectedCustomer.ncst=ncst;
  }
  // v30.22: kcm_id öncelik sırası: müşteri.kcm_id → müşteri.my_id'nin kcm_id'si → girenin kcm_id'si
  let visitKcmId=selectedCustomer?.kcm_id||null;
  if(!visitKcmId&&selectedCustomer?.my_id&&Number.isInteger(selectedCustomer.my_id)){
    try{
      const{data:myInfo}=await sb.from('users').select('kcm_id').eq('my_id',selectedCustomer.my_id).single();
      visitKcmId=myInfo?.kcm_id||null;
    }catch(e){ console.warn('visitKcmId lookup failed:',e); }
  }
  if(!visitKcmId) visitKcmId=currentUser.kcm_id||null;
const visitMusteriMyId=selectedCustomer?.my_id||null;
const visitData={ncst,my_id:currentUser.my_id,kcm_id:visitKcmId,musteri_my_id:visitMusteriMyId,contact_id:mainContactId,temas_turu:selectedTemasYontemiStr,durum:selectedTemasDurumuStr,guncelleme_tarihi:new Date().toISOString(),ziyaret_amaci:selectedPurposes.join(', '),urun_gruplari:selectedProducts.join(', '),ziyaret_sonucu:isPlan?null:selectedResult,ziyaret_amaci_detay:finalNotes,tarih_saat:isPlan?null:(document.getElementById("temasGercTarih")?.value?trToISO(document.getElementById("temasGercTarih").value):new Date().toISOString()) /* v30.40: +03:00 */,planlanan_tarih:isPlan?document.getElementById('temasTarihi').value:null};
  // v30.01: editingId'yi null'lamadan önce yerel değişkene al (log ID bug fix)
  let error,visitId=window.currentEditingVisitId;
  const wasEditing = !!visitId;
  if(visitId){visitData.guncelleme_tarihi=new Date().toISOString();const res=await sb.from('visits').update(visitData).eq('visit_id',visitId);error=res.error;window.currentEditingVisitId=null;}
  else{
    const res=await sb.from('visits').insert(visitData).select();error=res.error;
    if(!error&&res.data&&res.data.length)visitId=res.data[0].visit_id;
    if(!error&&!isPlan&&!document.getElementById('yeniPlanlamaBox').classList.contains('hide')&&document.getElementById('takipTarihi').value){
      await sb.from('visits').insert({ncst,my_id:currentUser.my_id,temas_turu:document.getElementById('takipYontem').value,ziyaret_amaci:document.getElementById('takipIslem').value,durum:'Planlandı',planlanan_tarih:document.getElementById('takipTarihi').value});
    }
    if(!error&&!isPlan&&isOpportunityConfirmed&&tmsEklenmisFirsatList.length>0){
      for(const f of tmsEklenmisFirsatList){
        // v30.19: kcm_id öncelik sırası: müşteri.kcm_id → müşteri.my_id'nin kcm_id'si → girenin kcm_id'si
        const{data:oppData}=await sb.from('opportunities').insert({
          ncst,my_id:currentUser.my_id,visit_id:visitId||null,
          kcm_id:visitKcmId||null,
          musteri_my_id:visitMusteriMyId||null,
          urun_adi:f.urun,beklenen_ciro:f.tutar||null,
          tahmini_kapanis_tarihi:f.kapanis||null,
          olasilik:f.olasilik||10,
          durum:f.adim||'Fırsat',adim:f.adim||'Fırsat',
          aciklama:f.aciklama||null
        }).select();
        if(oppData&&oppData.length){
          await sb.from('opportunity_products').insert({
            opp_id:oppData[0].opp_id,urun_adi:f.urun,adet:f.adet||1,tutar:f.tutar||null
          });
        }
      }
      tmsEklenmisFirsatList=[];
      renderTmsEklenmisFirsatlar();
    }
  }
  document.getElementById('saveTemasBtn').disabled=false;
  if(error)toast('Hata (saveTemas): '+error.message,'error');
  else{
    // v30.01: wasEditing değişkeni ile doğru log aksiyonu (window.currentEditingVisitId artık null)
    // v30.29 BUG-4: Timeline'a tam detay yaz
    const logDetay = [
      'Durum: '+selectedTemasDurumuStr,
      selectedPurposes.length>0?'Amaç: '+selectedPurposes.join(', '):'',
      selectedProducts.length>0?'Ürün: '+selectedProducts.slice(0,5).join(', '):'',
      selectedResult?'Sonuç: '+selectedResult:'',
      finalNotes?'Not: '+finalNotes.slice(0,120):''
    ].filter(Boolean).join(' | ');
    if(visitId) await addLog('visits',visitId,
      wasEditing?'Güncellendi':'Oluşturuldu',
      logDetay
    );
    toast('Temas Kaydedildi!','success');
    // Görev modülü hook — görevden açıldıysa ziyareti bağla
    if(typeof gorevZiyaretKaydedildi === 'function' && window._gorevId && visitId){
      await gorevZiyaretKaydedildi(visitId);
    }
    navHistory = [];
    showPage('pageMenuTemas');
    loadTemasDashboard();
  }
  }catch(e){
    console.error('[saveTemas HATA]', e.stack||e.message, e);
    toast('Kayıt hatası: '+(e.message||'bilinmeyen'),'error');
    document.getElementById('saveTemasBtn').disabled=false;
  }
}

/* ===== TEMAS LİSTESİ ===== */
﻿async function loadTemasDashboard(){
  try{
    // ============ ZAMAN FİLTRELERİ (listTimeFilter / listStatusArr — config.js) ============
    const scope = listTimeFilter||'tumu';
    const now = new Date();
    let filterSd='', filterEd='';
    const todayTR2=trDateStr(now);
    if(scope==='bugun'){
      filterSd=trStartOfDay(todayTR2);
      filterEd=trEndOfDay(todayTR2);
    } else if(scope==='hafta'){
      const day=now.getDay()||7;
      const mon=new Date(now); mon.setDate(now.getDate()-day+1);
      filterSd=trStartOfDay(trDateStr(mon));
      filterEd=trEndOfDay(todayTR2);
    } else if(scope==='ay'){
      const tr2=new Date(now.getTime()+3*60*60*1000);
      filterSd=trStartOfMonth(tr2.getUTCFullYear(),tr2.getUTCMonth()+1);
      filterEd=trEndOfDay(todayTR2);
    }
    if(!filterEd) filterEd=trEndOfDay(todayTR2);

    const CHUNK=300;
    const chunkArr=(a,n)=>{const r=[];for(let i=0;i<a.length;i+=n)r.push(a.slice(i,i+n));return r;};
    const r2=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    const FULL_ROL=['ADMIN','SATIŞ KOORDİNATÖRÜ','SATIŞ DİREKTÖRÜ'];
    const MY_ROL=['MY','FMY','USER'];

    // ============ FİLTRE PARAMETRELERİ ============
    const fTMyId    = document.getElementById('temasMyFilter')?.value||'';
    const fTTakimId = document.getElementById('temasKcmTakimFilter')?.value||'';
    const fTKcmId   = document.getElementById('temasKcmFilter')?.value||'';
    const aktifDurumlar = listStatusArr.length>0 ? listStatusArr : ['Gerçekleşti','Planlandı'];

    // scopeKcmId
    let scopeKcmId=null;
    if(fTKcmId&&!isNaN(parseInt(fTKcmId))) scopeKcmId=parseInt(fTKcmId);
    else if(currentUser.kcm_id&&!FULL_ROL.includes(r2)) scopeKcmId=currentUser.kcm_id;

    // ============ 1. KULLANICI ID LİSTELERİ ============
    // MY ve FMY id'lerini ayrı ayrı çek — scope filtresiyle
    const getUserIds = async (yetki) => {
      let q = sb.from('users').select('my_id').eq('aktif',true).eq('yetki_seviyesi',yetki);
      if(fTMyId&&!isNaN(parseInt(fTMyId))){
        q=q.eq('my_id',parseInt(fTMyId));
      } else if(fTTakimId&&!isNaN(parseInt(fTTakimId))){
        q=q.eq('takim_lideri_id',parseInt(fTTakimId));
      } else if(scopeKcmId){
        q=q.eq('kcm_id',scopeKcmId);
      } else if(MY_ROL.includes(r2)){
        q=q.eq('my_id',currentUser.my_id);
      }
      const {data} = await q;
      return (data||[]).map(u=>u.my_id);
    };

    const [myIds, fmyIds] = await Promise.all([getUserIds('MY'), getUserIds('FMY')]);

    // ============ 2. PORTFÖY MÜŞTERİ SAYISI ============
    const countCust = async (ids) => {
      if(!ids.length) return 0;
      let total=0;
      for(const ch of chunkArr(ids,CHUNK)){
        const {count} = await sb.from('customers')
          .select('ncst',{count:'exact',head:true})
          .eq('aktif',true).in('my_id',ch);
        total += count||0;
      }
      return total;
    };

    // adım 2 ve 3 paralel
    const getNcstSet = async (ids) => {
      if(!ids.length) return new Set();
      const ncstSet=new Set();
      for(const ch of chunkArr(ids,CHUNK)){
        // Supabase default 1000 limit aşımı için range pagination
        let from=0;
        const PAGE=1000;
        while(true){
          const {data} = await sb.from('customers').select('ncst')
            .eq('aktif',true).in('my_id',ch).range(from,from+PAGE-1);
          if(!data||!data.length) break;
          data.forEach(c=>ncstSet.add(c.ncst));
          if(data.length<PAGE) break;
          from+=PAGE;
        }
      }
      return ncstSet;
    };

    const [[portfoyMY, portfoyFMY], [myNcstSet, fmyNcstSet]] = await Promise.all([
      Promise.all([countCust(myIds), countCust(fmyIds)]),
      Promise.all([getNcstSet(myIds), getNcstSet(fmyIds)])
    ]);
    const portfoyTotal = portfoyMY + portfoyFMY;

    // ============ 4. TOPLAM ZİYARET ============
    const buildTotalVisitQ = async () => {
      let q = sb.from('visits').select('visit_id',{count:'exact',head:true});
      if(filterSd) q=q.gte('tarih_saat',filterSd).lte('tarih_saat',filterEd);
      if(aktifDurumlar.length===1) q=q.eq('durum',aktifDurumlar[0]);
      else if(aktifDurumlar.length>1) q=q.in('durum',aktifDurumlar);
      if(fTMyId&&!isNaN(parseInt(fTMyId))){
        q=q.eq('my_id',parseInt(fTMyId));
      } else if(fTTakimId&&!isNaN(parseInt(fTTakimId))){
        const allIds=[...myIds,...fmyIds];
        if(allIds.length) q=q.in('my_id',allIds); else q=q.eq('my_id',-1);
      } else if(scopeKcmId){
        q=q.eq('kcm_id',scopeKcmId);
      } else if(MY_ROL.includes(r2)){
        q=q.eq('my_id',currentUser.my_id);
      }
      const {count} = await q;
      return count||0;
    };

    // ============ 5. TEMAS EDİLEN (portföy bazlı) ============
    const countContacted = async (ncstSet) => {
      if(!ncstSet.size) return 0;
      const ncstList=[...ncstSet];
      const contactedSet=new Set();
      for(const ch of chunkArr(ncstList,CHUNK)){
        // Supabase 1000 limit aşımı için pagination
        let from=0;
        const PAGE=1000;
        while(true){
          const {data} = await sb.from('visits').select('ncst')
            .in('ncst',ch).eq('durum','Gerçekleşti').range(from,from+PAGE-1);
          if(!data||!data.length) break;
          data.forEach(v=>{if(v.ncst)contactedSet.add(v.ncst);});
          if(data.length<PAGE) break;
          from+=PAGE;
        }
      }
      return contactedSet.size;
    };

    // 4+5+6 paralel - getTotalContacted önceden tanımlanıyor
    const getTotalContacted = async () => {
      // Takım veya MY filtresi seçilince: sadece portföy NCST'leri (portföy dışı dahil edilmez)
      // KÇM veya Tüm KÇM filtresi seçilince: tüm ziyaret edilen NCST'ler (portföy dışı dahil)
      if(fTMyId&&!isNaN(parseInt(fTMyId))){
        // MY filtresi: o MY'nin portföyündeki ziyaret edilen müşteriler = contactedMY veya contactedFMY
        // myNcstSet ve fmyNcstSet zaten o MY'ye göre hesaplandı
        const allNcst = new Set([...myNcstSet,...fmyNcstSet]);
        return await countContacted(allNcst);
      }
      if(fTTakimId&&!isNaN(parseInt(fTTakimId))){
        // Takım filtresi: o takımın portföyündeki ziyaret edilen müşteriler
        const allNcst = new Set([...myNcstSet,...fmyNcstSet]);
        return await countContacted(allNcst);
      }
      if(MY_ROL.includes(r2)){
        const allNcst = new Set([...myNcstSet,...fmyNcstSet]);
        return await countContacted(allNcst);
      }
      // KÇM veya Tüm KÇM: portföy dışı dahil tüm unique ziyaret edilen NCST
      const contactedSet = new Set();
      let from = 0;
      const PAGE = 1000;
      while(true){
        let q = sb.from('visits').select('ncst').eq('durum','Gerçekleşti').range(from, from+PAGE-1);
        if(scopeKcmId) q = q.eq('kcm_id', scopeKcmId);
        const {data} = await q;
        if(!data||!data.length) break;
        data.forEach(v=>{if(v.ncst)contactedSet.add(v.ncst);});
        if(data.length<PAGE) break;
        from += PAGE;
      }
      return contactedSet.size;
    };
    // ============ TEMAS SAYISI (portföy müşterilerine yapılan ziyaret SAYISI) ============
    const countVisitsForNcst = async (ncstSet) => {
      if(!ncstSet.size) return 0;
      const ncstList=[...ncstSet];
      let total=0;
      for(const ch of chunkArr(ncstList,CHUNK)){
        const {count} = await sb.from('visits')
          .select('visit_id',{count:'exact',head:true})
          .in('ncst',ch).eq('durum','Gerçekleşti');
        total += count||0;
      }
      return total;
    };

    // 4+5+6 hepsi paralel
    const [
      [totalVisit, contactedMY, contactedFMY],
      contactedTotal,
      [visitsMY, visitsFMY]
    ] = await Promise.all([
      Promise.all([buildTotalVisitQ(), countContacted(myNcstSet), countContacted(fmyNcstSet)]),
      getTotalContacted(),
      Promise.all([countVisitsForNcst(myNcstSet), countVisitsForNcst(fmyNcstSet)])
    ]);

    // ============ 6. DOM GÜNCELLE ============
    const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
    set('tmsPortfoy',    portfoyTotal.toLocaleString('tr-TR'));
    set('tmsPortfoyMY',  portfoyMY.toLocaleString('tr-TR'));
    set('tmsPortfoyFMY', portfoyFMY.toLocaleString('tr-TR'));
    set('tmsTotalVisit', totalVisit.toLocaleString('tr-TR'));
    set('tmsTotalMY',    visitsMY.toLocaleString('tr-TR'));
    set('tmsTotalFMY',   visitsFMY.toLocaleString('tr-TR'));
    set('tmsContacted',  contactedTotal.toLocaleString('tr-TR'));
    set('tmsContactedMY',  contactedMY.toLocaleString('tr-TR'));
    set('tmsContactedFMY', contactedFMY.toLocaleString('tr-TR'));
    const pMY  = portfoyMY>0  ? Math.round((contactedMY/portfoyMY)*100)   : 0;
    const pFMY = portfoyFMY>0 ? Math.round((contactedFMY/portfoyFMY)*100) : 0;
    const pGen = portfoyTotal>0 ? Math.round((contactedTotal/portfoyTotal)*100) : 0;
    set('tmsRatioMY',  '%'+pMY);
    set('tmsRatioFMY', '%'+pFMY);
    set('tmsRatio',    '%'+pGen);

    await renderTemasList();
  }catch(err){console.error(err);toast('Özet yüklenemedi','error');}
}

// ============================================================
// v30.22: ORTAK KÇM→TAKIM→MY FİLTRE ALTYAPISI
// Müşteri ekranıyla birebir aynı mantık — parametrik
// ============================================================

async function initPersonelFiltre(cfg){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const MY_ROL=['MY','FMY','USER'];
  const FULL_ROL=['ADMIN','SATIŞ DİREKTÖRÜ'];
  const TAKIM_ROL=['TAKIM LİDERİ'];

  const filterDiv=document.getElementById(cfg.filterDivId);
  if(!filterDiv) return;
  if(MY_ROL.includes(r)){ filterDiv.style.display='none'; return; }
  filterDiv.style.display='';

  // KÇM: sadece Admin/Koordinatör
  const showKcm=FULL_ROL.some(fr=>r===fr||r.startsWith(fr.split(' ')[0]));
  const kcmDiv=document.getElementById(cfg.kcmDivId);
  const kcmSel=document.getElementById(cfg.kcmSelId);
  if(kcmDiv) kcmDiv.style.display=showKcm?'':'none';
  if(showKcm&&kcmSel&&kcmSel.options.length<=1){
    const{data}=await sb.from('kcm_groups').select('*').order('kcm_id');
    (data||[]).forEach(k=>{const o=document.createElement('option');o.value=k.kcm_id;o.textContent=k.kcm_adi;kcmSel.appendChild(o);});
  }

  // Takım Lideri: MY ve Takım Lideri dışı
  const showTakim=!MY_ROL.includes(r)&&!TAKIM_ROL.includes(r);
  const takimDiv=document.getElementById(cfg.takimDivId);
  const takimSel=document.getElementById(cfg.takimSelId);
  if(takimDiv) takimDiv.style.display=showTakim?'':'none';
  if(showTakim&&takimSel&&takimSel.options.length<=1){
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
    if(!showKcm&&currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
  }

  // MY: Takım Lideri dahil herkese göster
  const myDiv=document.getElementById(cfg.myDivId);
  const mySel=document.getElementById(cfg.mySelId);
  if(myDiv) myDiv.style.display='';
  if(mySel&&mySel.options.length<=1){
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
    if(!showKcm&&currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
  }
}

async function _hiyerarsikKcmChanged(kcmSelId, takimSelId, mySelId, reloadFn){
  const kcmId=document.getElementById(kcmSelId)?.value||'';
  const takimSel=document.getElementById(takimSelId);
  if(takimSel){
    takimSel.innerHTML="<option value=''>Tüm Takım Liderleri</option>";
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
    if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
  }
  const mySel=document.getElementById(mySelId);
  if(mySel){
    mySel.innerHTML="<option value=''>Tüm MY'ler</option>";
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
    if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
  }
  if(reloadFn) await reloadFn();
}

async function _hiyerarsikTakimChanged(takimSelId, kcmSelId, mySelId, reloadFn){
  const takimId=document.getElementById(takimSelId)?.value||'';
  const kcmId=document.getElementById(kcmSelId)?.value||'';
  const mySel=document.getElementById(mySelId);
  if(mySel){
    mySel.innerHTML="<option value=''>Tüm MY'ler</option>";
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
    if(takimId) q=q.eq('takim_lideri_id',parseInt(takimId));
    else if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
  }
  if(reloadFn) await reloadFn();
}

// TEMAS FİLTRE (v30.22)
// v30.29 BUG-1: Temas filtreleri ve zaman/durum değişkenlerini sıfırla
function _resetTemasFilters(){
  // Personel filtreleri
  ['temasKcmFilter','temasKcmTakimFilter','temasMyFilter'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
  // Müşteri arama
  const mAra=document.getElementById('tmsMusteriAra');
  if(mAra) mAra.value='';
  const mNcst=document.getElementById('tmsMusteriNcst');
  if(mNcst) mNcst.value='';
  const mSec=document.getElementById('tmsMusteriSecili');
  if(mSec){mSec.style.display='none';mSec.textContent='';}
  // Zaman filtresi — Tümü'ne dön
  listTimeFilter='tumu';
  const timeFilters=document.querySelectorAll('#tmsTimeFilters .chip-btn');
  timeFilters.forEach((b,i)=>b.classList.toggle('selected',i===0));
  // Durum filtresi — her ikisi seçili
  listStatusArr=['Gerçekleşti','Planlandı'];
  document.querySelectorAll('#tmsStatusFilters .chip-btn').forEach(b=>b.classList.add('selected'));
  // Temas listesini temizle
  const listEl=document.getElementById('temasFilteredList');
  if(listEl) listEl.innerHTML='';
}

async function initTemasPersonelFilter(){
  await initPersonelFiltre({
    filterDivId:'temasFilterDiv',
    kcmDivId:'temasKcmFilterDiv', kcmSelId:'temasKcmFilter',
    takimDivId:'temasKcmTakimFilterDiv', takimSelId:'temasKcmTakimFilter',
    myDivId:'temasMyFilterDiv', mySelId:'temasMyFilter'
  });
}
async function temasKcmChanged(){
  await _hiyerarsikKcmChanged('temasKcmFilter','temasKcmTakimFilter','temasMyFilter', loadTemasDashboard);
}
async function temasKcmTakimChanged(){
  await _hiyerarsikTakimChanged('temasKcmTakimFilter','temasKcmFilter','temasMyFilter', loadTemasDashboard);
}

// PİPELİNE FİLTRE (v30.22)
async function initPpPersonelFilter(){
  await initPersonelFiltre({
    filterDivId:'ppFilterDiv',
    kcmDivId:'ppKcmFilterDiv', kcmSelId:'ppKcmFilter',
    takimDivId:'ppKcmTakimFilterDiv', takimSelId:'ppKcmTakimFilter',
    myDivId:'ppMyFilterDiv2', mySelId:'ppMyFilter2'
  });
}
async function ppKcmChanged(){
  await _hiyerarsikKcmChanged('ppKcmFilter','ppKcmTakimFilter','ppMyFilter2', loadPipeline);
}
async function ppKcmTakimChanged(){
  await _hiyerarsikTakimChanged('ppKcmTakimFilter','ppKcmFilter','ppMyFilter2', loadPipeline);
}



function setTemasTimeFilter(val,el){
  document.querySelectorAll('#tmsTimeFilters .chip-btn').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  listTimeFilter=val;
  loadTemasDashboard(); // Sayıları + listeyi birlikte güncelle
}
function toggleTemasStatusList(val,el){
  el.classList.toggle('selected');
  if(listStatusArr.includes(val)) listStatusArr=listStatusArr.filter(x=>x!==val);
  else listStatusArr.push(val);
  loadTemasDashboard(); // Sayıları + listeyi birlikte güncelle
}
async function renderTemasList(){
  const c=document.getElementById('temasFilteredList');
  if(listStatusArr.length===0){c.innerHTML='<div class="empty">En az bir durum seçin.</div>';return;}
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  if(Object.keys(myIdToName).length===0) await loadKcmMyIds();
    // v30.40: İstanbul saatiyle
  const now=new Date();
  const todayTR2=trDateStr(now);
  let sd='',ed=trEndOfDay(todayTR2);
  if(listTimeFilter!=='tumu'){
    if(listTimeFilter==='bugun')sd=trStartOfDay(todayTR2);
    if(listTimeFilter==='ay'){const tr2=new Date(now.getTime()+3*60*60*1000);sd=trStartOfMonth(tr2.getUTCFullYear(),tr2.getUTCMonth()+1);}
    if(listTimeFilter==='hafta'){const day=now.getDay()||7;const mon=new Date(now);mon.setDate(now.getDate()-day+1);sd=trStartOfDay(trDateStr(mon));}
  }
  // v30.12: KÇM/Takım/MY filtrelerini uygulayan yardımcı (renderTemasList scope'unda tanımlanıyor)
  // v30.17: _applyTemasListFilter — MY seçilince çapraz görünürlük, KÇM seçilince OR mantığı
  async function _applyTemasListFilter(q){
    const fMy=document.getElementById('temasMyFilter')?.value||'';
    const fTakim=document.getElementById('temasKcmTakimFilter')?.value||'';
    const fKcm=document.getElementById('temasKcmFilter')?.value||'';
    if(fMy&&!isNaN(parseInt(fMy))){
      // MY seçili: o MY'nin girdiği VEYA o MY'nin müşterisine girilen
      return q.or(`my_id.eq.${parseInt(fMy)},musteri_my_id.eq.${parseInt(fMy)}`);
    }
    if(fTakim&&!isNaN(parseInt(fTakim))){
      const takimLiderId=parseInt(fTakim);
      const{data:tm}=await sb.from('users').select('my_id').eq('takim_lideri_id',takimLiderId).eq('aktif',true);
      const ids=[...new Set([takimLiderId,...(tm||[]).map(u=>u.my_id)])];
      if(!ids.length) return q.eq('my_id',-1);
      return q.or(`my_id.in.(${ids.join(',')}),musteri_my_id.in.(${ids.join(',')})`);
    }
    if(fKcm&&!isNaN(parseInt(fKcm))){
      const kcmId=parseInt(fKcm);
      const{data:km}=await sb.from('users').select('my_id').eq('kcm_id',kcmId).eq('aktif',true);
      const kIds=(km||[]).map(u=>u.my_id);
      if(kIds.length) return q.or(`kcm_id.eq.${kcmId},musteri_my_id.in.(${kIds.join(',')})`)
      return q.eq('kcm_id',kcmId);
    }
    return applyRBAC(q);
  }
  let allData=[];
  try{
    const tmsMusteriNcst=document.getElementById('tmsMusteriNcst')?.value||'';
    console.log('[renderTemasList] sd=',sd,'ed=',ed,'statusArr=',listStatusArr);
    if(listStatusArr.includes('Gerçekleşti')){
      let q=sb.from('visits').select('*').eq('durum','Gerçekleşti').order('tarih_saat',{ascending:false}).limit(200);
      if(sd) q=q.gte('tarih_saat',sd).lte('tarih_saat',ed);
      if(tmsMusteriNcst) q=q.eq('ncst',tmsMusteriNcst);
      const filteredQ=await _applyTemasListFilter(q);
      const{data,error}=await filteredQ;
      console.log('[renderTemasList] Gerçekleşti count=',data?.length,'error=',error?.message);
      if(error)throw error;if(data)allData=allData.concat(data);
    }
    if(listStatusArr.includes('Planlandı')){
      let q=sb.from('visits').select('*').eq('durum','Planlandı').order('planlanan_tarih',{ascending:true}).limit(200);
      if(sd) q=q.gte('planlanan_tarih',sd.split('T')[0]).lte('planlanan_tarih',ed.split('T')[0]);
      if(tmsMusteriNcst) q=q.eq('ncst',tmsMusteriNcst);
      const filteredQ2=await _applyTemasListFilter(q);
      const{data,error}=await filteredQ2;
      console.log('[renderTemasList] Planlandı count=',data?.length,'error=',error?.message);
      if(error)throw error;if(data)allData=allData.concat(data);
    }
    if(allData.length===0){c.innerHTML='<div class="empty">Kayıt bulunamadı.</div>';return;}
    // Müşteri bilgileri
    let custMap={};const ncstList=[...new Set(allData.map(v=>v.ncst))];
    if(ncstList.length>0){const{data:cd}=await sb.from('customers').select('ncst,unvan,my_id').in('ncst',ncstList);if(cd)cd.forEach(f=>{custMap[f.ncst]={unvan:f.unvan,my_id:f.my_id};});}
    // v30.29: Kontak isimlerini batch çek
    let kontakMap={};
    const contactIds=[...new Set(allData.map(v=>v.contact_id).filter(Boolean))];
    if(contactIds.length>0){
      const{data:kontaklar}=await sb.from('contacts').select('contact_id,ad_soyad').in('contact_id',contactIds);
      if(kontaklar)kontaklar.forEach(k=>{kontakMap[k.contact_id]=k.ad_soyad;});
    }
    allData.sort((a,b)=>{const da=new Date(a.durum==='Planlandı'?a.planlanan_tarih:a.tarih_saat).getTime();const db=new Date(b.durum==='Planlandı'?b.planlanan_tarih:b.tarih_saat).getTime();return db-da;});
    c.innerHTML=allData.slice(0,100).map(v=>{const isPlan=v.durum==='Planlandı';const dateStr=isPlan?(v.planlanan_tarih?new Date(v.planlanan_tarih+'T00:00:00').toLocaleDateString('tr-TR'):'—'):new Date(v.tarih_saat).toLocaleDateString('tr-TR'); // v30.21: planlanan_tarih formatı GG.AA.YYYY
const custObj=typeof custMap[v.ncst]==='object'?custMap[v.ncst]:{unvan:custMap[v.ncst]||v.ncst,my_id:null};const firmName=custObj.unvan||v.ncst;const custMyId=custObj.my_id;return `<div class="visit-card" style="position:relative;" onclick="showEditVisitModalById(${v.visit_id})"><div class="visit-firm">${escapeHTML(firmName)}</div>${isAdmin()?`<button onclick="event.stopPropagation();deleteVisit(${v.visit_id})" style="position:absolute;top:8px;right:8px;background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;">🗑</button>`:''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
            <span style="font-size:11px;color:var(--text2);">📍 ${escapeHTML(v.temas_turu||'')}</span>
            <span style="font-size:11px;color:var(--text3);">📅 ${dateStr}</span>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:2px;">
            ${(()=>{
              // v30.20: musteri_my_id = kayıt anındaki sahip, custMyId = güncel sahip
              const kayitSahibiId=v.musteri_my_id;
              const guncelSahibiId=custMyId;
              const girenId=v.my_id;
              let t='';
              if(kayitSahibiId){
                t+=`👤 Portföy: ${escapeHTML(myIdToName[kayitSahibiId]||'#'+kayitSahibiId)}`;
                if(guncelSahibiId&&guncelSahibiId!==kayitSahibiId)
                  t+=` → <span style="color:var(--blue);">${escapeHTML(myIdToName[guncelSahibiId]||'#'+guncelSahibiId)}</span>`;
              } else if(guncelSahibiId){
                t+=`👤 Portföy: ${escapeHTML(myIdToName[guncelSahibiId]||'#'+guncelSahibiId)}`;
              } else {
                t+=`<span style="color:var(--amber);">⚠ Portföy atanmamış</span>`;
              }
              if(girenId&&girenId!==kayitSahibiId&&girenId!==guncelSahibiId)
                t+=` · Giren: ${escapeHTML(myIdToName[girenId]||'#'+girenId)}`;
              return t;
            })()}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:3px;">${escapeHTML(v.ziyaret_amaci||'')}</div>
          ${v.contact_id&&kontakMap[v.contact_id]?`<div style="font-size:11px;color:var(--text2);margin-bottom:2px;">🧑 Kontak: <b>${escapeHTML(kontakMap[v.contact_id])}</b></div>`:''}
          ${!isPlan&&v.ziyaret_sonucu?`<div style="font-size:11px;color:var(--text2);margin-bottom:2px;">✅ Sonuç: <b>${escapeHTML(v.ziyaret_sonucu)}</b></div>`:''}
          <div class="visit-tags mt-8"><span class="tag ${isPlan?'tag-amber':'tag-green'}">${v.durum}</span>${v.urun_gruplari?`<span class="tag tag-blue">${escapeHTML(v.urun_gruplari.substring(0,40))}</span>`:''}</div></div>`;}).join('');
  }catch(err){console.error(err);c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;}
}

/* ===== TEMAS DÜZENLE ===== */
async function showEditVisitModalById(visitId){
  const{data:visit,error}=await sb.from('visits').select('*').eq('visit_id',visitId).single();
  if(error||!visit){toast('Kayıt bulunamadı','error');return;}
  // Yetki kontrolü - MY KÇM'sindeki tüm kayıtları açabilir
  const _rVE=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  if(_rVE==='MY'||_rVE==='FMY'||_rVE==='USER'){
    if(currentUser.kcm_id && visit.kcm_id && visit.kcm_id!==currentUser.kcm_id){
      toast('Bu kaydı görmeye yetkiniz yok','error');return;
    }
  }
  showEditVisitModal(visit);
  // Modal açıldıktan sonra sil butonunu ayarla
  setTimeout(()=>{
    const vDelBtn=document.getElementById('visitDeleteBtn');
    if(vDelBtn){
      vDelBtn.style.display=isAdmin()?'':'none';
      vDelBtn.onclick=()=>deleteVisit(visitId);
    }
  },200);
}
async function canEditVisit(visit){
  if(!visit)return false;
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();

  // Admin/KÇM rolleri her zaman düzenleyebilir
  if(['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ DESTEK','OPERASYON MÜDÜRÜ'].includes(r)) return true;

  // MY / FMY / USER
  // v30.25: Kendi girdiği kayıt (my_id eşleşiyor) → 24 saat içinde düzenleyebilir
  //         Başkasının girdiği kayıt → düzenleyemez (sadece görüntüler)
  const benimKayit = visit.my_id === currentUser.my_id;
  if(!benimKayit) return false;

  // Planlandı → süresiz düzenlenebilir (tarih gelene kadar)
  if(visit.durum==='Planlandı') return true;

  // Gerçekleşti → 24 saat kuralı
  if(visit.tarih_saat){
    const gecenSaat=(Date.now()-new Date(visit.tarih_saat).getTime())/(1000*60*60);
    return gecenSaat<=24;
  }
  return true;
}
async function showEditVisitModal(visit){
  // v30.26: Tüm durumlar için tam temas formu açılıyor
  // Planlandı veya Gerçekleşti — her ikisi de openTemasFormForEdit ile açılır
  // Düzenleme yetkisi yoksa salt okunur modda aç
  const editable = await canEditVisit(visit);

  if(!editable){
    // Salt okunur: yetki yok veya süre dolmuş
    const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    const benimKayit=visit.my_id===currentUser.my_id;
    const msg=!benimKayit
      ?'Bu kaydı düzenleyemezsiniz — başka bir kullanıcı tarafından girilmiş.'
      :'Düzenleme süresi doldu (24 saat).';
    // Salt okunur modda da formu göster (sadece kaydet butonu disabled)
    openTemasFormForEdit(visit, false);
    setTimeout(()=>toast(msg,'info'), 400);
    return;
  }
  openTemasFormForEdit(visit, true);
}

// v30.30: Yardımcı — chip seçimi (retry ile, DOM hazır olmayabilir)
function _chipSec(selector, degerler, maxRetry=5, interval=200){
  if(!degerler||!degerler.length) return;
  let attempt=0;
  const try_=()=>{
    const chips=document.querySelectorAll(selector);
    if(!chips.length&&attempt<maxRetry){ attempt++; setTimeout(try_,interval); return; }
    chips.forEach(chip=>{
      if(degerler.includes(chip.textContent.trim())&&!chip.classList.contains('selected')) chip.click();
    });
  };
  try_();
}

async function openTemasFormForEdit(visit, editable){
  // v30.32: initTemasForm'u atla, buildTemasUI'yı kendimiz çalıştırıyoruz
  window._temasEditMode = true;
  window.currentEditingVisitId = editable ? visit.visit_id : null;

  navTo('pageTemasForm', true);

  // initTemasForm flag sayesinde hemen dönüyor
  // buildTemasUI async — chip'leri DB'den yükler, bitince seçimleri yaparız
  await buildTemasUI();

  const isPlan = visit.durum==='Planlandı';
  setTemasDurumu(isPlan?'Planlandı':'Gerçekleşti');

  // Chip seçimlerini sıfırla (buildTemasUI sonrası)
  selectedPurposes=[];
  selectedProducts=[];
  selectedResult='';
  document.querySelectorAll('#temasAmacGrid .product-chip,#temasProductGrid .product-chip,#temasResultGrid .product-chip,#temasResultGrid .sonuc-item').forEach(e=>e.classList.remove('selected'));

  // BUG-1: Tarih — Gerçekleşen kilitle
  const tarihEl=document.getElementById('temasGercTarih');
  if(tarihEl){
    if(!isPlan&&visit.tarih_saat){
      // v30.40: UTC'den İstanbul (+3)
      const d=new Date(visit.tarih_saat);
      const trD=new Date(d.getTime()+3*60*60*1000);
      tarihEl.value=trD.toISOString().slice(0,16);
    }
    tarihEl.disabled=!isPlan;
    tarihEl.style.opacity=(!isPlan)?'0.5':'1';
    tarihEl.title=(!isPlan)?'Gerçekleşen temas tarihi değiştirilemez':'';
  }
  const planTarihEl=document.getElementById('temasTarihi');
  if(planTarihEl&&visit.planlanan_tarih) planTarihEl.value=visit.planlanan_tarih;

  // Yöntem
  if(visit.temas_turu){
    document.querySelectorAll('#temasYontemiGrid .chip-btn').forEach(btn=>{
      if(btn.textContent.trim()===visit.temas_turu) btn.click();
    });
  }

  // BUG-4: Amaçlar — buildTemasUI bitti, chip'ler DOM'da
  if(visit.ziyaret_amaci){
    const amaclar=visit.ziyaret_amaci.split(',').map(x=>x.trim()).filter(Boolean);
    document.querySelectorAll('#temasAmacGrid .product-chip').forEach(chip=>{
      if(amaclar.includes(chip.textContent.trim())) chip.click();
    });
  }

  // BUG-4: Ürünler
  if(visit.urun_gruplari){
    const urunler=visit.urun_gruplari.split(',').map(x=>x.trim()).filter(Boolean);
    document.querySelectorAll('#temasProductGrid .product-chip').forEach(chip=>{
      if(urunler.includes(chip.textContent.trim())) chip.click();
    });
  }

  // BUG-3: Sonuç
  if(!isPlan&&visit.ziyaret_sonucu){
    document.querySelectorAll('#temasResultGrid .product-chip,#temasResultGrid .sonuc-item').forEach(chip=>{
      if(chip.textContent.trim()===visit.ziyaret_sonucu) chip.click();
    });
  }

  // Notlar boş
  const notEl=document.getElementById('temasNotes');
  if(notEl) notEl.value='';

  // BUG-2: Müşteri + Kontak
  if(visit.ncst){
    const{data:custData}=await sb.from('customers').select('*').eq('ncst',visit.ncst).single();
    if(custData){
      await selC(custData);
      if(visit.contact_id){
        const tryC=(att=0)=>{
          const e=document.getElementById('citem_'+visit.contact_id);
          if(e&&!e.classList.contains('selected')) e.click();
          else if(!e&&att<10) setTimeout(()=>tryC(att+1),200);
        };
        setTimeout(()=>tryC(),100);
      }
    }
  }

  // BUG-5: Timeline
  const tlSec=document.getElementById('temasTimelineSection');
  if(tlSec) tlSec.style.display='';
  if(visit.visit_id){
    const logSec=document.getElementById('temasEditTimeline');
    if(logSec){
      logSec.innerHTML='<div style="font-size:12px;color:var(--text3);">Yükleniyor...</div>';
      loadLogs('visits',visit.visit_id).then(logs=>{
        logSec.innerHTML=renderLoglar?.(logs)||renderLogSection('visits',visit.visit_id,logs,'v_'+visit.visit_id)||'<div style="font-size:12px;color:var(--text3);">Kayıt yok.</div>';
      });
    }
  }

  // UI ayarları
  const saveBtn=document.getElementById('saveTemasBtn');
  if(saveBtn) saveBtn.style.display=editable?'':'none';
  const topbarTitle=document.querySelector('#pageTemasForm .topbar-title');
  if(topbarTitle) topbarTitle.textContent=editable?'Temas Düzenle':'Temas Detay';
}
function toggleEditArr(arrName,val,el){
  el.classList.toggle('selected');
  if(!window[arrName])window[arrName]=[];
  const i=window[arrName].indexOf(val);
  if(i>-1)window[arrName].splice(i,1);else window[arrName].push(val);
}
function editVisitSetYontem(el,val){document.querySelectorAll('#editYontemGrid .chip-btn').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');window._editYontemStr=val;}
async function updateVisit(){
  // Yetki kontrolü - MY sadece kendi girdiğini düzenleyebilir
  const _rUV=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  if(_rUV==='MY'||_rUV==='FMY'||_rUV==='USER'){
    const{data:vCheck}=await sb.from('visits').select('my_id').eq('visit_id',window.currentEditingVisitId).single();
    if(vCheck&&vCheck.my_id!==currentUser.my_id){
      toast('Sadece kendi girdiğiniz kayıtları düzenleyebilirsiniz','error');return;
    }
  }
  const notes=document.getElementById('editNotes')?.value||'';
  const sonucEl=document.getElementById('editSonuc');
  const planTarihEl=document.getElementById('editPlanTarih');
  const upd={
    temas_turu:window._editYontemStr||'Ziyaret',
    ziyaret_amaci:(window._editAmacArr||[]).join(', '),
    urun_gruplari:(window._editUrunArr||[]).join(', '),
    ziyaret_amaci_detay:notes
  };
  if(sonucEl)upd.ziyaret_sonucu=sonucEl.value;
  if(planTarihEl&&planTarihEl.value)upd.planlanan_tarih=planTarihEl.value;
  upd.guncelleme_tarihi=new Date().toISOString();const{error}=await sb.from('visits').update(upd).eq('visit_id',window.currentEditingVisitId);
  if(error)toast('Güncelleme hatası: '+error.message,'error');
  else{
    await addLog('visits',window.currentEditingVisitId,'Güncellendi','Temas düzenlendi');
    toast('Temas güncellendi','success');
    closeModal('editVisitModal');
    renderTemasList();
  }
}
async function openEditPlanModal(visitId){
  const{data:plan}=await sb.from('visits').select('*').eq('visit_id',visitId).single();
  if(!plan){toast('Plan bulunamadı','error');return;}
  currentEditPlanId=visitId;
  document.getElementById('editPlanForm').innerHTML=`<div class="field"><label>Not / Gündem</label><textarea id="editPlanNote">${escapeHTML(plan.ziyaret_amaci||'')}</textarea></div><div class="field"><label>Planlanan Tarih</label><input type="date" id="editPlanDate" value="${plan.planlanan_tarih||''}"></div>`;
  openModal('editPlanModal');
  document.getElementById('editPlanUpdateBtn').onclick=async()=>{await sb.from('visits').update({ziyaret_amaci:document.getElementById('editPlanNote').value,planlanan_tarih:document.getElementById('editPlanDate').value,guncelleme_tarihi:new Date().toISOString()}).eq('visit_id',currentEditPlanId);toast('Plan güncellendi','success');closeModal('editPlanModal');renderTemasList();};
  document.getElementById('editPlanCompleteBtn').onclick=async()=>{await sb.from('opportunities').update({visit_id:null}).eq('visit_id',currentEditPlanId);await sb.from('visits').delete().eq('visit_id',currentEditPlanId);const{data:cd}=await sb.from('customers').select('*').eq('ncst',plan.ncst).single();if(cd)await selC(cd);setTemasDurumu('Gerçekleşti');document.getElementById('temasNotes').value=plan.ziyaret_amaci||'';closeModal('editPlanModal');navTo('pageTemasForm',false);toast('Formu tamamlayın.','info');};
  document.getElementById('editPlanCancelBtn').onclick=async()=>{if(confirm('Temas iptal edilsin mi?')){await sb.from('visits').update({durum:'İptal Edildi'}).eq('visit_id',currentEditPlanId);toast('İptal edildi','success');closeModal('editPlanModal');renderTemasList();}};
}

/* ===== TEMAS RAPORU ===== */
function toggleRepStatus(val,el){el.classList.toggle('selected');if(repStatusArr.includes(val))repStatusArr=repStatusArr.filter(x=>x!==val);else repStatusArr.push(val);}
function toggleRepType(val,el){el.classList.toggle('selected');if(repTypeArr.includes(val))repTypeArr=repTypeArr.filter(x=>x!==val);else repTypeArr.push(val);}
async function fetchAdvancedReport(){
  const c=document.getElementById('reportListContent');
  if(repStatusArr.length===0){c.innerHTML='<div class="empty">Statü seçin.</div>';return;}
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const sDate=document.getElementById('repStartDate').value;const eDate=document.getElementById('repEndDate').value;
  let allData=[];
  try{
    if(repStatusArr.includes('Gerçekleşti')){let q=sb.from('visits').select('*').eq('durum','Gerçekleşti').limit(200);q=applyRBAC(q);if(repTypeArr.length>0)q=q.in('temas_turu',repTypeArr);if(sDate)q=q.gte('tarih_saat',trStartOfDay(sDate));if(eDate)q=q.lte('tarih_saat',trEndOfDay(eDate));const{data,error}=await q;if(error)throw error;if(data)allData=allData.concat(data);}
    if(repStatusArr.includes('Planlandı')){let q=sb.from('visits').select('*').eq('durum','Planlandı').limit(200);q=applyRBAC(q);if(repTypeArr.length>0)q=q.in('temas_turu',repTypeArr);if(sDate)q=q.gte('planlanan_tarih',sDate);if(eDate)q=q.lte('planlanan_tarih',eDate);const{data,error}=await q;if(error)throw error;if(data)allData=allData.concat(data);}
    if(allData.length===0){c.innerHTML='<div class="empty">Kayıt bulunamadı.</div>';return;}
    let custMap={};const ncstList=[...new Set(allData.map(v=>v.ncst))];if(ncstList.length>0){const{data:cd}=await sb.from('customers').select('ncst,unvan').in('ncst',ncstList);if(cd)cd.forEach(f=>{custMap[f.ncst]=f.unvan;});}
    allData.sort((a,b)=>new Date(b.durum==='Planlandı'?b.planlanan_tarih:b.tarih_saat)-new Date(a.durum==='Planlandı'?a.planlanan_tarih:a.tarih_saat));
    // Excel için veriyi sakla
    window._lastReportData = allData;
    window._lastReportCustMap = custMap;
    // Excel butonunu göster
    const excelBtn=document.getElementById('repExcelBtn');
    if(excelBtn) excelBtn.classList.remove('hide');
    window._lastReportData=allData;
    window._lastReportCustMap=custMap;
    document.getElementById('repExcelBtn')?.classList.remove('hide');
    c.innerHTML=allData.slice(0,200).map(v=>{const isPlan=v.durum==='Planlandı';const firmName=custMap[v.ncst]||v.ncst;return `<div class="visit-card"><div class="visit-firm">${escapeHTML(firmName)}</div><div class="visit-my">📅 ${isPlan?(v.planlanan_tarih?new Date(v.planlanan_tarih+'T00:00:00').toLocaleDateString('tr-TR'):'—'):fmtDate(v.tarih_saat)} | 📍 ${escapeHTML(v.temas_turu)}</div><div style="font-size:12px;color:var(--text3);margin-top:4px;">${escapeHTML(v.ziyaret_amaci||'')}</div><div class="visit-tags mt-8"><span class="tag tag-gray">${v.durum}</span></div></div>`;}).join('');
  }catch(err){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;}
}