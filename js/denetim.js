// ============================================================
// denetim.js — v1.3.0
//   v1.3.0 (V31.175): yetkiler Rol & Yetki matrisine tasindi —
//   veri_guvenlik_gor (ekrani gorur) ve veri_guvenlik_ozet (ozeti alir).
//   Onceden admin_panel yetkisine yapistirilmisti.
//   v1.2.1 (V31.174): FIX — ozet alicilari rol ADINA gore seciliyordu
//   (yetki_seviyesi='ADMIN' sabit). "SÜPER ADMIN" rolune e-posta hic
//   gitmiyordu. Artik admin_panel YETKISI olan tum roller alici.
//   v1.2.0 (V31.173): haftalık şüpheli hareket özeti — ADMIN girişinde
//   kontrol edilir, bulgu varsa bildirim.js ile ADMIN e-postalarına gider.
//   Zamanlayıcı YOK; son gönderim veri_cikis_log içinde tutulur.
// Son güncelleme: 2026-10-09
//
// NE İŞE YARAR
//   Uygulama içinde veri raporlayan ve veri dışarı çıkartan HER hareketi
//   veri_cikis_log tablosuna yazar. Tek giriş noktası: veriCikisiKaydet().
//   v1.1.0 (V31.172): ayrıca ADMIN > Veri Güvenliği ekranını üretir
//   (initVeriGuvenlik). Yazma ve okuma aynı modülde — iz katmanının
//   tamamı tek dosyada aranır.
//
// NEDEN BURADA (çalışma kuralları Bölüm 12)
//   Bu bir ALTYAPI modülüdür; rapor.js / admin.js / veriyonetimi.js /
//   donanim.js / firsat.js / temas.js tarafından kullanılır. 2+ modülü
//   ilgilendiren hiçbir altyapı bir özellik modülünün içine konmaz.
//   Bu yüzden utils.js'e de konmadı: utils.js genel yardımcı dosyadır,
//   denetim izi ayrı ve aranabilir bir yerde durmalı.
//
// YÜKLEME SIRASI
//   index.html'de config.js'ten SONRA, kendisini çağıran modüllerden ÖNCE
//   yüklenir. typeof kontrolü ile çağrılmaz — doğru sırada yüklenir (Bölüm 12).
//
// TASARIM KARARLARI
//   1) Asla hata fırlatmaz, asla akışı kesmez. Log yazılamazsa kullanıcı
//      raporunu yine alır; konsola uyarı düşer.
//   2) Zaman damgasını SUNUCU yazar (veri_cikis_log.olusturma default now()).
//      anon rolünün o kolona yazma yetkisi yoktur.
//   3) Tablo anon'a yalnız INSERT açıktır. Uygulama bu tabloyu OKUMAZ ve
//      SİLMEZ — bu bilinçlidir: kullanıcı kendi izini göremez ve temizleyemez.
//      Okuma şimdilik Supabase SQL editöründen yapılır.
//   4) DÜRÜST SINIR: kimlik bilgisi tarayıcıdan gelir. Bu katman
//      "uygulamayı kullanan kişinin" izini tutar. Publishable key ile
//      doğrudan PostgREST'e istek atan biri buraya hiç yazmaz; o delik
//      portal oturumu + gerçek RLS ile kapanacak.
// ============================================================
'use strict';

const DENETIM_TABLO = 'veri_cikis_log';

/* Sekme başına bir oturum kimliği: aynı oturumda yapılan hareketleri
   birbirine bağlar ("bu kişi 3 dakikada 6 rapor indirdi" sorusu için).
   sessionStorage sekme kapanınca silinir — kalıcı iz değildir, olmamalı. */
function _denetimOturumId(){
  try{
    let s = sessionStorage.getItem('denetim_oturum');
    if(!s){
      s = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
      sessionStorage.setItem('denetim_oturum', s);
    }
    return s;
  }catch(e){ return 'oturum_yok'; }
}

/* Kimlik + vekaleten (impersonation) durumu.
   auth.js startImpersonation() gerçek ADMIN'i cu_admin_backup'a koyar ve
   impersonating='1' yazar. Vekaleten yapılan indirme, görünen kullanıcının
   değil ADMIN'in hareketidir — ikisi birlikte kaydedilir. */
function _denetimKimlik(){
  const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
  const k = {
    user_id: (u.my_id != null) ? u.my_id : null,
    ad_soyad: u.ad_soyad || null,
    yetki_seviyesi: u.yetki_seviyesi || null,
    kcm_id: (u.kcm_id != null) ? u.kcm_id : null,
    vekaleten: false,
    gercek_user_id: null,
    gercek_ad_soyad: null
  };
  try{
    if(localStorage.getItem('impersonating') === '1'){
      k.vekaleten = true;
      const a = JSON.parse(localStorage.getItem('cu_admin_backup') || 'null');
      if(a){
        k.gercek_user_id  = (a.my_id != null) ? a.my_id : null;
        k.gercek_ad_soyad = a.ad_soyad || null;
      }
    }
  }catch(e){ /* localStorage okunamadı — vekaleten=false kalır */ }
  return k;
}

/* ============================================================
   ANA FONKSİYON
   bilgi = {
     tur:          'disa_aktarim' | 'rapor_goruntuleme'   (zorunlu)
     modul:        'rapor' | 'admin' | 'veriyonetimi' | 'donanim' | ...
     fonksiyon:    çağıran fonksiyonun adı
     rapor_adi:    insan okur — "Temas Raporu"
     bicim:        'xlsx' | 'csv' | 'ekran'
     dosya_adi:    indirilen dosyanın adı (varsa)
     satir_sayisi: dışarı çıkan satır sayısı
     kapsam:       {} — tarih aralığı, KÇM, MY, sekme vb. filtreler
   }
   Dönüş: true (yazıldı) / false (yazılamadı). Çağıran bu değere bakmak
   zorunda değildir; hiçbir koşulda hata fırlatmaz.
   ============================================================ */
async function veriCikisiKaydet(bilgi){
  try{
    const b = bilgi || {};
    const k = _denetimKimlik();
    const satir = {
      user_id: k.user_id,
      ad_soyad: k.ad_soyad,
      yetki_seviyesi: k.yetki_seviyesi,
      kcm_id: k.kcm_id,
      vekaleten: k.vekaleten,
      gercek_user_id: k.gercek_user_id,
      gercek_ad_soyad: k.gercek_ad_soyad,
      tur: b.tur || 'disa_aktarim',
      modul: b.modul || null,
      fonksiyon: b.fonksiyon || null,
      rapor_adi: b.rapor_adi || null,
      bicim: b.bicim || null,
      dosya_adi: b.dosya_adi || null,
      satir_sayisi: (b.satir_sayisi == null) ? null : Number(b.satir_sayisi) || 0,
      kapsam: _denetimKapsamTemizle(b.kapsam),
      oturum_id: _denetimOturumId(),
      sayfa_url: (location && location.href) ? String(location.href).slice(0, 500) : null,
      tarayici: (navigator && navigator.userAgent) ? String(navigator.userAgent).slice(0, 400) : null
    };
    const { error } = await sb.from(DENETIM_TABLO).insert(satir);
    if(error){
      console.warn('[denetim] iz yazılamadı:', error.message || error, satir.fonksiyon);
      return false;
    }
    return true;
  }catch(e){
    console.warn('[denetim] iz yazılamadı (istisna):', e);
    return false;
  }
}

/* Boş/anlamsız filtre alanları kapsamdan atılır — log'u okurken
   "hangi filtre gerçekten uygulanmış" sorusu net kalsın. */
function _denetimKapsamTemizle(kapsam){
  if(!kapsam || typeof kapsam !== 'object') return null;
  const c = {};
  Object.keys(kapsam).forEach(a=>{
    const v = kapsam[a];
    if(v === '' || v === null || v === undefined) return;
    if(Array.isArray(v) && v.length === 0) return;
    c[a] = v;
  });
  return Object.keys(c).length ? c : null;
}

/* Rapor ekranı filtrelerini tek yerden okur — her çağrı yerinde
   document.getElementById zinciri tekrarlanmasın. */
function denetimFiltre(idHaritasi){
  const o = {};
  Object.keys(idHaritasi||{}).forEach(ad=>{
    const el = document.getElementById(idHaritasi[ad]);
    if(el && el.value !== '' && el.value != null) o[ad] = el.value;
  });
  return o;
}

/* ============================================================
   VEKALETEN GİRİŞ/ÇIKIŞ İZİ
   auth.js startImpersonation/stopImpersonation buradan kaydeder.
   Sayfa location.reload() ile yenilendiği için kayıt reload'dan ÖNCE
   ve await ile yazılır; aksi halde istek iptal olur.
   ============================================================ */
async function vekaletenIzKaydet(aksiyon, hedefUser){
  const h = hedefUser || {};
  return veriCikisiKaydet({
    // V31.172 FIX: vekalet bir rapor hareketi degil, yetki hareketidir.
    // Onceden 'rapor_goruntuleme' yaziliyordu ve ekran sayaclarini sisiriyordu.
    tur: 'vekaleten',
    modul: 'auth',
    fonksiyon: aksiyon,                  // startImpersonation | stopImpersonation
    rapor_adi: (aksiyon === 'startImpersonation')
                 ? 'Vekaleten profil açıldı'
                 : 'Vekaleten profil kapatıldı',
    bicim: 'ekran',
    satir_sayisi: null,
    kapsam: {
      hedef_user_id: (h.my_id != null) ? h.my_id : null,
      hedef_ad_soyad: h.ad_soyad || null,
      hedef_yetki: h.yetki_seviyesi || null,
      hedef_kcm_id: (h.kcm_id != null) ? h.kcm_id : null
    }
  });
}


/* ============================================================
   VERİ GÜVENLİĞİ EKRANI (V31.172)
   Yer: ADMIN > Veri Güvenliği.  Kaynak: veri_cikis_log.
   Bu bölüm YALNIZ OKUR — hiçbir tabloya yazmaz, hiçbir şey silmez.

   TASARIM: tek sorgu ile satırlar çekilir, bütün hesap tarayıcıda yapılır.
   Veritabanında fonksiyon/view/materialized view YOKTUR — platform
   bağımsızlığı (çalışma kuralları Bölüm 9). Tablo büyüyünce tek değişiklik
   VG_LIMIT ve tarih aralığıdır.

   Ekranın kendisi de iz bırakır: açıldığında bir satır yazılır. Böylece
   "denetim ekranına kim baktı" sorusu da cevaplanabilir.
   ============================================================ */

let _vgSatirlar = [];
let _vgGun      = 30;
let _vgSekme    = 'kisi';     // kisi | rapor | supheli | zaman
let _vgFiltre   = null;       // {tip, deger, etiket}
let _vgKesildi  = false;      // VG_LIMIT'e takıldı mı
const VG_LIMIT  = 5000;

/* Türkiye 2016'dan beri tüm yıl UTC+3 (yaz saati uygulaması yok).
   Bu yüzden sabit 3 saat kaydırma doğru sonuç verir ve saat dilimi
   kütüphanesine ihtiyaç duyulmaz. */
function _vgTR(iso){ return new Date(new Date(iso).getTime() + 3*3600*1000); }
function _vgSaat(iso){ return _vgTR(iso).getUTCHours(); }
function _vgHaftaGunu(iso){ return _vgTR(iso).getUTCDay(); }   // 0=Pazar, 6=Cumartesi
function _vgGunStr(iso){ return _vgTR(iso).toISOString().slice(0,10); }
function _vgIki(n){ return String(n).padStart(2,'0'); }
function _vgZaman(iso){
  const d=_vgTR(iso);
  return _vgIki(d.getUTCDate())+'.'+_vgIki(d.getUTCMonth()+1)+'.'+d.getUTCFullYear()+
         ' '+_vgIki(d.getUTCHours())+':'+_vgIki(d.getUTCMinutes());
}
function _vgSayi(n){ return (n==null||n==='')?'—':Number(n).toLocaleString('tr-TR'); }
function _vgMesaiDisi(r){
  const g=_vgHaftaGunu(r.olusturma), s=_vgSaat(r.olusturma);
  return g===0 || g===6 || s<8 || s>=20;
}
function _vgMesaiNeden(r){
  const g=_vgHaftaGunu(r.olusturma), s=_vgSaat(r.olusturma);
  if(g===0||g===6) return 'hafta sonu';
  if(s<8)  return 'sabah 08 öncesi';
  return 'akşam 20 sonrası';
}
function _vgFiltresiz(r){
  const k = r.kapsam || {};
  return !(k.kcm || k.my || k.takim || k.ncst);
}
function _vgKisiAdi(r){
  // Vekaleten yapılan hareket, profil sahibinin değil GERÇEK kişinin hanesine yazılır.
  return r.vekaleten ? (r.gercek_ad_soyad || '(bilinmeyen admin)') : (r.ad_soyad || '(bilinmeyen)');
}

/* ------------------------------------------------------------ ekran iskeleti */
function initVeriGuvenlik(){
  const el=document.getElementById('veriGuvenlikSonuc');
  if(!el) return;
  // V31.175: yetki artik Rol & Yetki matrisinden geliyor (veri_guvenlik_gor).
  // Onceden admin_panel'e yapistirilmisti; ekrani gormek ile ozeti almak
  // ayri kararlardir, ikisi de matriste ayri satir.
  if(typeof hasPerm==='function' && !hasPerm('veri_guvenlik_gor')){
    el.innerHTML='<div class="empty" style="color:var(--red);">Bu ekran için yetkiniz yok.</div>';
    return;
  }
  el.innerHTML =
    '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">'+
      '<span style="font-size:11px;color:var(--text3);">Dönem:</span>'+
      ['7','30','90','365'].map(g=>
        '<button id="vgGun_'+g+'" class="btn btn-sm btn-ghost" onclick="vgDonemSec('+g+')">'+
        (g==='365'?'1 yıl':g+' gün')+'</button>').join('')+
      '<button class="btn btn-sm" style="background:var(--green);color:#04301f;margin-left:auto;" '+
        'onclick="vgYukle()">🔍 Yenile</button>'+
      '<button class="btn btn-sm" style="background:var(--blue);" '+
        'onclick="denetimOzetSimdiGonder()" title="7 gunu beklemeden haftalik ozeti ADMIN e-postalarina gonderir">'+
        '✉️ Özeti şimdi gönder</button>'+
    '</div>'+
    '<div id="vgSayaclar"></div>'+
    '<div id="vgSekmeler" style="display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 10px;"></div>'+
    '<div id="vgIcerik"></div>';
  vgDonemSec(_vgGun, true);
  vgYukle();

  // Bu ekranın açılması da bir hareket — iz bırak.
  veriCikisiKaydet({
    tur:'rapor_goruntuleme', modul:'denetim', fonksiyon:'initVeriGuvenlik',
    rapor_adi:'Veri Güvenliği ekranı', bicim:'ekran'
  });
}

function vgDonemSec(gun, sadeceBoya){
  _vgGun = Number(gun)||30;
  ['7','30','90','365'].forEach(g=>{
    const b=document.getElementById('vgGun_'+g);
    if(!b) return;
    const aktif = Number(g)===_vgGun;
    b.style.background = aktif ? 'var(--blue)' : '';
    b.classList.toggle('btn-ghost', !aktif);
  });
  if(!sadeceBoya) vgYukle();
}

/* ------------------------------------------------------------ veri çekme */
async function vgYukle(){
  const ic=document.getElementById('vgIcerik');
  const sy=document.getElementById('vgSayaclar');
  if(sy) sy.innerHTML='';
  if(ic) ic.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  const basISO = new Date(Date.now() - _vgGun*86400000).toISOString();
  const { data, error } = await sb.from(DENETIM_TABLO)
    .select('olusturma,user_id,ad_soyad,yetki_seviyesi,kcm_id,vekaleten,gercek_user_id,'+
            'gercek_ad_soyad,tur,modul,fonksiyon,rapor_adi,bicim,dosya_adi,satir_sayisi,'+
            'kapsam,oturum_id,tarayici')
    .gte('olusturma', basISO)
    .order('olusturma', {ascending:false})
    .limit(VG_LIMIT);

  if(error){
    if(ic) ic.innerHTML='<div class="empty" style="color:var(--red);">Okunamadı: '+
      escapeHTML(error.message)+'<div style="font-size:11px;color:var(--text3);margin-top:6px;">'+
      'Yetki hatası ise veri_cikis_log tablosunda anon rolüne SELECT verilmemiş olabilir.</div></div>';
    return;
  }
  _vgSatirlar = data || [];
  _vgKesildi  = _vgSatirlar.length >= VG_LIMIT;
  _vgFiltre   = null;
  vgRender();
}

/* ------------------------------------------------------------ üst sayaçlar */
function vgRender(){
  vgRenderSayaclar();
  vgRenderSekmeler();
  vgRenderIcerik();
}

function _vgKart(etiket, deger, filtreTipi, renk, altNot){
  const tiklanir = !!filtreTipi;
  return '<div class="menu-box"'+
    (tiklanir?' onclick="vgFiltreAyarla(\''+filtreTipi+'\')" style="cursor:pointer;':' style="cursor:default;')+
    (renk?('border-color:'+renk+';'):'')+'">'+
    '<div class="menu-box-icon" style="font-size:20px;font-weight:800;'+(renk?'color:'+renk+';':'')+'">'+
      _vgSayi(deger)+'</div>'+
    '<div class="menu-box-title" style="font-size:11px;">'+etiket+'</div>'+
    (altNot?'<div style="font-size:10px;color:var(--text3);margin-top:2px;">'+altNot+'</div>':'')+
    '</div>';
}

function vgRenderSayaclar(){
  const el=document.getElementById('vgSayaclar');
  if(!el) return;
  const d = _vgSatirlar.filter(r=>r.tur==='disa_aktarim');
  const ekran = _vgSatirlar.filter(r=>r.tur==='rapor_goruntuleme').length;
  const toplamSatir = d.reduce((s,r)=>s+(r.satir_sayisi||0),0);
  const kisiler = new Set(d.map(r=>_vgKisiAdi(r)));
  const enBuyuk = d.reduce((m,r)=>Math.max(m, r.satir_sayisi||0), 0);
  const mesaiDisi = d.filter(_vgMesaiDisi).length;
  const vekaleten = d.filter(r=>r.vekaleten).length;
  const filtresiz = d.filter(r=>(r.satir_sayisi||0)>=500 && _vgFiltresiz(r)).length;
  const seri = _vgSeriIndirmeler().length;

  el.innerHTML =
    (_vgKesildi?'<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.4);'+
      'border-radius:8px;padding:8px 10px;font-size:11px;color:var(--text2);margin-bottom:10px;">'+
      'Kayıt sayısı '+VG_LIMIT+' sınırına ulaştı — dönemi kısalt, aksi halde en yeni '+VG_LIMIT+
      ' hareket gösterilir.</div>':'')+
    '<div class="menu-grid">'+
      _vgKart('Excel / CSV indirme', d.length, 'disa_aktarim', '', 'son '+_vgGun+' gün')+
      _vgKart('Dışarı çıkan satır', toplamSatir, null, '', 'toplam')+
      _vgKart('İndiren kişi', kisiler.size, null, '')+
      _vgKart('En büyük tek indirme', enBuyuk, 'en_buyuk', enBuyuk>=1000?'var(--amber)':'')+
      _vgKart('Seri indirme (10 dk / 3+)', seri, 'seri', seri?'var(--red)':'')+
      _vgKart('Filtresiz geniş çekim', filtresiz, 'filtresiz', filtresiz?'var(--red)':'', '500+ satır')+
      _vgKart('Mesai dışı / hafta sonu', mesaiDisi, 'mesai_disi', mesaiDisi?'var(--amber)':'')+
      _vgKart('Vekaleten indirme', vekaleten, 'vekaleten', vekaleten?'var(--amber)':'')+
      _vgKart('Ekran görüntüleme', ekran, 'rapor_goruntuleme', '')+
    '</div>';
}

function vgRenderSekmeler(){
  const el=document.getElementById('vgSekmeler');
  if(!el) return;
  const sekmeler=[['kisi','👤 Kişi bazlı'],['rapor','📄 Rapor tipi'],
                  ['supheli','🚩 Şüpheli hareketler'],['zaman','🕒 Zaman tüneli']];
  el.innerHTML = sekmeler.map(([k,ad])=>{
    const aktif = (_vgSekme===k);
    return '<button class="btn btn-sm'+(aktif?'':' btn-ghost')+'" '+
      'style="'+(aktif?'background:var(--blue);':'')+'" onclick="vgSekmeAc(\''+k+'\')">'+ad+'</button>';
  }).join('');
}

function vgSekmeAc(k){ _vgSekme=k; _vgFiltre=null; vgRenderSekmeler(); vgRenderIcerik(); }

function vgFiltreAyarla(tip){
  const etiketler={
    disa_aktarim:'Tüm Excel/CSV indirmeleri',
    rapor_goruntuleme:'Ekranda görüntülenen raporlar',
    mesai_disi:'Mesai dışı / hafta sonu indirmeler',
    vekaleten:'Vekaleten yapılan indirmeler',
    filtresiz:'Filtresiz geniş çekimler (500+ satır)',
    seri:'Seri indirme — 10 dakikada 3+',
    en_buyuk:'En büyük indirmeler (büyükten küçüğe)'
  };
  _vgFiltre={tip, etiket:etiketler[tip]||tip};
  _vgSekme='zaman';
  vgRenderSekmeler();
  vgRenderIcerik();
}

function vgKisiSec(ad){
  _vgFiltre={tip:'kisi', deger:ad, etiket:'Kişi: '+ad};
  _vgSekme='zaman'; vgRenderSekmeler(); vgRenderIcerik();
}
function vgRaporSec(ad){
  _vgFiltre={tip:'rapor', deger:ad, etiket:'Rapor: '+ad};
  _vgSekme='zaman'; vgRenderSekmeler(); vgRenderIcerik();
}

/* ------------------------------------------------------------ kural: seri indirme */
function _vgSeriIndirmeler(kaynak){
  // Aynı kişinin 10 dakika içinde 3 veya daha fazla dışa aktarımı.
  // kaynak verilmezse ekrandaki veri kümesi kullanılır (V31.173: e-posta
  // özeti aynı kuralı kendi veri kümesiyle çağırır).
  const d=(kaynak||_vgSatirlar).filter(r=>r.tur==='disa_aktarim');
  const gruplar={};
  d.forEach(r=>{ const k=_vgKisiAdi(r); (gruplar[k]=gruplar[k]||[]).push(r); });
  const sonuc=[];
  Object.keys(gruplar).forEach(k=>{
    const liste=gruplar[k].slice().sort((a,b)=>new Date(a.olusturma)-new Date(b.olusturma));
    liste.forEach((r,i)=>{
      const t=new Date(r.olusturma).getTime();
      let adet=0;
      for(let j=i;j>=0;j--){
        if(t-new Date(liste[j].olusturma).getTime() <= 600000) adet++;
        else break;
      }
      if(adet>=3) sonuc.push(Object.assign({}, r, {_pencere:adet}));
    });
  });
  return sonuc;
}

/* ------------------------------------------------------------ kural: ortalamanın katı */
function _vgOrtalamaAsanlar(kaynak){
  const d=(kaynak||_vgSatirlar).filter(r=>r.tur==='disa_aktarim' && r.satir_sayisi!=null);
  const grup={};
  d.forEach(r=>{ const k=_vgKisiAdi(r); (grup[k]=grup[k]||[]).push(r); });
  const sonuc=[];
  Object.keys(grup).forEach(k=>{
    const l=grup[k];
    if(l.length<3) return;                     // ortalama anlamlı olsun
    const ort=l.reduce((s,r)=>s+r.satir_sayisi,0)/l.length;
    if(ort<=0) return;
    l.forEach(r=>{
      if(r.satir_sayisi > ort*3)
        sonuc.push(Object.assign({}, r, {_ort:Math.round(ort), _kat:(r.satir_sayisi/ort).toFixed(1)}));
    });
  });
  return sonuc.sort((a,b)=>b._kat-a._kat);
}

/* ------------------------------------------------------------ içerik */
function vgRenderIcerik(){
  const el=document.getElementById('vgIcerik');
  if(!el) return;
  if(!_vgSatirlar.length){
    el.innerHTML='<div class="empty">Bu dönemde hiç hareket kaydı yok.</div>';
    return;
  }
  if(_vgSekme==='kisi')    el.innerHTML=_vgTabloKisi();
  if(_vgSekme==='rapor')   el.innerHTML=_vgTabloRapor();
  if(_vgSekme==='supheli') el.innerHTML=_vgTabloSupheli();
  if(_vgSekme==='zaman')   el.innerHTML=_vgTabloZaman();
}

const _VGTH='padding:7px 8px;border:1px solid var(--border);text-align:left;white-space:nowrap;font-size:11px;background:var(--navy3);';
const _VGTD='padding:6px 8px;border:1px solid var(--border);font-size:12px;';

function _vgSar(baslik, basliklar, satirlar, not){
  // satirlar hem dizi hem birleştirilmiş metin olabilir — ikisini de kabul et.
  const govde = Array.isArray(satirlar) ? satirlar.join('') : (satirlar||'');
  if(!govde.length) return '<div class="empty">Kayıt yok.</div>';
  return (baslik?'<div class="section-title" style="margin-bottom:8px;">'+baslik+'</div>':'')+
    (not?'<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">'+not+'</div>':'')+
    '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">'+
    '<thead><tr>'+basliklar.map(h=>'<th style="'+_VGTH+'">'+h+'</th>').join('')+'</tr></thead>'+
    '<tbody>'+govde+'</tbody></table></div>';
}

function _vgTabloKisi(){
  const grup={};
  _vgSatirlar.forEach(r=>{
    const k=_vgKisiAdi(r);
    const g=grup[k]=grup[k]||{ad:k,rol:r.yetki_seviyesi||'',excel:0,ekran:0,satir:0,
                               enBuyuk:0,vekaleten:0,mesai:0,raporlar:new Set(),
                               ilk:r.olusturma,son:r.olusturma};
    if(r.tur==='disa_aktarim'){
      g.excel++; g.satir+=(r.satir_sayisi||0);
      g.enBuyuk=Math.max(g.enBuyuk, r.satir_sayisi||0);
      if(r.rapor_adi) g.raporlar.add(r.rapor_adi);
      if(_vgMesaiDisi(r)) g.mesai++;
    } else g.ekran++;
    if(r.vekaleten) g.vekaleten++;
    if(new Date(r.olusturma)<new Date(g.ilk)) g.ilk=r.olusturma;
    if(new Date(r.olusturma)>new Date(g.son)) g.son=r.olusturma;
  });
  const liste=Object.values(grup).sort((a,b)=>b.satir-a.satir);
  const satirlar=liste.map(g=>
    '<tr style="cursor:pointer;" onclick="vgKisiSec('+JSON.stringify(g.ad).replace(/"/g,'&quot;')+')">'+
    '<td style="'+_VGTD+'"><b>'+escapeHTML(g.ad)+'</b>'+
      '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(g.rol)+'</div></td>'+
    '<td style="'+_VGTD+'text-align:center;font-weight:700;">'+_vgSayi(g.excel)+'</td>'+
    '<td style="'+_VGTD+'text-align:center;">'+_vgSayi(g.ekran)+'</td>'+
    '<td style="'+_VGTD+'text-align:right;font-weight:700;">'+_vgSayi(g.satir)+'</td>'+
    '<td style="'+_VGTD+'text-align:right;'+(g.enBuyuk>=1000?'color:var(--amber);font-weight:700;':'')+'">'+
      _vgSayi(g.enBuyuk)+'</td>'+
    '<td style="'+_VGTD+'text-align:center;">'+_vgSayi(g.raporlar.size)+'</td>'+
    '<td style="'+_VGTD+'text-align:center;'+(g.mesai?'color:var(--amber);':'')+'">'+_vgSayi(g.mesai)+'</td>'+
    '<td style="'+_VGTD+'font-size:11px;">'+_vgZaman(g.son)+'</td>'+
    '</tr>').join('');
  return _vgSar('Kişi bazlı özet',
    ['Kişi','Excel','Ekran','Toplam satır','En büyük','Rapor tipi','Mesai dışı','Son hareket'],
    satirlar, 'Satıra tıkla → o kişinin tüm hareketleri. Vekaleten yapılan hareket, profil sahibinin değil gerçek kişinin hanesine yazılır.');
}

function _vgTabloRapor(){
  const grup={};
  _vgSatirlar.filter(r=>r.tur==='disa_aktarim').forEach(r=>{
    const k=r.rapor_adi||'(adsız)';
    const g=grup[k]=grup[k]||{ad:k,bicim:r.bicim||'',adet:0,satir:0,enBuyuk:0,
                              kisiler:new Set(),son:r.olusturma};
    g.adet++; g.satir+=(r.satir_sayisi||0);
    g.enBuyuk=Math.max(g.enBuyuk,r.satir_sayisi||0);
    g.kisiler.add(_vgKisiAdi(r));
    if(new Date(r.olusturma)>new Date(g.son)) g.son=r.olusturma;
  });
  const liste=Object.values(grup).sort((a,b)=>b.satir-a.satir);
  const satirlar=liste.map(g=>
    '<tr style="cursor:pointer;" onclick="vgRaporSec('+JSON.stringify(g.ad).replace(/"/g,'&quot;')+')">'+
    '<td style="'+_VGTD+'"><b>'+escapeHTML(g.ad)+'</b></td>'+
    '<td style="'+_VGTD+'text-align:center;">'+escapeHTML(g.bicim)+'</td>'+
    '<td style="'+_VGTD+'text-align:center;font-weight:700;">'+_vgSayi(g.adet)+'</td>'+
    '<td style="'+_VGTD+'text-align:center;">'+_vgSayi(g.kisiler.size)+'</td>'+
    '<td style="'+_VGTD+'text-align:right;font-weight:700;">'+_vgSayi(g.satir)+'</td>'+
    '<td style="'+_VGTD+'text-align:right;">'+_vgSayi(Math.round(g.satir/g.adet))+'</td>'+
    '<td style="'+_VGTD+'text-align:right;">'+_vgSayi(g.enBuyuk)+'</td>'+
    '<td style="'+_VGTD+'font-size:11px;">'+_vgZaman(g.son)+'</td>'+
    '</tr>').join('');
  return _vgSar('Rapor tipine göre indirme',
    ['Rapor','Biçim','İndirme','Kaç kişi','Toplam satır','Ortalama','En büyük','Son indirme'],
    satirlar, 'Satıra tıkla → o raporun tüm indirmeleri.');
}

function _vgTabloSupheli(){
  // V31.173: kurallar _denetimBulgular() icinde tek yerde durur; ekran ve
  // haftalik e-posta ozeti AYNI motoru kullanir, ayrisamazlar.
  const bulgular=_denetimBulgular(_vgSatirlar, false);

  if(!bulgular.length)
    return '<div class="empty" style="color:var(--green);">✓ Bu dönemde kurallara takılan hareket yok.</div>';

  const satirlar=bulgular.map(b=>{
    const renk = b.seviye==='yuksek' ? 'var(--red)' : 'var(--amber)';
    return '<tr>'+
      '<td style="'+_VGTD+'font-size:11px;white-space:nowrap;">'+_vgZaman(b.r.olusturma)+'</td>'+
      '<td style="'+_VGTD+'"><b>'+escapeHTML(_vgKisiAdi(b.r))+'</b>'+
        '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(b.r.yetki_seviyesi||'')+'</div></td>'+
      '<td style="'+_VGTD+'color:'+renk+';font-weight:700;">'+b.kural+'</td>'+
      '<td style="'+_VGTD+'font-size:11px;color:var(--text2);">'+b.detay+'</td>'+
      '<td style="'+_VGTD+'">'+escapeHTML(b.r.rapor_adi||'')+'</td>'+
      '<td style="'+_VGTD+'text-align:right;font-weight:700;">'+_vgSayi(b.r.satir_sayisi)+'</td>'+
      '</tr>';
  }).join('');
  return _vgSar('Şüpheli hareketler',
    ['Zaman','Kişi','Kural','Detay','Rapor','Satır'], satirlar,
    'Kırmızı = yüksek (seri indirme, ortalamanın 3 katı, filtresiz geniş çekim) · '+
    'Sarı = bağlam gerektirir (mesai dışı, vekaleten). Aynı hareket birden fazla kurala takılabilir.');
}

function _vgTabloZaman(){
  let liste=_vgSatirlar;
  let baslik='Zaman tüneli';
  if(_vgFiltre){
    baslik=_vgFiltre.etiket;
    const t=_vgFiltre.tip;
    if(t==='disa_aktarim'||t==='rapor_goruntuleme') liste=liste.filter(r=>r.tur===t);
    else if(t==='mesai_disi') liste=liste.filter(r=>r.tur==='disa_aktarim'&&_vgMesaiDisi(r));
    else if(t==='vekaleten')  liste=liste.filter(r=>r.tur==='disa_aktarim'&&r.vekaleten);
    else if(t==='filtresiz')  liste=liste.filter(r=>r.tur==='disa_aktarim'&&(r.satir_sayisi||0)>=500&&_vgFiltresiz(r));
    else if(t==='seri')       liste=_vgSeriIndirmeler();
    else if(t==='en_buyuk')   liste=liste.filter(r=>r.tur==='disa_aktarim')
                                        .slice().sort((a,b)=>(b.satir_sayisi||0)-(a.satir_sayisi||0));
    else if(t==='kisi')       liste=liste.filter(r=>_vgKisiAdi(r)===_vgFiltre.deger);
    else if(t==='rapor')      liste=liste.filter(r=>(r.rapor_adi||'(adsız)')===_vgFiltre.deger);
  }
  const satirlar=liste.slice(0,300).map(r=>{
    const disa = r.tur==='disa_aktarim';
    return '<tr>'+
      '<td style="'+_VGTD+'font-size:11px;white-space:nowrap;">'+_vgZaman(r.olusturma)+'</td>'+
      '<td style="'+_VGTD+'"><b>'+escapeHTML(_vgKisiAdi(r))+'</b>'+
        (r.vekaleten?'<div style="font-size:10px;color:var(--amber);">vekaleten: '+
          escapeHTML(r.ad_soyad||'')+' profili</div>':'')+
        '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(r.yetki_seviyesi||'')+'</div></td>'+
      '<td style="'+_VGTD+'white-space:nowrap;"><span class="tag '+(disa?'tag-red':'tag-gray')+'">'+
        (disa?'İNDİRDİ':'ekranda')+'</span></td>'+
      '<td style="'+_VGTD+'">'+escapeHTML(r.rapor_adi||'')+
        (r.bicim?'<div style="font-size:10px;color:var(--text3);">'+escapeHTML(r.bicim)+'</div>':'')+'</td>'+
      '<td style="'+_VGTD+'text-align:right;font-weight:700;">'+_vgSayi(r.satir_sayisi)+'</td>'+
      '<td style="'+_VGTD+'font-size:10px;color:var(--text2);max-width:260px;word-break:break-word;">'+
        escapeHTML(_vgKapsamYazi(r.kapsam))+'</td>'+
      '</tr>';
  }).join('');
  const not = (liste.length>300 ? 'İlk 300 kayıt gösteriliyor ('+_vgSayi(liste.length)+' kayıt var). ' : '')+
    (_vgFiltre?'Filtre açık — tüm listeye dönmek için üstteki sekmeye tekrar tıkla.':'');
  return _vgSar(baslik, ['Zaman','Kişi','Hareket','Rapor','Satır','Kapsam (filtre)'], satirlar, not);
}

function _vgKapsamYazi(k){
  if(!k || typeof k!=='object') return '—';
  return Object.keys(k).map(a=>{
    const v=k[a];
    return a+': '+(Array.isArray(v)?v.join('/'):String(v));
  }).join(' · ');
}


/* ============================================================
   HAFTALIK ŞÜPHELİ HAREKET ÖZETİ (V31.173)

   AMAÇ: Veri Güvenliği ekranı ancak açılırsa işe yarar. Bu bölüm bakmayı
   gerektirmez — şüpheli hareket varsa ADMIN'lere mesaj gider, yoksa gitmez.

   ZAMANLAYICI YOKTUR (çalışma kuralları Bölüm 9 — platform bağımsızlığı).
   pg_cron, Cloudflare Cron Trigger, hiçbir dış zamanlayıcı kullanılmıyor.
   Mekanizma: bir ADMIN uygulamaya girdiğinde kontrol edilir — son özet
   7 günden eskiyse (veya hiç yoksa) hesaplanır ve gönderilir.
   Bu "fırsat buldukça süpürme" kalıbıdır; uygulama kodunun içinde yaşar,
   kendi sunucuna taşındığında da aynen çalışır.

   SON GÖNDERİM NEREDE TUTULUYOR: veri_cikis_log'un kendisinde.
   fonksiyon='ozetGonderildi' satırı hem durum kaydı hem denetim olayıdır.
   Yeni tablo, yeni ayar satırı, yeni SQL YOKTUR.

   KANAL: bildirim.js (tek gönderme noktası). E-posta kapanıp WhatsApp'a
   geçildiğinde burada tek satır bile değişmez.

   ADMIN olmayan kullanıcıda ilk satırda çıkar — 115 kullanıcı için maliyeti
   sıfırdır.
   ============================================================ */

const DENETIM_OZET_GUN = 7;          // kaç günde bir özet
const DENETIM_OZET_PENCERE = 7;      // özetin kapsadığı gün sayısı

async function denetimOzetKontrol(){
  try{
    // V31.175: ekrani gorme yetkisi olan birinin girisi ozet suprumesini
    // tetikler. Kimin ALDIGI ayri yetki (veri_guvenlik_ozet) ile belirlenir.
    if(typeof hasPerm!=='function' || !hasPerm('veri_guvenlik_gor')) return;

    // 1) Son özet ne zaman gönderildi/kontrol edildi?
    const {data:son, error:sonErr} = await sb.from(DENETIM_TABLO)
      .select('olusturma')
      .eq('modul','denetim').eq('fonksiyon','ozetGonderildi')
      .order('olusturma',{ascending:false}).limit(1);
    if(sonErr){ console.warn('[denetim] ozet kontrolu okunamadi:', sonErr.message); return; }
    if(son && son.length){
      const gecen = (Date.now() - new Date(son[0].olusturma).getTime()) / 86400000;
      if(gecen < DENETIM_OZET_GUN) return;      // henüz zamanı değil
    }

    await denetimOzetGonder(false);
  }catch(e){ console.warn('[denetim] ozet kontrolu basarisiz:', e); }
}

/* elle=true → ekrandaki tuştan çağrıldı: bulgu yoksa da kullanıcıya bilgi ver */
async function denetimOzetGonder(elle){
  const basISO = new Date(Date.now() - DENETIM_OZET_PENCERE*86400000).toISOString();
  const {data:satirlar, error} = await sb.from(DENETIM_TABLO)
    .select('olusturma,user_id,ad_soyad,yetki_seviyesi,vekaleten,gercek_ad_soyad,'+
            'tur,modul,fonksiyon,rapor_adi,bicim,satir_sayisi,kapsam')
    .gte('olusturma', basISO)
    .order('olusturma',{ascending:false})
    .limit(VG_LIMIT);
  if(error){
    if(elle) toast('Özet verisi okunamadı: '+error.message,'error');
    console.warn('[denetim] ozet verisi okunamadi:', error.message);
    return;
  }

  const bulgular = _denetimBulgular(satirlar||[], true);

  // Bulgu yoksa: mesaj GÖNDERİLMEZ (Oktay'ın kuralı), ama kontrol kaydedilir —
  // yoksa her girişte yeniden hesaplanır.
  if(!bulgular.length){
    await veriCikisiKaydet({
      tur:'rapor_goruntuleme', modul:'denetim', fonksiyon:'ozetGonderildi',
      rapor_adi:'Haftalık şüpheli hareket özeti', bicim:'ekran', satir_sayisi:0,
      kapsam:{pencere_gun:DENETIM_OZET_PENCERE, bulgu:0, gonderildi:false,
              sebep:'bulgu yok', elle:!!elle}
    });
    if(elle) toast(DENETIM_OZET_PENCERE+' günde şüpheli hareket yok — mesaj gönderilmedi','success');
    return;
  }

  // Alıcılar: V31.174 — rol ADINA gore DEGIL, YETKIYE gore secilir.
  // Onceden yetki_seviyesi='ADMIN' sabit yaziliydi; "SÜPER ADMIN" gibi ayri bir
  // yonetici rolu listeye hic girmiyordu. Artik admin_panel yetkisi olan HER
  // role gider — Rol & Yetki ekranindan yeni bir yonetici rolu tanimlandiginda
  // kod degismeden listeye dahil olur.
  // Buyuk/kucuk harf tuzagi: window.PERM roller buyuk harfle tutar, users
  // tablosundaki yazim farkli olabilir. Bu yuzden .in() ile sorgulamiyoruz;
  // hasPerm ile ayni karsilastirmayi (toUpperCase) JS tarafinda yapiyoruz.
  // V31.175: alici roller Rol & Yetki matrisindeki veri_guvenlik_ozet
  // yetkisinden okunur. Matriste hic rol isaretlenmemisse (SQL hic
  // calistirilmadiysa) ozet sessizce kaybolmasin diye admin_panel'e duser
  // ve konsola uyari yazar.
  let kaynakYetki = 'veri_guvenlik_ozet';
  let roller = (window.PERM && window.PERM['veri_guvenlik_ozet']) || [];
  if(!roller.length){
    roller = (window.PERM && window.PERM['admin_panel']) || ['ADMIN'];
    kaynakYetki = 'admin_panel (yedek)';
    console.warn('[denetim] veri_guvenlik_ozet yetkisi hicbir role verilmemis — '+
                 'Rol & Yetki ekranindan isaretle. Simdilik admin_panel kullanildi.');
  }
  const yetkiliRoller = roller.map(r=>String(r).toUpperCase());
  const {data:kullanicilar} = await sb.from('users')
    .select('email,ad_soyad,yetki_seviyesi').eq('aktif',true);
  const alicilar = (kullanicilar||[])
    .filter(u=>yetkiliRoller.includes(String(u.yetki_seviyesi||'').toUpperCase()))
    .map(u=>u.email).filter(Boolean);
  // Mukerrer adres (ayni e-posta iki hesapta) tek kez gonderilsin
  const tekilAlicilar = [...new Set(alicilar.map(e=>String(e).trim().toLowerCase()))];
  if(!tekilAlicilar.length){
    if(elle) toast('"Haftalık özet alır" yetkisi olan ve e-postası tanımlı kullanıcı yok — Rol & Yetki ekranından kontrol et','error');
    console.warn('[denetim] ozet gonderilemedi: alici yok. Yetkili roller:', yetkiliRoller);
    return;
  }

  const konu = 'SSSO Veri Güvenliği — '+bulgular.length+' şüpheli hareket ('+
               DENETIM_OZET_PENCERE+' gün)';
  const gonderildi = await bildirimGonder(
    tekilAlicilar, konu, _denetimOzetMetin(bulgular), _denetimOzetHtml(bulgular), 'denetim');

  // Gönderim denemesi SONRASI kaydedilir: gönderim başarısızsa bir sonraki
  // ADMIN girişinde tekrar denenir, hafta boşa yanmaz.
  await veriCikisiKaydet({
    tur:'rapor_goruntuleme', modul:'denetim', fonksiyon:'ozetGonderildi',
    rapor_adi:'Haftalık şüpheli hareket özeti', bicim:'ekran',
    satir_sayisi:bulgular.length,
    kapsam:{pencere_gun:DENETIM_OZET_PENCERE, bulgu:bulgular.length,
            gonderildi:!!gonderildi, alici_sayisi:tekilAlicilar.length,
            yetkili_roller:yetkiliRoller, alici_yetkisi:kaynakYetki, elle:!!elle}
  });

  if(elle){
    if(gonderildi) toast(bulgular.length+' bulgu, '+tekilAlicilar.length+' yöneticiye gönderildi','success');
    else           toast('Gönderilemedi — konsolda [bildirim] satırına bakın','error');
  }
}

/* Ekrandaki "Özeti şimdi gönder" tuşu — 7 günü beklemeden test etmek için. */
async function denetimOzetSimdiGonder(){
  toast('Özet hazırlanıyor...','info');
  await denetimOzetGonder(true);
}

/* ------------------------------------------------------------ bulgu üretimi
   Ekrandaki "Şüpheli hareketler" sekmesiyle AYNI kuralları kullanır —
   kural mantığı tek yerde durur, ekran ile e-posta ayrışamaz. */
function _denetimBulgular(satirlar, epostaIcin){
  const b=[];
  _vgSeriIndirmeler(satirlar).forEach(r=>b.push({r, seviye:'yuksek',
    kural:'Seri indirme', detay:'10 dakikada '+r._pencere+' dışa aktarım'}));
  _vgOrtalamaAsanlar(satirlar).forEach(r=>b.push({r, seviye:'yuksek',
    kural:'Kendi ortalamasının '+r._kat+' katı', detay:'kişi ortalaması '+_vgSayi(r._ort)+' satır'}));
  satirlar.filter(r=>r.tur==='disa_aktarim' && (r.satir_sayisi||0)>=500 && _vgFiltresiz(r))
    .forEach(r=>b.push({r, seviye:'yuksek',
      kural:'Filtresiz geniş çekim', detay:_vgSayi(r.satir_sayisi)+' satır, KÇM/MY filtresi yok'}));
  satirlar.filter(r=>r.tur==='disa_aktarim' && _vgMesaiDisi(r))
    .forEach(r=>b.push({r, seviye:'orta', kural:'Mesai dışı', detay:_vgMesaiNeden(r)}));
  // Vekaleten yalnız EKRANDA gösterilir. E-postaya girmez: vekalet hareketlerinin
  // neredeyse tamamı ADMIN'in kendi işidir, haftalık mesajı gereksiz şişirir.
  if(!epostaIcin){
    satirlar.filter(r=>r.tur==='disa_aktarim' && r.vekaleten)
      .forEach(r=>b.push({r, seviye:'orta', kural:'Vekaleten indirme',
        detay:(r.ad_soyad||'')+' profilinden'}));
  }
  b.sort((x,y)=> (x.seviye===y.seviye ? (new Date(y.r.olusturma)-new Date(x.r.olusturma))
                                      : (x.seviye==='yuksek'?-1:1)));
  return b;
}

function _denetimOzetMetin(b){
  const satir = x => _vgZaman(x.r.olusturma)+'  '+_vgKisiAdi(x.r)+'  —  '+x.kural+
                     ' ('+x.detay+')  ·  '+(x.r.rapor_adi||'')+'  ·  '+
                     _vgSayi(x.r.satir_sayisi)+' satır';
  const yuksek=b.filter(x=>x.seviye==='yuksek'), orta=b.filter(x=>x.seviye==='orta');
  return 'SSSO Veri Guvenligi — son '+DENETIM_OZET_PENCERE+' gun\n\n'+
    'Yuksek: '+yuksek.length+'   Orta: '+orta.length+'\n\n'+
    (yuksek.length?'YUKSEK\n'+yuksek.map(satir).join('\n')+'\n\n':'')+
    (orta.length?'ORTA\n'+orta.slice(0,20).map(satir).join('\n')+
      (orta.length>20?'\n(+'+(orta.length-20)+' kayit daha)':'')+'\n\n':'')+
    'Tamami: SSSO > Admin > Veri Guvenligi\n';
}

function _denetimOzetHtml(b){
  const yuksek=b.filter(x=>x.seviye==='yuksek'), orta=b.filter(x=>x.seviye==='orta');
  const th='padding:6px 8px;border:1px solid #ddd;background:#f3f4f6;text-align:left;font-size:12px;';
  const td='padding:6px 8px;border:1px solid #ddd;font-size:12px;';
  const tablo=(liste,renk)=> !liste.length ? '' :
    '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">'+
    '<thead><tr><th style="'+th+'">Zaman</th><th style="'+th+'">Kişi</th>'+
    '<th style="'+th+'">Kural</th><th style="'+th+'">Detay</th>'+
    '<th style="'+th+'">Rapor</th><th style="'+th+'">Satır</th></tr></thead><tbody>'+
    liste.map(x=>'<tr>'+
      '<td style="'+td+'white-space:nowrap;">'+_vgZaman(x.r.olusturma)+'</td>'+
      '<td style="'+td+'"><b>'+escapeHTML(_vgKisiAdi(x.r))+'</b>'+
        (x.r.vekaleten?'<br><span style="font-size:11px;color:#92400e;">vekaleten: '+
          escapeHTML(x.r.ad_soyad||'')+'</span>':'')+'</td>'+
      '<td style="'+td+'color:'+renk+';font-weight:700;">'+escapeHTML(x.kural)+'</td>'+
      '<td style="'+td+'">'+escapeHTML(x.detay)+'</td>'+
      '<td style="'+td+'">'+escapeHTML(x.r.rapor_adi||'')+'</td>'+
      '<td style="'+td+'text-align:right;font-weight:700;">'+_vgSayi(x.r.satir_sayisi)+'</td>'+
      '</tr>').join('')+'</tbody></table>';

  return '<div style="font-family:Segoe UI,Arial,sans-serif;color:#111;max-width:860px;">'+
    '<h2 style="margin:0 0 4px;">SSSO Veri Güvenliği</h2>'+
    '<div style="color:#555;font-size:13px;margin-bottom:14px;">Son '+
      DENETIM_OZET_PENCERE+' günde <b>'+b.length+'</b> şüpheli hareket — '+
      '<span style="color:#b91c1c;">yüksek: '+yuksek.length+'</span> · '+
      '<span style="color:#b45309;">orta: '+orta.length+'</span></div>'+
    (yuksek.length?'<h3 style="color:#b91c1c;margin:0 0 6px;font-size:14px;">Yüksek</h3>'+
      tablo(yuksek,'#b91c1c'):'')+
    (orta.length?'<h3 style="color:#b45309;margin:0 0 6px;font-size:14px;">Orta</h3>'+
      tablo(orta.slice(0,20),'#b45309')+
      (orta.length>20?'<div style="font-size:12px;color:#555;margin-bottom:12px;">+'+
        (orta.length-20)+' kayıt daha — tamamı ekranda.</div>':''):'')+
    '<div style="font-size:12px;color:#555;border-top:1px solid #ddd;padding-top:10px;">'+
      'Tamamı için: <b>SSSO &gt; Admin &gt; Veri Güvenliği</b>.<br>'+
      'Bu mesaj yalnız şüpheli hareket bulunduğunda gönderilir; '+
      'temiz haftalarda mesaj gelmez.</div></div>';
}

// v1.2.0 denetim loaded (iz + Veri Guvenligi ekrani + haftalik ozet)
