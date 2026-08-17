// ============================================================
// config.js — v1.2.73
// Son güncelleme: 2026-08-17
// Değişiklikler:
//   v1.2.73 — APP_VERSION → V31.31. FIX: Profil görüntüleme (impersonation)
//             bandı da (#impersonationBanner) zoom'da kayıyordu — V31.30'daki
//             visualViewport düzeltmesi sadece .topbar/.app-footer'ı
//             kapsıyordu, bu bant .page dışında ayrı bir top:0 sabit eleman
//             olduğu için kapsam dışı kalmıştı. Aynı mekanizma (--vvy-top)
//             ile görünen alanın üstüne kilitlendi. Zoom yokken sıfır etki.
//             main.css.
//   v1.2.72 — APP_VERSION → V31.30. FIX (kökten çözüm — V31.29'daki viewport
//             meta denemesi etkisiz kalmıştı): trackpad/Ctrl pinch-zoom'da
//             visual viewport ile layout viewport farklılaşıyor, position:fixed
//             topbar/alt bar layout viewport'a sabit kalıp görünen alanın
//             dışında kalıyordu. js/utils.js'e window.visualViewport dinleyicisi
//             eklendi — topbar/alt bar artık AYRI AYRI (tek parça kaydırma
//             yetersizdi) görünen alanın üstüne/altına kilitleniyor. Zoom
//             yokken sıfır etki. Kullanıcının gerçek cihazından alınan
//             visualViewport verileriyle (offsetTop:339, offsetLeft:241,
//             scale:4.18) doğrulandı. main.css, utils.js v1.0.2.
//   v1.2.71 — APP_VERSION → V31.29. FIX: index.html <meta viewport>'tan
//             "maximum-scale=1.0, user-scalable=no" kaldırıldı — masaüstü
//             Chrome'da Ctrl+Zoom yapılınca topbar/alt versiyon barının
//             (position:fixed) büyütülmüş görünüme kilitlenmeyip içerikle
//             kayması/kaybolması sorununu çözüyor. Not: mobilde artık
//             pinch/double-tap zoom serbest (öncesinde kilitliydi).
//   v1.2.70 — APP_VERSION → V31.28. Fırsat: YENİ WhatsApp paylaşım özelliği —
//             fırsat herhangi bir aşamadan Beyan/Evrak'a çekildiğinde (veya
//             yeni kayıt doğrudan bu aşamayla girildiğinde), fırsat başına
//             SADECE 1 defa "Paylaş/Geç" penceresi çıkar (oppWaShareModal);
//             MY/Müşteri/NCST/ürün(ler)+adet/tutar/Not içerir, wa.me linkiyle
//             paylaşılır. DB migration gerekti: opportunities.wa_paylasim_yapildi
//             (boolean, default false). firsat.js v1.2.4.
//   v1.2.69 — APP_VERSION → V31.27. Arama anketi: "Bu tarihte firmadan
//             ziyaret oldu mu?" = Hayır akışı duzeltildi (alakasiz yuz-yuze/
//             isim sorulari artik sadece Evet'te cikiyor; Hayir'da once
//             "Bu konuda emin misiniz?" ara sorusu cikiyor). Memnuniyet ve
//             NPS olcekleri ikisi de 1-10 oldu (eskiden 1-5 / 0-10);
//             ilgili "/5" etiketleri "/10" oldu, Memnuniyetsiz kirilim
//             esigi orantili guncellendi (lte.2→lte.4). arama.js v1.0.11.
//   v1.2.68 — APP_VERSION → V31.26. Donanim: Tedarik akışı bildirimi — Ana menu
//             'Donanim Takip' ikonunda rozet (kendi siparişlerinden Onaylandı
//             olanlar), rezervasyon kartinda kendi yeni-onayi turuncu glow +
//             '🔔 Onaylandı' rozetiyle vurgulanir. donanim.js v1.0.19, auth.js v1.2.17.
//   v1.2.67 — APP_VERSION → V31.25. Donanim: Satış Tipi (Pesin/OLM/Turkcell
//             Finansman) — on rezervasyonda zorunlu secim, rezervasyon karti/
//             detay/duzenleme ekranlarinda gosterilir/duzenlenebilir. Kart
//             artik siparis adimina gore renkli kenarlik alir. DB migration
//             gerekiyor (stok_rezervasyonlari.satis_tipi). donanim.js v1.0.18.
//   v1.2.66 — APP_VERSION → V31.24. FIX: Arama Detay modali 'kayit bulunamadi'
//             gosteriyordu — sabit kolon listesi select'i PostgREST tarafinda
//             sessizce reddediliyordu (hata kontrol edilmiyordu). select('*') +
//             hata mesaji ekrana yazilir oldu. arama.js v1.0.10.
//   v1.2.65 — APP_VERSION → V31.23. Tamamlanan arama kartlari artik daima
//             anlamli ozet gosterir; karta tiklamak / yeni "Detay" tusu, o
//             goreve ait TUM arama denemelerinin tam detayini gosteren yeni
//             salt-okunur modal acar (aramaSonucDetayModal). "Tekrar Ara" ->
//             "Yeniden Ara". arama.js v1.0.9.
//   v1.2.64 — APP_VERSION → V31.22. Cagri Analizi: 5b MY Kirilim/Liderlik
//             Tablosu (en cok yanlis numara, en temiz veri, KCM bazli
//             memnuniyet en yuksek/dusuk 3'er MY) + kart cercevesine mor
//             (sahte/supheli) rengi eklendi. arama.js v1.0.8.
//   v1.2.63 — APP_VERSION → V31.21. Arama: 'Bugun' -> 'Bekleyen Cagrilar'
//             (+ tarih filtresi), kutu etiketleri Bekleyen/Gelecek/Tamamlanan,
//             sayfa basligi 'Ziyaret Teyit Aramalari', kart cerceve
//             renklendirme (kirmizi/sari/yesil/turuncu). arama.js v1.0.7.
//   v1.2.62 — APP_VERSION → V31.20. Arama ekrani: Bugun/Gelecek/Tamamlanan
//             sekmeleri 3'lu istatistik kutusuna donusturuldu (main.css:
//             .summary-box.active/.summary-val.lg/.summary-label.lg eklendi).
//   v1.2.61 — APP_VERSION → V31.19. Memnuniyet Arama: 'Ara' modaline firma
//             gecmisi paneli (tum ziyaretler + onceki teyit aramalari) eklendi
//             (arama.js: _aramaGecmisYukle/_aramaGecmisRender).
//   v1.2.60 — APP_VERSION → V31.18. IMEI maskeleme (2.4): donanim_imei_gor
//             yetkisi olmayan kullanicilar atanmis IMEI'leri ilk4+son4
//             maskeli gorur (donanim.js: _imeiMaskele).
//   v1.2.59 — APP_VERSION → V31.10. IMEI eslestirme: acilista bostaki seriler
//             otomatik listelenir (arama sart degil).
//   v1.2.58 — APP_VERSION → V31.09. Part 2 (2.3): IMEI eşleştirme modali —
//             barcode + IMEI arama, KÇM kilitli (urun_id), kısmi eşleştirme.
//   v1.2.57 — APP_VERSION → V31.08. Bant: hata toast'lari band ustune (z-index)
//             + band daha seffaf (rgba .45).
//   v1.2.56 — APP_VERSION → V31.07. UI: Ana menuye admin-only 'Profil Degistir'
//             butonu + impersonation bandi yari-seffaf/click-through.
//   v1.2.55 — APP_VERSION → V31.06. MY kendi rezervasyonunu HER aktif adımda
//             iptal edebilir (stok/seri geri). Liste PRT filtresi rezerve_eden dahil.
//   v1.2.54 — APP_VERSION → V31.05. Part 2 (2.2): süreç ilerletme motoru —
//             Hazırla/Fatura Kesildi/Cihaz Gönderildi butonları + geçiş + log.
//   v1.2.53 — APP_VERSION → V31.04. Part 2 (2.1): yetki.js'e 4 izin
//             (surec_ilerlet/imei_eslestir/sevk/imei_gor). Seri sepet_id SQL ayri.
//   v1.2.52 — APP_VERSION → V31.03. Rezervasyon olayları artık HER KALEM için
//             urun_id + Müşteri + Satan ile loglanır (ürün geçmişi doldu).
//   v1.2.51 — APP_VERSION → V31.02. Stok geçmişi modülü: openDonanimTimeline
//             stok_hareketleri kayıtlarını ürün bazında modalda gösterir.
//   v1.2.50 — APP_VERSION → V31.01. Stok listesi tazeleme fix: Stok sekmesine
//             geçişte + onay/red/iptal sonrası loadDonanimListesi çağrılır.
//   v1.2.49 — APP_VERSION → V31.00. Rezervasyon paket düzenleme (1.3):
//             cihaz ekle/çıkar/adet; durum-farkında stok (Ön Rez=on_rezerve,
//             Onaylandı=rezerve, artış müsait ön-kontrol). Track A tamam.
//   v1.2.48 — APP_VERSION → V30.99. Rezervasyon yaşam döngüsü (1.1/1.2):
//             Ön rez. RED (on_rezerve geri) + onaylı rez. İPTAL (rezerve geri).
//   v1.2.47 — APP_VERSION → V30.98. Stok transfer (Adım 3): 1./2. onay,
//             red, iptal + stok taşıma (kaynak-, hedef+) + timeline + guard.
//   v1.2.46 — APP_VERSION → V30.97. Transfer sekmesi görünürlüğü yetkiyle
//             sınırlandı (talep/onay izni yoksa gizli — MY/FMY görmez).
//   v1.2.45 — APP_VERSION → V30.96. Stok transfer (Adım 2): Transfer sekmesi,
//             Yeni Talep modalı, talep listesi. Onay/taşıma Adım 3'te.
//   v1.2.44 — APP_VERSION → V30.95. Stok transfer (Adım 1): yetki.js'e
//             3 izin eklendi (transfer_talep/onay1/onay2). Tablo SQL ayrı.
//   v1.2.43 — APP_VERSION → V30.94. Donanım rezervasyon onay yetkisi
//             getScope('donanim_takip')'e bağlandı (sabit rol listesi kaldırıldı).
//   v1.2.42 — APP_VERSION → V30.93. yetki.js: Rol&Yetki ekranına
//             'donanim_takip' (Süreç Takibi) modül etiketi eklendi.
//   v1.2.41 — APP_VERSION → V30.92. Donanım rezervasyon kartına 3 alan:
//             Müşteri (ncst→unvan), Müşterinin MY'si, Rezerve eden.
//   v1.2.40 — APP_VERSION → V30.91. Donanım rezervasyon DETAY modalı:
//             embedded FK join (400) 2 ayrı sorguya bölündü.
//   v1.2.39 — APP_VERSION → V30.90. Donanım rezervasyon onay yetkisi:
//             Takım Lideri kendi ekibinin (bagliMyIds) sattığı Ön
//             Rezervasyonları onaylayabilir. Yetki tek noktaya
//             (_donanimRezOnayYetkisi) taşındı + savunmacı guard.
//   v1.2.38 — APP_VERSION → V30.89. Donanım: tekil kart butonu kaldırıldı,
//             KÇM filtresinin altına tek 'Rezervasyon' butonu kondu. Onay/
//             kesinleştirme akışı eklendi (Ön Rezervasyon -> Rezervasyon,
//             SADECE bu adımda stoktan düşer). tum_kcm ürün desteği
//             (KÇM'den bağımsız her yerde görünür). TL scope KÇM'ye düşürüldü.
//   v1.2.37 — APP_VERSION → V30.88. Donanım: Süreç Takip ekranı (Rezervasyonlar
//             sekmesi) + kademeli KÇM→Takım Lideri→MY seçimi (MY kendisi girince
//             gizlenir). Yeni scope: donanim_takip (MY=kendi, TL/Müdür=KÇM,
//             Admin/Depo/Direktör=TÜM). marka NOT NULL bug'ı düzeltildi.
//   v1.2.36 — APP_VERSION → V30.87. Donanım: Ön Rezervasyon sepet mekanizması
//             (MY/FMY çoklu ürün seçip müşteri+satan MY ile tek talep oluşturur).
//             Yeni izin: donanim_on_rezerve_et. on_rezerve_adet artar, stok
//             görünürlüğü/musait_adet DEĞİŞMEZ (kesinleşme sonraki fazda).
//   v1.2.35 — APP_VERSION → V30.86. KRİTİK FIX: Excel stok yüklemesi hiçbir
//             kayıt yazmıyordu (kısmi unique index ON CONFLICT ile uyumsuzdu,
//             hata sessizce yutuluyordu). Artık: (1) tam unique constraint,
//             (2) rapor gerçek DB yazma sonucuna göre kuruluyor, hata varsa
//             açıkça gösteriliyor, asla yanlış 'yüklendi' demiyor.
//   v1.2.34 — APP_VERSION → V30.85. Donanım: ERP uyumlu Excel toplu stok
//             yükleme (Seri No bazlı, malzeme_kodu ile eşleşme, kelime-bazlı
//             arama). Kart görünümü artık aciklama bazlı (marka/model zorunlu değil).
//   v1.2.33 — APP_VERSION → V30.84. Donanım Takip modülü (MVP) eklendi:
//             stok listesi + KÇM/marka/model filtre görüntüleme (donanim.js).
//             Ekleme/rezervasyon formları sonraki adımda.
//   v1.2.32 — APP_VERSION → V30.83. Veri Sağlığı: çift kayıt TESPİTİ (temas +
//             fırsat + görev, 10 dk penceresi, son 30 gün). Sadece listeleme.
//   v1.2.31 — APP_VERSION → V30.82. ÇİFT KAYIT FIX: saveTemas başarı yolunda
//             kilit navigasyona kadar açılmıyor (hızlı çift-tık ikinci insert'i
//             oluşturamaz). + Temas seçim-anı kontak doğrulama (V30.81).
//   v1.2.30 — APP_VERSION → V30.81. Adim 4: ziyaret VE firsat girisinde secili
//             kontak dogrulama. dogrulandi=false ise kayit durur, kontak karti
//             acilir, tamamlanir. Bellekten kontrol (ekstra sorgu yok).
//   v1.2.29 — APP_VERSION → V30.80. Kontak veri kalitesi kapisi: kontak karti
//             ad-soyad/telefon/email/kontak-tipi dogrulamasi (veri_kalitesi.js),
//             musteri unvani donuk saklama, telefon maskesi, dogrulandi bayragi.
//   v1.2.28 — APP_VERSION → V30.79. 11 sabit yetki karari hasPerm()'e cevrildi
//             (evrak_onayla, mudur_onay, firsat_iptal_onay, gorev_tumunu_gor,
//             portfoy_yukle, temas_yonetici_duzenle, yonetici_tam). Artik DB'den.
//   v1.2.27 — APP_VERSION → V30.78. temas.js loadTemasDashboard MY/FMY kirilimi:
//             BAGLI kapsamli rol (TAKIM LIDERI/CST) icin kirilim artik kendi
//             ekibinden (bagliMyIds) hesaplaniyor; tum KCM yerine.
//   v1.2.26 — APP_VERSION → V30.77. Yeni scope kodu PRT+ (kendi kayitlari +
//             kendi portfoyune baskasinin girdigi kayitlar). applyScope destegi.
//   v1.2.25 — APP_VERSION → V30.76. YETKİ TEK NOKTA: users.role kolonu kaldırılıyor.
//             Koddaki tüm ||currentUser.role / ||u.role fallbackleri temizlendi;
//             admin.js role DB yazımı ve auth.js/hedef.js role SELECT edilmesi kaldırıldı.
//   v1.2.24 — APP_VERSION → V30.75. loadMusteriOzetler özet sayacında FMY unutulması
//             düzeltildi (musteri.js v1.1.8). FMY müşteri ekranında tüm KÇM sayısı
//             yerine kendi portföy sayısını görür. Kod değişikliği yalnızca musteri.js.
//   v1.2.23 — APP_VERSION → V30.74. Müşteri listesi MY/FMY için portföye daraltıldı
//             (auth.js v1.2.12, musteri.js v1.1.7).
//   v1.2.22 — APP_VERSION → V30.73. Temas/Fırsat formu müşteri aramasında
//             vergi_no ile arama düzeltmesi (kod musteri.js v1.1.6).
//             config yalnız sürüm damgası.
//   v1.2.18 — APP_VERSION → V30.67 (rapor 'q.in' thenable fix + penetrasyon kartı).
//   v1.2.21 — APP_VERSION → V30.72. MY/FMY temas formu müşteri arama KÇM scope
//             düzeltmesi (kod auth.js). config yalnız sürüm damgası.
//   v1.2.20 — APP_VERSION → V30.71. 'Yeni Temas eski kayıt açıyor' regresyon
//             düzeltmesi (kod temas.js). config yalnız sürüm damgası.
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
const APP_VERSION = 'V31.31';
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

// ============================================================
// YETKİ KATMANI ARTIK DATABASE'DEN GELİYOR (v1.2.25 / V30.76)
// ------------------------------------------------------------
// Sabit PERM objesi KALDIRILDI. Rol listesi ve rol→yetki eşlemesi
// yalnızca DB'de yönetilir:
//     public.roles             → rol listesi
//     public.role_permissions  → scope + action izinleri
// yetki.js içindeki loadPermFromDB() login'de window.PERM'i kurar.
// Yönetim: Admin Panel > Rol & Yetki Yönetimi ekranı.
// window.PERM şekli eskisiyle birebir aynıdır; hasPerm/getScope değişmedi.
// ============================================================
window.PERM = window.PERM || { scope: {} };

function hasPerm(perm){
  const r=(currentUser.yetki_seviyesi||'').toUpperCase();
  const allowed=(window.PERM&&window.PERM[perm])||[];
  return allowed.includes(r);
}

function getScope(module){
  const r=(currentUser.yetki_seviyesi||'').toUpperCase();
  const scopeMap=(window.PERM&&window.PERM.scope&&window.PERM.scope[module])||{};
  return scopeMap[r]||'PRT';
}

// Bağlı kullanıcıların my_id listesini döndür
// TL ve ÇST: kendine bağlı MY/FMY'lerin id'leri
// ÇSU: kendine bağlı ÇST'lerin + o ÇST'lere bağlı MY/FMY'lerin id'leri
let bagliMyIds = []; // login sonrası doldurulur

async function loadBagliMyIds(){
  if(!currentUser) return;
  const r=(currentUser.yetki_seviyesi||'').toUpperCase();
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
  // v30.77: PRT+ = kendi girdiği VEYA kendi portföyündeki müşteriye girilen kayıtlar
  // (çapraz görünürlük). musteri modülünde karşılığı sadece kendi portföyüdür.
  if(scope==='PRT+'){
    if(module==='musteri') return q.eq('my_id', currentUser.my_id);
    const _mid=currentUser.my_id;
    return q.or(`${prefix}my_id.eq.${_mid},musteri_my_id.eq.${_mid}`);
  }
  // PRT: yalnızca kendi girdiği kayıtlar
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