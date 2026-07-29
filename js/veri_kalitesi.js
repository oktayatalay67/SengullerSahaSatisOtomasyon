// ============================================================
// veri_kalitesi.js — v1.0.0
// ------------------------------------------------------------
// KONTAK VERİ KALİTESİ KAPISI
//   • Kurallar sistem_ayarlari tablosundan (DB) yüklenir → window.VKAYAR
//   • kontakDogrula(): ad_soyad / telefon / email / kontak_tipi kontrolü
//   • telefonNormalize() / telefonMaskele(): +90 5xx xxx xx xx
//   • Kod içinde SABİT yasaklı liste yoktur; hepsi DB'den gelir.
//
// Bu dosya TEK BAŞINA hiçbir şeyi engellemez — çağıran koda bağlanınca
// (ziyaret girişi / kontak kartı) devreye girer.
// Bağımlılık: sb. (Login'de loadVeriKalitesiAyar() çağrılmalı.)
// ============================================================
'use strict';

// DB'den yüklenen ayarlar (login'de doldurulur)
window.VKAYAR = window.VKAYAR || {
  kontak_tipleri: [],        // [{deger, gorunen_ad, sira}]
  unvan_kelimeleri: [],      // ['bey','hanım',...]
  yasakli_domainler: []      // ['yok.com',...]
};

/* ============================================================
   1) AYARLARI DB'DEN YÜKLE (login'de bir kez)
   ============================================================ */
async function loadVeriKalitesiAyar(){
  try{
    const { data, error } = await sb
      .from('sistem_ayarlari')
      .select('ayar_tipi,deger,gorunen_ad,sira')
      .eq('aktif', true)
      .order('sira', { ascending:true });
    if(error){ console.error('sistem_ayarlari yüklenemedi:', error); return false; }

    const V = { kontak_tipleri:[], unvan_kelimeleri:[], yasakli_domainler:[] };
    (data||[]).forEach(r=>{
      if(r.ayar_tipi==='kontak_tipi')
        V.kontak_tipleri.push({ deger:r.deger, gorunen_ad:r.gorunen_ad||r.deger, sira:r.sira });
      else if(r.ayar_tipi==='unvan_kelimesi')
        V.unvan_kelimeleri.push((r.deger||'').toLocaleLowerCase('tr'));
      else if(r.ayar_tipi==='yasakli_email_domain')
        V.yasakli_domainler.push((r.deger||'').toLocaleLowerCase('tr'));
    });
    window.VKAYAR = V;
    return true;
  }catch(e){ console.error('loadVeriKalitesiAyar:', e); return false; }
}

/* ============================================================
   2) TELEFON — normalize + maske
   ============================================================ */
// Her türlü girişi 10 haneli '5xxxxxxxxx' biçimine indirger.
// '05xx...', '+905xx...', '905xx...', '5xx....0' (Excel) → '5xxxxxxxxx'
function telefonNormalize(input){
  if(input===null || input===undefined) return '';
  let s = String(input).trim();
  s = s.replace(/\.0+$/, '');        // Excel '.0' ekini at
  s = s.replace(/\D/g, '');          // rakam dışını at
  if(s.startsWith('90'))  s = s.slice(2);   // ülke kodu
  if(s.startsWith('0'))   s = s.slice(1);   // baştaki 0
  return s;                          // beklenen: 10 hane, '5' ile başlar
}

// Görüntüleme: '5321234567' → '+90 532 123 45 67'
function telefonMaskele(raw){
  const t = telefonNormalize(raw);
  if(t.length!==10) return raw || '';
  return `+90 ${t.slice(0,3)} ${t.slice(3,6)} ${t.slice(6,8)} ${t.slice(8,10)}`;
}

// Tüm rakamlar aynı mı (1111111111 gibi)
function _hepAyniRakam(t){ return /^(\d)\1{9}$/.test(t); }
// Ardışık artan/azalan mı (1234567890 / 0987654321 gibi)
function _ardisikRakam(t){
  const artan='0123456789', azalan='9876543210';
  return artan.includes(t) || azalan.includes(t);
}

function telefonGecerli(raw){
  const t = telefonNormalize(raw);
  if(t.length!==10)      return { ok:false, sebep:'Telefon 10 haneli olmalı (5xx xxx xx xx)' };
  if(t[0]!=='5')         return { ok:false, sebep:'Telefon 5 ile başlamalı (cep no)' };
  if(_hepAyniRakam(t))   return { ok:false, sebep:'Telefon geçersiz (tekrar eden rakam)' };
  if(_ardisikRakam(t))   return { ok:false, sebep:'Telefon geçersiz (ardışık rakam)' };
  return { ok:true, normalize:t };
}

/* ============================================================
   3) AD-SOYAD
   ============================================================ */
function adSoyadGecerli(adSoyad){
  const ham = (adSoyad||'').trim();
  if(!ham) return { ok:false, sebep:'Ad-soyad boş olamaz' };

  // Virgül / noktalı virgül → tek karta birden fazla kişi
  if(/[,;]/.test(ham))
    return { ok:false, sebep:'Tek karta birden fazla kişi girilemez (her kişi ayrı kart)' };

  // Unvan kelimelerini çıkar, kalan gerçek isim kelimelerini say
  const unvanlar = window.VKAYAR.unvan_kelimeleri || [];
  const kelimeler = ham.toLocaleLowerCase('tr')
    .split(/\s+/)
    .map(k => k.replace(/[.]/g,''))
    .filter(k => k.length>0 && !unvanlar.includes(k));

  // Çok kısa (tek harf) parçaları da isim sayma
  const gercekIsim = kelimeler.filter(k => k.length>=2);

  if(gercekIsim.length < 2)
    return { ok:false, sebep:'Ad ve soyad tam girilmeli (unvan/tek isim yeterli değil)' };

  return { ok:true };
}

/* ============================================================
   4) E-POSTA
   ============================================================ */
function emailGecerli(email){
  const e = (email||'').trim().toLocaleLowerCase('tr');
  if(!e) return { ok:false, sebep:'E-posta zorunludur' };
  // Basit ama sağlam format kontrolü
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e))
    return { ok:false, sebep:'E-posta formatı geçersiz' };
  const domain = e.split('@')[1] || '';
  if((window.VKAYAR.yasakli_domainler||[]).includes(domain))
    return { ok:false, sebep:'E-posta uydurma/geçersiz domain' };
  return { ok:true };
}

/* ============================================================
   5) KONTAK TİPİ
   ============================================================ */
function kontakTipiGecerli(tipler){
  // tipler: dizi (jsonb) — en az 1 geçerli tip seçili olmalı
  if(!Array.isArray(tipler) || tipler.length===0)
    return { ok:false, sebep:'En az bir kontak tipi seçilmeli' };
  const gecerliKodlar = (window.VKAYAR.kontak_tipleri||[]).map(t=>t.deger);
  const secili = tipler.filter(t => gecerliKodlar.includes(t));
  if(secili.length===0)
    return { ok:false, sebep:'Geçerli bir kontak tipi seçilmeli' };
  return { ok:true };
}

/* ============================================================
   6) TOPLU KONTROL — kart kaydında çağrılır
   ============================================================ */
// Döner: { gecerli:bool, hatalar:[{alan, sebep}], telefonNormalize:'5...' }
function kontakDogrula({ ad_soyad, telefon, email, kontak_tipi, musteri_unvani }){
  const hatalar = [];

  const a = adSoyadGecerli(ad_soyad);
  if(!a.ok) hatalar.push({ alan:'ad_soyad', sebep:a.sebep });

  const t = telefonGecerli(telefon);
  if(!t.ok) hatalar.push({ alan:'telefon', sebep:t.sebep });

  const e = emailGecerli(email);
  if(!e.ok) hatalar.push({ alan:'email', sebep:e.sebep });

  const k = kontakTipiGecerli(kontak_tipi);
  if(!k.ok) hatalar.push({ alan:'kontak_tipi', sebep:k.sebep });

  if(!(musteri_unvani||'').trim())
    hatalar.push({ alan:'musteri_unvani', sebep:'Müşteri unvanı boş olamaz' });

  return {
    gecerli: hatalar.length===0,
    hatalar,
    telefonNormalize: t.ok ? t.normalize : null
  };
}

/* ============================================================
   7) UI YARDIMCILARI — kontak tipi checkbox + telefon maske
   ============================================================ */
// Kontak tipi checkbox'larını bir container'a basar (DB'den gelen tiplerle)
function renderKontakTipleri(containerId, seciliDizi){
  const el = document.getElementById(containerId);
  if(!el) return;
  const secili = Array.isArray(seciliDizi) ? seciliDizi : [];
  const tipler = window.VKAYAR.kontak_tipleri || [];
  if(!tipler.length){ el.innerHTML = '<span style="font-size:11px;color:var(--text3);">(tip listesi yüklenemedi)</span>'; return; }
  el.innerHTML = tipler.map(t=>{
    const on = secili.includes(t.deger);
    return `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--navy3);border:1px solid ${on?'var(--blue)':'var(--border)'};border-radius:8px;cursor:pointer;font-size:13px;">
      <input type="checkbox" value="${t.deger}" ${on?'checked':''} onchange="_kontakTipiToggleStyle(this)" style="width:16px;height:16px;">
      ${escapeHTML(t.gorunen_ad)}
    </label>`;
  }).join('');
}
function _kontakTipiToggleStyle(cb){
  const lbl = cb.closest('label');
  if(lbl) lbl.style.borderColor = cb.checked ? 'var(--blue)' : 'var(--border)';
}
// Seçili kontak tiplerini dizi olarak döndürür
function getSeciliKontakTipleri(containerId){
  const el = document.getElementById(containerId);
  if(!el) return [];
  return [...el.querySelectorAll('input[type=checkbox]:checked')].map(c=>c.value);
}

// Telefon input'una canlı maske bağlar: yazarken +90 5xx xxx xx xx
function telefonMaskeBagla(inputId){
  const el = document.getElementById(inputId);
  if(!el) return;
  el.addEventListener('input', function(){
    let d = telefonNormalize(this.value);          // 10 haneye indir
    d = d.slice(0,10);
    let out = '';
    if(d.length>0) out = '+90 ' + d.slice(0,3);
    if(d.length>=4) out += ' ' + d.slice(3,6);
    if(d.length>=7) out += ' ' + d.slice(6,8);
    if(d.length>=9) out += ' ' + d.slice(8,10);
    this.value = out;
  });
}

/* ============================================================
   8) ZİYARET/FIRSAT GİRİŞİ — seçili kontak eksik mi?
   ============================================================ */
// Forma yüklenen kontaklar burada tutulur (loadContacts / loadOppKontaklar doldurur)
window._formKontakMap = window._formKontakMap || {};

// contactId listesindeki İLK eksik/doğrulanmamış kontağı döndürür (yoksa null)
// kontakMap verilmezse window._formKontakMap kullanılır.
function seciliKontakEksik(contactIds, kontakMap){
  const map = kontakMap || window._formKontakMap || {};
  for(const id of (contactIds||[])){
    const k = map[id];
    if(!k) continue; // bellekte yoksa atla (silinmiş olabilir)
    // dogrulandi=true ise tam kabul et, tekrar kontrol etme (kural: bir kez doğrulanır)
    if(k.dogrulandi===true) continue;
    // dogrulandi false → alanları kontrol et
    const kontrol = kontakDogrula({
      ad_soyad:k.ad_soyad, telefon:k.telefon, email:k.email,
      kontak_tipi: Array.isArray(k.kontak_tipi)?k.kontak_tipi:[],
      musteri_unvani: k.musteri_unvani
    });
    if(!kontrol.gecerli){
      return { contactId:id, kontak:k, hatalar:kontrol.hatalar };
    }
  }
  return null;
}
