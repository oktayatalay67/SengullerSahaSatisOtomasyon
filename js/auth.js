// ============================================================
// auth.js — v1.2.11
// Son güncelleme: 2026-06-24
// Değişiklikler:
//   v1.2.10 — setAppVersion artık tek kaynak APP_VERSION'ı (config.js) kullanıyor.
//             Sayfa açılışında applyAppVersion() otomatik çağrılıyor — HTML'deki
//             tüm .app-ver etiketleri ve <title> artık elle değil, otomatik dolduruluyor.
//   v1.2.9 — Impersonation kökten değişti: currentUser swap yerine localStorage('cu')
//            değiştirilip sayfa reload ediliyor. Mevcut login akışı (init→initApp)
//            hedef kullanıcıyı sıfırdan yükler — musteriAllLoaded, GOREV.filter,
//            dropdown filtreleri gibi modül state'leri artık doğal olarak sıfırlanıyor.
//   v1.2.8 — (denendi, yetersiz kaldı — currentUser swap modül state'lerini resetlemiyordu)
//   v1.2.5 — window.userScope eklendi: myIds/fmyIds login'de bir kez hesaplanır, dashboard'da DB'ye gitmiyor
//   v1.2.4 — myIdToRol global eklendi; loadKcmMyIds yetki_seviyesi yükler
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
    // v1.2.8: Impersonation banner — reload sonrası hâlâ aktifse göster
    if(localStorage.getItem('impersonating')==='1'){
      setTimeout(()=>{
        const banner=document.getElementById('impersonationBanner');
        const label=document.getElementById('impersonationLabel');
        if(banner&&label){
          const rol=currentUser.yetki_seviyesi||currentUser.role||'';
          label.textContent=`${currentUser.ad_soyad} (${rol})`;
          banner.style.display='flex';
          const h=banner.offsetHeight||40;
          document.querySelectorAll('.page').forEach(p=>p.style.top=h+'px');
        }
      },50);
    }
  } else showPage('pageLogin');
};
function setAppVersion(){const now=new Date();document.getElementById('appVersionInfo').innerText=`${APP_VERSION} | ${now.toLocaleDateString('tr-TR')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;}
// v1.2.9: Sayfa yüklenir yüklenmez tüm .app-ver etiketlerini ve title'ı tek kaynaktan doldur
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', applyAppVersion); }
else { applyAppVersion(); }
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
let myIdToRol  = {}; // v1.2.4: my_id → yetki_seviyesi (MY/FMY/...)

async function loadKcmMyIds(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const kcmRoller=['KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','SATIŞ DESTEK','ÇÖZÜM SATIŞ TEMSİLCİSİ','ÇÖZÜM SATIŞ UZMANI','TURKCELL BÖLGE YÖNETİCİSİ','MY','USER'];
  // v1.2.2: is_sanal kolonu da çek
  const{data:allUsers}=await sb.from('users').select('my_id,ad_soyad,kcm_id,aktif,is_sanal,yetki_seviyesi,role');
  (allUsers||[]).forEach(u=>{
    myIdToName[u.my_id] = u.aktif ? u.ad_soyad : u.ad_soyad+' (Ayrıldı)';
    myIdToRol[u.my_id]  = (u.yetki_seviyesi||u.role||'MY').toUpperCase();
  });
  // v1.2.2: Sanal MY'leri global diziye al — portföy hesaplarında hariç tutulacak
  sanalMyIds = (allUsers||[]).filter(u=>u.is_sanal).map(u=>u.my_id);

  if(kcmRoller.includes(r)&&currentUser.kcm_id){
    // v1.2.2: Sanal MY'ler kcmMyIds'e girmesin
    const{data}=await sb.from('users').select('my_id')
      .eq('kcm_id',currentUser.kcm_id).eq('aktif',true).eq('is_sanal',false);
    kcmMyIds=(data||[]).map(u=>u.my_id);
  }
  // v1.2.5: userScope — MY/FMY id listeleri login'de bir kez hesaplanır, dashboard'da tekrar DB'ye gidilmez
  window.userScope = {
    myIds:  kcmMyIds.filter(id => myIdToRol[id] === 'MY'),
    fmyIds: kcmMyIds.filter(id => myIdToRol[id] === 'FMY')
  };
}
function loadDashboard(){
  const dnEl=document.getElementById('dashNameText');if(dnEl)dnEl.textContent=escapeHTML(currentUser.ad_soyad);else document.getElementById('dashName').textContent='⚙️ '+escapeHTML(currentUser.ad_soyad);
  document.getElementById('dashKcm').textContent=escapeHTML(currentUser.kcm_adi||'')+' — '+escapeHTML(currentUser.yetki_seviyesi);
  const ab=document.getElementById('adminMenuBox');
  if(ab) ab.classList.toggle('hide', !hasPerm('admin_panel'));
  const ymBox=document.getElementById('yoneticiMenuBox');
  if(ymBox) ymBox.classList.toggle('hide', !hasPerm('yonetici_panel'));
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
// v1.2.9: Impersonation — sayfa tam reload edilir, mevcut login akışı (init→initApp)
// hedef kullanıcıyı sıfırdan yükler. Böylece TÜM modüllerin global state'i
// (musteriAllLoaded, GOREV.filter, dropdown filtreleri vb.) doğal olarak sıfırlanır.
async function startImpersonation(targetUser){
  if(localStorage.getItem('impersonating')==='1'){ toast('Zaten bir profil görüntüleniyor','error'); return; }
  if(!hasPerm('admin_panel')){ toast('Bu işlem için admin yetkisi gerekli','error'); return; }
  const safeAdmin = Object.assign({}, currentUser);
  delete safeAdmin.sifre_hash;
  localStorage.setItem('cu_admin_backup', JSON.stringify(safeAdmin));
  const safeTarget = Object.assign({}, targetUser);
  delete safeTarget.sifre_hash;
  localStorage.setItem('cu', JSON.stringify(safeTarget));
  localStorage.setItem('impersonating', '1');
  location.reload();
}

function stopImpersonation(){
  const adminBackup = localStorage.getItem('cu_admin_backup');
  if(!adminBackup){ toast('Görüntülenen profil bulunamadı','error'); return; }
  localStorage.setItem('cu', adminBackup);
  localStorage.removeItem('cu_admin_backup');
  localStorage.removeItem('impersonating');
  location.reload();
}

// v1.2.1: forForm=true → temas/fırsat formunda müşteri arama (KÇM scope)
//         forForm=false → müşteri listesi ekranı (PRT scope, portföy)
function getCustomerBaseQuery(forForm=false){
  let q=sb.from('customers').select('ncst,my_id,kcm_id,unvan,il,ilce,musteri_tipi,aktif,vergi_no,beyaz_yakali_sayi,sube_lokasyon,sube_detay,sunucu_altyapisi,sunucu_detay,it_ekibi,it_ekip_sayisi,firewall_kullanimi,firewall_detay,adres,telefon,churn_riski,toplam_hat,profil_tamamlandi').eq('aktif',true);
  // v1.2.11 (V30.72): customers tablosu için KÇM scope'u DAİMA kcm_id ile uygulanır.
  // Önceden forForm=true → applyScope(q,'temas') çağrılıyordu; applyScope'un temas
  // dalı KÇM'yi `my_id IN kcmMyIds` olarak filtreliyordu (ziyaret tablosu mantığı).
  // Bu, sahibi KÇM MY listesinde olmayan/atanmamış müşterileri temas formu
  // aramasından ELİYORDU — MY/FMY kendi olmayan KÇM müşterisine temas giremiyordu.
  // Artık customers için kcm_id kullanılıyor (müşteri listesiyle birebir aynı kapsam).
  const scope = getScope(forForm ? 'temas' : 'musteri');
  if(scope==='TÜM') return q;
  if(scope==='KÇM' && currentUser.kcm_id) return q.eq('kcm_id', currentUser.kcm_id);
  if(scope==='BAĞLI') return q.in('my_id', bagliMyIds);
  return q.eq('my_id', currentUser.my_id); // PRT: kendi portföyü
}