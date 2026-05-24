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
  if(saved){ currentUser=saved; initApp(); } else showPage('pageLogin');
};
function setAppVersion(){const now=new Date();document.getElementById('appVersionInfo').innerText=`V30.41 | ${now.toLocaleDateString('tr-TR')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;}
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

async function initApp(){
  showPage('pageDash');
  loadDashboard();
  await loadProductsFromDB();
  await loadKcmMyIds();
  await loadBagliMyIds(); // KÇM müdürü ise KÇM'indeki MY'leri yükle
  await buildTemasUI();
  buildUrunSelects();
}

let myIdToName = {}; // my_id → ad_soyad map (tüm kullanıcılar)

async function loadKcmMyIds(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const kcmRoller=['KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ DESTEK','ÇÖZÜM SATIŞ TEMSİLCİSİ','ÇÖZÜM SATIŞ UZMANI','TURKCELL BÖLGE YÖNETİCİSİ','MY','USER'];
  const full=['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ'];
  // Tüm kullanıcıları yükle - my_id → ad_soyad map
  // v30.20: Pasif kullanıcılar da myIdToName'e ekleniyor — eski kayıtlarda adları görünsün
  const{data:allUsers}=await sb.from('users').select('my_id,ad_soyad,kcm_id,aktif');
  (allUsers||[]).forEach(u=>{
    // Pasif kullanıcı adının yanına (Ayrıldı) etiketi ekle
    myIdToName[u.my_id] = u.aktif ? u.ad_soyad : u.ad_soyad+' (Ayrıldı)';
  });
  if(kcmRoller.includes(r)&&currentUser.kcm_id){
    const{data}=await sb.from('users').select('my_id').eq('kcm_id',currentUser.kcm_id).eq('aktif',true);
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
// v30.17: applyRBAC — KÇM rolleri için çapraz ziyaret görünürlüğü
// "Müşteri bu KÇM'de → kaydı kim girmiş olursa olsun görünsün"
// Supabase OR: kcm_id eşleşir VEYA musteri_my_id bu KÇM'nin MY listesindedir
function applyRBAC(q,prefix=''){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const full=['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ'];
  if(full.includes(r)) return q;
  if(r==='MY'||r==='FMY'||r==='USER'){
    // MY: kendi girdiği VEYA portföyündeki müşteriye girilen kayıtlar
    const mid=currentUser.my_id;
    return q.or(`my_id.eq.${mid},musteri_my_id.eq.${mid}`);
  }
  // KÇM rolleri (Müdür, Takım Lideri, Satış Destek, Operasyon Müdürü vb.)
  // → kcm_id bu KÇM'e ait VEYA müşterisi bu KÇM'de (musteri_my_id bu KÇM'in MY'lerinden)
  if(currentUser.kcm_id){
    const kcmId=currentUser.kcm_id;
    if(kcmMyIds&&kcmMyIds.length>0){
      // Supabase OR: kayıdın kcm_id'si eşleşiyor VEYA müşterinin MY'si bu KÇM'den
      const myIdList=kcmMyIds.join(',');
      return q.or(`kcm_id.eq.${kcmId},musteri_my_id.in.(${myIdList})`);
    }
    return q.eq('kcm_id',kcmId);
  }
  return q.eq(`${prefix}my_id`, currentUser.my_id);
}
function getCustomerBaseQuery(){
  let q=sb.from('customers').select('ncst,my_id,kcm_id,unvan,il,ilce,musteri_tipi,aktif,vergi_no,beyaz_yakali_sayi,sube_lokasyon,sube_detay,sunucu_altyapisi,sunucu_detay,it_ekibi,it_ekip_sayisi,firewall_kullanimi,firewall_detay,adres,telefon,churn_riski,toplam_hat,profil_tamamlandi').eq('aktif',true);
  return applyScope(q,'musteri');
}

