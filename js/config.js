// ============================================================
// config.js — v1.3.97
// Son güncelleme: 2026-09-23
// Değişiklikler:
//   v1.3.97 — APP_VERSION → V31.155. YENİ: Donanım Tedarik Talebi email
//     bildirimi (Resend, Şengüller-360/leave-mail.js ile aynı desen).
//     _worker.js'e POST /api/send-mail eklendi (sunucu tarafında Resend'e
//     istek atıyor — RESEND_API_KEY ve MAIL_FROM Worker secret olarak
//     tanımlı olmalı: `wrangler secret put RESEND_API_KEY` /
//     `wrangler secret put MAIL_FROM`; SSSO'nun kendi "crm" worker'ı
//     Şengüller-360'ın "360" worker'ından AYRI, bu secret'lar SSSO'ya
//     henüz TANIMLANMADI — Oktay tanımlayana kadar email gönderimi hata
//     verir ama talep akışını DURDURMAZ (best-effort). donanim.js: yeni
//     talep oluşunca donanim_yonet yetkili + aynı KÇM'deki kullanıcılara,
//     talep Karşılandı/Reddedildi olunca talep sahibine email gider.
//   v1.3.96 — APP_VERSION → V31.154. TANI: _donanimKatalogSatiriBul'daki
//     depo_id UPDATE'i şimdiye kadar hatasını hiç kontrol etmiyordu (sessiz
//     başarısızlık olasılığı — RLS/yetki vb.). Artık updErr kontrol edilip
//     hata varsa "Katalog satırı hazırlanamadı" olarak rapora düşüyor; ilk
//     kez gerçek hata mesajı görülebilecek.
//   v1.3.95 — APP_VERSION → V31.153. BUG FİX (V31.152'nin eksiği):
//     _donanimKatalogSatiriBul "satır zaten var" dalı depo_id'yi hiç
//     kontrol etmiyordu — V31.152 öncesi hatalı oluşturulmuş (depo_id NULL)
//     katalog satırları bu yüzden "zaten var" denip bir daha asla
//     düzeltilmiyordu, Depolar ızgarasında görünmeye devam ediyordu. Artık
//     mevcut satırın depo_id'si NULL ise merkez.depo_id/depo_adi ile
//     dolduruluyor.
//   v1.3.94 — APP_VERSION → V31.152. FIX: Donanım "Stok Yükle" — Excel'den
//     ilk kez görülen bir malzeme kodu için oluşturulan katalog satırı
//     depo_id/depo_adi SET ETMİYORDU (NULL kalıyordu) -> "Yeni Ürün Ekle"
//     ile davranış tutarsızdı ve ürün "Depolar" ızgarasında hiç görünmüyordu
//     (ızgara stok_urunleri'ni depo_id IS NOT NULL filtresiyle okuyor).
//     _donanimKatalogSatiriBul artık merkez parametresi alıyor ve INSERT'e
//     depo_id/depo_adi ekliyor (donanimYeniUrunKaydet ile birebir aynı satır).
//     YENİ: Excel ile Stok Yükle akışına KOLON EŞLEME adımı eklendi (Veri
//     Düzenleme modülündeki desenle aynı) — dosya seçilince başlıklar
//     otomatik Seri No/Malzeme Kodu/Açıklama alanlarına eşlenir, önizleme +
//     düzeltilebilir dropdown ile ekranda gösterilir; Seri No ve Malzeme
//     Kodu eşlenmeden "Onayla ve Yükle" aktif olmaz (önceden bulunamayan
//     kolon sessizce boş geçilip satır arka planda eleniyordu).
//   v1.3.93 — APP_VERSION → V31.151. YENİ: Donanım — "Excel ile Stok Yükle"
//     butonu "Stok Yükle/Stoktan Çıkart" oldu (Stok sekmesi). Modal iki
//     moda ayrıldı: Yükle (davranış değişmedi) ve yeni Çıkart. Çıkart:
//     Excel IMEI listesi VEYA elle IMEI yapıştırma ile, seçilen depodan
//     cihazlar kalıcı 'Çıkarıldı' durumuna alınır (IMEI kaydı silinmez,
//     iz olarak kalır — cikis_sebep/cikis_hedef/cikis_aciklama/
//     cikis_depo_id/cikis_tarihi/cikis_kullanici_id kolonlarıyla, bkz.
//     TASARIM_Donanim_Stok_Giris_Cikis_ve_Veri_Sifirlama). Zorunlu alanlar:
//     depo, sebep (Arıza/Kayıp/İade/Diğer), kime verildi. Merkez seçilirse
//     havuz adedi yeniden sayılır; KÇM/Cep seçilirse o deponun toplam_adet'i
//     ayrıca elle düşürülür (IMEI'ler mimari gereği yalnızca katalog
//     satırına bağlı, KÇM satırı seri taşımaz — "hangi depodan çıktığı"
//     bu yüzden kullanıcı seçimiyle belirlenir). İşlem sonunda Detay (IMEI
//     bazlı, hangi depo/sebep/kime) + Özet (ürün×adet, IMEİ'siz) raporu
//     ekranda gösterilir ve iki sayfalı Excel olarak indirilebilir.
//     Mükerrer IMEI kontrolü (stok girişinde) zaten tüm sistemi kapsıyordu
//     (stok_seri_no'da seri_no varlığı durum/depo fark etmeksizin
//     kontrol ediliyordu) — bu yüzden ayrı bir değişiklik gerekmedi,
//     'Çıkarıldı' durumundaki IMEI de zaten tekrar girişe kapalı.
//     UI: Giriş ekranı "Giriş Yap" tuşu mavi→yeşil (Onayla ailesiyle
//     tutarlı, Oktay'ın talebiyle).
//   v1.3.92 — APP_VERSION → V31.150. UI FIX: Uygulama genelinde tuş renk/
//     ikon sistemi kesinleştirildi ve tam tarama yapıldı (~45 düzeltme).
//     (a) İPTAL/VAZGEÇ — 24 adet düz İptal/Vazgeç tuşuna ✕ ikonu eklendi
//     (Donanım, Arama, Anket, Birleşik Onay, Zoptlar, Şifre, Plan, Ürün,
//     Hedef Kalem, Kullanıcı, Şifre Sıfırla, Müşteri, Kişi, Ziyaret, Yeni
//     Müşteri, ZPot, Görev modalları). yetkiRolModal İptal yanlış gri
//     (.navy3) kullanıyordu → kesin İptal rengine çekildi. (b) ONAYLA/
//     DEVAM/TAMAMLA — kural netleşti: bu aile artık HER ZAMAN Kaydet ile
//     birebir aynı düz dolgu yeşil (fark sadece ikon). 9 yerde bordürlü
//     yeşil kalmıştı (Pipeline/Temas/Ziyaret/Müşteri Raporu Getir x4,
//     Portföy Onayla ve Güncelle, Plan Tamamlandı, Fırsat Onayla, Fırsat
//     İptal Onayı, TDM Kullanıcı Onayla) → düz yeşile çevrildi; ✓ ikonu
//     eklendi (Talebi Gönder, Sevkiyatı Tamamla). (c) .btn-green SINIFI
//     EMEKLİ EDİLDİ — bu sınıf siyah metin kullanıyordu, standart dışıydı;
//     5+ Kaydet tuşu (Hedef Tümünü Kaydet, Yetki Kaydet, Görev Tipi
//     Kaydet, Arama Ayar Kaydet, Donanım Süreç Ayar Kaydet) ve Tamamla
//     tuşu açık background:var(--green);color:#04301f; + ikon ile
//     değiştirildi. (d) SİSTEMİK KIRMIZI-VARSAYILAN HATASI — class="btn"
//     olup background tanımlamayan 7 tuş, .btn taban sınıfının kırmızı
//     varsayılanına düşüyordu (Giriş Yap, Bağlan/Setup, Talebi Gönder,
//     TDM Mesaj Gönder, Yeni Talep, Aramadan Kapat, Veri Kalitesi Tekrar
//     Tara) → doğru renklere (mavi/yeşil) çekildi. (e) MOR İHLALİ —
//     Görev "▶ Başla" tuşundaki satır-içi mor (#a78bfa) kaldırıldı, Oktay
//     onayıyla yeşile çevrildi (Onayla ailesi). Görev Tipi "Ekle" tuşu
//     .btn-green'den mavi (Yeni Kayıt ailesi) yapıldı. (f) admin.js —
//     uygulamaAyarlariSekmeAc() fonksiyonel hatası düzeltildi: sekme
//     butonları aktif/pasif renk mantığı çalışmıyordu (ikisi de .btn
//     varsayılanından kırmızı görünüyordu), donanimTabGeç kalıbına göre
//     açık background ataması eklendi. Dosyalar: index.html, config.js,
//     gorev.js, donanim.js, arama.js, admin.js, yetki.js, hedef.js,
//     main.css.
//   v1.3.91 — APP_VERSION → V31.149. UI FIX: Kapsamlı tam-uygulama tekrar
//     taraması (Oktay'ın bulduğu 3 hatanın ardından). (a) "Aramadan Kapat"
//     (arama.js), Görev Tipi düzenleme "İptal" (gorev.js), Donanım Transfer
//     "İptal" (donanim.js), Portföy "İptal" (index.html) — hepsi eski
//     format/btn-ghost kullanıyordu → kesin İptal rengine (#350f18 fon,
//     1.5px #ed2345 çerçeve, beyaz metin) çekildi. (b) Donanım sepet alt
//     çubuğu "Devam Et →" içi dolu yeşile çevrildi (bordürlü Onayla değil);
//     aynı çubuktaki İptal'in width:100% taşması düzeltilip tek satıra
//     alındı. (c) EXCEL TUŞLARI — kuralımız "Excel Aktar/Yükle/İndir =
//     turuncu outline" idi ama 8 yerde hâlâ yeşil/mavi/gri kalmıştı:
//     Donanım Rapor Excel İndir, Pipeline/Temas Raporu/Ziyaret Analizi
//     Excel İndir, Portföy Sonuç Excel İndir, Veri Kalitesi Excel Rapor,
//     Donanım Izgara Excel, Donanım Excel Raporu İndir, Hedef Giriş Excel
//     Yükle — hepsi .btn-orange-outline'a çevrildi. (d) MOR RENK İHLALİ —
//     Arama "Seçilenleri tek görüşmede teyit et" mor kullanıyordu; mor
//     artık sadece Hızlı Sevkiyat'a özel olduğundan maviye çevrildi.
//     (e) ONAYLA/TAMAMLA TUŞLARI — 3 yerde düz dolgu yeşil (Kaydet ile
//     karışan) kullanılmış: Portföy "Onayla ve Güncelle", Plan "Tamamlandı
//     — Temas Gir", Fırsat "Onayla → Gerçekleşen" — hepsi bordürlü Onayla
//     stiline (koyu fon + yeşil çerçeve/metin) çevrildi.
//   v1.3.90 — APP_VERSION → V31.148 (KESİN İPTAL RENGİ). Oktay'ın DeepSeek
//     ile birebir üretip onayladığı spesifikasyon uygulandı: fon #350f18,
//     çerçeve 1.5px solid #ed2345, metin beyaz. (a) main.css → .btn-iptal
//     sınıfı bu değerlere güncellendi — uygulama genelindeki tüm "İptal"
//     tuşlarını kapsar. (b) temas.js → setOpportunityConfirm() — Temas
//     ekranı 7. bölüm "Bu temastan fırsat doğdu mu?" sorusunda "Hayır"
//     seçili durumu aynı değerlere çekildi. "Onayla/Evet" (yeşil) tuşlarına
//     KESİNLİKLE dokunulmadı, Oktay'ın açık talimatıyla. Not: bir önceki
//     v1.3.88 kaydında denenen ara format (transparent dolgu + #ff8ca2
//     metin) yanlıştı, bu kayıtla geçersiz — kalıcı doğru değer budur.
//   v1.3.87 — APP_VERSION → V31.146. UI FIX: "Yeni Müşteri Kartı" modalı
//     bir önceki round'da kaçmıştı — İptal (btn-ghost/siyah) → .btn-iptal,
//     Kaydet (yeşil ama .btn-kaydet değildi) → .btn-kaydet + ikon. Aynı
//     kaçan kalıp (İptal tuşunun yanlışlıkla .btn-ghost/Kapat stiliyle
//     kodlanmış olması) tüm index.html'de tarandı: 16 adet daha "İptal"
//     tuşu .btn-ghost kullanıyordu (Donanım Talep/Yeni Ürün/Dağıtım/Excel/
//     Sepet/Transfer/Seçim modalleri, Zpot, Şifre Değiştir/Sıfırla, Plan
//     Düzenle, Ürün, Hedef Kalemi, Kullanıcı, Müşteri Düzenle, HM Zpot
//     modalleri) → hepsi .btn-iptal'e (hafif kırmızı) çevrildi. Kapat
//     (yan etkisiz gerçek kapatma) ile İptal (bir işlemi vazgeçme)
//     arasındaki ayrım artık uygulama genelinde tutarlı.
//   v1.3.86 — APP_VERSION → V31.145. UI FIX: Oktay'ın 13 maddelik ekran
//     taramasına göre tüm uygulama genelinde renk standardı süpürmesi.
//     Düzeltilenler: Donanım Reddet tuşu format hatası; "Devam Et" (Emei
//     girişi) Onayla rengine; "Ön Rezervasyon Oluştur" Onayla rengine;
//     Temas/Fırsat/Kontak modallarının "Kaydet" tuşları (hâlâ kırmızı/mavi
//     kalanlar) .btn-kaydet yeşiline; Donanım Depo&Muhasebe "Excel ile
//     Stok Yükle" siyah tuşu turuncu outline'a; "Hızlı Sevkiyat Başlat"
//     çift çerçeveli mor özel tuş; Yeni Görev "İptal" tuşu düzeltmesi;
//     Arama menüsü "Ara" mavi (yeni kayıt), "Aramadan Kapat" iptal rengi;
//     Teyit arama "Vazgeç" iptal rengi; Arama analiz "Uygula" yeşil/onay;
//     Temas raporu "Raporu Getir" yeşil/onay. Ayrıca aynı mantıkla
//     uygulama genelinde ek taramada bulunan uyumsuzluklar: 9 adet Kaydet
//     tuşu (Zpot/Plan/Ürün/Hedef Kalemi/Kullanıcı/Müşteri/Fırsat/HM Zpot
//     modalleri) hâlâ mavi idi → .btn-kaydet yeşiline çevrildi; Veri
//     Kalitesi "Taramayı Başlat" kırmızıdan maviye (yıkıcı işlem değil);
//     Veri Kalitesi "Seçilenleri Düzelt" düz yeşilden Onayla çerçeveli
//     yeşile; Fırsat modalı "İptal Talebi Onayı" (Onayla/Reddet) ve
//     Müdür Onayı ikinci seçim tuşu (mor → amber, mor artık sadece Hızlı
//     Sevkiyat'a özel); Görev sapma bildirimi "Evet Kapansın/Hayır
//     Tamamlanmadı" Onayla/Reddet çerçeveli stiline; Fırsat İptal Onayı
//     (hedef.js) Onayla/Reddet çerçeveli stiline. Bu round'da CSS
//     class'ları (main.css) değişmedi — tüm düzeltmeler inline stil veya
//     mevcut .btn-kaydet/.btn-confirm/.btn-reddet kalıplarıyla yapıldı.
//   v1.3.85 — APP_VERSION → V31.144. UI FIX: Tüm uygulamadaki "+ Yeni X"
//     tuşları taranıp maviye çevrildi (Yeni Kayıt = her zaman mavi kuralı):
//     + Yeni Ürün, + Yeni Kullanıcı, + Yeni Hedef Kalemi, + Yeni Görev
//     Oluştur, + Yeni Ekle, + Listeye Ekle, + Yeni Kişi (x2), + Yeni
//     Müşteri Kartı Aç (x2, amber'den mavi dolguya), + Ekle (fırsat ürün
//     satırı). Artık uygulamada bu kuralı çiğneyen tuş kalmadı.
//   v1.3.84 — APP_VERSION → V31.143. UI FIX: Müşteri kartındaki "+ Kontak"
//     (yeşildi) ve "+ Temas" (renksizdi) tuşları maviye çevrildi — "Yeni
//     Kayıt her zaman mavi" kuralına uymuyorlardı. Aynı sebeple Donanım
//     Talep ekranındaki "+ Ürün Ekle" de maviye çevrildi. NOT: taramada
//     aynı kuralı çiğneyen çok daha fazla "+ Yeni X" tuşu bulundu (Yeni
//     Ürün, Yeni Kullanıcı, Yeni Hedef Kalemi, Yeni Görev, Listeye Ekle vb.
//     — yeşil/amber/gri karışık) — bu round'a dahil edilmedi, onay bekliyor.
//   v1.3.83 — APP_VERSION → V31.142. UI: Kırmızı aile son hali —
//     .btn-reddet artık Onayla ile birebir aynı yapı (fon #000 tam siyah,
//     2px kenarlık, kenarlık=metin rengi var(--red)); .btn-iptal önceki
//     Reddet denemesinin rgba(224,4,42,.12) fonunu koruyor + beyaz metin;
//     .btn-sil değişmedi (tam dolgulu kırmızı). Tuş renk standardı
//     tamamlandı: Kaydet/Onayla yeşil, Sil/Reddet/İptal kırmızı,
//     Rapor/Excel turuncu, Filtrele gri, Kapat saydam.
//   v1.3.82 — APP_VERSION → V31.141. FIX: "Sil ile Reddet formatları
//     değişsin" isteği önceki round'da yanlış yorumlanıp yeni stiller
//     icat edilmişti — doğrusu iki formatın YER DEĞİŞTİRMESİYDİ. Düzeltildi:
//     .btn-sil artık tam dolgulu kırmızı (kalıcı işlem, en ağır), .btn-reddet
//     artık kenarlıklı-açık kırmızı (daha hafif). İkisi de main.css'te tanımlı.
//   v1.3.81 — APP_VERSION → V31.140. UI: Tuş standardı son hali —
//     .btn-confirm (Onayla) siyaha yakın fon (#0d1f17) + yeşil çerçeve/metin;
//     .btn-kaydet (Kaydet) düz yeşil dolgu + 💾 ikon alanı; .btn-iptal
//     (İptal) tam opak kırmızı çerçeveli, saydam; .btn-filtre (Filtrele)
//     uygulamadaki tek açık renkli tuş (#9797a8 + siyah metin). Sil ve
//     Reddet formatları henüz onay bekliyor, bu round'a dahil değil.
//   v1.3.80 — APP_VERSION → V31.139. UI: .btn-confirm (Onayla) rengi koyu
//     kırmızıdan yeşile çevrildi — mevcut --green token'ı ("başarı/tamamlandı"
//     anlamında zaten kullanılıyordu), Oktay'ın onayıyla A seçeneği (#00d68f,
//     koyu yeşil metin #04301f) uygulandı.
//   v1.3.79 — APP_VERSION → V31.138. UI: main.css'e .btn-confirm (Onayla —
//     Kaydet'ten farklı, daha koyu kırmızı + ince çerçeve, "sonuçlandırıcı"
//     aksiyon hissi) ve .btn-ghost-fill (Filtrele/Ara/Uygula — Kapat'tan
//     farklı, hafif dolgulu, "veriyi değiştirir" hissi) eklendi. Henüz
//     mevcut Kaydet/Onayla/Kapat/Filtrele tuşlarına uygulanmadı — sadece
//     standart tanımlandı, onay sonrası sweep yapılacak.
//   v1.3.78 — APP_VERSION → V31.137. UI: Tuş renk standardı — main.css'e
//     .btn-orange (Rapor/Getir/Görüntüle tuşları) ve .btn-orange-outline
//     (Excel/Dışa Aktar tuşları) eklendi; .btn-ghost kenarlığı/metin rengi
//     kontrastı yükseltildi (görünmez tuş şikayeti). Stok sekmesindeki
//     Mutabakat Raporu + Stok Hareket Raporu tuşları turuncuya, ilgili iki
//     Excel'e Aktar tuşu yeşilden turuncu-kenarlıklıya çevrildi. Kırmızı
//     sadece birincil/Sil tuşlarında kalmaya devam ediyor (marka rengi).
//   v1.3.77 — APP_VERSION → V31.136. Stok Hareket Raporu Excel çıktısı 7
//     sayfaya çıkarıldı: mevcut "Stok Hareketleri" sayfası aynen korunarak
//     Cihaz Giriş (Detay/Özet), Cihaz Çıkış (Detay/Özet, müşteri+satan MY
//     ile) ve Rezerve Cihazlar (Detay/Özet, KÇM+MY+güncel durum ile) tek
//     .xlsx içinde tek tıkla üretiliyor. Detaylar: donanim.js v1.0.54.
//   v1.3.76 — APP_VERSION → V31.135. YENİ: Stok Hareket Raporu (Stok
//     sekmesi, ayrı yetki: donanim_hareket_raporu_gor) — tüm stok
//     hareketlerini tarih/aksiyon/ürün filtreli listeler. Hem bu rapor hem
//     Mutabakat Raporu artık Excel'e aktarılabiliyor. Detaylar: donanim.js
//     v1.0.53, yetki.js v1.3.1.
//   v1.3.75 — APP_VERSION → V31.134. UI: Mutabakat Raporu butonu Talepler
//     sekmesinden Stok sekmesine taşındı (stok bütünlüğü kontrolü, Depolar/
//     Stok ekranına ait — talep akışıyla değil).
//   v1.3.74 — APP_VERSION → V31.133. Mutabakat Raporu için ayrı yetki
//     anahtarı (donanim_mutabakat_gor, yetki.js v1.3.0) — Rol&Yetki
//     ekranından Depo & Muhasebe rolüne elle atanmalı.
//   v1.3.73 — APP_VERSION → V31.132. Talepler modülü kritik açık kapatıldı:
//     "Karşılandı" artık gerçek stok/IMEI kontrolü olmadan basılamıyor.
//     Yeni "📊 Mutabakat Raporu" ekranı: sistem adedi vs IMEI sayısı
//     karşılaştırması, uyuşmazlıkları öne çıkarır. Detaylar: donanim.js
//     v1.0.51 değişiklik notu.
//   v1.3.72 — APP_VERSION → V31.131. Rezervasyon kartı + Geçmiş iyileştirmeleri:
//     ürün adı ve IMEI'ler artık hareket loglarına yazılıyor, "Fatura Kesildi"
//     adımında fatura numarası zorunlu (DB: stok_rezervasyonlari.fatura_no),
//     Geçmiş modalı üstte sepet özetini gösteriyor ve tekrarlı satırları
//     tekilleştiriyor, kartta "Adım N/7" başlığı + "sırada ne var" satırı
//     eklendi. Detaylar: donanim.js v1.0.50 değişiklik notu.
//   v1.3.71 — APP_VERSION → V31.130. YENİ ÖZELLİK: Donanım rezervasyon
//     kartlarına (1) görünür kısa ID rozeti (REZ-XXXXXXXX, sepet_id'nin ilk
//     8 hanesi) ve (2) "📜 Geçmiş" butonu eklendi. Geçmiş, o rezervasyona ait
//     tüm hareketleri (kim ne zaman onayladı/reddetti/IMEI girdi/gönderdi)
//     zaman sıralı listeler. DB: stok_hareketleri tablosuna sepet_id (uuid,
//     nullable) kolonu eklendi (Oktay tarafından çalıştırıldı); tüm
//     rezervasyon hareket logları (_donanimRezHareketLog) artık bunu da
//     yazıyor. NOT: bu tarihten ÖNCEKİ hareket kayıtlarında sepet_id boş —
//     eski rezervasyonların Geçmiş'i bu yüzden boş görünebilir, bu beklenen
//     bir durum, hata değil.
//   v1.3.70 — APP_VERSION → V31.129. UI: Aynı marka ikonu (konum iğnesi + insan
//     silueti) artık tarayıcı sekmesinde de görünüyor — yeni favicon.svg
//     dosyası eklendi, index.html <head>'e <link rel="icon"> ile bağlandı.
//   v1.3.69 — APP_VERSION → V31.128. UI: Giriş ekranı marka ikonu — onay işareti
//     yerine, iğnenin içine küçük bir insan silueti (kafa+omuz) yerleştirildi;
//     "insan faktörü" eksikti. Artık ikon hem konumu (saha) hem sahadaki
//     kişiyi (temsilci) tek sembolde birleştiriyor.
//   v1.3.68 — APP_VERSION → V31.127. UI: Giriş ekranındaki marka rozeti — artık
//     "Şengüller" markasını taşımayan "Ş" harfi yerine, konum iğnesi içine
//     yerleştirilmiş onay işareti ikonu (saha ziyareti + otomasyonla
//     tamamlanma temasını tek sembolde birleştiriyor). index.html, iki brand
//     bloğunda da (login + kayıtlı-oturum ekranı) değiştirildi.
//   v1.3.67 — APP_VERSION → V31.126. KÖK NEDEN FİX: KÇM'den KÇM'ye stok
//     transferinde hedefte satır yoksa yeni satır depo_id'siz açılıyordu —
//     bu, Depo modülünün göremediği "yetim" stok kayıtları üretiyordu.
//     Artık hedef KÇM'nin kayıtlı ANA depo_id'si kullanılıyor (donanim.js
//     v1.0.48).
//   v1.3.66 — APP_VERSION → V31.125. UI FIX: SVK Cihazlar adımında adet kutusu
//     ürün adının üzerine biniyordu — CSS özgüllük çakışması (main.css,
//     donanim.js v1.0.47).
//   v1.3.65 — APP_VERSION → V31.124. BUG FİX: Stok listesi ekranındaki Merkez
//     (Havuz) satırı da ham toplam/müsait gösteriyordu; bu, rezervasyon
//     adedinin üst sınırını da etkilediği için zaten dağıtılmış stoktan
//     tekrar rezervasyon yapılabiliyordu (donanim.js v1.0.46).
//   v1.3.64 — APP_VERSION → V31.123. BUG FİX: Merkez (Havuz) deposu dağıtım
//     sonrası hiç azalmıyordu; Depo kartları/Depo detay modalı/Stok Raporu
//     dağıtılan miktarı hem Merkez'de hem hedef KÇM'de çift sayıyordu
//     (donanim.js v1.0.45).
//   v1.3.63 — APP_VERSION → V31.122. BUG FİX: Donanım Takip rozeti Transfer
//     taleplerini (Aşama 1/Aşama 2 onayı bekleyenler) hiç saymıyordu
//     (donanim.js v1.0.44).
//   v1.3.62 — APP_VERSION → V31.121. Rezervasyon listesi sıralaması: kendinden
//     onay bekleyenler her zaman en üstte, sonra aktif kayıtlar, sonra
//     Tamamlandı → Reddedildi → Süresi Doldu → İptal (donanim.js v1.0.43).
//   v1.3.61 — APP_VERSION → V31.120. Rezervasyon ekranına filtreler (KÇM/MY-
//     FMY arama/süreç adımı/ödeme tipi/tarih aralığı) + kart altında renkli
//     süreç özet barı ve tüm kenarlarda adım rengiyle çerçeve (donanim.js
//     v1.0.42).
//   v1.3.60 — APP_VERSION → V31.119. BUG FİX: Turkcell Finans Onayı ile Fatura
//     Kesildi tek butonda birleşmişti; Depo&Muhasebe ekranında ayrı bir "Fatura
//     Kesildi" adımı hiç görünmüyordu. Aralarına 'Finans Onaylandı' ara durumu
//     eklendi (donanim.js v1.0.41).
//   v1.3.59 — APP_VERSION → V31.118. BUG FİX: Donanım Takip rozeti Turkcell
//     Finans Onayı ve Fatura Kesildi (sevk) bekleyen kayıtları hiç saymıyordu
//     — finans onaycılarında rozet hiç görünmüyordu (donanim.js v1.0.40).
//   v1.3.58 — APP_VERSION → V31.117. (1) Donanım modülü artık her açıldığında
//     ilk ekran Rezervasyon sekmesi oluyor (önceden Stok). (2) IMEI seçimi
//     artık Turkcell Finans Onay'dan ÖNCE, "Stok Onay / Emei Giriş" adımının
//     kendisinde yapılıyor — talep edilen tüm cihazların IMEI'leri o adımda
//     girilmeden Finans Onay'a geçilemiyor (donanim.js v1.0.39).
//   v1.3.57 — APP_VERSION → V31.116. Ana menü Donanım Takip ikonu rozeti
//     artık onay/red bekleyen kayıtları da sayıyor (donanim.js v1.0.38).
//   v1.3.56 — APP_VERSION → V31.115. ACİL FIX (donanim.js v1.0.37): ortak/Merkez
//     havuz stoktan sipariş verilince "null value in column kcm_id" hatası
//     veriyordu — kcm_id artık satan MY'nin kendi KÇM'sinden alınıyor.
//   v1.3.55 — APP_VERSION → V31.114. Donanım Satış Süreç Akışı V2'nin asıl
//     süreç kodu (donanim.js v1.0.36): Ön Rezervasyon artık rezerve_adet'e
//     doğrudan düşer, 6+6 saatlik süre + uzatma + mükerrer talep onayı,
//     "Hazırlanıyor" adımı kalktı, yeni 8 adımlı akış (Stok Onay/Emei Giriş →
//     Turkcell Finans Onay → Emei Eşleştirme → Fatura → Tamamlandı).
//     GEREKLİ: sistem_ayarlari SQL'i henüz çalıştırılmadıysa varsayılan
//     değerlerle (6/6/1/48/2) çalışır. Rol&Yetki'de yeni 4 izni + donanim_imei_gor
//     iznini ilgili rollere atamak Oktay'ın yapması gereken bir adım.
//   v1.3.54 — APP_VERSION → V31.113. Donanım Satış Süreç Akışı V2 (adım 1-3):
//     yetki.js'e 4 yeni izin (donanim_onrez_uzat, donanim_mukerrer_onay,
//     donanim_emei_giris, donanim_finans_onay); Admin Panel "Arama Ayarları"
//     kutusu "Uygulama Ayarları" oldu, 2 sekme: Arama Ayarları (aynı) +
//     Donanım Satış Süreç Ayarları (yeni, sistem_ayarlari üzerinden 5 yeni
//     parametre — admin.js v1.1.5). Donanım süreç kodu (donanim.js) HENÜZ
//     GÜNCELLENMEDİ, sıradaki adım.
//   v1.3.53 — APP_VERSION → V31.112. Marka adı: uygulama genelinde "Şengüller
//     Saha Satış" ifadesi "Saha Satış Otomasyonu" olarak değiştirildi
//     (index.html — sayfa başlığı, giriş ekranı, tüm app-footer'lar, 27 yer).
//   v1.3.52 — APP_VERSION → V31.111. FIX: Ana Menü'deki sabit (fixed)
//     app-footer'ın V31.108'de yanlışlıkla kaldırılması geri alındı — diğer
//     tüm ekranlarla aynı şekilde geri geldi (auth.js v1.2.24). Donanım Takip:
//     Talepler sekmesindeki "➕ Yeni Talep" butonu artık MY/FMY'de de
//     görünüyor (donanim.js v1.0.35).
//   v1.3.51 — APP_VERSION → V31.110. UI: Donanım Takip > Stok sekmesindeki
//     mavi "📌 Rezervasyon" tuşu, Rezervasyon sekmesindeki tuşla tutarlı
//     olacak şekilde "📌 Yeni Rezervasyon" olarak değiştirildi.
//   v1.3.50 — APP_VERSION → V31.109. UI: "Yönetici Paneli" kutusu ayrı
//     bölümden çıkarılıp Ana Menü ızgarasına taşındı — "Uygulama Taleplerim"
//     ile aynı satıra, diğer kutular gibi 1/2 (yarım) genişlikte giriyor
//     (auth.js v1.2.23).
//   v1.3.49 — APP_VERSION → V31.108. FIX: Ana Menü düzeni — "Uygulama
//     Taleplerim" kutusu ana menü ızgarasına taşındı, görünür kutu sayısı
//     tek olduğunda son kutu (Hangi Müşteriye Gidelim / Uygulama Taleplerim)
//     artık yanında boşluk bırakmadan tam satırı kaplıyor (auth.js v1.2.22,
//     menu-box-full CSS sınıfı). FIX: Ana Menü'de iki ayrı versiyon yazısı
//     ("Yükleniyor..." satırı + alt app-footer) tek satıra indirildi.
//   v1.3.48 — APP_VERSION → V31.107. UI: Temas Raporu/Temas Analizi sekme
//     tuşları alttaki KÇM kutusu genişliğine eşleşecek şekilde büyütüldü
//     (flex:1). Ana Menü: "Talep Gir" ve "Taleplerim" tek kutuya birleştirildi
//     — "Uygulama Taleplerim" (Taleplerim ekranına açılır, üstüne "Yeni Talep"
//     tuşu eklendi, liste altında kalmaya devam ediyor). "Geri Bildirim" bölüm
//     başlığı kaldırıldı.
//   v1.3.47 — APP_VERSION → V31.106. Görev tipi adları düzeltildi: "Şikayet
//     Kaydı" → "Müşteri Şikayeti" (mevcut aynı adlı type_id ile birleştirildi,
//     duplicate giderildi), "Talep Kaydı" → "Müşteri Talebi". task_types SQL
//     güncellemesi + mevcut 15 görevin tasks.baslik metni + arama.js kod
//     referansları (v1.1.14) birlikte uygulandı.
//   v1.3.46 — APP_VERSION → V31.105. KRİTİK FIX: Temas Analizi ekranında MY/
//     FMY/USER rolündeki kullanıcılar kendi KÇM'sindeki TÜM MY/FMY'lerin
//     temasını görebiliyordu (filtre alanları bu roller için gizli olduğundan
//     kendilerini daraltamıyorlardı, sorgu varsayılan olarak tüm KÇM'yi
//     getiriyordu). Artık bu roller için sorgu her zaman sadece kendi kaydına
//     kısıtlı (rapor.js v1.2.9).
//   v1.3.45 — APP_VERSION → V31.104. "Satış Potansiyeli" (eski adı Ziyaret
//     Potansiyeli) ekran düzenlemesi + ÇOKLU neden seçimi: Müşteri Düzenle
//     modalında özel çerçeveli/renkli kutuya alındı, IT Ekibi'nin üstüne
//     taşındı; IT/Sunucu/Şube/Firewall satırları artık soru-cevap aynı
//     satırda. Neden seçimi tek <select> yerine tıklanabilir kutucuklara
//     (birden fazla seçilebilir) çevrildi — hem Müşteri Düzenle'de hem de
//     "Hangi Müşteriye Gidelim" (eski adı "Hangi Müşteri?") ekranındaki yeni
//     hızlı modalda (hmZpotModal — "⚠ Müşteri Potansiyeli İşaretle" butonu,
//     tam profile gitmeden işaretler). Veri modeli DEĞİŞMEDİ — mevcut
//     ziyaret_potansiyeli_yok_nedeni kolonu, seçilen nedenler ' | ' ile
//     birleştirilip yazılıyor. Değişen dosyalar: temas.js v2.10.50,
//     gorev.js v1.2.17, index.html.
//   v1.3.44 — APP_VERSION → V31.103. YENİ: "Ziyaret Potansiyeli Yok" işaretleme.
//     Batık/iflas, tabela firması, ulaşılamayan veya rakipte çok memnun olup
//     değiştirilemeyen müşteriler artık işaretlenip ziyaret hedefi/penetrasyon
//     hesaplarından ayrıştırılabiliyor. customers tablosuna 4 yeni kolon
//     gerekiyor (bkz. SQL notu): ziyaret_potansiyeli_yok (bool),
//     ziyaret_potansiyeli_yok_nedeni (text), ziyaret_potansiyeli_yok_tarih
//     (timestamptz), ziyaret_potansiyeli_yok_kullanici (text). Akış: "Hangi
//     Müşteri?" ekranından "Müşteri Profiline Git" ile müşteri kartı açılır
//     (gorev.js+musteri.js), orada Müşteri Düzenle modalında (temas.js)
//     işaretlenir — MY/FMY işaretleyebilir, sadece KÇM MÜDÜRÜ/OPERASYON
//     MÜDÜRÜ/ADMIN/SATIŞ DİREKTÖRÜ/TAKIM LİDERİ kaldırabilir. Ziyaret
//     Analizi'ne (rapor.js) 4. sekme "Potansiyel Değil" eklendi, Excel 5
//     sekmeye çıktı. Değişen dosyalar: temas.js v2.10.49, gorev.js v1.2.16,
//     musteri.js v1.2.1, rapor.js v1.2.8, index.html (custEditModal + Ziyaret
//     Analizi 4. sekme + pageHangiMusteri butonu).
//   v1.3.43 — APP_VERSION → V31.102. KRİTİK FIX: Duyurular ekranı "column
//     duyuru_feed.musteri_my_id does not exist" hatasıyla kırılıyordu (admin/
//     gölge hesapla görüntülemede tetiklendi) — applyRBAC'ın genel PRT+ dalı
//     duyuru_feed'de olmayan bir kolona bakıyordu. duyuru.js'e sadece var olan
//     kolonlarla (my_id/kcm_id) çalışan _duyuruApplyScope() eklendi (duyuru.js
//     v1.0.1).
//   v1.3.42 — APP_VERSION → V31.101. Görev Yönetimi: ikon/rozet iyileştirmesi
//     (✅ ikon, büyük rozet, Görevler ekranı açılmasa bile güncel bekleyen
//     sayısı + Ana Menü'ye her dönüşte toast bildirimi), filtre chip satırı
//     alttaki kutularla aynı toplam genişliğe getirildi. YENİ: Ana Menü'ye
//     "Hangi Müşteri?" modülü eklendi — portföyde hiç ziyaret edilmemiş
//     (yoksa en uzun süredir ziyaret edilmeyen) bir müşteri önerip "Devam" ile
//     temas planlama formunu açıyor (gorev.js v1.2.15, auth.js v1.2.21,
//     utils.js v1.0.4).
//   v1.3.41 — APP_VERSION → V31.100. Görev Yönetimi ekranına: Görev Tipi
//     filtresi (DB'den dinamik), KÇM/Takım/MY personel filtresi (geniş
//     görüşlü roller), Durum filtresi (mevcut chip filtrelerin yanına ek
//     satır, Gecikmiş dahil), Sıralama (Tarih/Görev Tipi/Durum) eklendi.
//     Listeden "Tamamla" artık bağlı formu (ziyaret/şikayet/fırsat/
//     potansiyel) varsa önce o formu açıyor, form kaydedilince görev
//     otomatik Tamamlandı'ya geçiyor (gorev.js v1.2.14).
//   v1.3.40 — APP_VERSION → V31.99. FIX: Donanım Takip > Depolar sekmesi
//     genişleyince (.page.genis) üst çubuk (topbar) 480px'e sıkıştırılıp
//     ortalanıyordu — bu, açık renkli (--navy2) topbar'ın koyu (--navy) sayfa
//     zemininin ortasında dar/yüzen bir kutu gibi görünmesine ve sekmeler
//     arası geçişte rahatsız edici bir görünüme yol açıyordu. Artık topbar'ın
//     arka planı geniş sayfayı dikişsiz kaplıyor, sadece içeriği (geri tuşu +
//     başlık) padding ile 480px'lik alana ortalanıyor (css/main.css).
//   v1.3.39 — APP_VERSION → V31.98. FIX: Talepler > Yeni Talep akışı artık
//     GERÇEK sepet mantığıyla çalışıyor — ürün seçilince tek ürün modalı
//     yerine sepete ekleniyor, "+ Ürün Ekle" ile başka ürün de eklenebiliyor,
//     her satırın kendi adet kutusu ve silme tuşu var, sepet tek seferde
//     (tek müşteri ile) gönderiliyor. Stok sekmesindeki tekli "🛒 Talep Et"
//     kartı da artık aynı sepete ekliyor (donanim.js v1.0.34).
//   v1.3.38 — APP_VERSION → V31.97. Donanım Takip ekran düzeni: Hızlı Sevkiyat
//     Ana Menü'den kaldırıldı, Stok+Rezervasyon sekmelerinin üstüne taşındı;
//     Yeni Ürün Ekle/Excel ile Stok Yükle sadece Stok sekmesine taşındı.
//     Rezervasyon sekmesine "Yeni Rezervasyon", Talepler sekmesine stokta
//     olmayan ürünlerden seçim yaptıran "Yeni Talep" eklendi. Depolar
//     sekmesinin geniş modu artık sadece dağıtım ızgarasını genişletiyor,
//     üst bölüm (başlık+sekme şeridi) diğer sekmelerle aynı ölçüde kalıyor
//     (donanim.js v1.0.33, auth.js v1.2.20, index.html, css/main.css).
//   v1.3.37 — APP_VERSION → V31.96. FIX: Yönetici Paneli > Hedef Yönetimi >
//     Hedef Girişi ekranı hiç kapsam kontrolü yapmıyordu, her yönetici tüm
//     şirket personelini görüyordu (hedef.js v1.2.8, yetki.js v1.2.8, bkz.
//     o dosyalar). Yeni 'hedef_giris' kapsam modülü Rol & Yetki ekranında
//     ayarlanabilir hale geldi.
//   v1.3.36 — APP_VERSION → V31.95. FIX: KÇM Müdürleri Görev modülünde tüm
//     KÇM'lerin görevlerini görebiliyordu — kapsam kontrolü Rol ekranındaki
//     ayarı hiç okumuyordu (gorev.js v1.2.13, bkz. o dosya).
//   v1.3.35 — APP_VERSION → V31.94. FIX: Ziyaret Analizi "Portföy Dışı"/MY Özet
//     sekmelerinde KÇM sütunu müşterinin KÇM'sini gösteriyordu, ziyareti yapan
//     MY'nin kendisini değil (rapor.js v1.2.7, bkz. o dosya).
//   v1.3.34 — APP_VERSION → V31.93. FIX: Ziyaret Analizi Excel İndir butonu
//     .hide!important yüzünden hiç görünmüyordu (rapor.js v1.2.6, bkz. o dosya).
//   v1.3.33 — APP_VERSION → V31.92. ZİYARET ANALİZİ: standalone "Ziyaret
//     Raporu V2.0" HTML aracı Temas Raporu ekranına 2. sekme olarak entegre
//     edildi (rapor.js v1.2.5, index.html pageTemasRapor). Yeni izin
//     eklenmedi — mevcut rapor_temas scope'u kullanılıyor.
//   v1.3.32 — APP_VERSION → V31.91. Veri Kalitesi alan haritasına 4 yeni
//     kontrol eklendi (SQL, devir notundaki "Müşteri Ünvanı" ve "MY Adı"
//     madde 2 kalemleri tamamlandı): contacts.musteri_unvani, duyuru_feed.
//     unvan, stok_tedarik_talepleri.musteri_unvani (hepsi MUSTERI_UNVANI,
//     kaynak customers.unvan via ncst) + duyuru_feed.my_adi (MY_ADI, kaynak
//     users.ad_soyad via my_id). veri_kalite_denetim.js: _VK_PK_KOLONLARI'na
//     duyuru_feed(duyuru_id), stok_tedarik_talepleri(talep_id) eklendi.
//     admin.js: KONTROL_ETIKET'e MY_ADI/MUSTERI_UNVANI etiketleri eklendi
//     (ekran + Excel). yedek_*/backup tabloları ve contacts.ad_soyad/
//     gorev_unvani bilinçli olarak kapsam dışı bırakıldı (cache değil).
//   v1.3.31 — APP_VERSION → V31.90. admin.js: "📊 Detaylı Excel Rapor İndir"
//     butonu eklendi (veriKaliteExcelIndir). js/xlsx.full.min.js (SheetJS,
//     zaten yüklü, kullanılmıyordu) ile taramanın TÜM bulgularını (ekran
//     önizlemesiyle sınırlı değil, sayfalanarak) Özet + Detay sekmeli .xlsx
//     olarak indiriyor. Yetki: veri_kalite_calistir (yetki.js'te zaten bu
//     izin için "Excel rapor üretir" açıklaması vardı). Otomatik haftalık
//     rapor üretimi henüz YOK — ayrı adım.
//   v1.3.30 — APP_VERSION → V31.89. veri_kalite_denetim.js
//     _vkIsimTutarsizligiTara PK EŞLEŞTİRME BUG FIX: aynı ilişkiye (örn.
//     aynı kcm_id) bağlı birden fazla satır aynı hatalı cache değerine
//     sahipse hepsi yanlışlıkla tek bir satıra eşleniyor, "Seçilenleri
//     Düzelt" hep o satırı güncelleyip diğerlerini hiç düzeltmeden
//     "uygulandı" işaretliyordu (üretimde 33 kullanıcıdan 1'i gerçekten
//     etkilendi — my_id 134, elle SQL ile düzeltildi). Artık PK satırla
//     birlikte ilk sorguda çekiliyor, ayrı eşleştirme adımı kaldırıldı.
//     Ayrıca üretimde ortaya çıktı: kcm_groups.kcm_adi (kcm_id=6) kaynakta
//     sondaki boşluk hatası içeriyordu — SQL ile trim edildi (kaynak da
//     bozuk olabilir, motor bunu otomatik ayırt edemez, admin görsel
//     kontrol etmeli). Excel export ve otomatik haftalık rapor henüz YOK.
//   v1.3.29 — APP_VERSION → V31.88. admin.js _vkSonucRenderla DÜZELTME:
//     önizleme sorgusu tek seferde .order('id').limit(500) çekiyordu; bu
//     taramada 819 NCST orphan bulgusu (öneri yok) id sırasında ilk 500'ü
//     tamamen doldurduğu için 33 KÇM Adı bulgusu (öneri VAR) hiç
//     görünmüyor, "0 satır düzeltilebilir" yazıyor, checkbox/"Seçilenleri
//     Düzelt" butonu çıkmıyordu. Artık öneri taşıyan (onerilen_deger NOT
//     NULL) ve taşımayan satırlar AYRI sorgulanıp birleştiriliyor;
//     düzeltilebilir sayısı count:'exact' ile tam olarak hesaplanıyor.
//     Excel export ve otomatik haftalık rapor henüz YOK (ayrı adım).
//   v1.3.28 — APP_VERSION → V31.87. YANMIŞ ETİKET DÜZELTMESİ: admin.js
//     V31.86 etiketi altında localhost'a 3 farklı içerikle sunuldu (ilk
//     sürüm, veriSagligi temizliği, checkbox/onay akışı) — kural ihlal
//     edildi, sürüm atlatılarak düzeltildi. Değişiklik özeti V31.86 ile
//     aynı, sadece etiket bozuk.
//   v1.3.27 — APP_VERSION → V31.86. Veri Kalitesi Denetim Modülü (ilk parça):
//     yeni js/veri_kalite_denetim.js (tarama motoru), admin.js'e "Veri Kalitesi
//     Denetim" sekmesi, yetki.js'e 3 yeni izin. SQL: veri_kalite_alan_haritasi,
//     veri_kalite_tespit tabloları + alan haritası ilk kayıtları (bu sürümde
//     çalıştırıldı, ayrı migrasyon dosyası yok — devir notunda kayıtlı).
//     HENÜZ YOK: Excel export, düzeltme onay/uygulama, kontak formu canlı
//     uyarısı, arama modülü notu, durum/tarih kontrolleri.
//   v1.3.26 — APP_VERSION → V31.85. arama.js: Çağrı Analizi'nde TÜM
//     kategorilerdeki kartlara "Takım Lideri" satırı eklendi (MY listesi
//     için tek seferlik users sorgusu, satır başına sorgu yok).
//   v1.3.25 — APP_VERSION → V31.84. arama.js: Çağrı Analizi Şikayet/Talep
//     kartlarına agent_notu önizlemesi eklendi (bazı agent'lar açıklamayı
//     sikayet_metni yerine genel arama notuna yazmış). Görev Oluştur/
//     Yönlendir seçicisi artık tüm MY/FMY kadrosu yerine, kaydın MY'sinin
//     KÇM'sindeki MY/FMY + Takım Lideri + KÇM Müdürü + Operasyon Müdürü ile
//     sınırlı (bkz. _analizGorevOptions).
//   v1.3.24 — APP_VERSION → V31.83. arama.js: Çağrı Analizi Şikayet/Talep
//     kartlarına MY/FMY seçici + "Görev Oluştur" (görev yoksa) / "Yönlendir"
//     (görev varsa) eklendi — atanan_id güncellenip task_logs'a kayıt
//     düşülüyor. Ayrıca varsayılan atama düzeltildi: Şikayet takım lideri
//     zincirine (değişmedi), Talep artık ziyareti yapan MY/FMY'nin kendisine
//     açılıyor (_sikayetTalepGoreviAc yeni manualAtananId parametresi).
//   v1.3.23 — APP_VERSION → V31.82. arama.js: Çağrı Analizi'nde Şikayet/
//     Talep kartlarına açıklama (sikayet_metni) önizlemesi ve bağlı görevin
//     durum rozeti eklendi; rozete tıklayınca Görev modülünün detay modalı
//     açılıyor (parent_task_id üzerinden bağlantı — yeni kolon gerekmedi).
//     gorev.js: openGorevDetay, GÖREV.tasks önbelleğinde olmayan bir görevi
//     artık DB'den çekip açabiliyor (V31.75'teki araSonucDetayAc ile aynı
//     sağlamlaştırma yöntemi) — başka ekranlardan doğrudan görev açmayı
//     mümkün kılıyor.
//   v1.3.22 — APP_VERSION → V31.81. arama.js: "Gelecek" kutusu 2 rakam
//     gösteriyor (toplam/arama yapılacak) ve "Gelecek" sekmesinde Aranacak/
//     Aranmayacak ayrımı geldi — aranmak istemiyor, son N günde teyit
//     edilmiş, aynı gün aynı kişi tekrarı nedenleriyle otomatik ayıklama
//     (detay: arama.js v1.1.9, madde 13).
//   v1.3.21 — APP_VERSION → V31.80. admin.js: Yeni "Arama Ayarları" sekmesi
//     eklendi — arama_sla_gun/arama_cooldown_gun artık admin ekranından
//     düzenlenebiliyor (detay: admin.js v1.1.4). Ayrıca eksik olan
//     arama_sla_gun satırı sistem_ayarlari'na SQL ile eklendi.
//   v1.3.20 — APP_VERSION → V31.79. arama.js: "MY Kırılım / Liderlik
//     Tablosu" başlığı "MY/FMY Ziyaret Performans Değerlendirme" oldu
//     (detay: arama.js v1.1.8).
//   v1.3.19 — APP_VERSION → V31.78. arama.js: Çağrı Analizi kategori
//     kutuları sadeleşti (üstteki özet kutularıyla tekrar edenler ve "Yüz
//     yüze uyuşmazlık" kaldırıldı), "Memnuniyetsiz" → "Düşük Puan" oldu,
//     kalan 7 kutu 3+4 iki satıra düzenlendi (detay: arama.js v1.1.7).
//   v1.3.18 — APP_VERSION → V31.77. arama.js: BUG FIX — Talep seçilince
//     metin yazarken "task oluştur" butonu hiç görünmüyordu, artık her tuş
//     vuruşunda görünürlüğü güncelleniyor (detay: arama.js v1.1.6).
//   v1.3.17 — APP_VERSION → V31.76. arama.js: Şikayet/Talep ayrıldı, şikayet
//     kategorisi (kimi/ne için) detaylandırıldı, şikayet kaydı otomatik takım
//     liderine/müdüre task açıyor, talep için manuel tek-tık task butonu
//     eklendi (detay: arama.js v1.1.5). SQL önkoşulu vardı, uygulandı.
//   v1.3.16 — APP_VERSION → V31.75. arama.js: Çağrı Analizi ekranındaki
//     filtrelenmiş kayıtlar artık tıklanınca tam görüşme detayını açıyor
//     (detay: arama.js v1.1.4).
//   v1.3.15 — APP_VERSION → V31.74. arama.js: "Çağrı Analizi" tuşunun eni
//     üstteki 2'li özet kutu satırı (Gelecek/Tamamlanan) ile aynı genişliğe
//     getirildi, yüksekliği ~3-4px arttı (detay: arama.js v1.1.3).
//   v1.3.14 — APP_VERSION → V31.73. arama.js: "Gelecek" sekmesindeki kartlar
//     artık Aktif sekmedeki fonksiyonlarla bire bir aynı — Ara/Aramadan Kapat
//     butonu ve aynı kişi uyarısı da çalışıyor (detay: arama.js v1.1.2).
//   v1.3.13 — APP_VERSION → V31.72. arama.js: Tamamlanan sayacı "300+" yerine
//     tam rakam gösteriyor (detay: arama.js v1.1.1 değişiklik notu).
//   v1.3.12 — APP_VERSION → V31.71. Ana menüde "Arama" ifadesi "Ziyaret Teyit"
//     olarak değiştirildi, ikonu 📞'dan 🎧 (çağrı merkezi) olarak güncellendi
//     (index.html, menuAramaBox).
//   v1.3.11 — APP_VERSION → V31.70. KRİTİK GÜVENLİK FIX: Arama (Ziyaret Teyit)
//     modülünde hiçbir KÇM/rol kısıtı yoktu, herkes tüm KÇM'lerin arama
//     kayıtlarını görebiliyordu. yetki.js'e 'arama' scope modülü eklendi,
//     arama.js artık customers.kcm_id üzerinden veri kısıtlıyor (detay: arama.js
//     v1.1.0, yetki.js v1.2.6 değişiklik notları).
//   v1.3.10 — APP_VERSION → V31.69. veriyonetimi.js: Devir + Atama/Musteri/
//     Kontak yazma butonlarina cift-tiklama korumasi (islem surerken/bittikten
//     sonra tekrar basilamaz) ve tum 4 sekme icin ortak NCST/KCM/MY detayli
//     Excel raporu (islem bitince otomatik iniyor) eklendi.
//   v1.3.09 — APP_VERSION → V31.68. KRİTİK BUG FIX: veriyonetimi.js — MY Devri
//     (vyDevirExec) ve Atama'daki "düşen müşteri" tasima (vyUygula) customers.
//     my_id'yi guncelliyor ama kcm_id'ye dokunmuyordu; kaynak/hedef farkli
//     KCM'de olursa musteri yanlis KCM'de kalmaya devam ediyordu. 790 kayitlik
//     mevcut birikim SQL ile duzeltildi (ayri islem, kod fix'inden bagimsiz).
//     Koda kalici kural islendi: MY devri/atamasinda KCM ASLA degismez —
//     kaynak/hedef (ve Devir'de C) farkli KCM'deyse islem 3 katmanda engellenir.
//     Ayrica: 9 adet gecersiz customers kaydi (ncst alanina kisi adi/DUMMY
//     yazilmis, hicbir ziyaret/firsati olmayan cop kayitlar) silindi; users.
//     kcm_adi'daki yazim tutarsizliklari (ayni kcm_id icin "KÇM3"/"Şengüller
//     KÇM 3" gibi varyantlar) normalize edildi.
//   v1.3.08 — APP_VERSION → V31.67. KRİTİK BUG FIX: searchMusteri() (musteri.js)
//     .select() içine my_id,kcm_id eklendi. Arama kutusundan müşteri seçildiğinde
//     (selC/selFirsatC/selectPrMusteri vb.) döndürülen obje my_id taşımadığı için
//     visits.musteri_my_id ve opportunities.musteri_my_id NULL yazılıyordu —
//     portföy sahibi bilgisi kaydedilmiyordu (giren = güncel sahip olsa bile).
//     ~3.505 temas + ilgili fırsat kayıtları etkilenmiş, ayrı SQL ile düzeltilecek.
//   v1.3.07 — APP_VERSION → V31.66. Donanim sekme seridi sabit iki satir:
//     ust satir Depolar+Stok, alt satir Rezervasyon+Transfer+Talepler.
//   v1.3.06 — APP_VERSION → V31.65. Hizli Sevkiyat Donanim sekmesinden
//     cikarilip ana menude kendi sayfasina alindi; sekme seridi rahatladi.
//   v1.3.05 — APP_VERSION → V31.64. Donanim: Hizli Sevkiyat konsolu
//     (MY -> musteri -> cihaz -> IMEI -> fatura -> sevk, tek ekran).
//   v1.3.04 — APP_VERSION → V31.63. Donanim: sevkiyat artik stoktan dusuyor
//     (toplam_adet/rezerve_adet + IMEI 'Satildi'); IMEI eslestirme MERKEZ
//     havuzundan yapilir (Faz 7) — KCM siparislerinde IMEI bulunamiyordu.
//   v1.3.03 — APP_VERSION → V31.62. Yeni Ürün Ekle tamamlandı. Depo özeti
//     aile başına tek kart ve ayrı Ana/Cep depo ayrıntı düğmeleri oldu.
//   v1.3.02 — APP_VERSION → V31.61. Donanim Depolar sekmesi: depo dagitim
//     izgarasi (urun satir / depo sutun, anlik kayit, donmus basliklar).
//     Cep depolari yalniz donanim_yonet'te gorunur.
//   v1.3.01 — APP_VERSION → V31.60. Donanim stok filtresi: aciklama tooltip'e
//     tasindi, "Kendi depom" anahtari eklendi (scope=TUM + kcm_id/ADMIN).
//   v1.3.00 — APP_VERSION → V31.59. Donanim: 48 saat kurali IS SAATI oldu;
//     hafta sonu ve resmi tatiller sureyi durdurur, arife gunleri yarim sayilir.
//     SQL: resmi_tatiller tablosu + is_saati_ekle() fonksiyonu.
//   v1.2.99 — APP_VERSION → V31.58. Donanim: 48 saatlik rezervasyon suresi
//             (onayda damga, kartta kalan sure rozeti, Süre Uzat butonu,
//             firsatci supurme). donanim.js v1.0.24.
//             MIGRASYON: sistem_bakim + stok_sure_dolumu_isle() + stok_musait
//             tembel hesap — onceden calistirildi.
//   v1.2.98 — APP_VERSION → V31.57. Donanim: MY/FMY gorunurlugu depo bazli,
//             'Sadece stokta olanlar' anahtari, stokta olmayan urun icin
//             tedarik talebi + Talepler sekmesi (donanim.js v1.0.23).
//             MIGRASYON: yok.
//   v1.2.97 — APP_VERSION → V31.56. Donanim: Depo Stok Raporu (pivot ekran
//             + 3 sayfali .xlsx: Ozet/Detay/Depo Ozet). donanim.js v1.0.22.
//             MIGRASYON: yok.
//   v1.2.96 — APP_VERSION → V31.55. Donanim: 'Depolar' sekmesi — Depo &
//             Muhasebe dagitim ekrani (depo agaci, cep depo, urun bazli
//             adet tahsisi). donanim.js v1.0.21. MIGRASYON: Adim D onceden
//             calistirildi (depolar tablosu + depolar_v + depo_id).
//   v1.2.95 — APP_VERSION → V31.54. Donanim: Excel stok yukleme artik ANA
//             DEPOYA (cihaz havuzu) yapiliyor, KCM/depo secimi kaldirildi,
//             15 haneli IMEI filtresi eklendi (donanim.js v1.0.20).
//             MIGRASYON: yok (Faz 1 SQL onceden calistirildi).
//   v1.2.94 — APP_VERSION → V31.53. Arama modulu: 4 sekme (Yeni/Tekrar/Gelecek/
//             Tamamlanan), filtre kaliciligi + filtreli sayaclar, "aranmak
//             istemiyor" isareti, gorusme suresi sorusu kaldirildi,
//             _analizIzinMyList eq.null 400 bugu duzeltildi (arama.js v1.0.19).
//             MIGRASYON: contacts.aranmak_istemiyor + _tarih kolonlari.
//   v1.2.93 — APP_VERSION → V31.52. V31.51 paketi HATALIYDI: arama.js'te serit
//             fonksiyonu degistirilirken 14 fonksiyon (loadAramaBugun dahil)
//             yanlislikla silinmisti, arama ekrani acilmiyordu. Dosya git'ten
//             geri alinip degisiklikler yeniden uygulandi. V31.51 etiketi
//             yakildigi icin atlandi.
//   v1.2.91 — APP_VERSION → V31.50. _telG() ortak telefon gosterim yardimcisi:
//             kontak/kullanici listelerinde ham telefon basilan 5 nokta bu
//             fonksiyondan geciyor (Excel '.0' artiklari ekranda gorunuyordu).
//   v1.2.90 — APP_VERSION → V31.49. Ayni kisi tespiti + birlesik arama
//             (arama.js v1.0.17). Sema degisikligi yok.
//   v1.2.89 — APP_VERSION → V31.48. Gorev listesi veri kaybi duzeltmesi
//             (gorev.js v1.2.11) + anket kayit hata yakalama (arama.js v1.0.16).
//   v1.2.88 — APP_VERSION → V31.47. Telefon format korumasi (Faz A): tum yazma
//             yollari veri_kalitesi.js dogrulamasindan geciyor. normalizeTel
//             artik TEK ayristirma kaynagi — telefonNormalize() ona delege eder.
//   v1.2.87 — APP_VERSION → V31.46. Telefon normalizasyonu: normalizeTel() +
//             telKopyala() yardimcilari eklendi (Arama modulu telefon kutusu).
//             NOT: V31.45 atlandi — index.html'de config.js?v=v31.45 zaten
//             kullanilmisti, ayni etiketle farkli icerik cache tuzagi olurdu.
//   v1.2.86 — APP_VERSION → V31.44. Portfoy Devri sekmesi + secici cerceve gorunum.
//   v1.2.85 — APP_VERSION → V31.43. Veri Yonetimi B2: MY'ye Atama tam (dosya +
//             mutabakat + dusen tespiti + istatistik + onay).
//   v1.2.84 — APP_VERSION → V31.42. Veri Yonetimi B1: MY secici + 'MY'ye Atama'
//             sekmesi iskeleti (auth.js ext_kod/userSecici).
//   v1.2.83 — APP_VERSION → V31.41. Kontak musteri_unvani eslenebilir + oncelikli
//             doldurma (ncst->customers, yoksa dosya).
//   v1.2.82 — APP_VERSION → V31.40. Kontak onizlemede 'Musteri Unvani' kolonu.
//   v1.2.81 — APP_VERSION → V31.39. Kontak musteri_unvani otomatik doldurma:
//             toplu yukleyici (veriyonetimi v1.2.1) + form emniyet kemeri (temas v2.10.46).
//   v1.2.80 — APP_VERSION → V31.38. Veri Yonetimi v1.2: KONTAK sekmesi
//             (contacts, anahtar ncst+ad_soyad, veri_kalitesi kontrolleri).
//   v1.2.79 — APP_VERSION → V31.37. Veri Yonetimi v1.1: satir bazli 'Isle'
//             secimi, sayfali tablolar (100/sayfa), detayli sonuc raporu + Excel.
//   v1.2.78 — APP_VERSION → V31.36. Veri Yonetimi M3: yazma motoru (Uygula +
//             UPDATE/INSERT + bos-onay + FK dogrulama + rapor/Excel).
//   v1.2.77 — APP_VERSION → V31.35. Veri Yonetimi modulu (M2) + 'portfoy_yukle'
//             izni 'veri_yonetimi' olarak yeniden adlandirildi; Yonetici panelinde
//             'Veri Yonetimi' butonu (rapor.js/yetki.js/veriyonetimi.js).
//   v1.2.76 — APP_VERSION → V31.34. Arama: anket akışı konsolidasyonu
//             (muhatap/görüşmek gate, ziyaret tarihi dinamik metin, "Gelmedi
//             ama Telefonla konuştuk"), "bugün" hesabı Europe/Istanbul takvim
//             gününe düzeltildi (UTC gece 00-03 arası bug), Bekleyen/
//             Tamamlanan tarih filtresi artık ziyaret tarihini baz alıyor,
//             KÇM→MY/FMY iki kademeli + durum + müşteri adı filtreleri
//             eklendi. Detay: index.html V31.34 değişiklik notu. (arama.js v1.0.14)
//   v1.2.75 — APP_VERSION → V31.33. YENİ: Duyurular modülü (js/duyuru.js).
//             Ek yetki YOK — görünürlük Fırsat modülüyle aynı (applyRBAC).
//   v1.2.74 — APP_VERSION → V31.32. FIX: İmpersonation bandı yüksek zoom'da
//             kesiliyordu, "Çık" tuşu erişilemez oluyordu. Kök neden: bant
//             .page/.app-footer/.modal-overlay'in aksine 480px'lik ortalanmış
//             sütuna hiç dahil edilmemişti, geniş ekranda TAM PENCERE
//             genişliğinde render oluyordu — bu da eskiden beri bilinen
//             "bandın topbar'ı örtmesi" sorunuyla aynı kökten. Artık banner
//             de ≥480px ekranlarda diğer sabit elemanlar gibi ortalanmış
//             sütuna kilitleniyor (index.html inline style'dan left/right
//             çıkarıldı, main.css'e taşındı). index.html, main.css.
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
const APP_VERSION = 'V31.155';
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

/* ===== TELEFON NORMALIZASYONU (v1.2.87) =====
   DB'deki telefon verisine DOKUNULMAZ. Normalizasyon sadece goruntu ve
   tel: linki uretimi icin, okuma aninda yapilir.

   Veri denetimi (01.09.2026, contacts 30.625 kayit) sonucu tanimlanan kaliplar:
     +90XXXXXXXXXX / 90XXXXXXXXXX (12 hane)  → dokunma, sadece + ekle
     5XXXXXXXXX          (10 hane)           → basina +90
     0XXXXXXXXXX         (11 hane, 0 ile)    → bastaki 0 at, +90
   Bunlarin DISINDA kalan ~4.784 kayit (eksik haneli, TC no girilmis, coklu
   numara vb.) icin KASITLI OLARAK +90 URETILMEZ — gecerli:false doner,
   cagiran taraf ham degeri gosterir ve arama butonunu pasif birakir.
   Gerekce: yanlis numara cevirmek, numara cevirememekten kotudur.        */
function normalizeTel(raw){
  const bos={ham:'',d:'',ulusal:'',e164:'',goster:'',gecerli:false,tip:''};
  if(raw==null) return bos;
  const ham=String(raw).trim();
  if(!ham) return bos;
  // Excel float artigi: "5379569026.0" → ".0" kuyrugunu at
  const temiz=ham.replace(/[.,]0+$/,'');
  const d=temiz.replace(/\D/g,'');
  let ulusal='';
  if(d.length===12 && d.startsWith('90'))      ulusal=d.slice(2);
  else if(d.length===10 && d.startsWith('5'))  ulusal=d;
  else if(d.length===11 && d.startsWith('0'))  ulusal=d.slice(1);
  // Turkiye alan/operator kodlari: sabit 2/3/4, mobil 5. Digerleri gecersiz.
  if(ulusal.length!==10 || !/^[2345]/.test(ulusal))
    return {ham,d,ulusal:'',e164:'',goster:ham,gecerli:false,tip:''};
  const e164='+90'+ulusal;
  const goster='+90 '+ulusal.slice(0,3)+' '+ulusal.slice(3,6)+' '+ulusal.slice(6,8)+' '+ulusal.slice(8,10);
  return {ham,d,ulusal,e164,goster,gecerli:true,tip:ulusal.startsWith('5')?'GSM':'SABIT'};
}

/* V31.50: TEK NOKTADAN TELEFON GOSTERIMI.
   Listelerde/kartlarda telefon basarken bunu kullan — asla ham `.telefon` yazma.
   Ayristirilabilen numara '+90 5xx xxx xx xx' olur; ayristirilamayan HAM haliyle
   dondurulur (uydurma bicimlendirme yapilmaz).
   Gerekce: DB'deki Excel import artiklari (ornek '5339381058.0') listelerde
   oldugu gibi gorunuyordu. Veri 02.09.2026'da temizlendi, ama bu katman ileride
   gelecek baska bir bozuk kayitta da ekranin duzgun kalmasini garantiler. */
function _telG(raw){
  if(raw==null || String(raw).trim()==='') return '';
  if(typeof telefonMaskele==='function') return telefonMaskele(raw);   // veri_kalitesi.js
  if(typeof normalizeTel==='function'){ const n=normalizeTel(raw); return n.gecerli?n.goster:n.ham; }
  return String(raw);
}

/* Panoya kopyala — Clipboard API + eski tarayici fallback. */
async function telKopyala(metin,etiket){
  const s=String(metin||'').trim();
  if(!s){ toast('Kopyalanacak numara yok','error'); return false; }
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(s);
    }else{
      const ta=document.createElement('textarea');
      ta.value=s; ta.setAttribute('readonly','');
      ta.style.cssText='position:fixed;top:-1000px;left:-1000px;opacity:0;';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,s.length);
      const ok=document.execCommand('copy'); document.body.removeChild(ta);
      if(!ok) throw new Error('execCommand basarisiz');
    }
    toast('Telefon numarası kopyalandı: '+escapeHTML(etiket||s),'success');
    return true;
  }catch(e){
    toast('Kopyalanamadı — numarayı elle alın: '+escapeHTML(etiket||s),'error');
    return false;
  }
}

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
