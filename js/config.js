// ============================================================
// config.js — v1.2.19
// Son güncelleme: 2026-07-08
// Değişiklikler:
//   v1.2.18 — APP_VERSION → V30.67 (rapor 'q.in' thenable fix + penetrasyon kartı).
//   v1.2.19 — APP_VERSION → V30.70. Kaydet tuşu kaybı (Planlandı→Gerçekleşti)
//             düzeltmesi — kod temas.js'te; config yalnız sürüm damgası.
//   v1.2.18 — APP_VERSION → V30.69. Dashboard penetrasyon payı (pay ⊆ payda,
//             ≤ %100) + +Temas form yarışı düzeltmeleri (temas.js/musteri.js).
//   v1.2.17 — APP_VERSION → V30.66. Temas rapor & filtre paketi (BUG-A/B/C/D +
//             2 sekmeli xlsx). Kod değişikliği diğer dosyalarda; config yalnızca
//             sürüm damgası. (Bu dosyada mantık değişikliği yok.)
//   v1.2.16 — APP_VERSION → V30.65. Şikayet yaşam döngüsü: görev MY/FMY beyanıyla
//             kapanmaz; kapanış 'Çözüldü' → onay bekler (atayan onaylar/reddeder).
//   v1.2.15 — APP_VERSION → V30.64 (BUG-1: görev sonuç kaydı çağrı sırası fix).
//             Ayrıca BUG-5 giderildi: sabit V30.62'de takılıydı (redesign V30.63'ü
//             yazmıştı ama config.js güncellenmemişti).
//   v1.2.14 — APP_VERSION → V30.62
// Son güncelleme: 2026-06-24
// Değişiklikler:
//   v1.2.8 — Önceki teslimatta APP_VERSION değişti (V30.51) ama bu başlık
//            güncellenmemişti — kullanıcı uyardı, düzeltildi.
// Son güncelleme: 2026-06-24
// Değişiklikler:
//   v1.2.7 — APP_VERSION tek kaynak değişkeni eklendi. Artık görünür versiyon
//            numarasını değiştirmek için 19 ayrı yeri elle güncellemek gerekmiyor —
//            sadece bu tek satırı değiştirip applyAppVersion() çağrılır (auth.js'te
//            otomatik çağrılıyor). HTML'deki tüm "V30.XX" metinleri class="app-ver"
//            ile işaretlendi, sayfa yüklenince buradan otomatik dolduruluyor.
//   v1.2.6 — TURKCELL BÖLGE YÖNETİCİSİ rolü PERM matrisine eklendi.
//            Scope: musteri/temas/firsat/rapor_temas/rapor_firsat/gorev = KÇM
//            (Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisini görür)
//            Eylem yetkileri: KÇM MÜDÜRÜ ile aynı, HARİÇ:
//            musteri_sil, hedef_giris, hedef_excel, hedef_kalem_yonet,
//            sifre_sifirla, urun_hedef_map, firsat_sil (önceden de KÇM MÜDÜRÜ'nde yoktu)

// v1.2.7: TEK KAYNAK VERSİYON — değiştirilecek tek yer burası.
const APP_VERSION = 'V30.70';
function applyAppVersion(){
  document.querySelectorAll('.app-ver').forEach(el => el.textContent = APP_VERSION);
  document.title = document.title.replace(/V[\d.]+/, APP_VERSION);
}

//   v1.2.5 — TAKIM LİDERİ musteri:KÇM (tüm KÇM), diğer modüller BAĞLI (takım scope)
//   v1.2.4 — TAKIM LİDERİ scope: BAĞLI→KÇM (6 modül: musteri/temas/firsat/rapor/gorev)
//   v1.2.3 — musteri_duzenle: MY/FMY eklendi (kendi müşterisini edit edebilir)
//   v1.2.2 — PERM.scope.musteri MY/FMY: PRT→KÇM (tüm KÇM müşterilerini görebilir)
//   v1.2.1 — applyScope MY/FMY temas/fırsat scope KÇM yapıldı
//   v1.1.0 — repTypeArr başlangıç değerlerine 'Fiziksel Ziyaret' eklendi
//   v1.0.0 — ilk versiyon
// ============================================================
/* ===== YARDIMCILAR ===== */
function escapeHTML(s){if(!s)return '';return String(s).replace(/[&<>'"]/g,t=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));}

function csvCell(v){const s=String(v||'').replace(/"/g,'""');return(s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s+'"':s;}
function fmtTL(n){if(!n&&n!==0)return '—';return new Intl.NumberFormat('tr-TR',{minimumFractionDigits:0}).format(n)+' ₺';}
function fmtDate(d){if(!d)return '—';try{return new Date(d).toLocaleDateString('tr-TR');}catch{return d;}}

/* ===== STATE ===== */
let sb=null, currentUser=null, selectedCustomer=null;
let selectedPurposes=[], selectedProducts=[], selectedActions=[], selectedResult='';
let selectedContactsMap=new Map();
let selectedTemasYontemiStr='Ziyaret', selectedTemasDurumuStr='Gerçekleşti';
let activeBasket=[], currentEditingCustNcst=null;
let currentEditPlanId=null;
let isOpportunityConfirmed=false;
let listTimeFilter='tumu', listStatusArr=['Gerçekleşti','Planlandı'];
let repStatusArr=['Gerçekleşti','Planlandı'], repTypeArr=['Fiziksel Ziyaret','Ziyaret','Online Toplantı','Telefon','Email','SMS/Whatsapp'];
let editToggleState={it:null,sube:null,fw:null,sunucu:null};
let ppTimeFilter='tumu', ppStatusFilter='tumu';
let currentEditingOppId=null, oppSelectedNcst=null, oppSelectedUnvan=null;

/* ===== SABITLER ===== */
const DEFAULT_PURPOSES=["Kontrat Yenileme","Yeni Tesis (YT) / Aktivasyon","MNT","Devir","Esnek Devir","Sim Kart Değişimi","Hat İptal","E-SIM","Şikayet Görüşmesi","Evrak/İmza İşlemleri","ÖŞY","Tanışma / Rutin Ziyaret","Teklif Değerlendirme"];
// ============ YETKİ MATRİSİ ============
// Bu obje doğrudan yetki_matrisi.xlsx'ten üretilmiştir.
// Değişiklik için Excel'i güncelleyin.

const PERM = {
  // Görüntüleme kapsamı: 'TÜM' | 'KÇM' | 'BAĞLI' | 'PRT'
  scope: {
    musteri: {
      'ADMIN': 'TÜM',
      'SATIŞ DİREKTÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'TURKCELL BÖLGE YÖNETİCİSİ': 'KÇM', // v1.2.6: Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisi
      'TAKIM LİDERİ': 'KÇM', // v1.2.4: Takım Lideri tüm KÇM müşterilerini görür
      'ÇÖZÜM SATIŞ UZMANI': 'TÜM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'BAĞLI',
      'SATIŞ DESTEK': 'KÇM',
      'MY': 'KÇM',  // v2.10.7: PRT→KÇM — tüm KÇM müşterilerini görebilir
      'FMY': 'KÇM', // v2.10.7: PRT→KÇM
    },
    temas: {
      'ADMIN': 'TÜM',
      'SATIŞ DİREKTÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'TURKCELL BÖLGE YÖNETİCİSİ': 'KÇM', // v1.2.6: Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisi
      'TAKIM LİDERİ': 'BAĞLI',
      'ÇÖZÜM SATIŞ UZMANI': 'TÜM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'BAĞLI',
      'SATIŞ DESTEK': 'KÇM',
      'MY': 'KÇM',   // v1.2.1: PRT→KÇM — form içi müşteri aramada tüm KÇM görünür
      'FMY': 'KÇM',  // v1.2.1: PRT→KÇM
    },
    firsat: {
      'ADMIN': 'TÜM',
      'SATIŞ DİREKTÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'TURKCELL BÖLGE YÖNETİCİSİ': 'KÇM', // v1.2.6: Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisi
      'TAKIM LİDERİ': 'BAĞLI',
      'ÇÖZÜM SATIŞ UZMANI': 'TÜM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'BAĞLI',
      'SATIŞ DESTEK': 'KÇM',
      'MY': 'KÇM',   // v1.2.1: PRT→KÇM
      'FMY': 'KÇM',  // v1.2.1: PRT→KÇM
    },
    rapor_temas: {
      'ADMIN': 'TÜM',
      'SATIŞ DİREKTÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'TURKCELL BÖLGE YÖNETİCİSİ': 'KÇM', // v1.2.6: Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisi
      'TAKIM LİDERİ': 'BAĞLI',
      'ÇÖZÜM SATIŞ UZMANI': 'TÜM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'BAĞLI',
      'SATIŞ DESTEK': 'KÇM',
      'MY': 'PRT',
      'FMY': 'PRT',
    },
    rapor_firsat: {
      'ADMIN': 'TÜM',
      'SATIŞ DİREKTÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'TURKCELL BÖLGE YÖNETİCİSİ': 'KÇM', // v1.2.6: Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisi
      'TAKIM LİDERİ': 'BAĞLI',
      'ÇÖZÜM SATIŞ UZMANI': 'TÜM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'BAĞLI',
      'SATIŞ DESTEK': 'KÇM',
      'MY': 'PRT',
      'FMY': 'PRT',
    },
    gorev: {
      'ADMIN': 'TÜM',
      'SATIŞ DİREKTÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'TURKCELL BÖLGE YÖNETİCİSİ': 'KÇM', // v1.2.6: Operasyon Müdürü ile aynı — kendi KÇM'sinin tüm verisi
      'TAKIM LİDERİ': 'BAĞLI',
      'ÇÖZÜM SATIŞ UZMANI': 'TÜM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'BAĞLI',
      'SATIŞ DESTEK': 'KÇM',
      'MY': 'KÇM',
      'FMY': 'KÇM',
    },
  },

  // Boolean izinler
  admin_panel:            ['ADMIN'],
  kullanici_yonet:        ['ADMIN','SATIŞ DİREKTÖRÜ'],
  urun_yonet:             ['ADMIN'],
  duyuru_yonet:           ['ADMIN','SATIŞ DİREKTÖRÜ'],
  talep_yonet:            ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ'],
  yonetici_panel:         ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI'],

  musteri_ekle:           ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'],
  musteri_duzenle:        ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'], // v1.2.3: MY/FMY kendi müşterisini edit edebilir
  musteri_sil:            ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ'],
  portfoy_devri:          ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ'],
  ncst_guncelle:          ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','SATIŞ DESTEK'],

  temas_ekle:             ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'],
  temas_duzenle:          ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'],
  temas_baskasi_duzenle:  ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','ÇÖZÜM SATIŞ UZMANI'],
  temas_sil:              ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ'],

  firsat_ekle:            ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'],
  firsat_adim:            ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'],
  firsat_baskasi_duzenle: ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI'],
  firsat_gerceklesen:     ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','SATIŞ DESTEK'],
  firsat_iptal_talep:     ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','MY','FMY'],
  firsat_iptal_onayla:    ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI'],
  firsat_sil:             ['ADMIN'],

  // MY ve FMY max adım kontrolü — Evrak'tan ileriye gidemez
  firsat_max_adim_evrak:  ['MY','FMY'],

  hedef_giris:            ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI'],
  hedef_excel:            ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI'],
  hedef_kalem_yonet:      ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ'],

  kontak_yonet:           ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TURKCELL BÖLGE YÖNETİCİSİ','OPERASYON MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI','ÇÖZÜM SATIŞ TEMSİLCİSİ','SATIŞ DESTEK','MY','FMY'],
  sifre_sifirla:          ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ','ÇÖZÜM SATIŞ UZMANI'],
  urun_hedef_map:         ['ADMIN','SATIŞ DİREKTÖRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ','KÇM MÜDÜRÜ'],
};

function hasPerm(perm){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const allowed=PERM[perm]||[];
  return allowed.includes(r);
}

function getScope(module){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const scopeMap=PERM.scope[module]||{};
  return scopeMap[r]||'PRT';
}

// Bağlı kullanıcıların my_id listesini döndür
// TL ve ÇST: kendine bağlı MY/FMY'lerin id'leri
// ÇSU: kendine bağlı ÇST'lerin + o ÇST'lere bağlı MY/FMY'lerin id'leri
let bagliMyIds = []; // login sonrası doldurulur

async function loadBagliMyIds(){
  if(!currentUser) return;
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  bagliMyIds = [currentUser.my_id];

  if(['TAKIM LİDERİ','ÇÖZÜM SATIŞ TEMSİLCİSİ'].includes(r)){
    // Doğrudan bağlı MY/FMY'ler
    const {data} = await sb.from('users')
      .select('my_id')
      .or(`takim_lideri_id.eq.${currentUser.my_id},cst_id.eq.${currentUser.my_id}`)
      .eq('aktif',true);
    bagliMyIds = [currentUser.my_id, ...(data||[]).map(u=>u.my_id)];

  } else if(r === 'ÇÖZÜM SATIŞ UZMANI'){
    // ÇST'ler + onlara bağlı MY/FMY'ler
    const {data:cstler} = await sb.from('users')
      .select('my_id')
      .eq('yetki_seviyesi','ÇÖZÜM SATIŞ TEMSİLCİSİ')
      .eq('ust_id', currentUser.my_id)
      .eq('aktif',true);
    const cstIds = (cstler||[]).map(u=>u.my_id);
    if(cstIds.length > 0){
      const {data:myler} = await sb.from('users')
        .select('my_id')
        .in('cst_id', cstIds)
        .eq('aktif',true);
      bagliMyIds = [currentUser.my_id, ...cstIds, ...(myler||[]).map(u=>u.my_id)];
    } else {
      bagliMyIds = [currentUser.my_id];
    }
  }
}

function applyScope(q, module, prefix=''){
  const scope=getScope(module);
  if(scope==='TÜM') return q;
  if(scope==='KÇM' && currentUser.kcm_id){
    if(module==='musteri') return q.eq('kcm_id', currentUser.kcm_id);
    if(kcmMyIds.length>0) return q.in(`${prefix}my_id`, kcmMyIds);
    return q.eq(`${prefix}kcm_id`, currentUser.kcm_id);
  }
  if(scope==='BAĞLI'){
    if(module==='musteri') return q.in('my_id', bagliMyIds);
    return q.in(`${prefix}my_id`, bagliMyIds);
  }
  // PRT: kendi portföyü
  return q.eq(`${prefix}my_id`, currentUser.my_id);
}

let FALLBACK_PRODUCTS=[
  {cat:'Mobil',items:[{n:'Ses / Data Hatları',t:'Adet'},{n:'YT (Yeni Tesis)',t:'Adet'},{n:'MNT',t:'Adet'},{n:'Asansör Hattı',t:'Adet'},{n:'e-SIM / Yedek SIM',t:'Adet'}]},
  {cat:'Cihaz & Kampanya',items:[{n:'iPhone (Pro / Pro Max)',t:'Adet'},{n:'Samsung (A-Serisi / S-Serisi)',t:'Adet'},{n:'Aksesuar',t:'Adet'}]},
  {cat:'SOL',items:[{n:'Superbox',t:'Adet'},{n:'XDSL / Fiber',t:'Tutar'}]},
  {cat:'DBS',items:[{n:'Metro Ethernet',t:'Tutar'},{n:'Radio Link',t:'Tutar'},{n:'Sanal Sunucu',t:'Tutar'},{n:'Yedekleme',t:'Tutar'},{n:'Güvenlik',t:'Tutar'},{n:'Loglama',t:'Tutar'},{n:'VoIP',t:'Tutar'},{n:'Tekofis',t:'Tutar'}]},
  {cat:'M2M / IoT',items:[{n:'IoT',t:'Adet'},{n:'Araç Takip',t:'Adet'}]},
  {cat:'DSS',items:[{n:'E-Şirket',t:'Tutar'},{n:'E-Platform',t:'Tutar'}]}
];

let allProductsLoaded=false;

async function loadProductsFromDB(){
  try{
    // Kategori sıralarını al
    const {data:cats} = await sb.from('product_categories').select('*').order('sira');
    const catOrder = (cats||[]).map(c=>c.kategori);

    const{data,error}=await sb.from('products').select('*').eq('aktif',true).order('sira');
    if(error||!data||data.length===0){console.warn('Ürünler DB\'den alınamadı, fallback kullanılıyor.');return;}
    const groupedAll={};
    const groupedUrun={};
    data.forEach(p=>{
      const cat=p.kategori||'Diğer';
      const t=p.unit_type||'Adet';
      if(!groupedAll[cat])groupedAll[cat]={cat,items:[],sira:0};
      groupedAll[cat].items.push({n:p.urun_adi,t,product_id:p.product_id});
      if(p.is_urun!==false){
        if(!groupedUrun[cat])groupedUrun[cat]={cat,items:[],sira:0};
        groupedUrun[cat].items.push({n:p.urun_adi,t,product_id:p.product_id});
      }
    });

    // Kategori sırasına göre sırala
    const sortByOrder = (obj) => {
      const sorted = [
        ...catOrder.filter(k=>obj[k]).map(k=>obj[k]),
        ...Object.values(obj).filter(v=>!catOrder.includes(v.cat))
      ];
      return sorted;
    };

    FALLBACK_PRODUCTS = sortByOrder(groupedAll);
    window.FIRSAT_PRODUCTS = sortByOrder(groupedUrun);
    allProductsLoaded=true;
    console.log(`Ürünler DB'den yüklendi: ${data.length} ürün, ${FALLBACK_PRODUCTS.length} kategori`);
    await buildTemasUI();
    buildUrunSelects();
  }catch(e){console.warn('loadProductsFromDB hata:',e);}
}
const DEFAULT_RESULTS=["Planlanan İşlemler Tamamlandı","Tekrar Ziyaret Edilecek","Teklif Gönderilecek","Ürün Sorumlusu/Uzmanı ile Toplantı Yapılacak","Ziyaret Yapılamadı"];
const DEFAULT_ACTIONS=["İşlem Tamamlandı","Evrak Alındı","Kontrat Yenilendi","Hat / Cihaz Teslim Edildi","Teklif Verildi"];
const OPP_ADIMLAR=['Fırsat','Teklif','Beyan','Evrak','Gerçekleşen','İptal'];
const OPP_DURUMLAR=['Fırsat','Teklif','Beyan','Evrak','Gerçekleşen','İptal']; // legacy compat
const OPP_ADIM_COLORS={
  'Fırsat':'blue','Teklif':'amber','Beyan':'purple',
  'Evrak':'blue','Gerçekleşen':'green','İptal':'red'
};
const OPP_ADIM_OLASILIK={
  'F\u0131rsat':10,'Teklif':25,'Beyan':50,'Evrak':90,'Ger\u00e7ekle\u015fen':100,'\u0130ptal':0
};
function selectOppAdim(adim){
  var GERCEKLESEN='Ger\u00e7ekle\u015fen', IPTAL='\u0130ptal';
  document.querySelectorAll('.opp-adim-btn').forEach(function(b){
    var isSelected = b.dataset.adim===adim;
    b.classList.toggle('selected',isSelected);
    var bAdim = b.dataset.adim;
    if(isSelected){
      if(adim===GERCEKLESEN){
        b.style.background='rgba(0,214,143,0.2)';
        b.style.borderColor='var(--green)';
        b.style.color='var(--green)';
      } else if(adim===IPTAL){
        b.style.background='rgba(224,4,42,0.2)';
        b.style.borderColor='var(--red)';
        b.style.color='var(--red)';
      } else {
        b.style.background='';
        b.style.borderColor='';
        b.style.color='';
      }
    } else {
      if(bAdim===GERCEKLESEN){
        b.style.background='';
        b.style.borderColor='var(--green)';
        b.style.color='var(--green)';
      } else if(bAdim===IPTAL){
        b.style.background='';
        b.style.borderColor='var(--red)';
        b.style.color='var(--red)';
      } else {
        b.style.background='';
        b.style.borderColor='';
        b.style.color='';
      }
    }
  });
  document.getElementById('oppDurum').value=adim;
  var olas=OPP_ADIM_OLASILIK[adim]||10;
  selectOppOlasilik(olas);
}

// ===== ÇOKLU ÜRÜN GİRİŞİ (Madde 5) =====
let oppUrunRows = [];

// ===== ORTAK ÜRÜN SATIRI FABRİKASI =====
function _urunSatiriEkle(opts){
  // opts: {prefix, containerId, rowsArr, removeFn, updateFn, urunAdi, adet, tutar, sayac}
  const id = opts.prefix + Date.now() + (opts.sayac||'');
  if(opts.rowsArr) opts.rowsArr.push(id);
  const prods = window.FIRSAT_PRODUCTS || FALLBACK_PRODUCTS || [];
  let optHtml = '<option value="">-- Ürün Seçin --</option>';
  prods.forEach(c=>{
    optHtml += `<optgroup label="${escapeHTML(c.cat)}">` +
      (c.items||[]).map(i=>`<option value="${escapeHTML(i.n)}" data-type="${escapeHTML(i.t||'Adet')}" ${i.n===opts.urunAdi?'selected':''}>${escapeHTML(i.n)}</option>`).join('') +
      '</optgroup>';
  });
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;position:relative;';
  const removeBtn = opts.removeFn
    ? `<button type="button" onclick="${opts.removeFn}('${id}')" style="position:absolute;top:6px;right:8px;background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;">✕</button>`
    : `<button type="button" onclick="document.getElementById('${id}').remove()" style="position:absolute;top:6px;right:8px;background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;">✕</button>`;
  div.innerHTML = `
    ${removeBtn}
    <div class="field" style="margin-bottom:6px;">
      <label style="font-size:11px;">Ürün</label>
      <select id="${id}_urun" onchange="${opts.updateFn}('${id}')" style="width:100%;">${optHtml}</select>
    </div>
    <div style="display:flex;gap:8px;">
      <div id="${id}_adetBox" class="field" style="flex:1;margin-bottom:0;">
        <label style="font-size:11px;">Adet</label>
        <input type="number" id="${id}_adet" value="${opts.adet||1}" min="1" style="width:100%;">
      </div>
      <div id="${id}_tutarBox" class="field hide" style="flex:2;margin-bottom:0;">
        <label style="font-size:11px;">Tutar (₺)</label>
        <input type="number" id="${id}_tutar" value="${opts.tutar||0}" style="width:100%;">
      </div>
    </div>`;
  const container = document.getElementById(opts.containerId);
  if(container) container.appendChild(div);
  // Tip güncelle
  _urunSatiriTipGuncelle(id);
  return id;
}

function _urunSatiriTipGuncelle(id){
  const sel = document.getElementById(id+'_urun');
  if(!sel) return;
  const type = sel.options[sel.selectedIndex]?.getAttribute('data-type')||'Adet';
  const adetBox = document.getElementById(id+'_adetBox');
  const tutarBox = document.getElementById(id+'_tutarBox');
  if(adetBox) adetBox.classList.toggle('hide', type==='Tutar');
  if(tutarBox) tutarBox.classList.toggle('hide', type!=='Tutar');
}

function _urunSatiriGetData(rowsArrOrContainerId, useArr){
  const rows = useArr
    ? rowsArrOrContainerId
    : Array.from(document.querySelectorAll(`#${rowsArrOrContainerId} [id]`)).map(el=>el.id);
  return rows.map(id=>{
    const urun = document.getElementById(id+'_urun')?.value||'';
    const sel = document.getElementById(id+'_urun');
    const type = sel?.options[sel.selectedIndex]?.getAttribute('data-type')||'Adet';
    const adet = parseInt(document.getElementById(id+'_adet')?.value)||1;
    const tutar = parseFloat(document.getElementById(id+'_tutar')?.value)||0;
    return {urun, type, adet, tutar};
  }).filter(r=>r.urun);
}

function addOppUrunRow(urunAdi='',adet=1,tutar=''){_urunSatiriEkle({prefix:'oppUrunRow_',containerId:'oppUrunListesi',rowsArr:oppUrunRows,removeFn:'removeOppUrunRow',updateFn:'_urunSatiriTipGuncelle',urunAdi,adet,tutar});}

function updateOppUrunRow(id){_urunSatiriTipGuncelle(id);}

function removeOppUrunRow(id){oppUrunRows=oppUrunRows.filter(r=>r!==id);document.getElementById(id)?.remove();}

function clearOppUrunRows(){oppUrunRows=[];const el=document.getElementById('oppUrunListesi');if(el)el.innerHTML='';}

function getOppUrunData(){return _urunSatiriGetData(oppUrunRows,true);}

// Temas ekranı çoklu ürün (ayrı liste)
let tmsOppUrunRows = [];

function addTmsOppUrunRow(urunAdi='',adet=1,tutar=''){_urunSatiriEkle({prefix:'tmsOppRow_',containerId:'tmsOppUrunListesi',rowsArr:tmsOppUrunRows,removeFn:'removeTmsOppUrunRow',updateFn:'_urunSatiriTipGuncelle',urunAdi,adet,tutar});}

function updateTmsOppRow(id){_urunSatiriTipGuncelle(id);}

function removeTmsOppUrunRow(id){tmsOppUrunRows=tmsOppUrunRows.filter(r=>r!==id);document.getElementById(id)?.remove();}

function clearTmsOppUrunRows(){tmsOppUrunRows=[];const el=document.getElementById('tmsOppUrunListesi');if(el)el.innerHTML='';}

function getTmsOppUrunData(){return _urunSatiriGetData(tmsOppUrunRows,true);}
function selectOppOlasilik(val){
  // v30.31: oppOlasilik div içindeki chip-btn'ler — text içeriğine göre eşleştir
  const container=document.getElementById('oppOlasilik');
  if(!container) return;
  container.querySelectorAll('.chip-btn').forEach(b=>{
    const btnVal=parseInt(b.textContent.replace('%','').trim());
    b.classList.toggle('selected', btnVal===val);
  });
  // Hidden input'a yaz
  let hiddenInp=document.getElementById('oppOlasilikVal');
  if(!hiddenInp){
    hiddenInp=document.createElement('input');
    hiddenInp.type='hidden';
    hiddenInp.id='oppOlasilikVal';
    container.parentElement.appendChild(hiddenInp);
  }
  hiddenInp.value=val;
}
const OPP_ADIM_TAGS={
  'Fırsat':'tag-blue','Teklif':'tag-amber','Beyan':'tag-purple',
  'Evrak':'tag-blue','Gerçekleşen':'tag-green','İptal':'tag-red'
};

/* ===== BOOT ===== */
// ============ SUPABASE CONFIG ============
// Global hata yakalayıcı — q.eq is not a function gibi hataları konsola yaz
window.addEventListener('unhandledrejection', function(e){
  console.error('[HATA DETAY]', e.reason?.stack || e.reason?.message || e.reason);
});

// ============================================================
// v30.40: TIMEZONE YARDIMCıLARI — Türkiye UTC+3
// DB'de timestamptz, filtreler İstanbul saatine göre hesaplanmalı
// ============================================================
function trNow() {
  // Şu anki zamanı UTC+3 offset ile döndür
  return new Date();
}

function trDateStr(date) {
  // Date → 'YYYY-MM-DD' (İstanbul tarihine göre)
  const d = date || new Date();
  const tr = new Date(d.getTime() + 3 * 60 * 60 * 1000); // UTC+3
  return tr.toISOString().slice(0, 10);
}

function trStartOfDay(dateStr) {
  // 'YYYY-MM-DD' → UTC karşılığı gün başı (İstanbul 00:00 = UTC 21:00 önceki gün)
  return dateStr + 'T00:00:00+03:00';
}

function trEndOfDay(dateStr) {
  // 'YYYY-MM-DD' → UTC karşılığı gün sonu (İstanbul 23:59 = UTC 20:59)
  return dateStr + 'T23:59:59+03:00';
}

function trStartOfMonth(year, month) {
  // Ay başı İstanbul saati
  const m = String(month).padStart(2,'0');
  return year + '-' + m + '-01T00:00:00+03:00';
}

function trToISO(localDatetimeStr) {
  // Form'dan gelen 'YYYY-MM-DDTHH:MM' → UTC ISO string
  // Kullanıcı İstanbul saatinde giriyor, +03:00 ekle
  if (!localDatetimeStr) return null;
  return localDatetimeStr + ':00+03:00';
}

// v1.2.12: datetime-local input'larına değer yazarken kullanılır — cihazın kendi
// saat dilimi ayarından TAMAMEN bağımsız, her zaman doğru İstanbul saatini üretir
// (Intl.DateTimeFormat ile explicit 'Europe/Istanbul' kullanır).
function toIstanbulDatetimeLocalValue(isoOrDateStr){
  if(!isoOrDateStr) return '';
  const d=new Date(isoOrDateStr);
  if(isNaN(d.getTime())) return '';
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul', year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hour12:false
  }).formatToParts(d);
  const get=t=>parts.find(p=>p.type===t)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
// ============================================================

// v30.10: Durum sabitleri — 'Gerçekleşti' (visits.durum) vs 'Gerçekleşen' (opportunities.adim) karışıklığını önler
const VISIT_DURUM_GERCEKLESTI = 'Gerçekleşti';
const VISIT_DURUM_PLANLANDI = 'Planlandı';
const OPP_ADIM_GERCEKLESEN = 'Gerçekleşen';
const _HARDCODED_URL = 'https://iqehsplmbokptbauabyb.supabase.co';
const _HARDCODED_KEY = 'sb_publishable_sVNi_JhlHdeM60hIprbDJA_jOLEozOv';
// ==========================================