// ============================================================
// donanim.js — v1.0.54 (V31.136)
//   v1.0.54 (V31.136): Stok Hareket Raporu Excel'e Aktar artık TEK dosyada
//     7 sayfa üretiyor: Stok Hareketleri (aynen), Cihaz Giriş - Detay/Özet
//     (stok_seri_no + stok_urunleri, tarih aralığı created_at bazlı),
//     Cihaz Çıkış - Detay/Özet (durum='Satıldı', updated_at bazlı, müşteri
//     + satan MY ile), Rezerve Cihazlar - Detay/Özet (durum='Ayrıldı',
//     ANLIK durum — tarih filtresine bağlı değil; KÇM + satan MY + müşteri
//     + kısa rezervasyon ID ile). Yeni yardımcılar:
//     _donanimSeriListesiUrunBilgisiyle, _donanimOzetGrupla.
// donanim.js — v1.0.53 (V31.135)
//   v1.0.53 (V31.135): YENİ ÖZELLİK — Stok Hareket Raporu (openDonanimHareketRaporu):
//     stok_hareketleri tablosundaki tüm kayıtları tarih/aksiyon tipi/ürün
//     arama filtreli listeler (Stok sekmesi, ayrı yetki: donanim_hareket_raporu_gor).
//     Hem bu rapor hem Mutabakat Raporu artık "📥 Excel'e Aktar" ile .xlsx
//     indirilebiliyor (donanimHareketRaporuExcelIndir, donanimMutabakatExcelIndir).
// donanim.js — v1.0.52 (V31.133)
//   v1.0.52 (V31.133): Mutabakat Raporu için ayrı yetki anahtarı — önceden
//     genel donanim_yonet'e bağlıydı, Rol&Yetki ekranında kendi maddesi
//     yoktu. Artık donanim_mutabakat_gor (yetki.js) ile ayrı yönetiliyor.
// donanim.js — v1.0.51 (V31.132)
//   v1.0.51 (V31.132): TALEPLER MODÜLÜ KRİTİK GÜVENLİK AÇIĞI KAPATILDI —
//     "Karşılandı" butonu önceden hiçbir kontrol yapmadan sadece durum
//     yazısını değiştiriyordu; cihaz gerçekten stoğa girmese/transfer
//     edilmese de talep kapatılabiliyordu (cihazlar pahalı, bu ciddi risk).
//     Artık iki şart doğrulanmadan kapatılamıyor: (1) talep eden KÇM'nin
//     deposunda gerçekten yeterli müsait adet var mı, (2) bu ürün için
//     sistem geneli mutabakat (SUM(toplam_adet) tüm KÇM'ler = IMEI sayısı)
//     bozuk mu. DB: stok_mutabakat_v view'ı eklendi (Oktay tarafından).
//     YENİ EKRAN: Talepler sekmesine "📊 Mutabakat Raporu" — her ürün için
//     sistem adedi vs IMEI sayısını karşılaştırır, uyuşmazlıkları üstte
//     kırmızı gösterir (openDonanimMutabakat, donanimMutabakatModal).
// donanim.js — v1.0.50 (V31.131)
//   v1.0.50 (V31.131): Geçmiş (Timeline) ve kart iyileştirmeleri:
//     (1) Hareket loglarına artık ürün adı yazılıyor (önceden sadece adet
//     yazıyordu, hangi cihaz olduğu hiç görünmüyordu). (2) IMEI Eşleştirme
//     olaylarında bağlanan IMEI'ler de loglanıyor (donanimImeiKaydet + SVK).
//     (3) "Fatura Kesildi" adımına fatura numarası ZORUNLU alan olarak
//     eklendi — hem normal akışta (prompt) hem Hızlı Sevkiyat Konsolu'nda
//     (metin kutusu); DB: stok_rezervasyonlari.fatura_no (text, Oktay
//     tarafından eklendi). (4) openDonanimRezTimeline artık üstte sepetin
//     tam özetini (ürünler+adet+IMEI+müşteri+fatura no) gösteriyor, altında
//     da aynı olayın birden fazla üründen gelen tekrarlarını tek karta
//     topluyor (aksiyon+kullanıcı+aynı dakika ile gruplama). (5) Rezervasyon
//     kartına "Adım N/7: <durum>" başlığı + "🕓 sırada ne var/kim bekleniyor"
//     satırı + varsa fatura no rozeti eklendi (DONANIM_BEKLEYEN haritası).
// donanim.js — v1.0.49 (V31.130)
//   v1.0.49 (V31.130): YENİ ÖZELLİK — Rezervasyon kartlarına görünür kısa ID
//     (REZ-XXXXXXXX) ve "📜 Geçmiş" butonu eklendi (openDonanimRezTimeline).
//     _donanimRezHareketLog artık stok_hareketleri satırlarına sepet_id de
//     yazıyor (DB: sepet_id uuid null kolonu eklendi), böylece bir
//     rezervasyonun geçmişi ürün bazlı değil sepet_id bazlı, karışmadan
//     filtrelenebiliyor. Eski (bu tarihten önceki) hareket kayıtlarında
//     sepet_id boş — bilinen/beklenen durum.
// donanim.js — v1.0.48 (V31.126)
//   v1.0.48 (V31.126): KÖK NEDEN FİX — donanimTransferOnay2 (KÇM'den KÇM'ye
//     stok transferi 2. onay), hedef KÇM'de o ürün için satır yoksa yeni
//     satır açarken depo_id HİÇ YAZMIYORDU (sadece kcm_id yazılıyordu) ve
//     hedef satırı ararken depo_id yerine serbest metin olan depo_adi ile
//     eşleştiriyordu. Bu, transfer sonrası hedefte "hiçbir depoya bağlı
//     olmayan" (depo_id NULL) yetim stok satırları oluşturuyordu — tam da
//     veritabanında temizlediğimiz sorunun kod tarafındaki kaynağı. Artık
//     hedef KÇM'nin kayıtlı ANA depo_id'si _donanimAnaDepoId() ile çözülüyor,
//     hedef satırı bu depo_id ile aranıyor ve yeni satır depo_id doluyla
//     açılıyor. Hedef KÇM'nin kayıtlı bir ANA deposu yoksa transfer iptal
//     edilip kaynak stok geri alınıyor (yetim satır oluşmasına izin
//     verilmiyor).
// donanim.js — v1.0.47 (V31.125)
//   v1.0.47 (V31.125): UI FIX — Hızlı Sevkiyat Konsolu (SVK) "Cihazlar" adımında
//     seçilen ürünün adet kutusu, ürün adının üzerine biniyordu. Kök neden CSS
//     özgüllük çakışması (main.css: .svk-govde input[type=number]{width:100%}
//     kuralı .svk-kalem input{width:58px}'i eziyordu) — kod tarafında değişiklik
//     yok, sadece css/main.css düzeltildi (bkz. main.css .svk-govde .svk-kalem
//     input[type=number]).
// donanim.js — v1.0.46 (V31.124)
//   v1.0.46 (V31.124): BUG FİX (devam — V31.123 kapsamı genişletildi) — Stok
//     listesi ekranında (MY/FMY kartları, `_donanimStokListesiGetir`) Merkez
//     (Havuz) satırı hâlâ ham toplam_adet/musait_adet gösteriyordu; bu rakam
//     hem "kaç adet müsait" yazısını hem rezervasyon/sepet adedinin ÜST
//     SINIRINI belirlediği için, zaten bir KÇM'e dağıtılmış stoktan tekrar
//     rezervasyon yapılabiliyordu. Artık Merkez satırları için o malzeme
//     kodunun diğer (KÇM) depolarındaki toplamı ayrı bir sorgu ile çekilip
//     gerçek kalan (havuz - dağıtılan) hesaplanıyor ve toplam/müsait adet
//     buna göre düzeltiliyor.
//     NOT: Hızlı Sevkiyat Konsolu'nun (SVK) cihaz arama sorgusu, sadece
//     "ortak stok" (tum_kcm) işaretli Merkez satırlarında aynı riski
//     taşıyabilir — bu turda KAPSAM DIŞI, ayrı ele alınacak.
// donanim.js — v1.0.45 (V31.123)
//   v1.0.45 (V31.123): BUG FİX — Merkez (Havuz) deposu, Dağıtım Izgarası'ndan
//     bir KÇM'e dağıtım yapıldığında hiç azalmıyordu (havuz toplam_adet'i
//     kasıtlı olarak sabit "tavan" kalıyor). Ama Depo modülü kartları, Depo
//     detay modalı ve Stok Raporu bu ham tavanı "Merkez'de şu an fiilen
//     bulunan miktar" gibi gösterip dağıtılan miktarı hem Merkez'de hem
//     hedef KÇM'de ÇİFT SAYIYORDU (örn. Merkez 22, KÇM'ye 11 dağıtılmış →
//     ekranlar 22+11=33 gösteriyordu, oysa gerçek toplam 22). Üç ekran de
//     artık Merkez için ham toplam yerine gerçek kalan (havuz - dağıtılan)
//     gösteriyor: _donanimIzgaraVeri (kart özeti), _donanimDepoDetayRender
//     (detay modalı), _donanimRaporVeri (Stok Raporu tablosu/Excel).
//     NOT: Stok listesi ekranındaki (MY/FMY kartları) Merkez satırının ham
//     müsait adedi — ki rezervasyon butonunu da etkiliyor — bu turda
//     KAPSAM DIŞI bırakıldı, ayrıca ele alınacak.
// donanim.js — v1.0.44 (V31.122)
//   v1.0.44 (V31.122): BUG FİX — Donanım Takip rozeti Transfer taleplerini
//     (stok_transfer_talepleri) hiç saymıyordu; Aşama 1/Aşama 2 onayı bekleyen
//     transfer talepleri bildirime hiç yansımıyordu. _donanimBadgeGuncelle()'a
//     eklendi (donanim_transfer_onay1 + kaynak KÇM kapsamı, donanim_transfer_onay2).
//     Transfer onay/red/iptal/yeni-talep işlemlerinden sonra da rozet artık
//     hemen güncelleniyor.
// donanim.js — v1.0.43 (V31.121)
//   v1.0.43 (V31.121): Rezervasyon listesi sıralaması eklendi — kendinden
//     onay/eylem bekleyen kayıtlar adımı ne olursa olsun HER ZAMAN en üstte;
//     onun altında aktif (devam eden) kayıtlar, sonra Tamamlandı, Reddedildi,
//     Süresi Doldu, en altta İptal (aynı grupta en yeni üstte). Filtrelerden
//     SONRA, render'dan ÖNCE uygulanır (_donanimBenimOnayimBekliyorMu,
//     _donanimDurumSiraGrubu).
// donanim.js — v1.0.42 (V31.120)
//   v1.0.42 (V31.120): Rezervasyon ekranına filtreler eklendi (KÇM — yalnız
//     TÜM kapsamında, MY/FMY isim arama, süreç adımı, ödeme tipi, tarih
//     aralığı — donanimRezFiltreDegistiDebounce/donanimRezFiltreTemizle).
//     Ayrıca her kartın altına, mevcut adıma kadar dolu kalan kısmı siyah
//     kutucuklardan oluşan renkli bir süreç özet barı eklendi (mor→kırmızı→
//     turuncu→sarı→yeşil gradyanı, DONANIM_ADIM_RENK); kart çerçevesi artık
//     tüm kenarlarda bu gradyan rengiyle çiziliyor (_donanimSurecBarHTML).
// donanim.js — v1.0.41 (V31.119)
//   v1.0.41 (V31.119): BUG FİX — Turkcell Finans Onayı ile Fatura Kesildi TEK
//     butonda birleşmişti: finans onaycısı butona basınca durum doğrudan
//     'Fatura Kesildi'ye atlıyordu, Depo&Muhasebe ekranında AYRI bir "Fatura
//     Kesildi" adımı hiç görünmüyordu (yalnız "Cihaz Gönderildi" görünüyordu,
//     rozet de bu adımda hiç oluşmuyordu). Aralarına yeni 'Finans Onaylandı'
//     ara durumu eklendi: finans onaycısı yalnız finans onayını verir,
//     Depo&Muhasebe/Admin (donanim_sevk) ayrı adım olarak önce "Fatura
//     Kesildi"yi, sonra "Cihaz Gönderildi"yi işaretler. Rozet ve iptal/süre
//     listeleri, Hızlı Sevkiyat Konsolu da yeni ara duruma göre güncellendi.
// donanim.js — v1.0.40 (V31.118)
//   v1.0.40 (V31.118): BUG FİX — _donanimBadgeGuncelle() yalnız Ön
//     Rezervasyon/Yönetici Onayı Bekliyor durumlarını sayıyordu; Emei Girişi
//     (Onaylandı/Stok Onay Emei Giriş), Turkcell Finans Onay ve Fatura
//     Kesildi (sevk) bekleyenler hiç sayılmıyordu — bu yüzden Depo&Muhasebe
//     ve finans onaycılarında rozet hiç çıkmıyordu. Artık süreçteki HER
//     "birinin eylemini bekleyen" adım, o adımın kendi yetkisi+kapsamıyla
//     ayrı ayrı sayılıyor.
// donanim.js — v1.0.39 (V31.117)
//   v1.0.39 (V31.117): İKİ değişiklik —
//     (1) Modül her açıldığında ilk ekran artık Rezervasyon sekmesi
//     (initDonanimPage artık loadDonanimListesi yerine loadDonanimRezervasyonlar
//     çağırıyor). index.html'de donanimRezSekme varsayılan görünür,
//     donanimStokSekme varsayılan gizli + sekme butonlarının aktif/ghost
//     durumu buna göre değiştirildi.
//     (2) IMEI seçimi artık Turkcell Finans Onay'dan ÖNCE, "Stok Onay / Emei
//     Giriş" adımının KENDİSİNDE yapılıyor (önceden yalnız düz onay tuşuydu,
//     gerçek IMEI eşleştirme ekranı Finans Onay sonrasına kalıyordu — Oktay'ın
//     talebiyle sıra değişti). "Stok Onay / Emei Giriş" butonu artık doğrudan
//     donanimImeiEslestirAc() açıyor; talep edilen TÜM cihazların IMEI'leri
//     girilene kadar durum 'Stok Onay Emei Giriş'te kalır ("Emei Girişine
//     Devam Et" ile tamamlanabilir), tümü eşleşince otomatik 'Turkcell Finans
//     Onay'a geçer. Bu sayede seçilen IMEI'ler Finans Onay dahil sonraki tüm
//     ekranlarda (stok_seri_no.sepet_id üzerinden) görünür oluyor. Eski
//     'Kısmen Eşleştirildi'/'Eşleştirildi' ara durumları artık normal akışta
//     üretilmiyor (geriye dönük uyumluluk için haritalarda tutuluyor — eski
//     kayıtlar ve Hızlı Sevkiyat Konsolu'nun yarıda kalmış çalışmaları için).
// donanim.js — v1.0.38 (V31.116)
//   v1.0.38 (V31.116): Ana menü Donanım Takip rozeti artık yöneticinin
//     onayını/reddini bekleyen kayıtları da sayıyor (_donanimBadgeGuncelle) —
//     Ön Rezervasyon (donanim_rezerve_et) + Yönetici Onayı Bekliyor/mükerrer
//     talep (donanim_mukerrer_onay). Onay veya red verilene kadar sayı kalır.
// donanim.js — v1.0.37 (V31.115)
//   v1.0.37 (V31.115): ACİL FIX — "null value in column kcm_id" hatası.
//     donanimSepetGonder() kcm_id'yi ürünün depo satırından (item.urun.kcm_id)
//     alıyordu; Merkez/ortak havuz satırlarında bu alan NULL olduğu için ortak
//     stoktan sipariş verilince INSERT patlıyordu (stok_rezervasyonlari.kcm_id
//     NOT NULL). Artık Hızlı Sevkiyat Konsolu'yla (S.my.kcm_id) AYNI desen:
//     kcm_id satan MY'nin kendi KÇM'sinden alınıyor — hiçbir zaman null olmaz.
//   NOT: Oktay'ın bildirdiği "iptal edilen ortak stok cihazı KÇM 1'e geri
//     döndü gibi görünüyor" bulgusu AYRI bir konu — muhtemelen Stok listesinin
//     "ortak" gösterimi, aynı malzeme_kodu için KÇM'nin kendi depo satırı ile
//     Merkez havuz satırını "hangisinde daha çok müsait adet varsa onu göster"
//     mantığıyla birleştiriyor (_donanimListeBirlestir, ~satır 535) — yani
//     ekranda "ortak stok" görünen satır bazen aslında belirli bir KÇM'nin
//     kendi depo satırı olabilir. Bu round'da DOKUNULMADI, teyit için SQL
//     kontrolü gerekiyor (bkz. proje dokümanı madde 10).
// donanim.js — v1.0.36 (V31.114)
//   v1.0.36 (V31.114): DONANIM SATIŞ SÜREÇ AKIŞI V2 — kural değişikliği.
//     • Ön Rezervasyon artık cihazı DOĞRUDAN rezerve_adet'e düşürür (eski:
//       sadece on_rezerve_adet artardı, stok görünürlüğü değişmezdi).
//     • Ön Rezervasyon süresi 6 iş saati (sistem_ayarlari.donanim_onrez_sure_saat),
//       KÇM Müdürü/TL/Depo&Muhasebe/Admin tarafından +6 saat (max N kez) uzatılabilir
//       (donanim_onrez_uzat), süre dolarsa cihaz otomatik stoğa döner (_donanimOnRezSupur).
//     • Aynı müşteri+ürün için aynı gün 2. (veya sonraki) ön rezervasyon talebi
//       otomatik "Yönetici Onayı Bekliyor" olur — Takım Lideri VEYA KÇM Müdürü
//       onaylar (donanim_mukerrer_onay, donanimMukerrerOnayla).
//     • "Hazırlanıyor" adımı KALKTI. Yeni akış: Ön Rezervasyon → (Yönetici Onayı
//       Bekliyor) → Onaylandı (Rezervasyon Onayı) → Stok Onay/Emei Giriş
//       (donanim_emei_giris) → Turkcell Finans Onay (donanim_finans_onay) →
//       Emei Eşleştirme (donanim_imei_eslestir — artık geniş grup: KÇM Müdürü/
//       TL/Depo/Satış Destek/Admin) → Fatura Kesildi → Tamamlandı (donanim_sevk).
//     • Yeni DONANIM_SUREC_ADIMLARI (8 adım) + Hızlı Sevkiyat Konsolu aynı
//       zincire güncellendi.
//     NOT: Excel/havuz IMEI eşleştirme ekranında bazı KÇM siparişlerinde cihaz
//     listesinin gelmemesi (havuz/malzeme_kodu eşleşme sorunu) ayrı bir veri
//     sorunu — bu round'da dokunulmadı, ayrıca incelenecek.
// donanim.js — v1.0.35 (V31.111)
//   v1.0.35 (V31.111): Talepler sekmesindeki "➕ Yeni Talep" butonu artık
//     MY/FMY'de de görünüyor (donanim_on_rezerve_et) — asıl ihtiyaç sahibi
//     onlar, önceden sadece Depo & Muhasebe'ye (donanim_yonet) açıktı.
//     Gönderim tarafı (donanimTalepModalAc/donanimTalepGonder) zaten V31.98'de
//     bu iki yetkiyi de kabul ediyordu, sadece buton görünürlüğü dardı.
//   v1.0.34 (V31.98): Talepler > Yeni Talep akışı GERÇEK sepet mantığına
//     çevrildi. Önceki sürümde ürün seçilince doğrudan tek-ürün gönderim
//     modalı açılıyordu; şimdi seçilen ürün window._donanimTalepSepet.items
//     listesine EKLENİYOR ve aynı modal (donanimTalepModal) artık bu listeyi
//     gösteriyor, altında "+ Ürün Ekle" ile tekrar ürün seçim ekranına
//     dönülüp yeni ürün eklenebiliyor. Her satırın kendi adet kutusu var,
//     silme (✕) ile satır çıkarılabiliyor. Müşteri seçimi ve gönderim tüm
//     sepet için tek seferde yapılıyor — donanimTalepGonder() artık sepetteki
//     her ürün için ayrı stok_tedarik_talepleri + stok_hareketleri satırı
//     oluşturuyor. Stok sekmesindeki tekli "🛒 Talep Et" kartı da (aynı
//     donanimTalepModalAc fonksiyonu üzerinden) artık aynı sepete ekliyor —
//     iki giriş noktası (Stok kartı / Talepler ekranı) tek sepet akışında
//     birleşti. donanimTalepAdet global input'u kaldırıldı (adet artık
//     satır başına).
// donanim.js — v1.0.33 (V31.97)
//   v1.0.33 (V31.97): Hızlı Sevkiyat kısayolu Ana Menü'den kaldırıldı, Donanım
//     Takip içine taşındı. Stok sekmesinin en üstüne yeni bir kısayol eklendi
//     (donanimStokSvkKisayol) — Rezervasyon sekmesindeki (donanimRezSvkKisayol)
//     zaten oradaydı, ikisi de aynı koşulla görünür (donanim_yonet+donanim_sevk).
//     "+ Yeni Ürün Ekle" / "Excel ile Stok Yükle" butonları da tüm sekmelerde
//     sabit üstten kaldırılıp sadece Stok sekmesine taşındı (index.html).
//     AYRICA: (1) Rezervasyon sekmesine "📌 Yeni Rezervasyon" eklendi — Stok
//     sekmesindeki 📌 Rezervasyon tuşuyla birebir aynı akışı (seçim moduna
//     geçiş) tetikler. (2) Talepler sekmesine "➕ Yeni Talep" eklendi — stokta
//     olmayan (musait_adet<=0) ürünleri listeleyen yeni bir seçim ekranı
//     açar, seçilen üründe MEVCUT tek-ürün Talep modalını (donanimTalepModalAc)
//     aynen açar; talep akışının kendisi değişmedi. Bu ekrana Depo & Muhasebe
//     (donanim_yonet) de girebilsin diye donanimTalepModalAc/donanimTalepGonder
//     içindeki yetki kontrolü donanim_on_rezerve_et VEYA donanim_yonet oldu.
//     loadDonanimListesi'nin sorgu+birleştirme mantığı _donanimStokListesiGetir()
//     adıyla ayrı fonksiyona çıkarıldı (Yeni Talep ekranı da kullanıyor,
//     "Sadece stokta olanlar" anahtarından bağımsız, sadeceStok:false ile).
//     (3) css/main.css: Depolar sekmesi genişleyince (.page.genis) artık
//     sadece alttaki dağıtım ızgarası genişliyor — üst bölüm (başlık çubuğu +
//     sekme şeridi) diğer sekmelerle aynı 480px ölçüsünde kalıyor.
// donanim.js — v1.0.32 (V31.66)
//   v1.0.32 (V31.66): Sekme seridi SABIT iki satira alindi.
//     Ust satir: Depolar, Stok (envanter) — Alt satir: Rezervasyon,
//     Transfer, Talepler (surec kuyruklari). Satir kirilimi ekran
//     genisliginden bagimsiz oldugu icin sekmeler artik hicbir gecisde
//     yer degistirmiyordu. Onceki durumda Depolar sekmesi sayfayi
//     genislettigi icin serit her gecisde yeniden diziliyor, Talepler
//     bazen alt satirda tam genislikte "baslik" gibi gorunuyordu.
//     Kod degisikligi yok — duzen index.html + css/main.css tarafinda.
// donanim.js — v1.0.31 (V31.65)
//   v1.0.31 (V31.65): Hizli Sevkiyat artik Donanim SEKMESI degil, ANA MENUDE
//     kendi sayfasi (pageSevkiyat). Gerekce: diger bes sekme birer GORUNUM
//     ("neye bakiyorum"), Hizli Sevkiyat ise bastan sona yurutulen bir IS.
//     Ayrica Depo & Muhasebe'nin gunluk ana isi — ana menuden tek dokunus.
//     Menu kutusu donanim_yonet VE donanim_sevk yetkisinde gorunur (auth.js).
//     Rezervasyon sekmesinin ustunde ikinci bir kapi: kisayol dugmesi;
//     bu ekranin urettigi kayit zaten o listeye dustugu icin baglam orada.
//     Sekme cubugu: "Rezervasyonlar" -> "Rezervasyon", flex-wrap emniyet agi.
//     loadDonanimSvkSekme -> initSevkiyatPage olarak yeniden adlandirildi.
// donanim.js — v1.0.30 (V31.64)
//   v1.0.30 (V31.64): HIZLI SEVKIYAT KONSOLU — Depo & Muhasebe icin tek
//     ekranda MY -> musteri -> satis tipi -> cihaz -> IMEI -> fatura -> sevk.
//     Yeni sekme: donanim_yonet VE donanim_sevk yetkisi olanda gorunur.
//     Kayit tum surec adimlarindan SIRAYLA gecer; paralel yazma yolu
//     acilmaz. Sayaclar klasik akisla ayni sirayla hareket eder ve
//     stok dusumu V31.63'teki ortak _donanimSevkStokDus ile yapilir.
//     Bir adim hata verirse zincir orada durur, kayit o durumda kalir,
//     kullanicilya nerede kaldigi soylenir; IMEI baglama yarim kalirsa
//     baglanan seriler havuza iade edilir.
//     Yeni: initSevkiyatPage (V31.64'te loadDonanimSvkSekme), donanimSvkTamamla
//     ve _svk* yardimcilari.
// donanim.js — v1.0.29 (V31.63)
//   v1.0.29 (V31.63): İKİ GERÇEK HATA DÜZELTİLDİ.
//   A) SEVKİYAT ARTIK STOKTAN DÜŞÜYOR. 'Cihaz Gönderildi' adımı yalnızca
//      durum alanını güncelliyordu; cihaz depoda görünmeye devam ediyordu.
//      Artık: stok_urunleri.toplam_adet -adet, rezerve_adet -adet,
//      o sepete bağlı IMEI'ler 'Ayrıldı' -> 'Satıldı', gerceklesen_adet
//      yazılır. Koşullu durum güncellemesi .select() ile kilit görevi görür:
//      0 satır dönerse (başkası aynı anda sevk etmişse) düşüm YAPILMAZ.
//      Yeni: _donanimSevkStokDus.
//   B) IMEI EŞLEŞTİRME ARTIK HAVUZDAN (Faz 7). Excel yüklemesi tüm
//      IMEI'leri MERKEZ katalog satırının urun_id'sine yazıyor; rezervasyon
//      ise KÇM depo satırını işaret ediyor. Eşleştirme rezervasyonun
//      urun_id'siyle aradığı için KÇM siparişlerinde HİÇ IMEI bulunamıyordu.
//      Artık malzeme_kodu üzerinden havuz satırına çevrilir.
//      Yeni: _donanimHavuzUrunId (önbellekli).
//   NOT: Sevk edilmiş kayıt olmadığı doğrulandı (0 sipariş), geriye dönük
//        veri düzeltmesi gerekmedi.
// donanim.js — v1.0.28 (V31.62)
//   v1.0.28 (V31.62): Yeni Ürün Ekle formu Merkez Depo kataloğuna bağlandı.
//     Depo özeti aile başına tek kart oldu; ayrı Ana/Cep düğmeleri seçilen
//     deponun ürün/adet/rezerve/müsait ayrıntısını açar.
//     Yeni: donanimDepoDetayAc, _donanimDepoDetayRender,
//           donanimDepoDetayAraDebounce.
// donanim.js — v1.0.27 (V31.61)
//   v1.0.27 (V31.61): DEPO DAGITIM IZGARASI — Depolar sekmesi yenilendi.
//     Satir = urun, sutun = depo. Depolar AILE halinde: her ailenin ANA
//     deposu ve varsa CEP deposu yan yana, aile arasi kalin ayirici.
//     Merkez ailesinin ANA deposu HAVUZ'dur (yesil, salt okunur).
//     Donmus: iki katli ust baslik, sol urun sutunu, alt TOPLAM satiri.
//     Kayit ANLIK — hucreden cikinca yazilir; ayni urunun hucreleri
//     200 ms toparlanip tek turda gider. Kural ihlali sunucuya gitmez,
//     deger eski haline doner.
//     CEP depolari yalniz donanim_yonet'te gorunur; MY/FMY stok
//     listesinde de cep satiri filtrelenir.
//     Yeni: _donanimDepoAgaci, _donanimIzgaraVeri, _donanimIzgaraCiz,
//       _donanimIzgaraYukseklik, donanimIzgaraYaziliyor,
//       donanimIzgaraHucreKaydet, donanimIzgaraAraDebounce,
//       donanimIzgaraFiltreDegisti, donanimIzgaraExcel ve _izg* yardimcilari.
//     Eski dagitim/rapor MODALLARI kaldirilmadi, sadece dugmeleri kalkti —
//     izgara testten gecince V31.62'de temizlenecek.
// donanim.js — v1.0.26 (V31.60)
//   v1.0.26 (V31.60): Stok sekmesi filtre satiri ikiye bolundu.
//     - "Sadece stokta olanlar" aciklamasi satir icinden TOOLTIP'e tasindi.
//     - YENI "Kendi depom" anahtari (sag yarim): acikken yalnizca kullanicinin
//       kendi ANA deposu listelenir, KCM filtresi devre disi kalir.
//       Gorunurluk: scope=TUM ve (kcm_id var VEYA yetki_seviyesi=ADMIN).
//       kcm_id olmayan ADMIN icin "kendi depo" = MERKEZ DEPO.
//       Depo & Muhasebe gibi kcm_id'si olmayan diger profillerde gorunmez.
//     Yeni: _donanimKendiDepomAcik, donanimKendiDepomDegisti,
//           _donanimKendiDepomGorunurluk, _donanimKcmFiltreKilit.
// donanim.js — v1.0.25 (V31.59)
//   v1.0.25 (V31.59): 48 saat kurali artik IS SAATI olarak sayilir.
//     Hafta sonu (Cmt/Paz) ve resmi tatiller sureyi DURDURUR; yarim gun
//     (arife) tarihlerinde saat 13:00'a kadar sayilir. Bitis damgasi
//     DB'deki is_saati_ekle(p_bas,p_saat) fonksiyonu ile hesaplanir.
//     RPC'ye ulasilamazsa takvim saatiyle (+48s) devam edilir.
//     Yeni: _donanimSureBitisHesapla. Degisen: onay damgasi, donanimSureUzat,
//     _donanimSureRozet (aciklama balonu).
//     SQL: resmi_tatiller tablosu + is_saati_ekle() fonksiyonu.
//     NOT: Onaydan SONRA eklenen bir tatil, o an hesaplanmis rezervasyon_bitis
//     damgasini geriye donuk kaydirmaz.
// donanim.js — v1.0.24 (V31.58)
//   v1.0.24 (V31.58): 48 saatlik rezervasyon suresi — platform bagimsiz.
//     Onay aninda rezervasyon_bitis = now()+48s damgalanir. Kalan sure kartta
//     rozet olarak gorunur (6 saatten az kirmizi, 24 saatten az turuncu).
//     Süre Uzat butonu (+48s) donanim_yonet veya onay yetkisi olanda.
//     Firsatci supurme: stok_sure_dolumu_isle() modul acilisinda, rezervasyon
//     listesinde ve onay oncesinde cagrilir; DB tarafinda 5 dk kisitlama ve
//     advisory lock var. Yeni durumlar: Süresi Doldu, Kısmi Tamamlandı.
//     Yeni: _donanimSureSupur, _donanimSureRozet, donanimSureUzat.
//     SQL: sistem_bakim + stok_sure_dolumu_isle + stok_musait tembel hesap.
// donanim.js — v1.0.23 (V31.57)
//   v1.0.23 (V31.57): MY/FMY gorunurlugu DEPO bazli oldu + tedarik talebi.
//     loadDonanimListesi artik kcm_id yerine depo_id ile kapsam uyguluyor
//     (kullanicinin KCM ANA deposu + tum_kcm ortak stok). Yeni 'Sadece stokta
//     olanlar anahtari (varsayilan ACIK): kapatilinca tum katalog gorunur ve
//     stokta olmayan urun TALEP EDILEBILIR. Yeni Talepler sekmesi: MY kendi
//     taleplerini, donanim_yonet tumunu gorur ve Karsilandi/Reddedildi yapar.
//     Yeni: _donanimDepoHaritasi, _donanimAnaDepoId, _donanimMerkezDepoId,
//     _donanimSadeceStokAcik, donanimSadeceStokDegisti, _donanimListeBirlestir,
//     donanimTalepModalAc, donanimTalepMusteriAramaDebounce,
//     _donanimTalepMusteriAra, donanimTalepMusteriSec, donanimTalepMusteriTemizle,
//     donanimTalepGonder, loadDonanimTalepListesi, donanimTalepDurum,
//     _donanimTalepBadge. SQL: yok (stok_tedarik_talepleri Faz 1 de kuruldu).
// donanim.js — v1.0.22 (V31.56)
//   v1.0.22 (V31.56): Depo Stok Raporu — Depolar sekmesinde pivot rapor
//     (satir=urun, kolon=depo, hucre=adet) + 3 sayfali .xlsx cikti:
//     'Ozet' (pivot), 'Detay' (depo x urun; toplam/rezerve/on rezerve/musait/
//     ortak stok/aktif), 'Depo Ozet' (depo basina urun ve cihaz sayisi).
//     Rapor tamamen ADET bazlidir, IMEI hicbir sayfada yer almaz.
//     'Stogu olmayanlari da goster' anahtari ekran ve Excel'i birlikte etkiler.
//     Yeni: donanimRaporAc, _donanimRaporVeri, _donanimRaporRender,
//     donanimRaporBosDegisti, donanimRaporExcelIndir.
// donanim.js — v1.0.21 (V31.55)
//   v1.0.21 (V31.55): 'Depolar' sekmesi — Depo & Muhasebe dagitim ekrani.
//     Depo agaci (Merkez Depo + her KCM sanal depo + istege bagli birer cep
//     depo), depo bazli ozet kartlari, urun bazli dagitim modali. Merkez ->
//     diger depolara ADET tahsisi (seri/IMEI tasinmaz). Kurallar: toplam
//     dagitim havuzu asamaz; bir deponun tahsisi rezerve+on_rezerve altina
//     inemez (dogrulama TUMU yazilmadan once); adet 0 + rezervasyon yok ->
//     satir silinir; urun pasife alininca ayni malzeme_kodu'nun tum depo
//     satirlari pasif. Ortak stok (tum_kcm) anahtari urun bazinda.
//     SQL: Adim D onceden calistirildi (depolar, depolar_v, stok_urunleri.depo_id).
// donanim.js — v1.0.20 (V31.54)
//   v1.0.20 (V31.54): Excel stok yukleme ANA DEPOYA (cihaz havuzu) yapilir.
//     KCM/depo secimi kaldirildi; hedef her zaman katalog satiri
//     (stok_urunleri.kcm_id IS NULL). IMEI filtresi: yalnizca 15 haneli tam
//     sayisal seriler alinir (18 haneli ICCID vb. atlanir). Katalog satiri
//     SELECT->yoksa INSERT ile bulunur (PostgREST on_conflict kismi indeksi
//     hedefleyemedigi icin upsert kullanilamaz). toplam_adet artirilmaz,
//     'Depoda' seri sayisi olarak YENIDEN SAYILIR (idempotent). Ekran raporu
//     sadelesti (yuklenen+hata+mevcut); atlanan satirlar tek ozet satirinda,
//     tam liste indirilen Excel raporunda. Dosya ici mukerrer seri ayiklanir.
//     Yeni: _donanimSeriTemizle, _donanimImeiMi, _donanimKatalogSatiriBul,
//     _donanimKatalogAdetYenile.
// donanim.js — v1.0.19 (V31.26)
//   v1.0.19 (V31.26): Tedarik akışı bildirimi — Ana menü 'Donanım Takip'
//     ikonunda rozet: kullanıcının kendi (satan/rezerve eden) siparişlerinden
//     'Onaylandı' durumunda olan varsa sayı görünür (_donanimBadgeGuncelle,
//     initApp'te proaktif + Rezervasyonlar listesi her yüklendiğinde günceller).
//     Rezervasyon kartında kullanıcının kendi yeni-onaylanan siparişi turuncu
//     glow + '🔔 Onaylandı' rozetiyle öne çıkar.
// donanim.js — v1.0.18 (V31.25)
//   v1.0.18 (V31.25): Satış Tipi (Peşin/OLM/Turkcell Finansman) — ön rezervasyon
//     olusturmada zorunlu secim, rezervasyon karti + detay + duzenleme
//     modallarinda gosterilir/duzenlenebilir. Rezervasyon karti artik sepet_id
//     bazinda sipariş adimina gore renkli kenarlik alir (DONANIM_SUREC_ADIMLARI).
//     DB: stok_rezervasyonlari.satis_tipi (yeni kolon, kullanicinin calistirmasi
//     gerekir — bkz devir notu).
// donanim.js — v1.0.17 (V31.18)
//   v1.0.17 (V31.18): IMEI maskeleme (2.4) — donanim_imei_gor yetkisi olmayan
//     kullanicilar (MY/FMY vb.) atanmis IMEI'leri ilk4+son4 maskeli gorur.
//     Rezervasyon detayina atanan cihaz (IMEI) listesi eklendi (maskeli/tam).
// donanim.js — v1.0.16 (V31.10)
//   v1.0.16 (V31.10): IMEI modal acilista bostaki serileri otomatik listeler.
// donanim.js — v1.0.15 (V31.09)
//   v1.0.15 (V31.09): IMEI eslestirme modali (2.3) — barcode+arama, urun_id
//     (KÇM) kilidi, kismi eslestirme, seri durum Depoda->Ayrildi + kompanzasyon.
// donanim.js — v1.0.14 (V31.06)
//   v1.0.14 (V31.06): MY (rezerve eden) her aktif adimda kendi kaydini iptal
//     eder; iptal stok/seri geri doner. Liste PRT filtresi rezerve_eden_id dahil.
// donanim.js — v1.0.13 (V31.05)
//   v1.0.13 (V31.05): Surec ilerletme motoru (2.2) — durum makinesi butonlari
//     + donanimSurecIlerlet + _donanimSurecYetki (kapsam). IMEI modal placeholder.
// donanim.js — v1.0.12 (V31.03)
//   v1.0.12 (V31.03): _donanimRezHareketLog — rezervasyon olaylari urun_id +
//     Musteri(unvan+ncst) + Satan ile per-kalem loglanir (urun gecmisi).
// donanim.js — v1.0.11 (V31.02)
//   v1.0.11 (V31.02): openDonanimTimeline gerçek görünüm (stok_hareketleri).
// donanim.js — v1.0.10 (V31.01)
//   v1.0.10 (V31.01): Stok listesi tazeleme — Stok sekmesine geçiste ve
//     rezervasyon onay/red/iptal sonrasi loadDonanimListesi() cagrilir.
// donanim.js — v1.0.9 (V31.00)
//   v1.0.9 (V31.00): Rezervasyon paket düzenleme (1.3) — ekle/çıkar/adet +
//     durum-farkında stok diff + (sepet_id,urun_id) hedefli satır senkronu.
// donanim.js — v1.0.8 (V30.99)
//   v1.0.8 (V30.99): donanimRezervasyonRed (1.1) + donanimRezervasyonIptal (1.2).
// donanim.js — v1.0.7 (V30.98)
//   v1.0.7 (V30.98): Transfer onay akışı — onay1/onay2/red/iptal + stok taşıma
//     (müsait yeniden kontrol, çift-onay guard, hedef hata->kaynak kompanzasyon).
// donanim.js — v1.0.6 (V30.97)
//   v1.0.6 (V30.97): Transfer sekme butonu yetkiyle gizlenir (initDonanimPage).
// donanim.js — v1.0.5 (V30.96)
//   v1.0.5 (V30.96): Transfer sekmesi + Yeni Talep modalı + talep listesi.
// donanim.js — v1.0.4 (V30.94)
//   v1.0.4 (V30.94): _donanimRezOnayYetkisi -> getScope('donanim_takip').
// donanim.js — v1.0.3 (V30.92)
//   v1.0.3 (V30.92): Rezervasyon kartına Müşteri/Müşterinin MY'si/Rezerve eden.
// donanim.js — v1.0.2 (V30.91)
//   v1.0.2 (V30.91): openDonanimRezDetay embedded join (400) -> 2 sorgu.
// donanim.js — v1.0.1 (V30.90)
//   v1.0.1 (V30.90): Rezervasyon onay yetkisine Takım Lideri eklendi
//     (kendi ekibi = bagliMyIds). Yetki tek noktada: _donanimRezOnayYetkisi().
//     donanimRezervasyonOnayla() başına savunmacı guard.
// donanim.js — v1.0.0 (V30.84)
// ------------------------------------------------------------
// DONANIM TAKİP MODÜLÜ — MVP: liste + filtre + görüntüleme
//   • getScope('donanim'): MY/FMY=KÇM, TL/Müdür/Muhasebe&Depo/Admin=TÜM
//   • hasPerm('donanim_yonet'): ürün ekle/düzenle
//   • hasPerm('donanim_rezerve_et'): rezervasyon yap/iptal
// Bu dosya SADECE görüntüleme + filtre içerir (Adım 4a).
// Ekleme/düzenleme/rezervasyon formları sonraki adımlarda eklenecek.
// ============================================================
'use strict';

window._donanimList = [];
window._donanimKcmList = [];

window._donanimSepet = {}; // urun_id -> {urun, adet}
window._donanimSecimModu = false;

async function initDonanimPage(){
  const yonetBtn = document.getElementById('donanimYeniUrunBtn');
  if(yonetBtn) yonetBtn.style.display = hasPerm('donanim_yonet') ? '' : 'none';
  const excelBtn = document.getElementById('donanimExcelYukleBtn');
  if(excelBtn) excelBtn.style.display = hasPerm('donanim_yonet') ? '' : 'none';
  const rezBtn = document.getElementById('donanimRezervasyonBtn');
  if(rezBtn) rezBtn.style.display = hasPerm('donanim_on_rezerve_et') ? '' : 'none';
  // V31.97: Rezervasyon sekmesinin üstündeki "Yeni Rezervasyon" — Stok
  // sekmesindeki 📌 Rezervasyon tuşuyla aynı yetki.
  const rezYeniBtn = document.getElementById('donanimRezYeniBtn');
  if(rezYeniBtn) rezYeniBtn.style.display = hasPerm('donanim_on_rezerve_et') ? '' : 'none';
  // v30.97: Transfer sekmesi yalnız transfer yetkisi (talep VEYA onay) olanda görünür
  const transferTabBtn = document.getElementById('donanimTabTransferBtn');
  if(transferTabBtn){
    const transferYetki = hasPerm('donanim_transfer_talep') || hasPerm('donanim_transfer_onay1') || hasPerm('donanim_transfer_onay2');
    transferTabBtn.style.display = transferYetki ? '' : 'none';
  }
  // V31.55: Depolar sekmesi yalnız donanim_yonet yetkisinde görünür (Depo & Muhasebe)
  const depoTabBtn = document.getElementById('donanimTabDepoBtn');
  if(depoTabBtn) depoTabBtn.style.display = hasPerm('donanim_yonet') ? '' : 'none';
  // V31.57: Talepler sekmesi — talep açabilen VEYA karşılayan görür
  // V31.65: Hızlı Sevkiyat artık ayrı sayfa — burada yalnız kısayol düğmesi
  const svkKisayol = document.getElementById('donanimRezSvkKisayol');
  if(svkKisayol) svkKisayol.style.display = (hasPerm('donanim_yonet') && hasPerm('donanim_sevk')) ? '' : 'none';
  // V31.97: Aynı kısayol artık Stok sekmesinin de en üstünde (Ana Menü'deki
  // ayrı "Hızlı Sevkiyat" kutusu kaldırıldı, bkz. auth.js loadDashboard).
  const svkKisayolStok = document.getElementById('donanimStokSvkKisayol');
  if(svkKisayolStok) svkKisayolStok.style.display = (hasPerm('donanim_yonet') && hasPerm('donanim_sevk')) ? '' : 'none';
  const talepTabBtn = document.getElementById('donanimTabTalepBtn');
  if(talepTabBtn) talepTabBtn.style.display = (hasPerm('donanim_on_rezerve_et') || hasPerm('donanim_yonet')) ? '' : 'none';
  // V31.111: Talepler sekmesindeki "Yeni Talep" — asıl ihtiyaç MY/FMY
  // (donanim_on_rezerve_et), ama Depo & Muhasebe (donanim_yonet) de aynı
  // butonla müşteri adına talep açabiliyor. donanimTalepModalAc/
  // donanimTalepGonder içindeki yetki kontrolü zaten bu ikisini kabul ediyordu.
  const talepYeniBtn = document.getElementById('donanimTalepYeniBtn');
  if(talepYeniBtn) talepYeniBtn.style.display = (hasPerm('donanim_on_rezerve_et') || hasPerm('donanim_yonet')) ? '' : 'none';
  // V31.132/133: Mutabakat Raporu — ayrı yetki anahtarı (donanim_mutabakat_gor),
  // Rol&Yetki ekranından atanmalı. donanim_yonet'e otomatik bağlı DEĞİL.
  const mutabakatBtn = document.getElementById('donanimMutabakatBtn');
  if(mutabakatBtn) mutabakatBtn.style.display = hasPerm('donanim_mutabakat_gor') ? '' : 'none';
  // V31.135: Stok Hareket Raporu — ayrı yetki anahtarı (donanim_hareket_raporu_gor)
  const hareketRaporuBtn = document.getElementById('donanimHareketRaporuBtn');
  if(hareketRaporuBtn) hareketRaporuBtn.style.display = hasPerm('donanim_hareket_raporu_gor') ? '' : 'none';
  window._donanimSepet = {};
  window._donanimSecimModu = false;
  window._donanimDepoCache = null;   // V31.57: her açılışta depo haritası tazelenir
  _donanimSepetBarGuncelle();

  const _dsayfaAcilis = document.getElementById('pageMenuDonanim');
  if(_dsayfaAcilis) _dsayfaAcilis.classList.remove('genis');   // V31.61
  _donanimAyarYukle();                // V31.113: donanım süreç ayarlarını yükle
  _donanimSureSupur(false);          // V31.58: modül açılışında fırsatçı süpürme
  _donanimOnRezSupur();               // V31.113: ön rezervasyon süresi dolanları süpür
  await _loadDonanimKcmFiltre();
  // V31.117: Modül her açıldığında ilk ekran artık Rezervasyon sekmesi
  // (eskiden Stok). HTML'de de donanimRezSekme varsayılan görünür,
  // donanimStokSekme varsayılan gizli olacak şekilde değiştirildi.
  await loadDonanimRezervasyonlar();
  _donanimTalepBadge();
}

function openDonanimYeniUrun(){
  if(!hasPerm('donanim_yonet')){ toast('Ürün ekleme yetkiniz yok','error'); return; }
  ['donanimYeniUrunKod','donanimYeniUrunAd'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const adet=document.getElementById('donanimYeniUrunAdet'); if(adet) adet.value='0';
  const ortak=document.getElementById('donanimYeniUrunOrtak'); if(ortak) ortak.checked=false;
  openModal('donanimYeniUrunModal');
  setTimeout(()=>document.getElementById('donanimYeniUrunKod')?.focus(),80);
}

async function donanimYeniUrunKaydet(){
  if(!hasPerm('donanim_yonet')){ toast('Ürün ekleme yetkiniz yok','error'); return; }
  const kod=(document.getElementById('donanimYeniUrunKod')?.value||'').trim();
  const ad=(document.getElementById('donanimYeniUrunAd')?.value||'').trim();
  const adet=Number(document.getElementById('donanimYeniUrunAdet')?.value);
  const ortak=!!document.getElementById('donanimYeniUrunOrtak')?.checked;
  if(!kod||!ad){ toast('Malzeme kodu ve ürün adı zorunludur','error'); return; }
  if(!Number.isInteger(adet)||adet<0){ toast('Başlangıç adedi 0 veya daha büyük tam sayı olmalıdır','error'); return; }
  const btn=document.getElementById('donanimYeniUrunKaydetBtn');
  if(btn){ btn.disabled=true; btn.textContent='Ekleniyor...'; }
  try{
    await _donanimDepolarYukle(true);
    const merkez=_depoMerkez();
    if(!merkez) throw new Error('Merkez Depo tanımlı değil.');
    const {data:mevcut,error:araErr}=await sb.from('stok_urunleri').select('urun_id').eq('malzeme_kodu',kod).limit(1);
    if(araErr) throw new Error(araErr.message);
    if(mevcut&&mevcut.length) throw new Error('Bu malzeme kodu zaten kayıtlı.');
    const {data,error}=await sb.from('stok_urunleri').insert({
      depo_id:merkez.depo_id,kcm_id:null,depo_adi:merkez.depo_adi,malzeme_kodu:kod,aciklama:ad,
      toplam_adet:adet,rezerve_adet:0,on_rezerve_adet:0,aktif:true,tum_kcm:ortak
    }).select('urun_id').single();
    if(error) throw new Error(error.message);
    const {error:logErr}=await sb.from('stok_hareketleri').insert({
      urun_id:data?.urun_id||null,aksiyon:'Yeni Ürün Eklendi',detay:`${ad} (${kod}) — Merkez Depo, ${adet} adet`,
      user_id:currentUser.my_id,user_ad:currentUser.ad_soyad||String(currentUser.my_id)
    });
    if(logErr) console.warn('[donanim] ürün ekleme log hatası:',logErr.message);
    closeModal('donanimYeniUrunModal'); toast('Ürün Merkez Depoya eklendi','success');
    window._donanimDepoCache=null; loadDonanimListesi();
  }catch(e){ toast('Ürün eklenemedi: '+e.message,'error'); }
  finally{ if(btn){ btn.disabled=false; btn.textContent='Ürünü Ekle'; } }
}

// KÇM filtre dropdown'unu doldurur (scope=TÜM olan roller için görünür)
async function _loadDonanimKcmFiltre(){
  const wrap = document.getElementById('donanimKcmFiltreWrap');
  const scope = getScope('donanim');
  _donanimKendiDepomGorunurluk();          // V31.60
  if(scope !== 'TÜM'){
    if(wrap) wrap.style.display='none';
    return;
  }
  if(wrap) wrap.style.display='';
  if(window._donanimKcmList.length) return; // bir kez yükle
  const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
  window._donanimKcmList = data||[];
  const sel = document.getElementById('donanimKcmFiltre');
  if(sel){
    sel.innerHTML = '<option value="">Tüm KÇM\'ler</option>' +
      window._donanimKcmList.map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
  }
}

// Ana liste yükleme — scope + filtrelere göre
// Ana liste yükleme — V31.57: DEPO bazlı kapsam + "sadece stokta olanlar" anahtarı
//   Anahtar AÇIK  (varsayılan): yalnızca satılabilir ürünler (müsait > 0)
//   Anahtar KAPALI: tüm katalog görünür; stokta olmayanlarda "Talep Et"
async function loadDonanimListesi(){
  const listEl = document.getElementById('donanimListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const {data, error} = await _donanimStokListesiGetir();
  if(error){
    listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error)}</div>`;
    return;
  }
  window._donanimList = data;
  _renderDonanimListesi(window._donanimList);
}

// V31.97: loadDonanimListesi'nin sorgu+birleştirme mantığı, Talepler > Yeni Talep
// ürün seçim listesinin de kullanabilmesi için ayrı bir fonksiyona çıkarıldı.
// `overrides.sadeceStok` verilirse "Sadece stokta olanlar" anahtarı yerine geçer
// (Yeni Talep her zaman false ile çağırır — stokta OLMAYAN ürünleri görmek için).
async function _donanimStokListesiGetir(overrides){
  overrides = overrides || {};
  const scope = getScope('donanim');
  const sadeceStok = (overrides.sadeceStok !== undefined) ? overrides.sadeceStok : _donanimSadeceStokAcik();

  let hedefDepoId = null;   // kullanıcının (veya seçili KÇM'nin) ANA deposu
  let merkezDepoId = null;
  try{
    merkezDepoId = await _donanimMerkezDepoId();
    if(scope === 'TÜM'){
      if(_donanimKendiDepomAcik()){
        // V31.60: kcm_id varsa kendi ANA deposu; yoksa (ADMIN) Merkez Depo
        hedefDepoId = currentUser.kcm_id
          ? await _donanimAnaDepoId(currentUser.kcm_id)
          : merkezDepoId;
      } else {
        const kcmFiltre = document.getElementById('donanimKcmFiltre')?.value;
        if(kcmFiltre) hedefDepoId = await _donanimAnaDepoId(parseInt(kcmFiltre));
      }
    } else if(currentUser.kcm_id){
      hedefDepoId = await _donanimAnaDepoId(currentUser.kcm_id);
    }
  }catch(err){ console.error('[donanim] depo çözümlemesi:', err.message); }

  let q = sb.from('stok_musait').select('*').order('marka').order('model');

  if(hedefDepoId){
    // Kendi ana deposu + ortak stok (tum_kcm). Anahtar kapalıysa katalog da dahil.
    const parcalar = [`depo_id.eq.${hedefDepoId}`, 'tum_kcm.eq.true'];
    if(!sadeceStok && merkezDepoId) parcalar.push(`depo_id.eq.${merkezDepoId}`);
    q = q.or(parcalar.join(','));
  }
  // hedefDepoId yoksa (admin, KÇM filtresi seçilmemiş) kapsam kısıtı uygulanmaz

  // v30.85: kelime-bazlı arama (sıra önemsiz) — aciklama + malzeme_kodu içinde
  const aramaMetni = (overrides.aramaMetni !== undefined) ? overrides.aramaMetni : document.getElementById('donanimMarkaFiltre')?.value?.trim();
  if(aramaMetni){
    const kelimeler = aramaMetni.split(/\s+/).filter(Boolean);
    kelimeler.forEach(kelime=>{
      q = q.or(`aciklama.ilike.%${kelime}%,malzeme_kodu.ilike.%${kelime}%`);
    });
  }

  const {data, error} = await q;
  if(error) return {data:[], error: error.message};
  // V31.61: CEP depo satirlari donanim_yonet disindaki hicbir role gosterilmez
  let _satirlar = data || [];
  if(!hasPerm('donanim_yonet')){
    const _h = await _donanimDepoHaritasi();
    _satirlar = _satirlar.filter(r=> !(r.depo_id && _h.cep && _h.cep[r.depo_id]));
  }

  // V31.124: Merkez (Havuz) satırı burada da ham toplam_adet/musait_adet
  // taşıyordu — dağıtım yapıldıktan sonra bile azalmıyor. Bu liste hem
  // rezervasyon butonunun üst sınırını hem sepete eklenebilecek adedi
  // belirlediği için, ham rakam görünürse zaten dağıtılmış stoktan tekrar
  // rezervasyon yapılabiliyordu. Merkez satırları için gerçek kalan
  // (havuz - dağıtılan) hesaplanıp toplam/müsait adet buna göre düzeltilir.
  if(merkezDepoId){
    const merkezKodlar = [...new Set(_satirlar
      .filter(u=>u.depo_id===merkezDepoId && u.malzeme_kodu)
      .map(u=>u.malzeme_kodu))];
    if(merkezKodlar.length){
      const {data:digerSatirlar, error:digerErr} = await sb.from('stok_urunleri')
        .select('malzeme_kodu,toplam_adet')
        .in('malzeme_kodu', merkezKodlar)
        .neq('depo_id', merkezDepoId)
        .not('depo_id','is',null);
      if(digerErr){
        console.warn('[donanim] Merkez kalan hesaplanamadı:', digerErr.message);
      } else {
        const dagitilanMap = {};
        (digerSatirlar||[]).forEach(r=>{
          dagitilanMap[r.malzeme_kodu] = (dagitilanMap[r.malzeme_kodu]||0) + (r.toplam_adet||0);
        });
        _satirlar = _satirlar.map(u=>{
          if(u.depo_id!==merkezDepoId) return u;
          const dagitilan = dagitilanMap[u.malzeme_kodu]||0;
          if(!dagitilan) return u;
          const toplamKalan = (u.toplam_adet||0) - dagitilan;
          const musaitHam = u.musait_adet ?? ((u.toplam_adet||0) - (u.rezerve_adet||0));
          return Object.assign({}, u, {
            toplam_adet: toplamKalan,
            musait_adet: musaitHam - dagitilan
          });
        });
      }
    }
  }

  // V31.60: hedef depo zaten Merkez ise (ADMIN + kendi depom), merkez satirlari
  // 'katalog' sayilip elenmemeli — birlestirmeye merkez kimligi verilmez.
  const _kendiMerkez = !!(hedefDepoId && merkezDepoId && hedefDepoId === merkezDepoId);
  const birlesik = _donanimListeBirlestir(_satirlar, hedefDepoId, _kendiMerkez ? null : merkezDepoId, sadeceStok);
  return {data: birlesik, error: null};
}

function _donanimSadeceStokAcik(){
  const el = document.getElementById('donanimSadeceStok');
  return el ? !!el.checked : true;
}

function donanimSadeceStokDegisti(){ loadDonanimListesi(); }

// V31.60: "Kendi depom" anahtari ------------------------------------------
// Gizliyken her zaman kapali sayilir; boylece yetkisiz profilde etkisi olmaz.
function _donanimKendiDepomAcik(){
  const wrap = document.getElementById('donanimKendiDepomWrap');
  if(!wrap || wrap.style.display === 'none') return false;
  const el = document.getElementById('donanimKendiDepom');
  return el ? !!el.checked : false;
}

// Kendi depom acikken KCM filtresi celisir — kilitlenir.
function _donanimKcmFiltreKilit(){
  const sel = document.getElementById('donanimKcmFiltre');
  if(!sel) return;
  const kilit = _donanimKendiDepomAcik();
  sel.disabled = kilit;
  sel.style.opacity = kilit ? '.45' : '';
  sel.title = kilit ? 'Kendi depom açıkken KÇM filtresi kullanılamaz' : '';
}

// Anahtar yalnizca baska depolari gorebilen profillerde anlamli:
// scope=TÜM ve (kendi kcm_id'si var VEYA ADMIN). Depo & Muhasebe gibi
// kcm_id'si olmayan diger TÜM-kapsam profillerde gizlenir.
function _donanimKendiDepomGorunurluk(){
  const wrap = document.getElementById('donanimKendiDepomWrap');
  if(!wrap) return;
  const admin = (currentUser.yetki_seviyesi||'').toUpperCase() === 'ADMIN';
  const gorsun = (getScope('donanim') === 'TÜM') && (!!currentUser.kcm_id || admin);
  wrap.style.display = gorsun ? 'flex' : 'none';
  if(!gorsun){
    const el = document.getElementById('donanimKendiDepom');
    if(el) el.checked = false;
  }
  _donanimKcmFiltreKilit();
}

function donanimKendiDepomDegisti(){
  _donanimKcmFiltreKilit();
  loadDonanimListesi();
}

// Aynı malzeme_kodu için kendi deposundaki satır önceliklidir; yoksa katalog
// satırı 0 adetle gösterilir (talep edilebilsin diye).
function _donanimListeBirlestir(satirlar, hedefDepoId, merkezDepoId, sadeceStok){
  if(!hedefDepoId){
    return sadeceStok ? satirlar.filter(u => (u.musait_adet||0) > 0) : satirlar;
  }
  const kendi = {}, katalog = {};
  satirlar.forEach(u=>{
    const k = u.malzeme_kodu || ('#'+u.urun_id);
    const merkezSatiri = (merkezDepoId && u.depo_id === merkezDepoId && !u.tum_kcm);
    if(merkezSatiri){ katalog[k] = u; return; }
    if(!kendi[k] || (u.musait_adet||0) > (kendi[k].musait_adet||0)) kendi[k] = u;
  });

  const cikti = [];
  Object.keys(kendi).forEach(k=>{
    const u = kendi[k];
    if(sadeceStok && (u.musait_adet||0) <= 0) return;
    cikti.push(u);
  });
  if(!sadeceStok){
    Object.keys(katalog).forEach(k=>{
      if(kendi[k]) return;
      cikti.push(Object.assign({}, katalog[k], {toplam_adet:0, rezerve_adet:0, musait_adet:0}));
    });
  }
  cikti.sort((a,b)=> (a.aciklama||a.malzeme_kodu||'').localeCompare(b.aciklama||b.malzeme_kodu||'','tr'));
  return cikti;
}

function _renderDonanimListesi(list){
  const listEl = document.getElementById('donanimListesi');
  if(!listEl) return;
  if(!list.length){
    const sadeceStok = _donanimSadeceStokAcik();
    listEl.innerHTML = sadeceStok
      ? '<div class="empty">Stokta ürün yok.<br><span style="font-size:12px;color:var(--text3);">Tüm ürünleri görmek için üstteki “Sadece stokta olanlar” anahtarını kapatın.</span></div>'
      : '<div class="empty">Kayıtlı ürün bulunamadı.</div>';
    return;
  }
  const canYonet = hasPerm('donanim_yonet');
  const canRezerve = hasPerm('donanim_rezerve_et');
  const canOnRezerve = hasPerm('donanim_on_rezerve_et');
  const kcmAdMap = {};
  (window._donanimKcmList||[]).forEach(k=>{ kcmAdMap[k.kcm_id]=k.kcm_adi; });

  // v30.85: Gösterim artık ERP açıklaması bazlı (marka/model ayrıştırma yok)
  listEl.innerHTML = list.map(u=>{
    const musait = u.musait_adet ?? (u.toplam_adet - u.rezerve_adet);
    const renkli = musait > 0 ? 'var(--green)' : 'var(--red)';
    const kcmAd = kcmAdMap[u.kcm_id] || (u.kcm_id ? ('KÇM#'+u.kcm_id) : 'Ana depo');
    const baslik = u.aciklama || [u.marka,u.model,u.renk,u.gb_hafiza].filter(Boolean).join(' ') || 'İsimsiz ürün';
    // V31.57: stokta olmayan üründe satış yerine tedarik talebi
    const talepEdilebilir = (musait <= 0) && canOnRezerve;
    return `<div class="visit-card" style="margin-bottom:8px;${musait<=0?'opacity:.85;':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHTML(baslik)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px;">${escapeHTML(kcmAd)}${u.malzeme_kodu?' · Kod: '+escapeHTML(u.malzeme_kodu):''}${u.tum_kcm?' · ortak stok':''}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
        <div>
          <span style="font-size:18px;font-weight:800;color:${renkli};">${musait}</span>
          <span style="font-size:11px;color:var(--text3);"> adet müsait</span>
          ${u.rezerve_adet>0?`<span style="font-size:11px;color:var(--amber);"> (${u.rezerve_adet} rezerve)</span>`:''}
        </div>
        ${u.fiyat?`<div style="font-size:13px;font-weight:700;">${Number(u.fiyat).toLocaleString('tr-TR')} ₺</div>`:'<div style="font-size:11px;color:var(--text3);">Fiyat girilmemiş</div>'}
      </div>
      ${window._donanimSecimModu && canOnRezerve && musait>0 ? `
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <input type="checkbox" id="donanimChk_${u.urun_id}" onchange="donanimSepetToggle(${u.urun_id})" style="width:18px;height:18px;" ${window._donanimSepet[u.urun_id]?'checked':''}>
        <label for="donanimChk_${u.urun_id}" style="font-size:12px;flex:1;">Seç</label>
        <input type="number" min="1" max="${musait}" value="${window._donanimSepet[u.urun_id]?.adet||1}" id="donanimAdet_${u.urun_id}" oninput="donanimSepetAdetGuncelle(${u.urun_id}, this.value)" style="width:60px;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px;font-size:13px;text-align:center;">
      </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="openDonanimTimeline(${u.urun_id})">📜 Geçmiş</button>
        ${talepEdilebilir?`<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="donanimTalepModalAc(${u.urun_id})">🛒 Talep Et</button>`:''}
      </div>
    </div>`;
  }).join('');
}

let _donanimFiltreTimer=null;
function donanimFiltreDegistiDebounce(){
  clearTimeout(_donanimFiltreTimer);
  _donanimFiltreTimer=setTimeout(loadDonanimListesi,350);
}
function donanimFiltreDegisti(){
  loadDonanimListesi();
}

// V31.62: openDonanimDuzenle kaldırıldı (hiç yazılmamış placeholder'dı).
// Ortak stok / aktif ayarları Depolar sekmesindeki ızgarada yapılır.
function openDonanimRezervasyon(urunId){ toast('Rezervasyon formu — bir sonraki adımda eklenecek','info'); }
// v31.02: Stok geçmişi — stok_hareketleri kayıtlarını ürün bazında gösterir
async function openDonanimTimeline(urunId){
  const icerik = document.getElementById('donanimTimelineIcerik');
  const baslik = document.getElementById('donanimTimelineBaslik');
  icerik.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  baslik.textContent = '';
  openModal('donanimTimelineModal');

  const {data:urun} = await sb.from('stok_urunleri').select('aciklama,marka,model,renk,gb_hafiza,malzeme_kodu').eq('urun_id',urunId).single();
  if(urun){ baslik.textContent = (urun.aciklama || [urun.marka,urun.model,urun.gb_hafiza,urun.renk].filter(Boolean).join(' ')) + (urun.malzeme_kodu?` · ${urun.malzeme_kodu}`:''); }

  const {data, error} = await sb.from('stok_hareketleri').select('*').eq('urun_id',urunId).order('created_at',{ascending:false});
  if(error){ icerik.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ icerik.innerHTML = '<div class="empty">Bu ürün için hareket kaydı yok.</div>'; return; }

  const renk = {
    'Stok Girişi':'#27ae60','Excel Yükleme':'#27ae60','Excel Stok Girişi':'#27ae60','Ön Rezervasyon':'#e67e22',
    'Rezervasyon Onay':'#2980b9','Rezervasyon Onaylandı':'#2980b9','Rezervasyon Reddedildi':'#e74c3c',
    'Rezervasyon İptal':'#e74c3c','Rezervasyon Düzenlendi':'#8e44ad','Stok Transferi':'#16a085',
    'Transfer Talebi':'#e67e22','Transfer 1. Onay':'#2980b9','Transfer Reddedildi':'#e74c3c','Transfer İptal':'var(--text3)'
  };
  icerik.innerHTML = data.map(h=>{
    const c = renk[h.aksiyon]||'var(--text3)';
    return `<div style="border-left:3px solid ${c};padding:6px 10px;margin-bottom:6px;background:var(--navy3);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <span style="font-weight:600;font-size:12px;color:${c};">${escapeHTML(h.aksiyon)}</span>
        <span style="font-size:11px;color:var(--text3);white-space:nowrap;">${new Date(h.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</span>
      </div>
      ${h.detay?`<div style="font-size:12px;color:var(--text2);margin-top:2px;">${escapeHTML(h.detay)}</div>`:''}
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">${escapeHTML(h.user_ad||'—')}</div>
    </div>`;
  }).join('');
}

// V31.131: Rezervasyon kartı için Geçmiş — üstte sepetin tam detayı (ürünler,
// müşteri, IMEI'ler, fatura no), altında tekilleştirilmiş adım listesi (aynı
// olayda birden fazla ürün varsa artık tek satırda — önceden ürün sayısı kadar
// tekrar ediyordu). sepet_id'ye göre filtreli — başka rezervasyonların
// kayıtlarıyla karışmaz.
async function openDonanimRezTimeline(sepetId){
  const icerik = document.getElementById('donanimTimelineIcerik');
  const baslik = document.getElementById('donanimTimelineBaslik');
  icerik.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const kisaId = 'REZ-' + String(sepetId||'').replace(/-/g,'').slice(0,8).toUpperCase();
  baslik.textContent = kisaId;
  openModal('donanimTimelineModal');

  // Üst özet: sepet kalemleri + ürün adı + müşteri + IMEI'ler + fatura no
  const {data:kalemler} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId).order('created_at');
  let ozetHTML = '';
  if(kalemler && kalemler.length){
    const ilk = kalemler[0];
    const urunIds = [...new Set(kalemler.map(k=>k.urun_id).filter(Boolean))];
    const urunMap = {};
    if(urunIds.length){
      const {data:urunler} = await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id', urunIds);
      (urunler||[]).forEach(u=>{ urunMap[u.urun_id] = u.aciklama; });
    }
    const {data:seriler} = await sb.from('stok_seri_no').select('seri_no,urun_id').eq('sepet_id', sepetId);
    const seriByUrun = {};
    (seriler||[]).forEach(s=>{ (seriByUrun[s.urun_id]=seriByUrun[s.urun_id]||[]).push(_imeiMaskele(s.seri_no)); });
    let musteriAd = ilk.ncst || '—';
    if(ilk.ncst){ const {data:m}=await sb.from('customers').select('unvan').eq('ncst',ilk.ncst).maybeSingle(); if(m?.unvan) musteriAd=m.unvan; }
    const urunSatirlari = kalemler.map(k=>{
      const ad = urunMap[k.urun_id] || ('Ürün #'+k.urun_id);
      const imeiler = seriByUrun[k.urun_id] ? ` — IMEI: ${seriByUrun[k.urun_id].join(', ')}` : '';
      return `<div style="font-size:12px;color:var(--text2);">• ${escapeHTML(ad)} · ${k.adet} adet${imeiler}</div>`;
    }).join('');
    ozetHTML = `<div style="background:var(--navy3);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:12px;">
      <div style="font-size:12px;color:var(--text3);margin-bottom:4px;">Müşteri: <b style="color:var(--text2);">${escapeHTML(musteriAd)}</b>${ilk.satis_tipi?` · ${escapeHTML(ilk.satis_tipi)}`:''}</div>
      ${urunSatirlari}
      ${ilk.fatura_no ? `<div style="font-size:12px;color:var(--text2);margin-top:4px;">🧾 Fatura No: <b>${escapeHTML(ilk.fatura_no)}</b></div>` : ''}
    </div>`;
  }

  const {data, error} = await sb.from('stok_hareketleri').select('*').eq('sepet_id', sepetId).order('created_at',{ascending:false});
  if(error){ icerik.innerHTML = ozetHTML + `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ icerik.innerHTML = ozetHTML + '<div class="empty">Bu rezervasyon için hareket kaydı yok. (Not: bu özellik V31.130\'da eklendi — daha eski kayıtların geçmişi bu sepet_id ile loglanmamış olabilir.)</div>'; return; }

  // V31.131: aynı olay (aksiyon+kullanıcı+aynı dakika) birden fazla ürün için
  // ayrı ayrı loglandığından, tek adım kartına toplanıyor — kalabalık önleniyor.
  const gruplar = [];
  const grupIndex = {};
  data.forEach(h=>{
    const dakika = h.created_at ? h.created_at.slice(0,16) : h.created_at;
    const anahtar = `${h.aksiyon}|${h.user_id}|${dakika}`;
    if(grupIndex[anahtar]===undefined){ grupIndex[anahtar]=gruplar.length; gruplar.push({aksiyon:h.aksiyon, user_ad:h.user_ad, created_at:h.created_at, detaylar:[]}); }
    if(h.detay) gruplar[grupIndex[anahtar]].detaylar.push(h.detay);
  });

  const renk = {
    'Ön Rezervasyon':'#e67e22','Yönetici Onayı Bekliyor':'#e67e22','Mükerrer Talep Onaylandı':'#2980b9',
    'Rezervasyon Onaylandı':'#2980b9','Rezervasyon Reddedildi':'#e74c3c','Rezervasyon İptal':'#e74c3c',
    'Rezervasyon Düzenlendi':'#8e44ad','Ön Rezervasyon Süresi Uzatıldı':'#8e44ad','Rezervasyon Süresi Uzatıldı':'#8e44ad',
    'Ön Rezervasyon Süresi Doldu':'var(--text3)'
  };
  icerik.innerHTML = ozetHTML + gruplar.map(g=>{
    const c = renk[g.aksiyon] || (g.aksiyon&&g.aksiyon.startsWith('IMEI')?'#16a085':(g.aksiyon&&g.aksiyon.startsWith('Süreç:')?'#2980b9':'var(--text3)'));
    return `<div style="border-left:3px solid ${c};padding:6px 10px;margin-bottom:6px;background:var(--navy3);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <span style="font-weight:600;font-size:12px;color:${c};">${escapeHTML(g.aksiyon)}</span>
        <span style="font-size:11px;color:var(--text3);white-space:nowrap;">${new Date(g.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</span>
      </div>
      ${g.detaylar.map(d=>`<div style="font-size:12px;color:var(--text2);margin-top:2px;">${escapeHTML(d)}</div>`).join('')}
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">👤 ${escapeHTML(g.user_ad||'—')}</div>
    </div>`;
  }).join('');
}

/* ============================================================
   EXCEL İLE STOK YÜKLEME — ANA DEPO / CİHAZ HAVUZU (V31.54)
   ------------------------------------------------------------
   ERP formatı: Ambar Adı | Barkod No | Malzeme Kodu | Malzeme
   Açıklaması | Seri No | Ana Birim | Fiili Stok | Gerçek Stok
   Sadece Malzeme Kodu + Malzeme Açıklaması + Seri No kullanılır.

   V31.54 ile değişenler:
   • KÇM / depo seçimi KALDIRILDI. Hedef her zaman ANA DEPO —
     yani katalog satırı (stok_urunleri.kcm_id IS NULL).
     KÇM'lere dağıtım ayrı ekranda (Depo & Muhasebe) yapılır.
   • IMEI FİLTRESİ: yalnızca 15 haneli, tamamı rakam seriler
     havuza alınır. 18 haneli ICCID ve diğer uzunluklar atlanır.
   • 'Ambar Adı' sütunu artık okunmuyor.
   • toplam_adet artırılmaz, YENİDEN SAYILIR (idempotent).
   ============================================================ */

async function openDonanimExcelYukle(){
  // V31.54: KÇM/depo seçimi yok — hedef her zaman ana depo (katalog, kcm_id IS NULL)
  document.getElementById('donanimExcelAdim1').classList.remove('hide');
  document.getElementById('donanimExcelAdim2').classList.add('hide');
  document.getElementById('donanimExcelSonuc').classList.add('hide');
  document.getElementById('donanimExcelDosya').value='';
  openModal('donanimExcelModal');
}

// Excel'i satır dizisine çevirir (Seri No'yu METİN olarak korur — bilimsel gösterim/baştaki 0 kaybı olmasın)
function _donanimExcelOku(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = (e)=>{
      try{
        const wb = XLSX.read(e.target.result, {type:'array'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        // raw:false -> hücreleri metin formatlı okur (Seri No sayısal bozulmasın)
        const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
        resolve(rows);
      }catch(err){ reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ---- V31.54 yardımcıları ---------------------------------- */

// Excel'den gelen seri no metnini temizler ("...058.0" gibi float artıklarını atar)
function _donanimSeriTemizle(s){
  return String(s==null?'':s).trim().replace(/[.,]0+$/,'');
}

// IMEI = 15 hane, tamamı rakam. 18 haneli ICCID ve diğer uzunluklar havuza girmez.
function _donanimImeiMi(s){
  return /^\d{15}$/.test(_donanimSeriTemizle(s));
}

// Katalog satırı (kcm_id IS NULL) bul, yoksa oluştur.
// upsert/onConflict KULLANILMAZ: katalog tekilliği kısmi indeksle sağlanıyor
// (ux_stok_urunleri_katalog ... WHERE kcm_id IS NULL) ve PostgREST'in on_conflict
// parametresi kısmi indeksi hedefleyemez (indeksin WHERE yüklemini üretemez).
// Bu yüzden SELECT -> yoksa INSERT deseni kullanılır.
async function _donanimKatalogSatiriBul(malzemeKodu, aciklama){
  const {data:mevcut, error:selErr} = await sb.from('stok_urunleri')
    .select('urun_id,aciklama').eq('malzeme_kodu', malzemeKodu).is('kcm_id', null).limit(1);
  if(selErr) return {hata:'Katalog sorgusu: '+selErr.message};
  if(mevcut && mevcut.length){
    if(!mevcut[0].aciklama && aciklama){
      await sb.from('stok_urunleri')
        .update({aciklama:aciklama, updated_at:new Date().toISOString()})
        .eq('urun_id', mevcut[0].urun_id);
    }
    return {urun_id: mevcut[0].urun_id, yeni:false};
  }
  const {data:yeni, error:insErr} = await sb.from('stok_urunleri')
    .insert({kcm_id:null, depo_adi:null, malzeme_kodu:malzemeKodu,
             aciklama:aciklama||malzemeKodu, toplam_adet:0, rezerve_adet:0,
             on_rezerve_adet:0, aktif:true, tum_kcm:false})
    .select('urun_id').single();
  if(insErr || !yeni){
    // Yarış durumu: aynı anda başka bir yükleme oluşturmuş olabilir -> tekrar ara
    const {data:tekrar} = await sb.from('stok_urunleri')
      .select('urun_id').eq('malzeme_kodu', malzemeKodu).is('kcm_id', null).limit(1);
    if(tekrar && tekrar.length) return {urun_id: tekrar[0].urun_id, yeni:false};
    return {hata:'Katalog satırı oluşturulamadı: '+(insErr?insErr.message:'bilinmeyen hata')};
  }
  return {urun_id: yeni.urun_id, yeni:true};
}

// toplam_adet ARTIRILMAZ, YENİDEN SAYILIR — aynı dosya iki kez yüklenirse sayı şişmez.
async function _donanimKatalogAdetYenile(urunIdler){
  for(const urunId of urunIdler){
    const {count, error} = await sb.from('stok_seri_no')
      .select('*',{count:'exact',head:true}).eq('urun_id', urunId).eq('durum','Depoda');
    if(error){ console.error('[donanim] adet sayım hatası urun_id='+urunId, error.message); continue; }
    const {error:updErr} = await sb.from('stok_urunleri')
      .update({toplam_adet: count||0, updated_at:new Date().toISOString()})
      .eq('urun_id', urunId);
    if(updErr) console.error('[donanim] adet yazma hatası urun_id='+urunId, updErr.message);
  }
}

async function donanimExcelIsle(){
  const dosya = document.getElementById('donanimExcelDosya').files[0];
  if(!dosya){ toast('Excel dosyası seçin','error'); return; }

  document.getElementById('donanimExcelAdim1').classList.add('hide');
  document.getElementById('donanimExcelAdim2').classList.remove('hide');
  document.getElementById('donanimExcelIlerleme').classList.remove('hide');
  document.getElementById('donanimExcelSonuc').classList.add('hide');
  const ilerlemeEl = document.getElementById('donanimExcelIlerlemeMetin');
  const CHUNK = 500;

  try{
    ilerlemeEl.textContent = 'Excel okunuyor...';
    const rows = await _donanimExcelOku(dosya);
    if(!rows.length){ toast('Excel boş görünüyor','error'); openDonanimExcelYukle(); return; }

    const kOf = (row, ...adaylar)=>{ for(const a of adaylar){ if(row[a]!==undefined) return row[a]; } return ''; };
    const ham = rows.map(r=>({
      seri_no: _donanimSeriTemizle(kOf(r,'Seri No','SERİ NO','Seri no')),
      malzeme_kodu: String(kOf(r,'Malzeme Kodu','MALZEME KODU')).trim(),
      aciklama: String(kOf(r,'Malzeme Acıklaması','Malzeme Açıklaması','MALZEME ACIKLAMASI','MALZEME AÇIKLAMASI','Malzeme Aciklamasi')).trim()
    })).filter(r=>r.seri_no);

    // 1) IMEI FİLTRESİ — sadece 15 haneli tam sayısal seriler havuza girer
    ilerlemeEl.textContent = `${ham.length} satır okundu. IMEI filtresi uygulanıyor...`;
    const adaylar = [], elenen = [];
    ham.forEach(s=>{
      if(!s.malzeme_kodu){ elenen.push({...s, sebep:'Malzeme kodu boş'}); return; }
      if(!_donanimImeiMi(s.seri_no)){ elenen.push({...s, sebep:`IMEI değil (${s.seri_no.length} hane)`}); return; }
      adaylar.push(s);
    });

    // 2) Dosya içi mükerrer seri no
    const gorulen = new Set(), dosyaMukerrer = [], tekil = [];
    adaylar.forEach(s=>{
      if(gorulen.has(s.seri_no)) dosyaMukerrer.push(s);
      else { gorulen.add(s.seri_no); tekil.push(s); }
    });

    if(!tekil.length){
      window._donanimExcelRapor = [];
      window._donanimExcelRaporTam = elenen.map(s=>({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Atlandı', aciklama:s.sebep}));
      document.getElementById('donanimExcelIlerleme').classList.add('hide');
      document.getElementById('donanimExcelSonuc').classList.remove('hide');
      document.getElementById('donanimExcelOzet').innerHTML =
        `⚠️ <span style="color:var(--red);">Yüklenecek IMEI bulunamadı.</span><br>`+
        `<span style="font-weight:400;color:var(--text2);font-size:12px;">`+
        `${ham.length} satır okundu · ${elenen.length} satır 15 haneli IMEI değil</span>`;
      document.getElementById('donanimExcelRaporTablo').innerHTML = '';
      toast('Dosyada 15 haneli IMEI bulunamadı','error');
      return;
    }

    // 3) Mevcut seri no'ları DB'de ara
    const mevcutSeriMap = {};
    const tumSeri = tekil.map(s=>s.seri_no);
    for(let i=0;i<tumSeri.length;i+=CHUNK){
      const parca = tumSeri.slice(i,i+CHUNK);
      const {data, error} = await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id').in('seri_no',parca);
      if(error) throw new Error('Mevcut stok kontrolünde hata: '+error.message);
      (data||[]).forEach(d=>{ mevcutSeriMap[d.seri_no]=d; });
      ilerlemeEl.textContent = `Mevcut havuz kontrol ediliyor... (${Math.min(i+CHUNK,tumSeri.length)}/${tumSeri.length})`;
    }

    const mevcutUrunIdler = [...new Set(Object.values(mevcutSeriMap).map(x=>x.urun_id))];
    const urunMalzemeMap = {};
    for(let i=0;i<mevcutUrunIdler.length;i+=200){
      const parca = mevcutUrunIdler.slice(i,i+200);
      const {data,error} = await sb.from('stok_urunleri').select('urun_id,malzeme_kodu').in('urun_id',parca);
      if(error) throw new Error('Ürün bilgisi çekilirken hata: '+error.message);
      (data||[]).forEach(d=>{ urunMalzemeMap[d.urun_id]=d.malzeme_kodu; });
    }

    const yeniSeriler = [], zatenMevcut = [], celiskiler = [];
    tekil.forEach(s=>{
      const eski = mevcutSeriMap[s.seri_no];
      if(!eski){ yeniSeriler.push(s); return; }
      if(urunMalzemeMap[eski.urun_id] === s.malzeme_kodu) zatenMevcut.push(s);
      else celiskiler.push({...s, mevcutKod: urunMalzemeMap[eski.urun_id]});
    });

    // 4) Katalog satırları (ANA DEPO — kcm_id NULL)
    const kodlar = [...new Set(yeniSeriler.map(s=>s.malzeme_kodu))];
    const katalogMap = {}, katalogHata = {};
    let yeniKatalogSayisi = 0;
    for(let i=0;i<kodlar.length;i++){
      const kod = kodlar[i];
      const ornek = yeniSeriler.find(s=>s.malzeme_kodu===kod);
      const sonuc = await _donanimKatalogSatiriBul(kod, ornek?ornek.aciklama:'');
      if(sonuc.hata) katalogHata[kod] = sonuc.hata;
      else { katalogMap[kod] = sonuc.urun_id; if(sonuc.yeni) yeniKatalogSayisi++; }
      ilerlemeEl.textContent = `Katalog satırları hazırlanıyor... (${i+1}/${kodlar.length})`;
    }

    // 5) Seri no kayıtları — her satırın gerçek insert sonucu izlenir
    const basarili = [], eklemeHatasi = [];
    yeniSeriler.filter(s=>katalogHata[s.malzeme_kodu]).forEach(s=>{
      eklemeHatasi.push({...s, sebep:'Katalog satırı hazırlanamadı: '+katalogHata[s.malzeme_kodu]});
    });
    const eklenecek = yeniSeriler.filter(s=>katalogMap[s.malzeme_kodu]);
    for(let i=0;i<eklenecek.length;i+=CHUNK){
      const parca = eklenecek.slice(i,i+CHUNK);
      const payload = parca.map(s=>({seri_no:s.seri_no, urun_id:katalogMap[s.malzeme_kodu], durum:'Depoda'}));
      const {data:insData, error:insErr} = await sb.from('stok_seri_no').insert(payload).select('seri_no');
      if(insErr){
        parca.forEach(s=> eklemeHatasi.push({...s, sebep:'Kayıt hatası: '+insErr.message}));
      } else {
        const eklenenSet = new Set((insData||[]).map(d=>d.seri_no));
        parca.forEach(s=>{
          if(eklenenSet.has(s.seri_no)) basarili.push(s);
          else eklemeHatasi.push({...s, sebep:'Kayıt doğrulanamadı (insert sonucu boş döndü)'});
        });
      }
      ilerlemeEl.textContent = `IMEI kayıtları ekleniyor... (${Math.min(i+CHUNK,eklenecek.length)}/${eklenecek.length})`;
    }

    // 6) Havuz adetleri — artırma değil, YENİDEN SAYIM
    ilerlemeEl.textContent = 'Havuz adetleri yeniden sayılıyor...';
    const etkilenen = [...new Set(basarili.map(s=>katalogMap[s.malzeme_kodu]))];
    await _donanimKatalogAdetYenile(etkilenen);

    // 7) Raporlar — EKRAN sade (yüklenen + hata + mevcut), EXCEL tam
    const ekranRapor = [];
    basarili.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'✅ Yüklendi', aciklama:''}));
    celiskiler.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'❌ HATA', aciklama:`Bu seri no başka bir üründe kayıtlı (mevcut kod: ${s.mevcutKod||'?'})`}));
    eklemeHatasi.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'❌ HATA', aciklama:s.sebep}));
    zatenMevcut.forEach(s=> ekranRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Yüklenmedi', aciklama:'Zaten havuzda mevcut'}));

    const tamRapor = ekranRapor.slice();
    dosyaMukerrer.forEach(s=> tamRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Atlandı', aciklama:'Dosya içinde mükerrer'}));
    elenen.forEach(s=> tamRapor.push({seri_no:s.seri_no, urun_adi:s.aciklama, durum:'⏭️ Atlandı', aciklama:s.sebep}));

    window._donanimExcelRapor = ekranRapor;
    window._donanimExcelRaporTam = tamRapor;

    const hataSayisi = celiskiler.length + eklemeHatasi.length;
    const atlananToplam = elenen.length + dosyaMukerrer.length;

    // 8) Timeline'a tek özet log
    const {error:logErr} = await sb.from('stok_hareketleri').insert({
      aksiyon: 'Excel Stok Yükleme (Ana Depo)',
      detay: `${basarili.length} IMEI havuza eklendi · ${zatenMevcut.length} zaten mevcut · ${hataSayisi} hata · ${elenen.length} satır IMEI değil · ${yeniKatalogSayisi} yeni ürün — dosyada toplam ${ham.length} satır.`,
      user_id: currentUser.my_id,
      user_ad: currentUser.ad_soyad || String(currentUser.my_id)
    });
    if(logErr) console.error('Timeline log hatası:', logErr.message);

    // 9) Ekrana yaz
    document.getElementById('donanimExcelIlerleme').classList.add('hide');
    document.getElementById('donanimExcelSonuc').classList.remove('hide');
    document.getElementById('donanimExcelOzet').innerHTML =
      `✅ <span style="color:var(--green);">${basarili.length} IMEI yüklendi</span> · `+
      `⏭️ <span style="color:var(--text3);">${zatenMevcut.length} zaten havuzda</span> · `+
      `❌ <span style="color:var(--red);">${hataSayisi} hata</span><br>`+
      `<span style="font-weight:400;color:var(--text2);font-size:12px;">`+
      `Hedef: ANA DEPO · dosyada ${ham.length} satır · IMEI olmadığı için atlanan ${elenen.length} · `+
      `dosya içi mükerrer ${dosyaMukerrer.length} · yeni ürün ${yeniKatalogSayisi}</span>`;

    const ozetSatir = atlananToplam ? `<tr>
      <td colspan="4" style="padding:8px;border-bottom:1px solid var(--border);color:var(--text2);font-size:12px;">
        ⏭️ ${atlananToplam} satır burada listelenmedi (IMEI değil / dosya içi mükerrer) — tamamı &quot;Raporu İndir&quot; dosyasında.
      </td></tr>` : '';
    document.getElementById('donanimExcelRaporTablo').innerHTML = ozetSatir + ekranRapor.map(r=>`<tr>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.seri_no)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.urun_adi)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${r.durum}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);">${escapeHTML(r.aciklama)}</td>
    </tr>`).join('');

    if(hataSayisi>0) toast(`Yükleme tamamlandı ama ${hataSayisi} HATA var — raporu kontrol edin`,'error');
    else toast(`Yükleme tamamlandı: ${basarili.length} IMEI ana depoya eklendi`,'success');
    loadDonanimListesi();
  }catch(err){
    console.error(err);
    document.getElementById('donanimExcelIlerleme').classList.add('hide');
    toast('Hata: '+err.message,'error');
    alert('Yükleme durdu, hiçbir kayıt yazılmamış olabilir:\n\n'+err.message);
  }
}

// Rapor Excel olarak indirilir (SheetJS ile)
// V31.54: ekranda sadeleştirilmiş liste gösterilir, indirilen dosya TAM raporu içerir.
function donanimExcelRaporIndir(){
  const rapor = window._donanimExcelRaporTam || window._donanimExcelRapor || [];
  if(!rapor.length){ toast('İndirilecek rapor yok','error'); return; }
  const ws = XLSX.utils.json_to_sheet(rapor.map(r=>({
    'Seri No': r.seri_no, 'Ürün': r.urun_adi, 'Durum': r.durum, 'Açıklama': r.aciklama
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Yükleme Raporu');
  const tarih = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `stok_yukleme_raporu_${tarih}.xlsx`);
}

/* ============================================================
   ÖN REZERVASYON — SEPET MEKANİZMASI (v30.87)
   ------------------------------------------------------------
   MY/FMY birden fazla ürünü işaretleyip adet girerek TEK bir
   "Ön Rezervasyon Talebi" (sepet_id ile gruplanmış) oluşturur.
   Stokta görünürlük DEĞİŞMEZ (on_rezerve_adet artar, musait_adet
   sabit kalır) — kesinleşme (OLM onayı) SONRAKİ fazda ele alınacak.
   ============================================================ */

function donanimSecimModunuAc(ilkUrunId){
  // v30.89: artık tek üst buton ile çağrılıyor (kartlarda tekil buton yok)
  window._donanimSecimModu = true;
  if(ilkUrunId){
    const u = (window._donanimList||[]).find(x=>x.urun_id===ilkUrunId);
    if(u) window._donanimSepet[ilkUrunId] = {urun:u, adet:1};
  }
  _renderDonanimListesi(window._donanimList);
  _donanimSepetBarGuncelle();
}

function donanimSepetToggle(urunId){
  const chk = document.getElementById('donanimChk_'+urunId);
  if(chk && chk.checked){
    const u = (window._donanimList||[]).find(x=>x.urun_id===urunId);
    const adetEl = document.getElementById('donanimAdet_'+urunId);
    window._donanimSepet[urunId] = {urun:u, adet: parseInt(adetEl?.value)||1};
  } else {
    delete window._donanimSepet[urunId];
  }
  _donanimSepetBarGuncelle();
}

function donanimSepetAdetGuncelle(urunId, deger){
  if(!window._donanimSepet[urunId]) return;
  const musait = window._donanimSepet[urunId].urun.musait_adet ?? 0;
  let adet = parseInt(deger)||1;
  if(adet<1) adet=1;
  if(adet>musait) adet=musait;
  window._donanimSepet[urunId].adet = adet;
  _donanimSepetBarGuncelle();
}

function _donanimSepetBarGuncelle(){
  const bar = document.getElementById('donanimSepetBar');
  const sayacEl = document.getElementById('donanimSepetSayac');
  const adet = Object.keys(window._donanimSepet||{}).length;
  if(!bar) return;
  if(adet>0){
    bar.classList.remove('hide');
    if(sayacEl) sayacEl.textContent = `${adet} ürün seçili`;
  } else {
    bar.classList.add('hide');
  }
}

// Sepet modalını açar: müşteri arama + satan MY listesini hazırlar
async function donanimSepetiAc(){
  const sepetKeys = Object.keys(window._donanimSepet||{});
  if(!sepetKeys.length){ toast('En az bir ürün seçin','error'); return; }

  const listEl = document.getElementById('donanimSepetListesi');
  listEl.innerHTML = sepetKeys.map(uid=>{
    const item = window._donanimSepet[uid];
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">
      <span>${escapeHTML(item.urun.aciklama||'')}</span>
      <span style="font-weight:700;">${item.adet} adet</span>
    </div>`;
  }).join('');

  document.getElementById('donanimSepetMusteriArama').value='';
  document.getElementById('donanimSepetMusteriSonuc').innerHTML='';
  document.getElementById('donanimSepetMusteriSecili').classList.add('hide');
  window._donanimSepetSeciliMusteri = null;

  // v31.25: Satış Tipi seçimini sıfırla (her yeni sepet açılışında zorunlu yeniden seçim)
  document.querySelectorAll('#donanimSepetSatisTipiBox .chip-btn').forEach(c=>c.classList.remove('selected'));
  window._donanimSepetSatisTipi = null;

  // v30.88: MY/FMY kendisi giriyorsa hiçbir seçim göstermeden otomatik kendisi olur.
  const kendiMY = (currentUser.yetki_seviyesi==='MY' || currentUser.yetki_seviyesi==='FMY');
  document.getElementById('donanimSatanSecimBlok').classList.toggle('hide', kendiMY);
  document.getElementById('donanimSatanKendisi').classList.toggle('hide', !kendiMY);
  if(kendiMY){
    document.getElementById('donanimSatanKendisi').innerHTML = `Satan: <b>${escapeHTML(currentUser.ad_soyad||'')} (Siz)</b>`;
  } else {
    // Kademeli seçim: KÇM listesi (bir kez yükle)
    const kcmSel = document.getElementById('donanimSepetKcm');
    if(kcmSel.options.length<=1){
      const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
      kcmSel.innerHTML = '<option value="">Seçiniz...</option>' +
        (data||[]).map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
    }
    document.getElementById('donanimSepetTl').innerHTML = '<option value="">Önce KÇM seçin...</option>';
    document.getElementById('donanimSepetSatanMy').innerHTML = '<option value="">Önce Takım Lideri seçin...</option>';
  }

  openModal('donanimSepetModal');
}

// Kademeli seçim: KÇM seçilince o KÇM'nin Takım Liderlerini yükler
async function _donanimTLListesiYukle(){
  const kcmId = document.getElementById('donanimSepetKcm').value;
  const tlSel = document.getElementById('donanimSepetTl');
  const mySel = document.getElementById('donanimSepetSatanMy');
  tlSel.innerHTML = '<option value="">Yükleniyor...</option>';
  mySel.innerHTML = '<option value="">Önce Takım Lideri seçin...</option>';
  if(!kcmId){ tlSel.innerHTML='<option value="">Önce KÇM seçin...</option>'; return; }
  const {data} = await sb.from('users').select('my_id,ad_soyad')
    .eq('yetki_seviyesi','TAKIM LİDERİ').eq('kcm_id',kcmId).eq('aktif',true).order('ad_soyad');
  tlSel.innerHTML = '<option value="">Seçiniz...</option>' +
    (data||[]).map(u=>`<option value="${u.my_id}">${escapeHTML(u.ad_soyad)}</option>`).join('');
}

// Kademeli seçim: Takım Lideri seçilince o ekibin MY/FMY'lerini yükler
async function _donanimMyListesiYukle(){
  const tlId = document.getElementById('donanimSepetTl').value;
  const mySel = document.getElementById('donanimSepetSatanMy');
  mySel.innerHTML = '<option value="">Yükleniyor...</option>';
  if(!tlId){ mySel.innerHTML='<option value="">Önce Takım Lideri seçin...</option>'; return; }
  const {data} = await sb.from('users').select('my_id,ad_soyad,yetki_seviyesi')
    .in('yetki_seviyesi',['MY','FMY']).eq('takim_lideri_id',tlId).eq('aktif',true).order('ad_soyad');
  mySel.innerHTML = '<option value="">Seçiniz...</option>' +
    (data||[]).map(u=>`<option value="${u.my_id}">${escapeHTML(u.ad_soyad)} (${u.yetki_seviyesi})</option>`).join('');
}

let _donanimMusteriAramaTimer=null;
function donanimMusteriAramaDebounce(){
  clearTimeout(_donanimMusteriAramaTimer);
  _donanimMusteriAramaTimer = setTimeout(_donanimMusteriAra, 350);
}
async function _donanimMusteriAra(){
  const terim = document.getElementById('donanimSepetMusteriArama').value.trim();
  const sonucEl = document.getElementById('donanimSepetMusteriSonuc');
  if(terim.length<2){ sonucEl.innerHTML=''; return; }
  let q = getCustomerBaseQuery(true); // forForm=true: KÇM scope, portföy dışına da erişim
  q = q.or(`unvan.ilike.%${terim}%,ncst.ilike.%${terim}%`).limit(8);
  const {data} = await q;
  sonucEl.innerHTML = (data||[]).map(c=>`
    <div class="visit-card" style="padding:8px;margin-bottom:4px;cursor:pointer;" onclick='donanimMusteriSec(${JSON.stringify(c)})'>
      <div style="font-size:13px;font-weight:700;">${escapeHTML(c.unvan||c.ncst)}</div>
      <div style="font-size:11px;color:var(--text3);">NCST: ${escapeHTML(c.ncst)}</div>
    </div>`).join('') || '<div style="font-size:12px;color:var(--text3);padding:6px;">Sonuç yok</div>';
}
function donanimMusteriSec(c){
  window._donanimSepetSeciliMusteri = c;
  document.getElementById('donanimSepetMusteriSonuc').innerHTML='';
  document.getElementById('donanimSepetMusteriArama').value='';
  const el = document.getElementById('donanimSepetMusteriSecili');
  el.classList.remove('hide');
  el.innerHTML = `✓ <b>${escapeHTML(c.unvan||c.ncst)}</b> (NCST: ${escapeHTML(c.ncst)}) <a href="#" onclick="event.preventDefault();donanimMusteriTemizle()" style="color:var(--red);margin-left:8px;">✕</a>`;
}
function donanimMusteriTemizle(){
  window._donanimSepetSeciliMusteri = null;
  document.getElementById('donanimSepetMusteriSecili').classList.add('hide');
}

// v31.25: Satış Tipi (Peşin/OLM/Turkcell Finansman) — sepet gönderiminde zorunlu
function donanimSatisTipiSec(el, tip){
  document.querySelectorAll('#donanimSepetSatisTipiBox .chip-btn').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  window._donanimSepetSatisTipi = tip;
}

// V31.113: Sepeti gönderir — her ürün için ayrı rezervasyon satırı, ortak sepet_id.
// ARTIK cihaz DOĞRUDAN rezerve_adet'e düşer (eski davranış: sadece on_rezerve_adet
// artardı, stok görünürlüğü değişmezdi). Ayrıca aynı müşteri+ürün için aynı gün
// içinde mükerrer (2. veya sonraki) ön rezervasyon talebiyse durum otomatik
// "Yönetici Onayı Bekliyor" olur (Takım Lideri/KÇM Müdürü onayı gerekir).
async function donanimSepetGonder(){
  const musteri = window._donanimSepetSeciliMusteri;
  const kendiMY = (currentUser.yetki_seviyesi==='MY' || currentUser.yetki_seviyesi==='FMY');
  const satanMyId = kendiMY ? currentUser.my_id : document.getElementById('donanimSepetSatanMy').value;
  const not = document.getElementById('donanimSepetNot').value.trim();
  if(!musteri){ toast('Müşteri seçin','error'); return; }
  if(!satanMyId){ toast('Cihazı satacak MY/FMY seçin','error'); return; }
  // v31.25: Satış Tipi zorunlu (Peşin/OLM/Turkcell Finansman)
  const satisTipi = window._donanimSepetSatisTipi;
  if(!satisTipi){ toast('Satış tipi seçin (Peşin / OLM / Turkcell Finansman)','error'); return; }

  const sepetKeys = Object.keys(window._donanimSepet||{});
  if(!sepetKeys.length){ toast('Sepet boş','error'); return; }

  // V31.115 FIX: kcm_id artık ÜRÜNÜN depo satırından değil, SATAN MY'nin kendi
  // KÇM'sinden alınır (Hızlı Sevkiyat Konsolu'yla aynı desen). Ortak/Merkez havuz
  // ürün satırlarında kcm_id NULL olduğu için eski kod "null value in column
  // kcm_id" hatasıyla INSERT'i patlatıyordu.
  const kcmIdKayit = kendiMY ? currentUser.kcm_id : parseInt(document.getElementById('donanimSepetKcm').value);
  if(!kcmIdKayit){ toast('KÇM belirlenemedi — lütfen KÇM/Takım Lideri/MY seçimini kontrol edin','error'); return; }

  // V31.113: mükerrer talep tespiti — bugün, aynı müşteri (ncst), aynı ürün,
  // İptal/Reddedildi dışında kaç ön rezervasyon/sonraki adım kaydı var?
  const esik = window._donanimAyar.mukerrer_esik;
  const bugunBas = new Date(); bugunBas.setHours(0,0,0,0);
  let mukerrerVar = false;
  for(const uid of sepetKeys){
    const {count} = await sb.from('stok_rezervasyonlari').select('rezervasyon_id',{count:'exact', head:true})
      .eq('ncst', musteri.ncst).eq('urun_id', parseInt(uid))
      .not('durum','in','("İptal","Reddedildi")')
      .gte('created_at', bugunBas.toISOString());
    if((count||0) >= esik){ mukerrerVar = true; break; }
  }
  const durum = mukerrerVar ? 'Yönetici Onayı Bekliyor' : 'Ön Rezervasyon';
  // Yönetici Onayı Bekliyor'da süre sayacı işlemez (onay verilince başlar)
  const bitis = mukerrerVar ? null : await _donanimSureBitisHesapla(new Date().toISOString(), window._donanimAyar.onrez_sure_saat);

  const sepetId = crypto.randomUUID ? crypto.randomUUID() : (Date.now()+'-'+Math.random());
  const kayitlar = sepetKeys.map(uid=>{
    const item = window._donanimSepet[uid];
    return {
      urun_id: parseInt(uid),
      kcm_id: kcmIdKayit,
      adet: item.adet,
      ncst: musteri.ncst,
      musteri_my_id: musteri.my_id, // v30.87: donuk — kayıt anındaki portföy sahibi
      satan_my_id: parseInt(satanMyId),
      rezerve_eden_id: currentUser.my_id,
      durum: durum,
      sepet_id: sepetId,
      aciklama: not || null,
      satis_tipi: satisTipi,
      rezervasyon_bitis: bitis
    };
  });

  const {error} = await sb.from('stok_rezervasyonlari').insert(kayitlar);
  if(error){ toast('Hata: '+error.message,'error'); return; }

  // V31.113: rezerve_adet DOĞRUDAN artırılır (stok görünürlüğü/musait_adet hemen düşer)
  for(const uid of sepetKeys){
    const item = window._donanimSepet[uid];
    const yeniRezerve = (item.urun.rezerve_adet||0) + item.adet;
    await sb.from('stok_urunleri').update({rezerve_adet: yeniRezerve, updated_at:new Date().toISOString()}).eq('urun_id', parseInt(uid));
  }

  // Timeline özet log
  await _donanimRezHareketLog(durum, kayitlar, {ncst:musteri.ncst, satan_my_id:satanMyId});

  toast(mukerrerVar
    ? 'Mükerrer talep tespit edildi — Yönetici Onayı Bekliyor durumuna alındı'
    : 'Ön rezervasyon talebi oluşturuldu, cihaz stoktan düşürüldü', mukerrerVar?'info':'success');
  closeModal('donanimSepetModal');
  window._donanimSepet = {};
  window._donanimSecimModu = false;
  window._donanimSepetSatisTipi = null;
  _donanimSepetBarGuncelle();
  loadDonanimListesi();
}

function donanimSecimModunuKapat(){
  window._donanimSecimModu = false;
  window._donanimSepet = {};
  _donanimSepetBarGuncelle();
  _renderDonanimListesi(window._donanimList);
}

/* ============================================================
   SÜREÇ TAKİP EKRANI (v30.88)
   ------------------------------------------------------------
   Sekmeli yapı: "Stok" (mevcut liste) / "Rezervasyonlar" (süreç takibi)
   Görünürlük: getScope('donanim_takip')
     MY/FMY = PRT (sadece kendi sattığı) | TL/Müdür = KÇM | Admin/Depo/Direktör = TÜM
   ============================================================ */

// v30.90: Rezervasyon onay/red yetkisi — tek nokta.
// v30.94: kapsam Rol&Yetki ekranından — getScope('donanim_takip') (liste ile tutarlı).
//         Kodda sabit rol listesi YOK.
function _donanimRezOnayYetkisi(satanMyId, kcmId){
  if(!hasPerm('donanim_rezerve_et')) return false;
  const scope = getScope('donanim_takip');
  if(scope==='TÜM')   return true;
  if(scope==='KÇM')   return kcmId === currentUser.kcm_id;
  if(scope==='BAĞLI') return (bagliMyIds||[]).includes(satanMyId);
  return satanMyId === currentUser.my_id;   // PRT / PRT+
}

// v31.05: süreç adımı yetkisi — verilen izin + kapsam (getScope('donanim_takip'))
function _donanimSurecYetki(permKey, satanMyId, kcmId){
  if(!hasPerm(permKey)) return false;
  const scope = getScope('donanim_takip');
  if(scope==='TÜM')   return true;
  if(scope==='KÇM')   return kcmId === currentUser.kcm_id;
  if(scope==='BAĞLI') return (bagliMyIds||[]).includes(satanMyId);
  return satanMyId === currentUser.my_id;
}

// V31.117: Donanım Satış Süreç Akışı V2 — yeni 7 adımlı akış. IMEI eşleştirme
// artık Turkcell Finans Onay'dan ÖNCE, "Stok Onay Emei Giriş" adımının kendisinde
// tamamlanıyor; 'Kısmen Eşleştirildi'/'Eşleştirildi' durumları geriye dönük
// uyumluluk için (eski kayıtlar veya Hızlı Sevkiyat Konsolu'nun geçiş anı) haritada
// tutuluyor ama normal akışta artık üretilmiyorlar.
const DONANIM_SUREC_ADIMLARI = {
  'Ön Rezervasyon':        {no:1, renk:'#e74c3c'},
  'Yönetici Onayı Bekliyor':{no:1, renk:'#e67e22'},   // mükerrer talep — ara durum
  'Onaylandı':             {no:2, renk:'#e67e22'},     // Rezervasyon Onayı
  'Stok Onay Emei Giriş':  {no:3, renk:'#f39c12'},     // IMEI seçimi burada yapılır
  'Kısmen Eşleştirildi':   {no:3, renk:'#e59866'},     // geriye dönük uyumluluk
  'Eşleştirildi':          {no:3, renk:'#3498db'},     // geriye dönük uyumluluk
  'Turkcell Finans Onay':  {no:4, renk:'#f1c40f'},     // IMEI'ler tam, finans onayı bekliyor
  'Finans Onaylandı':      {no:5, renk:'#e67e22'},     // V31.119: finans onaylandı, Depo&Muhasebe fatura kesmeyi bekliyor
  'Fatura Kesildi':        {no:6, renk:'#9b59b6'},     // fatura kesildi, sevkiyat bekliyor
  'Tamamlandı':            {no:7, renk:'#2ecc71'},
  'Cihaz Gönderildi':      {no:7, renk:'#2ecc71'},     // geriye dönük uyumluluk
  'Süresi Doldu':          {no:0, renk:'#b03a2e'},   // V31.58
  'Kısmi Tamamlandı':      {no:3, renk:'#5d6d7e'},   // V31.58
  'Reddedildi':            {no:0, renk:'#c0392b'},
  'İptal':                 {no:0, renk:'#7f8c8d'}
};

// v31.25: Satış Tipi renkleri (Peşin/OLM/Turkcell Finansman) — rozet gösterimi için
const DONANIM_SATIS_TIPI_RENK = { 'Peşin':'#2ecc71', 'OLM':'#3498db', 'Turkcell Finansman':'#9b59b6' };

// V31.131: kartta "sırada ne var / kim bekleniyor" açıklaması — durum bazlı statik metin
const DONANIM_BEKLEYEN = {
  'Ön Rezervasyon':          'Onay bekleniyor (Takım Lideri / KÇM Müdürü)',
  'Yönetici Onayı Bekliyor': 'Mükerrer talep onayı bekleniyor (Takım Lideri / KÇM Müdürü)',
  'Onaylandı':               'Stok Onay / IMEI girişi bekleniyor',
  'Stok Onay Emei Giriş':    'IMEI eşleştirme sürüyor',
  'Kısmen Eşleştirildi':     'IMEI eşleştirme tamamlanmadı',
  'Eşleştirildi':            'Turkcell Finans Onayı bekleniyor',
  'Turkcell Finans Onay':    'Turkcell Finans Onayı bekleniyor',
  'Finans Onaylandı':        'Fatura kesilmesi bekleniyor (Depo & Muhasebe)',
  'Fatura Kesildi':          'Sevkiyat (cihaz gönderimi) bekleniyor',
  'Tamamlandı':              'Süreç tamamlandı',
  'Cihaz Gönderildi':        'Süreç tamamlandı',
  'Süresi Doldu':            'Süre doldu — işlem yapılmadı, cihaz stoğa iade edildi',
  'Kısmi Tamamlandı':        'Kısmen tamamlandı',
  'Reddedildi':              'Talep reddedildi',
  'İptal':                   'İptal edildi'
};

// V31.120: Kart altındaki süreç özet barı + çerçeve rengi için mor→kırmızı→
// turuncu→sarı→yeşil gradyanı. Index = DONANIM_SUREC_ADIMLARI[durum].no (1..7).
// no:0 (Reddedildi/İptal/Süresi Doldu) bu gradyanı kullanmaz, kendi renginde kalır.
const DONANIM_ADIM_TOPLAM = 7;
const DONANIM_ADIM_RENK = ['var(--text3)','#8e44ad','#e74c3c','#e67e22','#f1c40f','#f39c12','#27ae60','#2ecc71'];

// Kartın altına, mevcut adıma kadar dolu, kalanı siyah kutucuklardan oluşan
// ince bir çubuk çizer. no<=0 (terminal negatif durumlar) için çubuk çizilmez.
function _donanimSurecBarHTML(no){
  no = Number(no);
  if(!no || isNaN(no) || no<1) return '';
  const renk = DONANIM_ADIM_RENK[no] || 'var(--text3)';
  let kutular = '';
  for(let i=1; i<=DONANIM_ADIM_TOPLAM; i++){
    kutular += `<div style="flex:1;height:5px;border-radius:2px;background:${i<=no?renk:'#000'};"></div>`;
  }
  return `<div style="display:flex;gap:2px;margin-top:8px;">${kutular}</div>`;
}

// ============================================================
// V31.113: DONANIM SÜREÇ AYARLARI — sistem_ayarlari'den okunur, kod içinde
// sabit sayı YOK. Admin Panel > Uygulama Ayarları > Donanım Satış Süreç
// Ayarları ekranından değiştirilir. Yüklenemezse (SQL henüz çalıştırılmadıysa)
// aşağıdaki varsayılanlarla devam edilir — akış hiçbir zaman kilitlenmez.
// ============================================================
window._donanimAyar = window._donanimAyar || {
  onrez_sure_saat: 6, onrez_uzatma_saat: 6, onrez_max_uzatma: 1,
  emei_sure_saat: 48, mukerrer_esik: 2
};
async function _donanimAyarYukle(){
  try{
    const {data, error} = await sb.from('sistem_ayarlari').select('ayar_tipi,deger')
      .in('ayar_tipi',['donanim_onrez_sure_saat','donanim_onrez_uzatma_saat','donanim_onrez_max_uzatma',
        'donanim_emei_sure_saat','donanim_mukerrer_esik']).eq('aktif',true);
    if(error || !data) return;
    const map = { donanim_onrez_sure_saat:'onrez_sure_saat', donanim_onrez_uzatma_saat:'onrez_uzatma_saat',
      donanim_onrez_max_uzatma:'onrez_max_uzatma', donanim_emei_sure_saat:'emei_sure_saat',
      donanim_mukerrer_esik:'mukerrer_esik' };
    data.forEach(r=>{ const k=map[r.ayar_tipi]; const v=parseInt(r.deger); if(k && v>0) window._donanimAyar[k]=v; });
  }catch(e){ console.warn('[donanim] ayar yükleme:', e.message); }
}

// ============================================================
// v31.26: Tedarik akışı bildirimi — Ana menüdeki 'Donanım Takip' ikonu üzerinde
// rozet. Kullanıcının kendi (satan veya rezerve eden olduğu) sipariş(ler)i
// 'Onaylandı' adımına geçtiğinde rozette sayı görünür (görev rozetiyle aynı
// desen: js/gorev.js updateGorevBadge/#gorevMenuBadge — okundu/okunmadı takibi
// yok, adım değişince rozet kendiliğinden güncellenir/kaybolur).
// V31.115: rozet artık ayrıca YÖNETİCİNİN onayını/reddini bekleyen kayıtları da
// sayar — Ön Rezervasyon (donanim_rezerve_et yetkisi olanlar için) ve Yönetici
// Onayı Bekliyor / mükerrer talep (donanim_mukerrer_onay yetkisi olanlar için).
// V31.118: BUG FİX — rozet yalnız Ön Rezervasyon/Yönetici Onayı Bekliyor
// durumlarını sayıyordu; Emei Girişi (Onaylandı/Stok Onay Emei Giriş) ve
// Turkcell Finans Onayı bekleyen kayıtlar hiç sayılmıyordu, o yüzden finans
// onaycılarında rozet hiç çıkmıyordu. Artık her "birinin eylemini bekleyen"
// durum, o eylemin yetkisi+kapsamıyla ayrı ayrı sayılıyor.
// Onay veya red verilene kadar sayı ekranda kalır (durum değişince otomatik düşer).
// ============================================================
async function _donanimBadgeGuncelle(){
  const badge = document.getElementById('donanimMenuBadge');
  if(!badge) return;
  const mid = currentUser?.my_id;
  if(!mid){ badge.style.display='none'; return; }
  let sayi = 0;

  // 1) Kullanıcının kendi (satan/rezerve eden) siparişi 'Onaylandı' adımına geçmiş — bilgilendirme
  const {data:kendi, error:kendiErr} = await sb.from('stok_rezervasyonlari')
    .select('sepet_id').eq('durum','Onaylandı').or(`satan_my_id.eq.${mid},rezerve_eden_id.eq.${mid}`);
  if(kendiErr){ console.warn('_donanimBadgeGuncelle (kendi):', kendiErr.message); }
  else sayi += new Set((kendi||[]).map(r=>r.sepet_id)).size;

  // 2) Kullanıcının ONAYINI/İLERLETMESİNİ bekleyen kayıtlar — süreç boyunca her
  // adımda, o adımın yetkisi olan biri için. V31.118: Turkcell Finans Onay ve
  // Fatura Kesildi (sevk) eklendi. V31.119: 'Finans Onaylandı' ara durumu da
  // eklendi (fatura kesilmesini bekleyen, donanim_sevk).
  const eylemGerektiren = ['donanim_rezerve_et','donanim_mukerrer_onay','donanim_emei_giris','donanim_finans_onay','donanim_sevk'];
  if(eylemGerektiren.some(p=>hasPerm(p))){
    const {data:bekleyen, error:bErr} = await sb.from('stok_rezervasyonlari')
      .select('sepet_id,durum,satan_my_id,kcm_id')
      .in('durum',['Ön Rezervasyon','Yönetici Onayı Bekliyor','Onaylandı','Stok Onay Emei Giriş','Turkcell Finans Onay','Finans Onaylandı','Fatura Kesildi']);
    if(bErr){ console.warn('_donanimBadgeGuncelle (bekleyen):', bErr.message); }
    else {
      const setler = new Set();
      (bekleyen||[]).forEach(r=>{
        if(r.durum==='Ön Rezervasyon' && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id)) setler.add(r.sepet_id);
        if(r.durum==='Yönetici Onayı Bekliyor' && _donanimSurecYetki('donanim_mukerrer_onay', r.satan_my_id, r.kcm_id)) setler.add(r.sepet_id);
        if((r.durum==='Onaylandı'||r.durum==='Stok Onay Emei Giriş') && _donanimSurecYetki('donanim_emei_giris', r.satan_my_id, r.kcm_id)) setler.add(r.sepet_id);
        if(r.durum==='Turkcell Finans Onay' && _donanimSurecYetki('donanim_finans_onay', r.satan_my_id, r.kcm_id)) setler.add(r.sepet_id);
        if((r.durum==='Finans Onaylandı'||r.durum==='Fatura Kesildi') && _donanimSurecYetki('donanim_sevk', r.satan_my_id, r.kcm_id)) setler.add(r.sepet_id);
      });
      sayi += setler.size;
    }
  }

  // 3) V31.122: BUG FİX — Transfer talepleri (stok_transfer_talepleri) rozete
  // hiç dahil edilmiyordu; onay bekleyen transfer talepleri bildirime hiç
  // yansımıyordu. Aşama 1 (donanim_transfer_onay1, kaynak KÇM kapsamlı) ve
  // Aşama 2 (donanim_transfer_onay2) bekleyenler artık ayrı ayrı sayılıyor.
  if(hasPerm('donanim_transfer_onay1') || hasPerm('donanim_transfer_onay2')){
    const {data:trBekleyen, error:trErr} = await sb.from('stok_transfer_talepleri')
      .select('id,durum,kaynak_kcm_id').in('durum',['Aşama 1 Bekliyor','Aşama 2 Bekliyor']);
    if(trErr){ console.warn('_donanimBadgeGuncelle (transfer):', trErr.message); }
    else {
      let trSayi = 0;
      (trBekleyen||[]).forEach(t=>{
        if(t.durum==='Aşama 1 Bekliyor' && _donanimTransferOnay1Yetkisi(t.kaynak_kcm_id)) trSayi++;
        if(t.durum==='Aşama 2 Bekliyor' && hasPerm('donanim_transfer_onay2')) trSayi++;
      });
      sayi += trSayi;
    }
  }

  badge.textContent = sayi || '';
  badge.style.display = sayi > 0 ? 'inline-flex' : 'none';
}

// v30.96: 3 sekme — Stok / Rezervasyonlar / Transfer
function donanimTabGeç(hangi){
  const tabs = {
    stok:     {btn:'donanimTabStokBtn',     sekme:'donanimStokSekme'},
    rez:      {btn:'donanimTabRezBtn',      sekme:'donanimRezSekme'},
    transfer: {btn:'donanimTabTransferBtn', sekme:'donanimTransferSekme'},
    depo:     {btn:'donanimTabDepoBtn',     sekme:'donanimDepoSekme'},     // V31.55
    talep:    {btn:'donanimTabTalepBtn',    sekme:'donanimTalepSekme'}     // V31.57
  };
  const sepetBar = document.getElementById('donanimSepetBar');
  Object.keys(tabs).forEach(k=>{
    const t = tabs[k], aktif = (k===hangi);
    const btn = document.getElementById(t.btn), sekme = document.getElementById(t.sekme);
    if(btn){ btn.style.background = aktif?'var(--blue)':''; btn.classList.toggle('btn-ghost', !aktif); }
    if(sekme){ sekme.classList.toggle('hide', !aktif); }
  });
  if(hangi==='stok'){ if(sepetBar) _donanimSepetBarGuncelle(); loadDonanimListesi(); }
  else if(sepetBar){ sepetBar.classList.add('hide'); }
  if(hangi==='rez') loadDonanimRezervasyonlar();
  if(hangi==='transfer') loadDonanimTransferListesi();
  // V31.61: dagitim izgarasi 480px cerceveye sigmaz — sadece bu sekmede genisler
  const _dsayfa = document.getElementById('pageMenuDonanim');
  if(_dsayfa) _dsayfa.classList.toggle('genis', hangi==='depo');
  if(hangi==='depo') loadDonanimDepoSekme();                                // V31.55
  if(hangi==='talep') loadDonanimTalepListesi();                            // V31.57
}

// ============ TRANSFER (Adım 2: Talep) ============
const DONANIM_TRANSFER_DURUM_RENK = {
  'Aşama 1 Bekliyor':'#e67e22', 'Aşama 2 Bekliyor':'#f1c40f',
  'Onaylandı':'#27ae60', 'Reddedildi':'#e74c3c', 'İptal':'var(--text3)'
};

async function loadDonanimTransferListesi(){
  const listEl = document.getElementById('donanimTransferListesi');
  if(!listEl) return;
  const yeniBtn = document.getElementById('donanimTransferYeniBtn');
  if(yeniBtn) yeniBtn.style.display = hasPerm('donanim_transfer_talep') ? 'block' : 'none';

  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  // Görünürlük kapsamı — liste ile onay tutarlı olsun diye getScope('donanim_takip')
  const scope = getScope('donanim_takip');
  let q = sb.from('stok_transfer_talepleri').select('*').order('created_at',{ascending:false});
  if(scope==='TÜM'){ /* filtresiz */ }
  else if(scope==='KÇM' && currentUser.kcm_id){
    q = q.or(`kaynak_kcm_id.eq.${currentUser.kcm_id},hedef_kcm_id.eq.${currentUser.kcm_id}`);
  } else {
    q = q.eq('talep_eden_id', currentUser.my_id);
  }
  const {data, error} = await q;
  if(error){ listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ listEl.innerHTML = '<div class="empty">Transfer talebi yok.</div>'; return; }

  // Eşleme: KÇM adları, ürün açıklamaları, talep eden adı
  const kcmIds  = [...new Set(data.flatMap(t=>[t.kaynak_kcm_id,t.hedef_kcm_id]).filter(Boolean))];
  const urunIds = [...new Set(data.map(t=>t.kaynak_urun_id).filter(Boolean))];
  const myIds   = [...new Set(data.map(t=>t.talep_eden_id).filter(Boolean))];
  const kcmMap={}, urunMap={}, myMap={};
  if(kcmIds.length){ const {data:k}=await sb.from('kcm_groups').select('kcm_id,kcm_adi').in('kcm_id',kcmIds); (k||[]).forEach(x=>kcmMap[x.kcm_id]=x.kcm_adi); }
  if(urunIds.length){ const {data:u}=await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id',urunIds); (u||[]).forEach(x=>urunMap[x.urun_id]=x.aciklama); }
  if(myIds.length){ const {data:m}=await sb.from('users').select('my_id,ad_soyad').in('my_id',myIds); (m||[]).forEach(x=>myMap[x.my_id]=x.ad_soyad); }

  listEl.innerHTML = data.map(t=>{
    const renk = DONANIM_TRANSFER_DURUM_RENK[t.durum]||'var(--text3)';
    // v30.98: duruma + yetkiye göre aksiyon butonları
    const canOnay1  = t.durum==='Aşama 1 Bekliyor' && _donanimTransferOnay1Yetkisi(t.kaynak_kcm_id);
    const canOnay2  = t.durum==='Aşama 2 Bekliyor' && hasPerm('donanim_transfer_onay2');
    const canIptal  = ['Aşama 1 Bekliyor','Aşama 2 Bekliyor'].includes(t.durum) && t.talep_eden_id===currentUser.my_id;
    let butonlar='';
    if(canOnay1) butonlar += `<button class="btn btn-sm" style="flex:1;background:var(--green);color:#04301f;" onclick="donanimTransferOnay1(${t.id})">✓ 1. Onay</button>`;
    if(canOnay2) butonlar += `<button class="btn btn-sm" style="flex:1;background:var(--green);color:#04301f;" onclick="donanimTransferOnay2(${t.id})">✓ 2. Onay (Taşı)</button>`;
    if(canOnay1||canOnay2) butonlar += `<button class="btn btn-sm" style="flex:1;background:#000;border:2px solid var(--red);color:var(--red);" onclick="donanimTransferReddet(${t.id})">✕ Reddet</button>`;
    if(canIptal) butonlar += `<button class="btn btn-sm" style="flex:1;background:#350f18;border:1.5px solid #ed2345;color:#fff;" onclick="donanimTransferIptal(${t.id})">✕ İptal</button>`;
    const butonSatiri = butonlar ? `<div style="display:flex;gap:6px;margin-top:8px;">${butonlar}</div>` : '';
    return `<div class="visit-card" style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="font-weight:600;font-size:13px;">${escapeHTML(urunMap[t.kaynak_urun_id]||'Cihaz #'+t.kaynak_urun_id)}</div>
        <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${renk};color:#fff;white-space:nowrap;">${escapeHTML(t.durum)}</span>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">
        ${escapeHTML(kcmMap[t.kaynak_kcm_id]||'KÇM#'+t.kaynak_kcm_id)} &rarr; ${escapeHTML(kcmMap[t.hedef_kcm_id]||'KÇM#'+t.hedef_kcm_id)} · <b>${t.adet} adet</b>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">
        Talep eden: ${escapeHTML(myMap[t.talep_eden_id]||'—')} · ${new Date(t.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}
      </div>
      ${t.aciklama?`<div style="font-size:11px;color:var(--text3);margin-top:2px;">Not: ${escapeHTML(t.aciklama)}</div>`:''}
      ${t.red_neden?`<div style="font-size:11px;color:var(--red);margin-top:2px;">Red: ${escapeHTML(t.red_neden)}</div>`:''}
      ${butonSatiri}
    </div>`;
  }).join('');
}

// v30.98: 1. onay yetkisi — onay1 izni + kaynak KÇM kapsamı (getScope ile)
function _donanimTransferOnay1Yetkisi(kaynakKcmId){
  if(!hasPerm('donanim_transfer_onay1')) return false;
  const scope = getScope('donanim_takip');
  if(scope==='TÜM') return true;
  if(scope==='KÇM') return kaynakKcmId === currentUser.kcm_id;
  return false;
}

async function donanimTransferOnay1(id){
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  if(t.durum!=='Aşama 1 Bekliyor'){ toast('Bu talep 1. onay aşamasında değil','info'); loadDonanimTransferListesi(); return; }
  if(!_donanimTransferOnay1Yetkisi(t.kaynak_kcm_id)){ toast('1. onay yetkiniz yok','error'); return; }
  const {error:uErr} = await sb.from('stok_transfer_talepleri').update({
    durum:'Aşama 2 Bekliyor', asama1_onay_id:currentUser.my_id,
    asama1_tarih:new Date().toISOString(), updated_at:new Date().toISOString()
  }).eq('id',id).eq('durum','Aşama 1 Bekliyor');
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({ urun_id:t.kaynak_urun_id, aksiyon:'Transfer 1. Onay',
    detay:`Talep #${id} 1. onay (KÇM#${t.kaynak_kcm_id} → KÇM#${t.hedef_kcm_id}, ${t.adet} adet)`,
    user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });
  toast('1. onay verildi','success');
  loadDonanimTransferListesi();
  if(typeof _donanimBadgeGuncelle==='function') _donanimBadgeGuncelle();
}

async function donanimTransferOnay2(id){
  if(!hasPerm('donanim_transfer_onay2')){ toast('2. onay yetkiniz yok','error'); return; }
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  if(t.durum!=='Aşama 2 Bekliyor'){ toast('Bu talep 2. onay aşamasında değil','info'); loadDonanimTransferListesi(); return; }

  // Kaynak ürünü oku, müsait YENİDEN kontrol (talep sonrası stok değişmiş olabilir)
  const {data:kaynak, error:kErr} = await sb.from('stok_urunleri').select('*').eq('urun_id',t.kaynak_urun_id).single();
  if(kErr||!kaynak){ toast('Kaynak ürün bulunamadı','error'); return; }
  const musait = (kaynak.toplam_adet||0) - (kaynak.rezerve_adet||0);
  if(musait < t.adet){ toast(`Kaynak stok yetersiz (müsait: ${musait}, gerekli: ${t.adet}) — taşıma yapılmadı`,'error'); return; }

  // 1) Kaynağı düş (gte guard: eşzamanlı düşüşte negatif olmaz)
  const {data:kUpdData, error:kUpd} = await sb.from('stok_urunleri')
    .update({ toplam_adet: kaynak.toplam_adet - t.adet, updated_at:new Date().toISOString() })
    .eq('urun_id',kaynak.urun_id).gte('toplam_adet', t.adet).select('urun_id');
  if(kUpd || !kUpdData || !kUpdData.length){ toast('Kaynak stok güncellenemedi (eşzamanlı değişim?) — taşıma yapılmadı','error'); loadDonanimTransferListesi(); return; }

  // 2) Hedefe ekle (varsa +, yoksa yeni satır). Başarısız olursa kaynağı GERİ AL.
  // V31.126 FIX: hedef satırı artık depo_id (metin değil, kayıtlı ANA depo
  // kimliği) ile aranıyor/oluşturuluyor. Eskiden depo_adi (serbest metin)
  // ile eşleştiriliyordu ve yeni satır INSERT edilirken depo_id HİÇ
  // yazılmıyordu — bu, hedef KÇM'nin "hiçbir depoya bağlı olmayan" (yetim)
  // stok satırları üretmesine sebep oluyordu (Depo modülü/Dağıtım Izgarası
  // bu satırları hiç göremiyordu).
  const hedefDepoId = await _donanimAnaDepoId(t.hedef_kcm_id);
  if(!hedefDepoId){
    // Kaynağı geri al, hedef KÇM'nin kayıtlı bir ANA deposu yoksa transfer yapılamaz
    await sb.from('stok_urunleri').update({ toplam_adet: kaynak.toplam_adet, updated_at:new Date().toISOString() }).eq('urun_id',kaynak.urun_id);
    toast('Hedef KÇM için kayıtlı bir ANA depo bulunamadı — taşıma yapılmadı','error');
    loadDonanimTransferListesi();
    return;
  }
  const {data:hedef} = await sb.from('stok_urunleri').select('*')
    .eq('depo_id',hedefDepoId).eq('malzeme_kodu',kaynak.malzeme_kodu).maybeSingle();
  let hedefErr=null;
  if(hedef){
    const {error:hUpd} = await sb.from('stok_urunleri')
      .update({ toplam_adet:(hedef.toplam_adet||0)+t.adet, updated_at:new Date().toISOString() }).eq('urun_id',hedef.urun_id);
    hedefErr = hUpd;
  } else {
    const {error:hIns} = await sb.from('stok_urunleri').insert({
      kcm_id:t.hedef_kcm_id, depo_id:hedefDepoId, depo_adi:kaynak.depo_adi, malzeme_kodu:kaynak.malzeme_kodu,
      marka:kaynak.marka, model:kaynak.model, renk:kaynak.renk, gb_hafiza:kaynak.gb_hafiza,
      fiyat:kaynak.fiyat, aciklama:kaynak.aciklama, toplam_adet:t.adet, rezerve_adet:0, on_rezerve_adet:0, aktif:true
    });
    hedefErr = hIns;
  }
  if(hedefErr){
    // KOMPANZASYON: kaynağı eski haline döndür
    await sb.from('stok_urunleri').update({ toplam_adet: kaynak.toplam_adet, updated_at:new Date().toISOString() }).eq('urun_id',kaynak.urun_id);
    toast('Hedefe eklenemedi, işlem geri alındı: '+hedefErr.message,'error');
    loadDonanimTransferListesi();
    return;
  }

  // 3) Talebi Onaylandı yap + timeline
  await sb.from('stok_transfer_talepleri').update({ durum:'Onaylandı', asama2_onay_id:currentUser.my_id,
    asama2_tarih:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',id);
  await sb.from('stok_hareketleri').insert({ urun_id:kaynak.urun_id, aksiyon:'Stok Transferi',
    detay:`${t.adet} adet taşındı: KÇM#${t.kaynak_kcm_id} → KÇM#${t.hedef_kcm_id} (talep #${id})`,
    user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });

  toast('Transfer onaylandı, stok taşındı','success');
  loadDonanimTransferListesi();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
  if(typeof _donanimBadgeGuncelle==='function') _donanimBadgeGuncelle();
}

async function donanimTransferReddet(id){
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  let yetkili=false;
  if(t.durum==='Aşama 1 Bekliyor') yetkili=_donanimTransferOnay1Yetkisi(t.kaynak_kcm_id);
  else if(t.durum==='Aşama 2 Bekliyor') yetkili=hasPerm('donanim_transfer_onay2');
  if(!yetkili){ toast('Reddetme yetkiniz yok','error'); return; }
  const neden = (prompt('Red nedeni (opsiyonel):','')||'').trim();
  const {error:uErr} = await sb.from('stok_transfer_talepleri').update({ durum:'Reddedildi', red_neden:neden||null, updated_at:new Date().toISOString() }).eq('id',id);
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({ urun_id:t.kaynak_urun_id, aksiyon:'Transfer Reddedildi',
    detay:`Talep #${id} reddedildi${neden?': '+neden:''}`, user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });
  toast('Talep reddedildi','info');
  loadDonanimTransferListesi();
  if(typeof _donanimBadgeGuncelle==='function') _donanimBadgeGuncelle();
}

async function donanimTransferIptal(id){
  const {data:t, error} = await sb.from('stok_transfer_talepleri').select('*').eq('id',id).single();
  if(error||!t){ toast('Talep bulunamadı','error'); return; }
  if(t.talep_eden_id!==currentUser.my_id){ toast('Sadece talep eden iptal edebilir','error'); return; }
  if(!['Aşama 1 Bekliyor','Aşama 2 Bekliyor'].includes(t.durum)){ toast('Bu talep iptal edilemez','info'); return; }
  const {error:uErr} = await sb.from('stok_transfer_talepleri').update({ durum:'İptal', updated_at:new Date().toISOString() }).eq('id',id);
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({ urun_id:t.kaynak_urun_id, aksiyon:'Transfer İptal',
    detay:`Talep #${id} talep eden tarafından iptal edildi`, user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id) });
  toast('Talep iptal edildi','info');
  loadDonanimTransferListesi();
  if(typeof _donanimBadgeGuncelle==='function') _donanimBadgeGuncelle();
}

async function donanimTransferModalAc(){
  if(!hasPerm('donanim_transfer_talep')){ toast('Transfer talebi yetkiniz yok','error'); return; }
  const {data:kcms} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
  const kaynakSel = document.getElementById('donanimTransferKaynakKcm');
  const hedefSel  = document.getElementById('donanimTransferHedefKcm');
  const hedefWrap = document.getElementById('donanimTransferHedefWrap');

  // Kaynak: kendi KÇM'si hariç
  kaynakSel.innerHTML = '<option value="">Seçiniz...</option>' +
    (kcms||[]).filter(k=>k.kcm_id!==currentUser.kcm_id)
      .map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');

  // Hedef: kcm_id varsa otomatik (gizli); global kullanıcı ise seçtir
  if(currentUser.kcm_id){
    hedefWrap.style.display='none';
    window._transferHedefKcm = currentUser.kcm_id;
  } else {
    hedefWrap.style.display='block';
    hedefSel.innerHTML = '<option value="">Seçiniz...</option>' +
      (kcms||[]).map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
    window._transferHedefKcm = null;
  }

  document.getElementById('donanimTransferCihaz').innerHTML = '<option value="">Önce kaynak KÇM seçin</option>';
  document.getElementById('donanimTransferAdet').value = 1;
  document.getElementById('donanimTransferAciklama').value = '';
  window._transferMusaitMap = {};
  openModal('donanimTransferModal');
}

async function donanimTransferKaynakSecildi(){
  const kaynakKcm = document.getElementById('donanimTransferKaynakKcm').value;
  const cihazSel  = document.getElementById('donanimTransferCihaz');
  if(!kaynakKcm){ cihazSel.innerHTML='<option value="">Önce kaynak KÇM seçin</option>'; return; }
  cihazSel.innerHTML='<option value="">Yükleniyor...</option>';
  const {data, error} = await sb.from('stok_musait')
    .select('urun_id,aciklama,musait_adet').eq('kcm_id',parseInt(kaynakKcm)).gt('musait_adet',0).order('aciklama');
  if(error || !data || !data.length){ cihazSel.innerHTML='<option value="">Bu KÇM\'de müsait cihaz yok</option>'; return; }
  window._transferMusaitMap = {};
  data.forEach(u=>{ window._transferMusaitMap[u.urun_id]=u.musait_adet; });
  cihazSel.innerHTML = '<option value="">Seçiniz...</option>' +
    data.map(u=>`<option value="${u.urun_id}">${escapeHTML(u.aciklama||'Cihaz #'+u.urun_id)} (müsait: ${u.musait_adet})</option>`).join('');
}

async function donanimTransferKaydet(){
  if(!hasPerm('donanim_transfer_talep')){ toast('Yetkiniz yok','error'); return; }
  const kaynakKcm = document.getElementById('donanimTransferKaynakKcm').value;
  const urunId    = document.getElementById('donanimTransferCihaz').value;
  const adet      = parseInt(document.getElementById('donanimTransferAdet').value);
  const aciklama  = document.getElementById('donanimTransferAciklama').value.trim();
  const hedefKcm  = currentUser.kcm_id || document.getElementById('donanimTransferHedefKcm').value;

  if(!kaynakKcm){ toast('Kaynak KÇM seçin','error'); return; }
  if(!hedefKcm){ toast('Hedef KÇM seçin','error'); return; }
  if(String(kaynakKcm)===String(hedefKcm)){ toast('Kaynak ve hedef KÇM aynı olamaz','error'); return; }
  if(!urunId){ toast('Cihaz seçin','error'); return; }
  if(!adet || adet<1){ toast('Geçerli adet girin','error'); return; }
  const musait = (window._transferMusaitMap||{})[urunId] ?? 0;
  if(adet>musait){ toast(`Müsait stok yetersiz (müsait: ${musait})`,'error'); return; }

  const {error} = await sb.from('stok_transfer_talepleri').insert({
    kaynak_urun_id: parseInt(urunId),
    kaynak_kcm_id:  parseInt(kaynakKcm),
    hedef_kcm_id:   parseInt(hedefKcm),
    adet: adet,
    durum: 'Aşama 1 Bekliyor',
    talep_eden_id: currentUser.my_id,
    aciklama: aciklama || null
  });
  if(error){ toast('Hata: '+error.message,'error'); return; }

  await sb.from('stok_hareketleri').insert({
    urun_id: parseInt(urunId),
    aksiyon: 'Transfer Talebi',
    detay: `${adet} adet — kaynak KÇM#${kaynakKcm} → hedef KÇM#${hedefKcm}`,
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  });

  toast('Transfer talebi oluşturuldu','success');
  closeModal('donanimTransferModal');
  loadDonanimTransferListesi();
  if(typeof _donanimBadgeGuncelle==='function') _donanimBadgeGuncelle();
}

// V31.120: Rezervasyon filtreleri — KÇM (yalnız TÜM kapsamı), MY/FMY arama,
// süreç adımı, ödeme tipi, tarih aralığı. KÇM+scope sorguya server tarafında
// eklenir; kişi/durum/ödeme tipi/tarih ise myMap/satisTipiMap hazır olduktan
// sonra client tarafında uygulanır (küçük veri kümesi, ekstra sorgu gerekmez).
let _donanimRezFiltreTimer=null;
function donanimRezFiltreDegistiDebounce(){
  clearTimeout(_donanimRezFiltreTimer);
  _donanimRezFiltreTimer=setTimeout(loadDonanimRezervasyonlar,350);
}
function donanimRezFiltreTemizle(){
  ['donanimRezKcmFiltre','donanimRezDurumFiltre','donanimRezSatisTipiFiltre'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  ['donanimRezKisiFiltre','donanimRezTarihBas','donanimRezTarihBit'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  loadDonanimRezervasyonlar();
}
let _donanimRezFiltreSecenekYuklendi=false;
async function _loadDonanimRezFiltreSecenekleri(){
  const scope = getScope('donanim_takip');
  const kcmSel = document.getElementById('donanimRezKcmFiltre');
  if(kcmSel) kcmSel.style.display = (scope==='TÜM') ? '' : 'none';
  if(_donanimRezFiltreSecenekYuklendi) return;
  _donanimRezFiltreSecenekYuklendi = true;
  if(scope==='TÜM' && kcmSel){
    const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
    kcmSel.innerHTML = '<option value="">Tüm KÇM\'ler</option>' +
      (data||[]).map(k=>`<option value="${k.kcm_id}">${escapeHTML(k.kcm_adi)}</option>`).join('');
  }
  // Süreç adımı seçenekleri — geriye dönük uyumluluk kayıtlarını (Kısmen Eşleştirildi,
  // Eşleştirildi, Cihaz Gönderildi) hariç tutup, sırayla anlamlı olanları listeler.
  const durumSel = document.getElementById('donanimRezDurumFiltre');
  if(durumSel){
    const siraliDurumlar = ['Ön Rezervasyon','Yönetici Onayı Bekliyor','Onaylandı','Stok Onay Emei Giriş',
      'Turkcell Finans Onay','Finans Onaylandı','Fatura Kesildi','Tamamlandı','Süresi Doldu','Reddedildi','İptal'];
    durumSel.innerHTML = '<option value="">Tüm süreç adımları</option>' +
      siraliDurumlar.map(d=>`<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('');
  }
}

// V31.121: Rezervasyon listesi sıralaması — bkz. loadDonanimRezervasyonlar().
// Kayıt, mevcut kullanıcının eyleminin (onay/red/ilerletme) o an adımda
// bekleniyor olup olmadığına göre değerlendirilir — buOnaylayabilir/buEmeiGiris/
// buFinansOnay/vb. ile AYNI yetki+kapsam kontrolleri, kart render'ından bağımsız
// tek noktada (sıralama render'dan ÖNCE yapıldığı için ayrı fonksiyon gerekti).
function _donanimBenimOnayimBekliyorMu(r){
  switch(r.durum){
    case 'Ön Rezervasyon': return _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id);
    case 'Yönetici Onayı Bekliyor': return _donanimSurecYetki('donanim_mukerrer_onay', r.satan_my_id, r.kcm_id);
    case 'Onaylandı':
    case 'Stok Onay Emei Giriş':
      return _donanimSurecYetki('donanim_emei_giris', r.satan_my_id, r.kcm_id);
    case 'Turkcell Finans Onay':
      return _donanimSurecYetki('donanim_finans_onay', r.satan_my_id, r.kcm_id);
    case 'Finans Onaylandı':
    case 'Fatura Kesildi':
      return _donanimSurecYetki('donanim_sevk', r.satan_my_id, r.kcm_id);
    default: return false;
  }
}
// Sıralama grubu: 0=aktif/devam eden, 1=Tamamlandı, 2=Reddedildi, 3=Süresi
// Doldu, 4=İptal (en altta). Bilinmeyen/legacy durumlar aktif kabul edilir.
function _donanimDurumSiraGrubu(durum){
  if(durum==='İptal') return 4;
  if(durum==='Süresi Doldu') return 3;
  if(durum==='Reddedildi') return 2;
  if(durum==='Tamamlandı' || durum==='Cihaz Gönderildi') return 1;
  return 0;
}

async function loadDonanimRezervasyonlar(){
  const listEl = document.getElementById('donanimRezListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  await _donanimSureSupur(false);   // V31.58: fırsatçı süpürme (5 dk kısıtlamalı)
  await _loadDonanimRezFiltreSecenekleri();

  const scope = getScope('donanim_takip');
  let q = sb.from('stok_rezervasyon_ozet').select('*').order('created_at',{ascending:false});
  if(scope==='PRT') q = q.or(`satan_my_id.eq.${currentUser.my_id},rezerve_eden_id.eq.${currentUser.my_id}`);
  else if(scope==='KÇM' && currentUser.kcm_id) q = q.eq('kcm_id', currentUser.kcm_id);
  // TÜM: filtresiz — ama KÇM filtre seçiliyse ona daralt
  const kcmFiltreDeger = document.getElementById('donanimRezKcmFiltre')?.value;
  if(scope==='TÜM' && kcmFiltreDeger) q = q.eq('kcm_id', Number(kcmFiltreDeger));

  let {data, error} = await q;
  if(error){ listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ listEl.innerHTML = '<div class="empty">Kayıtlı rezervasyon yok.</div>'; return; }

  // V31.120: durum + tarih aralığı filtreleri (server sorgusundan bağımsız, burada uygulanır)
  const durumFiltreDeger = document.getElementById('donanimRezDurumFiltre')?.value;
  if(durumFiltreDeger) data = data.filter(r=>r.durum===durumFiltreDeger);
  const tarihBas = document.getElementById('donanimRezTarihBas')?.value;
  const tarihBit = document.getElementById('donanimRezTarihBit')?.value;
  if(tarihBas) data = data.filter(r=>r.created_at >= tarihBas);
  if(tarihBit) data = data.filter(r=>r.created_at <= (tarihBit+'T23:59:59'));
  if(!data.length){ listEl.innerHTML = '<div class="empty">Filtreye uyan kayıt yok.</div>'; return; }

  // v31.25: Satış Tipi — stok_rezervasyon_ozet view'ında yok, temel tablodan
  // sepet_id başına tek satır yeterli (aynı sepetteki tüm kalemler aynı satış tipini paylaşır).
  const sepetIds = [...new Set(data.map(r=>r.sepet_id).filter(Boolean))];
  const satisTipiMap = {};
  const sureMap = {};   // V31.58: sepet -> {bitis, uzatma}
  if(sepetIds.length){
    const {data:stRows} = await sb.from('stok_rezervasyonlari')
      .select('sepet_id,satis_tipi,rezervasyon_bitis,uzatma_sayisi').in('sepet_id', sepetIds);
    (stRows||[]).forEach(s=>{
      if(s.satis_tipi && !satisTipiMap[s.sepet_id]) satisTipiMap[s.sepet_id]=s.satis_tipi;
      if(!sureMap[s.sepet_id]) sureMap[s.sepet_id] = {bitis:s.rezervasyon_bitis, uzatma:s.uzatma_sayisi||0};
    });
  }

  // MY/TL/KÇM adlarını toplu çek
  // v30.92: satan + rezerve eden + müşterinin MY'si isimleri için id kümesi genişletildi
  const myIds = [...new Set(data.flatMap(r=>[r.satan_my_id, r.rezerve_eden_id, r.musteri_my_id]).filter(Boolean))];
  const kcmIds = [...new Set(data.map(r=>r.kcm_id).filter(Boolean))];
  let myMap={}, kcmMap={};
  if(myIds.length){
    const {data:users} = await sb.from('users').select('my_id,ad_soyad,takim_lideri_id').in('my_id',myIds);
    (users||[]).forEach(u=>{ myMap[u.my_id]=u; });
    const tlIds=[...new Set((users||[]).map(u=>u.takim_lideri_id).filter(Boolean))];
    if(tlIds.length){
      const {data:tls} = await sb.from('users').select('my_id,ad_soyad').in('my_id',tlIds);
      (tls||[]).forEach(t=>{ myMap['TL_'+t.my_id]=t; });
    }
  }
  if(kcmIds.length){
    const {data:kcms} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').in('kcm_id',kcmIds);
    (kcms||[]).forEach(k=>{ kcmMap[k.kcm_id]=k.kcm_adi; });
  }

  // v30.92: müşteri ünvanlarını ncst ile toplu çek
  const ncstList = [...new Set(data.map(r=>r.ncst).filter(Boolean))];
  const musteriMap = {};
  if(ncstList.length){
    const {data:musteriler} = await sb.from('customers').select('ncst,unvan').in('ncst', ncstList);
    (musteriler||[]).forEach(m=>{ musteriMap[m.ncst]=m.unvan; });
  }

  // v30.89: onay yetkisi — KÇM Müdürü sadece kendi KÇM'si, Admin/Direktör/Depo hepsi
  // v30.90: yetki kontrolü _donanimRezOnayYetkisi() tek noktasına taşındı

  // V31.120: ödeme tipi (satış tipi) + MY/FMY arama filtreleri — satisTipiMap ve
  // myMap hazır olduktan sonra uygulanabiliyor, o yüzden burada.
  const satisTipiFiltreDeger = document.getElementById('donanimRezSatisTipiFiltre')?.value;
  if(satisTipiFiltreDeger) data = data.filter(r=>satisTipiMap[r.sepet_id]===satisTipiFiltreDeger);
  const kisiFiltreDeger = (document.getElementById('donanimRezKisiFiltre')?.value||'').trim().toLocaleLowerCase('tr-TR');
  if(kisiFiltreDeger){
    data = data.filter(r=>{
      const satanAd = (myMap[r.satan_my_id]?.ad_soyad||'').toLocaleLowerCase('tr-TR');
      const rezAd = (myMap[r.rezerve_eden_id]?.ad_soyad||'').toLocaleLowerCase('tr-TR');
      return satanAd.includes(kisiFiltreDeger) || rezAd.includes(kisiFiltreDeger);
    });
  }
  if(!data.length){ listEl.innerHTML = '<div class="empty">Filtreye uyan kayıt yok.</div>'; return; }

  // V31.121: sıralama — kendinden onay/eylem bekleyen kayıtlar adımı ne olursa
  // olsun HER ZAMAN en üstte. Onun altında aktif (devam eden) kayıtlar, sonra
  // Tamamlandı, sonra Reddedildi, sonra Süresi Doldu, en altta İptal — aynı
  // grup içinde en yeni üstte (created_at azalan).
  data = data.slice().sort((a,b)=>{
    const aBekliyor = _donanimBenimOnayimBekliyorMu(a) ? 0 : 1;
    const bBekliyor = _donanimBenimOnayimBekliyorMu(b) ? 0 : 1;
    if(aBekliyor !== bBekliyor) return aBekliyor - bBekliyor;
    const aGrup = _donanimDurumSiraGrubu(a.durum), bGrup = _donanimDurumSiraGrubu(b.durum);
    if(aGrup !== bGrup) return aGrup - bGrup;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  listEl.innerHTML = data.map(r=>{
    const adim = DONANIM_SUREC_ADIMLARI[r.durum] || {no:'?', renk:'var(--text3)'};
    const my = myMap[r.satan_my_id];
    const tlAd = my && my.takim_lideri_id ? (myMap['TL_'+my.takim_lideri_id]?.ad_soyad||'—') : '—';
    const buOnaylayabilir = r.durum==='Ön Rezervasyon' && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id);
    // V31.113: mükerrer talep — Takım Lideri VEYA KÇM Müdürü onaylar (donanim_mukerrer_onay)
    const buMukerrerOnay = r.durum==='Yönetici Onayı Bekliyor' && _donanimSurecYetki('donanim_mukerrer_onay', r.satan_my_id, r.kcm_id);
    // v30.99: onaycı; Ön Rezervasyon'u reddedebilir, Onaylandı'yı iptal edebilir
    // v31.06: sahip MY (rezerve eden) her aktif adımda kendi kaydını iptal edebilir
    // V31.113: 'Hazırlanıyor' kalktı, yeni ara adımlar eklendi
    const _rezAktif = ['Ön Rezervasyon','Yönetici Onayı Bekliyor','Onaylandı','Stok Onay Emei Giriş',
      'Turkcell Finans Onay','Kısmen Eşleştirildi','Eşleştirildi','Finans Onaylandı','Fatura Kesildi'].includes(r.durum);
    const _rezSahip = r.rezerve_eden_id === currentUser.my_id;
    const buIptalEdebilir = _rezAktif && (_rezSahip || (r.durum!=='Ön Rezervasyon' && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id)));
    // v31.00 (1.3): Ön Rezervasyon veya Onaylandı iken onaycı paketi düzenleyebilir
    const buDuzenleyebilir = ['Ön Rezervasyon','Onaylandı'].includes(r.durum) && _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id);
    // V31.117: süreç ilerletme butonları — IMEI seçimi artık Stok Onay/Emei
    // Giriş adımının KENDİSİ (Turkcell Finans Onay'dan ÖNCE). "Onaylandı"
    // durumunda buton doğrudan IMEI eşleştirme ekranını açar; tüm cihazlar
    // eşleşene kadar durum 'Stok Onay Emei Giriş'te kalır, tamamlanınca
    // otomatik 'Turkcell Finans Onay'a geçer (bkz. donanimImeiKaydet).
    const buEmeiGiris  = r.durum==='Onaylandı'            && _donanimSurecYetki('donanim_emei_giris', r.satan_my_id, r.kcm_id);
    const buEmeiDevam  = ['Stok Onay Emei Giriş','Kısmen Eşleştirildi','Eşleştirildi'].includes(r.durum) &&
                         _donanimSurecYetki('donanim_emei_giris', r.satan_my_id, r.kcm_id);
    const buFinansOnay = r.durum==='Turkcell Finans Onay' && _donanimSurecYetki('donanim_finans_onay', r.satan_my_id, r.kcm_id);
    // V31.119: Finans onayı ile fatura kesme ayrı adımlar — Depo&Muhasebe/Admin
    // (donanim_sevk) önce "Fatura Kesildi"yi, sonra "Cihaz Gönderildi"yi işaretler.
    const buFaturaKes   = r.durum==='Finans Onaylandı'     && _donanimSurecYetki('donanim_sevk', r.satan_my_id, r.kcm_id);
    const buGonder     = r.durum==='Fatura Kesildi'       && _donanimSurecYetki('donanim_sevk', r.satan_my_id, r.kcm_id);
    // v30.92: kartta gösterilecek yeni alanlar
    const musteriAd   = musteriMap[r.ncst] || r.ncst || '—';
    const musteriMyAd = myMap[r.musteri_my_id]?.ad_soyad || '—';
    const rezEdenAd   = myMap[r.rezerve_eden_id]?.ad_soyad || '—';
    // v31.25: Satış Tipi rozeti + kart, sipariş adımına göre renkli kenarlık alır
    const satisTipi = satisTipiMap[r.sepet_id];
    const satisTipiRozet = satisTipi ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${DONANIM_SATIS_TIPI_RENK[satisTipi]||'var(--text3)'};color:#fff;margin-left:6px;white-space:nowrap;">${escapeHTML(satisTipi)}</span>` : '';
    // v31.26: kullanıcının kendi (satan/rezerve eden olduğu) YENİ onaylanmış siparişi — dikkat çeksin
    const buKendiYeniOnay = r.durum==='Onaylandı' && (r.satan_my_id===currentUser.my_id || r.rezerve_eden_id===currentUser.my_id);
    // V31.58: kalan süre rozeti + uzatma yetkisi
    const _sure = sureMap[r.sepet_id] || {};
    const sureRozet = _donanimSureRozet(_sure.bitis, r.durum);
    const buUzat = DONANIM_SURE_AKTIF.includes(r.durum) && !!_sure.bitis &&
                   (hasPerm('donanim_yonet') || _donanimRezOnayYetkisi(r.satan_my_id, r.kcm_id));
    // V31.113: Ön Rezervasyon'un kendi (6+6 saat) uzatma yetkisi — donanim_onrez_uzat
    const buOnRezUzat = r.durum==='Ön Rezervasyon' && !!_sure.bitis && (_sure.uzatma||0) < window._donanimAyar.onrez_max_uzatma &&
                        _donanimSurecYetki('donanim_onrez_uzat', r.satan_my_id, r.kcm_id);
    const dikkatCek = buKendiYeniOnay ? 'background:rgba(230,126,34,0.10);box-shadow:0 0 0 1px rgba(230,126,34,0.5);' : '';
    const yeniOnayRozet = buKendiYeniOnay ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--red);color:#fff;margin-left:6px;white-space:nowrap;">🔔 Onaylandı</span>` : '';
    // V31.120: kartın TÜM çerçevesi artık mevcut adımın gradyan rengiyle çiziliyor
    // (terminal negatif durumlarda — Reddedildi/İptal/Süresi Doldu — kendi rengi kalır),
    // altına da o ana kadar dolu, kalanı siyah kutucuklardan oluşan süreç barı ekleniyor.
    const cerceveRenk = (adim.no>=1) ? (DONANIM_ADIM_RENK[adim.no]||adim.renk) : adim.renk;
    const surecBar = _donanimSurecBarHTML(adim.no);
    // V31.130: kartta görünür kısa ID — sepet_id'nin ilk 8 hanesi (kod-only, DB değişikliği yok)
    const rezKisaId = 'REZ-' + String(r.sepet_id||'').replace(/-/g,'').slice(0,8).toUpperCase();
    return `<div class="visit-card" style="margin-bottom:8px;border:1.5px solid ${cerceveRenk};${dikkatCek}">
      <div style="cursor:pointer;" onclick="openDonanimRezDetay('${r.sepet_id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:12px;color:var(--text3);">${escapeHTML(kcmMap[r.kcm_id]||'KÇM#'+r.kcm_id)} · ${escapeHTML(tlAd)} · <b>${escapeHTML(my?.ad_soyad||'MY#'+r.satan_my_id)}</b></div>
          <div style="width:26px;height:26px;border-radius:50%;background:${cerceveRenk};color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;">${adim.no}</div>
        </div>
        <div style="font-size:10px;color:var(--text3);font-family:monospace;margin-top:3px;">${rezKisaId}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span style="font-size:13px;color:${cerceveRenk};font-weight:800;">${adim.no>=1?`Adım ${adim.no}/${DONANIM_ADIM_TOPLAM}: `:''}${escapeHTML(r.durum)}${satisTipiRozet}${yeniOnayRozet}${sureRozet}</span>
          <span style="font-size:14px;font-weight:800;">${Number(r.toplam_tutar||0).toLocaleString('tr-TR')} ₺</span>
        </div>
        ${DONANIM_BEKLEYEN[r.durum] ? `<div style="font-size:11px;color:var(--text2);margin-top:2px;">🕓 ${escapeHTML(DONANIM_BEKLEYEN[r.durum])}</div>` : ''}
        ${r.fatura_no ? `<div style="font-size:11px;color:var(--text2);margin-top:2px;">🧾 Fatura No: <b>${escapeHTML(r.fatura_no)}</b></div>` : ''}
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">${r.kalem_sayisi} kalem · ${new Date(r.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:4px;border-top:1px solid var(--border);padding-top:4px;">
          Müşteri: <b>${escapeHTML(musteriAd)}</b><br>
          Müşterinin MY'si: ${escapeHTML(musteriMyAd)} · Rezerve eden: ${escapeHTML(rezEdenAd)}
        </div>
        ${surecBar}
      </div>
      ${(buOnaylayabilir||buMukerrerOnay||buIptalEdebilir||buDuzenleyebilir||buEmeiGiris||buEmeiDevam||buFinansOnay||buFaturaKes||buGonder||buUzat||buOnRezUzat) ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        ${buOnaylayabilir ? `<button class="btn btn-sm" style="flex:1;background:var(--green);color:#04301f;" onclick="event.stopPropagation();donanimRezervasyonOnayla('${r.sepet_id}')">✅ Onayla</button><button class="btn btn-sm" style="flex:1;background:#000;border:2px solid var(--red);color:var(--red);" onclick="event.stopPropagation();donanimRezervasyonRed('${r.sepet_id}')">✕ Reddet</button>` : ''}
        ${buMukerrerOnay ? `<button class="btn btn-sm" style="flex:1;background:var(--green);color:#04301f;" onclick="event.stopPropagation();donanimMukerrerOnayla('${r.sepet_id}')">✅ Mükerrer Talebi Onayla</button><button class="btn btn-sm" style="flex:1;background:#000;border:2px solid var(--red);color:var(--red);" onclick="event.stopPropagation();donanimRezervasyonRed('${r.sepet_id}')">✕ Reddet</button>` : ''}
        ${buDuzenleyebilir ? `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimRezDuzenleAc('${r.sepet_id}')">Düzenle</button>` : ''}
        ${buIptalEdebilir ? `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimRezervasyonIptal('${r.sepet_id}')">İptal Et</button>` : ''}
        ${buEmeiGiris ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="event.stopPropagation();donanimImeiEslestirAc('${r.sepet_id}')">Stok Onay / Emei Giriş</button>` : ''}
        ${buEmeiDevam ? `<button class="btn btn-sm" style="flex:1;background:var(--green);color:#04301f;" onclick="event.stopPropagation();donanimImeiEslestirAc('${r.sepet_id}')">✓ Emei Girişine Devam Et</button>` : ''}
        ${buFinansOnay ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="event.stopPropagation();donanimSurecIlerlet('${r.sepet_id}','Finans Onaylandı')">Turkcell Finans Onayı</button>` : ''}
        ${buFaturaKes ? `<button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="event.stopPropagation();donanimSurecIlerlet('${r.sepet_id}','Fatura Kesildi')">Fatura Kesildi</button>` : ''}
        ${buGonder ? `<button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="event.stopPropagation();donanimSurecIlerlet('${r.sepet_id}','Tamamlandı')">Cihaz Gönderildi</button>` : ''}
        ${buUzat ? `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimSureUzat('${r.sepet_id}')">⏳ Süre Uzat${_sure.uzatma?` (${_sure.uzatma})`:''}</button>` : ''}
        ${buOnRezUzat ? `<button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();donanimOnRezUzat('${r.sepet_id}')">⏳ Ön Rez. Süresini Uzat</button>` : ''}
      </div>` : ''}
      <div style="margin-top:6px;">
        <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="event.stopPropagation();openDonanimRezTimeline('${r.sepet_id}')">📜 Geçmiş</button>
      </div>
    </div>`;
  }).join('');

  _donanimBadgeGuncelle(); // v31.26
}

// V31.113: Ön Rezervasyon -> Rezervasyon Onayı (durum: 'Onaylandı'). Cihaz zaten
// Ön Rezervasyon anında rezerve_adet'e düşürülmüştü — bu adımda STOK SAYISI
// DEĞİŞMEZ, sadece Emei süresi (varsayılan 48 iş saati) başlar.
async function donanimRezervasyonOnayla(sepetId){
  if(!confirm('Bu rezervasyon talebini onaylamak istediğinize emin misiniz?\n\nOnaylanınca Stok Onay/Emei Giriş adımına geçilecek ve Emei süresi başlayacak.')) return;
  await _donanimOnRezSupur();   // V31.113: onaylamadan önce süresi dolmuş olabilir mi kontrol et

  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }

  // v30.90: savunmacı yetki kontrolü — buton görünmese de fonksiyon korunur
  const ilkK = kalemler[0];
  if(ilkK.durum!=='Ön Rezervasyon'){ toast(`Bu kayıt '${ilkK.durum}' durumunda, onaylanamaz`,'info'); loadDonanimRezervasyonlar(); return; }
  if(!_donanimRezOnayYetkisi(ilkK.satan_my_id, ilkK.kcm_id)){
    toast('Bu rezervasyonu onaylama yetkiniz yok','error'); return;
  }

  // V31.59/113: onayla birlikte Emei süresi (varsayılan 48 iş saati, sistem_ayarlari'den)
  //          başlar (hafta sonu ve resmi tatiller süreye işlemez)
  const _bitis = await _donanimSureBitisHesapla(new Date().toISOString(), _donanimEmeiSureSaat());
  await sb.from('stok_rezervasyonlari').update({durum:'Onaylandı', rezervasyon_bitis:_bitis, updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);

  await _donanimRezHareketLog('Rezervasyon Onaylandı', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});

  toast('Rezervasyon onaylandı, Emei süresi başladı','success');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

// V31.113: Mükerrer talep onayı — Takım Lideri VEYA KÇM Müdürü (donanim_mukerrer_onay).
// Onaylanınca kayıt normal 'Ön Rezervasyon' durumuna döner ve 6 saatlik süre O ANDAN başlar.
async function donanimMukerrerOnayla(sepetId){
  if(!confirm('Bu mükerrer ön rezervasyon talebini onaylıyor musunuz?\n\nOnaylanınca normal Ön Rezervasyon sürecine (6 iş saati) alınacak.')) return;
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  if(ilkK.durum!=='Yönetici Onayı Bekliyor'){ toast(`Bu kayıt '${ilkK.durum}' durumunda`,'info'); loadDonanimRezervasyonlar(); return; }
  if(!_donanimSurecYetki('donanim_mukerrer_onay', ilkK.satan_my_id, ilkK.kcm_id)){ toast('Bu talebi onaylama yetkiniz yok','error'); return; }

  const bitis = await _donanimSureBitisHesapla(new Date().toISOString(), window._donanimAyar.onrez_sure_saat);
  await sb.from('stok_rezervasyonlari').update({durum:'Ön Rezervasyon', rezervasyon_bitis:bitis, updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);
  await _donanimRezHareketLog('Mükerrer Talep Onaylandı', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});
  toast('Mükerrer talep onaylandı, Ön Rezervasyon süreci başladı','success');
  loadDonanimRezervasyonlar();
}

// V31.113: Ön Rezervasyon süresini uzatma (donanim_onrez_uzat) — sistem_ayarlari'deki
// donanim_onrez_uzatma_saat kadar, en fazla donanim_onrez_max_uzatma kez.
async function donanimOnRezUzat(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari')
    .select('rezervasyon_id,urun_id,adet,ncst,satan_my_id,kcm_id,durum,rezervasyon_bitis,uzatma_sayisi').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Rezervasyon bulunamadı','error'); return; }
  const ilk = kalemler[0];
  if(ilk.durum!=='Ön Rezervasyon'){ toast('Sadece Ön Rezervasyon durumundaki kayıtlar uzatılabilir','info'); return; }
  if(!_donanimSurecYetki('donanim_onrez_uzat', ilk.satan_my_id, ilk.kcm_id)){ toast('Süre uzatma yetkiniz yok','error'); return; }
  if((ilk.uzatma_sayisi||0) >= window._donanimAyar.onrez_max_uzatma){ toast('Maksimum uzatma sayısına ulaşıldı','info'); return; }
  if(!confirm(`Ön Rezervasyon süresi ${window._donanimAyar.onrez_uzatma_saat} iş saati uzatılsın mı?`)) return;

  const mevcut = ilk.rezervasyon_bitis ? new Date(ilk.rezervasyon_bitis).getTime() : 0;
  const taban  = new Date(Math.max(mevcut, Date.now())).toISOString();
  const yeni   = await _donanimSureBitisHesapla(taban, window._donanimAyar.onrez_uzatma_saat);
  const simdi  = new Date().toISOString();

  for(const k of kalemler){
    await sb.from('stok_rezervasyonlari').update({
      rezervasyon_bitis: yeni, uzatma_sayisi:(k.uzatma_sayisi||0)+1,
      uzatan_id: currentUser.my_id, uzatma_tarihi: simdi, updated_at: simdi
    }).eq('rezervasyon_id', k.rezervasyon_id);
  }
  await _donanimRezHareketLog('Ön Rezervasyon Süresi Uzatıldı', kalemler, {ncst: ilk.ncst, satan_my_id: ilk.satan_my_id});
  toast(`Ön Rezervasyon süresi ${window._donanimAyar.onrez_uzatma_saat} iş saati uzatıldı`,'success');
  loadDonanimRezervasyonlar();
}

// V31.113: Ön Rezervasyon süresi (6+6 saat) dolmuş ve hâlâ onaylanmamış kayıtları
// süpürür — cihaz stoğa (rezerve_adet--) geri döner, durum 'Süresi Doldu' olur.
// _donanimSureSupur (48h Emei) ile aynı mantık, farklı durum/alan seti.
async function _donanimOnRezSupur(){
  try{
    const {data, error} = await sb.from('stok_rezervasyonlari').select('*')
      .in('durum', DONANIM_ONREZ_AKTIF).not('rezervasyon_bitis','is',null)
      .lt('rezervasyon_bitis', new Date().toISOString());
    if(error || !data?.length) return;
    const sepetler = [...new Set(data.map(r=>r.sepet_id))];
    for(const sepetId of sepetler){
      const kalemler = data.filter(r=>r.sepet_id===sepetId);
      for(const k of kalemler){
        const {data:urun} = await sb.from('stok_urunleri').select('rezerve_adet').eq('urun_id', k.urun_id).maybeSingle();
        if(urun) await sb.from('stok_urunleri').update({rezerve_adet:Math.max(0,(urun.rezerve_adet||0)-k.adet), updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
      }
      await sb.from('stok_rezervasyonlari').update({durum:'Süresi Doldu', updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);
      await _donanimRezHareketLog('Ön Rezervasyon Süresi Doldu', kalemler, {ncst:kalemler[0].ncst, satan_my_id:kalemler[0].satan_my_id});
    }
    console.info('[donanim] süresi dolan ön rezervasyon işlendi:', sepetler.length);
  }catch(e){ console.warn('[donanim] ön rezervasyon süpürme istisnası:', e.message); }
}

// v31.03: rezervasyon olayını HER KALEM için urun_id ile logla — ürün geçmişi + "kime verilmiş" izi
// V31.131: (1) ürün adı artık detay metnine yazılıyor (hangi cihaz — önceden
// sadece adet yazıyordu, ürün hiç görünmüyordu); (2) ctx.imeiMap {urun_id:[seri_no,...]}
// verilirse IMEI Eşleştirme olaylarında bağlanan IMEI'ler de detaya ekleniyor;
// (3) ctx.faturaNo verilirse (Fatura Kesildi adımı) fatura numarası detaya ekleniyor.
async function _donanimRezHareketLog(aksiyon, kalemler, ctx){
  ctx = ctx || {};
  let musteri = ctx.ncst || '—';
  if(ctx.ncst){ const {data:m}=await sb.from('customers').select('unvan').eq('ncst',ctx.ncst).maybeSingle(); if(m?.unvan) musteri=m.unvan; }
  let satan = ctx.satan_my_id ? ('MY#'+ctx.satan_my_id) : '—';
  if(ctx.satan_my_id){ const {data:u}=await sb.from('users').select('ad_soyad').eq('my_id',ctx.satan_my_id).maybeSingle(); if(u?.ad_soyad) satan=u.ad_soyad; }

  const urunIds = [...new Set((kalemler||[]).map(k=>parseInt(k.urun_id)).filter(Boolean))];
  const urunAdMap = {};
  if(urunIds.length){
    const {data:urunler} = await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id', urunIds);
    (urunler||[]).forEach(u=>{ urunAdMap[u.urun_id] = u.aciklama; });
  }

  const satirlar = (kalemler||[]).filter(k=>k.urun_id).map(k=>{
    const uid = parseInt(k.urun_id);
    const urunAd = urunAdMap[uid] || ('Ürün #'+uid);
    const imeiListesi = (ctx.imeiMap && ctx.imeiMap[uid] && ctx.imeiMap[uid].length) ? ` · IMEI: ${ctx.imeiMap[uid].join(', ')}` : '';
    const faturaBilgi = ctx.faturaNo ? ` · Fatura No: ${ctx.faturaNo}` : '';
    return {
      urun_id: uid,
      sepet_id: k.sepet_id || null,
      aksiyon,
      detay: `${urunAd} · ${k.adet} adet · Müşteri: ${musteri}${ctx.ncst?` (${ctx.ncst})`:''} · Satan: ${satan}${imeiListesi}${faturaBilgi}`,
      user_id: currentUser.my_id,
      user_ad: currentUser.ad_soyad || String(currentUser.my_id)
    };
  });
  if(satirlar.length) await sb.from('stok_hareketleri').insert(satirlar);
}

// v30.99 (1.1): Ön rezervasyon RED — on_rezerve geri alınır, müsait değişmez
async function donanimRezervasyonRed(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  if(!_donanimRezOnayYetkisi(ilkK.satan_my_id, ilkK.kcm_id)){ toast('Bu talebi reddetme yetkiniz yok','error'); return; }
  if(!['Ön Rezervasyon','Yönetici Onayı Bekliyor'].includes(ilkK.durum)){ toast('Sadece Ön Rezervasyon/Yönetici Onayı Bekliyor reddedilebilir','info'); loadDonanimRezervasyonlar(); return; }
  if(!confirm('Bu ön rezervasyonu reddetmek istediğinize emin misiniz?\n\nCihaz stoğa (müsait) geri dönecek.')) return;

  // V31.113: cihaz Ön Rezervasyon anında rezerve_adet'e düşmüştü — red'de geri iade edilir
  for(const k of kalemler){
    const {data:urun} = await sb.from('stok_urunleri').select('rezerve_adet').eq('urun_id', k.urun_id).single();
    if(!urun) continue;
    const yeniRez = Math.max(0, (urun.rezerve_adet||0) - k.adet);
    await sb.from('stok_urunleri').update({rezerve_adet:yeniRez, updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
  }
  await sb.from('stok_rezervasyonlari').update({durum:'Reddedildi', updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);
  await _donanimRezHareketLog('Rezervasyon Reddedildi', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});
  toast('Ön rezervasyon reddedildi','info');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

// v30.99 (1.2): Onaylı rezervasyon İPTAL — rezerve geri alınır, cihaz müsait stoğa döner
async function donanimRezervasyonIptal(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Hata: kayıtlar bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  const sahipMy = ilkK.rezerve_eden_id === currentUser.my_id;
  const onayci  = _donanimRezOnayYetkisi(ilkK.satan_my_id, ilkK.kcm_id);
  if(!sahipMy && !onayci){ toast('Bu rezervasyonu iptal etme yetkiniz yok','error'); return; }

  // V31.113: 'Hazırlanıyor' kalktı, yeni ara adımlar eklendi — hepsinde cihaz rezerve_adet'te durur
  const aktif = ['Ön Rezervasyon','Yönetici Onayı Bekliyor','Onaylandı','Stok Onay Emei Giriş',
    'Turkcell Finans Onay','Kısmen Eşleştirildi','Eşleştirildi','Finans Onaylandı','Fatura Kesildi'];
  if(!aktif.includes(ilkK.durum)){ toast(`Bu kayıt iptal edilemez (${ilkK.durum})`,'info'); loadDonanimRezervasyonlar(); return; }
  if(!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?\n\nCihazlar müsait stoğa geri dönecek.')) return;

  // V31.113: cihaz her durumda (Ön Rezervasyon dahil) rezerve_adet'te — iptalde tek yerden iade
  for(const k of kalemler){
    const {data:urun} = await sb.from('stok_urunleri').select('rezerve_adet').eq('urun_id', k.urun_id).single();
    if(!urun) continue;
    await sb.from('stok_urunleri').update({rezerve_adet:Math.max(0,(urun.rezerve_adet||0)-k.adet), updated_at:new Date().toISOString()}).eq('urun_id', k.urun_id);
  }
  // v31.06: bağlı IMEI/seri varsa havuza iade (eşleştirme yapılmış olabilir)
  await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null}).eq('sepet_id', sepetId);

  await sb.from('stok_rezervasyonlari').update({durum:'İptal', updated_at:new Date().toISOString()}).eq('sepet_id', sepetId);
  await _donanimRezHareketLog('Rezervasyon İptal', kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id});
  toast('Rezervasyon iptal edildi, stok iade edildi','info');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

// V31.119: Satış sürecini bir sonraki adıma ilerletir. IMEI eşleştirme artık
// 'Onaylandı' → 'Stok Onay Emei Giriş' aralığında donanimImeiEslestirAc/
// donanimImeiKaydet üzerinden yürüyor (bkz. aşağıda). BUG FİX: Turkcell Finans
// Onayı ile Fatura Kesildi TEK butonda birleşmişti — finans onaycısı butona
// basınca durum doğrudan 'Fatura Kesildi'ye atlıyor, Depo&Muhasebe'nin ekranında
// ayrı bir "Fatura Kesildi" adımı hiç görünmüyordu (yalnız "Cihaz Gönderildi").
// Artık aralarına 'Finans Onaylandı' ara durumu eklendi: finans onaycısı yalnız
// finans onayını verir, Depo&Muhasebe/Admin (donanim_sevk) AYRI ADIM olarak
// önce "Fatura Kesildi"yi, sonra "Cihaz Gönderildi"yi işaretler.
const DONANIM_GECIS = {
  'Turkcell Finans Onay':'Finans Onaylandı',
  'Finans Onaylandı':'Fatura Kesildi',
  'Fatura Kesildi':'Tamamlandı'
};
const DONANIM_GECIS_PERM = {
  'Finans Onaylandı':'donanim_finans_onay',
  'Fatura Kesildi':'donanim_sevk',
  'Tamamlandı':'donanim_sevk'
};

async function donanimSurecIlerlet(sepetId, yeniDurum){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Kayıt bulunamadı','error'); return; }
  const ilkK = kalemler[0];
  const gerekli = DONANIM_GECIS_PERM[yeniDurum];
  if(!gerekli || !_donanimSurecYetki(gerekli, ilkK.satan_my_id, ilkK.kcm_id)){ toast('Bu işlem için yetkiniz yok','error'); return; }
  if(DONANIM_GECIS[ilkK.durum]!==yeniDurum){ toast(`Bu kayıt '${ilkK.durum}' durumunda; '${yeniDurum}' geçişi yapılamaz`,'info'); loadDonanimRezervasyonlar(); return; }

  // V31.131: Fatura Kesildi adımında fatura numarası zorunlu — timeline'da ve
  // kartta görünmesi için kaydediliyor.
  let faturaNo = null;
  if(yeniDurum === 'Fatura Kesildi'){
    faturaNo = (prompt('Fatura numarasını girin:', ilkK.fatura_no || '') || '').trim();
    if(!faturaNo){ toast('Fatura numarası girilmeden bu adım tamamlanamaz','error'); return; }
  }

  // V31.63: .select() eklendi — güncellenen satır sayısı KİLİT görevi görür.
  // Aynı anda başka bir oturum sevk ettiyse 0 satır döner ve stok bir daha düşmez.
  const guncellemeAlan = {durum:yeniDurum, updated_at:new Date().toISOString()};
  if(faturaNo) guncellemeAlan.fatura_no = faturaNo;
  const {data:guncellenen, error:uErr} = await sb.from('stok_rezervasyonlari')
    .update(guncellemeAlan)
    .eq('sepet_id',sepetId).eq('durum',ilkK.durum).select('rezervasyon_id');
  if(uErr){ toast('Hata: '+uErr.message,'error'); return; }
  if(!guncellenen || !guncellenen.length){
    toast('Kayıt bu sırada başkası tarafından güncellenmiş — işlem yapılmadı','info');
    loadDonanimRezervasyonlar(); return;
  }

  // V31.63/113: sevkiyat stoktan düşer. Yalnızca durumu değiştirmeyi BAŞARAN oturum girer.
  if(yeniDurum === 'Tamamlandı') await _donanimSevkStokDus(sepetId, kalemler);

  await _donanimRezHareketLog('Süreç: '+yeniDurum, kalemler, {ncst:ilkK.ncst, satan_my_id:ilkK.satan_my_id, faturaNo});
  toast(`Durum güncellendi: ${yeniDurum}`,'success');
  loadDonanimRezervasyonlar();
}

/* V31.63: SEVKİYAT STOK ETKİSİ
   Cihaz müşteriye gittiğinde depodan da gitmelidir:
     • stok_urunleri : toplam_adet -adet, rezerve_adet -adet (0'ın altına inmez)
     • stok_seri_no  : bu sepete bağlı 'Ayrıldı' seriler 'Satıldı' olur.
                       sepet_id İZLENEBİLİRLİK için silinmez.
     • stok_rezervasyonlari.gerceklesen_adet = adet (süre süpürme matematiği)
   Çift düşüm koruması çağıran taraftadır: koşullu durum güncellemesi. */
async function _donanimSevkStokDus(sepetId, kalemler){
  const hatalar = [];

  // Aynı ürün birden çok kalemde olabilir — önce ürün bazında toplanır
  const dus = {};
  (kalemler||[]).forEach(k=>{ if(k.urun_id) dus[k.urun_id] = (dus[k.urun_id]||0) + (k.adet||0); });

  for(const urunId of Object.keys(dus)){
    const adet = dus[urunId];
    try{
      const {data:u, error:sErr} = await sb.from('stok_urunleri')
        .select('urun_id,toplam_adet,rezerve_adet').eq('urun_id', parseInt(urunId,10)).maybeSingle();
      if(sErr) throw new Error(sErr.message);
      if(!u)   throw new Error('ürün satırı bulunamadı');
      const {error:gErr} = await sb.from('stok_urunleri').update({
        toplam_adet:  Math.max(0, (u.toplam_adet||0)  - adet),
        rezerve_adet: Math.max(0, (u.rezerve_adet||0) - adet),
        updated_at: new Date().toISOString()
      }).eq('urun_id', u.urun_id);
      if(gErr) throw new Error(gErr.message);
    }catch(e){ hatalar.push(`Ürün #${urunId}: ${e.message}`); }
  }

  try{
    const {error:iErr} = await sb.from('stok_seri_no')
      .update({durum:'Satıldı', updated_at:new Date().toISOString()})
      .eq('sepet_id', sepetId).eq('durum','Ayrıldı');
    if(iErr) throw new Error(iErr.message);
  }catch(e){ hatalar.push('IMEI durumu: '+e.message); }

  for(const k of (kalemler||[])){
    try{
      await sb.from('stok_rezervasyonlari')
        .update({gerceklesen_adet: k.adet, updated_at:new Date().toISOString()})
        .eq('rezervasyon_id', k.rezervasyon_id);
    }catch(e){ hatalar.push('gerçekleşen adet: '+e.message); }
  }

  if(hatalar.length){
    console.error('[donanim] sevkiyat stok düşümü:', hatalar);
    toast('Sevk edildi, ancak stok düşümünde sorun: '+hatalar[0],'error');
  }
  return hatalar;
}

// ============ 2.3: IMEI EŞLEŞTİRME (kısmi, barcode + arama, KÇM kilitli) ============
// v31.18 (2.4): IMEI maskeleme — donanim_imei_gor yetkisi yoksa ilk4+son4
// dışında kalan kısım '*' ile maskelenir. Yetkisi olan (Depo/Muhasebe vb.)
// numarayı tam görür. Aktif eşleştirme (arama/seçim/scan) alanları etkilenmez —
// sadece zaten atanmış/görüntülenen IMEI'ler maskelenir.
function _imeiMaskele(seriNo){
  const s = String(seriNo||'').trim();
  if(!s) return '';
  if(hasPerm('donanim_imei_gor')) return s;
  if(s.length<=8) return '*'.repeat(s.length);
  return s.slice(0,4) + '*'.repeat(s.length-8) + s.slice(-4);
}

/* V31.63 (Faz 7): IMEI'ler MERKEZ havuzunda durur — Excel yüklemesi
   stok_seri_no.urun_id alanına Merkez katalog satırının kimliğini yazar.
   Rezervasyon ise satıcının KÇM depo satırını işaret eder. Eşleştirme
   bu iki kimliği eşit sandığı için KÇM siparişlerinde hiç IMEI bulunamıyordu.
   Burada rezervasyonun urun_id'si malzeme_kodu üzerinden havuz satırına
   çevrilir. Merkez satırı bulunamazsa gelen kimlik aynen döner (davranış
   eski hâline düşer, sessiz hata olmaz). */
window._donanimHavuzCache = window._donanimHavuzCache || {};
async function _donanimHavuzUrunId(urunId){
  const anahtar = String(urunId);
  if(window._donanimHavuzCache[anahtar] !== undefined) return window._donanimHavuzCache[anahtar];
  let sonuc = urunId;
  try{
    const {data:kaynak} = await sb.from('stok_urunleri')
      .select('urun_id,malzeme_kodu,depo_id').eq('urun_id', urunId).maybeSingle();
    const merkezDepoId = await _donanimMerkezDepoId();
    if(kaynak && kaynak.malzeme_kodu && merkezDepoId && kaynak.depo_id !== merkezDepoId){
      const {data:havuz} = await sb.from('stok_urunleri')
        .select('urun_id').eq('malzeme_kodu', kaynak.malzeme_kodu).eq('depo_id', merkezDepoId).limit(1);
      if(havuz && havuz.length) sonuc = havuz[0].urun_id;
    }
  }catch(e){ console.warn('[donanim] havuz ürün çözümlemesi:', e.message); }
  window._donanimHavuzCache[anahtar] = sonuc;
  return sonuc;
}

async function donanimImeiEslestirAc(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Kayıt bulunamadı','error'); return; }
  const ilk = kalemler[0];
  // V31.117: IMEI eşleştirme artık Turkcell Finans Onay'dan ÖNCE, "Stok Onay /
  // Emei Giriş" adımının kendisinde yapılıyor — yetki kontrolü donanim_emei_giris'e
  // taşındı (donanim_imei_eslestir eski akışın kalıntısı, artık kullanılmıyor).
  if(!_donanimSurecYetki('donanim_emei_giris', ilk.satan_my_id, ilk.kcm_id)){ toast('Emei giriş yetkiniz yok','error'); return; }
  // 'Kısmen Eşleştirildi'/'Eşleştirildi' — eski akıştan veya Hızlı Sevkiyat
  // Konsolu'nun yarıda kalmış bir çalışmasından kalan kayıtlar için kurtarma.
  if(!['Onaylandı','Stok Onay Emei Giriş','Kısmen Eşleştirildi','Eşleştirildi'].includes(ilk.durum)){ toast('Bu durumda eşleştirme yapılamaz','info'); loadDonanimRezervasyonlar(); return; }

  const urunIds=[...new Set(kalemler.map(k=>k.urun_id))];
  const {data:urunler}=await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id',urunIds);
  const adMap={}; (urunler||[]).forEach(u=>adMap[u.urun_id]=u.aciklama);

  // Bu siparişe zaten bağlı seriler
  const {data:bagliSeri}=await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id').eq('sepet_id',sepetId);
  const bagliByUrun={}; (bagliSeri||[]).forEach(s=>{ (bagliByUrun[s.urun_id]=bagliByUrun[s.urun_id]||[]).push({seri_no_id:s.seri_no_id, seri_no:s.seri_no}); });

  // V31.63: her kalem için IMEI havuzundaki karşılığı çözülür
  const havuzIdler = [];
  for(const k of kalemler) havuzIdler.push(await _donanimHavuzUrunId(k.urun_id));

  window._imeiEslestir = {
    sepetId,
    kalemler: kalemler.map((k,i)=>({
      idx:i, urun_id:k.urun_id, havuzUrunId:havuzIdler[i],
      ad:adMap[k.urun_id]||('Cihaz #'+k.urun_id), adet:k.adet,
      bagli:(bagliByUrun[havuzIdler[i]]||[]).slice(),
      orijinal:(bagliByUrun[havuzIdler[i]]||[]).map(s=>s.seri_no_id)
    }))
  };
  _imeiRender();
  openModal('donanimImeiModal');
}

function _imeiRender(){
  const st=window._imeiEslestir;
  const box=document.getElementById('donanimImeiIcerik');
  box.innerHTML = st.kalemler.map(k=>{
    const dolu=k.bagli.length, hedef=k.adet;
    const seriRows = k.bagli.map(s=>`
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
        <span style="flex:1;font-family:monospace;font-size:12px;">${escapeHTML(_imeiMaskele(s.seri_no))}</span>
        <button class="btn btn-sm btn-ghost" onclick="donanimImeiKaldir(${k.idx},${s.seri_no_id})">Kaldır</button>
      </div>`).join('');
    const arama = dolu<hedef ? `
      <input type="text" id="imeiAra_${k.idx}" placeholder="IMEI okut veya ara (min 2 karakter)..." autocomplete="off"
        oninput="donanimImeiAra(${k.idx}, this.value)"
        onkeydown="if(event.key==='Enter'){event.preventDefault();donanimImeiEnter(${k.idx}, this.value);}"
        style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;font-size:13px;margin-top:6px;">
      <div id="imeiSonuc_${k.idx}"></div>`
      : `<div style="font-size:11px;color:#27ae60;margin-top:4px;">Bu ürün tamamlandı ✓</div>`;
    return `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:10px;">
      <div style="font-weight:600;font-size:13px;">${escapeHTML(k.ad)} <span style="color:var(--text3);font-weight:400;">(${dolu}/${hedef})</span></div>
      ${seriRows}${arama}
    </div>`;
  }).join('');
  // v31.10: açılışta boş kalemler için boştaki serileri otomatik listele
  st.kalemler.forEach(k=>{ if(k.bagli.length<k.adet) donanimImeiAra(k.idx,''); });
}

async function donanimImeiAra(idx, q){
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  const sonuc=document.getElementById('imeiSonuc_'+idx);
  if(!sonuc) return;
  q=(q||'').trim();
  // KÇM kilidi: yalnız bu ürünün (urun_id) Depoda serileri. Boş sorguda ilk N gösterilir.
  // V31.63: arama HAVUZ ürün kimliğiyle yapılır (KÇM kısıtı kalktı)
  let query = sb.from('stok_seri_no').select('seri_no_id,seri_no').eq('urun_id',k.havuzUrunId||k.urun_id).eq('durum','Depoda');
  if(q.length>=1) query = query.ilike('seri_no','%'+q+'%');
  const {data}=await query.order('seri_no').limit(15);
  const bagliIds=new Set(k.bagli.map(s=>s.seri_no_id));
  const list=(data||[]).filter(s=>!bagliIds.has(s.seri_no_id));
  if(!list.length){ sonuc.innerHTML='<div style="font-size:11px;color:var(--text3);padding:4px;">'+(q?'Eşleşen boşta cihaz yok.':'Bu ürün için boşta (Depoda) IMEI bulunamadı.')+'</div>'; return; }
  sonuc.innerHTML=list.map(s=>`<div onclick="donanimImeiSec(${idx},${s.seri_no_id},'${escapeHTML(s.seri_no)}')" style="cursor:pointer;padding:6px 8px;font-family:monospace;font-size:12px;border-bottom:1px solid var(--border);background:var(--navy3);border-radius:4px;margin-top:3px;">${escapeHTML(s.seri_no)}</div>`).join('');
}

async function donanimImeiEnter(idx, val){
  val=(val||'').trim(); if(!val) return;
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  if(k.bagli.length>=k.adet){ toast('Bu ürün için tüm slotlar dolu','info'); return; }
  const {data}=await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id,durum').eq('seri_no',val).maybeSingle();
  if(!data){ toast('Seri bulunamadı: '+val,'error'); return; }
  if(data.urun_id!==(k.havuzUrunId||k.urun_id)){ toast('Bu IMEI bu ürüne ait değil','error'); return; }
  if(data.durum!=='Depoda'){ toast(`Bu IMEI boşta değil (durum: ${data.durum})`,'error'); return; }
  if(k.bagli.some(s=>s.seri_no_id===data.seri_no_id)){ toast('Zaten eklendi','info'); return; }
  k.bagli.push({seri_no_id:data.seri_no_id, seri_no:data.seri_no});
  _imeiRender();
  const inp=document.getElementById('imeiAra_'+idx); if(inp) inp.focus();
}

function donanimImeiSec(idx, seriNoId, seriNo){
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  if(k.bagli.length>=k.adet){ toast('Bu ürün için tüm slotlar dolu','info'); return; }
  if(k.bagli.some(s=>s.seri_no_id===seriNoId)){ toast('Zaten eklendi','info'); return; }
  k.bagli.push({seri_no_id:seriNoId, seri_no:String(seriNo)});
  _imeiRender();
}

function donanimImeiKaldir(idx, seriNoId){
  const st=window._imeiEslestir; const k=st.kalemler[idx];
  k.bagli=k.bagli.filter(s=>s.seri_no_id!==seriNoId);
  _imeiRender();
}

async function donanimImeiKaydet(){
  const st=window._imeiEslestir; if(!st) return;
  const sepetId=st.sepetId;
  const eklenen=[], cikarilan=[]; let toplamSlot=0, toplamDolu=0;
  for(const k of st.kalemler){
    toplamSlot+=k.adet; toplamDolu+=k.bagli.length;
    const su=new Set(k.bagli.map(s=>s.seri_no_id)); const orj=new Set(k.orijinal);
    k.bagli.forEach(s=>{ if(!orj.has(s.seri_no_id)) eklenen.push({seri_no_id:s.seri_no_id, urun_id:(k.havuzUrunId||k.urun_id)}); });
    k.orijinal.forEach(id=>{ if(!su.has(id)) cikarilan.push(id); });
  }

  // Eklenenleri bağla — savunmacı doğrulama + kompanzasyon
  const basarili=[];
  for(const s of eklenen){
    const {data:m}=await sb.from('stok_seri_no').select('seri_no_id,urun_id,durum').eq('seri_no_id',s.seri_no_id).maybeSingle();
    if(!m || m.urun_id!==s.urun_id || m.durum!=='Depoda'){
      for(const b of basarili){ await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:new Date().toISOString()}).eq('seri_no_id',b); }
      toast('Bir IMEI artık uygun değil (başka işlem olmuş olabilir) — kayıt geri alındı','error'); return;
    }
    const {data:upd, error:uErr}=await sb.from('stok_seri_no')
      .update({durum:'Ayrıldı', sepet_id:sepetId, updated_at:new Date().toISOString()})
      .eq('seri_no_id',s.seri_no_id).eq('durum','Depoda').select('seri_no_id');
    if(uErr || !upd?.length){
      for(const b of basarili){ await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:new Date().toISOString()}).eq('seri_no_id',b); }
      toast('IMEI bağlanamadı (eşzamanlı değişim?) — kayıt geri alındı','error'); return;
    }
    basarili.push(s.seri_no_id);
  }
  // Çıkarılanları havuza iade
  for(const id of cikarilan){
    await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:new Date().toISOString()}).eq('seri_no_id',id);
  }

  // V31.117: IMEI eşleştirme artık Turkcell Finans Onay'dan ÖNCE yapılıyor.
  // Tüm kalemler eşleşince otomatik 'Turkcell Finans Onay'a geçer; eksikse
  // (hiç girilmemiş veya kısmi) 'Stok Onay Emei Giriş'te kalır — Depo&Muhasebe
  // "Emei Girişine Devam Et" ile aynı ekranı tekrar açıp tamamlayabilir.
  const yeniDurum = toplamDolu>=toplamSlot ? 'Turkcell Finans Onay' : 'Stok Onay Emei Giriş';
  await sb.from('stok_rezervasyonlari').update({durum:yeniDurum, updated_at:new Date().toISOString()}).eq('sepet_id',sepetId);

  const {data:kalemler}=await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id',sepetId);
  const ilk=kalemler?.[0]||{};
  // V31.131: bağlanan IMEI'ler de loglansın — st.kalemler[i].urun_id, stok_rezervasyonlari
  // satırının kendi urun_id'si (havuz eşleşmesi değil), _donanimRezHareketLog ile uyumlu.
  const imeiMap = {};
  st.kalemler.forEach(k=>{ imeiMap[k.urun_id] = k.bagli.map(s=>s.seri_no); });
  await _donanimRezHareketLog(`IMEI Eşleştirme (${toplamDolu}/${toplamSlot})`, kalemler, {ncst:ilk.ncst, satan_my_id:ilk.satan_my_id, imeiMap});

  toast(`Eşleştirme kaydedildi (${toplamDolu}/${toplamSlot})`,'success');
  closeModal('donanimImeiModal');
  loadDonanimRezervasyonlar();
}

// ============ 1.3: REZERVASYON PAKET DÜZENLEME ============
async function donanimRezDuzenleAc(sepetId){
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', sepetId);
  if(error || !kalemler?.length){ toast('Kayıt bulunamadı','error'); return; }
  const ilk = kalemler[0];
  if(!_donanimRezOnayYetkisi(ilk.satan_my_id, ilk.kcm_id)){ toast('Düzenleme yetkiniz yok','error'); return; }
  if(!['Ön Rezervasyon','Onaylandı'].includes(ilk.durum)){ toast('Bu durumda düzenlenemez','info'); return; }

  const urunIds = [...new Set(kalemler.map(k=>k.urun_id))];
  const {data:urunler} = await sb.from('stok_urunleri').select('urun_id,aciklama').in('urun_id', urunIds);
  const adMap={}; (urunler||[]).forEach(u=>adMap[u.urun_id]=u.aciklama);

  window._rezDuzenle = {
    sepetId, durum: ilk.durum, kcmId: ilk.kcm_id,
    sablon: { kcm_id:ilk.kcm_id, ncst:ilk.ncst, musteri_my_id:ilk.musteri_my_id,
              satan_my_id:ilk.satan_my_id, rezerve_eden_id:ilk.rezerve_eden_id, durum:ilk.durum,
              satis_tipi: ilk.satis_tipi || null }, // v31.25
    kalemler: kalemler.map(k=>({ urun_id:k.urun_id, ad: adMap[k.urun_id]||('Cihaz #'+k.urun_id), adet:k.adet })),
    musaitMap: {}
  };

  document.getElementById('donanimRezDuzenleDurum').textContent =
    `Durum: ${ilk.durum}` + (ilk.durum==='Onaylandı' ? ' — adet artışı yalnız müsait stok varsa uygulanır' : ' — stok kilitlenmez');

  // v31.25: Satış Tipi chip seçimini mevcut değere göre işaretle
  document.querySelectorAll('#donanimRezDuzenleSatisTipiBox .chip-btn').forEach(c=>{
    c.classList.toggle('selected', c.getAttribute('data-tip')===ilk.satis_tipi);
  });

  const sel = document.getElementById('donanimRezDuzenleYeniCihaz');
  sel.innerHTML='<option value="">Yükleniyor...</option>';
  const {data:musait} = await sb.from('stok_musait').select('urun_id,aciklama,musait_adet').eq('kcm_id', ilk.kcm_id).order('aciklama');
  (musait||[]).forEach(u=>window._rezDuzenle.musaitMap[u.urun_id]=u.musait_adet);
  sel.innerHTML = '<option value="">Seçiniz...</option>' +
    (musait||[]).map(u=>`<option value="${u.urun_id}" data-ad="${escapeHTML(u.aciklama||'Cihaz #'+u.urun_id)}">${escapeHTML(u.aciklama||'Cihaz #'+u.urun_id)} (müsait: ${u.musait_adet})</option>`).join('');

  document.getElementById('donanimRezDuzenleYeniAdet').value=1;
  _donanimRezDuzenleRender();
  openModal('donanimRezDuzenleModal');
}

// v31.25: Rezervasyon düzenleme — Satış Tipi seçimi (kaydet'te uygulanır)
function donanimRezDuzenleSatisTipiSec(el, tip){
  document.querySelectorAll('#donanimRezDuzenleSatisTipiBox .chip-btn').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  if(window._rezDuzenle) window._rezDuzenle.sablon.satis_tipi = tip;
}

function _donanimRezDuzenleRender(){
  const box = document.getElementById('donanimRezDuzenleKalemler');
  const st = window._rezDuzenle;
  if(!st.kalemler.length){ box.innerHTML='<div class="empty" style="font-size:12px;">Kalem yok — en az bir cihaz olmalı.</div>'; return; }
  box.innerHTML = st.kalemler.map((k,i)=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="flex:1;font-size:12px;">${escapeHTML(k.ad)}</div>
      <input type="number" min="1" value="${k.adet}" onchange="donanimRezDuzenleAdet(${i}, this.value)" style="width:70px;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px;font-size:13px;">
      <button class="btn btn-sm btn-ghost" onclick="donanimRezDuzenleSil(${i})">Sil</button>
    </div>`).join('');
}

function donanimRezDuzenleAdet(i, val){
  const a = parseInt(val);
  if(!a || a<1){ toast('Adet en az 1 olmalı','error'); _donanimRezDuzenleRender(); return; }
  window._rezDuzenle.kalemler[i].adet = a;
}

function donanimRezDuzenleSil(i){
  window._rezDuzenle.kalemler.splice(i,1);
  _donanimRezDuzenleRender();
}

function donanimRezDuzenleCihazEkle(){
  const sel = document.getElementById('donanimRezDuzenleYeniCihaz');
  const urunId = parseInt(sel.value);
  const adet = parseInt(document.getElementById('donanimRezDuzenleYeniAdet').value);
  if(!urunId){ toast('Cihaz seçin','error'); return; }
  if(!adet || adet<1){ toast('Geçerli adet girin','error'); return; }
  const ad = sel.options[sel.selectedIndex]?.getAttribute('data-ad') || ('Cihaz #'+urunId);
  const st = window._rezDuzenle;
  const mevcut = st.kalemler.find(k=>k.urun_id===urunId);
  if(mevcut){ mevcut.adet += adet; } else { st.kalemler.push({ urun_id:urunId, ad, adet }); }
  _donanimRezDuzenleRender();
  document.getElementById('donanimRezDuzenleYeniAdet').value=1;
  sel.value='';
}

async function donanimRezDuzenleKaydet(){
  const st = window._rezDuzenle;
  if(!st) return;
  if(!st.kalemler.length){ toast('En az bir cihaz kalmalı (tümünü kaldırmak için İptal/Reddet kullanın)','error'); return; }

  // Guard: orijinali tekrar oku, durum değişmemiş mi
  const {data:orj, error} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id', st.sepetId);
  if(error||!orj?.length){ toast('Kayıt bulunamadı','error'); return; }
  if(orj[0].durum!==st.durum){ toast('Durum değişmiş — düzenleme iptal, tekrar açın','error'); closeModal('donanimRezDuzenleModal'); loadDonanimRezervasyonlar(); return; }

  // urun_id bazında net delta
  const eskiMap={}; orj.forEach(k=>{ eskiMap[k.urun_id]=(eskiMap[k.urun_id]||0)+k.adet; });
  const yeniMap={}; st.kalemler.forEach(k=>{ yeniMap[k.urun_id]=(yeniMap[k.urun_id]||0)+k.adet; });
  const tumUrun = [...new Set([...Object.keys(eskiMap),...Object.keys(yeniMap)].map(Number))];
  const delta={}; tumUrun.forEach(u=>{ delta[u]=(yeniMap[u]||0)-(eskiMap[u]||0); });

  // Onaylandı: pozitif delta'lar için müsait ÖN-kontrol (kısmi uygulama olmasın)
  if(st.durum==='Onaylandı'){
    for(const u of tumUrun){
      if(delta[u]>0){
        const {data:urun} = await sb.from('stok_urunleri').select('toplam_adet,rezerve_adet').eq('urun_id',u).single();
        const musait=(urun?.toplam_adet||0)-(urun?.rezerve_adet||0);
        if(musait < delta[u]){ toast(`Müsait stok yetersiz (cihaz #${u}: müsait ${musait}, gerekli +${delta[u]}) — kaydedilmedi`,'error'); return; }
      }
    }
  }

  // Stok uygula (durum-farkında)
  for(const u of tumUrun){
    if(delta[u]===0) continue;
    const {data:urun} = await sb.from('stok_urunleri').select('on_rezerve_adet,rezerve_adet').eq('urun_id',u).single();
    if(!urun) continue;
    if(st.durum==='Ön Rezervasyon'){
      await sb.from('stok_urunleri').update({ on_rezerve_adet: Math.max(0,(urun.on_rezerve_adet||0)+delta[u]), updated_at:new Date().toISOString() }).eq('urun_id',u);
    } else {
      await sb.from('stok_urunleri').update({ rezerve_adet: Math.max(0,(urun.rezerve_adet||0)+delta[u]), updated_at:new Date().toISOString() }).eq('urun_id',u);
    }
  }

  // Satır senkronu — (sepet_id, urun_id) hedefli (delete-all riski yok)
  const yeniUrunSet = new Set(st.kalemler.map(k=>k.urun_id));
  for(const k of st.kalemler){
    const varMi = orj.find(o=>o.urun_id===k.urun_id);
    if(varMi){
      await sb.from('stok_rezervasyonlari').update({ adet:k.adet, updated_at:new Date().toISOString() }).eq('sepet_id',st.sepetId).eq('urun_id',k.urun_id);
    } else {
      const {error:iErr} = await sb.from('stok_rezervasyonlari').insert({
        sepet_id:st.sepetId, urun_id:k.urun_id, adet:k.adet,
        kcm_id:st.sablon.kcm_id, ncst:st.sablon.ncst, musteri_my_id:st.sablon.musteri_my_id,
        satan_my_id:st.sablon.satan_my_id, rezerve_eden_id:st.sablon.rezerve_eden_id, durum:st.sablon.durum,
        satis_tipi:st.sablon.satis_tipi
      });
      if(iErr){ toast('Hata: kalem eklenemedi: '+iErr.message,'error'); return; }
    }
  }
  const silUrun = orj.filter(o=>!yeniUrunSet.has(o.urun_id)).map(o=>o.urun_id);
  if(silUrun.length){ await sb.from('stok_rezervasyonlari').delete().eq('sepet_id',st.sepetId).in('urun_id',silUrun); }

  // v31.25: Satış Tipi değiştiyse sepetteki tüm satırlara uygula
  if(st.sablon.satis_tipi && st.sablon.satis_tipi !== orj[0].satis_tipi){
    await sb.from('stok_rezervasyonlari').update({ satis_tipi: st.sablon.satis_tipi, updated_at:new Date().toISOString() }).eq('sepet_id', st.sepetId);
  }

  await _donanimRezHareketLog('Rezervasyon Düzenlendi', st.kalemler, {ncst:st.sablon.ncst, satan_my_id:st.sablon.satan_my_id});

  toast('Rezervasyon güncellendi','success');
  closeModal('donanimRezDuzenleModal');
  loadDonanimRezervasyonlar();
  if(typeof loadDonanimListesi==='function') loadDonanimListesi();
}

async function openDonanimRezDetay(sepetId){
  const icerikEl = document.getElementById('donanimRezDetayIcerik');
  icerikEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  openModal('donanimRezDetayModal');

  // v30.91: embedded FK join (400) yerine 2 ayrı sorgu — iki tablo arası FK yok
  const {data:kalemler, error:kErr} = await sb.from('stok_rezervasyonlari')
    .select('*').eq('sepet_id', sepetId).order('created_at');
  if(kErr || !kalemler || !kalemler.length){ icerikEl.innerHTML='<div class="empty">Bulunamadı.</div>'; return; }

  // Ürün bilgisini ayrı çek ve eşle
  const urunIds = [...new Set(kalemler.map(k=>k.urun_id).filter(Boolean))];
  const urunMap = {};
  if(urunIds.length){
    const {data:urunler} = await sb.from('stok_urunleri').select('urun_id,aciklama,fiyat').in('urun_id', urunIds);
    (urunler||[]).forEach(u=>{ urunMap[u.urun_id] = u; });
  }

  // v31.18 (2.4): bu sepete atanmış IMEI/seri no'lar — donanim_imei_gor yoksa maskeli gösterilir
  const {data:seriler} = await sb.from('stok_seri_no').select('seri_no,urun_id').eq('sepet_id', sepetId);
  const seriByUrun = {};
  (seriler||[]).forEach(s=>{ (seriByUrun[s.urun_id]=seriByUrun[s.urun_id]||[]).push(s.seri_no); });

  const ilk = kalemler[0];
  const {data:myData} = await sb.from('users').select('ad_soyad,takim_lideri_id,kcm_id').eq('my_id',ilk.satan_my_id).single();
  let tlAd='—', kcmAd='—';
  if(myData?.takim_lideri_id){
    const {data:tl} = await sb.from('users').select('ad_soyad').eq('my_id',myData.takim_lideri_id).single();
    tlAd = tl?.ad_soyad||'—';
  }
  if(ilk.kcm_id){
    const {data:kcm} = await sb.from('kcm_groups').select('kcm_adi').eq('kcm_id',ilk.kcm_id).single();
    kcmAd = kcm?.kcm_adi||'—';
  }

  const adim = DONANIM_SUREC_ADIMLARI[ilk.durum] || {no:'?', renk:'var(--text3)'};
  let toplam=0;
  const satirlar = kalemler.map(k=>{
    const fiyat = urunMap[k.urun_id]?.fiyat||0;
    const satirToplam = fiyat * k.adet;
    toplam += satirToplam;
    const seriListesi = (seriByUrun[k.urun_id]||[]).map(sn=>escapeHTML(_imeiMaskele(sn))).join('<br>');
    return `<tr>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;">${escapeHTML(urunMap[k.urun_id]?.aciklama||'—')}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:center;">${k.adet}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:right;">${Number(fiyat).toLocaleString('tr-TR')} ₺</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;text-align:right;font-weight:700;">${Number(satirToplam).toLocaleString('tr-TR')} ₺</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);font-size:11px;font-family:monospace;color:var(--text2);">${seriListesi||'—'}</td>
    </tr>`;
  }).join('');

  icerikEl.innerHTML = `
    <div style="margin-bottom:10px;font-size:13px;">
      <div><b>KÇM:</b> ${escapeHTML(kcmAd)}</div>
      <div><b>Takım Lideri:</b> ${escapeHTML(tlAd)}</div>
      <div><b>MY/FMY:</b> ${escapeHTML(myData?.ad_soyad||'—')}</div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
        <span style="background:${adim.renk};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${adim.no}. ${escapeHTML(ilk.durum)}</span>
        ${ilk.satis_tipi ? `<span style="background:${DONANIM_SATIS_TIPI_RENK[ilk.satis_tipi]||'var(--text3)'};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${escapeHTML(ilk.satis_tipi)}</span>` : ''}
      </div>
    </div>
    <div style="overflow:auto;border:1px solid var(--border);border-radius:8px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:var(--navy2);">
          <th style="padding:6px;text-align:left;font-size:10px;color:var(--text3);">ÜRÜN</th>
          <th style="padding:6px;font-size:10px;color:var(--text3);">ADET</th>
          <th style="padding:6px;text-align:right;font-size:10px;color:var(--text3);">BİRİM</th>
          <th style="padding:6px;text-align:right;font-size:10px;color:var(--text3);">TOPLAM</th>
          <th style="padding:6px;text-align:left;font-size:10px;color:var(--text3);">IMEI</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
    </div>
    ${(!hasPerm('donanim_imei_gor') && Object.keys(seriByUrun).length) ? `<div style="font-size:10px;color:var(--text3);margin-top:4px;">IMEI numaraları güvenlik nedeniyle kısmi (ilk4+son4) gösterilir.</div>` : ''}
    <div style="text-align:right;margin-top:10px;font-size:16px;font-weight:800;">Genel Toplam: ${Number(toplam).toLocaleString('tr-TR')} ₺</div>
    ${ilk.aciklama ? `<div style="margin-top:8px;font-size:12px;color:var(--text2);">Not: ${escapeHTML(ilk.aciklama)}</div>` : ''}
  `;
}

/* ============================================================
   DEPO & DAĞITIM — Depo & Muhasebe ekranı (V31.55)
   ------------------------------------------------------------
   Merkez Depo = cihaz havuzu (depolar.kcm_id IS NULL, tip='ANA').
   Her KÇM aynı zamanda bir sanal depodur; istendiğinde her deponun
   altına TEK bir cep depo açılabilir — tekilliği veri tabanı
   indeksleri zorlar (ux_depolar_kcm_tip / ux_depolar_merkez_tip).

   Bu ekran Merkez -> diğer depolara ADET tahsisi yapar; seri (IMEI)
   TAŞIMAZ. IMEI'ler havuzda kalır, satışta eşleştirilir.
   Ana depo <-> cep depo hareketi transfer akışıyla yapılacak (Faz 6).

   Kurallar:
   • Σ (Merkez dışı depolar) <= Merkez toplam_adet
   • Bir deponun tahsisi rezerve_adet + on_rezerve_adet altına inemez
   • Adet 0 + rezervasyon yok  -> satır silinir
   • Ürün pasife alınırsa aynı malzeme_kodu'nun TÜM depo satırları pasif
   ============================================================ */

window._donanimDepolar  = window._donanimDepolar  || [];
window._donanimDepoUrun = window._donanimDepoUrun || {};
window._donanimDagitim  = window._donanimDagitim  || null;

// HTML attribute içindeki tek tırnaklı JS dizesi için kaçış
function _jsStr(s){
  return String(s==null?'':s)
    .replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    .replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

function _depoMerkez(){
  return (window._donanimDepolar||[]).find(d=> d.kcm_id===null && d.tip==='ANA') || null;
}

function _depoAd(d){
  if(!d) return '—';
  return d.tam_ad || d.depo_adi || ('Depo #'+d.depo_id);
}

async function _donanimDepolarYukle(zorla){
  if(!zorla && window._donanimDepolar.length) return window._donanimDepolar;
  const {data,error} = await sb.from('depolar_v').select('*').eq('aktif',true);
  if(error){ console.error('[donanim] depolar okunamadı:', error.message); return window._donanimDepolar; }
  const list = data||[];
  // Merkez önce; sonra KÇM adına göre, her ana deponun hemen ardından cebi
  list.sort((a,b)=>{
    const ak = (a.kcm_id===null)?0:1, bk = (b.kcm_id===null)?0:1;
    if(ak!==bk) return ak-bk;
    const an = (a.kcm_adi||a.depo_adi||''), bn = (b.kcm_adi||b.depo_adi||'');
    if(an!==bn) return an.localeCompare(bn,'tr');
    return (a.tip==='ANA'?0:1) - (b.tip==='ANA'?0:1);
  });
  window._donanimDepolar = list;
  return list;
}

// stok_urunleri'nden depoya bağlı TÜM satırlar — sayfalanarak (limit tuzağı yok)
async function _donanimDepoSatirlariYukle(){
  const kolon = 'urun_id,depo_id,kcm_id,depo_adi,malzeme_kodu,aciklama,toplam_adet,rezerve_adet,on_rezerve_adet,aktif,tum_kcm';
  const hepsi = []; const SAYFA = 1000;
  for(let bas=0; bas<20000; bas+=SAYFA){
    const {data,error} = await sb.from('stok_urunleri').select(kolon)
      .not('depo_id','is',null).order('urun_id').range(bas, bas+SAYFA-1);
    if(error) throw new Error('Depo satırları okunamadı: '+error.message);
    hepsi.push(...(data||[]));
    if(!data || data.length < SAYFA) break;
  }
  return hepsi;
}

async function loadDonanimDepoSekme(){
  const el = document.getElementById('donanimIzgara');
  if(!el) return;
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  _izgDurum('Değişiklikler hücreden çıkınca kaydedilir.', 'var(--text2)');
  try{
    await _donanimIzgaraVeri();
    const kartEl = document.getElementById('donanimDepoKartlari');
    if(kartEl) kartEl.innerHTML = _donanimDepoKartlari(window._donanimIzgara.ozet);
    _donanimIzgaraCiz();
    _donanimIzgaraYukseklik();
  }catch(err){
    console.error(err);
    el.innerHTML = `<div style="padding:16px;color:var(--red);font-size:13px;">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

// V31.62: aile basina TEK kutu — ana depo ustte, cep deposu altta.
// Kutuya basilinca o depo ailesinin detay modali acilir.
function _donanimDepoKartlari(ozet){
  const I = window._donanimIzgara;
  const aileler = (I && I.aileler) ? I.aileler : _donanimDepoAgaci();
  if(!aileler.length) return '<div style="padding:10px;color:var(--text2);font-size:13px;">Depo tanımlı değil.</div>';
  const cepGor = _izgCepGorunur();
  return '<div class="izg-cip">' + aileler.map(a=>{
    const oa = ozet[a.ana.depo_id] || {urun:0, adet:0};
    const dal=(d,tip,cls)=>{
      const o=ozet[d.depo_id]||{urun:0,adet:0};
      return `<button type="button" class="dk-dal ${cls}" onclick="donanimDepoDetayAc('${_jsStr(a.anahtar)}',${d.depo_id})"><span class="dk-tip">${tip}</span><span class="dk-sy"><b>${o.urun}</b> ürün · <b>${o.adet}</b> cihaz</span></button>`;
    };
    let cepSatir = '';
    if(cepGor){
      if(a.cep){
        cepSatir = dal(a.cep,'Cep Depo','cep');
      }else{
        cepSatir = `<button type="button" class="dk-yok" onclick="donanimCepDepoAc(${a.kcm_id===null?'null':a.kcm_id})">+ Cep aç</button>`;
      }
    }
    return `<section class="depo-kutu">
      <div class="dk-ad">${escapeHTML(a.ad)}</div>
      <div class="dk-dallar">${dal(a.ana,a.merkez?'Merkez / Ana':'Ana Depo','ana'+(a.merkez?' merkez':''))}${cepSatir}</div>
    </section>`;
  }).join('') + '</div>';
}

/* --- DEPO DETAY MODALI (V31.62) — ek sorgu yok, izgara verisini okur --- */
function donanimDepoDetayAc(anahtar,depoId){
  const I = window._donanimIzgara;
  if(!I){ toast('Depo verisi henüz yüklenmedi','error'); return; }
  const aile = I.aileler.find(a=> String(a.anahtar) === String(anahtar));
  if(!aile){ toast('Depo bulunamadı','error'); return; }
  const secili=[aile.ana,aile.cep].find(d=>d&&d.depo_id===Number(depoId));
  if(!secili){ toast('Depo bulunamadı','error'); return; }
  window._donanimDepoDetay = {aile,secili};
  const bas = document.getElementById('donanimDepoDetayBaslik');
  if(bas) bas.textContent = `${aile.ad} — ${secili.tip==='CEP'?'Cep Depo':'Ana Depo'}`;
  const ara = document.getElementById('donanimDepoDetayAra');
  if(ara) ara.value = '';
  _donanimDepoDetayRender();
  openModal('donanimDepoDetayModal');
}

let _depoDetayAraT = null;
function donanimDepoDetayAraDebounce(){
  clearTimeout(_depoDetayAraT);
  _depoDetayAraT = setTimeout(_donanimDepoDetayRender, 200);
}

function _donanimDepoDetayRender(){
  const detay = window._donanimDepoDetay;
  const aile = detay?.aile;
  const I    = window._donanimIzgara;
  const el   = document.getElementById('donanimDepoDetayGovde');
  if(!aile || !I || !el) return;
  const q = (document.getElementById('donanimDepoDetayAra')?.value||'').trim().toLocaleLowerCase('tr');

  const merkezIdDetay = I.merkez ? I.merkez.depo_id : null;
  const bolum = (depo, cep)=>{
    if(!depo) return '';
    let satirlar = Object.keys(I.gruplar).map(kod=>{
      const grp = I.gruplar[kod];
      const s = grp.satirlar[depo.depo_id];
      if(!s) return null;
      let adet = s.toplam_adet||0;
      // V31.123: Merkez (Havuz) için ham toplam yerine gerçek kalan
      if(merkezIdDetay!==null && depo.depo_id===merkezIdDetay){
        const dagitilan = Object.keys(grp.satirlar)
          .filter(id=>Number(id)!==merkezIdDetay)
          .reduce((t,id)=> t + (grp.satirlar[id].toplam_adet||0), 0);
        adet = adet - dagitilan;
      }
      const rez  = (s.rezerve_adet||0) + (s.on_rezerve_adet||0);
      if(adet === 0 && rez === 0) return null;
      return {kod, ad: grp.aciklama || kod, adet, rez, musait: adet - rez};
    }).filter(Boolean);

    const toplamUrun = satirlar.length;
    const toplamAdet = satirlar.reduce((t,r)=> t + r.adet, 0);

    if(q){
      const kelimeler = q.split(/\s+/).filter(Boolean);
      satirlar = satirlar.filter(r=>{
        const m = (r.ad + ' ' + r.kod).toLocaleLowerCase('tr');
        return kelimeler.every(w=> m.includes(w));
      });
    }
    satirlar.sort((a,b)=> b.adet - a.adet || a.ad.localeCompare(b.ad,'tr'));

    const govde = satirlar.length
      ? satirlar.map(r=>`<div class="dd-satir">
          <div class="dd-sol">
            <div class="dd-ad">${escapeHTML(r.ad)}</div>
            <div class="dd-kod">${escapeHTML(r.kod)}</div>
          </div>
          <div class="dd-sag">
            <span class="dd-adet">${r.adet}</span>
            <span class="dd-alt">${r.rez ? ('rez '+r.rez+' · müsait '+r.musait) : 'tamamı müsait'}</span>
          </div>
        </div>`).join('')
      : `<div class="dd-bos">${q ? 'Aramaya uyan ürün yok.' : 'Bu depoda cihaz yok.'}</div>`;

    return `<div class="dd-bolum${cep?' cep':''}">
      <div class="dd-baslik">
        <span>${cep ? 'CEP DEPOSU' : 'ANA DEPO'}</span>
        <span class="dd-ozet">${toplamUrun} ürün · ${toplamAdet} cihaz</span>
      </div>
      ${govde}
    </div>`;
  };

  const cepGor = _izgCepGorunur();
  el.innerHTML = bolum(detay.secili, detay.secili.tip==='CEP');
}

function _donanimDepoUrunListesi(){
  const gruplar = window._donanimDepoUrun||{};
  const q = (document.getElementById('donanimDepoUrunAra')?.value||'').trim().toLocaleLowerCase('tr');
  const sadeceStoklu = !!document.getElementById('donanimDepoSadeceStoklu')?.checked;
  const merkez = _depoMerkez();

  let kodlar = Object.keys(gruplar);
  if(q){
    const kelimeler = q.split(/\s+/).filter(Boolean);
    kodlar = kodlar.filter(k=>{
      const metin = ((gruplar[k].aciklama||'') + ' ' + k).toLocaleLowerCase('tr');
      return kelimeler.every(w=> metin.includes(w));
    });
  }
  if(sadeceStoklu) kodlar = kodlar.filter(k=> ((gruplar[k].merkez && gruplar[k].merkez.toplam_adet) || 0) > 0);
  kodlar.sort((a,b)=> (gruplar[a].aciklama||a).localeCompare(gruplar[b].aciklama||b,'tr'));

  if(!kodlar.length) return '<div style="padding:16px;color:var(--text2);font-size:13px;">Kayıt bulunamadı.</div>';

  return `<div style="font-size:11px;color:var(--text3);margin-bottom:6px;">${kodlar.length} ürün</div>` +
  kodlar.map(k=>{
    const g = gruplar[k];
    const havuz = (g.merkez && g.merkez.toplam_adet) || 0;
    let dagitilan = 0;
    Object.keys(g.satirlar).forEach(id=>{
      if(!merkez || parseInt(id) !== merkez.depo_id) dagitilan += (g.satirlar[id].toplam_adet||0);
    });
    const kalan = havuz - dagitilan;
    return `<div style="background:var(--navy2);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;${g.aktif?'':'opacity:.55;'}">
      <div style="font-weight:700;font-size:13px;line-height:1.35;">${escapeHTML(g.aciklama||k)}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">${escapeHTML(k)}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:6px;">
        Havuzda: <b style="color:var(--text);">${havuz}</b> ·
        Dağıtılan: <b style="color:var(--text);">${dagitilan}</b> ·
        Merkez'de kalan: <b style="color:${kalan<0?'var(--red)':'var(--green)'};">${kalan}</b>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap;">
        <label style="font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" ${g.tum_kcm?'checked':''} onchange="donanimOrtakStokToggle('${_jsStr(k)}', this.checked)"> Ortak stok
        </label>
        <label style="font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" ${g.aktif?'checked':''} onchange="donanimUrunAktifToggle('${_jsStr(k)}', this.checked)"> Aktif
        </label>
        <button class="btn btn-sm" style="background:var(--blue);margin-left:auto;" onclick="donanimDagitimModalAc('${_jsStr(k)}')">Dağıt</button>
      </div>
    </div>`;
  }).join('');
}

let _donanimDepoAraT = null;
function donanimDepoUrunAraDebounce(){
  clearTimeout(_donanimDepoAraT);
  _donanimDepoAraT = setTimeout(donanimDepoFiltreDegisti, 250);
}
function donanimDepoFiltreDegisti(){
  const el = document.getElementById('donanimDepoUrunListesi');
  if(el) el.innerHTML = _donanimDepoUrunListesi();
}

// Cep depo aç — her deponun altında EN FAZLA bir tane (indeks zorlar)
async function donanimCepDepoAc(kcmId){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const kid = (kcmId===null || kcmId===undefined || kcmId==='') ? null : parseInt(kcmId);
  const ana = (window._donanimDepolar||[]).find(d=> d.tip==='ANA' && ((kid===null && d.kcm_id===null) || d.kcm_id===kid));
  const ad = (ana ? (ana.kcm_adi || ana.depo_adi) : 'Depo') + ' - Cep';
  const {error} = await sb.from('depolar').insert({kcm_id:kid, depo_adi:ad, tip:'CEP'});
  if(error){ toast('Cep depo açılamadı: '+error.message,'error'); return; }
  await sb.from('stok_hareketleri').insert({
    aksiyon:'Cep Depo Açıldı', detay:ad,
    user_id:currentUser.my_id, user_ad:currentUser.ad_soyad||String(currentUser.my_id)
  });
  toast('Cep depo açıldı: '+ad,'success');
  loadDonanimDepoSekme();
}

function donanimDagitimModalAc(kod){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const g = (window._donanimDepoUrun||{})[kod];
  if(!g){ toast('Ürün bulunamadı','error'); return; }
  const merkez = _depoMerkez();
  if(!merkez){ toast('Merkez Depo tanımlı değil','error'); return; }

  const satirlar = (window._donanimDepolar||[])
    .filter(d=> d.depo_id !== merkez.depo_id)
    .map(d=>{
      const s = g.satirlar[d.depo_id] || null;
      return {
        depo_id: d.depo_id, ad: _depoAd(d), kcm_id: d.kcm_id, depo_adi: d.depo_adi,
        urun_id: s ? s.urun_id : null,
        mevcut:  s ? (s.toplam_adet||0) : 0,
        alt:     s ? ((s.rezerve_adet||0) + (s.on_rezerve_adet||0)) : 0,
        adet:    s ? (s.toplam_adet||0) : 0
      };
    });

  window._donanimDagitim = {
    kod, aciklama: g.aciklama||kod,
    havuz: (g.merkez && g.merkez.toplam_adet) || 0,
    merkezUrunId: (g.merkez && g.merkez.urun_id) || null,
    tum_kcm: !!g.tum_kcm,
    satirlar
  };

  const bas = document.getElementById('donanimDagitimBaslik');
  if(bas) bas.textContent = 'Dağıt — ' + (g.aciklama||kod);
  _donanimDagitimRender();
  openModal('donanimDagitimModal');
}

function _donanimDagitimRender(){
  const D = window._donanimDagitim; if(!D) return;
  const el = document.getElementById('donanimDagitimSatirlar');
  if(el) el.innerHTML = D.satirlar.map((r,i)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">${escapeHTML(r.ad)}</div>
        ${r.alt>0?`<div style="font-size:11px;color:#f59e0b;">En az ${r.alt} olmalı (rezerve edilmiş)</div>`:''}
      </div>
      <input type="number" min="${r.alt}" step="1" value="${r.adet}"
             oninput="donanimDagitimAdet(${i}, this.value)"
             style="width:80px;text-align:center;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;font-size:14px;">
    </div>`).join('');
  _donanimDagitimToplamYaz();
}

function _donanimDagitimToplamYaz(){
  const D = window._donanimDagitim; if(!D) return;
  const toplam = D.satirlar.reduce((t,r)=> t + (parseInt(r.adet)||0), 0);
  const kalan = D.havuz - toplam;
  const asim = kalan < 0;
  const el = document.getElementById('donanimDagitimToplam');
  if(el) el.innerHTML =
    `<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:10px 0;">
       <span style="color:var(--text2);">Havuz: <b style="color:var(--text);">${D.havuz}</b></span>
       <span style="color:var(--text2);">Dağıtılan: <b style="color:var(--text);">${toplam}</b></span>
       <span style="color:${asim?'var(--red)':'var(--green)'};font-weight:700;">Kalan: ${kalan}</span>
     </div>
     ${asim?`<div style="font-size:12px;color:var(--red);">Toplam dağıtım havuzu ${-kalan} adet aşıyor.</div>`:''}`;
  const btn = document.getElementById('donanimDagitimKaydetBtn');
  if(btn){ btn.disabled = asim; btn.style.opacity = asim ? '.5' : '1'; }
}

function donanimDagitimAdet(i, val){
  const D = window._donanimDagitim; if(!D || !D.satirlar[i]) return;
  let v = parseInt(val); if(isNaN(v) || v < 0) v = 0;
  D.satirlar[i].adet = v;
  _donanimDagitimToplamYaz();
}

async function donanimDagitimKaydet(){
  const D = window._donanimDagitim; if(!D) return;
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }

  const toplam = D.satirlar.reduce((t,r)=> t + (parseInt(r.adet)||0), 0);
  if(toplam > D.havuz){ toast(`Toplam dağıtım havuzu aşıyor (${toplam} > ${D.havuz})`,'error'); return; }

  // Azaltma güvenliği — HİÇBİR ŞEY YAZILMADAN ÖNCE tümü doğrulanır
  for(const r of D.satirlar){
    if((parseInt(r.adet)||0) < r.alt){
      toast(`${r.ad}: tahsis ${r.alt} altına inemez (rezerve edilmiş)`,'error'); return;
    }
  }

  const btn = document.getElementById('donanimDagitimKaydetBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  const hatalar = [];
  for(const r of D.satirlar){
    const adet = parseInt(r.adet)||0;
    try{
      if(r.urun_id){
        if(adet === 0 && r.alt === 0){
          const {error} = await sb.from('stok_urunleri').delete().eq('urun_id', r.urun_id);
          if(error) throw new Error(error.message);
        } else if(adet !== r.mevcut){
          const {error} = await sb.from('stok_urunleri')
            .update({toplam_adet:adet, updated_at:new Date().toISOString()}).eq('urun_id', r.urun_id);
          if(error) throw new Error(error.message);
        }
      } else if(adet > 0){
        const {error} = await sb.from('stok_urunleri').insert({
          depo_id: r.depo_id, kcm_id: r.kcm_id, depo_adi: r.depo_adi,
          malzeme_kodu: D.kod, aciklama: D.aciklama,
          toplam_adet: adet, rezerve_adet: 0, on_rezerve_adet: 0,
          aktif: true, tum_kcm: !!D.tum_kcm
        });
        if(error) throw new Error(error.message);
      }
    }catch(e){ hatalar.push(`${r.ad}: ${e.message}`); }
  }

  const {error:logErr} = await sb.from('stok_hareketleri').insert({
    urun_id: D.merkezUrunId || null,
    aksiyon: 'Depo Dağıtımı',
    detay: `${D.aciklama} — havuz ${D.havuz}, dağıtılan ${toplam}` + (hatalar.length?` · ${hatalar.length} hata`:''),
    user_id: currentUser.my_id,
    user_ad: currentUser.ad_soyad || String(currentUser.my_id)
  });
  if(logErr) console.error('[donanim] dağıtım log hatası:', logErr.message);

  if(btn){ btn.disabled = false; btn.textContent = 'Kaydet'; }
  if(hatalar.length){
    console.error('[donanim] dağıtım hataları:', hatalar);
    toast('Bazı depolar kaydedilemedi: '+hatalar[0],'error');
  } else {
    toast('Dağıtım kaydedildi','success');
  }
  closeModal('donanimDagitimModal');
  loadDonanimDepoSekme();
}

// Ortak stok / aktiflik — aynı malzeme_kodu'nun TÜM depo satırlarına uygulanır
async function donanimOrtakStokToggle(kod, deger){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); loadDonanimDepoSekme(); return; }
  const {error} = await sb.from('stok_urunleri')
    .update({tum_kcm: !!deger, updated_at:new Date().toISOString()})
    .eq('malzeme_kodu', kod).not('depo_id','is',null);
  if(error) toast('Kaydedilemedi: '+error.message,'error');
  else toast(deger?'Ortak stok açıldı':'Ortak stok kapatıldı','success');
  loadDonanimDepoSekme();
}

async function donanimUrunAktifToggle(kod, deger){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); loadDonanimDepoSekme(); return; }
  const {error} = await sb.from('stok_urunleri')
    .update({aktif: !!deger, updated_at:new Date().toISOString()})
    .eq('malzeme_kodu', kod).not('depo_id','is',null);
  if(error) toast('Kaydedilemedi: '+error.message,'error');
  else toast(deger?'Ürün aktif edildi':'Ürün pasife alındı','success');
  loadDonanimDepoSekme();
}

/* ============================================================
   DEPO DAĞITIM IZGARASI (V31.61)
   ------------------------------------------------------------
   Satır = ürün, sütun = depo. Depolar AİLE halinde gruplanır:
   her ailenin bir ANA deposu, istenirse bir CEP deposu vardır.
   Merkez ailesinin ANA deposu HAVUZ'dur (salt okunur).

   Kurallar (V31.55 ile aynı, artık hücre bazlı uygulanır):
   • Σ (Merkez dışı tüm depolar) <= Merkez toplam_adet
   • Bir depo, o depodaki rezerve_adet + on_rezerve_adet altına inemez
   • Adet 0 + rezervasyon yok -> satır silinir
   • Kayıt ANLIK: hücreden çıkınca (change) yazılır. Aynı ürünün
     ardışık hücreleri IZG_YAZ_GECIKME ms boyunca toplanıp tek
     turda yazılır (ardışık istek yığılması olmasın diye).
   • Kural ihlali sunucuya HİÇ gitmez; değer eski hâline döner.

   Cep depoları yalnızca donanim_yonet yetkisinde görünür.
   ============================================================ */

const IZG_YAZ_GECIKME = 200;                 // ms — aynı ürün için toparlama
window._donanimIzgara = window._donanimIzgara || null;
const _izgKuyruk = new Map();                // malzeme_kodu -> {timer, alanlar:Map}

const _izgCepGorunur = () => hasPerm('donanim_yonet');

// Depoları aileye ayırır: Merkez (kcm_id NULL) önce, sonra KÇM'ler ada göre
function _donanimDepoAgaci(){
  const map = new Map();
  (window._donanimDepolar||[]).forEach(d=>{
    const anahtar = (d.kcm_id===null || d.kcm_id===undefined) ? 'M' : String(d.kcm_id);
    if(!map.has(anahtar)){
      map.set(anahtar, {anahtar, kcm_id:(anahtar==='M'?null:d.kcm_id), ad:'', merkez:(anahtar==='M'), ana:null, cep:null});
    }
    const a = map.get(anahtar);
    if(d.tip==='CEP') a.cep = d; else a.ana = d;
    if(!a.ad) a.ad = d.kcm_adi || d.depo_adi || _depoAd(d);
  });
  const aileler = [...map.values()].filter(a=> a.ana);
  aileler.forEach(a=>{ if(a.merkez) a.ad = a.ana.depo_adi || 'Merkez Depo'; });
  aileler.sort((a,b)=> (a.merkez?0:1)-(b.merkez?0:1) || a.ad.localeCompare(b.ad,'tr'));
  return aileler;
}

/* --- değer erişimi: kayıtlı (DB) ve geçici (yazılıyor) --- */
function _izgKayitli(g, depoId){
  const s = g.satirlar[depoId];
  return s ? (s.toplam_adet||0) : 0;
}
function _izgAdet(g, depoId){
  if(g.gecici && g.gecici[depoId] !== undefined) return g.gecici[depoId];
  return _izgKayitli(g, depoId);
}
function _izgAlt(g, depoId){
  const s = g.satirlar[depoId];
  return s ? ((s.rezerve_adet||0) + (s.on_rezerve_adet||0)) : 0;
}
function _izgHavuz(g){ return (g.merkez && g.merkez.toplam_adet) || 0; }

// Havuz dışı TÜM depolar — gizli cep depoları da sayılır, yoksa havuz matematiği bozulur
function _izgTumHedefler(){
  const merkez = window._donanimIzgara ? window._donanimIzgara.merkez : _depoMerkez();
  return (window._donanimDepolar||[]).filter(d=> !merkez || d.depo_id !== merkez.depo_id);
}
function _izgDagitilan(g){ return _izgTumHedefler().reduce((t,d)=> t + _izgAdet(g, d.depo_id), 0); }
function _izgKalan(g){ return _izgHavuz(g) - _izgDagitilan(g); }

/* --- veri --- */
async function _donanimIzgaraVeri(){
  await _donanimDepolarYukle(true);
  const satirlar = await _donanimDepoSatirlariYukle();
  const merkez = _depoMerkez();

  const gruplar = {};
  satirlar.forEach(s=>{
    const k = s.malzeme_kodu || ('#'+s.urun_id);
    if(!gruplar[k]) gruplar[k] = {kod:k, aciklama:'', tum_kcm:false, aktif:true, merkez:null, satirlar:{}, gecici:{}};
    const g = gruplar[k];
    g.satirlar[s.depo_id] = s;
    if(merkez && s.depo_id === merkez.depo_id){
      g.merkez = s; g.tum_kcm = !!s.tum_kcm; g.aktif = !!s.aktif;
      if(s.aciklama) g.aciklama = s.aciklama;
    }
    if(!g.aciklama) g.aciklama = s.aciklama || '';
  });

  // V31.123: Merkez (Havuz) hücresi ham toplam_adet yerine GERÇEK KALAN
  // (havuz - dağıtılan) ile sayılır — yoksa dağıtılan miktar hem Merkez'de
  // hem hedef KÇM'de görünüp çift sayılır (bkz. _izgKalan).
  const merkezIdOzet = merkez ? merkez.depo_id : null;
  const ozet = {};
  (window._donanimDepolar||[]).forEach(d=>{ ozet[d.depo_id] = {urun:0, adet:0}; });
  Object.values(gruplar).forEach(g=>{
    Object.keys(g.satirlar).forEach(depoIdStr=>{
      const depoId = Number(depoIdStr);
      const s = g.satirlar[depoId];
      let adet = s.toplam_adet||0;
      if(merkezIdOzet!==null && depoId===merkezIdOzet){
        const dagitilan = Object.keys(g.satirlar)
          .filter(id=>Number(id)!==merkezIdOzet)
          .reduce((t,id)=> t + (g.satirlar[id].toplam_adet||0), 0);
        adet = adet - dagitilan;
      }
      if(adet > 0){
        if(!ozet[depoId]) ozet[depoId] = {urun:0, adet:0};
        ozet[depoId].urun++; ozet[depoId].adet += adet;
      }
    });
  });

  window._donanimDepoUrun = gruplar;                    // eski fonksiyonlarla uyum
  window._donanimRapor    = _donanimRaporVeri(satirlar); // Excel aynı veriyi kullanır
  window._donanimIzgara   = {aileler:_donanimDepoAgaci(), gruplar, merkez, ozet};
  return window._donanimIzgara;
}

function _izgKodlar(){
  const I = window._donanimIzgara; if(!I) return [];
  const q = (document.getElementById('donanimIzgaraAra')?.value||'').trim().toLocaleLowerCase('tr');
  const bosGoster = !!document.getElementById('donanimIzgaraBos')?.checked;
  let kodlar = Object.keys(I.gruplar);
  if(q){
    const kelimeler = q.split(/\s+/).filter(Boolean);
    kodlar = kodlar.filter(k=>{
      const metin = ((I.gruplar[k].aciklama||'') + ' ' + k).toLocaleLowerCase('tr');
      return kelimeler.every(w=> metin.includes(w));
    });
  }
  if(!bosGoster) kodlar = kodlar.filter(k=> _izgHavuz(I.gruplar[k]) > 0 || _izgDagitilan(I.gruplar[k]) > 0);
  kodlar.sort((a,b)=> (I.gruplar[a].aciklama||a).localeCompare(I.gruplar[b].aciklama||b,'tr'));
  return kodlar;
}

/* --- çizim --- */
function _donanimIzgaraCiz(){
  const I  = window._donanimIzgara;
  const el = document.getElementById('donanimIzgara');
  if(!I || !el) return;
  if(!I.merkez){
    el.innerHTML = '<div style="padding:16px;color:var(--red);font-size:13px;">Merkez Depo tanımlı değil.</div>';
    return;
  }
  const cep = _izgCepGorunur();
  const kodlar = _izgKodlar();
  const kolonSayisi = 1 + I.aileler.length*(cep?2:1) + 2;

  const grupTr = '<th class="izg-urun">Depo ailesi &rarr;</th>'
    + I.aileler.map(a=>
        `<th class="izg-gbas" colspan="${cep?2:1}">${escapeHTML(a.ad)}</th>`).join('')
    + '<th colspan="2">Özet</th>';

  const dalTr = '<th class="izg-urun">Ürün</th>'
    + I.aileler.map(a=>{
        const ana = a.merkez
          ? '<th class="izg-gbas izg-havuz">Havuz</th>'
          : '<th class="izg-gbas">Ana</th>';
        if(!cep) return ana;
        const c = a.cep
          ? '<th class="izg-cep">Cep</th>'
          : `<th class="izg-cep"><button class="izg-cepac" onclick="donanimCepDepoAc(${a.kcm_id===null?'null':a.kcm_id})">+ Cep aç</button></th>`;
        return ana + c;
      }).join('')
    + '<th>Kalan</th><th>Dağıtılan</th>';

  const govde = !kodlar.length
    ? `<tr><td class="izg-urun" colspan="${kolonSayisi}" style="color:var(--text2);">Kayıt bulunamadı.</td></tr>`
    : kodlar.map(kod=>{
        const g = I.gruplar[kod];
        const hucreler = I.aileler.map(a=>{
          let out = a.merkez
            ? `<td class="izg-havuz izg-gbas">${_izgHavuz(g)}</td>`
            : _izgHucre(g, a.ana, 'izg-gbas');
          if(cep) out += a.cep ? _izgHucre(g, a.cep, 'izg-cep') : '<td class="izg-cepyok">&mdash;</td>';
          return out;
        }).join('');
        const k = _izgKalan(g);
        return `<tr${g.aktif?'':' style="opacity:.55;"'}>
          <td class="izg-urun">
            <div class="izg-ad">${escapeHTML(g.aciklama||kod)}</div>
            <div class="izg-kod">${escapeHTML(kod)}</div>
            <div class="izg-ayar">
              <button class="izg-pil${g.tum_kcm?' on':''}" title="Ortak stok — tüm KÇM'ler görür"
                onclick="donanimOrtakStokToggle('${_jsStr(kod)}', ${g.tum_kcm?'false':'true'})">ortak</button>
              <button class="izg-pil${g.aktif?' on':''}" title="Ürün aktif / pasif"
                onclick="donanimUrunAktifToggle('${_jsStr(kod)}', ${g.aktif?'false':'true'})">aktif</button>
            </div>
          </td>
          ${hucreler}
          <td class="izg-kalan ${k<0?'eksik':(k===0?'bitti':'')}" data-kalan="${escapeHTML(kod)}">${k}</td>
          <td class="izg-toplam" data-dagitim="${escapeHTML(kod)}">${_izgDagitilan(g)}</td>
        </tr>`;
      }).join('');

  el.innerHTML = `<table class="izg-tablo">
    <thead><tr class="izg-grup">${grupTr}</tr><tr class="izg-dal">${dalTr}</tr></thead>
    <tbody>${govde}</tbody>
    <tfoot><tr id="donanimIzgaraDip"></tr></tfoot>
  </table>`;
  _izgDip();
}

function _izgHucre(g, depo, tdSinif){
  const adet = _izgAdet(g, depo.depo_id);
  const alt  = _izgAlt(g, depo.depo_id);
  const cep  = (depo.tip === 'CEP');
  return `<td class="izg-h ${tdSinif}">
    <input class="izg-gir${cep?' izg-gir-cep':''}${adet===0?' izg-sifir':''}" type="number" min="${alt}" step="1"
           value="${adet}" data-kod="${escapeHTML(g.kod)}" data-depo="${depo.depo_id}"
           oninput="donanimIzgaraYaziliyor(this)" onchange="donanimIzgaraHucreKaydet(this)"
           aria-label="${escapeHTML((g.aciklama||g.kod)+' — '+_depoAd(depo))}">
    <span class="izg-min${alt?' var':''}">${alt?('min '+alt):'&nbsp;'}</span></td>`;
}

function _izgDip(){
  const I  = window._donanimIzgara;
  const tr = document.getElementById('donanimIzgaraDip');
  if(!I || !tr) return;
  const cep = _izgCepGorunur();
  const kodlar = _izgKodlar();
  const depoTop = depoId => kodlar.reduce((t,k)=> t + _izgAdet(I.gruplar[k], depoId), 0);
  const havuzTop = kodlar.reduce((t,k)=> t + _izgHavuz(I.gruplar[k]), 0);
  const kalanTop = kodlar.reduce((t,k)=> t + _izgKalan(I.gruplar[k]), 0);
  const genelTop = kodlar.reduce((t,k)=> t + _izgDagitilan(I.gruplar[k]), 0);
  tr.innerHTML = '<td class="izg-urun">TOPLAM</td>'
    + I.aileler.map(a=>{
        let out = a.merkez
          ? `<td class="izg-havuz izg-gbas">${havuzTop}</td>`
          : `<td class="izg-gbas">${depoTop(a.ana.depo_id)}</td>`;
        if(cep) out += a.cep ? `<td class="izg-cep">${depoTop(a.cep.depo_id)}</td>` : '<td class="izg-cepyok">&mdash;</td>';
        return out;
      }).join('')
    + `<td>${kalanTop}</td><td>${genelTop}</td>`;
}

function _izgSatirYenile(kod){
  const g = window._donanimIzgara?.gruplar?.[kod]; if(!g) return;
  const k = _izgKalan(g);
  const kh = document.querySelector(`[data-kalan="${CSS.escape(kod)}"]`);
  if(kh){ kh.textContent = k; kh.className = 'izg-kalan ' + (k<0?'eksik':(k===0?'bitti':'')); }
  const dh = document.querySelector(`[data-dagitim="${CSS.escape(kod)}"]`);
  if(dh) dh.textContent = _izgDagitilan(g);
}

function _izgDurum(metin, renk){
  const el = document.getElementById('donanimIzgaraDurum');
  if(el){ el.textContent = metin; el.style.color = renk || 'var(--text2)'; }
}

function _izgFlas(el, basarili){
  if(!el) return;
  el.classList.remove('izg-kirli','izg-ok','izg-red');
  el.classList.add(basarili ? 'izg-ok' : 'izg-red');
  setTimeout(()=>{ el.classList.remove('izg-ok','izg-red'); }, basarili ? 1100 : 1600);
}

/* --- yazarken: sadece ekran; kayıt YOK --- */
function donanimIzgaraYaziliyor(el){
  const kod = el.dataset.kod, depoId = parseInt(el.dataset.depo, 10);
  const g = window._donanimIzgara?.gruplar?.[kod]; if(!g) return;
  let v = parseInt(el.value, 10);
  if(isNaN(v) || v < 0) v = 0;
  g.gecici = g.gecici || {};
  g.gecici[depoId] = v;
  el.classList.remove('izg-ok','izg-red');
  el.classList.add('izg-kirli');
  el.classList.toggle('izg-sifir', v===0);
  _izgSatirYenile(kod);
  _izgDip();
}

/* --- hücreden çıkınca: doğrula, sonra kuyruğa al --- */
function donanimIzgaraHucreKaydet(el){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const kod = el.dataset.kod, depoId = parseInt(el.dataset.depo, 10);
  const g = window._donanimIzgara?.gruplar?.[kod]; if(!g) return;

  let v = parseInt(el.value, 10);
  if(isNaN(v) || v < 0) v = 0;
  g.gecici = g.gecici || {};
  g.gecici[depoId] = v;

  const alt = _izgAlt(g, depoId);
  let hata = '';
  if(v < alt) hata = `Bu depoda ${alt} adet rezerve var, altına inilemez.`;
  else if(_izgKalan(g) < 0) hata = `Havuzda yeterli cihaz yok — ${Math.abs(_izgKalan(g))} adet fazla.`;

  if(hata){
    delete g.gecici[depoId];
    el.value = _izgKayitli(g, depoId);
    el.classList.toggle('izg-sifir', _izgKayitli(g, depoId)===0);
    _izgFlas(el, false);
    _izgSatirYenile(kod); _izgDip();
    _izgDurum('⚠ ' + hata + ' Değer geri alındı.', 'var(--red)');
    return;
  }
  if(v === _izgKayitli(g, depoId)){       // gerçek değişiklik yok
    delete g.gecici[depoId];
    el.classList.remove('izg-kirli');
    return;
  }
  _izgKuyrukEkle(kod, depoId, el);
}

function _izgKuyrukEkle(kod, depoId, el){
  let q = _izgKuyruk.get(kod);
  if(!q){ q = {timer:null, alanlar:new Map()}; _izgKuyruk.set(kod, q); }
  q.alanlar.set(depoId, el);
  clearTimeout(q.timer);
  q.timer = setTimeout(()=>{ _izgKuyrukYaz(kod); }, IZG_YAZ_GECIKME);
}

async function _izgKuyrukYaz(kod){
  const q = _izgKuyruk.get(kod); if(!q) return;
  _izgKuyruk.delete(kod);
  const g = window._donanimIzgara?.gruplar?.[kod]; if(!g) return;

  const KOLON = 'urun_id,depo_id,kcm_id,depo_adi,malzeme_kodu,aciklama,toplam_adet,rezerve_adet,on_rezerve_adet,aktif,tum_kcm';
  const hatalar = [], yazilan = [];

  for(const [depoId, el] of q.alanlar){
    const adet = g.gecici ? g.gecici[depoId] : undefined;
    if(adet === undefined) continue;
    const depo  = (window._donanimDepolar||[]).find(d=> d.depo_id === depoId);
    const satir = g.satirlar[depoId] || null;
    const alt   = _izgAlt(g, depoId);
    try{
      if(satir){
        if(adet === 0 && alt === 0){
          const {error} = await sb.from('stok_urunleri').delete().eq('urun_id', satir.urun_id);
          if(error) throw new Error(error.message);
          delete g.satirlar[depoId];
        }else{
          const {error} = await sb.from('stok_urunleri')
            .update({toplam_adet:adet, updated_at:new Date().toISOString()})
            .eq('urun_id', satir.urun_id);
          if(error) throw new Error(error.message);
          satir.toplam_adet = adet;
        }
      }else if(adet > 0){
        const {data, error} = await sb.from('stok_urunleri').insert({
          depo_id: depoId,
          kcm_id:  depo ? depo.kcm_id : null,
          depo_adi: depo ? depo.depo_adi : null,
          malzeme_kodu: kod,
          aciklama: g.aciklama || kod,
          toplam_adet: adet, rezerve_adet: 0, on_rezerve_adet: 0,
          aktif: !!g.aktif, tum_kcm: !!g.tum_kcm
        }).select(KOLON).single();
        if(error) throw new Error(error.message);
        if(data) g.satirlar[depoId] = data;
      }
      delete g.gecici[depoId];
      yazilan.push(`${depo?_depoAd(depo):('#'+depoId)}=${adet}`);
      if(el && el.isConnected) _izgFlas(el, true);
    }catch(e){
      delete g.gecici[depoId];
      hatalar.push(`${depo?_depoAd(depo):('#'+depoId)}: ${e.message}`);
      if(el && el.isConnected){
        el.value = _izgKayitli(g, depoId);
        el.classList.toggle('izg-sifir', _izgKayitli(g, depoId)===0);
        _izgFlas(el, false);
      }
    }
  }

  if(yazilan.length){
    try{
      await sb.from('stok_hareketleri').insert({
        urun_id: g.merkez ? g.merkez.urun_id : null,
        aksiyon: 'Depo Dağıtımı',
        detay: `${g.aciklama||kod} — ${yazilan.join(', ')}`,
        user_id: currentUser.my_id,
        user_ad: currentUser.ad_soyad || String(currentUser.my_id)
      });
    }catch(e){ console.warn('[donanim] dağıtım log hatası:', e.message); }
  }

  _izgSatirYenile(kod); _izgDip(); _izgKartlariTazele();
  if(hatalar.length){
    console.error('[donanim] ızgara yazma hataları:', hatalar);
    _izgDurum('⚠ Kaydedilemedi — ' + hatalar[0], 'var(--red)');
  }else if(yazilan.length){
    const saat = new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    _izgDurum(`✓ ${(g.aciklama||kod).slice(0,34)} kaydedildi · ${saat}`, 'var(--green)');
  }
}

/* --- depo özet şeridi --- */
function _izgKartlariTazele(){
  const I = window._donanimIzgara; if(!I) return;
  const ozet = {};
  (window._donanimDepolar||[]).forEach(d=>{ ozet[d.depo_id] = {urun:0, adet:0}; });
  Object.keys(I.gruplar).forEach(k=>{
    const g = I.gruplar[k];
    Object.keys(g.satirlar).forEach(id=>{
      const a = g.satirlar[id].toplam_adet||0;
      if(!ozet[id]) ozet[id] = {urun:0, adet:0};
      if(a > 0){ ozet[id].urun++; ozet[id].adet += a; }
    });
  });
  I.ozet = ozet;
  const el = document.getElementById('donanimDepoKartlari');
  if(el) el.innerHTML = _donanimDepoKartlari(ozet);
}

/* --- yükseklik: ızgara ekranın altına kadar uzar, başlık asla kaçmaz --- */
function _donanimIzgaraYukseklik(){
  const kutu = document.getElementById('donanimIzgaraKutu');
  if(!kutu || kutu.offsetParent === null) return;
  const ust = kutu.getBoundingClientRect().top;
  const h = Math.max(220, Math.round(window.innerHeight - ust - 78));
  kutu.style.maxHeight = h + 'px';
}
window.addEventListener('resize', _donanimIzgaraYukseklik);

let _izgAraT = null;
function donanimIzgaraAraDebounce(){
  clearTimeout(_izgAraT);
  _izgAraT = setTimeout(donanimIzgaraFiltreDegisti, 250);
}
function donanimIzgaraFiltreDegisti(){
  _donanimIzgaraCiz();
  _donanimIzgaraYukseklik();
}

// Excel: rapor modalının veri yapısını ve indirme fonksiyonunu aynen kullanır
function donanimIzgaraExcel(){
  const bos = document.getElementById('donanimIzgaraBos');
  const eski = document.getElementById('donanimRaporBosGoster');
  if(eski && bos) eski.checked = bos.checked;
  donanimRaporExcelIndir();
}

/* ============================================================
   DEPO STOK RAPORU (V31.56)
   ------------------------------------------------------------
   Pivot: satır = ürün, kolon = depo, hücre = o depodaki ADET.
   Rezerve / müsait kırılımı ekranda değil, Excel'in 'Detay'
   sayfasındadır (karar: A — pivot tek sayı gösterir).
   IMEI hiçbir sayfada yer almaz; rapor tamamen adet bazlıdır.
   ============================================================ */

window._donanimRapor = window._donanimRapor || null;

// Pivot veri kümesini kurar. Kaynak: depolar_v + stok_urunleri (depo_id dolu satırlar)
function _donanimRaporVeri(satirlar){
  const depolar = (window._donanimDepolar||[]).slice();
  const merkez  = _depoMerkez();

  const gruplar = {};
  satirlar.forEach(s=>{
    const k = s.malzeme_kodu || ('#'+s.urun_id);
    if(!gruplar[k]){
      gruplar[k] = {kod:k, ad:'', hucre:{}, satir:{}, toplam:0,
                    rezerve:0, onRezerve:0, tum_kcm:false, aktif:true};
    }
    const g = gruplar[k];
    g.hucre[s.depo_id] = (g.hucre[s.depo_id]||0) + (s.toplam_adet||0);
    g.satir[s.depo_id] = s;
    g.toplam    += (s.toplam_adet||0);
    g.rezerve   += (s.rezerve_adet||0);
    g.onRezerve += (s.on_rezerve_adet||0);
    if(merkez && s.depo_id === merkez.depo_id){
      g.tum_kcm = !!s.tum_kcm; g.aktif = !!s.aktif;
      if(s.aciklama) g.ad = s.aciklama;
    }
    if(!g.ad) g.ad = s.aciklama || '';
  });

  // V31.123: Merkez (Havuz) hücresi/toplamı ham toplam_adet yerine gerçek
  // kalan (havuz - dağıtılan) ile hesaplanır — aksi halde dağıtılan miktar
  // hem Merkez sütununda hem hedef KÇM sütununda sayılıp satır/GENEL TOPLAM
  // şişer (bkz. _izgKalan, _donanimIzgaraVeri).
  const merkezIdRapor = merkez ? merkez.depo_id : null;
  if(merkezIdRapor!==null){
    Object.values(gruplar).forEach(g=>{
      if(g.hucre[merkezIdRapor] === undefined) return;
      const ham = g.hucre[merkezIdRapor]||0;
      const dagitilan = Object.keys(g.hucre)
        .filter(id=>Number(id)!==merkezIdRapor)
        .reduce((t,id)=> t + (g.hucre[id]||0), 0);
      const kalan = ham - dagitilan;
      g.toplam -= (ham - kalan);
      g.hucre[merkezIdRapor] = kalan;
    });
  }

  const liste = Object.values(gruplar)
    .sort((a,b)=> (a.ad||a.kod).localeCompare(b.ad||b.kod,'tr'));

  const depoToplam = {}, depoUrun = {};
  depolar.forEach(d=>{ depoToplam[d.depo_id]=0; depoUrun[d.depo_id]=0; });
  liste.forEach(g=>{
    depolar.forEach(d=>{
      const v = g.hucre[d.depo_id]||0;
      depoToplam[d.depo_id] += v;
      if(v>0) depoUrun[d.depo_id]++;
    });
  });

  return {depolar, liste, depoToplam, depoUrun, merkez,
          genelToplam: liste.reduce((t,g)=> t+g.toplam, 0)};
}

async function donanimRaporAc(){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const govde = document.getElementById('donanimRaporGovde');
  if(govde) govde.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  openModal('donanimRaporModal');
  try{
    await _donanimDepolarYukle(true);
    const satirlar = await _donanimDepoSatirlariYukle();
    window._donanimRapor = _donanimRaporVeri(satirlar);
    _donanimRaporRender();
  }catch(err){
    console.error(err);
    if(govde) govde.innerHTML = `<div style="padding:16px;color:var(--red);font-size:13px;">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

function _donanimRaporRender(){
  const R = window._donanimRapor;
  const govde = document.getElementById('donanimRaporGovde');
  if(!R || !govde) return;

  const bosGoster = !!document.getElementById('donanimRaporBosGoster')?.checked;
  const liste = bosGoster ? R.liste : R.liste.filter(g=> g.toplam > 0);

  if(!liste.length){
    govde.innerHTML = '<div style="padding:16px;color:var(--text2);font-size:13px;">Gösterilecek kayıt yok.</div>';
    return;
  }

  const hd = R.depolar.map(d=>
    `<th style="padding:6px 8px;text-align:center;white-space:nowrap;border-bottom:1px solid var(--border);font-size:11px;">${escapeHTML(_depoAd(d))}</th>`).join('');

  const govdeSatir = liste.map(g=>{
    const hucreler = R.depolar.map(d=>{
      const v = g.hucre[d.depo_id]||0;
      return `<td style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);${v?'':'color:var(--text3);'}">${v}</td>`;
    }).join('');
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid var(--border);min-width:200px;">
        <div style="font-size:12px;font-weight:600;">${escapeHTML(g.ad||g.kod)}</div>
        <div style="font-size:10px;color:var(--text3);">${escapeHTML(g.kod)}${g.tum_kcm?' · ortak':''}${g.aktif?'':' · pasif'}</div>
      </td>
      ${hucreler}
      <td style="padding:6px 8px;text-align:center;font-weight:800;border-bottom:1px solid var(--border);">${g.toplam}</td>
    </tr>`;
  }).join('');

  const altSatir = R.depolar.map(d=>
    `<td style="padding:8px;text-align:center;font-weight:800;">${R.depoToplam[d.depo_id]||0}</td>`).join('');

  govde.innerHTML = `
    <div style="font-size:12px;color:var(--text2);margin-bottom:8px;">
      ${liste.length} ürün · ${R.depolar.length} depo · toplam
      <b style="color:var(--text);">${R.genelToplam}</b> cihaz
    </div>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:var(--navy3);">
          <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border);font-size:11px;">Ürün</th>
          ${hd}
          <th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:11px;">TOPLAM</th>
        </tr></thead>
        <tbody>${govdeSatir}</tbody>
        <tfoot><tr style="background:var(--navy3);">
          <td style="padding:8px;font-weight:800;">TOPLAM</td>
          ${altSatir}
          <td style="padding:8px;text-align:center;font-weight:800;">${R.genelToplam}</td>
        </tr></tfoot>
      </table>
    </div>`;
}

function donanimRaporBosDegisti(){ _donanimRaporRender(); }

// 3 sayfalık .xlsx: Ozet (pivot) · Detay (kırılım) · Depo Ozet
function donanimRaporExcelIndir(){
  const R = window._donanimRapor;
  if(!R || !R.liste.length){ toast('İndirilecek rapor yok','error'); return; }
  const bosGoster = !!document.getElementById('donanimRaporBosGoster')?.checked;
  const liste = bosGoster ? R.liste : R.liste.filter(g=> g.toplam > 0);
  if(!liste.length){ toast('İndirilecek rapor yok','error'); return; }

  const depoAdlari = R.depolar.map(d=> _depoAd(d));

  // --- Sayfa 1: Ozet (pivot) ---
  const ozet = [['Ürün','Malzeme Kodu', ...depoAdlari, 'TOPLAM']];
  liste.forEach(g=>{
    ozet.push([ g.ad||g.kod, g.kod,
                ...R.depolar.map(d=> g.hucre[d.depo_id]||0),
                g.toplam ]);
  });
  ozet.push(['TOPLAM','', ...R.depolar.map(d=> R.depoToplam[d.depo_id]||0), R.genelToplam]);
  const wsOzet = XLSX.utils.aoa_to_sheet(ozet);
  wsOzet['!cols'] = [{wch:46},{wch:26}, ...depoAdlari.map(a=>({wch:Math.max(10, a.length+2)})), {wch:10}];

  // --- Sayfa 2: Detay ---
  const detay = [['Depo','KÇM','Depo Tipi','Ürün','Malzeme Kodu',
                  'Toplam','Rezerve','Ön Rezerve','Müsait','Ortak Stok','Aktif']];
  R.depolar.forEach(d=>{
    liste.forEach(g=>{
      const s = g.satir[d.depo_id];
      if(!s) return;
      const toplam = s.toplam_adet||0, rez = s.rezerve_adet||0, onRez = s.on_rezerve_adet||0;
      detay.push([ _depoAd(d), d.kcm_adi||'—', d.tip, g.ad||g.kod, g.kod,
                   toplam, rez, onRez, toplam-rez,
                   s.tum_kcm?'Evet':'Hayır', s.aktif?'Evet':'Hayır' ]);
    });
  });
  const wsDetay = XLSX.utils.aoa_to_sheet(detay);
  wsDetay['!cols'] = [{wch:26},{wch:20},{wch:10},{wch:46},{wch:26},
                      {wch:9},{wch:9},{wch:12},{wch:9},{wch:11},{wch:8}];

  // --- Sayfa 3: Depo Ozet ---
  const depoOzet = [['Depo','KÇM','Tip','Ürün Sayısı','Cihaz Sayısı']];
  R.depolar.forEach(d=>{
    depoOzet.push([ _depoAd(d), d.kcm_adi||'—', d.tip,
                    R.depoUrun[d.depo_id]||0, R.depoToplam[d.depo_id]||0 ]);
  });
  depoOzet.push(['TOPLAM','','', '', R.genelToplam]);
  const wsDepo = XLSX.utils.aoa_to_sheet(depoOzet);
  wsDepo['!cols'] = [{wch:26},{wch:20},{wch:8},{wch:13},{wch:14}];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOzet,  'Ozet');
  XLSX.utils.book_append_sheet(wb, wsDetay, 'Detay');
  XLSX.utils.book_append_sheet(wb, wsDepo,  'Depo Ozet');

  const tarih = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `depo_stok_raporu_${tarih}.xlsx`);
  toast('Rapor indirildi','success');
}

/* ============================================================
   DEPO ÇÖZÜMLEMESİ + TEDARİK TALEBİ (V31.57)
   ------------------------------------------------------------
   MY/FMY artık kendi KÇM'sinin ANA deposunu görür (kcm_id değil,
   depo_id bazlı kapsam). Stokta olmayan ürün "Sadece stokta olanlar"
   anahtarı kapatılınca listelenir ve TALEP EDİLEBİLİR.

   Talep kaydı: stok_tedarik_talepleri
     durum: 'Talep Edildi' -> 'Karşılandı' | 'Reddedildi'
     ncst ZORUNLU (müşteri seçimi), adet ZORUNLU (CHECK adet > 0)
   IMEI bu akışın hiçbir yerinde görünmez.
   ============================================================ */

window._donanimDepoCache = window._donanimDepoCache || null;
window._donanimTalepSepet = window._donanimTalepSepet || {items:[], musteri:null};

// depolar_v -> {merkez: depo_id, kcm: {kcm_id: depo_id}} (yalnız ANA depolar)
async function _donanimDepoHaritasi(){
  if(window._donanimDepoCache) return window._donanimDepoCache;
  const {data,error} = await sb.from('depolar_v').select('depo_id,kcm_id,tip,aktif').eq('aktif',true);
  if(error){ console.error('[donanim] depolar_v okunamadı:', error.message); return {merkez:null, kcm:{}}; }
  const harita = {merkez:null, kcm:{}, cep:{}};
  (data||[]).forEach(d=>{
    if(d.tip === 'CEP'){ harita.cep[d.depo_id] = true; return; }   // V31.61
    if(d.tip !== 'ANA') return;
    if(d.kcm_id === null) harita.merkez = d.depo_id;
    else harita.kcm[d.kcm_id] = d.depo_id;
  });
  window._donanimDepoCache = harita;
  return harita;
}
async function _donanimAnaDepoId(kcmId){
  if(!kcmId) return null;
  const h = await _donanimDepoHaritasi();
  return h.kcm[kcmId] || null;
}
async function _donanimMerkezDepoId(){
  const h = await _donanimDepoHaritasi();
  return h.merkez || null;
}

/* ---- Talep modalı ---- */

// ============================================================
// V31.98: TALEPLER > YENİ TALEP — ürün seçim ekranı + SEPET
// Stokta (musait_adet<=0) olmayan ürünleri listeler; birine tıklanınca ürün
// window._donanimTalepSepet.items sepetine EKLENİR ve sepet modalı
// (donanimTalepModal) gösterilir. "+ Ürün Ekle" ile tekrar bu seçim ekranına
// dönülüp sepete yeni ürün eklenebilir; sepet tek seferde gönderilir.
// ============================================================
window._donanimTalepUrunSecListesi = [];

// devam=true: mevcut sepeti KORUYARAK tekrar ürün seçim ekranını açar
// ("+ Ürün Ekle"). devam=false/boş: "Yeni Talep" tuşundan çağrılır, sepeti
// sıfırlar (yeni bir talep oturumu başlatır).
async function donanimTalepUrunSecAc(devam){
  if(!hasPerm('donanim_yonet') && !hasPerm('donanim_on_rezerve_et')){ toast('Yetkiniz yok','error'); return; }
  if(!devam){ window._donanimTalepSepet = {items:[], musteri:null}; }
  const listEl = document.getElementById('donanimTalepUrunSecListesi');
  const araEl = document.getElementById('donanimTalepUrunSecAra');
  if(araEl) araEl.value = '';
  if(listEl) listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  openModal('donanimTalepUrunSecModal');

  const {data, error} = await _donanimStokListesiGetir({sadeceStok:false, aramaMetni:''});
  if(error){
    if(listEl) listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error)}</div>`;
    return;
  }
  window._donanimTalepUrunSecListesi = (data||[]).filter(u => (u.musait_adet||0) <= 0);
  _donanimTalepUrunSecRenderla(window._donanimTalepUrunSecListesi);
}

function donanimTalepUrunSecFiltrele(){
  const terim = (document.getElementById('donanimTalepUrunSecAra')?.value||'').trim().toLowerCase();
  const tumu = window._donanimTalepUrunSecListesi||[];
  if(!terim){ _donanimTalepUrunSecRenderla(tumu); return; }
  const filtreli = tumu.filter(u=>{
    const metin = [u.aciklama, u.malzeme_kodu, u.marka, u.model].filter(Boolean).join(' ').toLowerCase();
    return metin.includes(terim);
  });
  _donanimTalepUrunSecRenderla(filtreli);
}

function _donanimTalepUrunSecRenderla(list){
  const listEl = document.getElementById('donanimTalepUrunSecListesi');
  if(!listEl) return;
  if(!list.length){ listEl.innerHTML = '<div class="empty">Stokta olmayan ürün bulunamadı.</div>'; return; }
  listEl.innerHTML = list.map(u=>{
    const baslik = u.aciklama || [u.marka,u.model,u.renk,u.gb_hafiza].filter(Boolean).join(' ') || 'İsimsiz ürün';
    return `<div class="visit-card" style="margin-bottom:8px;cursor:pointer;" onclick='_donanimTalepUrunSecSecildi(${u.urun_id})'>
      <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHTML(baslik)}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px;">${u.malzeme_kodu?'Kod: '+escapeHTML(u.malzeme_kodu):''}</div>
    </div>`;
  }).join('');
}

function _donanimTalepUrunSecSecildi(urunId){
  const u = (window._donanimTalepUrunSecListesi||[]).find(x=>x.urun_id===urunId);
  if(!u){ toast('Ürün bulunamadı','error'); return; }
  closeModal('donanimTalepUrunSecModal');
  donanimTalepModalAc(urunId, u);
}

// V31.98: `urunObj` opsiyonel — Talepler > Yeni Talep ekranı, kendi ayrı (stokta
// olmayan ürünler) listesinden ürün nesnesini doğrudan geçirir; verilmezse eskisi
// gibi window._donanimList içinden aranır (Stok sekmesindeki tekli "🛒 Talep Et"
// kartı için). Artık tek-ürün modalı AÇMIYOR — ürünü sepete EKLEYİP sepet
// modalını gösteriyor; aynı fonksiyon her iki giriş noktasından da çağrılır.
function donanimTalepModalAc(urunId, urunObj){
  // Depo & Muhasebe (donanim_yonet), Talepler ekranındaki "Yeni Talep" ile de
  // buraya girebiliyor — izin buna göre genişletildi.
  if(!hasPerm('donanim_on_rezerve_et') && !hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  const u = urunObj || (window._donanimList||[]).find(x=> x.urun_id === urunId);
  if(!u){ toast('Ürün bulunamadı','error'); return; }
  if(!window._donanimTalepSepet) window._donanimTalepSepet = {items:[], musteri:null};
  const mevcut = window._donanimTalepSepet.items.find(x=>x.urun_id===urunId);
  if(mevcut){
    mevcut.adet = (mevcut.adet||1) + 1;
  } else {
    window._donanimTalepSepet.items.push({
      urun_id: urunId,
      ad: u.aciklama || u.malzeme_kodu || 'İsimsiz ürün',
      kod: u.malzeme_kodu || '',
      adet: 1
    });
  }
  donanimTalepSepetGoster();
}

// Sepeti modal içinde render edip modalı açar/günceller. Müşteri seçimi
// sepette kalıcı olduğundan (window._donanimTalepSepet.musteri) tekrar
// açılışta korunur ve arayüzde yeniden gösterilir.
function donanimTalepSepetGoster(){
  _donanimTalepSepetRenderla();
  const sec = document.getElementById('donanimTalepMusteriSecili');
  const c = window._donanimTalepSepet.musteri;
  if(sec){
    if(c){
      sec.classList.remove('hide');
      sec.innerHTML = `✓ <b>${escapeHTML(c.unvan||c.ncst)}</b> (NCST: ${escapeHTML(c.ncst)}) <a href="#" onclick="event.preventDefault();donanimTalepMusteriTemizle()" style="color:var(--red);margin-left:8px;">✕</a>`;
    } else {
      sec.classList.add('hide');
      sec.innerHTML = '';
    }
  }
  const ara = document.getElementById('donanimTalepMusteriArama'); if(ara) ara.value = '';
  const son = document.getElementById('donanimTalepMusteriSonuc'); if(son) son.innerHTML = '';
  openModal('donanimTalepModal');
}

function _donanimTalepSepetRenderla(){
  const el = document.getElementById('donanimTalepSepetListesi');
  if(!el) return;
  const items = (window._donanimTalepSepet && window._donanimTalepSepet.items) || [];
  if(!items.length){
    el.innerHTML = '<div class="empty" style="padding:10px 0;">Sepet boş — ürün ekleyin.</div>';
    return;
  }
  el.innerHTML = items.map(it=>`
    <div style="background:var(--navy3);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;line-height:1.3;">${escapeHTML(it.ad)}</div>
        ${it.kod?`<div style="font-size:11px;color:var(--text3);">Kod: ${escapeHTML(it.kod)}</div>`:''}
      </div>
      <input type="number" min="1" step="1" value="${it.adet}" style="width:56px;background:var(--navy2);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px;font-size:13px;text-align:center;" onchange="_donanimTalepSepetAdetGuncelle(${it.urun_id}, this.value)">
      <a href="#" onclick="event.preventDefault();_donanimTalepSepetUrunSil(${it.urun_id})" style="color:var(--red);font-size:16px;padding:4px;">✕</a>
    </div>`).join('');
}

function _donanimTalepSepetAdetGuncelle(urunId, val){
  const it = (window._donanimTalepSepet.items||[]).find(x=>x.urun_id===urunId);
  if(it) it.adet = Math.max(1, parseInt(val)||1);
}

function _donanimTalepSepetUrunSil(urunId){
  window._donanimTalepSepet.items = (window._donanimTalepSepet.items||[]).filter(x=>x.urun_id!==urunId);
  _donanimTalepSepetRenderla();
}

let _donanimTalepAraTimer = null;
function donanimTalepMusteriAramaDebounce(){
  clearTimeout(_donanimTalepAraTimer);
  _donanimTalepAraTimer = setTimeout(_donanimTalepMusteriAra, 300);
}

async function _donanimTalepMusteriAra(){
  const terim = (document.getElementById('donanimTalepMusteriArama')?.value||'').trim();
  const sonucEl = document.getElementById('donanimTalepMusteriSonuc');
  if(!sonucEl) return;
  if(terim.length < 2){ sonucEl.innerHTML=''; return; }
  let q = getCustomerBaseQuery(true); // forForm=true: KÇM kapsamı, portföy dışına da erişim
  q = q.or(`unvan.ilike.%${terim}%,ncst.ilike.%${terim}%`).limit(8);
  const {data,error} = await q;
  if(error){ sonucEl.innerHTML = `<div style="font-size:12px;color:var(--red);padding:6px;">Hata: ${escapeHTML(error.message)}</div>`; return; }
  sonucEl.innerHTML = (data||[]).map(c=>`
    <div class="visit-card" style="padding:8px;margin-bottom:4px;cursor:pointer;" onclick='donanimTalepMusteriSec(${JSON.stringify(c)})'>
      <div style="font-size:13px;font-weight:700;">${escapeHTML(c.unvan||c.ncst)}</div>
      <div style="font-size:11px;color:var(--text3);">NCST: ${escapeHTML(c.ncst)}</div>
    </div>`).join('') || '<div style="font-size:12px;color:var(--text3);padding:6px;">Sonuç yok</div>';
}

function donanimTalepMusteriSec(c){
  if(!window._donanimTalepSepet) window._donanimTalepSepet = {items:[], musteri:null};
  window._donanimTalepSepet.musteri = c;
  const son = document.getElementById('donanimTalepMusteriSonuc'); if(son) son.innerHTML='';
  const ara = document.getElementById('donanimTalepMusteriArama'); if(ara) ara.value='';
  const el = document.getElementById('donanimTalepMusteriSecili');
  if(el){
    el.classList.remove('hide');
    el.innerHTML = `✓ <b>${escapeHTML(c.unvan||c.ncst)}</b> (NCST: ${escapeHTML(c.ncst)}) <a href="#" onclick="event.preventDefault();donanimTalepMusteriTemizle()" style="color:var(--red);margin-left:8px;">✕</a>`;
  }
}

function donanimTalepMusteriTemizle(){
  if(window._donanimTalepSepet) window._donanimTalepSepet.musteri = null;
  const el = document.getElementById('donanimTalepMusteriSecili');
  if(el) el.classList.add('hide');
}

async function donanimTalepGonder(){
  const S = window._donanimTalepSepet;
  if(!S || !S.items || !S.items.length){ toast('Sepette ürün yok','error'); return; }
  // V31.98: bkz. donanimTalepModalAc — aynı genişletilmiş yetki kontrolü.
  if(!hasPerm('donanim_on_rezerve_et') && !hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }
  if(!S.musteri){ toast('Müşteri seçin (zorunlu)','error'); return; }
  for(const it of S.items){
    if(!it.adet || it.adet < 1){ toast(`"${it.ad}" için geçerli adet girin`,'error'); return; }
  }
  const not = (document.getElementById('donanimTalepNot')?.value||'').trim();

  const btn = document.getElementById('donanimTalepGonderBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Gönderiliyor...'; }

  for(const it of S.items){
    const {error} = await sb.from('stok_tedarik_talepleri').insert({
      urun_id: it.urun_id,
      kcm_id: currentUser.kcm_id || null,
      talep_eden_id: currentUser.my_id,
      ncst: S.musteri.ncst,
      musteri_unvani: S.musteri.unvan || null,
      adet: it.adet,
      durum: 'Talep Edildi',
      aciklama: not || null
    });
    if(error){
      if(btn){ btn.disabled = false; btn.textContent = 'Talebi Gönder'; }
      toast(`"${it.ad}" için talep gönderilemedi: `+error.message,'error');
      return;
    }
    const {error:logErr} = await sb.from('stok_hareketleri').insert({
      urun_id: it.urun_id,
      aksiyon: 'Tedarik Talebi',
      detay: `${it.adet} adet — ${it.ad} · ${S.musteri.unvan || S.musteri.ncst}`,
      user_id: currentUser.my_id,
      user_ad: currentUser.ad_soyad || String(currentUser.my_id)
    });
    if(logErr) console.error('[donanim] talep log hatası:', logErr.message);
  }

  if(btn){ btn.disabled = false; btn.textContent = 'Talebi Gönder'; }
  toast('Tedarik talebi gönderildi','success');
  closeModal('donanimTalepModal');
  window._donanimTalepSepet = {items:[], musteri:null};
  _donanimTalepBadge();
}

/* ---- Talep listesi ---- */

const DONANIM_TALEP_RENK = {
  'Talep Edildi': 'var(--amber)',
  'Karşılandı':   'var(--green)',
  'Reddedildi':   'var(--red)'
};

async function loadDonanimTalepListesi(){
  const listEl = document.getElementById('donanimTalepListesi');
  if(!listEl) return;
  listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const yonet = hasPerm('donanim_yonet');
  try{
    let q = sb.from('stok_tedarik_talepleri').select('*')
              .order('created_at',{ascending:false}).limit(500);
    if(!yonet) q = q.eq('talep_eden_id', currentUser.my_id);
    const {data, error} = await q;
    if(error) throw new Error(error.message);
    const talepler = data||[];
    if(!talepler.length){
      listEl.innerHTML = '<div class="empty">Tedarik talebi yok.</div>';
      return;
    }

    // Ürün adları
    const urunIdler = [...new Set(talepler.map(t=>t.urun_id).filter(Boolean))];
    const urunMap = {};
    for(let i=0;i<urunIdler.length;i+=200){
      const {data:us} = await sb.from('stok_urunleri')
        .select('urun_id,aciklama,malzeme_kodu').in('urun_id', urunIdler.slice(i,i+200));
      (us||[]).forEach(u=>{ urunMap[u.urun_id]=u; });
    }
    // Kullanıcı adları
    const kisiIdler = [...new Set(talepler.flatMap(t=>[t.talep_eden_id,t.karsilayan_id]).filter(Boolean))];
    const kisiMap = {};
    for(let i=0;i<kisiIdler.length;i+=200){
      const {data:ks} = await sb.from('users')
        .select('my_id,ad_soyad').in('my_id', kisiIdler.slice(i,i+200));
      (ks||[]).forEach(k=>{ kisiMap[k.my_id]=k.ad_soyad; });
    }

    listEl.innerHTML = talepler.map(t=>{
      const u = urunMap[t.urun_id] || {};
      const ad = u.aciklama || u.malzeme_kodu || ('Ürün #'+t.urun_id);
      const renk = DONANIM_TALEP_RENK[t.durum] || 'var(--text3)';
      const acik = (t.durum === 'Talep Edildi');
      const tarih = (typeof fmtDate==='function' && t.created_at) ? fmtDate(t.created_at)
                    : (t.created_at ? String(t.created_at).slice(0,10) : '—');
      return `<div class="visit-card" style="margin-bottom:8px;border-left:3px solid ${renk};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;line-height:1.3;">${escapeHTML(ad)}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:3px;">
              ${escapeHTML(t.musteri_unvani || t.ncst)} · NCST: ${escapeHTML(t.ncst)}
            </div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${renk};white-space:nowrap;">${escapeHTML(t.durum)}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:6px;">
          <b style="color:var(--text);">${t.adet}</b> adet ·
          ${escapeHTML(kisiMap[t.talep_eden_id] || ('MY#'+t.talep_eden_id))} · ${escapeHTML(tarih)}
          ${t.karsilayan_id?` · karşılayan: ${escapeHTML(kisiMap[t.karsilayan_id]||('#'+t.karsilayan_id))}`:''}
        </div>
        ${t.aciklama?`<div style="font-size:12px;color:var(--text2);margin-top:4px;">Not: ${escapeHTML(t.aciklama)}</div>`:''}
        ${(yonet && acik)?`
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="donanimTalepDurum(${t.talep_id},'Karşılandı')">✓ Karşılandı</button>
          <button class="btn btn-sm" style="flex:1;background:#000;border:2px solid var(--red);color:var(--red);" onclick="donanimTalepDurum(${t.talep_id},'Reddedildi')">✕ Reddet</button>
        </div>`:''}
      </div>`;
    }).join('');
  }catch(err){
    console.error(err);
    listEl.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;
  }
}

// V31.132: "Karşılandı" işaretlenmeden ÖNCE gerçekten karşılanmış mı diye
// doğrulanıyor — cihazlar pahalı, bu buton önceden sadece durum yazısını
// değiştiriyordu, arkasında hiçbir stok kontrolü yoktu. Artık iki şart aranır:
//  (1) Talep eden KÇM'nin ANA deposunda bu ürün için gerçekten yeterli müsait
//      adet var mı (KÇM'ler arası transfer veya yeni stok girişiyle karşılanmış
//      olmalı — hiçbiri yapılmadan buton sadece durumu değiştiremez).
//  (2) Bu ürün için sistem geneli mutabakat (SUM(toplam_adet) = IMEI sayısı)
//      bozuk mu — bozuksa (dışarıdan adet girilmiş ama IMEI girilmemiş), önce
//      o düzeltilmeden talep kapatılamaz.
async function donanimTalepDurum(talepId, yeniDurum){
  if(!hasPerm('donanim_yonet')){ toast('Yetkiniz yok','error'); return; }

  if(yeniDurum === 'Karşılandı'){
    const {data:talep, error:tErr} = await sb.from('stok_tedarik_talepleri').select('*').eq('talep_id', talepId).single();
    if(tErr || !talep){ toast('Talep bulunamadı','error'); return; }
    const {data:urun} = await sb.from('stok_urunleri').select('malzeme_kodu,aciklama').eq('urun_id', talep.urun_id).maybeSingle();
    const malzemeKodu = urun?.malzeme_kodu;
    const urunAd = urun?.aciklama || ('Ürün #'+talep.urun_id);

    // Şart 1: talep eden KÇM'nin ANA deposunda gerçekten yeterli müsait adet var mı?
    const depoId = await _donanimAnaDepoId(talep.kcm_id);
    let musaitAdet = 0;
    if(depoId && malzemeKodu){
      const {data:kcmSatir} = await sb.from('stok_urunleri').select('toplam_adet,rezerve_adet,on_rezerve_adet')
        .eq('depo_id', depoId).eq('malzeme_kodu', malzemeKodu).maybeSingle();
      if(kcmSatir) musaitAdet = (kcmSatir.toplam_adet||0) - (kcmSatir.rezerve_adet||0) - (kcmSatir.on_rezerve_adet||0);
    }
    if(musaitAdet < talep.adet){
      toast(`Karşılanamaz: "${urunAd}" için KÇM'nin deposunda yeterli stok yok (gerekli ${talep.adet}, mevcut ${musaitAdet}). Önce stok girişi veya transfer yapın.`, 'error');
      return;
    }

    // Şart 2: bu ürün için sistem geneli mutabakat bozuk mu?
    if(malzemeKodu){
      const m = await _donanimMutabakatGetir(malzemeKodu);
      if(Number(m.fark) !== 0){
        toast(`Karşılanamaz: "${urunAd}" için sistem/IMEI mutabakatı bozuk (sistem ${m.sistem_adet}, IMEI ${m.imei_adet}, fark ${m.fark}). Önce Mutabakat Raporu'ndan bu ürünü düzeltin.`, 'error');
        return;
      }
    }
  }

  const yama = {durum: yeniDurum, updated_at: new Date().toISOString()};
  if(yeniDurum === 'Karşılandı' || yeniDurum === 'Reddedildi'){
    yama.karsilayan_id = currentUser.my_id;
    yama.karsilanma_tarihi = new Date().toISOString();
  }
  const {error} = await sb.from('stok_tedarik_talepleri').update(yama).eq('talep_id', talepId);
  if(error){ toast('Güncellenemedi: '+error.message,'error'); return; }
  toast('Talep durumu: '+yeniDurum,'success');
  loadDonanimTalepListesi();
  _donanimTalepBadge();
}

// V31.132: Mutabakat Raporu — sistemdeki toplam adet (SUM(toplam_adet), tüm
// KÇM'ler) ile kayıtlı IMEI sayısı (stok_seri_no, 'Depoda'+'Ayrıldı') her ürün
// için karşılaştırılır. Cihazlar pahalı ve KÇM depoları tamamen sanal (hepsi
// fiziksel olarak aynı dolapta) olduğundan bu iki sayı HER ZAMAN eşit olmalı;
// aksi halde bir yerde adet, IMEI girişi yapılmadan artırılmış demektir.
async function openDonanimMutabakat(){
  if(!hasPerm('donanim_mutabakat_gor')){ toast('Yetkiniz yok','error'); return; }
  const icerik = document.getElementById('donanimMutabakatIcerik');
  icerik.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  openModal('donanimMutabakatModal');

  const {data, error} = await sb.from('stok_mutabakat_v').select('*');
  if(error){ icerik.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  if(!data || !data.length){ icerik.innerHTML = '<div class="empty">Kayıt yok.</div>'; return; }
  window._donanimMutabakatListe = data;

  const sorunlu = data.filter(r=>Number(r.fark)!==0);
  const temiz = data.filter(r=>Number(r.fark)===0);

  const satir = (r,sorunMu)=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;border-radius:6px;background:var(--navy3);${sorunMu?'border-left:3px solid var(--red);':''}">
    <div style="flex:1;min-width:0;">
      <div style="font-size:12.5px;font-weight:600;">${escapeHTML(r.aciklama||r.malzeme_kodu)}</div>
      <div style="font-size:10.5px;color:var(--text3);">${escapeHTML(r.malzeme_kodu)}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:var(--text3);white-space:nowrap;">
      Sistem: <b style="color:var(--text2);">${r.sistem_adet}</b> · IMEI: <b style="color:var(--text2);">${r.imei_adet}</b>
      ${sorunMu?`<div style="color:var(--red);font-weight:800;font-size:13px;">Fark: ${r.fark>0?'+':''}${r.fark}</div>`:''}
    </div>
  </div>`;

  icerik.innerHTML =
    (sorunlu.length ? `<div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px;">⚠️ ${sorunlu.length} üründe uyuşmazlık var</div>` + sorunlu.map(r=>satir(r,true)).join('') : `<div style="font-size:12px;color:var(--green);font-weight:700;margin-bottom:10px;">✓ Tüm ürünler mutabık — fark yok</div>`) +
    (temiz.length ? `<div style="font-size:11px;color:var(--text3);margin-top:${sorunlu.length?'14px':'0'};margin-bottom:6px;">Mutabık ürünler (${temiz.length})</div>` + temiz.map(r=>satir(r,false)).join('') : '');
}

// V31.135: Mutabakat Raporu'nu Excel'e aktarır (SheetJS — proje genelinde
// zaten kullanılıyor, bkz. donanimExcelRaporIndir / donanimRaporExcelIndir).
function donanimMutabakatExcelIndir(){
  if(typeof window._donanimMutabakatListe === 'undefined' || !window._donanimMutabakatListe || !window._donanimMutabakatListe.length){
    toast('İndirilecek veri yok — önce raporu açın','error'); return;
  }
  const satirlar = window._donanimMutabakatListe.map(r=>({
    'Malzeme Kodu': r.malzeme_kodu, 'Ürün': r.aciklama,
    'Sistem Adedi': r.sistem_adet, 'IMEI Adedi': r.imei_adet, 'Fark': r.fark
  }));
  const ws = XLSX.utils.json_to_sheet(satirlar);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mutabakat');
  const tarih = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `stok_mutabakat_raporu_${tarih}.xlsx`);
}

// V31.132: bir malzeme kodu için sistem/IMEI mutabakatı (tek satır)
async function _donanimMutabakatGetir(malzemeKodu){
  const {data, error} = await sb.from('stok_mutabakat_v').select('*').eq('malzeme_kodu', malzemeKodu).maybeSingle();
  if(error || !data) return {sistem_adet:0, imei_adet:0, fark:0};
  return data;
}

// V31.135: STOK HAREKET RAPORU — stok_hareketleri tablosundaki TÜM kayıtları
// (rezervasyon/transfer/excel yükleme/mutabakat vb. — donanim modülünün her
// yerinde loglanan olaylar) tarih/aksiyon/ürün filtreli listeler, Excel'e
// aktarılabilir. Depo & Muhasebe'nin "hangi cihaza ne oldu" sorusunu tek
// ekrandan, dışarı aktarılabilir şekilde cevaplaması için.
window._donanimHrListe = [];
window._donanimHrFiltreTimer = null;

async function openDonanimHareketRaporu(){
  if(!hasPerm('donanim_hareket_raporu_gor')){ toast('Yetkiniz yok','error'); return; }
  openModal('donanimHareketRaporuModal');
  const bitisEl = document.getElementById('donanimHrBitis');
  const basEl = document.getElementById('donanimHrBaslangic');
  if(bitisEl && !bitisEl.value) bitisEl.value = new Date().toISOString().slice(0,10);
  if(basEl && !basEl.value){
    const otuzGunOnce = new Date(); otuzGunOnce.setDate(otuzGunOnce.getDate()-30);
    basEl.value = otuzGunOnce.toISOString().slice(0,10);
  }
  // Aksiyon tipleri dropdown'u — mevcut kayıtlardan tekilleştirilir (yalnız ilk açılışta)
  const aksiyonSel = document.getElementById('donanimHrAksiyon');
  if(aksiyonSel && aksiyonSel.options.length <= 1){
    const {data:orn} = await sb.from('stok_hareketleri').select('aksiyon').limit(3000);
    const tekil = [...new Set((orn||[]).map(r=>r.aksiyon).filter(Boolean))].sort();
    tekil.forEach(a=>{ const o=document.createElement('option'); o.value=a; o.textContent=a; aksiyonSel.appendChild(o); });
  }
  donanimHareketRaporuFiltrele();
}

function donanimHareketRaporuFiltreDebounce(){
  clearTimeout(window._donanimHrFiltreTimer);
  window._donanimHrFiltreTimer = setTimeout(donanimHareketRaporuFiltrele, 350);
}

async function donanimHareketRaporuFiltrele(){
  const icerik = document.getElementById('donanimHareketRaporuIcerik');
  const ozetEl = document.getElementById('donanimHrOzet');
  if(!icerik) return;
  icerik.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  const bas = document.getElementById('donanimHrBaslangic')?.value;
  const bit = document.getElementById('donanimHrBitis')?.value;
  const aksiyon = document.getElementById('donanimHrAksiyon')?.value;
  const arama = (document.getElementById('donanimHrAra')?.value||'').trim().toLowerCase();

  let q = sb.from('stok_hareketleri').select('*').order('created_at',{ascending:false}).limit(1000);
  if(bas) q = q.gte('created_at', bas+'T00:00:00');
  if(bit) q = q.lte('created_at', bit+'T23:59:59');
  if(aksiyon) q = q.eq('aksiyon', aksiyon);

  const {data, error} = await q;
  if(error){ icerik.innerHTML = `<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(error.message)}</div>`; return; }
  let liste = data||[];

  // Ürün adları — malzeme kodu/açıklama araması için gerekli
  const urunIds = [...new Set(liste.map(r=>r.urun_id).filter(Boolean))];
  const urunMap = {};
  for(let i=0;i<urunIds.length;i+=200){
    const {data:us} = await sb.from('stok_urunleri').select('urun_id,aciklama,malzeme_kodu').in('urun_id', urunIds.slice(i,i+200));
    (us||[]).forEach(u=>{ urunMap[u.urun_id]=u; });
  }
  liste = liste.map(r=>({...r, _urunAd: urunMap[r.urun_id]?.aciklama || (r.urun_id?('Ürün #'+r.urun_id):'—'), _malzemeKodu: urunMap[r.urun_id]?.malzeme_kodu||''}));

  if(arama){
    liste = liste.filter(r=>{
      const metin = [r._urunAd, r._malzemeKodu, r.user_ad, r.detay, r.aksiyon].filter(Boolean).join(' ').toLowerCase();
      return metin.includes(arama);
    });
  }

  window._donanimHrListe = liste;
  if(ozetEl) ozetEl.textContent = `${liste.length} kayıt` + (liste.length>=1000?' (ilk 1000 — daraltmak için filtre kullanın)':'');

  if(!liste.length){ icerik.innerHTML = '<div class="empty">Kayıt bulunamadı.</div>'; return; }

  icerik.innerHTML = liste.map(r=>`
    <div style="padding:7px 9px;margin-bottom:5px;border-radius:6px;background:var(--navy3);border-left:3px solid var(--blue);">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <span style="font-weight:600;font-size:12px;">${escapeHTML(r.aksiyon||'—')}</span>
        <span style="font-size:10.5px;color:var(--text3);white-space:nowrap;">${new Date(r.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</span>
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:2px;">${escapeHTML(r._urunAd)}${r._malzemeKodu?` · ${escapeHTML(r._malzemeKodu)}`:''}</div>
      ${r.detay?`<div style="font-size:11px;color:var(--text3);margin-top:2px;">${escapeHTML(r.detay)}</div>`:''}
      <div style="font-size:10.5px;color:var(--text3);margin-top:2px;">👤 ${escapeHTML(r.user_ad||'—')}</div>
    </div>`).join('');
}

// V31.136: ürün bilgisiyle (marka/model/gb/renk/malzeme kodu/açıklama/fiyat)
// zenginleştirilmiş IMEI listesi — Giriş/Çıkış/Rezerve sayfaları ortak kullanır.
async function _donanimSeriListesiUrunBilgisiyle(seriler){
  const urunIds = [...new Set(seriler.map(s=>s.urun_id).filter(Boolean))];
  const urunMap = {};
  for(let i=0;i<urunIds.length;i+=200){
    const {data:us} = await sb.from('stok_urunleri').select('urun_id,aciklama,marka,model,renk,gb_hafiza,malzeme_kodu,fiyat').in('urun_id', urunIds.slice(i,i+200));
    (us||[]).forEach(u=>{ urunMap[u.urun_id]=u; });
  }
  return seriler.map(s=>({...s, _urun: urunMap[s.urun_id]||{}}));
}

// Marka+Model+GB+Renk kırılımında özet (adet sayımı)
function _donanimOzetGrupla(seriler){
  const grup = {};
  seriler.forEach(s=>{
    const u = s._urun||{};
    const anahtar = [u.marka||'', u.model||'', u.gb_hafiza||'', u.renk||'', u.malzeme_kodu||''].join('|');
    if(!grup[anahtar]) grup[anahtar] = {Marka:u.marka||'', Model:u.model||'', GB:u.gb_hafiza||'', Renk:u.renk||'', 'Malzeme Kodu':u.malzeme_kodu||'', 'Ürün':u.aciklama||'', Adet:0};
    grup[anahtar].Adet++;
  });
  return Object.values(grup).sort((a,b)=>b.Adet-a.Adet);
}

// V31.136: Stok Hareket Raporu artık TEK Excel dosyasında 7 sayfa üretir:
// 1) Stok Hareketleri (ekrandaki filtreli liste, aynen)
// 2-3) Cihaz Giriş — Detay/Özet (tarih aralığındaki stok_seri_no oluşturma kayıtları)
// 4-5) Cihaz Çıkış — Detay/Özet (tarih aralığında 'Satıldı' olan IMEI'ler, müşteri/MY ile)
// 6-7) Rezerve Cihazlar — Detay/Özet (ŞU AN 'Ayrıldı' durumundaki IMEI'ler — canlı anlık durum,
//      tarih filtresine bağlı değil, çünkü "şu anki durum" isteniyor)
async function donanimHareketRaporuExcelIndir(){
  const liste = window._donanimHrListe||[];
  if(!liste.length){ toast('İndirilecek veri yok — önce raporu açın','error'); return; }
  toast('Excel hazırlanıyor, birkaç saniye sürebilir...','info');
  try{

  const bas = document.getElementById('donanimHrBaslangic')?.value;
  const bit = document.getElementById('donanimHrBitis')?.value;

  const wb = XLSX.utils.book_new();

  // 1) Stok Hareketleri — ekranda gösterilen liste aynen
  const hareketSatir = liste.map(r=>({
    'Tarih': r.created_at ? new Date(r.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}) : '',
    'Aksiyon': r.aksiyon||'', 'Ürün': r._urunAd||'', 'Malzeme Kodu': r._malzemeKodu||'',
    'Detay': r.detay||'', 'Kullanıcı': r.user_ad||''
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hareketSatir), 'Stok Hareketleri');

  // 2-3) Cihaz Giriş — stok_seri_no.created_at tarih aralığında olanlar (ilk kayıt = stoğa giriş anı)
  let girisQ = sb.from('stok_seri_no').select('seri_no,urun_id,durum,created_at').order('created_at',{ascending:false}).limit(5000);
  if(bas) girisQ = girisQ.gte('created_at', bas+'T00:00:00');
  if(bit) girisQ = girisQ.lte('created_at', bit+'T23:59:59');
  const {data:girisHam} = await girisQ;
  const giris = await _donanimSeriListesiUrunBilgisiyle(girisHam||[]);
  const girisDetaySatir = giris.map(s=>({
    'Seri/IMEI No': s.seri_no, 'Marka': s._urun.marka||'', 'Model': s._urun.model||'',
    'GB': s._urun.gb_hafiza||'', 'Renk': s._urun.renk||'', 'Malzeme Kodu': s._urun.malzeme_kodu||'',
    'Ürün': s._urun.aciklama||'', 'Stok Giriş Tarihi': s.created_at ? new Date(s.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}) : '',
    'Şu An Durumu': s.durum||''
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(girisDetaySatir), 'Cihaz Giriş - Detay');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(_donanimOzetGrupla(giris)), 'Cihaz Giriş - Özet');

  // 4-5) Cihaz Çıkış — durum='Satıldı', updated_at tarih aralığında (çıkış anı = sevkiyatta Satıldı'ya geçiş)
  let cikisQ = sb.from('stok_seri_no').select('seri_no,urun_id,durum,sepet_id,updated_at').eq('durum','Satıldı').order('updated_at',{ascending:false}).limit(5000);
  if(bas) cikisQ = cikisQ.gte('updated_at', bas+'T00:00:00');
  if(bit) cikisQ = cikisQ.lte('updated_at', bit+'T23:59:59');
  const {data:cikisHam} = await cikisQ;
  const cikis = await _donanimSeriListesiUrunBilgisiyle(cikisHam||[]);
  // sevkedilen cihazların hangi rezervasyona/müşteriye/MY'ye ait olduğu
  const cikisSepetIds = [...new Set(cikis.map(s=>s.sepet_id).filter(Boolean))];
  const cikisRezMap = {};
  for(let i=0;i<cikisSepetIds.length;i+=200){
    const {data:rz} = await sb.from('stok_rezervasyonlari').select('sepet_id,ncst,satan_my_id,kcm_id').in('sepet_id', cikisSepetIds.slice(i,i+200));
    (rz||[]).forEach(r=>{ if(!cikisRezMap[r.sepet_id]) cikisRezMap[r.sepet_id]=r; });
  }
  const cikisMyIds = [...new Set(Object.values(cikisRezMap).map(r=>r.satan_my_id).filter(Boolean))];
  const cikisMyMap = {};
  for(let i=0;i<cikisMyIds.length;i+=200){
    const {data:us} = await sb.from('users').select('my_id,ad_soyad').in('my_id', cikisMyIds.slice(i,i+200));
    (us||[]).forEach(u=>{ cikisMyMap[u.my_id]=u.ad_soyad; });
  }
  const cikisNcstler = [...new Set(Object.values(cikisRezMap).map(r=>r.ncst).filter(Boolean))];
  const cikisMusteriMap = {};
  for(let i=0;i<cikisNcstler.length;i+=200){
    const {data:ms} = await sb.from('customers').select('ncst,unvan').in('ncst', cikisNcstler.slice(i,i+200));
    (ms||[]).forEach(m=>{ cikisMusteriMap[m.ncst]=m.unvan; });
  }
  const cikisDetaySatir = cikis.map(s=>{
    const rz = cikisRezMap[s.sepet_id]||{};
    return {
      'Seri/IMEI No': s.seri_no, 'Marka': s._urun.marka||'', 'Model': s._urun.model||'',
      'GB': s._urun.gb_hafiza||'', 'Renk': s._urun.renk||'', 'Malzeme Kodu': s._urun.malzeme_kodu||'',
      'Ürün': s._urun.aciklama||'', 'Çıkış (Sevk) Tarihi': s.updated_at ? new Date(s.updated_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}) : '',
      'Müşteri': cikisMusteriMap[rz.ncst]||rz.ncst||'', 'Satan MY': cikisMyMap[rz.satan_my_id]||''
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cikisDetaySatir), 'Cihaz Çıkış - Detay');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(_donanimOzetGrupla(cikis)), 'Cihaz Çıkış - Özet');

  // 6-7) Rezerve Cihazlar — ŞU AN 'Ayrıldı' (sevk edilmemiş, sepete bağlı) — canlı anlık durum
  const {data:rezHam} = await sb.from('stok_seri_no').select('seri_no,urun_id,durum,sepet_id,updated_at').eq('durum','Ayrıldı').limit(5000);
  const rez = await _donanimSeriListesiUrunBilgisiyle(rezHam||[]);
  const rezSepetIds = [...new Set(rez.map(s=>s.sepet_id).filter(Boolean))];
  const rezMap = {};
  for(let i=0;i<rezSepetIds.length;i+=200){
    const {data:rz} = await sb.from('stok_rezervasyonlari').select('sepet_id,ncst,satan_my_id,kcm_id,durum').in('sepet_id', rezSepetIds.slice(i,i+200));
    (rz||[]).forEach(r=>{ if(!rezMap[r.sepet_id]) rezMap[r.sepet_id]=r; });
  }
  const rezMyIds = [...new Set(Object.values(rezMap).map(r=>r.satan_my_id).filter(Boolean))];
  const rezKcmIds = [...new Set(Object.values(rezMap).map(r=>r.kcm_id).filter(Boolean))];
  const rezMyMap = {}, rezKcmMap = {};
  for(let i=0;i<rezMyIds.length;i+=200){
    const {data:us} = await sb.from('users').select('my_id,ad_soyad').in('my_id', rezMyIds.slice(i,i+200));
    (us||[]).forEach(u=>{ rezMyMap[u.my_id]=u.ad_soyad; });
  }
  for(let i=0;i<rezKcmIds.length;i+=200){
    const {data:ks} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').in('kcm_id', rezKcmIds.slice(i,i+200));
    (ks||[]).forEach(k=>{ rezKcmMap[k.kcm_id]=k.kcm_adi; });
  }
  const rezNcstler = [...new Set(Object.values(rezMap).map(r=>r.ncst).filter(Boolean))];
  const rezMusteriMap = {};
  for(let i=0;i<rezNcstler.length;i+=200){
    const {data:ms} = await sb.from('customers').select('ncst,unvan').in('ncst', rezNcstler.slice(i,i+200));
    (ms||[]).forEach(m=>{ rezMusteriMap[m.ncst]=m.unvan; });
  }
  const rezDetaySatir = rez.map(s=>{
    const r = rezMap[s.sepet_id]||{};
    return {
      'Seri/IMEI No': s.seri_no, 'Marka': s._urun.marka||'', 'Model': s._urun.model||'',
      'GB': s._urun.gb_hafiza||'', 'Renk': s._urun.renk||'', 'Malzeme Kodu': s._urun.malzeme_kodu||'',
      'KÇM': rezKcmMap[r.kcm_id]||'', 'Satan MY': rezMyMap[r.satan_my_id]||'',
      'Müşteri': rezMusteriMap[r.ncst]||r.ncst||'', 'Süreç Durumu': r.durum||'',
      'Kısa Rezervasyon ID': 'REZ-'+String(s.sepet_id||'').replace(/-/g,'').slice(0,8).toUpperCase()
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rezDetaySatir), 'Rezerve Cihazlar - Detay');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(_donanimOzetGrupla(rez)), 'Rezerve Cihazlar - Özet');

  const tarih = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `stok_hareket_raporu_${tarih}.xlsx`);
  }catch(err){
    console.error('donanimHareketRaporuExcelIndir hata:', err);
    toast('Excel oluşturulurken hata oluştu: '+(err?.message||'bilinmeyen hata'),'error');
  }
}

// Talepler sekmesindeki bekleyen sayısı (yalnız karşılayan rolde anlamlı)
async function _donanimTalepBadge(){
  const btn = document.getElementById('donanimTabTalepBtn');
  if(!btn) return;
  const temel = '📥 Talepler';
  if(!hasPerm('donanim_yonet')){ btn.textContent = temel; return; }
  const {count, error} = await sb.from('stok_tedarik_talepleri')
    .select('*',{count:'exact',head:true}).eq('durum','Talep Edildi');
  if(error){ btn.textContent = temel; return; }
  btn.textContent = (count||0) > 0 ? `${temel} (${count})` : temel;
}

/* ============================================================
   48 SAATLİK REZERVASYON SÜRESİ (V31.58)
   ------------------------------------------------------------
   Platform bağımsız tasarım — pg_cron YOK. Üç katman:

   1) TEMBEL HESAP  — stok_musait görünümü süresi dolmuş
      rezervasyonun eşleşmeyen kısmını müsait sayar. Kimse
      süpürmese bile ekrandaki stok sayısı doğrudur.
   2) FIRSATÇI SÜPÜRME — stok_sure_dolumu_isle() modül açılışında
      ve rezervasyon işlemlerinden önce çağrılır; durumu kalıcı
      olarak 'Süresi Doldu' / 'Kısmi Tamamlandı' yapar.
   3) KISITLAMA — sistem_bakim tablosu + pg_try_advisory_lock;
      5 dakikadan sık koşmaz, iki oturum çakışmaz.

   Fonksiyon dönüşü:  >=0 islenen kayit · -1 kisitlama · -2 kilitli
   Saat 'Onaylandı' adiminda baslar, 'Eşleştirildi'de durur.
   ============================================================ */

const DONANIM_SURE_SAAT = 48;                       // varsayılan (sistem_ayarlari okunamazsa)
function _donanimEmeiSureSaat(){ return window._donanimAyar?.emei_sure_saat || DONANIM_SURE_SAAT; }
// V31.113: yeni akışta 'Hazırlanıyor' kalktı — sayaç Rezervasyon Onayı'ndan
// (durum: 'Onaylandı') Emei Eşleştirme tamamlanana kadar işler.
const DONANIM_SURE_AKTIF = ['Onaylandı','Stok Onay Emei Giriş','Turkcell Finans Onay','Kısmen Eşleştirildi'];
// Ön Rezervasyon'un kendi (6+6 saat) süre sayacı — ayrı bir zaman penceresi
const DONANIM_ONREZ_AKTIF = ['Ön Rezervasyon'];

// Fırsatçı süpürme. Hata hiçbir zaman kullanıcı akışını kesmez.
async function _donanimSureSupur(zorla){
  try{
    const {data, error} = await sb.rpc('stok_sure_dolumu_isle', {p_zorla: !!zorla});
    if(error){ console.warn('[donanim] süre süpürme:', error.message); return 0; }
    const n = Number(data);
    if(n > 0) console.info('[donanim] süresi dolan rezervasyon işlendi:', n);
    return n;
  }catch(e){ console.warn('[donanim] süre süpürme istisnası:', e.message); return 0; }
}

// V31.59: 48 İŞ SAATİ sonrasını hesaplar. Hafta sonu ve resmi tatiller sayaci
// durdurur; yarım gün (arife) tarihlerinde 13:00'a kadar sayar. Hesabı DB'deki
// is_saati_ekle() yapar (takvim tek yerde tutulur). RPC'ye ulaşılamazsa takvim
// saatiyle devam eder — süre hesabı hiçbir koşulda kullanıcı akışını kesmez.
// V31.113: saat parametresi verilebilir (Ön Rezervasyon 6 saat, Rezervasyon Onayı
// sonrası 48 saat gibi) — verilmezse eski davranış (48 saat) korunur.
async function _donanimSureBitisHesapla(bastanISO, saat){
  const taban = bastanISO || new Date().toISOString();
  const p_saat = saat || DONANIM_SURE_SAAT;
  try{
    const {data, error} = await sb.rpc('is_saati_ekle', {p_bas: taban, p_saat});
    if(error) throw new Error(error.message);
    if(!data)  throw new Error('boş dönüş');
    const d = new Date(data);
    if(isNaN(d.getTime())) throw new Error('geçersiz tarih: '+data);
    return d.toISOString();
  }catch(e){
    console.warn('[donanim] is_saati_ekle kullanılamadı, takvim saati uygulandı:', e.message);
    return new Date(new Date(taban).getTime() + p_saat*3600000).toISOString();
  }
}

// Kalan süre rozeti — kart üzerinde gösterilir
function _donanimSureRozet(bitis, durum){
  if(!bitis || !(DONANIM_SURE_AKTIF.includes(durum) || DONANIM_ONREZ_AKTIF.includes(durum))) return '';
  const kalanMs = new Date(bitis).getTime() - Date.now();
  if(isNaN(kalanMs)) return '';
  let metin, renk;
  if(kalanMs <= 0){
    metin = '⏳ Süre doldu'; renk = '#b03a2e';
  } else {
    const saat = Math.floor(kalanMs / 3600000);
    const dk   = Math.floor((kalanMs % 3600000) / 60000);
    metin = '⏳ ' + (saat >= 1 ? (saat + ' sa ' + dk + ' dk') : (dk + ' dk')) + ' kaldı';
    renk  = saat < 6 ? '#e74c3c' : (saat < 24 ? '#f39c12' : '#5d6d7e');
  }
  return `<span title="Hafta sonu ve resmi tatiller süreye dahil değildir" style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${renk};color:#fff;margin-left:6px;white-space:nowrap;cursor:help;">${metin}</span>`;
}

// Süre uzatma — Depo & Muhasebe (donanim_yonet) veya onay yetkisi olan
async function donanimSureUzat(sepetId){
  // urun_id + adet + ncst: _donanimRezHareketLog bunlarsız satır üretemez
  const {data:kalemler, error} = await sb.from('stok_rezervasyonlari')
    .select('rezervasyon_id,urun_id,adet,ncst,satan_my_id,kcm_id,durum,rezervasyon_bitis,uzatma_sayisi')
    .eq('sepet_id', sepetId);
  if(error || !kalemler || !kalemler.length){ toast('Rezervasyon bulunamadı','error'); return; }

  const ilk = kalemler[0];
  const yetkili = hasPerm('donanim_yonet') || _donanimRezOnayYetkisi(ilk.satan_my_id, ilk.kcm_id);
  if(!yetkili){ toast('Süre uzatma yetkiniz yok','error'); return; }
  if(!DONANIM_SURE_AKTIF.includes(ilk.durum)){
    toast('Bu durumdaki rezervasyonun süresi uzatılamaz','error'); return;
  }
  if(!confirm(`Rezervasyon süresi ${DONANIM_SURE_SAAT} iş saati uzatılsın mı?\n(Hafta sonu ve resmi tatiller süreye işlemez)`)) return;

  // Taban: mevcut bitiş geçmişteyse şimdiden, değilse mevcut bitişten devam
  const mevcut = ilk.rezervasyon_bitis ? new Date(ilk.rezervasyon_bitis).getTime() : 0;
  const taban  = new Date(Math.max(mevcut, Date.now())).toISOString();
  const yeni   = await _donanimSureBitisHesapla(taban);   // V31.59: iş saati
  const simdi  = new Date().toISOString();

  const hatalar = [];
  for(const k of kalemler){
    const {error:uErr} = await sb.from('stok_rezervasyonlari').update({
      rezervasyon_bitis: yeni,
      uzatma_sayisi: (k.uzatma_sayisi||0) + 1,
      uzatan_id: currentUser.my_id,
      uzatma_tarihi: simdi,
      updated_at: simdi
    }).eq('rezervasyon_id', k.rezervasyon_id);
    if(uErr) hatalar.push(uErr.message);
  }
  if(hatalar.length){ toast('Uzatılamadı: '+hatalar[0],'error'); return; }

  await _donanimRezHareketLog('Rezervasyon Süresi Uzatıldı', kalemler,
    {ncst: ilk.ncst, satan_my_id: ilk.satan_my_id});

  toast(`Süre ${DONANIM_SURE_SAAT} iş saati uzatıldı`,'success');
  loadDonanimRezervasyonlar();
}

/* ============================================================
   HIZLI SEVKİYAT KONSOLU (V31.64)
   ------------------------------------------------------------
   Depo & Muhasebe için tek ekran: MY → müşteri → satış tipi →
   cihaz → IMEI → fatura → sevk.

   TASARIM KARARI — paralel yazma yolu AÇILMAZ:
   Kayıt tüm süreç adımlarından SIRAYLA geçer ve her adımda mevcut
   akışın yazdığı alanların aynısı yazılır. Böylece timeline, süre
   rozeti, raporlar ve Rezervasyonlar ekranı bozulmaz:
     Ön Rezervasyon → Onaylandı → Hazırlanıyor
                    → Eşleştirildi → Fatura Kesildi → Cihaz Gönderildi
   Sayaçlar da aynı sırayla hareket eder:
     on_rezerve +adet  → (onayda) on_rezerve -adet, rezerve +adet
                       → (sevkte) toplam -adet, rezerve -adet
   Stok düşümü ve IMEI 'Satıldı' geçişi V31.63'teki ortak
   _donanimSevkStokDus() ile yapılır — iki ekran tek kuraldan besnenir.

   HATA DAVRANIŞI: bir adım başarısız olursa zincir orada durur,
   kayıt o durumda kalır ve kullanıcıya nerede kaldığı söylenir.
   Rezervasyonlar ekranından elle devam edilebilir. IMEI bağlama
   yarıda kalırsa bağlanan seriler havuza iade edilir.
   ============================================================ */

// Satış tipleri tek yerden — DONANIM_SATIS_TIPI_RENK ile aynı anahtarlar
const DONANIM_SATIS_TIPLERI = Object.keys(DONANIM_SATIS_TIPI_RENK);

window._svk = window._svk || null;

function _svkYeni(){
  return {adim:1, my:null, musteri:null, satisTipi:null, kalemler:[],
          fatura:false, faturaNo:'', calisiyor:false, depoId:null, bitti:null};
}

const _svkAdet  = () => (window._svk?.kalemler||[]).reduce((t,k)=>t+k.adet,0);
const _svkImei  = () => (window._svk?.kalemler||[]).reduce((t,k)=>t+k.seri.length,0);
const _svkImeiTam = () => {
  const S = window._svk;
  return !!S && S.kalemler.length>0 && S.kalemler.every(k=> k.seri.length===k.adet);
};

const SVK_ADIMLAR = [
  {no:1, ad:'MY / FMY',     tamam:()=>!!window._svk?.my},
  {no:2, ad:'Müşteri',      tamam:()=>!!window._svk?.musteri},
  {no:3, ad:'Satış tipi',   tamam:()=>!!window._svk?.satisTipi},
  {no:4, ad:'Cihazlar',     tamam:()=>(window._svk?.kalemler||[]).length>0},
  {no:5, ad:'IMEI eşleştir',tamam:()=>_svkImeiTam()},
  {no:6, ad:'Fatura & sevk',tamam:()=>!!window._svk?.fatura}
];
const _svkAcilabilir = no => no===1 || SVK_ADIMLAR.slice(0,no-1).every(a=>a.tamam());

async function initSevkiyatPage(){
  if(!hasPerm('donanim_yonet') || !hasPerm('donanim_sevk')){
    const el = document.getElementById('donanimSvkAkis');
    if(el) el.innerHTML = '<div class="empty">Bu ekran için yetkiniz yok.</div>';
    return;
  }
  // V31.65: ayrı sayfa olduğu için KÇM adları burada da hazır olmalı
  if(!(window._donanimKcmList||[]).length){
    const {data} = await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
    window._donanimKcmList = data || [];
  }
  if(!window._svk) window._svk = _svkYeni();
  _svkCiz();
}

function donanimSvkSifirla(){
  window._svk = _svkYeni();
  _svkCiz();
}

/* ---------------- çizim ---------------- */
function _svkCiz(){
  const S = window._svk;
  const el = document.getElementById('donanimSvkAkis');
  if(!S || !el) return;
  if(S.bitti){ _svkFisCiz(); return; }

  el.innerHTML = SVK_ADIMLAR.map(a=>{
    const tamam = a.tamam(), aktif = (S.adim===a.no), kilit = !_svkAcilabilir(a.no);
    return `<section class="svk-adim ${aktif?'aktif':''} ${tamam&&!aktif?'tamam':''} ${kilit?'kilit':''}">
      <button class="svk-bas" ${kilit?'disabled':''} onclick="donanimSvkAdimAc(${a.no})">
        <span class="svk-no">${tamam&&!aktif?'✓':a.no}</span>
        <span class="svk-ad">${escapeHTML(a.ad)}</span>
        <span class="svk-deger">${_svkDeger(a.no)}</span>
      </button>
      ${aktif ? `<div class="svk-govde" id="donanimSvkGovde">${_svkGovde(a.no)}</div>` : ''}
    </section>`;
  }).join('');

  if(S.adim===4){ _svkCihazAra(); _svkSecilenCiz(); }
  if(S.adim===5) _svkImeiCiz();
  _svkOzet();
  const ilk = el.querySelector('.svk-adim.aktif input');
  if(ilk) setTimeout(()=>ilk.focus(), 60);
}

function _svkDeger(no){
  const S = window._svk;
  if(no===1) return S.my ? `<b>${escapeHTML(S.my.ad_soyad)}</b> · ${escapeHTML(S.my.yetki_seviyesi)}${S.my.kcm_adi?' · '+escapeHTML(S.my.kcm_adi):''}` : 'Cihazı satan saha çalışanı';
  if(no===2) return S.musteri ? `<b>${escapeHTML(S.musteri.unvan||S.musteri.ncst)}</b> · NCST ${escapeHTML(S.musteri.ncst)}` : 'Ünvan veya NCST ile ara';
  if(no===3) return S.satisTipi ? `<b>${escapeHTML(S.satisTipi)}</b>` : 'Peşin / OLM / Turkcell Finansman';
  if(no===4) return S.kalemler.length ? `<b>${S.kalemler.length}</b> kalem · <b>${_svkAdet()}</b> adet` : 'Stoktan cihaz ve adet seç';
  if(no===5) return S.kalemler.length ? `<b>${_svkImei()}/${_svkAdet()}</b> eşleşti` : 'Önce cihaz seçin';
  return S.fatura ? '<b>Fatura kesildi</b> — sevke hazır' : 'Faturayı onayla';
}

function _svkGovde(no){
  const S = window._svk;
  if(no===1) return `
    <input type="text" id="donanimSvkMyAra" placeholder="MY / FMY adı ile ara (min 2 karakter)…" autocomplete="off" oninput="donanimSvkMyAraDebounce()">
    <div class="svk-sonuc" id="donanimSvkMySonuc"></div>`;
  if(no===2) return `
    <input type="text" id="donanimSvkMusteriAra" placeholder="Ünvan veya NCST (min 2 karakter)…" autocomplete="off" oninput="donanimSvkMusteriAraDebounce()">
    <div class="svk-sonuc" id="donanimSvkMusteriSonuc"></div>`;
  if(no===3) return `<div class="svk-cip">${DONANIM_SATIS_TIPLERI.map(t=>
      `<button class="${S.satisTipi===t?'on':''}" onclick="donanimSvkSatisTipi('${_jsStr(t)}')">${escapeHTML(t)}</button>`).join('')}</div>`;
  if(no===4) return `
    <input type="text" id="donanimSvkCihazAra" placeholder="Cihaz adı veya malzeme kodu…" autocomplete="off" oninput="donanimSvkCihazAraDebounce()">
    <div class="svk-sonuc" id="donanimSvkCihazSonuc"><div class="svk-bos">Yükleniyor…</div></div>
    <div id="donanimSvkSecilen" style="margin-top:10px;"></div>
    <button class="btn btn-sm" style="background:var(--blue);margin-top:10px;" onclick="donanimSvkAdimAc(5)">IMEI eşleştirmeye geç</button>`;
  if(no===5) return `
    <div id="donanimSvkImei"></div>
    <button class="btn btn-sm" style="background:var(--blue);margin-top:8px;" onclick="donanimSvkAdimAc(6)">Faturaya geç</button>`;
  return `
    <label class="svk-onay">
      <input type="checkbox" id="donanimSvkFatura" ${S.fatura?'checked':''} onchange="donanimSvkFatura(this.checked)">
      <span><b>Fatura kesildi</b><br><span style="font-size:11px;color:var(--text3);">Sevkiyat tamamlanınca durum zincirine “Fatura Kesildi” de yazılır.</span></span>
    </label>
    <input type="text" id="donanimSvkFaturaNo" placeholder="Fatura numarası…" autocomplete="off" style="margin-top:8px;"
      value="${escapeHTML(S.faturaNo||'')}" oninput="donanimSvkFaturaNoGir(this.value)">`;
}

function donanimSvkAdimAc(no){
  if(!_svkAcilabilir(no)){ toast('Önceki adımları tamamlayın','info'); return; }
  window._svk.adim = no;
  _svkCiz();
}

/* ---------------- 1) MY ---------------- */
let _svkMyT = null;
function donanimSvkMyAraDebounce(){ clearTimeout(_svkMyT); _svkMyT = setTimeout(_svkMyAra, 300); }
async function _svkMyAra(){
  const q = (document.getElementById('donanimSvkMyAra')?.value||'').trim();
  const el = document.getElementById('donanimSvkMySonuc');
  if(!el) return;
  if(q.length < 2){ el.innerHTML = '<div class="svk-bos">En az 2 karakter yazın.</div>'; return; }
  const {data, error} = await sb.from('users').select('my_id,ad_soyad,yetki_seviyesi,kcm_id')
    .in('yetki_seviyesi',['MY','FMY']).eq('aktif',true).ilike('ad_soyad','%'+q+'%')
    .order('ad_soyad').limit(12);
  if(error){ el.innerHTML = `<div class="svk-bos" style="color:var(--red);">${escapeHTML(error.message)}</div>`; return; }
  const kcmAd = {};
  (window._donanimKcmList||[]).forEach(k=>{ kcmAd[k.kcm_id] = k.kcm_adi; });
  el.innerHTML = (data||[]).length ? (data||[]).map(u=>
    `<button class="svk-sec" onclick="donanimSvkMySec(${u.my_id})">
       <span class="svk-s1">${escapeHTML(u.ad_soyad)}</span>
       <span class="svk-s2">${escapeHTML(kcmAd[u.kcm_id]||('KÇM#'+(u.kcm_id||'—')))}</span>
       <span class="svk-sag">${escapeHTML(u.yetki_seviyesi)}</span>
     </button>`).join('') : '<div class="svk-bos">Eşleşen MY/FMY yok.</div>';
  window._svkMyBul = {}; (data||[]).forEach(u=>{ window._svkMyBul[u.my_id] = u; });
}
async function donanimSvkMySec(myId){
  const u = (window._svkMyBul||{})[myId];
  if(!u){ toast('MY bulunamadı','error'); return; }
  const kcmAd = {}; (window._donanimKcmList||[]).forEach(k=>{ kcmAd[k.kcm_id] = k.kcm_adi; });
  window._svk.my = Object.assign({}, u, {kcm_adi: kcmAd[u.kcm_id]||''});
  // Rezervasyon bu MY'nin KÇM deposuna yazılır — stok düşümü de oradan olur
  window._svk.depoId = u.kcm_id ? await _donanimAnaDepoId(u.kcm_id) : await _donanimMerkezDepoId();
  window._svk.kalemler = [];
  window._svk.adim = 2;
  _svkCiz();
}

/* ---------------- 2) Müşteri ---------------- */
let _svkMusT = null;
function donanimSvkMusteriAraDebounce(){ clearTimeout(_svkMusT); _svkMusT = setTimeout(_svkMusteriAra, 320); }
async function _svkMusteriAra(){
  const q = (document.getElementById('donanimSvkMusteriAra')?.value||'').trim();
  const el = document.getElementById('donanimSvkMusteriSonuc');
  if(!el) return;
  if(q.length < 2){ el.innerHTML = '<div class="svk-bos">En az 2 karakter yazın.</div>'; return; }
  let query = getCustomerBaseQuery(true);
  const {data, error} = await query.or(`unvan.ilike.%${q}%,ncst.ilike.%${q}%`).limit(10);
  if(error){ el.innerHTML = `<div class="svk-bos" style="color:var(--red);">${escapeHTML(error.message)}</div>`; return; }
  window._svkMusBul = {}; (data||[]).forEach(c=>{ window._svkMusBul[c.ncst] = c; });
  el.innerHTML = (data||[]).length ? (data||[]).map(c=>
    `<button class="svk-sec" onclick="donanimSvkMusteriSec('${_jsStr(c.ncst)}')">
       <span class="svk-s1">${escapeHTML(c.unvan||c.ncst)}</span>
       <span class="svk-s2">NCST ${escapeHTML(c.ncst)}${c.il?' · '+escapeHTML(c.il):''}</span>
     </button>`).join('') : '<div class="svk-bos">Eşleşen müşteri yok.</div>';
}
function donanimSvkMusteriSec(ncst){
  const c = (window._svkMusBul||{})[ncst];
  if(!c){ toast('Müşteri bulunamadı','error'); return; }
  window._svk.musteri = c;
  window._svk.adim = 3;
  _svkCiz();
}

/* ---------------- 3) Satış tipi ---------------- */
function donanimSvkSatisTipi(t){
  window._svk.satisTipi = t;
  window._svk.adim = 4;
  _svkCiz();
}

/* ---------------- 4) Cihazlar ---------------- */
let _svkCihazT = null;
function donanimSvkCihazAraDebounce(){ clearTimeout(_svkCihazT); _svkCihazT = setTimeout(_svkCihazAra, 280); }
async function _svkCihazAra(){
  const S  = window._svk;
  const el = document.getElementById('donanimSvkCihazSonuc');
  if(!el || !S) return;
  const q = (document.getElementById('donanimSvkCihazAra')?.value||'').trim();
  let query = sb.from('stok_musait').select('urun_id,aciklama,malzeme_kodu,musait_adet,toplam_adet,rezerve_adet')
    .eq('aktif', true);
  if(S.depoId) query = query.or(`depo_id.eq.${S.depoId},tum_kcm.eq.true`);
  if(q){
    q.split(/\s+/).filter(Boolean).forEach(w=>{
      query = query.or(`aciklama.ilike.%${w}%,malzeme_kodu.ilike.%${w}%`);
    });
  }
  const {data, error} = await query.order('aciklama').limit(30);
  if(error){ el.innerHTML = `<div class="svk-bos" style="color:var(--red);">${escapeHTML(error.message)}</div>`; return; }
  const liste = (data||[]).filter(u=> (u.musait_adet||0) > 0);
  window._svkCihazBul = {}; liste.forEach(u=>{ window._svkCihazBul[u.urun_id] = u; });
  el.innerHTML = liste.length ? liste.map(u=>{
    const secili = S.kalemler.some(k=>k.urun_id===u.urun_id);
    return `<button class="svk-sec" ${secili?'disabled':''} onclick="donanimSvkCihazEkle(${u.urun_id})">
      <span class="svk-s1">${escapeHTML(u.aciklama||('Cihaz #'+u.urun_id))}</span>
      <span class="svk-s2">${escapeHTML(u.malzeme_kodu||'')}</span>
      <span class="svk-sag" style="color:var(--green);">${u.musait_adet} müsait</span>
    </button>`;
  }).join('') : '<div class="svk-bos">Bu depoda müsait cihaz bulunamadı.</div>';
}
function donanimSvkCihazEkle(urunId){
  const S = window._svk;
  const u = (window._svkCihazBul||{})[urunId];
  if(!u || S.kalemler.some(k=>k.urun_id===urunId)) return;
  S.kalemler.push({urun_id:u.urun_id, ad:u.aciklama||('Cihaz #'+u.urun_id), kod:u.malzeme_kodu||'',
                   musait:u.musait_adet||0, adet:1, seri:[]});
  _svkCihazAra(); _svkSecilenCiz(); _svkOzet();
}
function donanimSvkCihazCikar(urunId){
  const S = window._svk;
  S.kalemler = S.kalemler.filter(k=>k.urun_id!==urunId);
  _svkCihazAra(); _svkSecilenCiz(); _svkOzet();
}
function donanimSvkAdet(urunId, deger){
  const k = window._svk.kalemler.find(x=>x.urun_id===urunId);
  if(!k) return;
  let v = parseInt(deger,10);
  if(isNaN(v) || v < 1) v = 1;
  if(v > k.musait) v = k.musait;
  k.adet = v;
  if(k.seri.length > v) k.seri = k.seri.slice(0, v);
  _svkSecilenCiz(); _svkOzet();
}
function _svkSecilenCiz(){
  const el = document.getElementById('donanimSvkSecilen');
  if(!el) return;
  const S = window._svk;
  el.innerHTML = S.kalemler.length ? S.kalemler.map(k=>`
    <div class="svk-kalem">
      <span class="svk-kalem-ad">${escapeHTML(k.ad)}<span class="svk-kod">${escapeHTML(k.kod)}</span></span>
      <input type="number" min="1" max="${k.musait}" value="${k.adet}"
             oninput="donanimSvkAdet(${k.urun_id}, this.value)" aria-label="adet">
      <button class="btn btn-ghost btn-sm" onclick="donanimSvkCihazCikar(${k.urun_id})">Kaldır</button>
    </div>`).join('') : '<div class="svk-bos">Henüz cihaz seçilmedi.</div>';
}

/* ---------------- 5) IMEI ---------------- */
async function _svkImeiCiz(){
  const S  = window._svk;
  const el = document.getElementById('donanimSvkImei');
  if(!el || !S) return;
  // Havuz kimlikleri bir kez çözülür (V31.63)
  for(const k of S.kalemler){
    if(k.havuzUrunId === undefined) k.havuzUrunId = await _donanimHavuzUrunId(k.urun_id);
  }
  el.innerHTML = S.kalemler.map((k,i)=>{
    const tam = k.seri.length === k.adet;
    const bagli = k.seri.map(s=>`<div class="svk-imei-satir">
        <code>${escapeHTML(_imeiMaskele(s.seri_no))}</code>
        <button class="btn btn-ghost btn-sm" onclick="donanimSvkImeiKaldir(${i},${s.seri_no_id})">Kaldır</button>
      </div>`).join('');
    const giris = tam ? '<div class="svk-tamam">Bu ürün tamamlandı ✓</div>' : `
      <input type="text" id="donanimSvkSc_${i}" placeholder="IMEI okut veya ara…" autocomplete="off"
             oninput="donanimSvkImeiAra(${i}, this.value)"
             onkeydown="if(event.key==='Enter'){event.preventDefault();donanimSvkImeiEnter(${i}, this);}">
      <div id="donanimSvkImeiSonuc_${i}"></div>`;
    return `<div class="svk-imei-grup">
      <div class="svk-imei-bas"><span>${escapeHTML(k.ad)}</span>
        <span class="svk-sayac ${tam?'tam':''}">${k.seri.length}/${k.adet}</span></div>
      ${bagli}${giris}
    </div>`;
  }).join('');
  S.kalemler.forEach((k,i)=>{ if(k.seri.length < k.adet) donanimSvkImeiAra(i, ''); });
  const ilkBos = S.kalemler.findIndex(k=> k.seri.length < k.adet);
  if(ilkBos >= 0){ const inp = document.getElementById('donanimSvkSc_'+ilkBos); if(inp) inp.focus(); }
}

async function donanimSvkImeiAra(i, q){
  const S = window._svk, k = S.kalemler[i];
  const el = document.getElementById('donanimSvkImeiSonuc_'+i);
  if(!el || !k) return;
  q = (q||'').trim();
  let query = sb.from('stok_seri_no').select('seri_no_id,seri_no')
    .eq('urun_id', k.havuzUrunId||k.urun_id).eq('durum','Depoda');
  if(q) query = query.ilike('seri_no','%'+q+'%');
  const {data} = await query.order('seri_no').limit(12);
  const kullanilan = new Set();
  S.kalemler.forEach(x=> x.seri.forEach(s=> kullanilan.add(s.seri_no_id)));
  const liste = (data||[]).filter(s=> !kullanilan.has(s.seri_no_id));
  el.innerHTML = liste.length
    ? liste.map(s=>`<div class="svk-imei-oner" onclick="donanimSvkImeiEkle(${i},${s.seri_no_id},'${_jsStr(s.seri_no)}')">${escapeHTML(s.seri_no)}</div>`).join('')
    : `<div class="svk-bos">${q?'Eşleşen boşta cihaz yok.':'Havuzda boşta IMEI bulunamadı.'}</div>`;
}

async function donanimSvkImeiEnter(i, inp){
  const val = (inp.value||'').trim();
  if(!val) return;
  const S = window._svk, k = S.kalemler[i];
  if(k.seri.length >= k.adet){ toast('Bu ürün için tüm slotlar dolu','info'); return; }
  const {data} = await sb.from('stok_seri_no').select('seri_no_id,seri_no,urun_id,durum').eq('seri_no',val).maybeSingle();
  if(!data){ toast('Seri bulunamadı: '+val,'error'); return; }
  if(data.urun_id !== (k.havuzUrunId||k.urun_id)){ toast('Bu IMEI bu ürüne ait değil','error'); return; }
  if(data.durum !== 'Depoda'){ toast(`Bu IMEI boşta değil (durum: ${data.durum})`,'error'); return; }
  inp.value = '';
  donanimSvkImeiEkle(i, data.seri_no_id, data.seri_no);
}

function donanimSvkImeiEkle(i, seriNoId, seriNo){
  const S = window._svk, k = S.kalemler[i];
  if(!k || k.seri.length >= k.adet){ toast('Bu ürün için tüm slotlar dolu','info'); return; }
  if(S.kalemler.some(x=> x.seri.some(s=> s.seri_no_id===seriNoId))){ toast('Zaten eklendi','info'); return; }
  k.seri.push({seri_no_id:seriNoId, seri_no:String(seriNo)});
  _svkImeiCiz(); _svkOzet();
}
function donanimSvkImeiKaldir(i, seriNoId){
  const k = window._svk.kalemler[i];
  k.seri = k.seri.filter(s=> s.seri_no_id !== seriNoId);
  _svkImeiCiz(); _svkOzet();
}

/* ---------------- 6) fatura + özet ---------------- */
function donanimSvkFatura(v){ window._svk.fatura = !!v; _svkOzet(); }
// V31.131: fatura numarası — Fatura Kesildi adımı için zorunlu alan
function donanimSvkFaturaNoGir(v){ window._svk.faturaNo = (v||'').trim(); _svkOzet(); }

function _svkOzet(){
  const S = window._svk;
  const oz = document.getElementById('donanimSvkOzet');
  const zn = document.getElementById('donanimSvkZincir');
  const bt = document.getElementById('donanimSvkTamamlaBtn');
  if(!S || !oz) return;
  const sat = (e,d)=>`<div class="svk-ozet-satir"><span>${e}</span><b class="${d?'':'yok'}">${d||'—'}</b></div>`;
  oz.innerHTML =
      sat('MY/FMY',    S.my?escapeHTML(S.my.ad_soyad):'')
    + sat('Müşteri',   S.musteri?escapeHTML(S.musteri.unvan||S.musteri.ncst):'')
    + sat('Satış tipi',S.satisTipi?escapeHTML(S.satisTipi):'')
    + sat('Cihaz',     S.kalemler.length?(S.kalemler.length+' kalem · '+_svkAdet()+' adet'):'')
    + sat('IMEI',      S.kalemler.length?(_svkImei()+'/'+_svkAdet()):'')
    + sat('Fatura',    S.fatura?('kesildi — No: '+(S.faturaNo||'—')):'');

  if(zn){
    const zincir = [
      ['Ön Rezervasyon',        !!(S.my && S.musteri && S.satisTipi && S.kalemler.length)],
      ['Onaylandı',             S.kalemler.length>0],
      ['Stok Onay/Emei Giriş',  S.kalemler.length>0],
      ['Turkcell Finans Onay',  S.kalemler.length>0],
      ['Eşleştirildi',          _svkImeiTam()],
      ['Fatura Kesildi',        S.fatura],
      ['Tamamlandı',            !!S.bitti]
    ];
    zn.innerHTML = '<div class="svk-zincir-bas">Yazılacak durum zinciri</div>' +
      zincir.map(([ad,ok])=>`<div class="svk-z ${ok?'ok':''}"><i></i>${escapeHTML(ad)}</div>`).join('');
  }
  if(bt){
    bt.disabled = !(_svkImeiTam() && S.fatura && S.faturaNo && !S.calisiyor && !S.bitti);
    bt.textContent = S.calisiyor ? 'Gönderiliyor…' : 'Sevkiyatı tamamla';
  }
}

function _svkDurum(metin, renk){
  const el = document.getElementById('donanimSvkUyari');
  if(el) el.innerHTML = metin ? `<div class="svk-uyari" style="${renk?('color:'+renk+';border-color:'+renk):''}">${escapeHTML(metin)}</div>` : '';
}

/* ---------------- SEVKİYAT ZİNCİRİ ---------------- */
async function donanimSvkTamamla(){
  const S = window._svk;
  if(!S || S.calisiyor) return;
  if(!hasPerm('donanim_yonet') || !hasPerm('donanim_sevk')){ toast('Yetkiniz yok','error'); return; }
  if(!_svkImeiTam() || !S.fatura || !S.faturaNo){ toast('Eksik adım var (fatura numarası zorunlu)','error'); return; }
  if(!confirm(`${_svkAdet()} cihaz ${S.musteri.unvan||S.musteri.ncst} adına sevk edilecek. Onaylıyor musunuz?`)) return;

  S.calisiyor = true; _svkOzet();
  const sepetId = (crypto.randomUUID ? crypto.randomUUID() : (Date.now()+'-'+Math.random()));
  const simdi = () => new Date().toISOString();
  let adimAdi = 'Ön Rezervasyon';
  const baglanan = [];

  try{
    /* 1) Ön Rezervasyon */
    const kayitlar = S.kalemler.map(k=>({
      urun_id: k.urun_id, kcm_id: S.my.kcm_id, adet: k.adet,
      ncst: S.musteri.ncst, musteri_my_id: S.musteri.my_id,
      satan_my_id: S.my.my_id, rezerve_eden_id: currentUser.my_id,
      durum: 'Ön Rezervasyon', sepet_id: sepetId, satis_tipi: S.satisTipi,
      aciklama: 'Hızlı Sevkiyat konsolundan oluşturuldu'
    }));
    const {error:insErr} = await sb.from('stok_rezervasyonlari').insert(kayitlar);
    if(insErr) throw new Error(insErr.message);
    // V31.113: cihaz DOĞRUDAN rezerve_adet'e düşer (eski on_rezerve_adet aşaması kalktı)
    for(const k of S.kalemler){
      const {data:u} = await sb.from('stok_urunleri').select('rezerve_adet').eq('urun_id',k.urun_id).maybeSingle();
      await sb.from('stok_urunleri').update({rezerve_adet:(u?.rezerve_adet||0)+k.adet, updated_at:simdi()}).eq('urun_id',k.urun_id);
    }
    await _donanimRezHareketLog('Ön Rezervasyon', kayitlar, {ncst:S.musteri.ncst, satan_my_id:S.my.my_id});

    /* 2) Onaylandı — stok zaten rezerve_adet'te, sadece Emei süre damgası basılır */
    adimAdi = 'Onaylandı';
    const bitis = await _donanimSureBitisHesapla(new Date().toISOString(), _donanimEmeiSureSaat());
    const {error:onayErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Onaylandı', rezervasyon_bitis:bitis, updated_at:simdi()}).eq('sepet_id',sepetId);
    if(onayErr) throw new Error(onayErr.message);
    await _donanimRezHareketLog('Rezervasyon Onaylandı', kayitlar, {ncst:S.musteri.ncst, satan_my_id:S.my.my_id});

    /* 3) Stok Onay/Emei Giriş + Turkcell Finans Onay — Hızlı Konsol tek oturumda ilerletir */
    adimAdi = 'Stok Onay Emei Giriş';
    const {error:egErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Stok Onay Emei Giriş', updated_at:simdi()}).eq('sepet_id',sepetId);
    if(egErr) throw new Error(egErr.message);
    adimAdi = 'Turkcell Finans Onay';
    const {error:foErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Turkcell Finans Onay', updated_at:simdi()}).eq('sepet_id',sepetId);
    if(foErr) throw new Error(foErr.message);

    /* 4) IMEI bağlama — her seri yalnız 'Depoda' iken bağlanır */
    adimAdi = 'Eşleştirildi';
    for(const k of S.kalemler){
      for(const s of k.seri){
        const {data:upd, error:sErr} = await sb.from('stok_seri_no')
          .update({durum:'Ayrıldı', sepet_id:sepetId, updated_at:simdi()})
          .eq('seri_no_id', s.seri_no_id).eq('durum','Depoda').select('seri_no_id');
        if(sErr) throw new Error(sErr.message);
        if(!upd || !upd.length) throw new Error(`IMEI ${s.seri_no} artık boşta değil (başka işlem olmuş olabilir)`);
        baglanan.push(s.seri_no_id);
      }
    }
    const {error:esErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Eşleştirildi', updated_at:simdi()}).eq('sepet_id',sepetId);
    if(esErr) throw new Error(esErr.message);
    const svkImeiMap = {};
    S.kalemler.forEach(k=>{ svkImeiMap[k.urun_id] = (k.seri||[]).map(s=>s.seri_no); });
    await _donanimRezHareketLog(`IMEI Eşleştirme (${_svkImei()}/${_svkAdet()})`, kayitlar, {ncst:S.musteri.ncst, satan_my_id:S.my.my_id, imeiMap:svkImeiMap});

    /* 5) Finans Onaylandı → Fatura Kesildi — V31.119: Hızlı Konsol da aynı ara
       durumdan geçer (tek oturumda, duraksamadan) — log/tutarlılık için. */
    adimAdi = 'Finans Onaylandı';
    const {error:foaErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Finans Onaylandı', updated_at:simdi()}).eq('sepet_id',sepetId);
    if(foaErr) throw new Error(foaErr.message);
    adimAdi = 'Fatura Kesildi';
    const {error:ftErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Fatura Kesildi', fatura_no:S.faturaNo, updated_at:simdi()}).eq('sepet_id',sepetId);
    if(ftErr) throw new Error(ftErr.message);
    await _donanimRezHareketLog('Süreç: Fatura Kesildi', kayitlar, {ncst:S.musteri.ncst, satan_my_id:S.my.my_id, faturaNo:S.faturaNo});

    /* 6) Tamamlandı (Cihaz Gönderildi) + stok düşümü (V31.63 ortak fonksiyonu) */
    adimAdi = 'Tamamlandı';
    const {data:sonKalemler} = await sb.from('stok_rezervasyonlari').select('*').eq('sepet_id',sepetId);
    const {data:gonderildi, error:gnErr} = await sb.from('stok_rezervasyonlari')
      .update({durum:'Tamamlandı', updated_at:simdi()})
      .eq('sepet_id',sepetId).eq('durum','Fatura Kesildi').select('rezervasyon_id');
    if(gnErr) throw new Error(gnErr.message);
    if(!gonderildi || !gonderildi.length) throw new Error('Kayıt bu sırada başkası tarafından değiştirilmiş');
    await _donanimSevkStokDus(sepetId, sonKalemler||kayitlar);
    await _donanimRezHareketLog('Süreç: Tamamlandı (Cihaz Gönderildi)', kayitlar, {ncst:S.musteri.ncst, satan_my_id:S.my.my_id});

    S.bitti = {sepetId, zaman:new Date().toLocaleString('tr-TR')};
    S.calisiyor = false;
    toast('Sevkiyat tamamlandı','success');
    _svkCiz();
    if(typeof _donanimBadgeGuncelle==='function') _donanimBadgeGuncelle();

  }catch(e){
    S.calisiyor = false;
    // IMEI bağlama yarıda kaldıysa bağlananlar havuza iade edilir
    if(adimAdi === 'Eşleştirildi' && baglanan.length){
      for(const id of baglanan){
        try{ await sb.from('stok_seri_no').update({durum:'Depoda', sepet_id:null, updated_at:simdi()}).eq('seri_no_id',id); }catch(_){}
      }
    }
    console.error('[donanim] hızlı sevkiyat:', adimAdi, e);
    _svkDurum(`“${adimAdi}” adımında durdu: ${e.message} — kayıt Rezervasyonlar ekranından elle sürdürülebilir (sepet ${String(sepetId).slice(0,8)}…).`, 'var(--red)');
    toast('Sevkiyat tamamlanamadı: '+e.message,'error');
    _svkOzet();
  }
}

function _svkFisCiz(){
  const S = window._svk;
  const el = document.getElementById('donanimSvkAkis');
  if(!S || !S.bitti || !el) return;
  el.innerHTML = `<div class="svk-fis">
    <h3>Sevkiyat tamamlandı</h3>
    <div class="svk-fis-alt">${escapeHTML(S.bitti.zaman)} · sepet ${escapeHTML(String(S.bitti.sepetId).slice(0,8))}…</div>
    <div class="svk-fis-blok">
      <div class="svk-ozet-satir"><span>MY / FMY</span><b>${escapeHTML(S.my.ad_soyad)}</b></div>
      <div class="svk-ozet-satir"><span>Müşteri</span><b>${escapeHTML(S.musteri.unvan||S.musteri.ncst)}</b></div>
      <div class="svk-ozet-satir"><span>NCST</span><b>${escapeHTML(S.musteri.ncst)}</b></div>
      <div class="svk-ozet-satir"><span>Satış tipi</span><b>${escapeHTML(S.satisTipi)}</b></div>
    </div>
    <div class="svk-fis-blok">
      ${S.kalemler.map(k=>`<div class="svk-ozet-satir"><span>${escapeHTML(k.ad)}</span><b>${k.adet} adet</b></div>`).join('')}
      <div class="svk-ozet-satir" style="border-top:1px solid var(--border);margin-top:4px;padding-top:5px;">
        <span>Stok etkisi</span><b>toplam ve rezerve düşüldü · IMEI “Satıldı”</b></div>
    </div>
    <button class="btn" style="width:100%;background:var(--blue);margin-top:6px;" onclick="donanimSvkSifirla()">Yeni sevkiyat başlat</button>
  </div>`;
  _svkOzet();
  _svkDurum('');
}
