// ============================================================
// lead.js — v1.8.0
// Son güncelleme: 2026-10-12
//
// ÇAĞRI MERKEZİ / LEAD ARAMALARI
//   Satış odaklı çağrı modülü. Ziyaret Teyit (js/arama.js) ile EKRAN ve AKIŞ
//   olarak birebir aynı; veri modeli ayrıdır çünkü lead aramasında ziyaret
//   yoktur:
//     lead_liste  → arama listesi (kampanya)
//     lead_kayit  → listedeki her müşteri
//     lead_arama  → her arama denemesi (değiştirilemez, silinemez)
//
// NEDEN AYRI DOSYA (çalışma kuralları Bölüm 12)
//   Kendi ekranları, kendi durum ağacı, kendi raporu olan bir özellik modülü.
//   arama.js'in içine konmadı: o dosya 159 KB ve ziyaret mantığına bağlı.
//
// FIRSAT KAYDI AÇILMAZ
//   "Sipariş vermek istiyor" / "detay istiyor" seçildiğinde 'Lead Satış
//   Fırsatı' görev kartı açılır (task_types.bagli_form='ziyaret_firsat').
//   Fırsatı MY, ziyaret formunu doldurarak açar — Oktay'ın kararı (12.10.2026).
//
// ZAMANLAYICI YOKTUR (Bölüm 9)
//   Sonraki arama tarihi, rakip sözleşme bitişi ve deneme limiti okuma anında
//   hesaplanır.
//
// DIŞ BAĞIMLILIKLAR (hepsi tıklama anında çağrılır, yükleme sırası sorun değil)
//   ensureXLSX()  → js/rapor.js   · SheetJS'i ihtiyaç anında yükler
//   vyTel()       → js/veriyonetimi.js · telefon normalizasyonu
//   hasPerm/getScope → js/config.js · yetki katmanı
//
// SÜRÜM NOTLARI
//   v1.8.0 (V31.186) — "Aramadan Kapat" ve "🗑 Sil", AGENT KUYRUK KARTINA da
//           eklendi (Oktay): agent arama ekranını hiç açmadan kaydı kapatır,
//           yetkili müşteriyi listeden tek tuşla çıkarır. Yönetim ekranındaki
//           "Listedeki Firmalar" bölümü DURUYOR — ikisi bir arada.
//           leadAramadanTamamlaAc(kayitId) artık iki yoldan çağrılabiliyor;
//           hedef tek state'te toplandı. Kuyruktan "aranmak istemiyor"
//           seçilirse kimseyle konuşulmadığı için o NCST'nin TÜM kontakları
//           işaretlenir; arama ekranından seçilirse yalnız konuşulan kişi.
//   v1.7.0 (V31.185) — "Aramadan Tamamla": agent müşteriyi hiç aramadan
//           kaydı kapatabilir. Neden sorulur (aranmak istemiyor / iletişim
//           bilgisi yok / yönetici talimatı / diğer) + alt açıklama ("Diğer"
//           için zorunlu). Arama izi YİNE yazılır — kim, ne zaman, neden
//           kapattı kaybolmaz. "Yönetici talimatı" ve "Diğer" bilerek
//           sonuc_grubu almaz; red nedenleri raporu kirlenmesin.
//   v1.6.1 (V31.184) — BUG FIX: Lead ekranı açılışı. Liste yönetimi yetkisi
//           olan kullanıcı (admin) her girişte AGENT ekranına düşüyordu;
//           silme tuşları ve 'Listedeki Firmalar' yönetim ekranında olduğu
//           için hiç görünmüyordu. Tek aktif liste varsa agent ekranı doğrudan
//           arama kuyruğuna atladığından üstteki geçiş çubuğu da gözden
//           kaçıyordu. Artık yönetim yetkisi olan önce yönetim ekranına düşer.
//   v1.6.0 (V31.183) — Ürün/servis odağı artık ürün ağacından ÜRÜN GRUBU
//           (kategori) olarak seçilir; eskiden dizi indeksi (0–7) basılıyordu.
//           Kampanya detayı açıklama alanına yazılır.
//           SİLME: yeni 'lead_sil' yetkisi. Liste kartında ve yeni eklenen
//           'Listedeki Firmalar' bölümünde 🗑. Arama izi (lead_arama) SİLİNMEZ —
//           LEAD_02 SQL'i kayit_id bağını ON DELETE SET NULL yaptı; ayrıca her
//           arama satırına liste_adi anlık kopyası yazılır, liste silinse de
//           raporda kampanya adı okunur kalır.
//   v1.5.0 (V31.182) — 'Karar verici değil' akışı düzeltildi. Eskiden bu
//           seçenek takvim (tekrar arama tarihi) açıyordu; kimin ne zaman
//           aranacağı belli olmadığı için kuyruğu şişirmekten başka işe
//           yaramıyordu. Artık alt soru sorulur: karar vericinin bilgisi
//           verildiyse yeni kontak açılır ve kayıt 'Henüz Aranmadı'ya döner
//           (g_kv_verdi, telefon ZORUNLU); verilmediyse görüşme kapanır
//           (g_kv_vermedi, analizde olumsuz). Çözümleme tek fonksiyonda:
//           _leadDurumCoz() — ekran ve kayıt aynı kodu kullanır.
//   v1.4.0 (V31.181) — 'Müşteri talebi' sonucu eklendi. Şikayet ve Talep
//           teyit aramasındaki ile AYNI görev tiplerini açar ve şikayet AYNI
//           hedef zincirini kullanır (takım lideri → KÇM müdürü → operasyon
//           müdürü; arama.js:_sikayetTalepHedefBul). Görev durumu hem kuyruk
//           kartında hem arama geçmişinde rozet olarak görünür; tıklayınca
//           standart görev detayı açılır — kapatma akışı teyitle birebir aynı.
//   v1.3.1 (V31.180) — BUG FIX: "Portföy sahibi: atanmamış" hatası. auth.js'te
//           `let myIdToName` üst düzey let olduğu için window'a binmiyor;
//           window.myIdToName koruması her zaman false dönüyordu ve MY adı
//           hiçbir yerde çözülmüyordu. Tek okuma noktası: _leadMyAd().
//   v1.3.0 (V31.179) — FIX: ürün listesi veritabanı ürün ağacından geliyor
//           (FALLBACK_PRODUCTS bir DİZİ; önceki sürüm indeks basıyordu).
//           'Zaten Turkcell müşterisi' seçeneği kaldırıldı. Arama öncesi
//           müşteri özeti: portföy sahibi, son ziyaret, açık fırsat uyarısı,
//           son teyit araması + açılır temas/teyit geçmişi. Aranmak istemeyen
//           müşteride ARAMA EKRANI AÇILMIYOR. Agent günlük panosu.
//   v1.2.0 (V31.178) — Faz 4: agent arama ekranı. Liste seçimi, 4 kutu,
//           iletişim bilgisi yoksa kontak kartı, ilerleyen durum ağacı (22
//           yaprak), 'Lead Satış Fırsatı' görev kartı, yumuşak kilit, deneme
//           limiti ve rakip sözleşme süpürmesi, Çağrı Analizi ilk sürüm.
//   v1.1.0 (V31.177) — Faz 3: liste yönetimi + filtreyle müşteri ekleme
//           (eleme raporuyla) + Excel yükleme (kolon eşlemeli).
//   v1.0.0 (V31.176) — Faz 2: iskelet, menü ayrımı.
// ============================================================
'use strict';

const LEAD_TABLO_LISTE = 'lead_liste';
const LEAD_TABLO_KAYIT = 'lead_kayit';
const LEAD_TABLO_ARAMA = 'lead_arama';
const LEAD_GOREV_TIPI  = 'Lead Satış Fırsatı';

// Aday havuzu üst sınırı. Filtre bu kadar müşteriden fazlasını döndürürse
// kullanıcı uyarılır ve daraltması istenir — 174.445 satırlık tabloyu
// tarayıcıya çekmek tarayıcıyı kilitler.
const LEAD_ADAY_LIMIT = 8000;
const LEAD_SAYFA = 1000;   // Supabase varsayılan satır limiti
const LEAD_PARCA = 500;    // .in() sorgularında parça boyu

const LEAD = {
  mod: 'yonetim',          // agent | yonetim
  ekran: 'listeler',      // listeler | yeniListe | detay
  listeler: [],
  aktifListe: null,
  ekleSekme: 'filtre',    // filtre | excel
  filtre: null,
  aday: null,             // {adaylar:[], eleme:{}, kesildi:bool}
  uyeSayfa: 0,            // V31.183: listedeki firmalar sayfasi
  excel: null             // {dosyaAd, headers, rows, mapping, aday}
};

/* ============================================================
   YARDIMCILAR
   ============================================================ */
function _leadParcali(dizi, n){
  const p=[]; for(let i=0;i<dizi.length;i+=n) p.push(dizi.slice(i,i+n)); return p;
}
function _leadSayi(n){ return (n==null)?'—':Number(n).toLocaleString('tr-TR'); }

/* Görev rozeti — teyit aramasındaki ile aynı görünüm ve aynı davranış:
   tıklayınca standart görev detayı açılır (gorev.js:openGorevDetay), görev
   oradan kapatılır. Ayrı bir kapatma akışı YOK — tek ekran, tek kural. */
function _leadGorevRozeti(gv){
  if(!gv) return '';
  const renk=(typeof GOREV_DURUM_RENK!=='undefined' && GOREV_DURUM_RENK[gv.durum]) || 'var(--blue)';
  return '<span style="cursor:pointer;color:'+renk+';font-weight:600;font-size:11px;" '+
    'onclick="event.stopPropagation();leadGoreviAc('+gv.task_id+')">🔗 '+
    escapeHTML(gv.baslik_kisa||'Görev')+': '+escapeHTML(gv.durum||'')+'</span>';
}
async function leadGoreviAc(taskId){
  if(typeof openGorevDetay!=='function'){ toast('Görev modülü yüklenemedi','error'); return; }
  await openGorevDetay(taskId);
}

/* Verilen task_id listesi için durum/başlık haritası döndürür. */
async function _leadGorevHaritasi(taskIdler){
  const harita={};
  const ids=[...new Set((taskIdler||[]).filter(Boolean))];
  if(!ids.length) return harita;
  for(const parca of _leadParcali(ids, 200)){
    const {data}=await sb.from('tasks').select('task_id,durum,baslik,type_id').in('task_id',parca).limit(1000);
    (data||[]).forEach(t=>{
      const b=String(t.baslik||'');
      harita[t.task_id]={task_id:t.task_id, durum:t.durum,
        baslik_kisa: b.startsWith('Müşteri Şikayeti') ? 'Şikayet'
                   : b.startsWith('Müşteri Talebi')   ? 'Talep'
                   : 'Fırsat'};
    });
  }
  return harita;
}

/* MY adı çözümü — V31.180 BUG FIX.
   js/auth.js'te `let myIdToName = {}` ile tanımlı. Üst düzey `let` global
   DEĞİŞKEN yaratır ama `window` ÜZERİNE BİNMEZ: window.myIdToName her zaman
   undefined'dır. Önceki sürümde koruma olarak tam da o yazılmıştı, bu yüzden
   isim araması hiç çalışmadı ve her müşteri "portföy sahibi atanmamış"
   göründü — portföyü dolu müşterilerde bile.
   Doğru okuma: değişkene doğrudan erişmek (auth.js lead.js'ten ÖNCE yüklenir,
   bkz. index.html). typeof koruması yalnız 'henüz login olunmadı' hâli için. */
function _leadMyAd(myId, bosDeger){
  if(myId==null) return bosDeger||null;
  const harita = (typeof myIdToName!=='undefined') ? myIdToName : null;
  if(!harita) return bosDeger||('#'+myId);
  return harita[myId] || ('#'+myId);
}
function _leadTarih(ts){ return ts?fmtDateTime(ts):'—'; }
function _leadGunFark(ts){
  if(!ts) return null;
  return Math.floor((Date.now()-new Date(ts).getTime())/86400000);
}
function _leadDeger(id){ const e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function _leadIsaretli(id){ const e=document.getElementById(id); return !!(e&&e.checked); }

function _leadFiltreSifirla(){
  LEAD.filtre = {
    kcm:'', takim:'', my:'', atamasiz:false,
    il:'', ilce:'', sektor:'', tip:'', aktif:'true', churn:'',
    hatMin:'', hatMax:'', byMin:'', byMax:'',
    sunucu:'', firewall:'', itEkibi:'', profil:'',
    ziyaret:'hic',          // '' | hic | gun
    ziyaretGun:'180',
    firsat:'',              // '' | hic | acikYok
    iletisim:'',            // '' | var | yok
    // NOT: 'pasif musteri' icin ayri eleme kutusu YOK — Aktif/Pasif secicisi
    // (F.aktif) tek kontrol. Iki kontrol olunca eleme raporunda '- pasif: 0'
    // gibi anlamsiz satir cikiyordu (V31.177 testinde goruldu).
    elePotansiyelYok:true, eleBaskaListe:true, eleCooldown:true
  };
}

/* ============================================================
   GİRİŞ
   ============================================================ */
async function initLeadEkrani(){
  const el = document.getElementById('leadListesi');
  if(!el) return;

  const agent = hasPerm('lead_agent');
  const rapor = hasPerm('lead_rapor');
  const yonet = hasPerm('lead_liste_yonet');

  if(!agent && !rapor && !yonet){
    el.innerHTML = '<div class="empty" style="color:var(--red);">Bu ekran için yetkiniz yok.</div>';
    return;
  }

  LEAD.ekran='listeler';
  LEAD.aktifListe=null;
  _leadFiltreSifirla();
  // V31.184 — ACILIS EKRANI DUZELTMESI (Oktay'in bildirdigi hata)
  // Eskiden: lead_agent yetkisi varsa HERKES agent ekranina dusuyordu. Admin'in
  // hem agent hem yonetim yetkisi oldugu icin yonetim ekranini (liste silme,
  // "Listedeki Firmalar", Excel yukleme) hic gormuyordu; dahasi tek aktif liste
  // varsa agent ekrani dogrudan arama kuyruguna atliyor ve ust gecis cubugu bile
  // gozden kaciyordu.
  // Artik: liste yonetimi yetkisi olan ONCE yonetim ekranina duser. Agent yetkisi
  // de varsa ustteki cubuktan "🎯 Arama"ya tek tusla gecer.
  // Yalniz rapor yetkisi olan (agent de degil, yonetici de degil) yonetim
  // ekranina duser — orada analiz/raporu gorur.
  await _leadModSec(yonet ? 'yonetim' : (agent ? 'agent' : 'yonetim'));
}

/* ============================================================
   LİSTELER EKRANI
   ============================================================ */
async function _leadListeleriYukle(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  // Kapsam: lead modülü kapsamı KÇM ise yalnız kendi KÇM'sinin listeleri.
  let q=sb.from(LEAD_TABLO_LISTE).select('*').order('olusturma',{ascending:false});
  const kapsam=getScope('lead');
  if(kapsam!=='TÜM' && currentUser.kcm_id){
    q=q.or('kcm_id.eq.'+currentUser.kcm_id+',kcm_id.is.null');
  }
  const {data:listeler, error}=await q;
  if(error){ el.innerHTML='<div class="empty" style="color:var(--red);">Listeler okunamadı: '+escapeHTML(error.message)+'</div>'; return; }
  LEAD.listeler=listeler||[];

  // Her liste için kayıt sayaçları — tek sorguda, sonra JS'te grupla
  const ids=LEAD.listeler.map(l=>l.liste_id);
  const sayac={};
  if(ids.length){
    for(const parca of _leadParcali(ids, 50)){
      const {data:kayitlar}=await sb.from(LEAD_TABLO_KAYIT)
        .select('liste_id,durum_grubu').in('liste_id',parca).limit(100000);
      (kayitlar||[]).forEach(k=>{
        const s=sayac[k.liste_id]=sayac[k.liste_id]||{toplam:0,yeni:0,tekrar:0,ulasilamadi:0,tamam:0};
        s.toplam++; if(s[k.durum_grubu]!=null) s[k.durum_grubu]++;
      });
    }
  }
  LEAD._sayac=sayac;
  _leadListeRender();
}

function _leadListeRender(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  const yonet=hasPerm('lead_liste_yonet');
  const DURUM_ETIKET={hazirlik:'Hazırlık', aktif:'Aktif', durdu:'Durduruldu', bitti:'Bitti'};
  const DURUM_RENK={hazirlik:'tag-amber', aktif:'tag-green', durdu:'tag-gray', bitti:'tag-blue'};

  let h=_leadModBariHTML();
  if(yonet){
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;">'+
         '<div style="font-size:11px;color:var(--text3);">Arama listeleri (kampanyalar)</div>'+
         '<button class="btn btn-sm" style="background:var(--blue);width:auto;padding:8px 14px;" '+
           'onclick="leadYeniListeAc()">+ Yeni Liste</button>'+
       '</div>';
  }

  if(!LEAD.listeler.length){
    h+='<div class="empty">'+(yonet?'Henüz arama listesi yok. "+ Yeni Liste" ile başla.'
                                   :'Henüz arama listesi yok.')+'</div>';
    el.innerHTML=h; return;
  }

  LEAD.listeler.forEach(l=>{
    const s=(LEAD._sayac&&LEAD._sayac[l.liste_id])||{toplam:0,yeni:0,tekrar:0,ulasilamadi:0,tamam:0};
    const kalan=s.yeni+s.tekrar;
    const yuzde=s.toplam?Math.round(((s.toplam-kalan)/s.toplam)*100):0;
    h+='<div class="visit-card" style="margin-bottom:8px;cursor:pointer;" onclick="leadListeDetayAc(\''+l.liste_id+'\')">'+
       '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'+
         '<div style="flex:1;min-width:0;">'+
           '<div class="visit-firm">'+escapeHTML(l.ad)+'</div>'+
           '<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+
             (l.urun_odak?escapeHTML(l.urun_odak)+' · ':'')+
             _leadSayi(s.toplam)+' müşteri · kalan '+_leadSayi(kalan)+
           '</div>'+
         '</div>'+
         '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">'+
           '<span class="tag '+(DURUM_RENK[l.durum]||'tag-gray')+'">'+(DURUM_ETIKET[l.durum]||l.durum)+'</span>'+
           // V31.183: silme AYRI yetki (lead_sil). Liste yönetimi olan herkeste çıkmaz.
           (hasPerm('lead_sil')
             ? '<span title="Listeyi sil" style="cursor:pointer;font-size:15px;padding:2px 4px;" '+
               'onclick="event.stopPropagation();leadListeSil(\''+l.liste_id+'\')">🗑</span>'
             : '')+
         '</div>'+
       '</div>'+
       '<div style="margin-top:8px;height:6px;background:var(--navy3);border-radius:4px;overflow:hidden;">'+
         '<div style="height:100%;width:'+yuzde+'%;background:var(--green);"></div>'+
       '</div>'+
       '<div style="font-size:10px;color:var(--text3);margin-top:4px;">%'+yuzde+' tamamlandı</div>'+
       '</div>';
  });
  el.innerHTML=h;
}

/* ============================================================
   YENİ LİSTE
   ============================================================ */
function leadYeniListeAc(){
  if(!hasPerm('lead_liste_yonet')){ toast('Yetkiniz yok','error'); return; }
  const el=document.getElementById('leadListesi'); if(!el) return;
  el.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'+
      '<button class="topbar-back" onclick="initLeadEkrani()" style="position:relative;width:auto;padding:6px 12px;font-size:13px;">← Geri</button>'+
      '<div style="font-size:15px;font-weight:600;">Yeni Arama Listesi</div>'+
    '</div>'+
    '<div class="form-section">'+
      '<div class="field"><label>Liste adı *</label>'+
        '<input type="text" id="lnAd" placeholder="Örn: Ekim SOL Kampanyası" '+
        'style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;"></div>'+
      '<div class="field"><label>Ürün / servis odağı</label>'+
        '<select id="lnUrun" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;">'+
          '<option value="">— Seçin (isteğe bağlı) —</option>'+
          _leadUrunGrupSecenekleriHTML()+
        '</select>'+
        '<div style="font-size:11px;color:var(--text3);margin-top:6px;">'+
          'Ürün ağacındaki gruplardan biri. Hangi ürün/servis olduğunu aşağıdaki açıklamaya yaz.</div></div>'+
      '<div class="field"><label>Açıklama (kampanya detayı)</label>'+
        '<textarea id="lnAciklama" rows="3" placeholder="Örn: SOL 100 Mbps kampanyası — 24 ay taahhüt, ilk 3 ay bedava"></textarea></div>'+
      '<div class="field"><label>Konuşma metni (agent arama ekranında görünür)</label>'+
        '<textarea id="lnMetin" rows="5" placeholder="Merhaba, Turkcell Şengüller\'den arıyorum..."></textarea></div>'+
      '<div class="field"><label>Deneme limiti (kaç denemeden sonra otomatik kapanır)</label>'+
        '<input type="number" id="lnLimit" min="1" max="20" value="4" '+
        'style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;"></div>'+
      '<div class="field"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;">'+
        '<input type="checkbox" id="lnKendiKcm"'+(currentUser.kcm_id?' checked':'')+'> '+
        'Yalnız kendi KÇM\'me ait olsun'+
        (currentUser.kcm_id?'':' <span style="font-size:11px;color:var(--text3);">(KÇM tanımlı değil)</span>')+
      '</label></div>'+
      '<button class="btn" style="width:100%;background:var(--green);color:#04301f;" onclick="leadYeniListeKaydet()">💾 Kaydet</button>'+
      '<button class="btn-iptal" style="margin-top:8px;" onclick="initLeadEkrani()">✕ Vazgeç</button>'+
    '</div>';
}

async function leadYeniListeKaydet(){
  if(!hasPerm('lead_liste_yonet')){ toast('Yetkiniz yok','error'); return; }
  const ad=_leadDeger('lnAd');
  if(!ad){ toast('Liste adı zorunlu','error'); return; }
  const limit=parseInt(_leadDeger('lnLimit'))||4;
  if(limit<1||limit>20){ toast('Deneme limiti 1–20 arasında olmalı','error'); return; }

  const satir={
    ad, aciklama:_leadDeger('lnAciklama')||null,
    urun_odak:_leadDeger('lnUrun')||null,
    konusma_metni:_leadDeger('lnMetin')||null,
    kaynak:'filtre', durum:'hazirlik', deneme_limiti:limit,
    kcm_id:(_leadIsaretli('lnKendiKcm')&&currentUser.kcm_id)?currentUser.kcm_id:null,
    olusturan_my_id:currentUser.my_id
  };
  const {data, error}=await sb.from(LEAD_TABLO_LISTE).insert(satir).select('liste_id').single();
  if(error){ toast('Kaydedilemedi: '+error.message,'error'); return; }
  await addLog(LEAD_TABLO_LISTE, data.liste_id, 'Liste Oluşturuldu', ad);
  toast('Liste oluşturuldu','success');
  leadListeDetayAc(data.liste_id);
}

/* ============================================================
   LİSTE DETAYI
   ============================================================ */
async function leadListeDetayAc(listeId){
  const el=document.getElementById('leadListesi'); if(!el) return;
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const {data:l, error}=await sb.from(LEAD_TABLO_LISTE).select('*').eq('liste_id',listeId).maybeSingle();
  if(error||!l){ toast('Liste bulunamadı','error'); initLeadEkrani(); return; }
  LEAD.aktifListe=l;
  LEAD.ekleSekme='filtre';
  LEAD.aday=null; LEAD.excel=null;
  LEAD.uyeSayfa=0;
  _leadFiltreSifirla();
  await _leadDetayRender();
}

async function _leadDetayRender(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  const l=LEAD.aktifListe; if(!l) return;
  const yonet=hasPerm('lead_liste_yonet');

  const {data:kayitlar}=await sb.from(LEAD_TABLO_KAYIT)
    .select('durum_grubu,sonuc_grubu').eq('liste_id',l.liste_id).limit(100000);
  const s={toplam:0,yeni:0,tekrar:0,ulasilamadi:0,tamam:0};
  (kayitlar||[]).forEach(k=>{ s.toplam++; if(s[k.durum_grubu]!=null) s[k.durum_grubu]++; });

  let h='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'+
    '<button class="topbar-back" onclick="initLeadEkrani()" style="position:relative;width:auto;padding:6px 12px;font-size:13px;">← Geri</button>'+
    '<div style="font-size:15px;font-weight:600;flex:1;min-width:0;">'+escapeHTML(l.ad)+'</div>'+
    '</div>';

  h+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">'+
      '<div class="summary-box"><div class="summary-val lg" style="color:var(--amber);">'+_leadSayi(s.yeni)+'</div><div class="summary-label lg">Henüz Aranmadı</div></div>'+
      '<div class="summary-box"><div class="summary-val lg" style="color:var(--orange);">'+_leadSayi(s.tekrar)+'</div><div class="summary-label lg">Tekrar Aranacak</div></div>'+
      '<div class="summary-box"><div class="summary-val lg" style="color:var(--text2);">'+_leadSayi(s.ulasilamadi)+'</div><div class="summary-label lg">Ulaşılamadı</div></div>'+
      '<div class="summary-box"><div class="summary-val lg" style="color:var(--green);">'+_leadSayi(s.tamam)+'</div><div class="summary-label lg">Tamamlanan</div></div>'+
     '</div>';

  // liste bilgileri + durum yönetimi
  if(yonet){
    const DURUM_SIRA=[['hazirlik','Hazırlık'],['aktif','Aktif'],['durdu','Durduruldu'],['bitti','Bitti']];
    h+='<div class="form-section" style="margin-bottom:12px;">'+
        '<div class="form-section-title">Liste Durumu</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        DURUM_SIRA.map(([k,ad])=>{
          const aktif=(l.durum===k);
          return '<button class="btn btn-sm'+(aktif?'':' btn-ghost')+'" style="'+
                 (aktif?'background:var(--blue);':'')+'width:auto;padding:7px 12px;" '+
                 'onclick="leadListeDurumDegistir(\''+k+'\')">'+ad+'</button>';
        }).join('')+
        '</div>'+
        '<div style="font-size:11px;color:var(--text3);margin-top:8px;">'+
          'Agent ekranında yalnız <b>Aktif</b> listeler görünür. Deneme limiti: '+l.deneme_limiti+
        '</div>'+
       '</div>';

    // müşteri ekleme
    h+='<div class="form-section">'+
        '<div class="form-section-title">Müşteri Ekle</div>'+
        '<div style="display:flex;gap:6px;margin-bottom:12px;">'+
          '<button class="btn btn-sm'+(LEAD.ekleSekme==='filtre'?'':' btn-ghost')+'" style="flex:1;'+
            (LEAD.ekleSekme==='filtre'?'background:var(--blue);':'')+'" onclick="leadEkleSekme(\'filtre\')">🎯 Filtreyle</button>'+
          '<button class="btn btn-sm'+(LEAD.ekleSekme==='excel'?'':' btn-ghost')+'" style="flex:1;'+
            (LEAD.ekleSekme==='excel'?'background:var(--blue);':'')+'" onclick="leadEkleSekme(\'excel\')">📄 Excel</button>'+
        '</div>'+
        '<div id="leadEklePanel"></div>'+
       '</div>';

    // V31.183: listedeki firmalar — daha önce listenin içini görebileceğin
    // bir ekran yoktu, yalnız sayaçlar vardı. Silme burada yapılır.
    h+='<div class="form-section" style="margin-top:12px;">'+
        '<div class="form-section-title">Listedeki Firmalar</div>'+
        '<div id="leadUyeAlan"><div class="loader"><div class="spinner"></div></div></div>'+
       '</div>';
  }

  el.innerHTML=h;
  if(yonet){ _leadEklePanelRender(); _leadUyeListesiYukle(); }
}

/* ============================================================
   V31.183 — LİSTEDEKİ FİRMALAR + SİLME
   Silme yetkisi 'lead_sil'. ARAMA İZİ (lead_arama) SİLİNMEZ:
   LEAD_02 SQL'i ile kayit_id bağı ON DELETE SET NULL yapıldı, yani kayıt
   silinince arama satırı kalır, sadece kayda bağı kopar. ncst, liste_id,
   liste_adi ve agent_id arama satırında zaten duruyor.
   ============================================================ */
const LEAD_UYE_SAYFA = 50;

async function _leadUyeListesiYukle(sayfa){
  const kutu=document.getElementById('leadUyeAlan'); if(!kutu) return;
  const l=LEAD.aktifListe; if(!l) return;
  LEAD.uyeSayfa = (sayfa==null) ? (LEAD.uyeSayfa||0) : sayfa;
  const bas=LEAD.uyeSayfa*LEAD_UYE_SAYFA;

  const {data:satirlar, count, error}=await sb.from(LEAD_TABLO_KAYIT)
    .select('kayit_id,ncst,unvan,durum,durum_grubu,deneme_sayisi,sistemde_var',{count:'exact'})
    .eq('liste_id',l.liste_id)
    .order('olusturma',{ascending:true})
    .range(bas, bas+LEAD_UYE_SAYFA-1);

  if(error){ kutu.innerHTML='<div class="empty" style="color:var(--red);">Okunamadı: '+escapeHTML(error.message)+'</div>'; return; }
  // son sayfadaki tek kayit silinince bos sayfada kalma — bir geri don
  if((!satirlar||!satirlar.length) && LEAD.uyeSayfa>0){ return _leadUyeListesiYukle(LEAD.uyeSayfa-1); }
  if(!satirlar||!satirlar.length){ kutu.innerHTML='<div class="empty">Listede henüz firma yok.</div>'; return; }

  const silebilir=hasPerm('lead_sil');
  const toplam=count||satirlar.length;
  const sonSayfa=Math.max(0, Math.ceil(toplam/LEAD_UYE_SAYFA)-1);

  kutu.innerHTML=
    '<div style="font-size:11px;color:var(--text3);margin-bottom:7px;">'+
      _leadSayi(toplam)+' firma'+(toplam>LEAD_UYE_SAYFA?' · '+(bas+1)+'–'+Math.min(bas+LEAD_UYE_SAYFA,toplam)+' arası':'')+
    '</div>'+
    satirlar.map(k=>{
      const dd=LEAD_DURUM[k.durum]||{};
      const etiket=dd.et||(k.durum==='henuz_aranmadi'?'Henüz aranmadı':k.durum);
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;background:var(--navy3);'+
        'border-radius:6px;margin-bottom:4px;">'+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+
            escapeHTML(k.unvan||'(unvan yok)')+
            (k.sistemde_var?'':' <span style="color:var(--amber);font-size:10px;">· sistemde yok</span>')+
          '</div>'+
          '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(k.ncst)+' · '+
            escapeHTML(etiket)+' · '+(k.deneme_sayisi||0)+' deneme</div>'+
        '</div>'+
        (silebilir
          ? '<span title="Firmayı listeden sil" style="cursor:pointer;font-size:14px;padding:2px 4px;flex-shrink:0;" '+
            'onclick="leadKayitSil(\''+k.kayit_id+'\')">🗑</span>'
          : '')+
      '</div>';
    }).join('')+
    (toplam>LEAD_UYE_SAYFA
      ? '<div style="display:flex;gap:6px;margin-top:8px;">'+
        '<button class="btn btn-sm btn-ghost" style="flex:1;" '+(LEAD.uyeSayfa<=0?'disabled':'')+
          ' onclick="_leadUyeListesiYukle('+(LEAD.uyeSayfa-1)+')">← Önceki</button>'+
        '<button class="btn btn-sm btn-ghost" style="flex:1;" '+(LEAD.uyeSayfa>=sonSayfa?'disabled':'')+
          ' onclick="_leadUyeListesiYukle('+(LEAD.uyeSayfa+1)+')">Sonraki →</button>'+
        '</div>'
      : '');
}

/* Tek firmayı listeden siler. Müşteri (customers) KAYDINA DOKUNMAZ —
   yalnız bu listedeki üyeliği gider. */
async function leadKayitSil(kayitId){
  if(!hasPerm('lead_sil')){ toast('Silme yetkiniz yok','error'); return; }
  const l=LEAD.aktifListe; if(!l) return;

  const {data:k}=await sb.from(LEAD_TABLO_KAYIT)
    .select('ncst,unvan,deneme_sayisi').eq('kayit_id',kayitId).maybeSingle();
  if(!k){ toast('Kayıt bulunamadı','error');
          if(LEAD.mod==='agent') _leadAgentKuyruk(); else _leadUyeListesiYukle();
          return; }

  const ad=k.unvan||k.ncst;
  if(!confirm('"'+ad+'" bu arama listesinden silinecek.\n\n'+
              '· Müşteri kaydına dokunulmaz, yalnız bu listedeki üyeliği gider.\n'+
              '· Yapılmış '+(k.deneme_sayisi||0)+' aramanın izi SİLİNMEZ, raporlarda kalır.\n\n'+
              'Devam edilsin mi?')) return;

  const {error}=await sb.from(LEAD_TABLO_KAYIT).delete().eq('kayit_id',kayitId);
  if(error){ toast('Silinemedi: '+error.message,'error'); return; }

  await addLog(LEAD_TABLO_LISTE, l.liste_id, 'Listeden Firma Silindi', ad+' ('+k.ncst+')');
  toast(ad+' listeden silindi','success');
  // V31.186: hangi ekrandan silindiyse oraya dönülür — agent kuyruğundan
  // silindiğinde yönetim ekranına atlamamalı.
  if(LEAD.mod==='agent') _leadAgentKuyruk(); else _leadDetayRender();
}

/* Tüm listeyi siler. lead_kayit satırları FK cascade ile gider;
   lead_arama satırları SET NULL sayesinde KALIR. */
async function leadListeSil(listeId){
  if(!hasPerm('lead_sil')){ toast('Silme yetkiniz yok','error'); return; }

  const {data:l}=await sb.from(LEAD_TABLO_LISTE).select('ad').eq('liste_id',listeId).maybeSingle();
  if(!l){ toast('Liste bulunamadı','error'); initLeadEkrani(); return; }

  const {count:firmaSayisi}=await sb.from(LEAD_TABLO_KAYIT)
    .select('kayit_id',{count:'exact',head:true}).eq('liste_id',listeId);
  const {count:aramaSayisi}=await sb.from(LEAD_TABLO_ARAMA)
    .select('id',{count:'exact',head:true}).eq('liste_id',listeId);

  if(!confirm('"'+l.ad+'" arama listesi SİLİNECEK.\n\n'+
              '· Listedeki '+_leadSayi(firmaSayisi||0)+' firma kaydı gider.\n'+
              '· Yapılmış '+_leadSayi(aramaSayisi||0)+' aramanın izi SİLİNMEZ — raporlarda kalır.\n'+
              '· Müşteri kayıtlarına dokunulmaz.\n\n'+
              'Bu işlem geri alınamaz. Devam edilsin mi?')) return;

  const {error}=await sb.from(LEAD_TABLO_LISTE).delete().eq('liste_id',listeId);
  if(error){ toast('Silinemedi: '+error.message,'error'); return; }

  await addLog(LEAD_TABLO_LISTE, listeId, 'Liste Silindi',
               l.ad+' · '+(firmaSayisi||0)+' firma · '+(aramaSayisi||0)+' arama izi korundu');
  toast('"'+l.ad+'" silindi — arama izi korundu','success');
  LEAD.aktifListe=null;
  initLeadEkrani();
}

async function leadListeDurumDegistir(durum){
  const l=LEAD.aktifListe; if(!l) return;
  if(!hasPerm('lead_liste_yonet')){ toast('Yetkiniz yok','error'); return; }
  const alanlar={durum};
  if(durum==='bitti') alanlar.kapanis=new Date().toISOString();
  const {error}=await sb.from(LEAD_TABLO_LISTE).update(alanlar).eq('liste_id',l.liste_id);
  if(error){ toast('Güncellenemedi: '+error.message,'error'); return; }
  await addLog(LEAD_TABLO_LISTE, l.liste_id, 'Liste Durumu', durum);
  LEAD.aktifListe.durum=durum;
  toast('Liste durumu: '+durum,'success');
  _leadDetayRender();
}

function leadEkleSekme(tab){ LEAD.ekleSekme=tab; _leadDetayRender(); }

function _leadEklePanelRender(){
  const p=document.getElementById('leadEklePanel'); if(!p) return;
  p.innerHTML = (LEAD.ekleSekme==='excel') ? _leadExcelPanelHTML() : _leadFiltrePanelHTML();
  if(LEAD.ekleSekme==='filtre') _leadFiltreSeceneklerDoldur();
}

/* ============================================================
   FİLTREYLE EKLEME
   ============================================================ */
const _LEAD_INP='width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;font-size:12px;';

function _leadFiltrePanelHTML(){
  const F=LEAD.filtre;
  const sec=(id,etiket,secenekler)=>
    '<div class="field"><label>'+etiket+'</label><select id="'+id+'" style="'+_LEAD_INP+'">'+secenekler+'</select></div>';
  const sayi=(id,etiket,deger)=>
    '<div class="field"><label>'+etiket+'</label><input type="number" id="'+id+'" value="'+(deger||'')+'" style="'+_LEAD_INP+'"></div>';
  const kutu=(id,etiket,isaretli)=>
    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;margin-bottom:7px;">'+
    '<input type="checkbox" id="'+id+'"'+(isaretli?' checked':'')+'> '+etiket+'</label>';

  return '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">'+
      'Amaç: saha ekibinin gitmediği müşterileri bulup listeye eklemek. '+
      'En az bir daraltıcı filtre seç — '+LEAD_ADAY_LIMIT.toLocaleString('tr-TR')+
      ' müşteriden fazlası tek seferde taranamaz.</div>'+

    '<div class="form-section-title" style="margin-top:4px;">Kim</div>'+
    '<div id="leadKcmAlan"></div>'+
    '<div id="leadMyAlan"></div>'+
    kutu('lfAtamasiz','Portföy sahibi atanmamış müşteriler', F.atamasiz)+

    '<div class="form-section-title" style="margin-top:12px;">Nerede / Ne tür</div>'+
    '<div id="leadIlAlan"></div>'+
    '<div id="leadSektorAlan"></div>'+
    '<div id="leadTipAlan"></div>'+
    sec('lfAktif','Aktif / Pasif',
        '<option value="true"'+(F.aktif==='true'?' selected':'')+'>Yalnız aktif</option>'+
        '<option value=""'+(F.aktif===''?' selected':'')+'>Hepsi</option>'+
        '<option value="false"'+(F.aktif==='false'?' selected':'')+'>Yalnız pasif</option>')+

    '<div class="form-section-title" style="margin-top:12px;">Ürün / ihtiyaç sinyali</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'+
      sayi('lfHatMin','Toplam hat ≥',F.hatMin)+sayi('lfHatMax','Toplam hat ≤',F.hatMax)+
      sayi('lfByMin','Beyaz yaka ≥',F.byMin)+sayi('lfByMax','Beyaz yaka ≤',F.byMax)+
    '</div>'+
    '<div style="font-size:11px;color:var(--text3);margin:-4px 0 10px;">'+
      'Toplam hat <b>0</b> → hiç ürünü yok, en değerli lead.</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'+
      sec('lfSunucu','Sunucu altyapısı',
          '<option value="">Önemli değil</option><option value="var"'+(F.sunucu==='var'?' selected':'')+'>Var</option><option value="yok"'+(F.sunucu==='yok'?' selected':'')+'>Yok</option>')+
      sec('lfFirewall','Firewall',
          '<option value="">Önemli değil</option><option value="var"'+(F.firewall==='var'?' selected':'')+'>Var</option><option value="yok"'+(F.firewall==='yok'?' selected':'')+'>Yok</option>')+
      sec('lfItEkibi','IT ekibi',
          '<option value="">Önemli değil</option><option value="var"'+(F.itEkibi==='var'?' selected':'')+'>Var</option><option value="yok"'+(F.itEkibi==='yok'?' selected':'')+'>Yok</option>')+
      sec('lfProfil','Profil tamamlandı',
          '<option value="">Önemli değil</option><option value="true"'+(F.profil==='true'?' selected':'')+'>Evet</option><option value="false"'+(F.profil==='false'?' selected':'')+'>Hayır</option>')+
    '</div>'+

    '<div class="form-section-title" style="margin-top:12px;">Temas boşluğu</div>'+
    sec('lfZiyaret','Ziyaret durumu',
        '<option value=""'+(F.ziyaret===''?' selected':'')+'>Önemli değil</option>'+
        '<option value="hic"'+(F.ziyaret==='hic'?' selected':'')+'>Hiç ziyaret edilmemiş</option>'+
        '<option value="gun"'+(F.ziyaret==='gun'?' selected':'')+'>Şu kadar gündür ziyaret edilmemiş</option>')+
    sayi('lfZiyaretGun','Gün sayısı (yalnız "gündür" seçilince)',F.ziyaretGun)+
    sec('lfFirsat','Fırsat durumu',
        '<option value=""'+(F.firsat===''?' selected':'')+'>Önemli değil</option>'+
        '<option value="hic"'+(F.firsat==='hic'?' selected':'')+'>Hiç fırsat açılmamış</option>'+
        '<option value="acikYok"'+(F.firsat==='acikYok'?' selected':'')+'>Açık fırsatı yok</option>')+
    sec('lfIletisim','İletişim bilgisi',
        '<option value=""'+(F.iletisim===''?' selected':'')+'>Önemli değil</option>'+
        '<option value="var"'+(F.iletisim==='var'?' selected':'')+'>Telefonu olanlar</option>'+
        '<option value="yok"'+(F.iletisim==='yok'?' selected':'')+'>Telefonu OLMAYANLAR (agent dolduracak)</option>')+

    '<div class="form-section-title" style="margin-top:12px;">Otomatik elemeler</div>'+
    '<div style="background:rgba(224,4,42,.08);border:1px solid rgba(224,4,42,.3);border-radius:8px;padding:9px 11px;margin-bottom:9px;font-size:12px;color:var(--text2);">'+
      '⛔ <b>Aranmak istemiyor</b> işaretli kontaklar her koşulda elenir — kapatılamaz.</div>'+
    kutu('lfElePotansiyel','"Potansiyel Değil" işaretli müşterileri ele', F.elePotansiyelYok)+
    kutu('lfEleBaskaListe','Başka aktif listede olanları ele', F.eleBaskaListe)+
    kutu('lfEleCooldown','Son N günde aranmış olanları ele (Arama Ayarları)', F.eleCooldown)+
    '<div style="font-size:11px;color:var(--text3);margin:-2px 0 8px;">'+
      'Pasif müşteriler yukarıdaki <b>Aktif / Pasif</b> seçicisiyle yönetilir.</div>'+

    '<button class="btn" style="width:100%;margin-top:10px;background:var(--green);color:#04301f;" '+
      'onclick="leadAdayOnizle()">🔍 Önizle</button>'+
    '<div id="leadOnizleme" style="margin-top:12px;"></div>';
}

/* KÇM / MY / İl / Sektör / Tip seçeneklerini DB'den doldurur. */
async function _leadFiltreSeceneklerDoldur(){
  // KÇM — kcm_groups
  const kcmEl=document.getElementById('leadKcmAlan');
  if(kcmEl){
    const {data:kcmler}=await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
    const kapsam=getScope('lead');
    let liste=kcmler||[];
    if(kapsam!=='TÜM' && currentUser.kcm_id) liste=liste.filter(k=>k.kcm_id===currentUser.kcm_id);
    kcmEl.innerHTML='<div class="field"><label>KÇM</label><select id="lfKcm" style="'+_LEAD_INP+'" onchange="_leadMyDoldur()">'+
      (kapsam==='TÜM'?'<option value="">Hepsi</option>':'')+
      liste.map(k=>'<option value="'+k.kcm_id+'">'+escapeHTML(k.kcm_adi||('KÇM '+k.kcm_id))+'</option>').join('')+
      '</select></div>';
    if(kapsam!=='TÜM' && currentUser.kcm_id){ const e=document.getElementById('lfKcm'); if(e) e.value=String(currentUser.kcm_id); }
  }
  await _leadMyDoldur();

  // İl / Sektör / Tip — mevcut müşteri verisinden değil, sabit listelerden okunur
  // olmadığı için customers'tan DISTINCT çekmek pahalı. Serbest metin kutusu
  // daha dürüst: kullanıcı ne yazarsa ona göre filtrelenir.
  const ilEl=document.getElementById('leadIlAlan');
  if(ilEl) ilEl.innerHTML='<div class="field"><label>İl (tam ad)</label><input type="text" id="lfIl" placeholder="Örn: İSTANBUL" style="'+_LEAD_INP+'"></div>'+
                          '<div class="field"><label>İlçe (tam ad)</label><input type="text" id="lfIlce" style="'+_LEAD_INP+'"></div>';
  const sekEl=document.getElementById('leadSektorAlan');
  if(sekEl) sekEl.innerHTML='<div class="field"><label>Sektör (tam ad)</label><input type="text" id="lfSektor" style="'+_LEAD_INP+'"></div>';
  const tipEl=document.getElementById('leadTipAlan');
  if(tipEl) tipEl.innerHTML='<div class="field"><label>Müşteri tipi (tam ad)</label><input type="text" id="lfTip" style="'+_LEAD_INP+'"></div>';
}

async function _leadMyDoldur(){
  const myEl=document.getElementById('leadMyAlan'); if(!myEl) return;
  const kcm=_leadDeger('lfKcm');
  let liste=(window.userSecici||[]);
  if(kcm) liste=liste.filter(u=>String(u.kcm_id)===String(kcm));
  liste=liste.filter(u=>['MY','FMY','USER'].includes(u.rol));
  myEl.innerHTML='<div class="field"><label>Portföy sahibi MY</label><select id="lfMy" style="'+_LEAD_INP+'">'+
    '<option value="">Hepsi</option>'+
    liste.sort((a,b)=>(a.ad_soyad||'').localeCompare(b.ad_soyad||'','tr'))
         .map(u=>'<option value="'+u.my_id+'">'+escapeHTML(u.ad_soyad)+'</option>').join('')+
    '</select></div>';
}

function _leadFiltreOku(){
  const F=LEAD.filtre;
  F.kcm=_leadDeger('lfKcm'); F.my=_leadDeger('lfMy'); F.atamasiz=_leadIsaretli('lfAtamasiz');
  F.il=_leadDeger('lfIl'); F.ilce=_leadDeger('lfIlce');
  F.sektor=_leadDeger('lfSektor'); F.tip=_leadDeger('lfTip');
  F.aktif=_leadDeger('lfAktif');
  F.hatMin=_leadDeger('lfHatMin'); F.hatMax=_leadDeger('lfHatMax');
  F.byMin=_leadDeger('lfByMin');  F.byMax=_leadDeger('lfByMax');
  F.sunucu=_leadDeger('lfSunucu'); F.firewall=_leadDeger('lfFirewall');
  F.itEkibi=_leadDeger('lfItEkibi'); F.profil=_leadDeger('lfProfil');
  F.ziyaret=_leadDeger('lfZiyaret'); F.ziyaretGun=_leadDeger('lfZiyaretGun');
  F.firsat=_leadDeger('lfFirsat'); F.iletisim=_leadDeger('lfIletisim');
  F.elePotansiyelYok=_leadIsaretli('lfElePotansiyel');
  F.eleBaskaListe=_leadIsaretli('lfEleBaskaListe');
  F.eleCooldown=_leadIsaretli('lfEleCooldown');
}

async function leadAdayOnizle(){
  _leadFiltreOku();
  const F=LEAD.filtre;
  const daraltici = F.kcm||F.my||F.il||F.ilce||F.sektor||F.tip||F.atamasiz||
                    F.hatMin!==''||F.hatMax!==''||F.byMin!==''||F.byMax!==''||
                    F.sunucu||F.firewall||F.itEkibi||F.profil||F.ziyaret||F.firsat||F.iletisim;
  if(!daraltici){
    toast('En az bir filtre seç — tüm müşteri tablosu tek seferde taranamaz','error');
    return;
  }
  const box=document.getElementById('leadOnizleme');
  if(box) box.innerHTML='<div class="loader"><div class="spinner"></div></div><div style="font-size:11px;color:var(--text3);text-align:center;">Aday müşteriler taranıyor...</div>';

  try{
    LEAD.aday=await _leadAdaylarBul(F);
  }catch(e){
    console.error('[lead] aday tarama hatasi:', e);
    if(box) box.innerHTML='<div class="empty" style="color:var(--red);">Tarama başarısız: '+escapeHTML(e.message||String(e))+'</div>';
    return;
  }
  _leadOnizlemeRender();
}

/* ------------------------------------------------------------
   ADAY BULMA
   Yöntem: önce customers üzerinde veritabanı tarafı filtreler (sayfalı),
   sonra YALNIZCA aday NCST'ler için parçalı .in() sorgularıyla eleme
   verisi. Böylece sorgu hacmi aday sayısıyla büyür, tablo boyutuyla değil.
   ------------------------------------------------------------ */
async function _leadAdaylarBul(F){
  const KOLON='ncst,unvan,my_id,kcm_id,il,ilce,sektor,musteri_tipi,aktif,toplam_hat,'+
              'beyaz_yakali_sayi,sunucu_altyapisi,it_ekibi,firewall_kullanimi,'+
              'profil_tamamlandi,churn_riski,ziyaret_potansiyeli_yok,telefon';

  function temelSorgu(){
    let q=sb.from('customers').select(KOLON);
    if(F.kcm) q=q.eq('kcm_id',parseInt(F.kcm));
    if(F.my)  q=q.eq('my_id',parseInt(F.my));
    else if(F.atamasiz) q=q.is('my_id',null);
    if(F.il)     q=q.ilike('il',F.il);
    if(F.ilce)   q=q.ilike('ilce',F.ilce);
    if(F.sektor) q=q.ilike('sektor',F.sektor);
    if(F.tip)    q=q.ilike('musteri_tipi',F.tip);
    if(F.aktif!=='') q=q.eq('aktif',F.aktif==='true');
    if(F.hatMin!=='') q=q.gte('toplam_hat',parseInt(F.hatMin));
    if(F.hatMax!=='') q=q.lte('toplam_hat',parseInt(F.hatMax));
    if(F.byMin!=='')  q=q.gte('beyaz_yakali_sayi',parseInt(F.byMin));
    if(F.byMax!=='')  q=q.lte('beyaz_yakali_sayi',parseInt(F.byMax));
    if(F.sunucu==='var')   q=q.eq('sunucu_altyapisi',true);
    if(F.sunucu==='yok')   q=q.or('sunucu_altyapisi.is.null,sunucu_altyapisi.eq.false');
    if(F.firewall==='var') q=q.eq('firewall_kullanimi',true);
    if(F.firewall==='yok') q=q.or('firewall_kullanimi.is.null,firewall_kullanimi.eq.false');
    if(F.itEkibi==='var')  q=q.eq('it_ekibi',true);
    if(F.itEkibi==='yok')  q=q.or('it_ekibi.is.null,it_ekibi.eq.false');
    if(F.profil!=='')      q=q.eq('profil_tamamlandi',F.profil==='true');
    return q;
  }

  // 1) Aday havuzu — sayfalı
  let adaylar=[], kesildi=false;
  for(let from=0; from<LEAD_ADAY_LIMIT; from+=LEAD_SAYFA){
    const {data, error}=await temelSorgu().order('ncst').range(from, from+LEAD_SAYFA-1);
    if(error) throw error;
    adaylar=adaylar.concat(data||[]);
    if(!data || data.length<LEAD_SAYFA) break;
    if(adaylar.length>=LEAD_ADAY_LIMIT){ kesildi=true; break; }
  }

  const ncstler=[...new Set(adaylar.map(c=>c.ncst).filter(Boolean))];
  const eleme={filtreyeUyan:adaylar.length};

  // 2) Eleme/zenginleştirme verileri — yalnız aday NCST'ler için
  const ziyaretMap={}, firsatMap={}, kontakMap={}, aramaMap={};
  const baskaListeSet=new Set();

  // aktif/hazırlık listelerindeki NCST'ler (bu listenin kendisi hariç)
  let aktifListeIds=[];
  if(F.eleBaskaListe){
    const {data:ls}=await sb.from(LEAD_TABLO_LISTE).select('liste_id')
      .in('durum',['hazirlik','aktif']);
    aktifListeIds=(ls||[]).map(x=>x.liste_id)
      .filter(id=>!LEAD.aktifListe || id!==LEAD.aktifListe.liste_id);
  }

  // cooldown gün sayısı
  let cooldownGun=0;
  if(F.eleCooldown){
    const {data:ay}=await sb.from('sistem_ayarlari').select('deger')
      .eq('ayar_tipi','arama_cooldown_gun').eq('aktif',true).maybeSingle();
    cooldownGun=parseInt(ay&&ay.deger)||30;
  }

  for(const parca of _leadParcali(ncstler, LEAD_PARCA)){
    // ziyaretler — son ziyaret tarihi
    if(F.ziyaret){
      const {data:vs}=await sb.from('visits').select('ncst,tarih_saat,planlanan_tarih,durum')
        .in('ncst',parca).limit(100000);
      (vs||[]).forEach(v=>{
        const t=v.tarih_saat||v.planlanan_tarih; if(!t) return;
        const mevcut=ziyaretMap[v.ncst];
        if(!mevcut || new Date(t)>new Date(mevcut)) ziyaretMap[v.ncst]=t;
      });
    }
    // fırsatlar
    if(F.firsat){
      const {data:os}=await sb.from('opportunities').select('ncst,adim,durum')
        .in('ncst',parca).limit(100000);
      (os||[]).forEach(o=>{
        const m=firsatMap[o.ncst]=firsatMap[o.ncst]||{adet:0,acik:0};
        m.adet++;
        const a=o.adim||o.durum||'';
        if(!['Gerçekleşen','İptal','Kazanıldı','Kaybedildi'].includes(a)) m.acik++;
      });
    }
    // kontaklar — telefon var mı, aranmak istemiyor mu
    const {data:cs}=await sb.from('contacts').select('ncst,telefon,aranmak_istemiyor,aktif')
      .in('ncst',parca).limit(100000);
    (cs||[]).forEach(c=>{
      if(c.aktif===false) return;
      const m=kontakMap[c.ncst]=kontakMap[c.ncst]||{telVar:false,istemiyor:false,hepsiIstemiyor:true,adet:0};
      m.adet++;
      if(c.telefon) m.telVar=true;
      if(c.aranmak_istemiyor===true) m.istemiyor=true; else m.hepsiIstemiyor=false;
    });
    // başka aktif listede mi
    if(aktifListeIds.length){
      for(const lParca of _leadParcali(aktifListeIds, 50)){
        const {data:lk}=await sb.from(LEAD_TABLO_KAYIT).select('ncst')
          .in('liste_id',lParca).in('ncst',parca).limit(100000);
        (lk||[]).forEach(x=>baskaListeSet.add(x.ncst));
      }
    }
    // son lead araması
    if(cooldownGun>0){
      const {data:la}=await sb.from(LEAD_TABLO_ARAMA).select('ncst,olusturma')
        .in('ncst',parca).limit(100000);
      (la||[]).forEach(a=>{
        const mevcut=aramaMap[a.ncst];
        if(!mevcut || new Date(a.olusturma)>new Date(mevcut)) aramaMap[a.ncst]=a.olusturma;
      });
    }
  }

  // 3) Eleme
  const say={istemiyor:0, potansiyelYok:0, baskaListe:0, cooldown:0,
             ziyaretVar:0, firsatVar:0, iletisim:0};
  const gecenler=[];
  const ziyaretGun=parseInt(F.ziyaretGun)||180;

  adaylar.forEach(c=>{
    const k=kontakMap[c.ncst];
    // ZORUNLU: tüm kontakları "aranmak istemiyor" olan müşteri elenir
    if(k && k.adet>0 && k.hepsiIstemiyor){ say.istemiyor++; return; }
    if(F.elePotansiyelYok && c.ziyaret_potansiyeli_yok===true){ say.potansiyelYok++; return; }
    if(F.eleBaskaListe && baskaListeSet.has(c.ncst)){ say.baskaListe++; return; }
    if(cooldownGun>0){
      const g=_leadGunFark(aramaMap[c.ncst]);
      if(g!=null && g<cooldownGun){ say.cooldown++; return; }
    }
    if(F.ziyaret==='hic' && ziyaretMap[c.ncst]){ say.ziyaretVar++; return; }
    if(F.ziyaret==='gun'){
      const g=_leadGunFark(ziyaretMap[c.ncst]);
      if(g!=null && g<ziyaretGun){ say.ziyaretVar++; return; }
    }
    if(F.firsat==='hic' && firsatMap[c.ncst]){ say.firsatVar++; return; }
    if(F.firsat==='acikYok' && firsatMap[c.ncst] && firsatMap[c.ncst].acik>0){ say.firsatVar++; return; }
    const telVar = !!(k&&k.telVar) || !!c.telefon;
    if(F.iletisim==='var' && !telVar){ say.iletisim++; return; }
    if(F.iletisim==='yok' && telVar){ say.iletisim++; return; }
    gecenler.push(Object.assign({}, c, {_telVar:telVar}));
  });

  eleme.elenen=say;
  eleme.cooldownGun=cooldownGun;
  eleme.telVar=gecenler.filter(c=>c._telVar).length;
  eleme.telYok=gecenler.length-eleme.telVar;
  return {adaylar:gecenler, eleme, kesildi};
}

function _leadOnizlemeRender(){
  const box=document.getElementById('leadOnizleme'); if(!box) return;
  const A=LEAD.aday; if(!A) return;
  const e=A.eleme, s=e.elenen;
  const satir=(etiket,deger,renk)=>
    '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;'+
    (renk?'color:'+renk+';':'color:var(--text2);')+'"><span>'+etiket+'</span><b>'+_leadSayi(deger)+'</b></div>';

  let h='';
  if(A.kesildi){
    h+='<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.4);border-radius:8px;'+
       'padding:9px 11px;font-size:12px;color:var(--text2);margin-bottom:10px;">'+
       'Filtre '+LEAD_ADAY_LIMIT.toLocaleString('tr-TR')+' müşteri sınırına ulaştı. '+
       'Sonuç kesilmiş olabilir — filtreyi daralt.</div>';
  }

  h+='<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;">'+
     '<div style="font-size:12px;font-weight:700;margin-bottom:8px;">Eleme raporu</div>'+
     satir('Filtreye uyan', e.filtreyeUyan, 'var(--text)')+
     '<div style="border-top:1px solid var(--border);margin:6px 0;"></div>'+
     satir('− aranmak istemiyor', s.istemiyor, 'var(--red)')+
     (s.potansiyelYok?satir('− potansiyel değil', s.potansiyelYok):'')+
     (s.baskaListe?satir('− başka aktif listede', s.baskaListe):'')+
     (s.cooldown?satir('− son '+e.cooldownGun+' günde arandı', s.cooldown):'')+
     (s.ziyaretVar?satir('− ziyaret kriterine uymadı', s.ziyaretVar):'')+
     (s.firsatVar?satir('− fırsat kriterine uymadı', s.firsatVar):'')+
     (s.iletisim?satir('− iletişim kriterine uymadı', s.iletisim):'')+
     '<div style="border-top:1px solid var(--border);margin:6px 0;"></div>'+
     '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;color:var(--green);">'+
       '<span>= Listeye eklenecek</span><b>'+_leadSayi(A.adaylar.length)+'</b></div>'+
     '<div style="font-size:11px;color:var(--text3);margin-top:6px;">'+
       'telefonu olan: <b>'+_leadSayi(e.telVar)+'</b> · '+
       'telefonu OLMAYAN: <b style="color:var(--amber);">'+_leadSayi(e.telYok)+'</b> (agent dolduracak)</div>'+
     '</div>';

  if(A.adaylar.length){
    h+='<div style="font-size:11px;color:var(--text3);margin:10px 0 6px;">İlk 20 kayıt:</div>'+
       '<div style="max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:8px;">'+
       A.adaylar.slice(0,20).map(c=>
         '<div style="padding:7px 9px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;">'+
           '<b>'+escapeHTML(c.unvan||c.ncst)+'</b>'+
           '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(c.ncst)+
             (c.il?' · '+escapeHTML(c.il):'')+' · hat: '+(c.toplam_hat||0)+
             (c._telVar?'':' · <span style="color:var(--amber);">telefon yok</span>')+
           '</div></div>').join('')+
       '</div>'+
       '<button class="btn" style="width:100%;margin-top:10px;background:var(--green);color:#04301f;" '+
         'onclick="leadAdaylariEkle()">✓ '+_leadSayi(A.adaylar.length)+' müşteriyi listeye ekle</button>';
  }
  box.innerHTML=h;
}

async function leadAdaylariEkle(){
  const l=LEAD.aktifListe, A=LEAD.aday;
  if(!l || !A || !A.adaylar.length) return;
  if(!hasPerm('lead_liste_yonet')){ toast('Yetkiniz yok','error'); return; }

  const box=document.getElementById('leadOnizleme');
  if(box) box.innerHTML='<div class="loader"><div class="spinner"></div></div>'+
    '<div style="font-size:11px;color:var(--text3);text-align:center;">Ekleniyor...</div>';

  const satirlar=A.adaylar.map(c=>({
    liste_id:l.liste_id, ncst:c.ncst, unvan:c.unvan||null,
    sistemde_var:true, durum:'henuz_aranmadi', durum_grubu:'yeni',
    oncelik:(c.toplam_hat===0?1:2)   // hiç hattı olmayan müşteri yüksek öncelik
  }));

  let eklenen=0, hata=0;
  for(const parca of _leadParcali(satirlar, LEAD_PARCA)){
    const {error}=await sb.from(LEAD_TABLO_KAYIT)
      .upsert(parca,{onConflict:'liste_id,ncst',ignoreDuplicates:true});
    if(error){ console.error('[lead] ekleme hatasi:', error); hata+=parca.length; }
    else eklenen+=parca.length;
  }

  await addLog(LEAD_TABLO_LISTE, l.liste_id, 'Müşteri Eklendi (filtre)',
               eklenen+' kayıt'+(hata?(' · '+hata+' hata'):''));
  if(hata) toast(eklenen+' eklendi, '+hata+' kayıt eklenemedi — konsola bak','error');
  else     toast(eklenen+' müşteri listeye eklendi','success');
  LEAD.aday=null;
  _leadDetayRender();
}

/* ============================================================
   EXCEL İLE EKLEME
   ============================================================ */
const LEAD_EXCEL_ALANLAR=[
  ['ncst','NCST'],['unvan','Unvan'],['telefon','Telefon'],
  ['yetkili','Yetkili adı'],['email','E-posta'],['not','Not']
];

function _leadExcelPanelHTML(){
  return '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">'+
      'Excel/CSV yükle, kolonları eşle. <b>NCST zorunlu.</b> '+
      'NCST sistemde yoksa satır atılmaz — unvanıyla listeye girer ve '+
      '"sistemde yok" işaretlenir.</div>'+
    '<div class="field"><input type="file" id="leadFile" accept=".xlsx,.xls,.csv" style="'+_LEAD_INP+'"></div>'+
    '<button class="btn btn-sm" style="width:100%;background:var(--blue);" onclick="leadExcelOku()">📄 Dosyayı Oku</button>'+
    '<div id="leadExcelInfo" style="font-size:12px;color:var(--text2);margin-top:8px;"></div>'+
    '<div id="leadExcelMapping" style="margin-top:10px;"></div>'+
    '<div id="leadExcelOnizleme" style="margin-top:10px;"></div>';
}

async function leadExcelOku(){
  const fi=document.getElementById('leadFile');
  if(!fi||!fi.files||!fi.files.length){ toast('Önce dosya seçin','error'); return; }
  const hazir=await ensureXLSX();
  if(!hazir){ toast('Excel kütüphanesi yüklenemedi','error'); return; }

  const file=fi.files[0], ext=(file.name.split('.').pop()||'').toLowerCase();
  const info=document.getElementById('leadExcelInfo');
  if(info) info.textContent='Okunuyor...';
  try{
    let aoa;
    if(ext==='csv'){
      const wb=XLSX.read(await file.text(),{type:'string'});
      aoa=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false});
    } else if(ext==='xlsx'||ext==='xls'){
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
      aoa=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false});
    } else { toast('Sadece .xlsx, .xls veya .csv','error'); if(info) info.textContent=''; return; }

    if(!aoa||!aoa.length){ toast('Dosya boş','error'); if(info) info.textContent=''; return; }
    const headers=(aoa[0]||[]).map(h=>String(h==null?'':h).trim());
    const rows=aoa.slice(1).filter(r=>r.some(c=>String(c==null?'':c).trim().length>0));
    LEAD.excel={dosyaAd:file.name, headers, rows, mapping:headers.map((h,i)=>_leadExcelOtoAlan(h,i)), aday:null};
    if(info) info.innerHTML='<b>'+escapeHTML(file.name)+'</b> — '+rows.length+' satır, '+headers.length+' kolon.';
    _leadExcelMappingRender();
    const o=document.getElementById('leadExcelOnizleme'); if(o) o.innerHTML='';
  }catch(e){
    console.error('[lead] excel okuma hatasi:', e);
    toast('Dosya okunamadı: '+(e.message||e),'error');
    if(info) info.textContent='';
  }
}

function _leadExcelOtoAlan(baslik, i){
  const b=String(baslik||'').toUpperCase().replace(/[İ]/g,'I').replace(/[Ş]/g,'S').replace(/[Ğ]/g,'G').replace(/[Ü]/g,'U').replace(/[Ö]/g,'O').replace(/[Ç]/g,'C');
  if(b.includes('NCST')) return 'ncst';
  if(b.includes('UNVAN')||b.includes('FIRMA')||b.includes('MUSTERI')) return 'unvan';
  if(b.includes('TEL')||b.includes('GSM')||b.includes('CEP')) return 'telefon';
  if(b.includes('YETKILI')||b.includes('KISI')||b.includes('AD SOYAD')) return 'yetkili';
  if(b.includes('MAIL')||b.includes('EPOSTA')||b.includes('E-POSTA')) return 'email';
  if(b.includes('NOT')||b.includes('ACIKLAMA')) return 'not';
  return i===0 ? 'ncst' : '';
}

function _leadExcelMappingRender(){
  const box=document.getElementById('leadExcelMapping'); if(!box||!LEAD.excel) return;
  const opts=['<option value="">(kullanma)</option>']
    .concat(LEAD_EXCEL_ALANLAR.map(([k,ad])=>'<option value="'+k+'">'+ad+'</option>'));
  let h='<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;">'+
        '<div style="font-size:12px;font-weight:700;margin-bottom:10px;">Kolon Eşleme</div>'+
        '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:6px 10px;align-items:center;font-size:12px;">';
  LEAD.excel.headers.forEach((hd,i)=>{
    const sel=LEAD.excel.mapping[i]||'';
    h+='<div style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+
       (escapeHTML(hd)||('Kolon '+(i+1)))+'</div><div style="color:var(--text3);">→</div>'+
       '<select onchange="LEAD.excel.mapping['+i+']=this.value" style="'+_LEAD_INP+'">'+
       opts.map(o=>{const v=o.match(/value="([^"]*)"/)[1]; return v===sel?o.replace('>',' selected>'):o;}).join('')+
       '</select>';
  });
  h+='</div><button class="btn btn-sm" style="width:100%;margin-top:12px;background:var(--green);color:#04301f;" '+
     'onclick="leadExcelOnizle()">🔍 Önizle</button></div>';
  box.innerHTML=h;
}

async function leadExcelOnizle(){
  const E=LEAD.excel; if(!E) return;
  const ncstIdx=E.mapping.indexOf('ncst');
  if(ncstIdx<0){ toast('NCST kolonu eşlenmedi','error'); return; }
  const box=document.getElementById('leadExcelOnizleme');
  if(box) box.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  // satırları ayıkla
  const alanIdx={}; E.mapping.forEach((a,i)=>{ if(a && alanIdx[a]==null) alanIdx[a]=i; });
  const ham=new Map();   // ncst → {ncst, satir{}, kaynak_satir, tekrar}
  let ncstBos=0;
  E.rows.forEach(r=>{
    const ncst=String(r[ncstIdx]==null?'':r[ncstIdx]).trim();
    if(!ncst){ ncstBos++; return; }
    if(ham.has(ncst)){ ham.get(ncst).tekrar++; return; }
    const kaynak={};
    E.headers.forEach((hd,i)=>{ const v=String(r[i]==null?'':r[i]).trim(); if(v) kaynak[hd||('kolon'+(i+1))]=v; });
    ham.set(ncst,{
      ncst,
      unvan:  alanIdx.unvan!=null  ? String(r[alanIdx.unvan]||'').trim()  : '',
      telefon:alanIdx.telefon!=null? String(r[alanIdx.telefon]||'').trim(): '',
      yetkili:alanIdx.yetkili!=null? String(r[alanIdx.yetkili]||'').trim(): '',
      email:  alanIdx.email!=null  ? String(r[alanIdx.email]||'').trim()  : '',
      kaynak_satir:kaynak, tekrar:0
    });
  });

  const ncstler=[...ham.keys()];
  const sistemdeVar=new Set(), istemiyorSet=new Set(), baskaListeSet=new Set();
  const unvanMap={};

  try{
    for(const parca of _leadParcali(ncstler, LEAD_PARCA)){
      const {data:cs}=await sb.from('customers').select('ncst,unvan').in('ncst',parca).limit(100000);
      (cs||[]).forEach(c=>{ sistemdeVar.add(c.ncst); unvanMap[c.ncst]=c.unvan; });

      const {data:ks}=await sb.from('contacts').select('ncst,aranmak_istemiyor,aktif')
        .in('ncst',parca).limit(100000);
      const grup={};
      (ks||[]).forEach(k=>{
        if(k.aktif===false) return;
        const g=grup[k.ncst]=grup[k.ncst]||{adet:0,hepsiIstemiyor:true};
        g.adet++; if(k.aranmak_istemiyor!==true) g.hepsiIstemiyor=false;
      });
      Object.keys(grup).forEach(n=>{ if(grup[n].adet>0 && grup[n].hepsiIstemiyor) istemiyorSet.add(n); });

      const {data:ls}=await sb.from(LEAD_TABLO_LISTE).select('liste_id').in('durum',['hazirlik','aktif']);
      const ids=(ls||[]).map(x=>x.liste_id).filter(id=>!LEAD.aktifListe||id!==LEAD.aktifListe.liste_id);
      for(const lParca of _leadParcali(ids, 50)){
        if(!lParca.length) continue;
        const {data:lk}=await sb.from(LEAD_TABLO_KAYIT).select('ncst')
          .in('liste_id',lParca).in('ncst',parca).limit(100000);
        (lk||[]).forEach(x=>baskaListeSet.add(x.ncst));
      }
    }
  }catch(e){
    console.error('[lead] excel onizleme hatasi:', e);
    if(box) box.innerHTML='<div class="empty" style="color:var(--red);">Kontrol başarısız: '+escapeHTML(e.message||String(e))+'</div>';
    return;
  }

  const say={ncstBos, tekrar:0, istemiyor:0, baskaListe:0};
  ham.forEach(v=>{ say.tekrar+=v.tekrar; });
  const gecenler=[];
  ham.forEach(v=>{
    if(istemiyorSet.has(v.ncst)){ say.istemiyor++; return; }
    if(baskaListeSet.has(v.ncst)){ say.baskaListe++; return; }
    v.sistemdeVar=sistemdeVar.has(v.ncst);
    if(!v.unvan) v.unvan=unvanMap[v.ncst]||'';
    gecenler.push(v);
  });

  E.aday={gecenler, say, sistemdeYok:gecenler.filter(v=>!v.sistemdeVar).length,
          telefonlu:gecenler.filter(v=>v.telefon).length};
  _leadExcelOnizlemeRender();
}

function _leadExcelOnizlemeRender(){
  const box=document.getElementById('leadExcelOnizleme'); if(!box) return;
  const E=LEAD.excel; if(!E||!E.aday) return;
  const A=E.aday, s=A.say;
  const satir=(etiket,deger,renk)=>
    '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;'+
    (renk?'color:'+renk+';':'color:var(--text2);')+'"><span>'+etiket+'</span><b>'+_leadSayi(deger)+'</b></div>';

  let h='<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;">'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:8px;">Eleme raporu</div>'+
    satir('Dosyadaki satır', E.rows.length, 'var(--text)')+
    '<div style="border-top:1px solid var(--border);margin:6px 0;"></div>'+
    (s.ncstBos?satir('− NCST boş', s.ncstBos, 'var(--red)'):'')+
    (s.tekrar?satir('− mükerrer NCST (tek satıra indi)', s.tekrar):'')+
    (s.istemiyor?satir('− aranmak istemiyor', s.istemiyor, 'var(--red)'):'')+
    (s.baskaListe?satir('− başka aktif listede', s.baskaListe):'')+
    '<div style="border-top:1px solid var(--border);margin:6px 0;"></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;color:var(--green);">'+
      '<span>= Listeye eklenecek</span><b>'+_leadSayi(A.gecenler.length)+'</b></div>'+
    '<div style="font-size:11px;color:var(--text3);margin-top:6px;">'+
      'dosyada telefonu olan: <b>'+_leadSayi(A.telefonlu)+'</b>'+
      (A.sistemdeYok?' · <b style="color:var(--amber);">'+_leadSayi(A.sistemdeYok)+
        '</b> müşteri sistemde YOK (unvanıyla eklenecek, işaretlenecek)':'')+
    '</div></div>';

  if(A.gecenler.length){
    h+='<div style="font-size:11px;color:var(--text3);margin:10px 0 6px;">İlk 20 kayıt:</div>'+
       '<div style="max-height:200px;overflow:auto;border:1px solid var(--border);border-radius:8px;">'+
       A.gecenler.slice(0,20).map(v=>
         '<div style="padding:7px 9px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;">'+
           '<b>'+escapeHTML(v.unvan||v.ncst)+'</b>'+
           '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(v.ncst)+
             (v.telefon?' · '+escapeHTML(v.telefon):'')+
             (v.sistemdeVar?'':' · <span style="color:var(--amber);">sistemde yok</span>')+
           '</div></div>').join('')+
       '</div>'+
       '<button class="btn" style="width:100%;margin-top:10px;background:var(--green);color:#04301f;" '+
         'onclick="leadExcelEkle()">✓ '+_leadSayi(A.gecenler.length)+' müşteriyi listeye ekle</button>';
  }
  box.innerHTML=h;
}

async function leadExcelEkle(){
  const l=LEAD.aktifListe, E=LEAD.excel;
  if(!l || !E || !E.aday || !E.aday.gecenler.length) return;
  if(!hasPerm('lead_liste_yonet')){ toast('Yetkiniz yok','error'); return; }

  const box=document.getElementById('leadExcelOnizleme');
  if(box) box.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  const satirlar=E.aday.gecenler.map(v=>({
    liste_id:l.liste_id, ncst:v.ncst, unvan:v.unvan||null,
    kaynak_satir:v.kaynak_satir||null, sistemde_var:!!v.sistemdeVar,
    durum:'henuz_aranmadi', durum_grubu:'yeni', oncelik:2
  }));

  let eklenen=0, hata=0;
  for(const parca of _leadParcali(satirlar, LEAD_PARCA)){
    const {error}=await sb.from(LEAD_TABLO_KAYIT)
      .upsert(parca,{onConflict:'liste_id,ncst',ignoreDuplicates:true});
    if(error){ console.error('[lead] excel ekleme hatasi:', error); hata+=parca.length; }
    else eklenen+=parca.length;
  }

  // Liste kaynağını güncelle: filtreyle de eklendiyse 'karma'
  const yeniKaynak = (l.kaynak==='filtre'||l.kaynak==='karma') ? 'karma' : 'excel';
  await sb.from(LEAD_TABLO_LISTE).update({kaynak:yeniKaynak}).eq('liste_id',l.liste_id);
  LEAD.aktifListe.kaynak=yeniKaynak;

  await addLog(LEAD_TABLO_LISTE, l.liste_id, 'Müşteri Eklendi (Excel)',
               E.dosyaAd+' — '+eklenen+' kayıt'+(hata?(' · '+hata+' hata'):''));
  if(hata) toast(eklenen+' eklendi, '+hata+' kayıt eklenemedi — konsola bak','error');
  else     toast(eklenen+' müşteri listeye eklendi','success');
  LEAD.excel=null;
  _leadDetayRender();
}


/* ============================================================================
   FAZ 4 — AGENT ARAMA EKRANI + DURUM AĞACI (V31.178)

   Ziyaret Teyit'teki akışın birebir aynısı:
     liste seç → 4 kutu (Henüz Aranmadı / Tekrar Aranacak / Ulaşılamadı /
     Tamamlanan) + Çağrı Analizi çipi → müşteri kartı → aç → iletişim bilgisi
     yoksa KONTAK KARTI → kaydet → doğrudan arama ekranı → durum ağacı.

   Durum ağacı: tek state objesi (window._lanket), her seçimden sonra yeniden
   render; yalnız anlamlı sorular görünür. arama.js'teki _anketRender deseni.

   FIRSAT KAYDI AÇILMAZ — 'Lead Satış Fırsatı' görev kartı açılır.
   ============================================================================ */

/* ---------------------------------------------------------------- durum haritası
   Her yaprak: etiket · hangi kutuya düşer · analiz grubu · tekrar tarihi ister mi
   · görev kartı açar mı. Tek kaynak: ekran, kayıt ve rapor bu haritadan okur. */
const LEAD_DURUM = {
  henuz_aranmadi:          {et:'Henüz aranmadı',                      grup:'yeni'},

  // --- ulaşılamadı
  ul_cevapsiz:             {et:'Ulaşılamıyor / Cevapsız',             grup:'ulasilamadi', tekrar:true},
  ul_mesgul:               {et:'Ulaşılamıyor / Meşgule atıyor',       grup:'ulasilamadi', tekrar:true},
  ul_kapali:               {et:'Ulaşılamıyor / Telefon kapalı',       grup:'ulasilamadi', tekrar:true},
  ul_santral:              {et:'Santralden geçilemedi',               grup:'ulasilamadi', tekrar:true},
  ul_faks:                 {et:'Faks / sesli yanıt',                  grup:'ulasilamadi', tekrar:true},
  ul_hat_yok:              {et:'Hat hizmet dışı / numara yok',        grup:'tamam', sonuc:'olumsuz'},
  ul_yanlis_numara:        {et:'Yanlış numara',                       grup:'tamam', sonuc:'olumsuz'},

  // --- görüşüldü ama muhatap değil
  g_yanlis_numara:         {et:'Görüşüldü, yanlış/hatalı numara',     grup:'tamam', sonuc:'olumsuz'},
  g_yonlendirdi:           {et:'Yetkili değil, doğru kişiye yönlendirdi', grup:'yeni', yeniKontak:true},
  g_firma_kapandi:         {et:'Firma kapanmış / faaliyeti yok',      grup:'tamam', sonuc:'olumsuz', potansiyelYok:true},

  // --- görüşüldü, görüşmeye uygun değil
  g_musait_degil:          {et:'Müsait değil, tekrar aranacak',       grup:'tekrar', tekrar:true, tekrarZorunlu:true},
  g_aranmak_istemiyor:     {et:'Aranmak istemiyor',                   grup:'tamam', sonuc:'istemiyor', istemiyor:true},

  // --- görüşüldü, bilgi verildi
  g_ilgilenmedi:           {et:'Bilgi verildi, ilgilenmedi',          grup:'tamam', sonuc:'olumsuz'},
  g_detay_istiyor:         {et:'Bilgi verildi, detay bilgi istiyor',  grup:'tamam', sonuc:'olumlu', satis:true, gorev:true},
  g_siparis_istiyor:       {et:'Bilgi verildi, sipariş vermek istiyor',grup:'tamam', sonuc:'olumlu', satis:true, gorev:true},
  // g_mevcut_musteri KALDIRILDI (V31.179, Oktay): "Biz zaten Turkcell
  // musterilerini ariyoruz, bu aciklamaya gerek yok." Harita girdisi, varsa
  // eski kayitlar ekranda bos gorunmesin diye duruyor; secenek listesinde YOK.
  g_mevcut_musteri:        {et:'Zaten Turkcell müşterisi / hattı var', grup:'tamam', sonuc:'olumlu', satis:true},
  g_rakip_sozlesme:        {et:'Rakipte, sözleşmesi var',             grup:'tamam', sonuc:'olumsuz', sozlesme:true},
  g_fiyat_uyusmadi:        {et:'Fiyat beklentisi uyuşmadı',           grup:'tamam', sonuc:'olumsuz'},
  // V31.182 (Oktay, 12.10.2026): "Karar verici degil" TEK BASINA bir sonuc
  // degildir. Agent ya karar vericinin bilgisini alir, ya da gorusme kapanir.
  // Eskiden burada takvim aciliyordu; kimi arayacagi belli olmayan bir
  // "tekrar aranacak" kuyrugu sisirmekten baska ise yaramiyordu — KALDIRILDI.
  // Asagidaki girdi artik yalnizca ust secenek (chip) olarak durur, KAYDEDILMEZ;
  // haritada kalmasinin nedeni eski kayitlarin ekranda bos gorunmemesi.
  g_karar_verici_degil:    {et:'Karar verici değil',                  grup:'tekrar', kvParent:true},
  // Karar vericinin bilgisi ALINDI → yeni kontak acilir, kayit "Henuz
  // Aranmadi" kuyruguna doner; bu kez karar verici aranir.
  g_kv_verdi:              {et:'Karar verici değil — karar vericiyi verdi', grup:'yeni', yeniKontak:true, telZorunlu:true},
  // Bilgi VERILMEDI → gorusme kapanir. Tekrar arama yok.
  g_kv_vermedi:            {et:'Karar verici değil — bilgi vermedi, görüşme kapandı', grup:'tamam', sonuc:'olumsuz'},
  g_randevu:               {et:'Randevu istiyor (saha ziyareti)',     grup:'tamam', sonuc:'olumlu', randevu:true, gorev:true},
  // V31.181: Sikayet ve Talep, teyit aramasindaki ile AYNI gorev tiplerini
  // acar ('Musteri Sikayeti' / 'Musteri Talebi') ve AYNI hedef zincirini
  // kullanir (arama.js:_sikayetTalepHedefBul — takim lideri -> KCM muduru ->
  // operasyon muduru). Gorev kapatma da ayni ekrandan yapilir.
  g_sikayet:               {et:'Şikayet iletti',                      grup:'tamam', sikayet:true, gorevTipi:'Müşteri Şikayeti', hedefZinciri:true},
  // Talep OLUMLU sayilir: musteri bir sey istiyor, satis acilimi var.
  // Sikayet bilerek sonuc_grubu ALMAZ — sikayeti 'olumsuz' saymak red
  // nedenleri raporunu kirletir; sikayet gorev uzerinden takip edilir.
  g_talep:                 {et:'Müşteri talebi iletti',               grup:'tamam', sonuc:'olumlu', talep:true, gorevTipi:'Müşteri Talebi'},
  g_dil_sorunu:            {et:'Dil / iletişim sorunu',               grup:'tamam', sonuc:'olumsuz'},

  // --- V31.185: ARAMADAN TAMAMLANDI (görüşme hiç yapılmadı)
  // Bunlar bir arama SONUCU değil, bir KAPATMA nedenidir. 'Yönetici talimatı'
  // ve 'Diğer' bilerek sonuc_grubu ALMAZ: bunları 'olumsuz' saymak red
  // nedenleri raporunu kirletir — müşteri bir şey reddetmedi, aranmadı bile.
  k_istemiyor:             {et:'Aramadan tamamlandı — müşteri aranmak istemiyor', grup:'tamam', sonuc:'istemiyor', istemiyor:true, aramasiz:true},
  k_iletisim_yok:          {et:'Aramadan tamamlandı — iletişim bilgisi bulunamadı', grup:'tamam', sonuc:'olumsuz', aramasiz:true},
  k_yonetici:              {et:'Aramadan tamamlandı — yönetici talimatı',          grup:'tamam', aramasiz:true},
  k_diger:                 {et:'Aramadan tamamlandı — diğer',                      grup:'tamam', aramasiz:true}
};

/* V31.185 — "Aramadan Tamamla" nedenleri (Oktay'ın verdiği liste).
   Her neden bir LEAD_DURUM koduna bağlanır; böylece kuyruk/rapor mantığı
   normal arama sonuçlarıyla aynı yoldan işler. */
const LEAD_ARAMASIZ_NEDEN = [
  {kod:'k_istemiyor',    et:'Müşteri aranmak istemiyor'},
  {kod:'k_iletisim_yok', et:'İletişim bilgisi bulunamıyor'},
  {kod:'k_yonetici',     et:'Yönetici talimatı'},
  {kod:'k_diger',        et:'Diğer'}
];

const LEAD_SEKME_ETIKET={yeni:'Henüz Aranmadı', tekrar:'Tekrar Aranacak',
                         ulasilamadi:'Ulaşılamadı', tamam:'Tamamlanan'};

/* ============================================================
   GİRİŞ YÖNLENDİRMESİ — agent mi, yönetim mi
   ============================================================ */
async function _leadModSec(mod){
  LEAD.mod=mod;
  if(mod==='agent'){ LEAD.aktifListe=null; await _leadAgentListeSec(); }
  else { await _leadListeleriYukle(); }
}

function _leadModBariHTML(){
  const agent=hasPerm('lead_agent');
  const yonet=hasPerm('lead_liste_yonet')||hasPerm('lead_rapor');
  if(!(agent&&yonet)) return '';
  return '<div style="display:flex;gap:6px;margin-bottom:12px;">'+
    '<button class="btn btn-sm'+(LEAD.mod==='agent'?'':' btn-ghost')+'" style="flex:1;'+
      (LEAD.mod==='agent'?'background:var(--blue);':'')+'" onclick="_leadModSec(\'agent\')">🎯 Arama</button>'+
    '<button class="btn btn-sm'+(LEAD.mod==='yonetim'?'':' btn-ghost')+'" style="flex:1;'+
      (LEAD.mod==='yonetim'?'background:var(--blue);':'')+'" onclick="_leadModSec(\'yonetim\')">🗂 Listeler</button>'+
    '</div>';
}

/* ============================================================
   AGENT — LİSTE SEÇİMİ
   ============================================================ */
async function _leadAgentListeSec(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  el.innerHTML=_leadModBariHTML()+'<div class="loader"><div class="spinner"></div></div>';

  let q=sb.from(LEAD_TABLO_LISTE).select('*').eq('durum','aktif').order('olusturma',{ascending:false});
  const kapsam=getScope('lead');
  if(kapsam!=='TÜM' && currentUser.kcm_id) q=q.or('kcm_id.eq.'+currentUser.kcm_id+',kcm_id.is.null');
  const {data:listeler, error}=await q;
  if(error){ el.innerHTML=_leadModBariHTML()+'<div class="empty" style="color:var(--red);">Listeler okunamadı: '+escapeHTML(error.message)+'</div>'; return; }

  const akt=listeler||[];
  if(!akt.length){
    el.innerHTML=_leadModBariHTML()+'<div class="empty">Aktif arama listesi yok.<br>'+
      '<span style="font-size:11px;color:var(--text3);">Liste yöneticisi bir listeyi "Aktif" yapınca burada görünür.</span></div>';
    return;
  }
  // tek aktif liste varsa doğrudan kuyruğa gir
  if(akt.length===1){ LEAD.aktifListe=akt[0]; await _leadAgentKuyruk(); return; }

  // sayaçlar
  const kalanlar={};
  for(const l of akt){
    const {count}=await sb.from(LEAD_TABLO_KAYIT).select('*',{count:'exact',head:true})
      .eq('liste_id',l.liste_id).in('durum_grubu',['yeni','tekrar']);
    kalanlar[l.liste_id]=count||0;
  }
  let h=_leadModBariHTML()+'<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">Çalışacağın listeyi seç:</div>';
  akt.forEach(l=>{
    h+='<div class="visit-card" style="margin-bottom:8px;cursor:pointer;" onclick="leadAgentListeAc(\''+l.liste_id+'\')">'+
       '<div class="visit-firm">'+escapeHTML(l.ad)+'</div>'+
       '<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+
         (l.urun_odak?escapeHTML(l.urun_odak)+' · ':'')+'aranacak: <b style="color:var(--amber);">'+
         _leadSayi(kalanlar[l.liste_id])+'</b></div></div>';
  });
  el.innerHTML=h;
}

async function leadAgentListeAc(listeId){
  const {data:l}=await sb.from(LEAD_TABLO_LISTE).select('*').eq('liste_id',listeId).maybeSingle();
  if(!l){ toast('Liste bulunamadı','error'); return; }
  LEAD.aktifListe=l; LEAD.aktifSekme='yeni';
  _leadFiltreSifirla();
  await _leadAgentKuyruk();
}

/* ============================================================
   AGENT — KUYRUK EKRANI
   ============================================================ */
async function _leadAgentKuyruk(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  const l=LEAD.aktifListe; if(!l){ return _leadAgentListeSec(); }
  // V31.178 FIX: arama kaydedildikten sonra buraya donuluyor; bu yolda
  // _leadFiltreSifirla cagrilmiyordu ve LEAD.filtre null ise filtre paneli
  // cokuyordu (testte goruldu). State burada garanti altina alinir.
  if(!LEAD.filtre) _leadFiltreSifirla();
  el.innerHTML=_leadModBariHTML()+'<div class="loader"><div class="spinner"></div></div>';

  // FIRSATÇI SÜPÜRME (Bölüm 9 — zamanlayıcı yok):
  //  1) deneme limiti dolmuş kayıtları kapat
  //  2) rakip sözleşmesi bitişe 60 gün kalanları tekrar kuyruğa al
  await _leadSupur(l);

  const sayac={};
  for(const g of ['yeni','tekrar','ulasilamadi','tamam']){
    const {count}=await sb.from(LEAD_TABLO_KAYIT).select('*',{count:'exact',head:true})
      .eq('liste_id',l.liste_id).eq('durum_grubu',g);
    sayac[g]=count||0;
  }

  let h=_leadModBariHTML();
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'+
      '<button class="topbar-back" onclick="_leadAgentListeSec()" style="position:relative;width:auto;padding:6px 10px;font-size:12px;">← Liste</button>'+
      '<div style="font-size:13px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeHTML(l.ad)+'</div>'+
     '</div>';

  h+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px;">'+
     ['yeni','tekrar','ulasilamadi','tamam'].map(g=>{
       const renk={yeni:'var(--amber)',tekrar:'var(--orange)',ulasilamadi:'var(--text2)',tamam:'var(--green)'}[g];
       return '<div class="summary-box'+(LEAD.aktifSekme===g?' active':'')+'" style="cursor:pointer;'+
         (LEAD.aktifSekme===g?'border-color:var(--blue);':'')+'" onclick="leadSekmeAc(\''+g+'\')">'+
         '<div class="summary-val lg" style="color:'+renk+';">'+_leadSayi(sayac[g])+'</div>'+
         '<div class="summary-label lg">'+LEAD_SEKME_ETIKET[g]+'</div></div>';
     }).join('')+'</div>';

  if(hasPerm('lead_rapor')){
    h+='<div style="display:flex;gap:6px;margin-bottom:10px;">'+
       '<div class="chip-btn'+(LEAD.aktifSekme==='analiz'?' selected':'')+'" style="flex:1;padding-top:13px;padding-bottom:13px;" '+
       'onclick="leadSekmeAc(\'analiz\')">📊 Çağrı Analizi</div></div>';
  }
  h+='<div id="leadPano"></div>'+
     '<div id="leadFiltrePanel"></div><div id="leadKuyruk"><div class="loader"><div class="spinner"></div></div></div>';
  el.innerHTML=h;
  // V31.179: bugunku kendi rakamlarim (arama/ulasma/olumlu/gorev)
  _leadAgentPanoHTML().then(p=>{ const e=document.getElementById('leadPano'); if(e) e.innerHTML=p; });

  if(LEAD.aktifSekme==='analiz') return loadLeadAnaliz();
  _leadKuyrukFiltreRender();
  await _leadKuyrukYukle();
}

function leadSekmeAc(g){
  LEAD.aktifSekme=g;
  _leadFiltreSifirla();
  _leadAgentKuyruk();
}

/* Deneme limiti + rakip sözleşme süpürmesi. Hatası akışı kesmez. */
async function _leadSupur(l){
  try{
    const limit=l.deneme_limiti||4;
    const {data:dolanlar}=await sb.from(LEAD_TABLO_KAYIT)
      .select('kayit_id,deneme_sayisi').eq('liste_id',l.liste_id)
      .in('durum_grubu',['yeni','tekrar']).gte('deneme_sayisi',limit).limit(500);
    for(const k of (dolanlar||[])){
      await sb.from(LEAD_TABLO_KAYIT).update({
        durum:'ul_cevapsiz', durum_grubu:'ulasilamadi', sonraki_arama:null,
        guncelleme:new Date().toISOString()
      }).eq('kayit_id',k.kayit_id);
    }

    // rakip sözleşme bitişine 60 gün kalanlar → tekrar kuyruğa
    const esik=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
    const {data:sozlesmeliler}=await sb.from(LEAD_TABLO_KAYIT)
      .select('kayit_id').eq('liste_id',l.liste_id).eq('durum_grubu','tamam')
      .not('rakip_sozlesme_bitis','is',null).lte('rakip_sozlesme_bitis',esik).limit(500);
    for(const k of (sozlesmeliler||[])){
      await sb.from(LEAD_TABLO_KAYIT).update({
        durum_grubu:'tekrar', sonraki_arama:new Date().toISOString(),
        deneme_sayisi:0, guncelleme:new Date().toISOString()
      }).eq('kayit_id',k.kayit_id);
    }
  }catch(e){ console.warn('[lead] supurme atlandi:', e); }
}

function _leadKuyrukFiltreRender(){
  const p=document.getElementById('leadFiltrePanel'); if(!p) return;
  if(!LEAD.filtre) _leadFiltreSifirla();
  const F=LEAD.filtre;
  let h='<div style="display:flex;gap:6px;margin-bottom:10px;">'+
    '<input type="text" id="lkQ" placeholder="Müşteri adı veya NCST ara..." value="'+escapeHTML(F.q||'')+'" '+
    'style="flex:1;'+_LEAD_INP+'" oninput="_leadKuyrukFiltreDegisti()">';
  if(LEAD.aktifSekme==='tamam'){
    h+='<select id="lkSonuc" style="'+_LEAD_INP+'width:auto;" onchange="_leadKuyrukFiltreDegisti()">'+
       ['','olumlu','olumsuz','istemiyor'].map(v=>'<option value="'+v+'"'+(F.sonuc===v?' selected':'')+'>'+
         (v===''?'Tüm sonuçlar':v==='olumlu'?'Olumlu':v==='olumsuz'?'Olumsuz':'Aranmak İstemiyor')+'</option>').join('')+
       '</select>';
  }
  h+='</div>';
  p.innerHTML=h;
}

let _leadFiltreZaman=null;
function _leadKuyrukFiltreDegisti(){
  if(!LEAD.filtre) _leadFiltreSifirla();
  LEAD.filtre.q=_leadDeger('lkQ');
  LEAD.filtre.sonuc=_leadDeger('lkSonuc');
  clearTimeout(_leadFiltreZaman);
  _leadFiltreZaman=setTimeout(()=>_leadKuyrukYukle(), 350);
}

async function _leadKuyrukYukle(){
  const box=document.getElementById('leadKuyruk'); if(!box) return;
  const l=LEAD.aktifListe; if(!l) return;
  box.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  if(!LEAD.filtre) _leadFiltreSifirla();
  let q=sb.from(LEAD_TABLO_KAYIT).select('*')
    .eq('liste_id',l.liste_id).eq('durum_grubu',LEAD.aktifSekme);
  if(LEAD.aktifSekme==='tamam' && LEAD.filtre.sonuc) q=q.eq('sonuc_grubu',LEAD.filtre.sonuc);
  const {data:kayitlar, error}=await q
    .order('oncelik',{ascending:true})
    .order('sonraki_arama',{ascending:true,nullsFirst:false})
    .order('olusturma',{ascending:true}).limit(300);
  if(error){ box.innerHTML='<div class="empty" style="color:var(--red);">Kuyruk okunamadı: '+escapeHTML(error.message)+'</div>'; return; }

  let liste=kayitlar||[];
  // müşteri bilgisi + telefon zenginleştirme
  const ncstler=[...new Set(liste.map(k=>k.ncst))];
  const custMap={}, telMap={};
  for(const parca of _leadParcali(ncstler, LEAD_PARCA)){
    if(!parca.length) continue;
    const {data:cs}=await sb.from('customers').select('ncst,unvan,il,ilce,telefon,my_id,toplam_hat')
      .in('ncst',parca).limit(100000);
    (cs||[]).forEach(c=>{ custMap[c.ncst]=c; });
    const {data:ks}=await sb.from('contacts').select('ncst,telefon,aktif')
      .in('ncst',parca).limit(100000);
    (ks||[]).forEach(k=>{ if(k.aktif!==false && k.telefon && !telMap[k.ncst]) telMap[k.ncst]=k.telefon; });
  }

  // V31.181: bu kayitlardan dogmus gorevlerin guncel durumu (son arama)
  const gorevMap={}, sonGorev={};
  if(liste.length){
    const kayitIds=liste.map(k=>k.kayit_id);
    const tumTask=[];
    for(const parca of _leadParcali(kayitIds, LEAD_PARCA)){
      const {data:as}=await sb.from(LEAD_TABLO_ARAMA)
        .select('kayit_id,olusan_task_id,olusturma').in('kayit_id',parca)
        .not('olusan_task_id','is',null).order('olusturma',{ascending:false}).limit(5000);
      (as||[]).forEach(a=>{ if(!sonGorev[a.kayit_id]){ sonGorev[a.kayit_id]=a.olusan_task_id; tumTask.push(a.olusan_task_id); } });
    }
    Object.assign(gorevMap, await _leadGorevHaritasi(tumTask));
  }

  // metin filtresi (yerel)
  const ara=(LEAD.filtre.q||'').toLocaleUpperCase('tr');
  if(ara){
    liste=liste.filter(k=>{
      const c=custMap[k.ncst]||{};
      return String(k.ncst).toLocaleUpperCase('tr').includes(ara) ||
             String(k.unvan||c.unvan||'').toLocaleUpperCase('tr').includes(ara);
    });
  }

  if(!liste.length){ box.innerHTML='<div class="empty">Bu sekmede kayıt yok.</div>'; return; }

  const simdi=Date.now();
  box.innerHTML=liste.map(k=>{
    const c=custMap[k.ncst]||{};
    const unvan=k.unvan||c.unvan||k.ncst;
    const tel=telMap[k.ncst]||c.telefon||'';
    const kilitli = k.kilit_agent_id && k.kilit_zaman &&
                    (simdi-new Date(k.kilit_zaman).getTime() < 15*60000) &&
                    k.kilit_agent_id!==currentUser.my_id;
    const kilitAd = kilitli ? _leadMyAd(k.kilit_agent_id) : '';
    const d=LEAD_DURUM[k.durum]||{};
    return '<div class="visit-card" style="margin-bottom:8px;'+(k.oncelik===1?'border-left:3px solid var(--amber);':'')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'+
        '<div style="flex:1;min-width:0;">'+
          '<div class="visit-firm">'+escapeHTML(unvan)+'</div>'+
          '<div style="font-size:11px;color:var(--text2);">NCST: '+escapeHTML(k.ncst)+
            (c.il?' · '+escapeHTML(c.il):'')+
            (c.toplam_hat===0?' · <span style="color:var(--amber);">hat yok</span>':'')+
            (k.sistemde_var===false?' · <span style="color:var(--amber);">sistemde yok</span>':'')+
          '</div>'+
          '<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+
            (tel?('📞 '+escapeHTML(_telGoster?_telGoster(tel):tel)):'<span style="color:var(--amber);">telefon yok — kontak kartı açılacak</span>')+
            (k.deneme_sayisi?(' · '+k.deneme_sayisi+'. deneme'):'')+
            (k.sonraki_arama?(' · tekrar: '+_leadTarih(k.sonraki_arama)):'')+
          '</div>'+
          (LEAD.aktifSekme!=='yeni'&&d.et?'<div style="font-size:11px;color:var(--text2);margin-top:3px;">'+escapeHTML(d.et)+'</div>':'')+
          (sonGorev[k.kayit_id]&&gorevMap[sonGorev[k.kayit_id]]
            ?'<div style="margin-top:3px;">'+_leadGorevRozeti(gorevMap[sonGorev[k.kayit_id]])+'</div>':'')+
        '</div>'+
      '</div>'+
      (kilitli
        ? '<div style="margin-top:8px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.4);border-radius:8px;padding:6px 9px;font-size:11px;color:var(--amber);">⏳ Şu an '+escapeHTML(kilitAd)+' arıyor</div>'
        : '<button class="btn btn-sm" style="width:100%;margin-top:8px;background:var(--green);color:#04301f;" onclick="leadKayitAc(\''+k.kayit_id+'\')">📞 Ara</button>'+
          // V31.186 (Oktay): aramadan kapatma ve silme KUYRUK KARTINDA da olsun.
          // Agent, arama ekranını hiç açmadan kaydı kapatabilsin; yetkili olan
          // müşteriyi listeden tek tuşla çıkarabilsin. Yönetim ekranındaki
          // "Listedeki Firmalar" bölümü DURUYOR — ikisi birden var.
          '<div style="display:flex;gap:6px;margin-top:6px;">'+
            '<button class="btn btn-sm" style="flex:1;margin-top:0;background:#2a1f05;border:1.5px solid var(--amber);color:#fff;font-size:11px;" '+
              'onclick="leadAramadanTamamlaAc(\''+k.kayit_id+'\')">📵 Aramadan Kapat</button>'+
            (hasPerm('lead_sil')
              ? '<button class="btn btn-sm" title="Müşteriyi listeden sil" '+
                'style="flex:0 0 46px;margin-top:0;background:#350f18;border:1.5px solid #ed2345;color:#fff;font-size:13px;" '+
                'onclick="leadKayitSil(\''+k.kayit_id+'\')">🗑</button>'
              : '')+
          '</div>')+
      '</div>';
  }).join('');
}

/* ============================================================
   KAYIT AÇ → kontak kartı veya arama ekranı
   ============================================================ */
async function leadKayitAc(kayitId){
  const el=document.getElementById('leadListesi'); if(!el) return;
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  const {data:k}=await sb.from(LEAD_TABLO_KAYIT).select('*').eq('kayit_id',kayitId).maybeSingle();
  if(!k){ toast('Kayıt bulunamadı','error'); return _leadAgentKuyruk(); }

  const {data:c}=await sb.from('customers')
    .select('ncst,unvan,il,ilce,adres,telefon,my_id,kcm_id,sektor,musteri_tipi,toplam_hat')
    .eq('ncst',k.ncst).maybeSingle();
  const {data:kontaklar}=await sb.from('contacts')
    .select('contact_id,ad_soyad,gorev_unvani,telefon,email,aranmak_istemiyor,aktif')
    .eq('ncst',k.ncst).limit(50);
  const aktifKontaklar=(kontaklar||[]).filter(x=>x.aktif!==false);

  // yumuşak kilit
  await sb.from(LEAD_TABLO_KAYIT).update({
    kilit_agent_id:currentUser.my_id, kilit_zaman:new Date().toISOString()
  }).eq('kayit_id',kayitId);

  const telli=aktifKontaklar.filter(x=>x.telefon && x.aranmak_istemiyor!==true);
  // V31.179: temas + teyit aramasi gecmisi ARAMADAN ONCE yuklenir.
  const gecmis=await _leadGecmisTopla(k.ncst);
  window._lanket={
    kayit:k, musteri:c||{ncst:k.ncst,unvan:k.unvan}, kontaklar:aktifKontaklar,
    kontak:telli[0]||null, telefon:(telli[0]&&telli[0].telefon)||(c&&c.telefon)||'',
    liste:LEAD.aktifListe, gecmis, baslangic:Date.now(), c:{}
  };

  // V31.179: musteri daha once "aranmak istemiyorum" dediyse arama ekrani ACILMAZ.
  const engel=_leadAramaEngelliMi();
  if(engel){ _leadEngelEkraniRender(engel); return; }

  if(!window._lanket.telefon) _leadKontakKartiRender();
  else _leadAramaEkraniRender();
}

async function leadKayitKapat(){
  const A=window._lanket;
  if(A&&A.kayit){
    try{ await sb.from(LEAD_TABLO_KAYIT).update({kilit_agent_id:null,kilit_zaman:null}).eq('kayit_id',A.kayit.kayit_id); }
    catch(e){ /* kilit temizlenemediyse 15 dk sonra kendiliğinden düşer */ }
  }
  window._lanket=null;
  _leadAgentKuyruk();
}

/* ---------------------------------------------------------------- kontak kartı */
function _leadKontakKartiRender(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  const A=window._lanket, m=A.musteri;
  el.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'+
      '<button class="topbar-back" onclick="leadKayitKapat()" style="position:relative;width:auto;padding:6px 12px;font-size:13px;">← Geri</button>'+
      '<div style="font-size:14px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+
        escapeHTML(m.unvan||m.ncst)+'</div>'+
    '</div>'+
    '<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.4);border-radius:10px;'+
      'padding:11px 13px;font-size:12px;color:var(--text2);margin-bottom:12px;">'+
      '<b style="color:var(--text);">İletişim bilgisi yok.</b><br>'+
      'Turkcell ekranlarından bilgileri doldur, <b>Kaydet</b>\'e bas — doğrudan arama ekranı açılır.'+
    '</div>'+
    _leadMusteriOzetHTML()+
    '<div class="form-section">'+
      '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">NCST: <b>'+escapeHTML(m.ncst)+'</b>'+
        (m.il?' · '+escapeHTML(m.il):'')+(m.adres?'<br>'+escapeHTML(m.adres):'')+'</div>'+
      '<div class="field"><label>Yetkili adı soyadı *</label>'+
        '<input type="text" id="lkkAd" style="'+_LEAD_INP+'"></div>'+
      '<div class="field"><label>Görev / unvan</label>'+
        '<input type="text" id="lkkGorev" placeholder="Örn: Satın Alma Müdürü" style="'+_LEAD_INP+'"></div>'+
      '<div class="field"><label>Telefon *</label>'+
        '<input type="tel" id="lkkTel" placeholder="5XXXXXXXXX" style="'+_LEAD_INP+'"></div>'+
      '<div class="field"><label>E-posta</label>'+
        '<input type="email" id="lkkEmail" style="'+_LEAD_INP+'"></div>'+
      '<button class="btn" style="width:100%;background:var(--green);color:#04301f;" onclick="leadKontakKaydet()">💾 Kaydet ve Aramaya Geç</button>'+
      '<button class="btn-iptal" style="margin-top:8px;" onclick="leadKayitKapat()">✕ Vazgeç</button>'+
    '</div>';
}

async function leadKontakKaydet(){
  const A=window._lanket; if(!A) return;
  const ad=_leadDeger('lkkAd'), telHam=_leadDeger('lkkTel');
  if(!ad){ toast('Yetkili adı zorunlu','error'); return; }
  if(!telHam){ toast('Telefon zorunlu','error'); return; }
  // vyTel: js/veriyonetimi.js — proje genelindeki telefon normalizasyonu
  const tel=(typeof vyTel==='function')?vyTel(telHam):telHam;
  if(!tel){ toast('Telefon numarası geçersiz — 5XXXXXXXXX biçiminde girin','error'); return; }

  const payload={
    ncst:A.musteri.ncst, ad_soyad:ad, gorev_unvani:_leadDeger('lkkGorev')||null,
    telefon:tel, email:_leadDeger('lkkEmail')||null,
    musteri_unvani:A.musteri.unvan||null, kontak_tipi:'Lead', dogrulandi:false
  };
  const {data:yeni, error}=await sb.from('contacts').insert(payload).select('contact_id').single();
  if(error){ toast('Kontak kaydedilemedi: '+error.message,'error'); return; }

  A.kontak={contact_id:yeni.contact_id, ad_soyad:ad, telefon:tel};
  A.telefon=tel;
  A.kontaklar=(A.kontaklar||[]).concat([A.kontak]);
  await addLog('contacts', yeni.contact_id, 'Kontak Eklendi (Lead)', A.musteri.ncst+' — '+ad);
  toast('Kontak kaydedildi','success');
  _leadAramaEkraniRender();
}

/* ============================================================
   ARAMA EKRANI + DURUM AĞACI
   ============================================================ */
function _lchips(key, etiket, secenekler){
  const c=window._lanket.c;
  return '<div style="margin-bottom:12px;">'+
    '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;">'+etiket+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:6px;">'+
    secenekler.map(o=>{
      const deger=Array.isArray(o)?o[0]:o, yazi=Array.isArray(o)?o[1]:o;
      const sec=(c[key]===deger);
      return '<div class="chip-btn'+(sec?' selected':'')+'" style="padding:8px 12px;font-size:12px;'+
        (sec?'background:var(--blue);border-color:var(--blue);color:#fff;':'')+'" '+
        'onclick="_lanketSec(\''+key+'\',\''+String(deger).replace(/'/g,"\\'")+'\')">'+escapeHTML(yazi)+'</div>';
    }).join('')+'</div></div>';
}
function _lanketSec(key,val){
  const c=window._lanket.c;
  c[key]=val;
  // üst seçim değişince alt cevaplar temizlenir — yanlış dal kaydedilmesin
  if(key==='ulasildi'){ delete c.durum; delete c.muhatap; delete c.uygun; delete c.sonuc; }
  if(key==='muhatap'){ delete c.durum; delete c.uygun; delete c.sonuc; }
  if(key==='uygun'){ delete c.durum; delete c.sonuc; }
  // V31.182: durum degisince durumun kendi alt alanlari da temizlenir
  // (karar verici alt sorusu, yeni kontak bilgileri) — baska bir dalda
  // doldurulmus bilgi yanlis sonuca yapismasin.
  if(key==='durum'){ delete c.kv; delete c.yeniAd; delete c.yeniTel; }
  _leadAnketRender();
}

/* V31.182 — "Karar verici degil" ust secenegini, alt soruya gore gercek
   kayit koduna cevirir. Diger tum durumlarda kodu oldugu gibi dondurur.
   Hem ekran hem kayit AYNI fonksiyonu kullanir; iki yerde iki mantik olmaz. */
function _leadDurumCoz(c){
  if(c && c.durum==='g_karar_verici_degil'){
    if(c.kv==='E') return 'g_kv_verdi';
    if(c.kv==='H') return 'g_kv_vermedi';
  }
  return c ? c.durum : null;
}
function _lanketMetin(key,val){ window._lanket.c[key]=val; }

function _leadAramaEkraniRender(){
  const el=document.getElementById('leadListesi'); if(!el) return;
  const A=window._lanket, m=A.musteri, k=A.kayit, l=A.liste||{};
  const telGosterim=(typeof _telGoster==='function')?_telGoster(A.telefon):A.telefon;

  el.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+
      '<button class="topbar-back" onclick="leadKayitKapat()" style="position:relative;width:auto;padding:6px 12px;font-size:13px;">← Geri</button>'+
      '<div style="font-size:14px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+
        escapeHTML(m.unvan||m.ncst)+'</div>'+
    '</div>'+

    // künye
    '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">'+
      'NCST: <b>'+escapeHTML(m.ncst)+'</b>'+
      (m.il?' · '+escapeHTML(m.il):'')+(m.sektor?' · '+escapeHTML(m.sektor):'')+
      (m.toplam_hat!=null?' · hat: '+m.toplam_hat:'')+
      (k.deneme_sayisi?' · '+(k.deneme_sayisi+1)+'. deneme':'')+
    '</div>'+

    // telefon kutusu
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;margin-bottom:10px;">'+
      '<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">'+
        escapeHTML((A.kontak&&A.kontak.ad_soyad)||'Kontak')+
        ((A.kontak&&A.kontak.gorev_unvani)?' · '+escapeHTML(A.kontak.gorev_unvani):'')+'</div>'+
      '<div style="font-size:24px;font-weight:800;letter-spacing:1px;color:var(--text);">'+escapeHTML(telGosterim||'—')+'</div>'+
      '<button class="btn btn-sm btn-ghost" style="width:auto;padding:6px 14px;margin-top:8px;" onclick="leadTelKopyala()">📋 Kopyala</button>'+
      (A.kontaklar&&A.kontaklar.length>1
        ? '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">'+
          A.kontaklar.filter(x=>x.telefon).map((x,i)=>
            '<div class="chip-btn'+((A.kontak&&A.kontak.contact_id===x.contact_id)?' selected':'')+'" '+
            'style="padding:5px 10px;font-size:11px;" onclick="leadKontakSec('+i+')">'+
            escapeHTML(x.ad_soyad||'Kontak '+(i+1))+'</div>').join('')+'</div>'
        : '')+
    '</div>'+

    // konuşma metni
    (l.konusma_metni
      ? '<div style="margin-bottom:10px;">'+
        '<div class="chip-btn" style="width:100%;text-align:left;padding:9px 12px;font-size:12px;" onclick="leadMetinToggle()">'+
          '💬 Konuşma metni (aç/kapat)</div>'+
        '<div id="leadMetinKutu" style="display:none;background:var(--navy3);border:1px solid var(--border);'+
          'border-radius:8px;padding:11px;font-size:12px;color:var(--text2);white-space:pre-wrap;margin-top:6px;">'+
          escapeHTML(l.konusma_metni)+'</div></div>'
      : '')+

    // V31.179: arama oncesi musteri ozeti — portfoy sahibi, son ziyaret,
    // acik firsat, son teyit aramasi + acilir gecmis listeleri.
    _leadMusteriOzetHTML()+
    '<div id="leadGecmis" style="margin-bottom:10px;"></div>'+
    '<div class="form-section"><div id="leadAnketGovde"></div></div>';

  _leadAnketRender();
  _leadGecmisYukle();
}

function leadMetinToggle(){
  const e=document.getElementById('leadMetinKutu');
  if(e) e.style.display = (e.style.display==='none') ? '' : 'none';
}
function leadTelKopyala(){
  const A=window._lanket; if(!A||!A.telefon) return;
  try{ navigator.clipboard.writeText(A.telefon); toast('Telefon kopyalandı','success'); }
  catch(e){ toast('Kopyalanamadı — elle seçin','error'); }
}
function leadKontakSec(i){
  const A=window._lanket; if(!A) return;
  const telli=A.kontaklar.filter(x=>x.telefon);
  if(!telli[i]) return;
  A.kontak=telli[i]; A.telefon=telli[i].telefon;
  _leadAramaEkraniRender();
}

async function _leadGecmisYukle(){
  const box=document.getElementById('leadGecmis'); if(!box) return;
  const A=window._lanket; if(!A) return;
  const {data:gecmis}=await sb.from(LEAD_TABLO_ARAMA)
    .select('deneme_no,durum,agent_id,olusturma,agent_notu,olusan_task_id')
    .eq('kayit_id',A.kayit.kayit_id).order('olusturma',{ascending:false}).limit(10);
  if(!gecmis||!gecmis.length){ box.innerHTML=''; return; }
  // V31.181: bu aramalardan dogan gorevlerin GUNCEL durumu
  const gMap=await _leadGorevHaritasi(gecmis.map(g=>g.olusan_task_id));
  box.innerHTML='<div style="font-size:11px;color:var(--text3);margin-bottom:5px;">Önceki aramalar</div>'+
    gecmis.map(g=>{
      const d=LEAD_DURUM[g.durum]||{et:g.durum};
      const ad=_leadMyAd(g.agent_id,'')||'';
      return '<div style="padding:6px 9px;background:var(--navy3);border-radius:6px;margin-bottom:4px;font-size:11px;">'+
        '<b>'+g.deneme_no+'.</b> '+escapeHTML(d.et)+
        ' <span style="color:var(--text3);">· '+_leadTarih(g.olusturma)+(ad?' · '+escapeHTML(ad):'')+'</span>'+
        (g.agent_notu?'<div style="color:var(--text2);margin-top:2px;">'+escapeHTML(g.agent_notu)+'</div>':'')+
        (g.olusan_task_id&&gMap[g.olusan_task_id]
          ?'<div style="margin-top:3px;">'+_leadGorevRozeti(gMap[g.olusan_task_id])+'</div>':'')+
        '</div>';
    }).join('');
}

/* ---------------------------------------------------------------- durum ağacı */
function _leadAnketRender(){
  const g=document.getElementById('leadAnketGovde'); if(!g) return;
  const c=window._lanket.c;
  let h='';

  h+=_lchips('ulasildi','Ulaşıldı mı?',[['E','Evet'],['H','Hayır']]);

  if(c.ulasildi==='H'){
    h+=_lchips('durum','Ulaşılamama nedeni',[
      ['ul_cevapsiz','Cevapsız'],['ul_mesgul','Meşgule atıyor'],['ul_kapali','Telefon kapalı'],
      ['ul_santral','Santralden geçilemedi'],['ul_faks','Faks / sesli yanıt'],
      ['ul_hat_yok','Hat hizmet dışı'],['ul_yanlis_numara','Yanlış numara']]);
  }

  if(c.ulasildi==='E'){
    h+=_lchips('muhatap','Doğru muhatap mı?',[['E','Evet'],['H','Hayır']]);

    if(c.muhatap==='H'){
      h+=_lchips('durum','Durum',[
        ['g_yanlis_numara','Yanlış / hatalı numara'],
        ['g_yonlendirdi','Doğru kişiye yönlendirdi'],
        ['g_firma_kapandi','Firma kapanmış / faaliyeti yok']]);
      if(c.durum==='g_firma_kapandi'){
        h+='<div style="background:rgba(224,4,42,.1);border:1px solid rgba(224,4,42,.35);border-radius:8px;padding:9px 11px;margin-bottom:12px;font-size:12px;color:var(--text2);">'+
           'Müşteri <b>"Potansiyel Değil"</b> olarak işaretlenecek — saha listelerinden de düşer.</div>';
      }
    }

    if(c.muhatap==='E'){
      h+=_lchips('uygun','Görüşmeye uygun mu?',[['E','Evet'],['H','Hayır']]);

      if(c.uygun==='H'){
        h+=_lchips('durum','Durum',[
          ['g_musait_degil','Müsait değil, tekrar aranacak'],
          ['g_aranmak_istemiyor','Aranmak istemiyor']]);
        if(c.durum==='g_aranmak_istemiyor'){
          h+='<div style="background:rgba(224,4,42,.12);border:1px solid var(--red);border-radius:8px;padding:9px 11px;margin-bottom:12px;font-size:12px;color:var(--red);">'+
             '⛔ Bu kontak <b>bir daha aranmak istemiyor</b> olarak işaretlenecek. Sonraki listelerde otomatik elenecek.</div>';
        }
      }

      if(c.uygun==='E'){
        h+=_lchips('durum','Bilgi verildi — sonuç',[
          ['g_siparis_istiyor','Sipariş vermek istiyor'],
          ['g_detay_istiyor','Detay bilgi istiyor'],
          ['g_randevu','Randevu istiyor'],
          ['g_ilgilenmedi','İlgilenmedi'],
          ['g_rakip_sozlesme','Rakipte, sözleşmesi var'],
          ['g_fiyat_uyusmadi','Fiyat uyuşmadı'],
          ['g_karar_verici_degil','Karar verici değil'],
          ['g_sikayet','Şikayet iletti'],
          ['g_talep','Müşteri talebi'],
          ['g_dil_sorunu','Dil / iletişim sorunu']]);

        // V31.182: "Karar verici degil" secilince takvim DEGIL, alt soru acilir.
        if(c.durum==='g_karar_verici_degil'){
          h+=_lchips('kv','Karar vericinin bilgisini verdi mi?',
                     [['E','Evet, verdi'],['H','Hayır, vermedi']]);
        }
      }
    }
  }

  // V31.182: ekrandaki sonuc, alt sorulara gore cozulmus koddur.
  const etkinDurum=_leadDurumCoz(c);
  const d=LEAD_DURUM[etkinDurum]||{};

  // yeni kontak kutusu — hem "dogru kisiye yonlendirdi" hem "karar vericiyi
  // verdi" icin ayni kutu. (V31.182'de tek yere toplandi.)
  if(d.yeniKontak){
    const kv=(etkinDurum==='g_kv_verdi');
    h+='<div style="background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.35);border-radius:8px;padding:10px;margin-bottom:12px;">'+
       '<div style="font-size:12px;font-weight:700;margin-bottom:7px;">'+
         (kv?'Karar verici bilgisi':'Yeni kontak bilgisi')+'</div>'+
       '<div class="field"><label>Ad soyad *</label><input type="text" id="lyAd" value="'+escapeHTML(c.yeniAd||'')+'" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'yeniAd\',this.value)"></div>'+
       '<div class="field" style="margin-bottom:0;"><label>Telefon'+(d.telZorunlu?' *':'')+'</label>'+
         '<input type="tel" id="lyTel" value="'+escapeHTML(c.yeniTel||'')+'" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'yeniTel\',this.value)"></div>'+
       '<div style="font-size:11px;color:var(--text3);margin-top:7px;">'+
         'Kaydedilince kontak eklenir ve müşteri <b>Henüz Aranmadı</b> kuyruğuna döner'+
         (kv?' — bu kez karar verici aranacak.':'.')+'</div>'+
       '</div>';
  }

  // karar vericiyi vermedi → görüşme kapanıyor, uyarı
  if(etkinDurum==='g_kv_vermedi'){
    h+='<div style="background:rgba(224,4,42,.1);border:1px solid rgba(224,4,42,.35);border-radius:8px;'+
       'padding:9px 11px;margin-bottom:12px;font-size:12px;color:var(--text2);">'+
       '⛔ Karar vericiye ulaşma yolu yok — <b>görüşme kapanıyor</b>. '+
       'Kayıt <b>Tamamlanan</b> kutusuna, analizde <b>olumsuz</b> olarak düşer. Tekrar arama açılmaz.</div>';
  }

  // satış bilgileri
  if(d.satis){
    // V31.179 FIX: FALLBACK_PRODUCTS bir DIZI — [{cat, items:[{n,t,product_id}]}]
    // ve loadProductsFromDB() giriste products tablosundan tazeliyor. Onceki
    // surumde Object.keys() ile indeks (0..7) basiliyordu. Artik kategori
    // basliklariyla (optgroup) gercek urun agaci geliyor.
    h+='<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.35);border-radius:8px;padding:11px;margin-bottom:12px;">'+
      '<div style="font-size:12px;font-weight:700;margin-bottom:8px;">Satış bilgileri</div>'+
      '<div class="field"><label>Ürün</label><select id="lsUrun" style="'+_LEAD_INP+'" onchange="_leadUrunSec(this.value)">'+
        '<option value="">— Seçin —</option>'+_leadUrunSecenekleriHTML(c.urun_deger)+
        '</select></div>'+
      '<div class="field"><label>Cihaz marka / model (serbest)</label>'+
        '<input type="text" id="lsCihaz" value="'+escapeHTML(c.cihaz||'')+'" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'cihaz\',this.value)"></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'+
        '<div class="field"><label>Adet</label><input type="number" id="lsAdet" min="1" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'adet\',this.value)"></div>'+
        '<div class="field"><label>Tahmini ciro (₺)</label><input type="number" id="lsCiro" min="0" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'ciro\',this.value)"></div>'+
      '</div>'+
      _lchips('ilgi','İlgi seviyesi',[['1','1'],['2','2'],['3','3'],['4','4'],['5','5']])+
      '</div>';
  }

  // rakip sözleşme bitişi
  if(d.sozlesme){
    h+='<div class="field" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.35);border-radius:8px;padding:11px;margin-bottom:12px;">'+
      '<label>Rakip sözleşmesi bitiş tarihi</label>'+
      '<input type="date" id="lsSozlesme" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'sozlesme_bitis\',this.value)">'+
      '<div style="font-size:11px;color:var(--text3);margin-top:6px;">'+
        'Girilirse bitişten <b>60 gün önce</b> müşteri otomatik "Tekrar Aranacak"a düşer.</div></div>';
  }

  // randevu tarihi
  if(d.randevu){
    h+='<div class="field" style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.35);border-radius:8px;padding:11px;margin-bottom:12px;">'+
      '<label>Randevu tarihi / saati</label>'+
      '<input type="datetime-local" id="lsRandevu" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'randevu\',this.value)">'+
      '<div style="font-size:11px;color:var(--text3);margin-top:6px;">Portföy sahibi MY\'ye görev kartı açılacak.</div></div>';
  }

  // tekrar arama tarihi
  if(d.tekrar){
    h+='<div class="field"><label>Ne zaman tekrar aranacak'+(d.tekrarZorunlu?' *':'')+'</label>'+
      '<input type="datetime-local" id="lsTekrar" style="'+_LEAD_INP+'" oninput="_lanketMetin(\'tekrar_tarih\',this.value)"></div>';
  }

  // görev kartı bilgisi
  if(d.gorev){
    h+='<div style="background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.35);border-radius:8px;'+
      'padding:9px 11px;margin-bottom:12px;font-size:12px;color:var(--text2);">'+
      '📋 <b>Lead Satış Fırsatı</b> görev kartı açılacak ve portföy sahibi MY\'ye atanacak. '+
      'Fırsat kaydını MY, ziyaret formunu doldurarak açacak.</div>';
  }
  if(d.sikayet||d.talep){
    const et=d.sikayet?'Şikayet':'Talep';
    h+='<div class="field"><label>'+et+' metni *</label>'+
      '<textarea id="lsSikayet" rows="3" oninput="_lanketMetin(\'sikayet_metni\',this.value)"></textarea></div>'+
      '<div style="background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.35);border-radius:8px;'+
        'padding:9px 11px;margin-bottom:12px;font-size:12px;color:var(--text2);">'+
        '📋 <b>'+escapeHTML(d.gorevTipi)+'</b> görev kaydı açılacak — '+
        (d.hedefZinciri
          ? 'müşterinin MY\'sinin <b>takım liderine</b>, yoksa KÇM/operasyon <b>müdürüne</b>.'
          : 'müşterinin <b>portföy sahibi MY</b>\'sine.')+
        ' Görev durumunu bu ekrandan takip edebilir, Görevler ekranından kapatabilirsin.</div>';
  }

  // not + kaydet
  // V31.182: d.kvParent → alt soru henuz cevaplanmamis; Kaydet gosterilmez.
  if(etkinDurum && d.et && !d.kvParent){
    h+='<div class="field"><label>Agent notu</label>'+
      '<textarea id="lsNot" rows="2" oninput="_lanketMetin(\'agent_notu\',this.value)"></textarea></div>'+
      '<div style="background:var(--navy3);border-radius:8px;padding:9px 11px;font-size:12px;margin-bottom:10px;">'+
        'Kaydedilecek sonuç: <b>'+escapeHTML(d.et||etkinDurum)+'</b>'+
        '<div style="font-size:11px;color:var(--text3);margin-top:3px;">Kutu: '+
          (LEAD_SEKME_ETIKET[d.grup]||d.grup)+(d.sonuc?' · analiz: '+d.sonuc:'')+'</div></div>'+
      '<button class="btn" style="width:100%;background:var(--green);color:#04301f;" onclick="leadAramaKaydet()">✓ Kaydet</button>';
  }
  // V31.185: Vazgeç ikiye bölündü. Sol taraf "aramadan tamamla" — görüşme
  // yapılmadan kayıt kapatılır, neden ve alt açıklama sorulur.
  h+='<div style="display:flex;gap:8px;margin-top:8px;">'+
       '<button class="btn" style="flex:1;background:#2a1f05;border:1.5px solid var(--amber);color:#fff;" '+
         'onclick="leadAramadanTamamlaAc()">📵 Aramadan Tamamla</button>'+
       '<button class="btn-iptal" style="flex:1;margin-top:0;" onclick="leadKayitKapat()">✕ Vazgeç</button>'+
     '</div>';
  g.innerHTML=h;
}

/* ============================================================
   V31.185 — ARAMADAN TAMAMLA
   Agent müşteriyi hiç aramadan kaydı kapatır. Arama izi (lead_arama) YİNE
   yazılır: kimin, ne zaman, hangi gerekçeyle kapattığı kaybolmaz.
   ============================================================ */
/* V31.186 — iki yerden çağrılır:
     • kuyruk kartından  → leadAramadanTamamlaAc(kayitId)  (arama ekranı açılmaz)
     • arama ekranından  → leadAramadanTamamlaAc()         (window._lanket'ten)
   Hedef tek bir state'te toplanır ki kaydetme tarafı iki yol bilmesin. */
async function leadAramadanTamamlaAc(kayitId){
  let hedef=null;
  if(kayitId){
    const {data:k}=await sb.from(LEAD_TABLO_KAYIT).select('*').eq('kayit_id',kayitId).maybeSingle();
    if(!k){ toast('Kayıt bulunamadı','error'); return _leadAgentKuyruk(); }
    hedef={kayit:k, liste:LEAD.aktifListe, telefon:null, kontak:null, kuyruktan:true};
  }else{
    const A=window._lanket;
    if(!A || !A.kayit){ toast('Kayıt bulunamadı','error'); return; }
    hedef={kayit:A.kayit, liste:A.liste, telefon:A.telefon, kontak:A.kontak, kuyruktan:false};
  }
  window._leadAramasizHedef=hedef;
  window._leadAramasizNeden=null;
  const box=document.getElementById('leadAramadanTamamlaNedenler');
  if(box) box.innerHTML=LEAD_ARAMASIZ_NEDEN.map(n=>
    '<div class="sonuc-item" onclick="_leadAramasizSec(this,\''+n.kod+'\')">'+escapeHTML(n.et)+'</div>').join('');
  const not=document.getElementById('leadAramadanTamamlaNot'); if(not) not.value='';
  const lbl=document.getElementById('leadAramadanTamamlaNotLabel');
  if(lbl) lbl.textContent='Alt açıklama (opsiyonel)';
  openModal('leadAramadanTamamlaModal');
}

function _leadAramasizSec(el, kod){
  document.querySelectorAll('#leadAramadanTamamlaNedenler .sonuc-item').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  window._leadAramasizNeden=kod;
  // "Diğer" seçildiyse açıklama zorunlu — yoksa neden hiç anlaşılmaz.
  const lbl=document.getElementById('leadAramadanTamamlaNotLabel');
  if(lbl) lbl.textContent=(kod==='k_diger') ? 'Alt açıklama *' : 'Alt açıklama (opsiyonel)';
}

async function leadAramadanTamamlaKaydet(){
  const A=window._leadAramasizHedef; if(!A || !A.kayit) return;
  const kod=window._leadAramasizNeden;
  if(!kod){ toast('Bir neden seçin','error'); return; }
  const d=LEAD_DURUM[kod]; if(!d){ toast('Neden tanınmadı','error'); return; }
  const not=(document.getElementById('leadAramadanTamamlaNot')?.value||'').trim();
  if(kod==='k_diger' && !not){ toast('"Diğer" için alt açıklama zorunlu','error'); return; }

  const k=A.kayit, simdi=new Date().toISOString();

  // 1) ARAMA İZİ — görüşme yok ama kapatma kaydı var
  const {error:aErr}=await sb.from(LEAD_TABLO_ARAMA).insert({
    kayit_id:k.kayit_id, liste_id:k.liste_id, ncst:k.ncst,
    liste_adi:(A.liste&&A.liste.ad)||null,
    agent_id:currentUser.my_id, deneme_no:(k.deneme_sayisi||0)+1,
    baslangic:simdi, bitis:simdi, sure_sn:0,
    telefon:A.telefon||null, contact_id:(A.kontak&&A.kontak.contact_id)||null,
    durum:kod, ulasildi:false,
    ulasilamama_neden:d.et,
    agent_notu:not||null
  });
  if(aErr){ toast('Kaydedilemedi: '+aErr.message,'error'); return; }

  // 2) KAYIT KAPANIR — tekrar kuyruğa düşmez
  const {error:kErr}=await sb.from(LEAD_TABLO_KAYIT).update({
    durum:kod, durum_grubu:d.grup, sonuc_grubu:d.sonuc||null,
    deneme_sayisi:(k.deneme_sayisi||0)+1, son_arama:simdi, sonraki_arama:null,
    kilit_agent_id:null, kilit_zaman:null, guncelleme:simdi
  }).eq('kayit_id',k.kayit_id);
  if(kErr){ toast('Kayıt güncellenemedi: '+kErr.message,'error'); return; }

  // 3) "Aranmak istemiyor" ise kontak da işaretlenir — sonraki listelerde elenir.
  //    Arama ekranından gelindiyse konuşulan KİŞİ işaretlenir.
  //    Kuyruktan gelindiyse kimseyle konuşulmamıştır; talep firmaya aittir,
  //    bu yüzden o NCST'nin tüm kontakları işaretlenir.
  let isaretNotu='';
  if(d.istemiyor){
    if(!A.kuyruktan && A.kontak && A.kontak.contact_id){
      const {error}=await sb.from('contacts').update({aranmak_istemiyor:true}).eq('contact_id',A.kontak.contact_id);
      if(error) console.warn('[lead] aranmak_istemiyor yazilamadi:', error);
      else isaretNotu=' · kontak işaretlendi';
    }else{
      const {data:kon, error}=await sb.from('contacts').update({aranmak_istemiyor:true})
        .eq('ncst',k.ncst).select('contact_id');
      if(error) console.warn('[lead] aranmak_istemiyor (ncst) yazilamadi:', error);
      else isaretNotu=' · '+((kon&&kon.length)||0)+' kontak işaretlendi';
    }
  }

  await addLog(LEAD_TABLO_KAYIT, k.kayit_id, 'Aramadan Tamamlandı', d.et+(not?' · '+not:'')+isaretNotu);
  toast('Aramadan tamamlandı'+isaretNotu,'success');
  closeModal('leadAramadanTamamlaModal');
  window._lanket=null;
  window._leadAramasizHedef=null;
  window._leadAramasizNeden=null;
  _leadAgentKuyruk();
}

/* ---------------------------------------------------------------- kaydet */
async function leadAramaKaydet(){
  const A=window._lanket; if(!A) return;
  // V31.182: ekranda gosterilen kodun AYNISI kaydedilir (_leadDurumCoz).
  const c=A.c, etkinDurum=_leadDurumCoz(c), d=LEAD_DURUM[etkinDurum];
  if(!etkinDurum||!d){ toast('Sonuç seçin','error'); return; }
  if(d.kvParent){ toast('Karar vericinin bilgisini verdi mi — seçin','error'); return; }
  if(d.tekrarZorunlu && !c.tekrar_tarih){ toast('Tekrar arama tarihi zorunlu','error'); return; }
  if((d.sikayet||d.talep) && !(c.sikayet_metni||'').trim()){
    toast((d.sikayet?'Şikayet':'Talep')+' metni zorunlu','error'); return; }
  if(d.yeniKontak && !(c.yeniAd||'').trim()){
    toast((etkinDurum==='g_kv_verdi'?'Karar vericinin adı':'Yeni kontak adı')+' zorunlu','error'); return; }
  if(d.telZorunlu && !(c.yeniTel||'').trim()){
    toast('Karar vericinin telefonu zorunlu — telefon yoksa "Hayır, vermedi" seçin','error'); return; }

  const k=A.kayit, m=A.musteri, simdi=new Date().toISOString();
  const sureSn=Math.max(1, Math.round((Date.now()-A.baslangic)/1000));

  // 1) ARAMA SATIRI — değiştirilemez iz
  const arama={
    kayit_id:k.kayit_id, liste_id:k.liste_id, ncst:k.ncst,
    // V31.183: liste adinin anlik kopyasi. Liste sonradan silinse de
    // raporda hangi kampanyada arandigi okunur kalir (LEAD_02 kolonu).
    liste_adi:(A.liste&&A.liste.ad)||null,
    agent_id:currentUser.my_id, deneme_no:(k.deneme_sayisi||0)+1,
    baslangic:new Date(A.baslangic).toISOString(), bitis:simdi, sure_sn:sureSn,
    telefon:A.telefon||null, contact_id:(A.kontak&&A.kontak.contact_id)||null,
    durum:etkinDurum, ulasildi:(c.ulasildi==='E'),
    ulasilamama_neden:(c.ulasildi==='H')?d.et:null,
    muhatap_dogru:(c.muhatap==null)?null:(c.muhatap==='E'),
    urun_id:c.urun_id||null, urun_tipi:c.urun_tipi||null, cihaz_marka_model:c.cihaz||null,
    adet:c.adet?parseInt(c.adet):null,
    tahmini_ciro:c.ciro?parseFloat(c.ciro):null,
    ilgi_seviyesi:c.ilgi?parseInt(c.ilgi):null,
    rakip_sozlesme_bitis:c.sozlesme_bitis||null,
    randevu_tarihi:c.randevu?new Date(c.randevu).toISOString():null,
    agent_notu:c.agent_notu||null
  };

  // 2) GÖREV KARTI (fırsat kaydı DEĞİL)
  let gorevId=null;
  if(d.gorev){
    gorevId=await _leadGorevAc(A, d);
    arama.olusan_task_id=gorevId;
  }
  if(d.sikayet||d.talep){
    const sid=await _leadGorevAc(A, d, d.gorevTipi);
    if(sid) arama.olusan_task_id=sid;
  }

  // 3) yeni kontak (yönlendirme)
  if(d.yeniKontak){
    const tel=(typeof vyTel==='function')?vyTel(c.yeniTel||''):(c.yeniTel||'');
    const {data:yk, error:ykErr}=await sb.from('contacts').insert({
      ncst:k.ncst, ad_soyad:(c.yeniAd||'').trim(), telefon:tel||null,
      musteri_unvani:m.unvan||null, kontak_tipi:'Lead', dogrulandi:false
    }).select('contact_id').single();
    if(ykErr) console.warn('[lead] yeni kontak yazilamadi:', ykErr);
    else arama.yeni_contact_id=yk.contact_id;
  }

  const {error:aErr}=await sb.from(LEAD_TABLO_ARAMA).insert(arama);
  if(aErr){ toast('Arama kaydedilemedi: '+aErr.message,'error'); return; }

  // 4) KAYIT GÜNCELLE
  const guncel={
    durum:etkinDurum, durum_grubu:d.grup, sonuc_grubu:d.sonuc||null,
    deneme_sayisi:(k.deneme_sayisi||0)+1, son_arama:simdi,
    sonraki_arama:c.tekrar_tarih?new Date(c.tekrar_tarih).toISOString():null,
    rakip_sozlesme_bitis:c.sozlesme_bitis||k.rakip_sozlesme_bitis||null,
    kilit_agent_id:null, kilit_zaman:null, guncelleme:simdi
  };
  // yönlendirme: kayıt yeniden kuyruğa, deneme sayacı korunur
  if(d.yeniKontak){ guncel.durum_grubu='yeni'; guncel.durum='henuz_aranmadi'; }
  const {error:kErr}=await sb.from(LEAD_TABLO_KAYIT).update(guncel).eq('kayit_id',k.kayit_id);
  if(kErr){ toast('Kayıt güncellenemedi: '+kErr.message,'error'); return; }

  // 5) YAN ETKİLER
  if(d.istemiyor && A.kontak && A.kontak.contact_id){
    const {error}=await sb.from('contacts').update({aranmak_istemiyor:true}).eq('contact_id',A.kontak.contact_id);
    if(error) console.warn('[lead] aranmak_istemiyor yazilamadi:', error);
  }
  if(d.potansiyelYok){
    const {error}=await sb.from('customers').update({
      ziyaret_potansiyeli_yok:true,
      ziyaret_potansiyeli_yok_nedeni:'Lead araması: firma kapanmış / faaliyeti yok'
    }).eq('ncst',k.ncst);
    if(error) console.warn('[lead] potansiyel yok yazilamadi:', error);
  }

  await addLog(LEAD_TABLO_KAYIT, k.kayit_id, 'Lead Araması', d.et+(gorevId?' · görev #'+gorevId:''));
  toast(d.et+' — kaydedildi'+(gorevId?' · görev kartı açıldı':''),'success');
  window._lanket=null;
  _leadAgentKuyruk();
}

/* Görev kartı açar. Atanan: müşterinin portföy sahibi MY; yoksa agent'ın
   kendisi (görev kaybolmasın) ve açıklamaya not düşülür. */
async function _leadGorevAc(A, d, tipAdiZorla){
  const tipAdi=tipAdiZorla||LEAD_GOREV_TIPI;
  const {data:tt}=await sb.from('task_types').select('type_id').eq('tip_adi',tipAdi).maybeSingle();
  if(!tt||!tt.type_id){ toast('Görev tipi bulunamadı: '+tipAdi,'error'); return null; }

  const c=A.c, m=A.musteri, l=A.liste||{};
  let atananId=m.my_id||null, atamaNotu='', kaynak='portföy sahibi MY';

  // V31.181: SIKAYET -> teyit aramasindaki hedef zinciri (takim lideri ->
  // KCM muduru -> operasyon muduru). arama.js:_sikayetTalepHedefBul tek
  // kaynak; burada kopyalanmiyor. arama.js, lead.js'ten ONCE yuklenir.
  if(d.hedefZinciri && m.my_id){
    try{
      const hedef=await _sikayetTalepHedefBul(m.my_id);
      if(hedef && hedef.atananId){ atananId=hedef.atananId; kaynak=hedef.kaynak; }
      else if(hedef && hedef.hata){ atamaNotu='\n⚠ Hedef bulunamadı ('+hedef.hata+') — görev portföy sahibine açıldı.'; }
    }catch(e){ console.warn('[lead] hedef zinciri calismadi:', e); }
  }
  if(!atananId){ atananId=currentUser.my_id; kaynak='agent (portföy sahibi yok)';
    atamaNotu='\n⚠ Portföy sahibi atanmamış — görev agent üzerinde kaldı, yönlendirilmeli.'; }

  const satirlar=[
    'LEAD ARAMASI — '+(l.ad||'liste'),
    'Müşteri: '+(m.unvan||m.ncst)+' (NCST '+m.ncst+')'+(m.il?' · '+m.il:''),
    'Sonuç: '+d.et,
    'Kontak: '+((A.kontak&&A.kontak.ad_soyad)||'—')+
      ((A.kontak&&A.kontak.gorev_unvani)?' ('+A.kontak.gorev_unvani+')':'')+
      ' · '+(A.telefon||'—'),
    c.urun_tipi?('Ürün tipi: '+c.urun_tipi):'',
    c.cihaz?('Cihaz: '+c.cihaz):'',
    (c.adet||c.ciro)?('Adet: '+(c.adet||'—')+' · Tahmini ciro: '+(c.ciro?fmtTL(parseFloat(c.ciro)):'—')):'',
    c.ilgi?('İlgi seviyesi: '+c.ilgi+'/5'):'',
    c.randevu?('RANDEVU: '+_leadTarih(new Date(c.randevu).toISOString())):'',
    c.sozlesme_bitis?('Rakip sözleşme bitişi: '+c.sozlesme_bitis):'',
    c.sikayet_metni?((d.sikayet?'Şikayet: ':d.talep?'Talep: ':'Not: ')+c.sikayet_metni):'',
    c.agent_notu?('Agent notu: '+c.agent_notu):'',
    'Atandı: '+_leadMyAd(atananId)+' ('+kaynak+')',
    'Arayan: '+currentUser.ad_soyad+' · '+new Date().toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})
  ].filter(Boolean);

  const deadline = c.randevu
    ? String(c.randevu).slice(0,10)
    : ((typeof _isGunuEkle==='function')?_isGunuEkle(3):null);

  const {data:gorev, error}=await sb.from('tasks').insert({
    type_id:tt.type_id,
    baslik:(tipAdiZorla||'Lead Fırsatı')+' — '+(m.unvan||m.ncst),
    aciklama:satirlar.join('\n')+atamaNotu,
    ncst:m.ncst, atayan_id:currentUser.my_id, atanan_id:atananId,
    durum:'Atandı', baslama_tarihi:new Date().toISOString(),
    olusturma_tarihi:new Date().toISOString(), guncelleme_tarihi:new Date().toISOString(),
    deadline
  }).select('task_id').single();
  if(error){ toast('Görev kartı açılamadı: '+error.message,'error'); return null; }

  try{
    await sb.from('task_logs').insert({
      task_id:gorev.task_id, user_id:currentUser.my_id, user_ad:currentUser.ad_soyad,
      aksiyon:'Oluşturuldu', detay:'Lead aramasından oluşturuldu — '+d.et
    });
  }catch(e){ /* log yazılamazsa görev yine duruyor */ }
  return gorev.task_id;
}

/* ============================================================
   ÇAĞRI ANALİZİ (ilk sürüm)
   ============================================================ */
async function loadLeadAnaliz(){
  const box=document.getElementById('leadKuyruk'); if(!box) return;
  const l=LEAD.aktifListe; if(!l) return;
  box.innerHTML='<div class="loader"><div class="spinner"></div></div>';

  const {data:aramalar, error}=await sb.from(LEAD_TABLO_ARAMA)
    .select('agent_id,durum,ulasildi,sure_sn,olusturma,olusan_task_id,tahmini_ciro,urun_tipi')
    .eq('liste_id',l.liste_id).limit(20000);
  if(error){ box.innerHTML='<div class="empty" style="color:var(--red);">Analiz okunamadı: '+escapeHTML(error.message)+'</div>'; return; }
  const A=aramalar||[];
  if(!A.length){ box.innerHTML='<div class="empty">Bu listede henüz arama yapılmadı.</div>'; return; }

  const ulasilan=A.filter(a=>a.ulasildi).length;
  const olumlu=A.filter(a=>{const d=LEAD_DURUM[a.durum]; return d&&d.sonuc==='olumlu';}).length;
  const gorev=A.filter(a=>a.olusan_task_id).length;
  const ciro=A.reduce((s,a)=>s+(parseFloat(a.tahmini_ciro)||0),0);
  const ortSure=Math.round(A.reduce((s,a)=>s+(a.sure_sn||0),0)/A.length);

  // agent bazlı
  const ag={};
  A.forEach(a=>{
    const g=ag[a.agent_id]=ag[a.agent_id]||{arama:0,ulasildi:0,olumlu:0,gorev:0,sure:0};
    g.arama++; if(a.ulasildi) g.ulasildi++;
    const d=LEAD_DURUM[a.durum]; if(d&&d.sonuc==='olumlu') g.olumlu++;
    if(a.olusan_task_id) g.gorev++;
    g.sure+=(a.sure_sn||0);
  });

  // red nedenleri
  const red={};
  A.forEach(a=>{
    const d=LEAD_DURUM[a.durum];
    if(d&&(d.sonuc==='olumsuz'||d.sonuc==='istemiyor')) red[d.et]=(red[d.et]||0)+1;
  });

  // saat bazlı ulaşma
  const saat={};
  A.forEach(a=>{
    const s=new Date(new Date(a.olusturma).getTime()+3*3600000).getUTCHours();
    const g=saat[s]=saat[s]||{arama:0,ulasildi:0};
    g.arama++; if(a.ulasildi) g.ulasildi++;
  });

  const TH='padding:6px 8px;border:1px solid var(--border);text-align:left;font-size:11px;background:var(--navy3);white-space:nowrap;';
  const TD='padding:6px 8px;border:1px solid var(--border);font-size:12px;';

  let h='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">'+
    '<div class="summary-box"><div class="summary-val lg">'+_leadSayi(A.length)+'</div><div class="summary-label lg">Arama</div></div>'+
    '<div class="summary-box"><div class="summary-val lg" style="color:var(--blue);">%'+Math.round(ulasilan/A.length*100)+'</div><div class="summary-label lg">Ulaşma oranı</div></div>'+
    '<div class="summary-box"><div class="summary-val lg" style="color:var(--green);">%'+Math.round(olumlu/A.length*100)+'</div><div class="summary-label lg">Olumlu oranı</div></div>'+
    '<div class="summary-box"><div class="summary-val lg" style="color:var(--amber);">'+_leadSayi(gorev)+'</div><div class="summary-label lg">Görev kartı</div></div>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--text2);margin-bottom:12px;">'+
      'Toplam tahmini ciro: <b>'+((typeof fmtTL==='function')?fmtTL(ciro):ciro)+'</b> · '+
      'ortalama görüşme: <b>'+ortSure+' sn</b></div>';

  h+='<div class="section-title">Agent bazlı</div>'+
     '<div style="overflow-x:auto;margin-bottom:14px;"><table style="width:100%;border-collapse:collapse;">'+
     '<thead><tr><th style="'+TH+'">Agent</th><th style="'+TH+'">Arama</th><th style="'+TH+'">Ulaşma</th>'+
     '<th style="'+TH+'">Olumlu</th><th style="'+TH+'">Görev</th><th style="'+TH+'">Ort. süre</th></tr></thead><tbody>'+
     Object.keys(ag).map(id=>{
       const g=ag[id], ad=_leadMyAd(id);
       return '<tr><td style="'+TD+'">'+escapeHTML(ad)+'</td>'+
         '<td style="'+TD+'text-align:center;">'+g.arama+'</td>'+
         '<td style="'+TD+'text-align:center;">%'+Math.round(g.ulasildi/g.arama*100)+'</td>'+
         '<td style="'+TD+'text-align:center;color:var(--green);">'+g.olumlu+'</td>'+
         '<td style="'+TD+'text-align:center;">'+g.gorev+'</td>'+
         '<td style="'+TD+'text-align:center;">'+Math.round(g.sure/g.arama)+' sn</td></tr>';
     }).join('')+'</tbody></table></div>';

  const redSirali=Object.keys(red).sort((a,b)=>red[b]-red[a]);
  if(redSirali.length){
    h+='<div class="section-title">Red nedenleri</div>'+
       '<div style="margin-bottom:14px;">'+redSirali.map(n=>
         '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,.05);">'+
         '<span>'+escapeHTML(n)+'</span><b>'+red[n]+'</b></div>').join('')+
       '<div style="font-size:11px;color:var(--text3);margin-top:6px;">'+
         'En sık red nedeni, konuşma metnini düzeltmek için en değerli bilgidir.</div></div>';
  }

  const saatler=Object.keys(saat).map(Number).sort((a,b)=>a-b);
  if(saatler.length){
    h+='<div class="section-title">Saat bazlı ulaşma oranı</div>'+
       '<div style="margin-bottom:10px;">'+saatler.map(s=>{
         const g=saat[s], o=Math.round(g.ulasildi/g.arama*100);
         return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:11px;">'+
           '<span style="width:46px;color:var(--text3);">'+String(s).padStart(2,'0')+':00</span>'+
           '<div style="flex:1;height:10px;background:var(--navy3);border-radius:5px;overflow:hidden;">'+
             '<div style="height:100%;width:'+o+'%;background:var(--blue);"></div></div>'+
           '<span style="width:76px;text-align:right;">%'+o+' ('+g.arama+')</span></div>';
       }).join('')+
       '<div style="font-size:11px;color:var(--text3);">Vardiya planı buna göre ayarlanabilir.</div></div>';
  }

  box.innerHTML=h;
}


/* ============================================================================
   V31.179 — ÜRÜN AĞACI · ARAMA ÖNCESİ MÜŞTERİ ÖZETİ · ARAMA ENGELİ
   ============================================================================ */

/* ---------------------------------------------------------------- ürün ağacı
   FALLBACK_PRODUCTS bir DİZİ: [{cat:'Mobil', items:[{n,t,product_id}]}, ...]
   ve config.js:loadProductsFromDB() girişte products tablosundan tazeliyor.
   Yani buradaki liste her zaman veritabanındaki güncel ürün ağacıdır. */
function _leadUrunSecenekleriHTML(secili){
  const agac=(typeof FALLBACK_PRODUCTS!=='undefined'&&Array.isArray(FALLBACK_PRODUCTS))?FALLBACK_PRODUCTS:[];
  if(!agac.length) return '<option value="" disabled>Ürün ağacı yüklenemedi</option>';
  return agac.map(k=>{
    const items=(k.items||[]).map(u=>{
      const deger=(u.product_id!=null?u.product_id:'')+'|'+u.n;
      return '<option value="'+escapeHTML(deger)+'"'+(secili===deger?' selected':'')+'>'+
             escapeHTML(u.n)+(u.t?(' ('+escapeHTML(u.t)+')'):'')+'</option>';
    }).join('');
    return '<optgroup label="'+escapeHTML(k.cat||'Diğer')+'">'+items+'</optgroup>';
  }).join('');
}

/* V31.183 — liste düzeyinde ÜRÜN GRUBU (kategori) seçimi.
   Agent ekranındaki seçim tek tek ÜRÜN (yukarıdaki fonksiyon); liste düzeyinde
   tek ürün değil, bir odak grubu seçilir: "SOL", "Mobil", "DBS"...
   Kaynak aynı ürün ağacı — elle yazılmış sabit liste YOKTUR. */
function _leadUrunGrupSecenekleriHTML(secili){
  const agac=(typeof FALLBACK_PRODUCTS!=='undefined'&&Array.isArray(FALLBACK_PRODUCTS))?FALLBACK_PRODUCTS:[];
  const gruplar=[];
  agac.forEach(k=>{ const ad=(k&&k.cat)?String(k.cat).trim():''; if(ad&&gruplar.indexOf(ad)<0) gruplar.push(ad); });
  if(!gruplar.length) return '<option value="" disabled>Ürün ağacı yüklenemedi</option>';
  return gruplar.map(g=>
    '<option value="'+escapeHTML(g)+'"'+(secili===g?' selected':'')+'>'+escapeHTML(g)+'</option>'
  ).join('');
}

function _leadUrunSec(deger){
  const c=window._lanket.c;
  c.urun_deger=deger;
  if(!deger){ c.urun_id=null; c.urun_tipi=null; return; }
  const [id,ad]=String(deger).split('|');
  c.urun_id = id ? parseInt(id) : null;
  c.urun_tipi = ad || null;
}

/* ---------------------------------------------------------------- geçmiş yükleme
   Teyit aramasındaki gibi: müşteriye yapılan TEMASLAR (visits) ve
   ZİYARET TEYİT ARAMALARI (arama_sonuclari) arama öncesi ekrana düşer.
   Ayrıca açık fırsat ve portföy sahibi bilgisi — agent körü körüne aramasın. */
async function _leadGecmisTopla(ncst){
  const ozet={ziyaretler:[], teyitler:[], firsatlar:[], acikFirsat:0, acikCiro:0,
              sonZiyaret:null, sonTeyit:null, istemiyorKayit:false};
  try{
    const [{data:vs}, {data:ts}, {data:os}] = await Promise.all([
      sb.from('visits')
        .select('visit_id,tarih_saat,planlanan_tarih,durum,ziyaret_amaci,ziyaret_amaci_detay,urun_gruplari,ziyaret_sonucu,my_id')
        .eq('ncst',ncst).order('tarih_saat',{ascending:false,nullsFirst:false}).limit(10),
      sb.from('arama_sonuclari')
        .select('created_at,ulasildi,ulasilamama_neden,memnuniyet,memnuniyet_ret,sikayet_var,kayit_turu,sikayet_metni,agent_notu,sonra_aranmak_istedi')
        .eq('ncst',ncst).order('created_at',{ascending:false}).limit(10),
      sb.from('opportunities').select('opp_id,adim,durum,beklenen_ciro,olusturma_tarihi,my_id')
        .eq('ncst',ncst).order('olusturma_tarihi',{ascending:false}).limit(20)
    ]);
    ozet.ziyaretler=vs||[];
    ozet.teyitler=ts||[];
    ozet.firsatlar=os||[];
    ozet.sonZiyaret=(ozet.ziyaretler.find(v=>v.durum!=='Planlandı')||ozet.ziyaretler[0])||null;
    ozet.sonTeyit=ozet.teyitler[0]||null;
    ozet.firsatlar.forEach(o=>{
      const a=o.adim||o.durum||'';
      if(!['Gerçekleşen','İptal','Kazanıldı','Kaybedildi'].includes(a)){
        ozet.acikFirsat++; ozet.acikCiro+=(parseFloat(o.beklenen_ciro)||0);
      }
    });
    // Teyit aramasında "sonra aranmak istemedi" denmişse işaretle
    ozet.istemiyorKayit=ozet.teyitler.some(t=>t.sonra_aranmak_istedi===false);
  }catch(e){ console.warn('[lead] gecmis okunamadi:', e); }
  return ozet;
}

/* ---------------------------------------------------------------- özet bloğu */
function _leadMusteriOzetHTML(){
  const A=window._lanket; if(!A) return '';
  const G=A.gecmis||{}, m=A.musteri||{};
  const myAd=_leadMyAd(m.my_id, null);

  const sz=G.sonZiyaret;
  const szGun=sz ? _leadGunFark(sz.tarih_saat||sz.planlanan_tarih) : null;
  const st=G.sonTeyit;

  let uyarilar='';
  if(G.acikFirsat>0){
    uyarilar+='<div style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.45);border-radius:8px;'+
      'padding:8px 10px;font-size:12px;color:var(--amber);margin-bottom:6px;">'+
      '⚠ Bu müşteride <b>'+G.acikFirsat+' açık fırsat</b> var'+
      (G.acikCiro?(' ('+((typeof fmtTL==='function')?fmtTL(G.acikCiro):G.acikCiro)+')'):'')+
      ' — MY zaten görüşüyor olabilir.</div>';
  }
  if(szGun!=null && szGun<=30){
    uyarilar+='<div style="background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.45);border-radius:8px;'+
      'padding:8px 10px;font-size:12px;color:var(--blue);margin-bottom:6px;">'+
      'ℹ '+szGun+' gün önce ziyaret edilmiş'+(myAd?(' ('+escapeHTML(myAd)+')'):'')+' — konuşmayı buna göre kur.</div>';
  }
  if(st && st.sikayet_var===true){
    uyarilar+='<div style="background:rgba(224,4,42,.12);border:1px solid rgba(224,4,42,.45);border-radius:8px;'+
      'padding:8px 10px;font-size:12px;color:var(--red);margin-bottom:6px;">'+
      '⚠ Son teyit aramasında <b>şikayet</b> bildirmiş'+
      (st.sikayet_metni?(': '+escapeHTML(String(st.sikayet_metni).slice(0,120))):'')+'</div>';
  }

  const kunye=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;margin-bottom:8px;">'+
      '<div><span style="color:var(--text3);">Portföy sahibi:</span> <b>'+escapeHTML(myAd||'atanmamış')+'</b></div>'+
      '<div><span style="color:var(--text3);">Toplam hat:</span> <b>'+(m.toplam_hat!=null?m.toplam_hat:'—')+'</b></div>'+
      '<div><span style="color:var(--text3);">Son ziyaret:</span> <b>'+
        (sz?(_leadTarih(sz.tarih_saat||sz.planlanan_tarih)+(szGun!=null?(' ('+szGun+' gün)'):'')):'hiç yok')+'</b></div>'+
      '<div><span style="color:var(--text3);">Teyit araması:</span> <b>'+
        (st?(st.ulasildi?'ulaşıldı':'ulaşılamadı'):'hiç yok')+
        (st&&st.memnuniyet?(' · '+st.memnuniyet+'/10'):'')+'</b></div>'+
    '</div>';

  const ziyaretListesi=(G.ziyaretler||[]).slice(0,5).map(v=>
    '<div style="padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.05);font-size:11px;">'+
      '<b>'+_leadTarih(v.tarih_saat||v.planlanan_tarih)+'</b> · '+escapeHTML(v.durum||'')+
      (v.my_id?(' · '+escapeHTML(_leadMyAd(v.my_id))):'')+
      (v.urun_gruplari?('<div style="color:var(--text2);">'+escapeHTML(v.urun_gruplari)+'</div>'):'')+
      (v.ziyaret_sonucu?('<div style="color:var(--text3);">'+escapeHTML(v.ziyaret_sonucu)+'</div>'):'')+
    '</div>').join('') || '<div style="padding:7px 8px;font-size:11px;color:var(--text3);">Temas kaydı yok.</div>';

  const teyitListesi=(G.teyitler||[]).slice(0,5).map(t=>
    '<div style="padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.05);font-size:11px;">'+
      '<b>'+_leadTarih(t.created_at)+'</b> · '+(t.ulasildi?'ulaşıldı':('ulaşılamadı'+(t.ulasilamama_neden?(' — '+escapeHTML(t.ulasilamama_neden)):'')))+
      (t.memnuniyet?(' · memnuniyet '+t.memnuniyet+'/10'):'')+
      (t.sikayet_var===true?' · <span style="color:var(--red);">şikayet</span>':'')+
      (t.agent_notu?('<div style="color:var(--text2);">'+escapeHTML(String(t.agent_notu).slice(0,140))+'</div>'):'')+
    '</div>').join('') || '<div style="padding:7px 8px;font-size:11px;color:var(--text3);">Teyit araması yok.</div>';

  return uyarilar+
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:11px;margin-bottom:10px;">'+
      kunye+
      '<div class="chip-btn" style="width:100%;text-align:left;padding:7px 10px;font-size:12px;" onclick="leadGecmisToggle()">'+
        '📋 Geçmiş: '+( (G.ziyaretler||[]).length )+' temas · '+( (G.teyitler||[]).length )+' teyit araması (aç/kapat)</div>'+
      '<div id="leadGecmisKutu" style="display:none;margin-top:8px;">'+
        '<div style="font-size:11px;color:var(--text3);margin-bottom:3px;">Temaslar / ziyaretler</div>'+
        '<div style="border:1px solid var(--border);border-radius:8px;max-height:170px;overflow:auto;margin-bottom:8px;">'+ziyaretListesi+'</div>'+
        '<div style="font-size:11px;color:var(--text3);margin-bottom:3px;">Ziyaret teyit aramaları</div>'+
        '<div style="border:1px solid var(--border);border-radius:8px;max-height:170px;overflow:auto;">'+teyitListesi+'</div>'+
      '</div>'+
    '</div>';
}

function leadGecmisToggle(){
  const e=document.getElementById('leadGecmisKutu');
  if(e) e.style.display=(e.style.display==='none')?'':'none';
}

/* ---------------------------------------------------------------- arama engeli
   Müşterinin daha önce "aranmak istemiyorum" demesi durumunda arama ekranı
   AÇILMAZ. İki kaynak: contacts.aranmak_istemiyor (teyit ve lead akışları aynı
   kolonu yazar) ve teyit aramasında "sonra aranmak istemedi" cevabı. */
function _leadAramaEngelliMi(){
  const A=window._lanket; if(!A) return null;
  const aktif=(A.kontaklar||[]).filter(k=>k.aktif!==false);
  const telli=aktif.filter(k=>k.telefon);
  if(telli.length && telli.every(k=>k.aranmak_istemiyor===true))
    return 'Bu müşterinin telefonu olan tüm kontakları "aranmak istemiyor" olarak işaretli.';
  if(A.kontak && A.kontak.aranmak_istemiyor===true)
    return 'Seçili kontak "aranmak istemiyor" olarak işaretli.';
  if(A.gecmis && A.gecmis.istemiyorKayit && !telli.some(k=>k.aranmak_istemiyor!==true))
    return 'Önceki teyit aramasında tekrar aranmak istemediğini belirtmiş.';
  return null;
}

function _leadEngelEkraniRender(sebep){
  const el=document.getElementById('leadListesi'); if(!el) return;
  const A=window._lanket, m=A.musteri;
  el.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'+
      '<button class="topbar-back" onclick="leadKayitKapat()" style="position:relative;width:auto;padding:6px 12px;font-size:13px;">← Geri</button>'+
      '<div style="font-size:14px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+
        escapeHTML(m.unvan||m.ncst)+'</div>'+
    '</div>'+
    '<div style="background:rgba(224,4,42,.12);border:1.5px solid var(--red);border-radius:10px;padding:14px;margin-bottom:12px;">'+
      '<div style="font-size:14px;font-weight:800;color:var(--red);margin-bottom:5px;">⛔ Bu müşteri aranmayacak</div>'+
      '<div style="font-size:12px;color:var(--text2);">'+escapeHTML(sebep)+'</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-top:8px;">'+
        'Arama ekranı açılmadı. Kaydı kapatırsan listeden düşer ve bir daha kuyruğa gelmez.</div>'+
    '</div>'+
    _leadMusteriOzetHTML()+
    '<button class="btn" style="width:100%;background:var(--green);color:#04301f;" onclick="leadIstemiyorKapat()">✓ Kaydı kapat (aranmayacak)</button>'+
    '<button class="btn-iptal" style="margin-top:8px;" onclick="leadKayitKapat()">✕ Geri dön</button>';
}

async function leadIstemiyorKapat(){
  const A=window._lanket; if(!A) return;
  const k=A.kayit, simdi=new Date().toISOString();
  const {error:aErr}=await sb.from(LEAD_TABLO_ARAMA).insert({
    kayit_id:k.kayit_id, liste_id:k.liste_id, ncst:k.ncst,
    // V31.183: liste adinin anlik kopyasi. Liste sonradan silinse de
    // raporda hangi kampanyada arandigi okunur kalir (LEAD_02 kolonu).
    liste_adi:(A.liste&&A.liste.ad)||null,
    agent_id:currentUser.my_id, deneme_no:(k.deneme_sayisi||0)+1,
    baslangic:simdi, bitis:simdi, sure_sn:0,
    telefon:A.telefon||null, contact_id:(A.kontak&&A.kontak.contact_id)||null,
    durum:'g_aranmak_istemiyor', ulasildi:false,
    agent_notu:'Arama yapılmadı — önceki kayıtlarda aranmak istemiyor işareti var.'
  });
  if(aErr){ toast('Kaydedilemedi: '+aErr.message,'error'); return; }
  const {error:kErr}=await sb.from(LEAD_TABLO_KAYIT).update({
    durum:'g_aranmak_istemiyor', durum_grubu:'tamam', sonuc_grubu:'istemiyor',
    deneme_sayisi:(k.deneme_sayisi||0)+1, son_arama:simdi, sonraki_arama:null,
    kilit_agent_id:null, kilit_zaman:null, guncelleme:simdi
  }).eq('kayit_id',k.kayit_id);
  if(kErr){ toast('Kayıt güncellenemedi: '+kErr.message,'error'); return; }
  await addLog(LEAD_TABLO_KAYIT, k.kayit_id, 'Lead Araması', 'Aranmadı — aranmak istemiyor');
  toast('Kayıt kapatıldı — bu müşteri aranmayacak','success');
  window._lanket=null;
  _leadAgentKuyruk();
}

/* ---------------------------------------------------------------- agent panosu
   Bugün ben ne yaptım: arama, ulaşma, olumlu, görev kartı. Agent kendi işini
   görür; yönetici Çağrı Analizi'nden karşılaştırır. */
async function _leadAgentPanoHTML(){
  try{
    const bugun=new Date(); bugun.setHours(0,0,0,0);
    const {data}=await sb.from(LEAD_TABLO_ARAMA)
      .select('durum,ulasildi,olusan_task_id')
      .eq('agent_id',currentUser.my_id).gte('olusturma',bugun.toISOString()).limit(2000);
    const A=data||[];
    if(!A.length) return '';
    const ulasildi=A.filter(a=>a.ulasildi).length;
    const olumlu=A.filter(a=>{const d=LEAD_DURUM[a.durum]; return d&&d.sonuc==='olumlu';}).length;
    const gorev=A.filter(a=>a.olusan_task_id).length;
    return '<div style="display:flex;gap:6px;margin-bottom:10px;background:var(--card);border:1px solid var(--border);'+
      'border-radius:10px;padding:8px 10px;font-size:11px;color:var(--text3);">'+
      '<div style="flex:1;">Bugün: <b style="color:var(--text);">'+A.length+'</b> arama</div>'+
      '<div style="flex:1;">ulaşma <b style="color:var(--blue);">%'+Math.round(ulasildi/A.length*100)+'</b></div>'+
      '<div style="flex:1;">olumlu <b style="color:var(--green);">'+olumlu+'</b></div>'+
      '<div style="flex:1;">görev <b style="color:var(--amber);">'+gorev+'</b></div></div>';
  }catch(e){ return ''; }
}

// v1.8.0 lead loaded (kuyruk karti: kapat + sil)
