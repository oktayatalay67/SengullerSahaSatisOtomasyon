// ============================================================
// auth.js — v1.2.2
// Son güncelleme: 2026-06-08
// Değişiklikler:
//   v1.2.2 — sanalMyIds global dizi; loadKcmMyIds is_sanal yükler; applyRBAC KÇM için musteri_my_id OR kaldırıldı
//   v1.2.1 — getCustomerBaseQuery forForm parametresi: temas/fırsat formunda KÇM scope
//   v1.2.0 — B6 fix: localStorage kullanıcısı DB'den doğrulanıyor (pasif/rol değişikliği)
// ============================================================
'use strict';
/* ===== AUTH & INIT ===== */
window.onload=async()=>{
  setAppVersion();
  let url = null, key = null;
  // 1. Öncelik: Hardcoded config (Workers için)
  if(_HARDCODED_URL && _HARDCODED_KEY){
    url = _HARDCODED_URL;
    key = _HARDCODED_KEY;
  }
  // 2. Öncelik: config.json (Pages için)
  if(!url||!key){
    try{
      const r = await fetch('./config.json');
      if(r.ok){ const c=await r.json(); url=c.url||null; key=c.key||null; }
    }catch(e){}
  }
  // 3. Öncelik: localStorage (setup ekranından girilmiş)
  if(!url||!key){
    url = localStorage.getItem('sb_u');
    key = localStorage.getItem('sb_k');
  }
  if(!url||!key){ showPage('pageSetup'); return; }
  sb = supabase.createClient(url, key);
  document.getElementById('dbLedSpan')?.classList.remove('hide');
  const saved = JSON.parse(localStorage.getItem('cu')||'null');
  if(saved){
    // B6 fix: localStorage'daki kullanıcıyı DB'den doğrula (pasif/rol değişikliği kontrolü)
    const{data:dbUser,error:dbErr}=await sb.from('users').select('*').eq('my_id',saved.my_id).eq('aktif',true).single();
    if(dbErr||!dbUser){ localStorage.removeItem('cu'); showPage('pageLogin'); return; }
    // DB'den güncel bilgileri al, sifre_hash hariç
    currentUser = Object.assign({}, dbUser);
    const safeUser = Object.assign({}, currentUser);
    delete safeUser.sifre_hash;
    localStorage.setItem('cu', JSON.stringify(safeUser));
    initApp();
  } else showPage('pageLogin');
};
function setAppVersion(){const now=new Date();document.getElementById('appVersionInfo').innerText=`V30.42 | ${now.toLocaleDateString('tr-TR')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;}
async function saveSetup(){const u=document.getElementById('sbUrl').value,k=document.getElementById('sbKey').value;if(u&&k){sb=supabase.createClient(u,k);localStorage.setItem('sb_u',u);localStorage.setItem('sb_k',k);location.reload();}}
async function doLogin(){
  const e=document.getElementById('loginEmail').value.toLowerCase().trim();
  const p=document.getElementById('loginPass').value.trim();
  if(!e||!p){toast('Email ve şifre girin','error');return;}
  const{data,error}=await sb.from('users').select('*').eq('email',e);
  if(error||!data?.length){toast('Kullanıcı bulunamadı','error');return;}
  if(data[0].sifre_hash!==p){toast('Şifre hatalı','error');return;}
  currentUser=data[0];
  // v30.07: sifre_hash localStorage'a yazılmıyor (güvenlik iyileştirmesi)
  const safeUser = Object.assign({}, currentUser);
  delete safeUser.sifre_hash;
  localStorage.setItem('cu',JSON.stringify(safeUser));
  if(currentUser.sifre_hash==='12345'){
    initApp();
    setTimeout(()=>{
      document.getElementById('sifreModalTitle').textContent='🔐 İlk Giriş - Şifrenizi Değiştirin';
      document.getElementById('sifreIptalBtn').style.display='none';
      document.getElementById('sifreMevcut').value='12345';
      openModal('sifreModal');
    },800);
  } else {
    initApp();
  }
}


/* ===== INIT APP ===== */
/* ===== INIT APP ===== */
let kcmMyIds = []; // KÇM müdürü için kendi KÇM'indeki MY id listesi
let sanalMyIds = []; // v1.2.2: Sanal MY ID'leri — portföy hesabına dahil edilmez (ID: 100,101,103)

async function initApp(){
  showPage('pageDash');
  await loadProductsFromDB();
  await loadKcmMyIds();
  await loadBagliMyIds();
  loadDashboard();
}

let myIdToName = {}; // my_id → ad_soyad map (tüm kullanıcılar)

async function loadKcmMyIds(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const kcmRoller=['KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','SATIŞ DESTEK','ÇÖZÜM SATIŞ TEMSİLCİSİ','ÇÖZÜM SATIŞ UZMANI','TURKCELL BÖLGE YÖNETİCİSİ','MY','USER'];
  // v1.2.2: is_sanal kolonu da çek
  const{data:allUsers}=await sb.from('users').select('my_id,ad_soyad,kcm_id,aktif,is_sanal');
  (allUsers||[]).forEach(u=>{
    myIdToName[u.my_id] = u.aktif ? u.ad_soyad : u.ad_soyad+' (Ayrıldı)';
  });
  // v1.2.2: Sanal MY'leri global diziye al — portföy hesaplarında hariç tutulacak
  sanalMyIds = (allUsers||[]).filter(u=>u.is_sanal).map(u=>u.my_id);

  if(kcmRoller.includes(r)&&currentUser.kcm_id){
    // v1.2.2: Sanal MY'ler kcmMyIds'e girmesin
    const{data}=await sb.from('users').select('my_id')
      .eq('kcm_id',currentUser.kcm_id).eq('aktif',true).eq('is_sanal',false);
    kcmMyIds=(data||[]).map(u=>u.my_id);
  }
}
function loadDashboard(){
  const dnEl=document.getElementById('dashNameText');if(dnEl)dnEl.textContent=escapeHTML(currentUser.ad_soyad);else document.getElementById('dashName').textContent='⚙️ '+escapeHTML(currentUser.ad_soyad);
  document.getElementById('dashKcm').textContent=escapeHTML(currentUser.kcm_adi||'')+' — '+escapeHTML(currentUser.yetki_seviyesi);
  if(hasPerm('admin_panel')){
    const ab=document.getElementById('adminMenuBox');
    if(ab)ab.classList.remove('hide');
  }
  if(hasPerm('yonetici_panel')){
    const ymBox=document.getElementById('yoneticiMenuBox');
    if(ymBox)ymBox.classList.remove('hide');
  }
}
// v1.2.2: applyRBAC — KÇM rolleri sadece kcm_id ile filtreler
// musteri_my_id.in.(...) OR kaldırıldı: full table scan'e yol açıyordu
function applyRBAC(q,prefix=''){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const full=['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ'];
  if(full.includes(r)) return q;
  if(r==='MY'||r==='FMY'||r==='USER'){
    const mid=currentUser.my_id;
    return q.or(`my_id.eq.${mid},musteri_my_id.eq.${mid}`);
  }
  // KÇM rolleri — kcm_id index üzerinden hızlı filtre
  if(currentUser.kcm_id){
    return q.eq('kcm_id', currentUser.kcm_id);
  }
  return q.eq(`${prefix}my_id`, currentUser.my_id);
}
// v1.2.1: forForm=true → temas/fırsat formunda müşteri arama (KÇM scope)
//         forForm=false → müşteri listesi ekranı (PRT scope, portföy)
function getCustomerBaseQuery(forForm=false){
  let q=sb.from('customers').select('ncst,my_id,kcm_id,unvan,il,ilce,musteri_tipi,aktif,vergi_no,beyaz_yakali_sayi,sube_lokasyon,sube_detay,sunucu_altyapisi,sunucu_detay,it_ekibi,it_ekip_sayisi,firewall_kullanimi,firewall_detay,adres,telefon,churn_riski,toplam_hat,profil_tamamlandi').eq('aktif',true);
  return forForm ? applyScope(q,'temas') : applyScope(q,'musteri');
}