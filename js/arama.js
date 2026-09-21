// ============================================================
// arama.js — v1.1.14
//   v1.1.14 (16.09.2026, V31.106): Görev tipi adlari "Şikayet Kaydı"/
//     "Talep Kaydı" idi; mevcut "Müşteri Şikayeti" tipiyle çakışıp
//     duplicate type_id olusturuyordu. task_types tarafinda "Şikayet
//     Kaydı" (type_id 28) "Müşteri Şikayeti"ye (type_id 20) birlestirildi,
//     "Talep Kaydı" (type_id 29) "Müşteri Talebi" olarak yeniden adlandirildi
//     (SQL, Oktay tarafindan calistirildi — mevcut 15 gorevin tasks.baslik
//     metni de guncellendi). Bu dosyadaki 4 kod referansi
//     (_sikayetTalepGoreviAc cagrilari, gorevMap sorgusu, _analizGoreviOlustur)
//     yeni isimlerle eslesecek sekilde guncellendi.
//   v1.1.13 (13.09.2026, V31.85): Cagri Analizi'nde TUM kategorilerdeki
//     kartlara "Takım Lideri" satiri eklendi (liderMap, tek seferlik
//     users.takim_lideri_id sorgusuyla — satir basina sorgu degil).
//   v1.1.12 (13.09.2026, V31.84): agent_notu onizlemesi eklendi (bazi
//     agent'lar aciklamayi sikayet_metni yerine buraya yaziyordu). Görev
//     Oluştur/Yönlendir secicisi artik tum MY/FMY yerine kaydin MY'sinin
//     KÇM'sindeki MY/FMY+Takım Lideri+KÇM Müdürü+Operasyon Müdürü ile
//     sinirli (_analizGorevOptions, window.userSecici.kcm_id kullanilarak).
//   v1.1.11 (13.09.2026, V31.83): Cagri Analizi Sikayet/Talep kartlarina
//     MY/FMY secici + "Görev Oluştur"/"Yönlendir" eklendi (window.userSecici
//     kullanilarak, ekstra sorgu yok). _sikayetTalepGoreviAc'e manualAtananId
//     parametresi eklendi; Talep varsayilan atamasi artik ziyareti yapan
//     MY/FMY'nin kendisi (onceden hatali sekilde takim lideri zincirine
//     gidiyordu), Sikayet varsayilani degismedi (takim lideri zinciri).
//   v1.1.10 (13.09.2026, V31.82): Cagri Analizi'nde Sikayet/Talep kartlarina
//     aciklama (sikayet_metni) onizlemesi ve bagli gorevin durum rozetiyle
//     tiklanabilir baglanti eklendi (bkz. _analizGoreviAc, gorevMap).
//   v1.1.9 (13.09.2026, V31.81): "Gelecek" kutusu ve sekmesi ARANACAK/
//     ARANMAYACAK ayrimina kavustu (madde 13). Gelecek kutusunda artik 2
//     rakam var: toplam gelecek temas + bunlardan gercekten "arama
//     yapilacak" musteri sayisi. "Gelecek" sekmesinde, musteri adi arama
//     kutusunun ustune 2 kutu geldi: Aranacak / Aranmayacak. Aranmayacak
//     secilince kayitlar NEDEN + renk koduyla (kirmizi: aranmak istemiyor,
//     turuncu: son N gunde zaten teyit edilmis, mavi: ayni kisi bugun baska
//     firma icin zaten aranacak) listelenir, arama butonu yok. N gun degeri
//     admin ekranindaki "Arama Ayarlari" -> "Teyit aramasi tekrar araligi"
//     ayarindan (sistem_ayarlari.arama_cooldown_gun) okunur — V31.80'de
//     eklenen ayni ayar, tekrar kullanildi. Yeni fonksiyon:
//     _aramaGelecekAranacakHesapla() — veri her tazelendiginde bir kez
//     hesaplanir (ARAMA._gelecekAranacakMap), filtre degisince tekrar DB
//     sorgusu atilmaz.
//   v1.1.8 (13.09.2026, V31.79): "MY Kırılım / Liderlik Tablosu" başlığı
//     "MY/FMY Ziyaret Performans Değerlendirme" olarak değiştirildi (isim
//     değişikliği, fonksiyon aynı).
//   v1.1.7 (12.09.2026, V31.78): Cagri Analizi kategori kutulari sadelestirildi.
//     "Henuz aranmamis"/"Tekrar aranacak"/"Tamamlanan" kaldirildi (bu ekranin
//     hemen ustundeki ozet kutulariyla birebir tekrar ediyordu) ve "Yuz yuze
//     uyusmazlik" kaldirildi (Oktay'a gore ne oldugu anlasilmiyordu). Kalan 7
//     kategori artik 2 satirda: ustte 3 genis kutu (Ulasilamayan/Sahte
//     ziyaret/Aramadan kapatilan — uzun metinler tek satira sigsin), altta 4
//     dar kutu (Supheli/Dusuk Puan/Sikayet/Talep). "Memnuniyetsiz" -> "Dusuk
//     Puan" oldu (metin kutuya sigmiyordu), etiket 2 satira ("Dusuk"/"Puan")
//     bolunerek dar kutuya sigdirildi.
//   v1.1.6 (12.09.2026, V31.77): BUG FIX — "Talep" secildiginde metin
//     yazildikca "Bu talep icin task olustur" butonu hic gorunmuyordu.
//     Neden: textarea'nin oninput'u kasitli olarak tam yeniden cizim
//     yapmiyordu (imlec/focus korunsun diye — bkz. _anketText yorumu), ama
//     butonun gorunurlugu de sadece tam yeniden cizimde hesaplaniyordu; agent
//     baska bir cip'e tiklamadan yazi yazip dogrudan butona basmak isteyince
//     buton ekranda hic olusmuyordu. Fix: buton artik HER ZAMAN DOM'da,
//     her tus vurusunda (_anketTalepBtnGuncelle) formu yeniden cizmeden
//     sadece gizli/gorunur durumu guncelleniyor.
//   v1.1.5 (12.09.2026, V31.76): Sikayet/Talep ayrimi. Eskiden tek "Sikayet /
//     talep var mi?" Evet/Hayir kutusuydu, ikisi ayrilmadan tek bir metin
//     alanina yaziliyordu. Simdi: kayit_turu ('sikayet'/'talep') ayri kolon;
//     sikayet secilirse kimi sikayet ettigi (MY/FMY, Turkcell genel, Fiyat/
//     hizmet politikasi) ve MY/FMY ise 5 alt nedenden biri sorulur. Sikayet
//     kaydedilince OTOMATIK olarak (ziyareti yapan MY'nin takim liderine,
//     yoksa KCM Muduru'ne, o da yoksa Operasyon Muduru'ne) "Sikayet Kaydi"
//     task'i acilir — best-effort, basarisiz olsa da arama kapanmaya devam
//     eder (agent'a hata gosterilir, manuel yonlendirme istenir). Talep
//     secilirse otomatik task acilmaz — agent metni yazdiktan sonra "Bu
//     talep icin task olustur" butonuyla TEK TIKLA "Talep Kaydi" task'i
//     acabilir (ayni yonlendirme mantigi, manuel tetiklenir). Cagri Analizi:
//     "Sikayetli" kutusu "Sikayet" olarak yeniden adlandirildi ve ayri
//     "Talep" kutusu eklendi (ikisi de artik kayit_turu uzerinden filtreleniyor,
//     eskiden ikisi de tek sikayet_var bayragina karisiyordu). Detay ekraninda
//     yeni alanlar (kayit turu, kimi sikayet, sikayet konusu) gorunuyor.
//     SQL onkosul: arama_sonuclari.kayit_turu/sikayet_kimi/sikayet_my_neden
//     kolonlari + task_types'a "Sikayet Kaydi"/"Talep Kaydi" satirlari eklendi.
//   v1.1.4 (12.09.2026, V31.75): Cagri Analizi ekranindaki filtrelenmis kayit
//     kartlari onceden tiklanamiyordu (onclick yoktu, task_id sorgudan
//     dusuruluyordu). Simdi her karta tiklandiginda tam gorusme detayi
//     (araSonucDetayAc) aciliyor. Ayrica araSonucDetayAc, ARAMA.tasks bellek
//     onbelleginde olmayan gorevler icin veritabanindan dogrudan cekim
//     yapacak sekilde saglamlastirildi (Cagri Analizi farkli/daha genis bir
//     sorgu kullandigi icin oncesinde "Kayit bulunamadi" hatasi olabiliyordu).
//   v1.1.3 (12.09.2026, V31.74): "Çağrı Analizi" tuşu artık üstteki 2'li
//     özet kutu satırıyla (Gelecek/Tamamlanan) AYNI genişlikte — sarmalayıcı
//     div'e flex:1 eklendi (sadece bu tuşa özel inline stil, global .chip-btn
//     class'ı ve diğer 100+ kullanımı degismedi). Yukseklik de padding ile
//     ~3-4px arttirildi.
//   v1.1.2 (12.09.2026, V31.73): "Gelecek" (ertesi gun/sonrasi aranacak) kartlari
//     onceden sadece "Aranacak: <tarih>" bilgi metniydi — Ara/Aramadan Kapat
//     butonu yoktu, tiklanamiyordu. Artik Aktif sekmedeki fonksiyonlarla BIRE
//     BIR ayni: 📞 Ara ve Aramadan Kapat butonlari + ayni kisi uyarisi + Tekrar
//     etiketi de calisiyor. Teknik engel yoktu (gorev zaten ARAMA.tasks
//     icinde), sadece arayuz kisitliydi.
//   v1.1.1 (12.09.2026, V31.72): Tamamlanan sayaci "300+" yerine TAM RAKAM
//     gosteriyor. Onceden tamamlanan gorevler sunucuda 300 ile siniirliydi ve
//     tavana degildiginde "300+" yaziliyordu. Simdi: KCM'e kisitli kullanicilar
//     icin tamamlanan listesi hic sinirlanmadan (acik gorevler gibi sinirsiz
//     sayfali) cekiliyor — zaten tek bir KCM'nin alt kumesi oldugu icin kucuk
//     kaliyor, tam ve dogru sayi elde ediliyor. TUM kapsamli kullanicilar icin
//     (Admin vb.) liste render'i performans amacli 300'de sinirli kaliyor ama
//     ayri bir exact count (count:'exact',head:true) sorgusuyla sayac her
//     zaman gercek toplami gosteriyor. Bir filtre (tarih/my/kcm/arama metni)
//     aktifken filtrelenmis yerel sayi gosterilir (zaten dogru).
//   v1.1.0 (12.09.2026, V31.70 — KRITIK GUVENLIK FIX): Arama modulunde HICBIR
//     KCM/rol kisiti yoktu — ekrandaki KCM dropdown'u sadece gorsel filtreydi,
//     herhangi bir kullanici "Tum KCM'ler"i secip TUM bolgelerin arama
//     kayitlarini gorebiliyordu. Cozum: yetki.js->YETKI_MODUL_ADLARI'na 'arama'
//     eklendi (Rol & Yetki ekraninda artik TUM/KCM/BAGLI/PRT+/PRT scope secici
//     var); _aramaScope()/_aramaIzinNcstSet() eklendi, _aramaVeriYukle() artik
//     customers.kcm_id uzerinden (ncst araciligiyla) filtreliyor. Rol & Yetki'den
//     henuz ayar yapilmamissa guvenli varsayilan: KCM'i olan roller sadece kendi
//     KCM'sini, KCM'i olmayanlar (Admin/Direktor/Cagri Merkezi Uzmani) tumunu
//     gorur. Izin listesi cekilirken hata olursa GUVENLI TARAFTA KALINIR (bos
//     liste donup hicbir kayit gosterilmez, sessizce herkese acilmaz).
//   v1.0.19 (03.09.2026, V31.53 — sekme yapisi, filtre kaliciligi, aranmak istemiyor):
//     1) SEKMELER 3 -> 4: "Bekleyen" ikiye ayrildi. "Yeni" (hic aranmamis) ve
//        "Tekrar Aranacak" ayri sekmeler. Kutular 2x2 izgara.
//     2) BUG: _analizIzinMyList currentUser.kcm_id null iken .eq('kcm_id',null)
//        uretiyordu -> PostgREST 'eq.null' kabul etmez -> 400. Hata yutuluyor,
//        BOS DIZI donuyordu. Cagiran taraflar `if(izinMy)` diye bakiyordu ve
//        JS'te bos dizi TRUTHY oldugu icin: Cagri Analizi sessizce bos kaliyor,
//        MY/FMY filtresi bosaliyordu ("Tum FMY'ler calismiyor"). Etkilenen:
//        kcm_id'si null olan herkes — tum ADMIN'ler, Satis Direktoru, Cagri
//        Merkezi Uzmani. Duzeltildi: kcm_id yoksa kisit yok (null doner).
//     3) FILTRE KALICILIGI: filtreler artik ARAMA.filtre state'inde. Arama
//        modalindan donunce KORUNUR; sekme degisince veya ekrandan cikinca
//        sifirlanir. Kutulardaki rakamlar FILTRELENMIS adetleri gosterir.
//        Bunun icin acik gorevler tek sorguda cekilip dort kovaya boluniyor;
//        filtre degisimi sunucuya gitmiyor (aninda tepki).
//     4) YENI: "Aranmak istemiyor". Gorusmek icin uygun degil + bir daha
//        aranmak istemiyorsa isaretlenir -> contacts.aranmak_istemiyor=true,
//        gorev Tamamlandi olarak kapanir. Ayni kontak sonraki ziyaretlerde
//        kirmizi "BU KONTAK ARANMAK ISTEMIYOR" bandiyla gorunur.
//        MIGRASYON: ALTER TABLE contacts ADD COLUMN aranmak_istemiyor boolean
//        NOT NULL DEFAULT false, ADD COLUMN aranmak_istemiyor_tarih timestamptz;
//     5) "Gorusme suresi" sorusu kaldirildi (DB kolonu duruyor).
//   v1.0.18 (03.09.2026, V31.52 — PAYLASILAN HAT DUZELTMESI):
//     SORUN: v1.0.17 telefon eslesmesini "ayni kisi" kaniti sayiyordu. Veri
//     incelemesi bunun yanlis oldugunu gosterdi: ayni numarayi paylasan 50
//     gruptan 34'unde (%68) birden fazla GERCEK kisi var. Ornek 5415907001 ->
//     Haktan / Muzaffer / Hakki / Omer / Faruk (muhasebeci gibi paylasilan hat).
//     RISK: agent bir kisiyle konusup, o kisinin ilgisi olmayan bir firmanin
//     ziyaretini de teyit edebiliyordu -> sahte teyit verisi.
//     DUZELTME: isimler tutmuyorsa (a) serit amber "AYNI NUMARA — isimler
//     farkli" der ve tum isimleri listeler, (b) onay ekraninda her kaydin kendi
//     kontak adi gorunur, (c) ikincil kutular ISARETSIZ gelir.
//   v1.0.17 (01.09.2026, V31.49 — ayni kisi tespiti + birlesik arama):
//     - YENI: Ayni kisi tespiti. Farkli NCST/unvandaki musteriler ayni kisi
//       tarafindan yonetiliyorsa ve MY ayni gun ikisini de ziyaret ettiyse, iki
//       ayri teyit gorevi dogar ve agent ayni kisiyi iki kez arardi.
//       ESLESME SARTI (ucu birden): ayni ziyaret gunu + ayni MY + (ayni telefon
//       VEYA ayni kontak adi). Ayni gun + ayni MY sarti, isim eslesmesindeki
//       yanlis pozitifleri (farkli firmalarda iki "MEHMET YILMAZ") engeller.
//       Tek kelimelik/kisa adlar eslestirmeye alinmaz.
//     - YENI: Liste kartinda ve anket modalinda mor uyari seridi.
//     - YENI: Birlesik arama. Agent TEK gorusme yapar, TEK anket doldurur.
//       KAYITLAR BIRLESMEZ — her ziyaret kendi arama_sonuclari satirini alir.
//       Birlesseydi ikinci ziyaret raporlarda teyit edilmemis gorunur, ziyaret
//       teyit orani ve MY memnuniyet ortalamasi bozulurdu.
//       Ortak cevaplar (ulasildi/muhatap_dogru/gorusmek_istedi/memnuniyet/
//       sikayet/agent_notu) tum satirlara kopyalanir; ziyarete ozel cevaplar
//       (ziyaret_dogrulandi/gorusme_suresi/ihtiyac_anlasildi) her firma icin
//       AYRI sorulur ve kendi satirina yazilir.
//       Her iki kayda da '[Birlesik arama] ...' notu dusulur.
//     - Otomatik birlestirme YOK: agent onay ekraninda hangi kayitlari dahil
//       edecegini kendi secer. Yarim kapanma yok: bir satir bile yazilamazsa
//       HICBIR gorev kapatilmaz.
//   v1.0.16 (01.09.2026, V31.48 — anket kayit guvenligi):
//     - KRITIK: araAnketKaydet / araAnketTekrar / araAnketUlasilamiyor /
//       araAnketBilgiGuncelle fonksiyonlarinin DORDU DE Supabase cagrilarinin
//       `error` degerini yok sayiyordu. Insert basarisiz olsa bile kod devam edip
//       yesil "kaydedildi" mesaji veriyor, gorevi kapatiyor, anket verisi sessizce
//       kayboluyordu. Artik her adim kontrol ediliyor; hata varsa gercek mesaj
//       gosteriliyor, modal KAPANMIYOR, gorev durumu DEGISMIYOR.
//     - araAnketBilgiGuncelle SIRA DEGISIKLIGI: once anket kaydi + alt gorev,
//       gorev ancak ikisi de basariliysa kapatilir (eskiden gorev once kapaniyordu).
//     - araAnketBilgiGuncelle YEDEK MY: ziyarette my_id yoksa musterinin portfoy
//       sahibinden (customers.my_id) alinir. Eskiden sessizce gorev acilmiyordu.
//     - Acilan goreve deadline yaziliyor (+3 is gunu). Deadline'siz gorevler
//       gorev listesinde gorunmuyordu (bkz. gorev.js v1.2.11).
//   v1.0.15 (01.09.2026, V31.46 — arama ekrani iyilestirmeleri):
//     - YENI: "Aranacak numara" kutusu. Agent "Ara" tusuna basip anket modali
//       acildiginda, Firma gecmisi panelinin ALTINDA numarayi gosteren bir kutu
//       cikar. Kutu govdesine dokunmak numarayi panoya kopyalar ve "Telefon
//       numarasi kopyalandi" bildirimi verir; sagindaki telefon ikonu ise tel:
//       linkiyle aramayi baslatir (mobilde cevirici acilir, masaustunde etkisiz).
//       Kopyalama ile arama AYRI tuslara verildi — tek tusa toplansaydi liste
//       karistirilirken kazara musteri aranabilirdi.
//     - YENI: Numaralar +90 XXX XXX XX XX bicinde gosteriliyor (normalizeTel,
//       config.js v1.2.87). VERITABANI DEGISMEDI — normalizasyon okuma aninda.
//       Bilinen kaliplara uymayan numarada uydurma +90 URETILMEZ: ham deger
//       gosterilir, "format supheli" uyarisi cikar, arama tusu pasiflesir.
//     - YENI: Memnuniyet (1-10) skalasina "Degerlendirmek istemiyor" secenegi.
//       Bu secildiginde arama_sonuclari.memnuniyet NULL kalir ve yeni
//       memnuniyet_ret kolonu true olur. Boylece MY ortalama memnuniyet skoru
//       (memnSum/memnCount) ve "Memnuniyetsiz" kategorisi (memnuniyet.lte.4)
//       HIC DEGISMEDEN dogru calisir — sentinel deger (0/-1) kullanilsaydi
//       ikisi de sessizce bozulacakti.
//       GEREKLI MIGRASYON (koddan ONCE calistirilmali):
//         ALTER TABLE public.arama_sonuclari
//           ADD COLUMN IF NOT EXISTS memnuniyet_ret boolean NOT NULL DEFAULT false;
//   v1.0.14 (21.08.2026, filtre paneli yeniden yapilandirildi):
//     - BUG FIX (talep edilen): Tarih filtresi ARAMA/gorev tarihini degil,
//       artik ZIYARET tarihini (visits.tarih_saat, Europe/Istanbul takvim
//       gunu) baz aliyor. Onceki hali tasks.deadline/tamamlanma_tarihi
//       uzerinden filtreliyordu — "15 Agustos'ta yapilan ziyaretlerin teyit
//       aramalarini goster" beklentisiyle ortusmuyordu. Filtre artik
//       client-side (vMap uzerinden) uygulaniyor.
//     - YENI: KÇM -> MY/FMY iki kademeli filtre (Bekleyen + Tamamlanan).
//       Duz "Tum personel" listesi kaldirildi — once KÇM secilir, MY/FMY
//       acilir listesi sadece o KÇM'nin personelini gosterir. TÜM kapsami
//       olmayan kullanicilarda KÇM tek secenekle otomatik daralir.
//     - Filtre paneli sirasi: Ziyaret tarihi -> Durum -> KÇM -> MY/FMY ->
//       (en altta) Musteri adi arama.
//     - Not: KÇM/MY/musteri adi/ziyaret tarihi filtrelerinin tumu artik
//       client-side (enrich adimindaki vMap/unvanMap uzerinden, limit
//       500/300 kayitlik sayfada) uygulaniyor — cok eski/genis bir aralikta
//       ariyorsaniz once durum ile daraltin.
//   v1.0.13 (21.08.2026, filtre duzeltme + yeni filtreler):
//     - BUG FIX (kok neden — "filtreler calismiyor"): "bugun" hesabi
//       new Date().toISOString().slice(0,10) ile UTC gunune gore yapiliyordu.
//       Turkiye UTC+3 (DST yok) oldugu icin gece 00:00-02:59 arasinda bu hala
//       BIR ONCEKI gunu veriyor, Bekleyen/Tamamlanan listeleri ve SLA kapama
//       o pencerede yanlis/eksik calisiyordu. Yeni _istanbulBugun()/
//       _istanbulTarihEkle() yardimcilari her zaman Europe/Istanbul takvim
//       gunune gore hesapliyor.
//     - BUG FIX: arama_sonuclari.created_at (timestamptz) ve
//       tasks.tamamlanma_tarihi filtrelerine +03:00 ofseti eklendi — ofsetsiz
//       gonderilen tarih Postgres oturum saat dilimine (UTC) gore
//       yorumlaniyor, Istanbul gunuyle 3 saat kayiyordu (Cagri Analizi, MY
//       Kirilim paneli, Tamamlanan sekmesi tarih filtreleri dahil).
//     - YENI FILTRE (talep edilen): Tamamlanan sekmesine durum filtresi —
//       "Ulasilamayan (tekrar aranabilir)" secilince sadece Ulasilamiyor
//       kayitlari listelenir; karttaki mevcut "Yeniden Ara" tusuyla direkt
//       tekrar aranabilir. Bekleyen sekmesine de durum filtresi (Hic
//       aranmadi / Tekrar aranacak) eklendi.
//     - YENI FILTRE: Bekleyen + Tamamlanan sekmelerine firma adi arama kutusu
//       (debounce'lu, client-side) ve personel (MY) filtresi (kapsam/scope'a
//       gore siniirli acilir liste) eklendi.
//   v1.0.12 (20.08.2026, konsolidasyon): Anket akisi yeniden tasarlandi (soru
//     sayisi azaltildi, muhatap dogrulamasi gercek bir "gate" oldu):
//     - "Dogru muhatap mi?" -> "Gorusulen kisi yetkili ve dogru kontak mi?"
//       (Evet/Hayir). Hayir ise anket burada kapanir (Kaydet/Tamamlandi,
//       turuncu etiket), sonraki hicbir soru cikmaz.
//     - "Gorusmek uygun mu?" -> "Gorusmek icin uygun mu?". Hayir ise "sonra
//       aranmak ister mi" ara sorusu kaldirildi, dogrudan yeni arama tarihi
//       sorulup Tekrar Aranacak olarak kapatiliyor.
//     - "Bu tarihte firmadan ziyaret oldu mu?" sorusu ziyaret tarihini
//       iceren dinamik metne tasindi ("{tarih} sizi Turkcell'den arkadasimiz
//       ziyarete geldi mi?") ve 3. secenek "Emin degil" -> "Gelmedi ama
//       Telefonla konustuk" oldu (belirsizlik degil, net alternatif kanal
//       bilgisi — ayri mavi etiket/renk ile gosteriliyor, sahte supheden
//       (Hayir=mor) ayristirildi). Buna bagli "Bu konuda emin misiniz?"
//       (ziyaret_emin) ve "Ziyaret olmadiysa neden?" (ziyaret_yok_neden)
//       alt-sorulari tamamen kaldirildi.
//     - Kaldirilan sorular: "Gorusme yuz yuze miydi?" (yuzyuze), "Ziyaret
//       edenin adini hatirliyor mu?" (isim_dogru), "Temsilci guven verdi
//       mi?" (guven), NPS/"Tavsiye eder mi?" (memnuniyet sorusu tek basina
//       yeterli görüldü), "Takip sozu verildi mi?" + "Soz tutuldu mu?".
//     - "Ihtiyac anlasildi mi?" -> "Temsilcimiz ihtiyacinizi anladi ve cozum
//       uretebildi mi?" (Evet ve Telefonla-konustuk dallarinin ikisinde de
//       sorulur). Sikayet/talep sorusu artik her ziyaret_dogrulandi dalinda
//       (Evet/Hayir/Telefonla) soruluyor.
//     - Yan etki: bagimsiz bug duzeltildi — MY Kirilim/Liderlik panelinde
//       memnuniyet ortalamasi hala "/5" yaziyordu (skala 1-10'a gecileli
//       beri diger tum yerler /10 idi, bu panel unutulmustu).
//   v1.0.11 (V31.27): Anket akisi mantik hatasi duzeltildi — "Bu tarihte
//     firmadan ziyaret oldu mu?" = Hayir secildiginde artik alakasiz
//     yuz-yuze/isim-hatirlama sorulari cikmiyor (artik sadece Evet'te
//     cikiyor). Hayir sonrasi once "Bu konuda emin misiniz?" sorusu
//     cikiyor (Eminim -> neden sorusu / Emin degilim -> Emin degil'e
//     donusturur, ekstra soru sormaz). Memnuniyet ve NPS olcekleri
//     ikisi de 1-10 araligina cekildi (eskiden 1-5 ve 0-10 idi);
//     tum ozet/detay ekranlarindaki "/5" etiketleri "/10" oldu;
//     Memnuniyetsiz kirilim esigi orantili olarak lte.2 -> lte.4 guncellendi.
//   v1.0.10 (V31.24): FIX — Detay modali 'kayit bulunamadi' gosteriyordu cunku
//     araSonucDetayAc'in arama_sonuclari select'i sabit kolon listesi kullaniyordu
//     ve PostgREST bir kolon uyusmazliginda TUM select'i hatayla reddediyor,
//     kod bu hatayi kontrol etmedigi icin sessizce 'kayit yok' gibi gorunuyordu.
//     select('*') + hata mesaji ekranda gosterilir oldu.
//   v1.0.9 (V31.23): Tamamlanan arama kartlari artik hep anlamli bir ozet
//     gosterir (_aramaSonucOzet — sikayet/yanlis numara/sahte supheli oncelikli).
//     Karta tiklamak veya yeni "Detay" tusu, o goreve ait TUM arama_sonuclari
//     denemelerini (her alan) gosteren yeni salt-okunur modal (aramaSonucDetayModal)
//     acar. "Tekrar Ara" tusu "Yeniden Ara" olarak yeniden adlandirildi.
//   v1.0.8 (V31.22): Kart cercevesine 5. renk (mor: sahte/supheli ziyaret).
//     Cagri Analizi'ne 5b MY Kirilim/Liderlik Tablosu paneli eklendi (acilir/
//     kapanir, analiz tarih araligini kullanir): en cok yanlis numara (MY),
//     en temiz veri (genel sorun orani en dusuk MY), KCM bazli ziyaret
//     memnuniyet skoru en yuksek/dusuk 3'er MY. Min 3 arama esigi uygulanir.
//   v1.0.7 (V31.21): 'Bugun' sekmesi -> 'Bekleyen Cagrilar' (+ tarih filtresi,
//     Tamamlananlar'daki gibi). Kutu etiketleri: Bekleyen/Gelecek/Tamamlanan.
//     Kart cerceve renklendirme: kirmizi=yanlis numara/sikayet, sari=ulasildi+
//     tekrar aranacak, yesil=tamamlandi+ziyaret teyit edildi, turuncu=ulasilamayan/
//     kapanan. main.css: --orange degiskeni eklendi.
//   v1.0.6 (V31.20): UI — Bugun/Gelecek/Tamamlanan sekmeleri alttaki liste
//     kutusuyla ayni genislikte 3 istatistik kutusuna (.summary-box) donusturuldu;
//     sayi kutu icinde buyuk+bold, etiket altinda, kutuya tiklamak sekmeyi acar.
//   v1.0.5 (V31.19): Ara modalina 'Firma Gecmisi' paneli — bu ncst'ye yapilmis
//     TUM ziyaretler (visits) + daha once yapilmis TUM teyit aramalari
//     (arama_sonuclari) listelenir (acilir/kapanir). Agent aradigi firma
//     hakkinda aramadan once istihbarat toplayabilir.
//   v1.0.4 (V31.17): Liste ozetine ziyaret amaci+urun; arama modalinda tam ziyaret
//     bilgisi paneli (amac/detay, urun_gruplari, ziyaret notu, firsat olustu mu).
//   v1.0.3 (V31.16): 5a — Cagri Analizi sekmesi (arama_rapor), kategori+tarih
//     filtreli liste, kapsam bazli (TUM/KCM). Operasyon sekmeleri arama_agent'a bagli.
//   v1.0.2 (V31.15): 3c — Bugün/Gelecek/Tamamlanan sekmeleri + ozet sayaclar
//     + Gelecek tarihe gore gruplu + Tamamlananlarda tarih filtresi + Tekrar Ara.
//   v1.0.1 (V31.14): 3b-1 Ara anket modali (asama asama) + arama_sonuclari kaydi
//     + gorev durumu (Tamamlandi/Tekrar Aranacak/Ulasilamiyor) + telefon bazli deneme
//     kurali + 'Musteri Bilgileri Guncelleme' gorevi (yanlis numara / tekrar ulasilamadi).
// MEMNUNİYET ARAMA (Agent) — Adım 3a
//   • Ziyaret Teyit Araması görev listesi (deadline<=bugün, Aranacak/Tekrar Aranacak)
//   • 7 gün (parametrik) SLA anlık otomatik kapama ("Arama Yapılmadı")
//   • Aramadan Kapat (sebepli) → arama_sonuclari kaydı
//   • Ara (anket) 3b'de gelecek — şimdilik placeholder
//   Yetki: arama_agent
// ============================================================
'use strict';

const ARAMA = { teyitTypeId:null, tasks:[], unvanMap:{}, vMap:{}, kMap:{}, gruplar:{}, grupKisi:{}, grupAd:{},
                filtre:{bas:'',bit:'',kcm:'',my:'',q:'',tamDurum:''}, veri:null, aktifSekme:null };

// v1.0.13: BUG FIX — "bugün" hesabı cihazın saat dilimine/UTC'ye değil, her zaman
// Europe/Istanbul takvim gününe göre yapılmalı. new Date().toISOString().slice(0,10)
// UTC gününü döndürüyordu; Türkiye UTC+3 (DST yok) olduğu için gece 00:00-02:59
// arasında bu, hâlâ BİR ÖNCEKİ günü veriyordu — "Bekleyen Çağrılar" o pencerede
// bugüne ait görevleri göstermiyor/yanlış filtreliyor gibi görünüyordu. Ayrıca
// arama_sonuclari.created_at (timestamptz) filtrelerine de +03:00 ofseti eklendi
// (offsetsiz gönderilen tarih Postgres oturum saat dilimi olan UTC'ye göre
// yorumlanıyor, İstanbul günüyle 3 saat kayıyordu).
function _istanbulBugun(){
  return new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Istanbul'}); // 'sv-SE' -> YYYY-MM-DD
}
function _istanbulTarihEkle(gunSayisi){
  const d=new Date(_istanbulBugun()+'T00:00:00Z');
  d.setUTCDate(d.getUTCDate()+gunSayisi);
  return d.toISOString().slice(0,10);
}

async function _aramaTeyitTypeId(){
  if(ARAMA.teyitTypeId) return ARAMA.teyitTypeId;
  const {data}=await sb.from('task_types').select('type_id').eq('tip_adi','Ziyaret Teyit Araması').maybeSingle();
  ARAMA.teyitTypeId = data?.type_id || null;
  return ARAMA.teyitTypeId;
}
async function _aramaSlaGun(){
  try{
    const {data}=await sb.from('sistem_ayarlari').select('deger').eq('ayar_tipi','arama_sla_gun').eq('aktif',true).maybeSingle();
    const n=parseInt(data?.deger); return (n&&n>0)?n:7;
  }catch(e){ return 7; }
}

async function initAramaEkrani(){
  const listEl=document.getElementById('aramaListesi');
  if(listEl) listEl.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const typeId=await _aramaTeyitTypeId();
  if(!typeId){ if(listEl) listEl.innerHTML='<div class="empty">Arama görev tipi bulunamadı.</div>'; return; }
  const agent=hasPerm('arama_agent');
  if(agent) await _aramaSlaOtomatikKapat(typeId);   // SLA yalnız agent ekranında
  ARAMA.aktifSekme = agent ? 'yeni' : 'analiz';       // V31.53: ekrana her giriste 'Yeni'
  ARAMA.filtre = {bas:'',bit:'',kcm:'',my:'',q:'',tamDurum:'',gelecekGoster:'aranacak'};  // ekrandan cikip donunce filtre sifir
  ARAMA.veri = null;                                   // taze veri cek
  _aramaShellRender();
  _aramaSekmeGoster(ARAMA.aktifSekme);
}

// v31.20: 3 sekme (Bugün/Gelecek/Tamamlanan) artık alttaki liste kutusuyla aynı
// genişlikte 3 istatistik kutusu (.summary-box) olarak gösteriliyor — sayı kutu
// içinde büyük+bold, etiket altında; kutuya tıklamak ilgili sekmeye geçer.
function _aramaShellRender(){
  const el=document.getElementById('aramaListesi'); if(!el) return;
  const agent=hasPerm('arama_agent'), rapor=hasPerm('arama_rapor');
  let h='';
  if(agent){
    // V31.53: 3 sekme -> 4 sekme. "Bekleyen" ikiye ayrildi: hic aranmamislar
    // ("Yeni") ve tekrar aranacaklar ayri sekmelerde. 4 kutu tek sirada dar
    // ekranda sigmadigi icin 2x2 izgara.
    // Kutulardaki rakamlar FILTRELENMIS adetleri gosterir (V31.53).
    h+=`<div id="aramaSekmeler" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px;">
      <div class="summary-box" data-sekme="yeni" style="cursor:pointer;" onclick="_aramaSekmeGoster('yeni')">
        <div class="summary-val lg" id="aramaStatYeni" style="color:var(--amber);">—</div>
        <div class="summary-label lg">Yeni</div>
      </div>
      <div class="summary-box" data-sekme="tekrar" style="cursor:pointer;" onclick="_aramaSekmeGoster('tekrar')">
        <div class="summary-val lg" id="aramaStatTekrar" style="color:var(--orange);">—</div>
        <div class="summary-label lg">Tekrar Aranacak</div>
      </div>
      <div class="summary-box" data-sekme="gelecek" style="cursor:pointer;" onclick="_aramaSekmeGoster('gelecek')">
        <div class="summary-val lg" id="aramaStatGelecek" style="color:var(--blue);">—</div>
        <div class="summary-label lg">Gelecek</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">Aranacak: <b id="aramaStatGelecekAranacak" style="color:var(--green);">—</b></div>
      </div>
      <div class="summary-box" data-sekme="tamamlanan" style="cursor:pointer;" onclick="_aramaSekmeGoster('tamamlanan')">
        <div class="summary-val lg" id="aramaStatTamamlanan" style="color:var(--green);">—</div>
        <div class="summary-label lg">Tamamlanan</div>
      </div>
    </div>`;
  }
  if(rapor) h+=`<div style="display:flex;gap:6px;margin-bottom:10px;"><div class="chip-btn" style="flex:1;padding-top:13px;padding-bottom:13px;" data-sekme="analiz" onclick="_aramaSekmeGoster('analiz')">📊 Çağrı Analizi</div></div>`;
  h+=`<div id="aramaFiltre"></div>
    <div id="aramaListeGovde"><div class="loader"><div class="spinner"></div></div></div>`;
  el.innerHTML=h;
}

// V31.53: Sayaclar artik ayri COUNT sorgulariyla degil, ekranda gosterilen
// FILTRELENMIS veriden hesaplanir. Boylece "1 gun filtreledim ama kutuda hala
// toplam yaziyor" tutarsizligi ortadan kalkar.
function _aramaSayaclariYaz(kova){
  const yaz=(id,deger)=>{ const e=document.getElementById(id); if(e) e.textContent=deger; };
  yaz('aramaStatYeni',       kova.yeni.length);
  yaz('aramaStatTekrar',     kova.tekrar.length);
  yaz('aramaStatGelecek',    kova.gelecek.length);
  // V31.81: "Gelecek" kutusunun 2. rakami — aranmak istemiyor/son N gunde
  // teyit edilmis/ayni gun ayni kisi gruplarindan HARIC tutulan gercek
  // "arama yapilacak musteri" sayisi. Harita _gelecekAranacakMap'te.
  const gMap=ARAMA._gelecekAranacakMap||new Map();
  const gAranacakSayisi=kova.gelecek.filter(t=>{ const x=gMap.get(t.task_id); return !x||x.aranacak!==false; }).length;
  yaz('aramaStatGelecekAranacak', gAranacakSayisi);
  // v1.1.1 (V31.72): "300+" kaldirildi, artik HER ZAMAN tam rakam gosterilir.
  // Aktif bir filtre yoksa exact count sorgusundan gelen gercek toplam
  // gosterilir; filtre varsa (tarih/my/kcm/arama metni) filtrelenmis yerel
  // sayi zaten dogrudur (filtre ham veriyi daha da daraltir, asla artirmaz).
  const F=ARAMA.filtre||{};
  const filtreAktif = !!(F.q || F.my || F.kcm || F.bas || F.bit || F.tamDurum);
  const tamamSayi = (!filtreAktif && ARAMA._tamamGercekSayi!=null) ? ARAMA._tamamGercekSayi : kova.tamamlanan.length;
  yaz('aramaStatTamamlanan', tamamSayi);
}

function _aramaSekmeGoster(sekme){
  const oncekiSekme=ARAMA.aktifSekme;
  ARAMA.aktifSekme=sekme;
  document.querySelectorAll('#aramaListesi [data-sekme]').forEach(c=>c.classList.toggle('active', c.getAttribute('data-sekme')===sekme));
  // V31.53: SEKME DEGISINCE filtre sifirlanir (talep edilen davranis).
  // Arama modalindan donuste sekme degismedigi icin filtre KORUNUR.
  if(oncekiSekme && oncekiSekme!==sekme) _aramaFiltreSifirla();
  if(sekme==='analiz'){
    const f=document.getElementById('aramaFiltre'); if(f){ f.innerHTML=''; delete f.dataset.ready; }
    loadAramaAnaliz(); return;
  }
  loadAramaListe(true);
}

// V31.53: Filtre durumu ARAMA.filtre icinde yasar; panel bu state'ten kurulur.
// Eskiden panel her _aramaSekmeGoster cagrisinda silinip sifirdan yaratiliyordu —
// arama modalindan donuste (loadAramaListesi -> _aramaSekmeGoster) tum filtreler
// kayboluyordu.
function _aramaFiltreSifirla(){
  ARAMA.filtre={bas:'',bit:'',kcm:'',my:'',q:'',tamDurum:'',gelecekGoster:'aranacak'};
  const f=document.getElementById('aramaFiltre'); if(f){ f.innerHTML=''; delete f.dataset.ready; }
}

// Eski çağrı noktaları (kaydet/kapat sonrası): aktif sekmeyi + sayaçları yenile
// V31.53: Modal kaydi/kapanisi sonrasi cagrilir. Sekme ve FILTRE korunur —
// sadece veri yeniden cekilir. Eskiden _aramaSekmeGoster cagirip paneli
// sifirdan kuruyordu ve tum filtreler kayboluyordu.
function loadAramaListesi(){ if(ARAMA.aktifSekme==='analiz') return loadAramaAnaliz(); loadAramaListe(true); }

async function _aramaEnrich(tasks){
  const ncstList=[...new Set(tasks.map(t=>t.ncst).filter(Boolean))];
  const unvanMap={}; if(ncstList.length){ const {data}=await sb.from('customers').select('ncst,unvan').in('ncst',ncstList); (data||[]).forEach(c=>unvanMap[c.ncst]=c.unvan); }
  const vIds=[...new Set(tasks.map(t=>t.visit_id).filter(Boolean))];
  const vMap={}; if(vIds.length){ const {data}=await sb.from('visits').select('visit_id,my_id,kcm_id,tarih_saat,ziyaret_amaci,urun_gruplari,ziyaret_sonucu,contact_id').in('visit_id',vIds); (data||[]).forEach(v=>vMap[v.visit_id]=v); }

  // V31.49: Aynı kişi tespiti için kontak bilgisi (ad_soyad + telefon).
  // visit.contact_id -> contacts. Kontağı olmayan ziyaret gruplamaya girmez.
  const cIds=[...new Set(Object.values(vMap).map(v=>v.contact_id).filter(Boolean))];
  const kMap={};   // visit_id -> {ad_soyad, telefon}
  if(cIds.length){
    const kByCid={};
    const {data}=await sb.from('contacts').select('contact_id,ad_soyad,telefon,aranmak_istemiyor').in('contact_id',cIds);   // V31.53
    (data||[]).forEach(k=>kByCid[k.contact_id]=k);
    Object.values(vMap).forEach(v=>{ if(v.contact_id && kByCid[v.contact_id]) kMap[v.visit_id]=kByCid[v.contact_id]; });
  }

  // Modal ve kart render'ı liste kapsamı dışından da erişebilsin diye global'e yaz
  ARAMA.unvanMap=Object.assign(ARAMA.unvanMap||{},unvanMap);
  ARAMA.vMap=Object.assign(ARAMA.vMap||{},vMap);
  ARAMA.kMap=Object.assign(ARAMA.kMap||{},kMap);
  _aramaAyniKisiGrupla(tasks,vMap,kMap);
  return {unvanMap,vMap,kMap};
}

// ============================================================
// V31.49: AYNI KİŞİ TESPİTİ
// ------------------------------------------------------------
// Bazı müşteriler farklı NCST ve farklı ünvanda olsa da aynı kişi tarafından
// yönetiliyor. MY aynı gün her iki firmayı da ziyaret ettiğinde iki ayrı teyit
// görevi doğuyor ve agent aynı kişiyi iki kez arıyor.
//
// EŞLEŞME ŞARTI (üçü birden):
//   • aynı ziyaret günü      (visits.tarih_saat gün bileşeni)
//   • aynı MY                (visits.my_id)
//   • aynı telefon VEYA aynı kontak adı
//
// Aynı gün + aynı MY şartı, isim eşleşmesindeki yanlış pozitifleri (farklı
// firmalarda çalışan iki "MEHMET YILMAZ") engellemek için zorunlu tutuldu.
// Otomatik birleştirme YOK — agent birleştirme ekranında hangi kayıtları dahil
// edeceğini onay kutularıyla kendi seçer.
// ============================================================
function _kisiAdNorm(s){
  return String(s||'').toLocaleUpperCase('tr')
    .replace(/[^A-ZÇĞİÖŞÜ]/g,' ').replace(/\s+/g,' ').trim();
}
function _aramaGun(ts){ return ts?String(ts).slice(0,10):''; }

// V31.51: Isim "kok"u — unvan kelimeleri atilir, Turkce harfler sadelestirilir,
// ilk kelimenin ilk 4 harfi alinir. Aytekin/Aytekib ve Kursad/Kursat ayni koke
// duser; Nurdan/Koray dusmez.
const _UNVAN_KELIME=['bey','bay','hanim','hn','hanin','beyy','beyyy','sayin','sn'];
function _kisiAdKok(s){
  const t=String(s||'').toLocaleLowerCase('tr')
    .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
    .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z ]/g,' ');
  const kel=t.split(/\s+/).filter(w=>w && !_UNVAN_KELIME.includes(w));
  return kel.length?kel[0].slice(0,4):'';
}

// V31.51: Gruptaki isimler gercekten ayni kisiye mi ait?
// PAYLASILAN HAT GERCEGI: ayni numarayi paylasan 50 gruptan 34'unde (%68)
// birden fazla GERCEK kisi cikti. Telefon eslesmesi tek basina "ayni kisi"
// KANITI DEGIL — isimler tutmuyorsa kullanici uyarilir ve birlestirme
// varsayilan olarak SECILMEZ.
function _grupIsimAnaliz(uyeler){
  const kokler=[], isimler=[];
  uyeler.forEach(u=>{
    const k=_kisiAdKok(u.ad);
    const ad=(u.ad||'').trim();
    if(ad && !isimler.some(x=>x.toLocaleLowerCase('tr')===ad.toLocaleLowerCase('tr'))) isimler.push(ad);
    if(k && !kokler.includes(k)) kokler.push(k);
  });
  return { isimler, farkli: kokler.length>1 };
}

function _aramaAyniKisiGrupla(tasks,vMap,kMap){
  ARAMA.gruplar={}; ARAMA.grupKisi={};
  const ebeveyn={};
  const bul=x=>{ while(ebeveyn[x]!==x){ ebeveyn[x]=ebeveyn[ebeveyn[x]]; x=ebeveyn[x]; } return x; };
  const birlestir=(a,b)=>{ const ra=bul(a), rb=bul(b); if(ra!==rb) ebeveyn[rb]=ra; };

  const uygun=[];
  const ACIK=['Aranacak','Tekrar Aranacak'];
  tasks.forEach(t=>{
    // Yalnizca HENUZ ARANMAMIS gorevler gruplanir. Tamamlanan bir gorevi
    // birlestirmeye dahil etmek, kapali bir kaydin uzerine ikinci satir yazip
    // istatistigi sisirirdi.
    if(!ACIK.includes(t.durum)) return;
    const v=vMap[t.visit_id]; const k=kMap[t.visit_id];
    if(!v||!k||!v.my_id) return;
    const gun=_aramaGun(v.tarih_saat); if(!gun) return;
    const tel=(typeof normalizeTel==='function')?normalizeTel(k.telefon):{gecerli:false};
    const ad=_kisiAdNorm(k.ad_soyad);
    const anahtarlar=[];
    const on='MY'+v.my_id+'|'+gun+'|';
    if(tel.gecerli) anahtarlar.push(on+'T:'+tel.e164);
    // Çok kısa/tek kelimelik adlar eşleştirmeye alınmaz (ör. "AHMET") —
    // yanlış pozitif üretir.
    if(ad && ad.length>=6 && ad.indexOf(' ')>0) anahtarlar.push(on+'A:'+ad);
    if(!anahtarlar.length) return;
    ebeveyn[t.task_id]=t.task_id;
    uygun.push({t,anahtarlar,ad:k.ad_soyad,tel:k.telefon});
  });

  const ilk={};
  uygun.forEach(u=>u.anahtarlar.forEach(a=>{
    if(ilk[a]!=null) birlestir(ilk[a],u.t.task_id); else ilk[a]=u.t.task_id;
  }));

  const kok={};
  uygun.forEach(u=>{ const r=bul(u.t.task_id); (kok[r]=kok[r]||[]).push(u); });
  Object.values(kok).forEach(uyeler=>{
    if(uyeler.length<2) return;                    // tek başınaysa grup değil
    const ids=uyeler.map(u=>u.t.task_id);
    const analiz=_grupIsimAnaliz(uyeler);                                   // V31.51
    const kisi={ad:uyeler[0].ad, tel:uyeler[0].tel, isimler:analiz.isimler, farkli:analiz.farkli};
    const adMap={}; uyeler.forEach(u=>{ adMap[u.t.task_id]=u.ad||''; });    // gorev -> kendi kontak adi
    ids.forEach(id=>{ ARAMA.gruplar[id]=ids; ARAMA.grupKisi[id]=kisi; });
    ARAMA.grupAd=Object.assign(ARAMA.grupAd||{},adMap);
  });
}

// Kart ve modal için ortak uyarı şeridi HTML'i
// V31.53: "Aranmak istemiyor" uyari bandi. Kontak daha once bir aramada bu
// sekilde isaretlendiyse, AYNI KONTAK sonraki ziyaret gorevlerinde de bu bantla
// gorunur — agent bosuna aramasin, musteri rahatsiz olmasin.
function _aramaIstemiyorBant(taskId,mod){
  const t=(ARAMA.tasks||[]).find(x=>x.task_id===taskId);
  const v=t?((ARAMA.vMap||{})[t.visit_id]):null;
  const k=v?((ARAMA.kMap||{})[v.visit_id]):null;
  if(!k || !k.aranmak_istemiyor) return '';
  return '<div style="background:rgba(224,4,42,.15);border:1px solid var(--red);border-radius:8px;'+
    'padding:8px 10px;margin:'+(mod==='modal'?'0 0 10px':'8px 0 0')+';font-size:12px;">'+
      '<div style="color:var(--red);font-weight:700;">&#9940; BU KONTAK ARANMAK İSTEMİYOR</div>'+
      '<div style="color:var(--text2);margin-top:2px;">'+escapeHTML(k.ad_soyad||'—')+
        ' daha önceki bir aramada bir daha aranmak istemediğini belirtti.</div>'+
    '</div>';
}

function _aramaAyniKisiSerit(taskId,mod){
  const ids=ARAMA.gruplar?ARAMA.gruplar[taskId]:null;
  if(!ids||ids.length<2) return '';
  const kisi=ARAMA.grupKisi[taskId]||{};
  const digerUnvan=ids.filter(id=>id!==taskId).map(id=>{
    const t=(ARAMA.tasks||[]).find(x=>x.task_id===id);
    return t?((ARAMA.unvanMap||{})[t.ncst]||t.ncst||('#'+id)):('#'+id);
  });
  const tel=(typeof normalizeTel==='function')?normalizeTel(kisi.tel):{gecerli:false};
  const telYazi=tel.gecerli?tel.goster:(kisi.tel||'');

  // V31.51: isimler tutmuyorsa bu bir "ayni kisi" iddiasi DEGIL, sadece "ayni
  // numara" gozlemidir. Paylasilan hatlarda ayni numarada gercekten farkli
  // kisiler bulunuyor — agent'i yaniltmamak icin renk, baslik ve buton degisir.
  const farkli=!!kisi.farkli;
  const renk  = farkli ? 'var(--amber)' : 'var(--purple)';
  const zemin = farkli ? 'rgba(255,180,0,.12)' : 'rgba(168,85,247,.12)';
  const baslik = farkli
    ? '&#9888; AYNI NUMARA — isimler farkl\u0131, kontrol edin'
    : '\uD83D\uDD17 AYNI K\u0130\u015E\u0130 — '+ids.length+' firma i\u00e7in aranacak';
  const kisiSatir = farkli
    ? '<div style="color:var(--text2);margin-top:2px;">Kay\u0131tl\u0131 isimler: <b>'+
        escapeHTML((kisi.isimler||[]).join(' / '))+'</b></div>'+
      (telYazi?'<div style="color:var(--text3);margin-top:2px;">'+escapeHTML(telYazi)+'</div>':'')+
      '<div style="color:var(--text3);margin-top:2px;">Ayn\u0131 numara, farkl\u0131 isimler — payla\u015f\u0131lan hat olabilir. '+
        'Birle\u015ftirmeden \u00f6nce do\u011fru ki\u015fi oldu\u011funu teyit edin.</div>'
    : '<div style="color:var(--text2);margin-top:2px;">'+escapeHTML(kisi.ad||'—')+
        (telYazi?(' · '+escapeHTML(telYazi)):'')+'</div>';
  const butonMetni = farkli
    ? '\uD83D\uDD0D Birle\u015ftirmeyi incele ('+ids.length+' ziyaret)'
    : '\uD83D\uDD17 Bu '+ids.length+' ziyareti tek g\u00f6r\u00fc\u015fmede teyit et';
  const buton=(mod==='modal')
    ? '<button class="btn btn-sm" style="width:100%;margin-top:8px;background:'+renk+
      (farkli?';color:#000':'')+'" onclick="araBirlesikAc('+taskId+')">'+butonMetni+'</button>'
    : '';
  return '<div style="background:'+zemin+';border:1px solid '+renk+';border-radius:8px;'+
    'padding:8px 10px;margin:'+(mod==='modal'?'0 0 10px':'8px 0 0')+';font-size:12px;">'+
      '<div style="color:'+renk+';font-weight:700;">'+baslik+'</div>'+
      kisiSatir+
      '<div style="color:var(--text3);margin-top:2px;">Di\u011fer: '+escapeHTML(digerUnvan.join(' · '))+'</div>'+
      buton+
    '</div>';
}
// v1.0.12: kart çerçeve rengi — durum + son arama sonucuna göre görsel önceliklendirme.
//   Kırmızı: yanlış numara veya şikayet kaydı var (en yüksek öncelik)
//   Mor: sahte ziyaret şüphesi (Hayır) veya (eski kayıtlarda) şüpheli (Emin değil)
//   Mavi: ziyaret olmadı ama telefonla görüşüldü (yeni — sahte şüphesi DEĞİL, ayrı etiket)
//   Turuncu (koyu): yanlış/yetkisiz kişiyle görüşüldü (yeni — muhatap_dogru=Hayır)
//   Sarı (amber): ulaşıldı ama tekrar aranacak
//   Yeşil: görüşüldü ve ziyaret teyit alındı (Tamamlandı + ziyaret_dogrulandi=Evet)
//   Turuncu: ulaşılamayan / aramadan kapatılan / SLA ile kapanan
function _aramaKartRenk(t){
  const s=t._sonucRaw||{};
  if(s.sikayet_var===true || s.ulasilamama_neden==='Yanlış numara') return 'var(--red)';
  if(t.durum==='Tamamlandı' && (s.ziyaret_dogrulandi==='Hayır' || s.ziyaret_dogrulandi==='Emin değil')) return 'var(--purple)';
  if(t.durum==='Tamamlandı' && s.ziyaret_dogrulandi==='Gelmedi ama Telefonla konuştuk') return 'var(--blue)';
  if(t.durum==='Tamamlandı' && s.muhatap_dogru==='Hayır') return 'var(--orange)';
  if(t.durum==='Tekrar Aranacak' && s.ulasildi===true) return 'var(--amber)';
  if(t.durum==='Tamamlandı' && s.ziyaret_dogrulandi==='Evet') return 'var(--green)';
  if(['Ulaşılamıyor','Aramadan Kapatıldı','Arama Yapılmadı'].includes(t.durum)) return 'var(--orange)';
  return null;
}
// Bekleyen/Gelecek listelerindeki 'Tekrar Aranacak' kayıtlar için son arama
// sonucunu (ulasildi/sikayet_var/yanlış numara) çeker — çerçeve rengi için gerekli.
async function _aramaKartRenkYukle(tasks){
  const ids=tasks.filter(t=>t.durum==='Tekrar Aranacak').map(t=>t.task_id);
  if(!ids.length) return;
  const {data:sonuclar}=await sb.from('arama_sonuclari').select('task_id,ulasildi,sikayet_var,ulasilamama_neden,created_at').in('task_id',ids).order('created_at',{ascending:false});
  const sonMap={};
  (sonuclar||[]).forEach(s=>{ if(!sonMap[s.task_id]) sonMap[s.task_id]=s; }); // desc sıralı: ilk gelen = en yeni
  tasks.forEach(t=>{ if(sonMap[t.task_id]) t._sonucRaw=sonMap[t.task_id]; });
}

// v31.23 (+v1.0.12 ek dallar): Tamamlanan arama kartındaki tek satır özet — daima
// anlamlı bir şey göstermesi için öncelik sırasına göre (şikayet/yanlış numara/
// yanlış muhatap/sahte şüphesi önce) en önemli bulguyu yansıtır.
function _aramaSonucOzet(s){
  if(!s) return '';
  const kisalt=(t,n)=>{ t=(t||'').trim(); return t.length>n?t.slice(0,n)+'…':t; };
  if(s.ulasilamama_neden==='Yanlış numara') return '☎️ Yanlış numara';
  if(s.ulasildi===false) return 'Ulaşılamadı'+(s.ulasilamama_neden?(' ('+s.ulasilamama_neden+')'):'');
  if(s.sikayet_var===true) return '⚠️ Şikayet: '+(s.sikayet_metni?kisalt(s.sikayet_metni,40):'kayıt var');
  if(s.muhatap_dogru==='Hayır') return '🚫 Yanlış/yetkisiz kişi ile görüşüldü';
  if(s.ziyaret_dogrulandi==='Hayır') return '🚩 Ziyaret teyit edilemedi (sahte şüphesi)';
  if(s.ziyaret_dogrulandi==='Emin değil') return '❓ Ziyaret teyidi belirsiz';
  if(s.ziyaret_dogrulandi==='Gelmedi ama Telefonla konuştuk') return '📞 Ziyaret olmadı, telefonla görüşüldü';
  const p=[];
  if(s.ziyaret_dogrulandi) p.push('Ziyaret teyit: '+s.ziyaret_dogrulandi);
  if(s.memnuniyet) p.push('Memnuniyet '+s.memnuniyet+'/10');
  else if(s.memnuniyet_ret) p.push('Değerlendirmek istemedi');
  if(s.nps!=null) p.push('NPS '+s.nps+'/10');
  if(s.guven==='Hayır') p.push('güven yok');
  if(!p.length) p.push('Görüşüldü');
  return p.join(' · ');
}

function _aramaKart(t,unvanMap,vMap,mod){
  const unvan=unvanMap[t.ncst]||t.ncst||'—';
  const v=vMap[t.visit_id]||{};
  const myAd=v.my_id?(myIdToName[v.my_id]||('MY#'+v.my_id)):'—';
  const zt=v.tarih_saat?fmtDate(v.tarih_saat):'—';
  let alt='';
  if(mod==='aktif'||mod==='gelecek'){
    // v1.1.2 (V31.73): "Gelecek" kartlari onceden sadece bilgi metniydi (Ara/
    // Aramadan Kapat butonu yoktu). Artik aktif sekmedeki fonksiyonlar BIRE BIR
    // ayni — task ARAMA.tasks icinde zaten mevcut oldugundan (acik gorevler
    // gelecek/yeni/tekrar diye sadece kovaya ayriliyor, ayri bir veri kaynagi
    // degil) erken arama yapmakta teknik bir engel yoktu, sadece arayuz kisitliydi.
    const deadlineSatiri=(mod==='gelecek')?`<div class="visit-my" style="color:var(--text3);">Aranacak: ${t.deadline||'—'}</div>`:'';
    alt=`${deadlineSatiri}<div style="display:flex;gap:6px;margin-top:8px;">
      <button class="btn btn-sm" style="flex:1;background:var(--blue);" onclick="araModalAc(${t.task_id})">📞 Ara</button>
      <button class="btn btn-sm" style="flex:1;background:#350f18;border:1.5px solid #ed2345;color:#fff;" onclick="aramadanKapatAc(${t.task_id})">Aramadan Kapat</button></div>`;
  } else {
    // v31.23: her zaman anlamlı bir özet (_aramaSonucOzet) + Detay modalı + yeniden ara
    alt=`<div class="visit-my">${escapeHTML(t.durum)}${t._sonuc?(' · '+escapeHTML(t._sonuc)):''}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();araSonucDetayAc(${t.task_id})">📋 Detay</button>
        <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();araModalAc(${t.task_id})">Yeniden Ara</button>
      </div>`;
  }
  const tekrar=(t.durum==='Tekrar Aranacak'&&(mod==='aktif'||mod==='gelecek'))?' · <span style="color:var(--amber);">Tekrar</span>':'';
  const kisalt=(s,n)=>{ s=(s||'').trim(); return s.length>n?s.slice(0,n)+'…':s; };
  const ozetSatir = (v.ziyaret_amaci||v.urun_gruplari)
    ? `<div class="visit-my" style="color:var(--text3);">Amaç: ${escapeHTML(v.ziyaret_amaci||'—')}${v.urun_gruplari?(' · Ürün: '+escapeHTML(kisalt(v.urun_gruplari,50))):''}</div>` : '';
  const renk=_aramaKartRenk(t);
  const stilParca=[]; if(renk) stilParca.push(`border:1.5px solid ${renk};`); if(mod==='tamamlanan') stilParca.push('cursor:pointer;');
  const cerceve=stilParca.length?` style="${stilParca.join('')}"`:'';
  const tiklaAttr=(mod==='tamamlanan')?` onclick="araSonucDetayAc(${t.task_id})"`:'';
  // V31.49: aynı kişi uyarısı — aktif ve gelecek (aranacak) kartlarda anlamlı
  const ayniKisi=(mod==='aktif'||mod==='gelecek')?_aramaAyniKisiSerit(t.task_id,'kart'):'';
  // V31.53: "aranmak istemiyor" uyarısı — açık çağrılarda gösterilir
  const istemiyor=(mod==='aktif'||mod==='gelecek')?_aramaIstemiyorBant(t.task_id,'kart'):'';
  return `<div class="visit-card"${tiklaAttr}${cerceve}><div class="visit-firm">${escapeHTML(unvan)}</div>
    <div class="visit-my">Ziyaret: ${escapeHTML(myAd)} · ${zt}${tekrar}</div>${ozetSatir}${istemiyor}${ayniKisi}${alt}</div>`;
}

// v1.0.14: KÇM -> MY/FMY iki kademeli filtre. Düz "Tüm personel" listesi çok
// KÇM'li kapsamlarda kalabalık oluyordu — önce KÇM seçilir, MY/FMY açılır
// listesi sadece o KÇM'nin personelini gösterir.
async function _aramaMyKcmMap(){
  if(ARAMA._myKcmMap) return ARAMA._myKcmMap;
  const {data}=await sb.from('users').select('my_id,kcm_id');
  const map={}; (data||[]).forEach(u=>map[u.my_id]=u.kcm_id);
  ARAMA._myKcmMap=map;
  return map;
}
// KÇM açılır listesi — TÜM kapsamı yoksa yalnızca kendi KÇM'si (tek seçenek).
async function _aramaKcmSecenekleriHTML(seciliKcm){
  const izinMy = await _analizIzinMyList(); // null = TÜM
  const {data:kcmler}=await sb.from('kcm_groups').select('kcm_id,kcm_adi').order('kcm_adi');
  let list=kcmler||[];
  if(izinMy!==null && currentUser.kcm_id) list=list.filter(k=>String(k.kcm_id)===String(currentUser.kcm_id));
  return '<option value="">Tüm KÇM\'ler</option>'+list.map(k=>`<option value="${k.kcm_id}"${String(seciliKcm)===String(k.kcm_id)?' selected':''}>${escapeHTML(k.kcm_adi)}</option>`).join('');
}
// MY/FMY açılır listesi — kapsam izni + (varsa) seçili KÇM'ye göre daralır.
async function _aramaMySecenekleriHTML(seciliMy, seciliKcm){
  const izinMy = await _analizIzinMyList(); // null = TÜM
  const kcmMap = await _aramaMyKcmMap();
  let ids = Object.keys(myIdToName).map(Number);
  if(Array.isArray(izinMy) && izinMy.length) ids = ids.filter(id=>izinMy.includes(id));   // V31.53: boş dizi listeyi boşaltmasın
  if(seciliKcm) ids = ids.filter(id=>String(kcmMap[id])===String(seciliKcm));
  ids.sort((a,b)=>(myIdToName[a]||'').localeCompare(myIdToName[b]||'','tr'));
  return '<option value="">Tüm MY/FMY</option>'+ids.map(id=>`<option value="${id}"${String(seciliMy)===String(id)?' selected':''}>${escapeHTML(myIdToName[id]||('#'+id))}</option>`).join('');
}
// KÇM değişince bağlı MY/FMY listesini yeniden kurup ekranı yeniler.
async function _aramaKcmDegisti(){
  _aramaFiltreOku();
  const myEl=document.getElementById('aramaFMy');
  if(myEl){ ARAMA.filtre.my=''; myEl.innerHTML=await _aramaMySecenekleriHTML('',ARAMA.filtre.kcm); }
  loadAramaListe(false);
}
// Firma adı arama kutusu her tuş vuruşunda sorgu atmasın diye basit debounce.
let _aramaAramaDebounceTimer=null;
function _aramaAramaDebounce(fn){
  clearTimeout(_aramaAramaDebounceTimer);
  _aramaAramaDebounceTimer=setTimeout(fn,400);
}
// v1.0.14: bir zaman damgasının Europe/Istanbul TAKVİM GÜNÜ (YYYY-MM-DD).
function _aramaZiyaretGunu(tarihSaat){
  if(!tarihSaat) return null;
  try{ return new Date(tarihSaat).toLocaleDateString('sv-SE',{timeZone:'Europe/Istanbul'}); }catch(e){ return null; }
}
// v1.0.14: BUG FIX — tarih filtresi artık ARAMA/görev tarihini değil, ZİYARET
// tarihini (visits.tarih_saat) baz alıyor. Önceki hâli tasks.deadline/
// tamamlanma_tarihi üzerinden filtreliyordu — kullanıcı "15 Ağustos'ta yapılan
// ziyaretlerin teyit aramalarını göster" derken görev/arama tarihine göre
// filtreleniyordu, bu da beklenenle örtüşmüyordu.
// Bekleyen/Tamamlanan listelerinde firma adı + KÇM + MY/FMY + ziyaret tarihi
// filtresi — tasks tablosunda bu alanların hiçbiri olmadığı için enrich
// adımında zaten yüklenen unvanMap/vMap üzerinden, ekstra sorgu atmadan
// client-side süzülür. Not: bu filtre sadece o an ekrana çekilmiş sayfadaki
// kayıtlarda arar (limit 500/300) — çok eski/geniş bir aralıkta arıyorsanız
// önce durum/KÇM ile daraltın.
function _aramaClientFiltre(tasks, unvanMap, vMap, opts){
  const {aramaText, myFiltre, kcmFiltre, bas, bit} = opts||{};
  let list=tasks;
  if(kcmFiltre) list=list.filter(t=>{ const v=vMap[t.visit_id]; return v && String(v.kcm_id)===String(kcmFiltre); });
  if(myFiltre) list=list.filter(t=>{ const v=vMap[t.visit_id]; return v && String(v.my_id)===String(myFiltre); });
  if(bas||bit){
    list=list.filter(t=>{
      const v=vMap[t.visit_id]; const g=v&&_aramaZiyaretGunu(v.tarih_saat);
      if(!g) return false;
      if(bas && g<bas) return false;
      if(bit && g>bit) return false;
      return true;
    });
  }
  const q=(aramaText||'').trim().toLocaleLowerCase('tr-TR');
  if(q) list=list.filter(t=>(unvanMap[t.ncst]||t.ncst||'').toLocaleLowerCase('tr-TR').includes(q));
  return list;
}

// ============================================================
// V31.53: ARAMA LISTESI BORU HATTI
// Eskiden loadAramaBugun/Gelecek/Tamamlanan her biri kendi filtre panelini
// kurar, kendi sorgusunu atardi. Bu üç sorunu doguruyordu:
//   • Sekme degisince veya modaldan donunce panel sifirdan kuruluyor, filtreler
//     kayboluyordu.
//   • Kutulardaki sayaclar ayri COUNT sorgularindan geliyordu; filtreyle
//     ilgisi yoktu (1 gun filtrelesen bile kutuda toplam yaziyordu).
//   • Bir sekmenin verisi digerinin sayacini hesaplayamiyordu.
// Yeni yapi: acik gorevler TEK sorguda cekilir, bir kez zenginlestirilir,
// filtre bir kez uygulanir, sonra dort kovaya bolunur. Filtre degisimi
// sunucuya gitmez (yenidenYukle=false) — aninda tepki verir.
// ============================================================
function _aramaFiltreOku(){
  const g=id=>document.getElementById(id)?.value||'';
  const eskiGG=(ARAMA.filtre&&ARAMA.filtre.gelecekGoster)||'aranacak'; // V31.81: chip alanindan gelir, DOM value degil
  ARAMA.filtre={
    bas:g('aramaFBas'), bit:g('aramaFBit'), kcm:g('aramaFKcm'),
    my:g('aramaFMy'),   q:g('aramaFQ'),     tamDurum:g('aramaFTamDurum'),
    gelecekGoster:eskiGG
  };
}

async function _aramaFiltrePanel(){
  const fEl=document.getElementById('aramaFiltre'); if(!fEl) return;
  const F=ARAMA.filtre||(ARAMA.filtre={bas:'',bit:'',kcm:'',my:'',q:'',tamDurum:'',gelecekGoster:'aranacak'});
  const tamamSekme=(ARAMA.aktifSekme==='tamamlanan');
  const gelecekSekme=(ARAMA.aktifSekme==='gelecek');   // V31.81
  if(!fEl.dataset.ready){
    const bugun=_istanbulBugun();
    fEl.innerHTML=`<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">Ziyaret tarihi aralığı</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
      <input type="date" id="aramaFBas" value="${escapeHTML(F.bas)}" onchange="_aramaFiltreDegisti()" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      <input type="date" id="aramaFBit" value="${escapeHTML(F.bit)}" max="${bugun}" onchange="_aramaFiltreDegisti()" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      <button class="btn btn-sm btn-ghost" onclick="_aramaFiltreTemizle()">Temizle</button></div>
      <div id="aramaFTamDurumSatir" class="${tamamSekme?'':'hide'}" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
      <select id="aramaFTamDurum" onchange="_aramaFiltreDegisti()" style="flex:1;min-width:150px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
        <option value="">Tüm durumlar</option>
        <option value="Tamamlandı">Tamamlandı</option>
        <option value="Ulaşılamıyor">Ulaşılamayan (tekrar aranabilir)</option>
        <option value="Aramadan Kapatıldı">Aramadan kapatıldı</option>
        <option value="Arama Yapılmadı">Arama yapılmadı (SLA)</option>
      </select>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
      <select id="aramaFKcm" onchange="_aramaKcmDegisti()" style="flex:1;min-width:130px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;"></select>
      <select id="aramaFMy" onchange="_aramaFiltreDegisti()" style="flex:1;min-width:130px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;"></select>
      </div>
      <div id="aramaFGelecekSatir" class="${gelecekSekme?'':'hide'}" style="display:flex;gap:6px;margin-bottom:6px;">
      <div class="chip-btn${F.gelecekGoster!=='aranmayacak'?' selected':''}" style="flex:1;text-align:center;" onclick="_aramaGelecekGosterSec('aranacak')">✅ Aranacak</div>
      <div class="chip-btn${F.gelecekGoster==='aranmayacak'?' selected':''}" style="flex:1;text-align:center;" onclick="_aramaGelecekGosterSec('aranmayacak')">🚫 Aranmayacak</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      <input type="text" id="aramaFQ" value="${escapeHTML(F.q)}" placeholder="Müşteri adı ara…" oninput="_aramaAramaDebounce(_aramaFiltreDegisti)" style="flex:1;min-width:140px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      </div>`;
    fEl.dataset.ready='1';
    const kcmEl=document.getElementById('aramaFKcm'); if(kcmEl) kcmEl.innerHTML=await _aramaKcmSecenekleriHTML(F.kcm);
    const myEl=document.getElementById('aramaFMy');  if(myEl)  myEl.innerHTML =await _aramaMySecenekleriHTML(F.my,F.kcm);
    const tdEl=document.getElementById('aramaFTamDurum'); if(tdEl) tdEl.value=F.tamDurum||'';
  }else{
    // Panel duruyor — sadece ilgili sekmeye ozel satirlarin gorunurlugu degisir
    const satir=document.getElementById('aramaFTamDurumSatir');
    if(satir) satir.classList.toggle('hide', !tamamSekme);
    const gSatir=document.getElementById('aramaFGelecekSatir');   // V31.81
    if(gSatir) gSatir.classList.toggle('hide', !gelecekSekme);
  }
}
// V31.81: "Gelecek" sekmesindeki ARANACAK/ARANMAYACAK sekmesi (chip secimi,
// DOM input degil — ARAMA.filtre.gelecekGoster'a yazilir).
function _aramaGelecekGosterSec(v){
  ARAMA.filtre=ARAMA.filtre||{}; ARAMA.filtre.gelecekGoster=v;
  const kutu=document.getElementById('aramaFGelecekSatir');
  if(kutu) Array.from(kutu.children).forEach((el,i)=>el.classList.toggle('selected', (i===0)===(v==='aranacak')));
  loadAramaListe(false);
}

function _aramaFiltreDegisti(){ _aramaFiltreOku(); loadAramaListe(false); }
function _aramaFiltreTemizle(){ _aramaFiltreSifirla(); loadAramaListe(false); }

// Acik gorevler (tum deadline'lar) + tamamlananlar TEK seferde cekilir.
// v1.1.0 (V31.7x): ARAMA MODULU KCM VERI KISITI — kritik guvenlik duzeltmesi.
// Onceden bu modul hicbir rol/KCM kisiti uygulamiyordu; ekrandaki KCM dropdown'u
// sadece gorsel bir filtreydi (guvenlik siniri degildi), herhangi bir KCM
// Muduru "Tum KCM'ler"i secip diger bolgelerin tum arama kayitlarini gorebiliyordu.
// Cozum: yetki.js'teki YETKI_MODUL_ADLARI'na 'arama' eklendi -> Rol & Yetki
// ekraninda diger moduller gibi TUM/KCM/BAGLI/PRT+/PRT scope secici cikar.
// Rol & Yetki'den HENUZ hicbir ayar yapilmamissa (bugunku durum), guvenli
// varsayilan uygulanir: KCM'i olan her rol (MY/FMY/KCM Muduru/Takim Lideri vb.)
// otomatik olarak SADECE KENDI KCM'sini gorur; KCM'i olmayan roller (Admin,
// Satis Direktoru, Cagri Merkezi Uzmani) degisiklik olmadan TUMUNU gormeye
// devam eder. Rol & Yetki'den 'arama' icin scope ayarlanirsa o deger geçerli olur.
function _aramaScope(){
  const cfg=(window.PERM&&window.PERM.scope&&window.PERM.scope['arama']);
  if(cfg && Object.keys(cfg).length) return (typeof getScope==='function')?getScope('arama'):'KÇM';
  return currentUser.kcm_id ? 'KÇM' : 'TÜM';
}
// Kisitli roller icin izinli ncst kumesi (customers.kcm_id uzerinden). null = kisit yok.
// Hata halinde GUVENLI TARAFTA KAL: bos kume donup hicbir kayit gostermeyerek
// yanlislikla baska KCM verisinin sizmasini onler (ag hatasi olursa "gorunmuyor"
// daha iyidir, "her seyi gosteriyor" degil).
async function _aramaIzinNcstSet(){
  const scope=_aramaScope();
  if(scope==='TÜM') return null;
  if(!currentUser.kcm_id) return null;
  const set=new Set(); let from=0;
  try{
    while(true){
      const {data,error}=await sb.from('customers').select('ncst').eq('kcm_id',currentUser.kcm_id).range(from,from+999);
      if(error) throw error;
      (data||[]).forEach(r=>set.add(String(r.ncst)));
      if(!data||data.length<1000) break; from+=1000;
    }
  }catch(e){
    console.error('[arama] KCM izin listesi alinamadi, guvenlik nedeniyle kayitlar gizleniyor:',e);
    if(typeof toast==='function') toast('Arama izin listesi yuklenemedi, guvenlik icin kayitlar gosterilmiyor','error');
    return new Set();
  }
  return set;
}

async function _aramaVeriYukle(){
  const typeId=await _aramaTeyitTypeId();
  const ACIK=['Aranacak','Tekrar Aranacak'];
  const TAMAM=['Tamamlandı','Ulaşılamıyor','Aramadan Kapatıldı','Arama Yapılmadı'];
  const izinNcstSet=await _aramaIzinNcstSet();

  // Acik gorevler — sinirsiz sayfalama (deadline sinirlamasi YOK, kovalar ayirir)
  const SAYFA=1000; let acik=[], bas=0;
  while(true){
    const {data,error}=await sb.from('tasks')
      .select('task_id,ncst,visit_id,durum,deadline')
      .eq('type_id',typeId).in('durum',ACIK)
      .order('deadline',{ascending:true}).range(bas,bas+SAYFA-1);
    if(error){ console.error('[arama] açık görevler:',error); break; }
    const parca=data||[]; acik=acik.concat(parca);
    if(parca.length<SAYFA || acik.length>=20000) break;
    bas+=SAYFA;
  }
  if(izinNcstSet) acik=acik.filter(t=>izinNcstSet.has(String(t.ncst)));

  // v1.1.1 (V31.72): "300+" yerine TAM RAKAM. KCM'e kisitli kullanicilar icin
  // tamamlanan listesi zaten (butun sistemin degil) tek bir KCM'nin alt kumesi
  // oldugundan 300 tavanina hic gerek yok — acik gorevler gibi sinirsiz sayfalanir,
  // gosterilen sayi dogrudan tam ve dogru olur. TUM kapsamli kullanicilar icin
  // (Admin vb.) performans amacli 300 tavanı liste render'inda korunur, ama
  // ayri bir exact count sorgusu ile SAYAC her zaman tam rakami gosterir.
  let tamam=[];
  if(izinNcstSet){
    let tb=0;
    while(true){
      const {data,error}=await sb.from('tasks')
        .select('task_id,ncst,visit_id,durum,deadline,tamamlanma_tarihi')
        .eq('type_id',typeId).in('durum',TAMAM)
        .order('tamamlanma_tarihi',{ascending:false}).range(tb,tb+999);
      if(error){ console.error('[arama] tamamlananlar:',error); break; }
      const parca=(data||[]).filter(t=>izinNcstSet.has(String(t.ncst)));
      tamam=tamam.concat(parca);
      if(!data||data.length<1000) break; tb+=1000;
    }
    ARAMA._tamamTavan=false; // KCM kisitinda tam liste cekildi, tavan yok
  } else {
    const {data:tamamRaw,error:tErr}=await sb.from('tasks')
      .select('task_id,ncst,visit_id,durum,deadline,tamamlanma_tarihi')
      .eq('type_id',typeId).in('durum',TAMAM)
      .order('tamamlanma_tarihi',{ascending:false}).limit(300);
    if(tErr) console.error('[arama] tamamlananlar:',tErr);
    tamam=tamamRaw||[];
    ARAMA._tamamTavan=false;
    ARAMA._tamamGercekSayi=tamam.length; // exact count gelene kadar gecici deger
    try{
      const {count,error:cErr}=await sb.from('tasks').select('task_id',{count:'exact',head:true}).eq('type_id',typeId).in('durum',TAMAM);
      if(!cErr && count!=null) ARAMA._tamamGercekSayi=count;
    }catch(e){ console.error('[arama] tamamlanan exact count alinamadi:',e); }
  }
  if(izinNcstSet) ARAMA._tamamGercekSayi=tamam.length; // KCM kisitinda liste zaten tam, ekstra sorguya gerek yok

  const hepsi=acik.concat(tamam);
  ARAMA.tasks=hepsi;                        // aynı kişi tespiti ve kart render bunu okur
  await _aramaKartRenkYukle(hepsi);         // 'Tekrar Aranacak' kartlarinin cerceve rengi

  // Tamamlananlarin son arama sonucu ozeti
  if(tamam.length){
    const ids=tamam.map(t=>t.task_id);
    const {data:sonuclar}=await sb.from('arama_sonuclari')
      .select('task_id,ulasildi,memnuniyet,memnuniyet_ret,nps,guven,ulasilamama_neden,muhatap_dogru,ziyaret_dogrulandi,sikayet_var,sikayet_metni,created_at')
      .in('task_id',ids).order('created_at',{ascending:false});
    const sMap={}; (sonuclar||[]).forEach(x=>{ if(!sMap[x.task_id]) sMap[x.task_id]=x; });
    tamam.forEach(t=>{ const x=sMap[t.task_id]; if(x){ t._sonucRaw=x; t._sonuc=_aramaSonucOzet(x); } });
  }

  const {unvanMap,vMap}=await _aramaEnrich(hepsi);
  ARAMA.veri={acik,tamam,unvanMap,vMap};
}

// Filtreyi uygular, dort kovaya boler.
function _aramaKovala(){
  const V=ARAMA.veri||{acik:[],tamam:[],unvanMap:{},vMap:{}};
  const F=ARAMA.filtre||{};
  const bugun=_istanbulBugun();
  const opt={aramaText:F.q,myFiltre:F.my,kcmFiltre:F.kcm,bas:F.bas,bit:F.bit};
  const acik =_aramaClientFiltre(V.acik ,V.unvanMap,V.vMap,opt);
  let  tamam =_aramaClientFiltre(V.tamam,V.unvanMap,V.vMap,opt);
  if(F.tamDurum) tamam=tamam.filter(t=>t.durum===F.tamDurum);
  return {
    yeni:       acik.filter(t=>t.durum==='Aranacak'        && t.deadline && t.deadline<=bugun),
    tekrar:     acik.filter(t=>t.durum==='Tekrar Aranacak' && t.deadline && t.deadline<=bugun),
    gelecek:    acik.filter(t=>t.deadline && t.deadline>bugun),
    tamamlanan: tamam
  };
}

// ============================================================
// V31.81: GELECEK -> ARANACAK / ARANMAYACAK
// Bir gorev su sirayla (ilk uyan kazanir) ARANMAYACAK sayilir:
//   1) Kontak "aranmak istemiyor" isaretli (contacts.aranmak_istemiyor)
//   2) Ayni NCST icin son N gunde (sistem_ayarlari.arama_cooldown_gun,
//      admin ekranindan degistirilebilir) zaten BASARIYLA teyit edilmis
//      (arama_sonuclari.ulasildi=true) bir kayit var
//   3) Ayni gun+MY+kisi grubunda (V31.49 "ayni kisi tespiti", ARAMA.gruplar)
//      ilk gorev degil — o kisi zaten baska bir kayit uzerinden aranacak
// Hicbiri uymuyorsa ARANACAK. Sonuc task_id -> {aranacak,neden,renk} haritasi.
// ============================================================
async function _aramaGelecekAranacakHesapla(gelecekListesi){
  const map=new Map();
  if(!gelecekListesi || !gelecekListesi.length) return map;

  const kalanlar1=[];
  gelecekListesi.forEach(t=>{
    const v=ARAMA.vMap?.[t.visit_id]; const k=v?ARAMA.kMap?.[v.visit_id]:null;
    if(k && k.aranmak_istemiyor) map.set(t.task_id,{aranacak:false,neden:'Aranmak istemiyor',renk:'var(--red)'});
    else kalanlar1.push(t);
  });

  let cd=10;
  try{ if(typeof _aramaCooldownGun==='function') cd=await _aramaCooldownGun(); }catch(e){}
  const sinir=_istanbulTarihEkle(-cd);
  const ncstList=[...new Set(kalanlar1.map(t=>t.ncst).filter(Boolean))];
  let teyitliNcst=new Set();
  if(ncstList.length){
    try{
      const {data,error}=await sb.from('arama_sonuclari').select('ncst').eq('ulasildi',true)
        .in('ncst',ncstList).gte('created_at',sinir+'T00:00:00+03:00');
      if(error) console.error('[arama] gelecek cooldown kontrolu:',error);
      else teyitliNcst=new Set((data||[]).map(r=>String(r.ncst)));
    }catch(e){ console.error('[arama] gelecek cooldown kontrolu:',e); }
  }
  const kalanlar2=[];
  kalanlar1.forEach(t=>{
    if(teyitliNcst.has(String(t.ncst))) map.set(t.task_id,{aranacak:false,neden:'Son '+cd+' günde zaten teyit edildi',renk:'var(--orange)'});
    else kalanlar2.push(t);
  });

  kalanlar2.forEach(t=>{
    const ids=ARAMA.gruplar?ARAMA.gruplar[t.task_id]:null;
    if(ids && ids.length>1){
      const temsilci=Math.min(...ids);
      if(t.task_id!==temsilci){
        map.set(t.task_id,{aranacak:false,neden:'Aynı kişi bugün başka bir firma için zaten aranacak',renk:'var(--blue)'});
        return;
      }
    }
    map.set(t.task_id,{aranacak:true,neden:null,renk:null});
  });
  return map;
}

async function loadAramaListe(yenidenYukle){
  const g=document.getElementById('aramaListeGovde'); if(!g) return;
  await _aramaFiltrePanel();
  if(yenidenYukle || !ARAMA.veri){
    g.innerHTML='<div class="loader"><div class="spinner"></div></div>';
    await _aramaVeriYukle();
    const bugun0=_istanbulBugun();
    const gelecekHam=(ARAMA.veri?.acik||[]).filter(t=>t.deadline && t.deadline>bugun0);
    ARAMA._gelecekAranacakMap=await _aramaGelecekAranacakHesapla(gelecekHam);
  }
  const kova=_aramaKovala();
  _aramaSayaclariYaz(kova);
  const sekme=ARAMA.aktifSekme||'yeni';
  const V=ARAMA.veri;
  const bosMetin={yeni:'Yeni (hiç aranmamış) çağrı yok.',tekrar:'Tekrar aranacak çağrı yok.',
                  gelecek:'Gelecek çağrı yok.',tamamlanan:'Tamamlanan kayıt yok.'}[sekme]||'Kayıt yok.';
  const liste=kova[sekme]||[];
  if(!liste.length){ g.innerHTML='<div class="empty">'+bosMetin+'</div>'; return; }

  if(sekme==='gelecek'){
    // V31.81: ARANACAK/ARANMAYACAK ayrimi — bkz. _aramaGelecekAranacakHesapla.
    const gMap=ARAMA._gelecekAranacakMap||new Map();
    const gosterAranmayacak=(ARAMA.filtre.gelecekGoster==='aranmayacak');
    const filtreliListe=liste.filter(t=>{
      const x=gMap.get(t.task_id); const aranacakMi=!x||x.aranacak!==false;
      return gosterAranmayacak?!aranacakMi:aranacakMi;
    });
    if(!filtreliListe.length){ g.innerHTML='<div class="empty">'+(gosterAranmayacak?'Aranmayacak kayıt yok.':'Aranacak kayıt yok.')+'</div>'; return; }

    if(gosterAranmayacak){
      // Bilgi karti — arama butonu yok, sadece neden + renk kodu.
      let h='';
      filtreliListe.forEach(t=>{
        const x=gMap.get(t.task_id)||{neden:'—',renk:'var(--text3)'};
        const unvan=V.unvanMap[t.ncst]||t.ncst||'—';
        h+=`<div class="visit-card" style="border-left:3px solid ${x.renk};">
          <div class="visit-firm">${escapeHTML(unvan)}</div>
          <div class="visit-my">Aranacak tarihiydi: ${t.deadline||'—'}</div>
          <div class="visit-my" style="color:${x.renk};font-weight:600;">${escapeHTML(x.neden||'')}</div>
        </div>`;
      });
      g.innerHTML=h; return;
    }
    // ARANACAK — deadline'a gore gruplu gosterim (eski davranis korundu)
    const gruplar={}; filtreliListe.forEach(t=>{ (gruplar[t.deadline]=gruplar[t.deadline]||[]).push(t); });
    let h='';
    Object.keys(gruplar).sort().forEach(d=>{
      h+=`<div style="font-weight:700;font-size:13px;margin:12px 0 6px;color:var(--text);">${d} <span style="color:var(--text3);font-weight:400;">(${gruplar[d].length})</span></div>`;
      h+=gruplar[d].map(t=>_aramaKart(t,V.unvanMap,V.vMap,'gelecek')).join('');
    });
    g.innerHTML=h; return;
  }
  const mod=(sekme==='tamamlanan')?'tamamlanan':'aktif';
  g.innerHTML=liste.map(t=>_aramaKart(t,V.unvanMap,V.vMap,mod)).join('');
}

// V31.53: loadAramaGelecek / loadAramaTamamlanan kaldirildi — ikisinin de isi
// artik loadAramaListe() icinde, tek veri kaynagi + tek filtre uzerinden yapiliyor.



// ============================================================
// v31.23: Tamamlanan arama kaydı — DETAY modalı. Bir göreve ait TÜM
// arama_sonuclari denemelerini (deneme_no sırasıyla), her alanı boş
// olmayanları göstererek listeler. Kart tıklaması ve "📋 Detay" tuşu buraya bağlı.
// ============================================================
async function araSonucDetayAc(taskId){
  let t=(ARAMA.tasks||[]).find(x=>x.task_id===taskId);
  if(!t){
    // v1.1.4: Cagri Analizi ekrani ARAMA.tasks bellek onbelleginden bagimsiz,
    // daha genis/farkli tarih araligiyla sorgu yapiyor — bellekte olmayan bir
    // gorev secildiginde eskiden "Kayit bulunamadi" hatasi veriyordu. Simdi
    // bulunamazsa veritabanindan dogrudan cekiliyor.
    const {data:tRaw}=await sb.from('tasks').select('task_id,ncst,visit_id,durum').eq('task_id',taskId).maybeSingle();
    t=tRaw;
  }
  if(!t){ toast('Kayıt bulunamadı','error'); return; }
  const kunyeEl=document.getElementById('aramaSonucDetayKunye');
  const icerikEl=document.getElementById('aramaSonucDetayIcerik');
  if(icerikEl) icerikEl.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  if(kunyeEl) kunyeEl.innerHTML='';
  openModal('aramaSonucDetayModal');

  let unvan=t.ncst, myAd='—', zt='—';
  const [{data:c}, vRes] = await Promise.all([
    sb.from('customers').select('unvan').eq('ncst',t.ncst).maybeSingle(),
    t.visit_id ? sb.from('visits').select('my_id,tarih_saat').eq('visit_id',t.visit_id).maybeSingle() : Promise.resolve({data:null})
  ]);
  if(c?.unvan) unvan=c.unvan;
  if(vRes?.data){
    myAd = vRes.data.my_id?(myIdToName[vRes.data.my_id]||('MY#'+vRes.data.my_id)):'—';
    zt = vRes.data.tarih_saat?fmtDate(vRes.data.tarih_saat):'—';
  }
  if(kunyeEl) kunyeEl.innerHTML=`<b>${escapeHTML(unvan)}</b><br>Ziyaret: ${escapeHTML(myAd)} · ${zt} · Görev durumu: ${escapeHTML(t.durum)}`;

  // v31.24: select('*') kullanılır — sabit kolon listesi, canlı şemada tek bir
  // kolon adı bile uyuşmazsa PostgREST TÜM select'i reddediyor ve hata sessizce
  // yutulup 'kayıt yok' gibi görünüyordu. '*' + hata mesajını göstermek bunu önler.
  const {data:sonuclar, error:sonucErr}=await sb.from('arama_sonuclari')
    .select('*')
    .eq('task_id',taskId).order('created_at',{ascending:true});
  if(!icerikEl) return;
  if(sonucErr){
    console.error('araSonucDetayAc select hatası:', sonucErr);
    icerikEl.innerHTML='<div class="empty">Kayıtlar yüklenirken hata oluştu: '+escapeHTML(sonucErr.message||String(sonucErr))+'</div>';
    return;
  }
  if(!sonuclar || !sonuclar.length){ icerikEl.innerHTML='<div class="empty">Bu görev için arama kaydı bulunamadı.</div>'; return; }

  const boolTxt=(b)=> b===true?'Evet':(b===false?'Hayır':'');
  const blok=(label,val)=>{
    if(val===null||val===undefined||val==='') return '';
    return `<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">
      <span style="color:var(--text3);">${escapeHTML(label)}</span><span style="color:var(--text);text-align:right;">${escapeHTML(String(val))}</span></div>`;
  };

  icerikEl.innerHTML = sonuclar.map((s,i)=>{
    let renk='var(--border)';
    if(s.sikayet_var===true || s.ulasilamama_neden==='Yanlış numara') renk='var(--red)';
    else if(s.muhatap_dogru==='Hayır') renk='var(--orange)';
    else if(s.ziyaret_dogrulandi==='Hayır' || s.ziyaret_dogrulandi==='Emin değil') renk='var(--purple)';
    else if(s.ziyaret_dogrulandi==='Gelmedi ama Telefonla konuştuk') renk='var(--blue)';
    else if(s.ziyaret_dogrulandi==='Evet') renk='var(--green)';
    else if(s.ulasildi===false) renk='var(--orange)';
    const agentAd = s.agent_id?(myIdToName[s.agent_id]||('#'+s.agent_id)):'—';
    const baslik='Deneme '+(s.deneme_no||(i+1))+' · '+(s.created_at?fmtDate(s.created_at):'—')+' · '+agentAd;
    let gov='';
    gov+=blok('Ulaşıldı mı', boolTxt(s.ulasildi));
    gov+=blok('Ulaşılamama nedeni', s.ulasilamama_neden);
    gov+=blok('Telefon', s.telefon);
    gov+=blok('Doğru muhatap mı', s.muhatap_dogru);
    gov+=blok('Görüşmek uygun muydu', boolTxt(s.gorusmek_istedi));
    gov+=blok('Sonra aranmak istedi mi', boolTxt(s.sonra_aranmak_istedi));
    gov+=blok('Sonraki arama tarihi', s.sonraki_arama_tarihi?fmtDate(s.sonraki_arama_tarihi):'');
    gov+=blok('Ziyaret teyit edildi mi', s.ziyaret_dogrulandi);
    gov+=blok('Görüşme şekli', s.yuzyuze_uyusmazlik===true?'Telefonla':(s.yuzyuze_uyusmazlik===false?'Yüz yüze':''));
    gov+=blok('Ziyaret edenin adı doğru mu', s.isim_dogru);
    gov+=blok('Ziyaret olmadıysa neden', s.ziyaret_yok_neden);
    gov+=blok('Görüşme süresi', s.gorusme_suresi);
    gov+=blok('Temsilci güven verdi mi', s.guven);
    gov+=blok('İhtiyaç anlaşıldı mı', s.ihtiyac_anlasildi);
    gov+=blok('Memnuniyet', s.memnuniyet?(s.memnuniyet+'/10'):(s.memnuniyet_ret?'Değerlendirmek istemedi':''));
    gov+=blok('NPS (tavsiye)', s.nps!=null?(s.nps+'/10'):'');
    gov+=blok('Takip sözü verildi mi', boolTxt(s.takip_sozu));
    gov+=blok('Takip sözü tutuldu mu', boolTxt(s.takip_tutuldu));
    gov+=blok('Kayıt türü', s.kayit_turu==='sikayet'?'Şikayet':(s.kayit_turu==='talep'?'Talep':''));
    gov+=blok('Kimi şikayet ediyor', s.sikayet_kimi);
    gov+=blok('Şikayet konusu', s.sikayet_my_neden);
    gov+=blok('Şikayet / talep detayı', s.sikayet_metni);
    gov+=blok('Agent notu', s.agent_notu);
    return `<div style="border-left:3px solid ${renk};background:var(--navy3);border-radius:8px;padding:8px 10px;margin-bottom:10px;">
      <div style="font-weight:700;font-size:12px;color:var(--text);margin-bottom:4px;">${escapeHTML(baslik)}</div>${gov}
    </div>`;
  }).join('');
}

// SLA: deadline'ı N (parametrik, vars. 7) günden fazla geçmiş ve hâlâ Aranacak/Tekrar
// Aranacak görevleri "Arama Yapılmadı" olarak kapatır (anlık — ekran açılışında).
async function _aramaSlaOtomatikKapat(typeId){
  try{
    const sla=await _aramaSlaGun();
    const sinirStr=_istanbulTarihEkle(-sla);
    const {data:eskiler}=await sb.from('tasks').select('task_id,ncst,visit_id')
      .eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak'])
      .lt('deadline',sinirStr);
    if(!eskiler || !eskiler.length) return;
    for(const t of eskiler){
      await sb.from('tasks').update({durum:'Arama Yapılmadı', tamamlanma_tarihi:new Date().toISOString(), guncelleme_tarihi:new Date().toISOString()}).eq('task_id',t.task_id);
      await sb.from('arama_sonuclari').insert({
        task_id:t.task_id, visit_id:t.visit_id, ncst:t.ncst, agent_id:currentUser.my_id,
        ulasildi:false, ulasilamama_neden:'Arama Yapılmadı (SLA '+sla+' gün)', agent_notu:'Otomatik SLA kapanışı'
      });
    }
    toast(eskiler.length+' arama SLA ile kapatıldı','info');
  }catch(e){ console.warn('SLA kapama:', e); }
}

// ---- Aramadan Kapat (sebepli) ----
const ARAMADAN_KAPAT_NEDEN=['Yakında tekrar ziyaret edilecek','Bilgi yetersiz','Yönetici talimatı','Diğer'];
let _aramaKapatTaskId=null;
function aramadanKapatAc(taskId){
  _aramaKapatTaskId=taskId;
  const box=document.getElementById('aramadanKapatNedenler');
  if(box) box.innerHTML=ARAMADAN_KAPAT_NEDEN.map(n=>`<div class="sonuc-item" onclick="_aramadanKapatSec(this,'${escapeHTML(n)}')">${escapeHTML(n)}</div>`).join('');
  const notEl=document.getElementById('aramadanKapatNot'); if(notEl) notEl.value='';
  window._aramadanKapatNeden=null;
  openModal('aramadanKapatModal');
}
function _aramadanKapatSec(el,neden){
  document.querySelectorAll('#aramadanKapatNedenler .sonuc-item').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  window._aramadanKapatNeden=neden;
}
async function aramadanKapatKaydet(){
  if(!_aramaKapatTaskId) return;
  const neden=window._aramadanKapatNeden;
  if(!neden){ toast('Bir neden seçin','error'); return; }
  const not=(document.getElementById('aramadanKapatNot')?.value||'').trim();
  const t=ARAMA.tasks.find(x=>x.task_id===_aramaKapatTaskId)||{};
  await sb.from('tasks').update({durum:'Aramadan Kapatıldı', tamamlanma_tarihi:new Date().toISOString(), guncelleme_tarihi:new Date().toISOString()}).eq('task_id',_aramaKapatTaskId);
  await sb.from('arama_sonuclari').insert({
    task_id:_aramaKapatTaskId, visit_id:t.visit_id, ncst:t.ncst, agent_id:currentUser.my_id,
    ulasildi:null, ulasilamama_neden:'Aramadan Kapatıldı: '+neden, agent_notu:not||null
  });
  toast('Kayıt aramadan kapatıldı','success');
  closeModal('aramadanKapatModal');
  _aramaKapatTaskId=null;
  loadAramaListesi();
}

// ============================================================
// 3b-1: ARA anket modalı (aşama aşama) + arama_sonuclari kaydı + görev durumu
// ============================================================
async function araModalAc(taskId){
  const t=(ARAMA.tasks||[]).find(x=>x.task_id===taskId);
  if(!t){ toast('Kayıt bulunamadı','error'); return; }
  // ziyaret + kontak + müşteri bilgisi
  let v={}, unvan=t.ncst, contactAd='—', telefon='';
  if(t.visit_id){ const {data:vd}=await sb.from('visits').select('visit_id,my_id,tarih_saat,contact_id,ziyaret_amaci,ziyaret_amaci_detay,urun_gruplari,ziyaret_sonucu,gorusulen_yetkili').eq('visit_id',t.visit_id).maybeSingle(); v=vd||{}; }
  if(t.ncst){ const {data:c}=await sb.from('customers').select('unvan').eq('ncst',t.ncst).maybeSingle(); if(c?.unvan) unvan=c.unvan; }
  if(v.contact_id){ const {data:ct}=await sb.from('contacts').select('ad_soyad,telefon').eq('contact_id',v.contact_id).maybeSingle(); if(ct){ contactAd=ct.ad_soyad||'—'; telefon=ct.telefon||''; } }
  const myAd = v.my_id ? (myIdToName[v.my_id]||('MY#'+v.my_id)) : '—';

  // Fırsat oluşmuş mu? (opportunities.visit_id)
  let firsatText='Hayır';
  if(t.visit_id){
    const {data:opps}=await sb.from('opportunities').select('opp_id,durum').eq('visit_id',t.visit_id);
    if(opps && opps.length){
      let urunler='';
      const oppIds=opps.map(o=>o.opp_id);
      const {data:pr}=await sb.from('opportunity_products').select('urun_adi').in('opp_id',oppIds).limit(5);
      if(pr && pr.length) urunler=' ('+pr.map(p=>p.urun_adi).filter(Boolean).join(', ')+')';
      firsatText='Evet · '+opps.map(o=>o.durum).join(', ')+urunler;
    }
  }

  // deneme_no = bu görev için önceki arama_sonuclari + 1
  let deneme=1;
  { const {count}=await sb.from('arama_sonuclari').select('*',{count:'exact',head:true}).eq('task_id',taskId); deneme=(count||0)+1; }

  // telefon bazlı geçmiş ulaşılamama (SLA hariç)
  let oncedenUlasilamadi=false;
  if(telefon){
    const {data:gecmis}=await sb.from('arama_sonuclari').select('ulasilamama_neden')
      .eq('ncst',t.ncst).eq('telefon',telefon).eq('ulasildi',false);
    oncedenUlasilamadi = (gecmis||[]).some(g=>g.ulasilamama_neden && !/^Arama Yapılmadı/.test(g.ulasilamama_neden) && !/^Aramadan Kapatıldı/.test(g.ulasilamama_neden));
  }

  window._anket={ taskId, ncst:t.ncst, visit_id:t.visit_id||null, my_id:v.my_id||null, contact_id:v.contact_id||null,
                  telefon, unvan, contactAd, ziyaretTarih:v.tarih_saat, deneme, oncedenUlasilamadi, c:{} };
  document.getElementById('aramaAnketKunye').innerHTML =
    `<b>${escapeHTML(unvan)}</b> · ☎ ${escapeHTML(_telGoster(telefon))}<br>Kontak: ${escapeHTML(contactAd)} · Ziyaret: ${escapeHTML(myAd)} · ${v.tarih_saat?fmtDate(v.tarih_saat):'—'} · ${deneme}. arama`+
    (oncedenUlasilamadi?'<br><span style="color:var(--amber);">⚠ Bu numaraya daha önce ulaşılamamış.</span>':'')+
    `<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;color:var(--text2);">`+
    `<div><b>Ziyaret amacı:</b> ${escapeHTML(v.ziyaret_amaci||'—')}${v.ziyaret_amaci_detay?(' — '+escapeHTML(v.ziyaret_amaci_detay)):''}</div>`+
    `<div><b>Konuşulan ürün/servis:</b> ${escapeHTML(v.urun_gruplari||'—')}</div>`+
    `<div><b>Ziyaret notu/sonucu:</b> ${escapeHTML(v.ziyaret_sonucu||'—')}</div>`+
    `<div><b>Fırsat oluşmuş mu:</b> ${escapeHTML(firsatText)}</div>`+
    `</div>`;

  // v31.19: Firma geçmişi — tüm ziyaretler + daha önceki teyit aramaları (istihbarat)
  _aramaGecmisYukle(t.ncst, t.visit_id);
  // V31.46: Firma geçmişinin altındaki "Aranacak numara" kutusu
  _aramaTelKutuRender(telefon, contactAd);

  // V31.49: aynı kişi uyarısı + "tek görüşmede teyit et" butonu
  window._anket.birlesik=null;
  const uyariEl=document.getElementById('aramaAnketUyari');
  if(uyariEl) uyariEl.innerHTML=_aramaIstemiyorBant(taskId,'modal')+_aramaAyniKisiSerit(taskId,'modal');   // V31.53

  _anketRender();
  openModal('aramaAnketModal');
}

// ============================================================
// V31.49: BİRLEŞİK ARAMA
// ------------------------------------------------------------
// Agent TEK telefon görüşmesi yapar, TEK anket doldurur; sistem her ziyaret
// için AYRI arama_sonuclari satırı yazar. Kayıtlar birleşmez — birleşseydi
// ikinci ziyaret raporlarda teyit edilmemiş görünür, teyit oranı ve MY
// memnuniyet ortalaması bozulurdu.
//
// Ortak cevaplar (ulasildi / muhatap_dogru / gorusmek_istedi / memnuniyet /
// sikayet / agent_notu) tüm satırlara aynen kopyalanır.
// Ziyarete özel cevaplar (ziyaret_dogrulandi / gorusme_suresi /
// ihtiyac_anlasildi) her firma için AYRI sorulur ve kendi satırına yazılır —
// müşteri bir firmaya gelen ziyareti onaylayıp diğerini hatırlamayabilir.
// ============================================================
async function araBirlesikAc(taskId){
  const ids=(ARAMA.gruplar||{})[taskId];
  if(!ids||ids.length<2){ toast('Birleştirilecek başka kayıt yok','info'); return; }

  const hedefler=[];
  const ACIK=['Aranacak','Tekrar Aranacak'];
  for(const id of ids){
    const t=(ARAMA.tasks||[]).find(x=>x.task_id===id);
    if(!t || !ACIK.includes(t.durum)) continue;   // emniyet: kapali gorev dahil edilmez
    const v=(ARAMA.vMap||{})[t.visit_id]||{};
    const k=(ARAMA.kMap||{})[t.visit_id]||{};
    let deneme=1;
    const {count}=await sb.from('arama_sonuclari').select('*',{count:'exact',head:true}).eq('task_id',id);
    deneme=(count||0)+1;
    hedefler.push({
      taskId:id, ncst:t.ncst, visit_id:t.visit_id||null, my_id:v.my_id||null,
      contact_id:v.contact_id||null, telefon:k.telefon||null,
      unvan:(ARAMA.unvanMap||{})[t.ncst]||t.ncst||('#'+id),
      ziyaretTarih:v.tarih_saat||null, deneme
    });
  }
  if(hedefler.length<2){ toast('Birleştirilecek kayıt bulunamadı','error'); return; }

  // Onay ekranı — otomatik birleştirme yok, agent hangilerini dahil edeceğini seçer
  window._birlesikAday=hedefler;
  const kisi=(ARAMA.grupKisi||{})[taskId]||{};
  const farkli=!!kisi.farkli;                       // V31.51: isimler tutmuyor mu?

  const satirlar=hedefler.map((hd,i)=>{
    // V31.51: her kaydin KENDI kontak adi gosteriliyor. Onceden sadece unvan ve
    // tarih vardi; agent isimlerin farkli oldugunu goremiyordu.
    const kontakAd=(ARAMA.grupAd||{})[hd.taskId]||'—';
    // V31.51: isimler farkliysa ikincil kayitlar ISARETSIZ gelir.
    const isaret=(i===0)?'checked disabled':(farkli?'':'checked');
    return `
    <label style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;">
      <input type="checkbox" class="birlesikChk" value="${i}" ${isaret} style="margin-top:3px;">
      <div style="flex:1;">
        <div style="font-weight:600;">${escapeHTML(hd.unvan)}</div>
        <div style="font-size:12px;color:${farkli?'var(--amber)':'var(--text2)'};">👤 ${escapeHTML(kontakAd)}</div>
        <div style="font-size:11px;color:var(--text3);">Ziyaret: ${hd.ziyaretTarih?fmtDate(hd.ziyaretTarih):'—'} · ${hd.deneme}. arama</div>
      </div>
    </label>`;
  }).join('');

  const uyari = farkli
    ? `<div style="background:rgba(255,180,0,.12);border:1px solid var(--amber);border-radius:8px;
          padding:8px 10px;margin-bottom:10px;font-size:12px;color:var(--amber);">
         &#9888; <b>Bu kayıtlarda isimler farklı.</b> Aynı numara birden fazla kişi tarafından
         kullanılıyor olabilir (paylaşılan hat, muhasebeci vb.). Yanlış birleştirme, konuşmadığınız
         bir kişinin ziyaretini teyit edilmiş gösterir.<br>
         Telefonda <b>hangi firmalar için yetkili olduğunu doğrulayın</b>, sonra işaretleyin.
       </div>`
    : '';

  document.getElementById('birlesikGovde').innerHTML=
    uyari+
    `<div style="font-size:12px;color:var(--text2);margin-bottom:8px;">
       Tek görüşmede teyit edilecek ziyaretleri seçin. Her ziyaret için <b>ayrı kayıt</b>
       yazılır; ortak cevaplar hepsine kopyalanır, ziyaret teyidi ayrı sorulur.
     </div>${satirlar}`;
  openModal('birlesikOnayModal');
}

function araBirlesikBasla(){
  const secili=[...document.querySelectorAll('.birlesikChk')].filter(c=>c.checked).map(c=>parseInt(c.value));
  if(secili.length<2){ toast('En az 2 ziyaret seçin','error'); return; }
  const hedefler=secili.map(i=>window._birlesikAday[i]);
  const ana=hedefler[0];
  window._anket.birlesik=hedefler;
  window._anket.c={};                       // birleşik akış baştan doldurulur
  closeModal('birlesikOnayModal');
  const uyariEl=document.getElementById('aramaAnketUyari');
  const _k=(ARAMA.grupKisi||{})[ana.taskId]||{}; const _f=!!_k.farkli;      // V31.51
  if(uyariEl) uyariEl.innerHTML=
    `<div style="background:${_f?'rgba(255,180,0,.12)':'rgba(168,85,247,.12)'};
          border:1px solid ${_f?'var(--amber)':'var(--purple)'};border-radius:8px;
          padding:8px 10px;margin-bottom:10px;font-size:12px;">
       <div style="color:${_f?'var(--amber)':'var(--purple)'};font-weight:700;">🔗 BİRLEŞİK ARAMA — ${hedefler.length} ziyaret</div>
       <div style="color:var(--text2);margin-top:2px;">${hedefler.map(h=>escapeHTML(h.unvan)+' ('+escapeHTML((ARAMA.grupAd||{})[h.taskId]||'—')+')').join(' · ')}</div>
       ${_f?`<div style="color:var(--amber);margin-top:2px;">&#9888; İsimler farklı — doğru kişiyle konuştuğunuzdan emin olun.</div>`:''}
       <div style="color:var(--text3);margin-top:2px;">Her ziyaret için ayrı kayıt yazılacak.</div>
       <button class="btn btn-sm btn-ghost" style="width:100%;margin-top:8px;" onclick="araBirlesikIptal()">Birleştirmeyi iptal et</button>
     </div>`;
  _anketRender();
}

function araBirlesikIptal(){
  const tid=window._anket.taskId;
  window._anket.birlesik=null; window._anket.c={};
  const uyariEl=document.getElementById('aramaAnketUyari');
  if(uyariEl) uyariEl.innerHTML=_aramaAyniKisiSerit(tid,'modal');
  _anketRender();
  toast('Birleştirme iptal edildi','info');
}

// ============================================================
// V31.46: ARANACAK NUMARA KUTUSU
// Kutu gövdesi → panoya kopyalar + bildirim. Sağdaki 📞 → tel: ile arar.
// İki eylem bilinçli olarak ayrı tuşlarda: tek tuşta birleştirilseydi agent
// listeyi karıştırırken kazara müşteriyi arayabilirdi.
// ============================================================
function _telGoster(raw){
  const n=normalizeTel(raw);
  if(!raw) return 'telefon yok';
  return n.gecerli ? n.goster : n.ham;
}

function _aramaTelKutuRender(telefon, contactAd){
  const box=document.getElementById('aramaAnketTel');
  if(!box) return;

  if(!telefon || !String(telefon).trim()){
    box.innerHTML=`<div style="background:var(--navy3);border:1px dashed var(--border);border-radius:8px;padding:10px;font-size:12px;color:var(--text3);">
      ☎ Bu kontakta kayıtlı telefon yok. Numarayı müşteri kartından alın.
    </div>`;
    return;
  }

  const n=normalizeTel(telefon);
  const kopyalanacak = n.gecerli ? n.e164 : n.ham;
  const yazi         = n.gecerli ? n.goster : n.ham;

  const uyari = n.gecerli ? '' :
    `<div style="font-size:11px;color:var(--amber);margin-top:6px;">
       ⚠ Format şüpheli — kayıt bilinen bir Türkiye numarası kalıbına uymuyor.
       Numara ham haliyle gösteriliyor, arama tuşu kapalı. Doğruysa MY'den güncelletin.
     </div>`;

  const araTus = n.gecerli
    ? `<a href="tel:${n.e164}" class="btn btn-sm" style="background:var(--blue);text-decoration:none;
         display:flex;align-items:center;justify-content:center;min-width:52px;font-size:18px;"
         title="Aramayı başlat">📞</a>`
    : `<div class="btn btn-sm" style="background:var(--navy3);color:var(--text3);min-width:52px;
         display:flex;align-items:center;justify-content:center;font-size:18px;cursor:not-allowed;"
         title="Geçersiz format — arama başlatılamaz">📞</div>`;

  box.innerHTML=`
    <div style="background:var(--navy3);border:1px solid var(--border);border-radius:8px;padding:10px;">
      <div style="font-size:11px;color:var(--text3);margin-bottom:6px;">
        Aranacak numara${contactAd&&contactAd!=='—'?' · '+escapeHTML(contactAd):''}
      </div>
      <div style="display:flex;gap:8px;align-items:stretch;">
        <div onclick="_aramaTelKopyala()" title="Dokun → numarayı kopyala"
             style="flex:1;background:var(--navy2,var(--navy3));border:1px solid var(--border);
                    border-radius:8px;padding:10px 12px;cursor:pointer;
                    font-size:17px;font-weight:700;letter-spacing:.5px;color:var(--text);
                    user-select:all;display:flex;align-items:center;">
          ${escapeHTML(yazi)}
        </div>
        ${araTus}
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:6px;">
        Numaraya dokun → panoya kopyalanır &nbsp;·&nbsp; 📞 → aramayı başlatır
      </div>
      ${uyari}
    </div>`;
  box.dataset.tel=kopyalanacak;
}

function _aramaTelKopyala(){
  const box=document.getElementById('aramaAnketTel');
  const s=box?.dataset?.tel||'';
  telKopyala(s, s);
}

// v31.19: bu ncst'ye ait TÜM ziyaretleri (visits) + TÜM önceki teyit aramalarını
// (arama_sonuclari) çeker ve açılır/kapanır bir panelde gösterir. Agent aramadan
// önce firma hakkında geçmiş bilgiyi görebilsin diye eklendi.
async function _aramaGecmisYukle(ncst, guncelVisitId){
  const box=document.getElementById('aramaAnketGecmis');
  if(!box) return;
  box.innerHTML='<div style="font-size:11px;color:var(--text3);">Firma geçmişi yükleniyor…</div>';
  if(!ncst){ box.innerHTML=''; return; }

  const [{data:ziyaretler}, {data:aramalar}] = await Promise.all([
    sb.from('visits').select('visit_id,tarih_saat,my_id,temas_turu,durum,ziyaret_amaci,ziyaret_sonucu')
      .eq('ncst',ncst).order('tarih_saat',{ascending:false}).limit(20),
    sb.from('arama_sonuclari').select('created_at,agent_id,ulasildi,ulasilamama_neden,muhatap_dogru,ziyaret_dogrulandi,memnuniyet,memnuniyet_ret,guven,sikayet_var,agent_notu')
      .eq('ncst',ncst).order('created_at',{ascending:false}).limit(20)
  ]);
  // SLA'nın otomatik kapattığı "aranmadı" kayıtları gürültü — istihbaratta gösterilmez
  const aramaTemiz=(aramalar||[]).filter(s=>!(s.ulasilamama_neden||'').startsWith('Arama Yapılmadı (SLA'));

  _aramaGecmisRender(ziyaretler||[], aramaTemiz, guncelVisitId);
}

function _aramaGecmisRender(ziyaretler, aramalar, guncelVisitId){
  const box=document.getElementById('aramaAnketGecmis');
  if(!box) return;
  const vSayi=ziyaretler.length, aSayi=aramalar.length;

  const vList = ziyaretler.length ? ziyaretler.map(v=>{
    const myAd = v.my_id?(myIdToName[v.my_id]||('MY#'+v.my_id)):'—';
    const guncel = (v.visit_id===guncelVisitId) ? ' <span style="color:var(--blue);">(bu görev)</span>' : '';
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;gap:6px;">
        <span style="font-weight:600;">${escapeHTML(v.temas_turu||'Temas')}${guncel}</span>
        <span style="color:var(--text3);white-space:nowrap;">${v.tarih_saat?fmtDate(v.tarih_saat):'—'}</span>
      </div>
      <div style="color:var(--text2);">${escapeHTML(myAd)}${v.ziyaret_amaci?(' · '+escapeHTML(v.ziyaret_amaci)):''}</div>
      ${v.ziyaret_sonucu?`<div style="color:var(--text3);">${escapeHTML(v.ziyaret_sonucu)}</div>`:''}
    </div>`;
  }).join('') : '<div style="color:var(--text3);padding:6px 0;">Bu firmaya kayıtlı başka ziyaret yok.</div>';

  const aList = aramalar.length ? aramalar.map(s=>{
    const agentAd = s.agent_id?(myIdToName[s.agent_id]||('#'+s.agent_id)):'—';
    let ozet, renk='var(--text2)';
    if(s.ulasildi===false){ ozet='Ulaşılamadı'+(s.ulasilamama_neden?(' ('+s.ulasilamama_neden+')'):''); }
    else if(s.ulasildi===true){
      const p=[];
      if(s.muhatap_dogru==='Hayır') p.push('Yanlış/yetkisiz kişi');
      if(s.ziyaret_dogrulandi) p.push('Ziyaret: '+s.ziyaret_dogrulandi);
      if(s.memnuniyet!=null) p.push('Memnuniyet '+s.memnuniyet+'/10');
      else if(s.memnuniyet_ret) p.push('Değerlendirmek istemedi');
      if(s.guven==='Hayır') p.push('Güven yok');
      if(s.sikayet_var) p.push('Şikayet var');
      ozet=p.join(' · ')||'Ulaşıldı';
      if(s.sikayet_var||s.ziyaret_dogrulandi==='Hayır') renk='var(--red)';
      else if(s.muhatap_dogru==='Hayır') renk='var(--orange)';
      else if(s.ziyaret_dogrulandi==='Emin değil') renk='var(--amber)';
      else if(s.ziyaret_dogrulandi==='Gelmedi ama Telefonla konuştuk') renk='var(--blue)';
    } else { ozet='Aramadan kapatıldı'+(s.ulasilamama_neden?(' ('+s.ulasilamama_neden.replace('Aramadan Kapatıldı: ','')+')'):''); }
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;gap:6px;">
        <span style="font-weight:600;">☎ ${escapeHTML(agentAd)}</span>
        <span style="color:var(--text3);white-space:nowrap;">${s.created_at?fmtDate(s.created_at):'—'}</span>
      </div>
      <div style="color:${renk};">${escapeHTML(ozet)}</div>
      ${s.agent_notu?`<div style="color:var(--text3);">${escapeHTML(s.agent_notu)}</div>`:''}
    </div>`;
  }).join('') : '<div style="color:var(--text3);padding:6px 0;">Bu firmaya daha önce teyit araması yapılmamış.</div>';

  box.innerHTML = `
    <div class="chip-btn" style="width:100%;text-align:center;" onclick="_aramaGecmisToggle()">
      📋 Firma geçmişi — ${vSayi} ziyaret · ${aSayi} arama <span id="aramaGecmisOkSpan">▾</span>
    </div>
    <div id="aramaGecmisIcerik" class="hide" style="max-height:32vh;overflow-y:auto;background:var(--navy3);border-radius:8px;padding:8px 10px;margin-top:6px;font-size:12px;">
      <div style="font-weight:700;margin-bottom:2px;">Ziyaretler (${vSayi})</div>
      ${vList}
      <div style="font-weight:700;margin:10px 0 2px;">Önceki Teyit Aramaları (${aSayi})</div>
      ${aList}
    </div>`;
}

function _aramaGecmisToggle(){
  const el=document.getElementById('aramaGecmisIcerik');
  const ok=document.getElementById('aramaGecmisOkSpan');
  if(!el) return;
  el.classList.toggle('hide');
  if(ok) ok.textContent = el.classList.contains('hide') ? '▾' : '▴';
}

function _anketSec(key,val){ window._anket.c[key]=val; _anketRender(); }
function _anketText(key,val){ window._anket.c[key]=val; } // re-render yok (focus korunur)
// v1.0.12: "Emin değil" ara-sorusu (ziyaret_emin/ziyaret_yok_neden) kaldırıldı —
// ziyaret_dogrulandi artık zaten 3 net seçenekle (Evet/Hayır/Gelmedi ama Telefonla
// konuştuk) belirsizliği çözüyor, ayrı bir "emin misiniz" adımına gerek kalmadı.

function _chips(key,label,opts){
  const c=window._anket.c;
  return `<div class="field" style="margin-bottom:10px;"><label>${label}</label><div class="chip-grid-box">`+
    opts.map(o=>`<div class="chip-btn${c[key]===o?' selected':''}" onclick="_anketSec('${key}','${escapeHTML(o)}')">${escapeHTML(o)}</div>`).join('')+
    `</div></div>`;
}
// V31.46: opts.ret=true ise skalanın altına tam genişlikte "Değerlendirmek
// istemiyor" seçeneği eklenir ve değer 'RET' olarak tutulur. _anketSatir bunu
// memnuniyet=NULL + memnuniyet_ret=true'ya çevirir — puan olarak KAYDEDİLMEZ.
function _scale(key,label,min,max,opts){
  const c=window._anket.c; let s='';
  for(let i=min;i<=max;i++){ s+=`<div class="chip-btn${String(c[key])===String(i)?' selected':''}" onclick="_anketSec('${key}','${i}')" style="min-width:36px;text-align:center;">${i}</div>`; }
  const ret = (opts&&opts.ret)
    ? `<div class="chip-btn${c[key]==='RET'?' selected':''}" onclick="_anketSec('${key}','RET')"
         style="width:100%;text-align:center;margin-top:-6px;">Değerlendirmek istemiyor</div>`
    : '';
  return `<div class="field" style="margin-bottom:10px;"><label>${label}</label><div class="chip-grid-box">${s}</div>${ret}</div>`;
}

// v1.0.12: Anket akışı konsolide edildi (20.08.2026 talebi) — soru sayısı azaltıldı,
// muhatap doğrulaması artık gerçek bir "gate" (Hayır ise anket burada kapanır).
// Kaldırılanlar: "Görüşme yüz yüze miydi?" (yuzyuze), "Ziyaret edenin adını
// hatırlıyor mu?" (isim_dogru), "Temsilci güven verdi mi?" (guven), NPS (nps —
// memnuniyet sorusu tek başına yeterli görüldü), "Takip sözü verildi mi?"
// (takip_sozu/takip_tutuldu), "Bu konuda emin misiniz?" alt-akışı (ziyaret_emin/
// ziyaret_yok_neden — 3 seçenekli ziyaret_dogrulandi zaten belirsizliği çözüyor).
// "Sonra aranmak ister mi?" ara sorusu kaldırıldı — "Görüşmek için uygun mu?"
// Hayır ise doğrudan yeni arama tarihi soruluyor.
function _anketRender(){
  const c=window._anket.c;
  const g=document.getElementById('aramaAnketGovde');
  let h='';
  h+=_chips('ulasildi','Ulaşıldı mı?',['Evet','Hayır']);

  if(c.ulasildi==='Hayır'){
    h+=_chips('ulasilamama_neden','Ulaşılamama nedeni',['Cevap yok','Sürekli meşgul','Telefon kapalı','Santralden geçilemedi','Yanlış numara']);
  }

  if(c.ulasildi==='Evet'){
    // Adım 1 (gate): görüşülen kişi yetkili/doğru kontak mı?
    h+=_chips('muhatap_dogru','Görüşülen kişi yetkili ve doğru kontak mı?',['Evet','Hayır']);

    if(c.muhatap_dogru==='Hayır'){
      h+=`<div style="font-size:12px;color:var(--text3);margin:-4px 0 10px;">Yanlış/yetkisiz kişiyle görüşüldü — kayıt bu bilgiyle kapatılacak, aşağıdaki soru yok.</div>`;
    }

    if(c.muhatap_dogru==='Evet'){
      // Adım 2 (gate): görüşmek için uygun mu?
      h+=_chips('gorusmek_istedi','Görüşmek için uygun mu?',['Evet','Hayır']);

      if(c.gorusmek_istedi==='Hayır'){
        // V31.53: Musteri bir daha aranmak istemiyorsa tarih vermek anlamsiz.
        // Isaretlenirse contacts.aranmak_istemiyor=true yazilir ve bu kontak
        // sonraki ziyaretlerde kirmizi bantla uyarilir.
        h+=_chips('aranmak_istemiyor','Tekrar aranmak istiyor mu?',['Evet, sonra aransın','Hayır, aranmak istemiyor']);
        if(c.aranmak_istemiyor!=='Hayır, aranmak istemiyor'){
          h+=`<div class="field" style="margin-bottom:10px;"><label>Ne zaman tekrar aranacak?</label><input type="datetime-local" id="anketTekrarTarih" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;"></div>`;
        }else{
          h+=`<div style="background:rgba(224,4,42,.12);border:1px solid var(--red);border-radius:8px;
                padding:8px 10px;margin-bottom:10px;font-size:12px;color:var(--red);">
                &#9940; Bu kontak <b>bir daha aranmak istemiyor</b> olarak işaretlenecek.
                Kayıt kapanacak ve bu kişi sonraki ziyaretlerde kırmızı uyarıyla görünecek.
              </div>`;
        }
      }

      if(c.gorusmek_istedi==='Evet'){
        const bl=window._anket.birlesik;

        if(bl && bl.length>1){
          // ---- V31.49 BİRLEŞİK: her ziyaret için AYRI teyit bloğu ----
          // Anahtarlar indeksli: ziyaret_dogrulandi_0, gorusme_suresi_0, ...
          bl.forEach((hd,i)=>{
            const ztM=hd.ziyaretTarih?fmtDate(hd.ziyaretTarih):'belirtilen tarihte';
            h+=`<div style="border:1px solid var(--border);border-left:3px solid var(--purple);
                  border-radius:8px;padding:10px;margin-bottom:12px;">
                  <div style="font-weight:700;font-size:13px;margin-bottom:8px;">${i+1}. ${escapeHTML(hd.unvan)}</div>`;
            h+=_chips('ziyaret_dogrulandi_'+i, ztM+" sizi Turkcell'den arkadaşımız ziyarete geldi mi?",['Evet','Hayır','Gelmedi ama Telefonla konuştuk']);
            const zd=c['ziyaret_dogrulandi_'+i];
            if(zd==='Evet' || zd==='Gelmedi ama Telefonla konuştuk'){
              // V31.53: "Görüşme süresi" kaldırıldı
              h+=_chips('ihtiyac_anlasildi_'+i,'Temsilcimiz ihtiyacınızı anladı ve çözüm üretebildi mi?',['Evet','Kısmen','Hayır']);
            }
            h+=`</div>`;
          });

          // Ortak: en az bir ziyarette görüşme olduysa memnuniyet sorulur
          const herhangiGorusme=bl.some((hd,i)=>{
            const zd=c['ziyaret_dogrulandi_'+i];
            return zd==='Evet' || zd==='Gelmedi ama Telefonla konuştuk';
          });
          if(herhangiGorusme) h+=_scale('memnuniyet','Memnuniyet (1-10) — kişi bazlı, tek sorulur',1,10,{ret:true});

          const hepsiCevaplandi=bl.every((hd,i)=>!!c['ziyaret_dogrulandi_'+i]);
          if(hepsiCevaplandi){
            h+=_anketSikayetTalepBlok(c);
          }
        } else {
          // ---- TEKLİ (mevcut akış, değişmedi) ----
          const zt=window._anket.ziyaretTarih;
          const ztMetni=zt?fmtDate(zt):'belirtilen tarihte';
          h+=_chips('ziyaret_dogrulandi',ztMetni+" sizi Turkcell'den arkadaşımız ziyarete geldi mi?",['Evet','Hayır','Gelmedi ama Telefonla konuştuk']);

          // "Evet" ve "Telefonla konuştuk" ikisi de bir görüşme gerçekleştiği için
          // aynı ihtiyaç/memnuniyet bloğunu görür; "Hayır" (kimse gelmedi/aranmadı,
          // sahte şüphesi) doğrudan şikayet sorusuna geçer.
          const gorusmeOldu = (c.ziyaret_dogrulandi==='Evet' || c.ziyaret_dogrulandi==='Gelmedi ama Telefonla konuştuk');
          if(gorusmeOldu){
            // V31.53: "Görüşme süresi" sorusu kaldırıldı (DB kolonu duruyor, geçmiş veri korunuyor)
            h+=_chips('ihtiyac_anlasildi','Temsilcimiz ihtiyacınızı anladı ve çözüm üretebildi mi?',['Evet','Kısmen','Hayır']);
            h+=_scale('memnuniyet','Memnuniyet (1-10)',1,10,{ret:true});
          }

          if(c.ziyaret_dogrulandi){
            h+=_anketSikayetTalepBlok(c);
          }
        }
      }
    }
  }
  // Agent notu (her durumda)
  if(c.ulasildi){
    h+=`<div class="field" style="margin-bottom:6px;"><label>Agent notu</label><textarea id="anketNot" oninput="_anketText('agent_notu',this.value)" style="width:100%;">${escapeHTML(c.agent_notu||'')}</textarea></div>`;
  }
  g.innerHTML=h;
  _anketAksiyonRender();
}

// V31.76: Sikayet ve talep ayrildi (eskiden tek "Sikayet / talep var mi?"
// Evet/Hayir onay kutusuydu). Sikayet secilirse kimi sikayet ettigi ve
// (MY/FMY ise) alt neden sorulur. Talep secilirse metin yazildiktan sonra
// agent tek tikla task acabilir (otomatik degil, manuel — bkz. _anketTalepTaskAc).
const SIKAYET_MY_NEDEN=['Ziyarete gelmiyor','Ürün ve hizmetlere hakim değil, bilgisi yetersiz','Kılık kıyafeti uygun değil','Kurumsal kimliğe uygun davranmıyor','Verdiği sözleri tutmuyor'];
function _anketSikayetTalepBlok(c){
  let h=_chips('kayit_turu','Şikayet / talep var mı?',['Yok','Şikayet','Talep']);
  if(c.kayit_turu==='Şikayet'){
    h+=_chips('sikayet_kimi','Kimi şikayet ediyorsunuz?',['Ziyarete gelen MY/FMY','Turkcell (genel)','Fiyat/hizmet politikası']);
    if(c.sikayet_kimi==='Ziyarete gelen MY/FMY'){
      h+=_chips('sikayet_my_neden','Şikayet konusu',SIKAYET_MY_NEDEN);
    }
    if(c.sikayet_kimi){
      h+=`<div class="field" style="margin-bottom:10px;"><label>Şikayet detayı</label><textarea id="anketSikayet" oninput="_anketText('sikayet_metni',this.value)" style="width:100%;">${escapeHTML(c.sikayet_metni||'')}</textarea></div>`;
    }
  } else if(c.kayit_turu==='Talep'){
    // V31.77 FIX: oninput bilerek tam yeniden cizim yapmiyordu (imlec/focus
    // kaybolmasin diye) — ama bu yuzden asagidaki buton da hic gorunmuyordu,
    // cunku gorunurlugu sadece tam yeniden cizimde hesaplaniyordu. Simdi
    // buton HER ZAMAN DOM'da; her tus vurusunda gizli/gorunur durumu ayrica
    // (formu yeniden cizmeden) guncelleniyor — bkz. _anketTalepBtnGuncelle.
    h+=`<div class="field" style="margin-bottom:6px;"><label>Talep detayı</label><textarea id="anketTalep" oninput="_anketText('sikayet_metni',this.value);_anketTalepBtnGuncelle(this.value)" style="width:100%;">${escapeHTML(c.sikayet_metni||'')}</textarea></div>`;
    if(window._anket && window._anket._talepTaskId){
      h+=`<div id="anketTalepTaskBtnBox" style="font-size:12px;color:var(--green);margin-bottom:10px;">✅ Task oluşturuldu (#${window._anket._talepTaskId})</div>`;
    } else {
      const gizli=(c.sikayet_metni||'').trim()?'':' hide';
      h+=`<button id="anketTalepTaskBtnBox" class="btn btn-sm btn-ghost${gizli}" style="width:100%;margin-bottom:10px;" onclick="event.stopPropagation();_anketTalepTaskAc()">📌 Bu talep için task oluştur</button>`;
    }
  }
  return h;
}

// v1.0.12: muhatap_dogru ve gorusmek_istedi artık gerçek "gate" — kayıt butonu
// bu adımlar cevaplanmadan görünmüyor (eskiden ulasildi=Evet seçilir seçilmez
// "Kaydet" çıkıyordu, anket doldurulmadan kayıt açılabiliyordu).
function _anketAksiyonRender(){
  const c=window._anket.c, st=window._anket;
  const box=document.getElementById('aramaAnketAksiyon');
  let h='';
  if(c.ulasildi==='Evet' && c.muhatap_dogru==='Hayır'){
    // Yanlış/yetkisiz kişiyle görüşüldü — anket burada kapanır.
    h=`<button class="btn" style="width:100%;background:var(--orange);" onclick="araAnketKaydet()">Kaydet (Tamamlandı — Yanlış/Yetkisiz Kişi)</button>`;
  } else if(c.ulasildi==='Evet' && c.muhatap_dogru==='Evet' && c.gorusmek_istedi==='Hayır'){
    // V31.53: "Aranmak istemiyor" secildiyse tarih istenmez, kayit kapatilir.
    if(c.aranmak_istemiyor==='Hayır, aranmak istemiyor'){
      h=`<button class="btn" style="width:100%;background:var(--red);" onclick="araAnketAranmakIstemiyor()">Kapat — Aranmak İstemiyor</button>`;
    }else{
      // Doğru kişi ama şu an uygun değil — yeni arama tarihiyle "Tekrar Aranacak" kapat.
      h=`<button class="btn" style="width:100%;background:var(--blue);" onclick="araAnketTekrar()">Tekrar Aranacak</button>`;
    }
  } else if(c.ulasildi==='Evet' && c.muhatap_dogru==='Evet' && c.gorusmek_istedi==='Evet' &&
            (st.birlesik && st.birlesik.length>1
               ? st.birlesik.every((hd,i)=>!!c['ziyaret_dogrulandi_'+i])   // V31.49: hepsi cevaplanmalı
               : !!c.ziyaret_dogrulandi)){
    const etiket=(st.birlesik && st.birlesik.length>1)
      ? 'Kaydet ('+st.birlesik.length+' ziyaret — Tamamlandı)' : 'Kaydet (Tamamlandı)';
    h=`<button class="btn" style="width:100%;background:var(--green);" onclick="araAnketKaydet()">${etiket}</button>`;
  } else if(c.ulasildi==='Hayır' && c.ulasilamama_neden){
    if(c.ulasilamama_neden==='Yanlış numara'){
      h=`<button class="btn" style="width:100%;background:var(--amber);color:#000;" onclick="araAnketBilgiGuncelle('Yanlış numara')">Kapat + MY'ye Bilgi Güncelleme Görevi</button>`;
    } else if(st.oncedenUlasilamadi){
      h=`<div style="font-size:12px;color:var(--amber);margin-bottom:6px;">Bu numaraya daha önce de ulaşılamamış. Tekrar denemek yerine MY'ye bilgi güncelleme görevi açılması önerilir.</div>
         <button class="btn" style="width:100%;background:var(--amber);color:#000;" onclick="araAnketBilgiGuncelle('Tekrar ulaşılamadı')">Kapat + MY'ye Bilgi Güncelleme Görevi</button>
         <button class="btn btn-ghost" style="width:100%;margin-top:6px;" onclick="araAnketTekrar()">Yine de tekrar aranacak</button>`;
    } else {
      h=`<div class="field" style="margin-bottom:6px;"><label>Tekrar arama tarihi</label><input type="datetime-local" id="anketTekrarTarih" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;"></div>
         <button class="btn" style="width:100%;background:var(--blue);" onclick="araAnketTekrar()">Tekrar Aranacak</button>
         <button class="btn btn-ghost" style="width:100%;margin-top:6px;" onclick="araAnketUlasilamiyor()">Ulaşılamıyor (kapat)</button>`;
    }
  }
  box.innerHTML=h;
}

// arama_sonuclari satırı (ortak)
function _anketSatir(extra){
  const st=window._anket, c=st.c;
  return Object.assign({
    task_id:st.taskId, visit_id:st.visit_id, ncst:st.ncst, my_id:st.my_id,
    agent_id:currentUser.my_id, contact_id:st.contact_id, telefon:st.telefon||null, deneme_no:st.deneme,
    ulasildi:c.ulasildi==='Evet'?true:(c.ulasildi==='Hayır'?false:null),
    ulasilamama_neden:c.ulasilamama_neden||null,
    muhatap_dogru:c.muhatap_dogru||null, gorusmek_istedi:c.gorusmek_istedi==null?null:(c.gorusmek_istedi==='Evet'),
    sonra_aranmak_istedi:c.sonra_aranmak_istedi==null?null:(c.sonra_aranmak_istedi==='Evet'),
    sonraki_arama_tarihi:c.sonraki_arama_tarihi||null,
    ziyaret_dogrulandi:c.ziyaret_dogrulandi||null, yuzyuze_uyusmazlik:(c.yuzyuze==='Telefonla')?true:(c.yuzyuze?false:null),
    isim_dogru:c.isim_dogru||null, ziyaret_yok_neden:c.ziyaret_yok_neden||null,
    gorusme_suresi:c.gorusme_suresi||null, guven:c.guven||null, ihtiyac_anlasildi:c.ihtiyac_anlasildi||null,
    // V31.46: 'RET' = müşteri değerlendirmek istemedi → puan NULL, ret bayrağı true.
    // Sayısal puan olarak kaydedilmez ki ortalama ve "memnuniyetsiz" filtresi bozulmasın.
    memnuniyet:(c.memnuniyet&&c.memnuniyet!=='RET')?parseInt(c.memnuniyet):null,
    memnuniyet_ret:(c.memnuniyet==='RET'),
    nps:(c.nps!=null&&c.nps!=='')?parseInt(c.nps):null,
    takip_sozu:c.takip_sozu==null?null:(c.takip_sozu==='Evet'), takip_tutuldu:c.takip_tutuldu==null?null:(c.takip_tutuldu==='Evet'),
    // V31.76: kayit_turu ('sikayet'/'talep') artik ayri kolon. sikayet_var eski
    // sorgular/raporlar bozulmasin diye senkron tutuluyor (kayit_turu==='Şikayet').
    kayit_turu:c.kayit_turu==='Şikayet'?'sikayet':(c.kayit_turu==='Talep'?'talep':null),
    sikayet_kimi:(c.kayit_turu==='Şikayet')?(c.sikayet_kimi||null):null,
    sikayet_my_neden:(c.kayit_turu==='Şikayet'&&c.sikayet_kimi==='Ziyarete gelen MY/FMY')?(c.sikayet_my_neden||null):null,
    sikayet_var:c.kayit_turu==null?null:(c.kayit_turu==='Şikayet'), sikayet_metni:c.sikayet_metni||null,
    agent_notu:c.agent_notu||null
  }, extra||{});
}
async function _anketLog(aksiyon,detay){
  try{ await sb.from('task_logs').insert({task_id:window._anket.taskId,user_id:currentUser.my_id,user_ad:currentUser.ad_soyad,aksiyon,detay}); }catch(e){}
}

// ============================================================
// V31.48: ANKET KAYIT FONKSIYONLARI — HATA YAKALAMA
// Dort fonksiyonun tamami Supabase cagrilarinin `error` degerini YOK SAYIYORDU.
// Insert/update basarisiz olsa bile kod devam edip yesil "kaydedildi" mesaji
// veriyor, gorevi kapatiyor ve anket verisi sessizce kayboluyordu.
// Artik: her adimin hatasi okunuyor, gercek mesaj gosteriliyor, hata varsa
// modal KAPANMIYOR ve gorev durumu DEGISMIYOR.
// ============================================================

// Ortak yardimci: hatayi kullaniciya goster, false don.
function _anketHata(nerede, err){
  console.error('[arama] '+nerede, err);
  toast(nerede+' basarisiz: '+(err?.message || err?.hint || 'bilinmeyen hata'), 'error');
  return false;
}

// Anket satirini yazar. Basarisizsa false doner — cagiran islemi durdurur.
async function _anketSatirYaz(extra){
  const { error } = await sb.from('arama_sonuclari').insert(_anketSatir(extra));
  if(error) return _anketHata('Arama kaydi', error);
  return true;
}

// Gorev durumunu gunceller. Basarisizsa false doner.
async function _anketGorevGuncelle(taskId, alanlar){
  const { error } = await sb.from('tasks').update(alanlar).eq('task_id', taskId);
  if(error) return _anketHata('Gorev durumu guncelleme', error);
  return true;
}

// V31.48: is gunu ekleyerek deadline uretir (hafta sonu atlanir), 'YYYY-MM-DD'.
function _isGunuEkle(gunSayisi){
  const d = new Date();
  let kalan = gunSayisi;
  while(kalan > 0){
    d.setDate(d.getDate() + 1);
    const g = d.getDay();               // 0 Pazar, 6 Cumartesi
    if(g !== 0 && g !== 6) kalan--;
  }
  // Europe/Istanbul takvim gunu — yerel bilesenlerden kuruluyor, toISOString degil
  // (toISOString UTC'ye cevirir ve gece yarisi civari bir gun geri kayabilir).
  const ay = String(d.getMonth()+1).padStart(2,'0');
  const gn = String(d.getDate()).padStart(2,'0');
  return d.getFullYear()+'-'+ay+'-'+gn;
}

async function araAnketKaydet(){
  const st=window._anket, c=st.c;
  if(!c.ulasildi){ toast('Ulaşıldı mı? seçin','error'); return; }

  // ---- V31.49 BİRLEŞİK KAYIT ----
  // KAYITLAR BİRLEŞMEZ: her ziyaret kendi arama_sonuclari satırını alır.
  // Birleşseydi ikinci ziyaret raporlarda teyit edilmemiş görünür, ziyaret
  // teyit oranı ve MY memnuniyet ortalaması bozulurdu.
  if(st.birlesik && st.birlesik.length>1){
    const bl=st.birlesik;
    const unvanlar=bl.map(h=>h.unvan).join(' + ');
    const birlesikNot='[Birleşik arama] Aynı kişi ('+(st.contactAd||'—')+') ile tek görüşmede '+
                      bl.length+' ziyaret teyit edildi: '+unvanlar+'.';
    try{
      const yazilan=[];
      for(let i=0;i<bl.length;i++){
        const hd=bl[i];
        const zd=c['ziyaret_dogrulandi_'+i]||null;
        const gorusmeOldu=(zd==='Evet'||zd==='Gelmedi ama Telefonla konuştuk');
        // Ortak cevaplar tüm satırlara kopyalanır; ziyarete özel olanlar kendi satırına.
        const satir=Object.assign(_anketSatir(), {
          task_id:hd.taskId, visit_id:hd.visit_id, ncst:hd.ncst, my_id:hd.my_id,
          contact_id:hd.contact_id, telefon:hd.telefon||null, deneme_no:hd.deneme,
          ziyaret_dogrulandi:zd,
          gorusme_suresi: null,                       // V31.53: soru kaldırıldı
          ihtiyac_anlasildi: gorusmeOldu ? (c['ihtiyac_anlasildi_'+i]||null) : null,
          agent_notu: [c.agent_notu, birlesikNot].filter(Boolean).join('\n')
        });
        const {error}=await sb.from('arama_sonuclari').insert(satir);
        if(error){
          _anketHata('Arama kaydi ('+hd.unvan+')', error);
          if(yazilan.length) toast(yazilan.length+' kayıt yazıldı, kalanlar yazılamadı. Görevler KAPATILMADI.','error');
          return;   // hiçbir görev kapatılmaz — yarım kapanma olmasın
        }
        yazilan.push(hd);
      }
      // Tüm satırlar yazıldı — ancak şimdi görevler kapatılır
      for(const hd of bl){
        if(!await _anketGorevGuncelle(hd.taskId,{durum:'Tamamlandı',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()})) return;
        try{ await sb.from('task_logs').insert({task_id:hd.taskId,user_id:currentUser.my_id,user_ad:currentUser.ad_soyad,
              aksiyon:'Arama Tamamlandı (birleşik)', detay:birlesikNot}); }catch(e){}
      }
      // V31.76: sikayet ise task otomatik acilir — ilk ziyaretin MY'sine yonlendirilir
      // (sikayet/talep sorusu birlesik akista tek seferlik/ortak soruldugu icin).
      if(c.kayit_turu==='Şikayet'){
        const ilk=bl[0];
        await _aramaSikayetGoreviOtomatikAc({ncst:ilk.ncst, my_id:ilk.my_id, taskId:ilk.taskId, unvan:ilk.unvan}, c);
      }
      toast(bl.length+' ziyaret tek görüşmede teyit edildi','success');
      closeModal('aramaAnketModal'); loadAramaListesi();
    }catch(e){ _anketHata('Birlesik arama kaydi', e); }
    return;
  }

  // ---- TEKLİ (mevcut akış) ----
  try{
    if(!await _anketSatirYaz()) return;
    if(!await _anketGorevGuncelle(st.taskId,{durum:'Tamamlandı',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()})) return;
    await _anketLog('Arama Tamamlandı','Teyit araması dolduruldu');
    // V31.76: sikayet ise task otomatik acilir — best-effort, hata olsa da arama kapanir.
    if(c.kayit_turu==='Şikayet'){
      await _aramaSikayetGoreviOtomatikAc({ncst:st.ncst, my_id:st.my_id, taskId:st.taskId, unvan:st.unvan}, c);
    }
    toast('Arama kaydedildi','success');
    closeModal('aramaAnketModal'); loadAramaListesi();
  }catch(e){ _anketHata('Arama kaydi', e); }
}

async function araAnketTekrar(){
  const c=window._anket.c;
  const tar=document.getElementById('anketTekrarTarih')?.value || c.sonraki_arama_tarihi;
  if(!tar){ toast('Tekrar arama tarihi seçin','error'); return; }
  const dl=tar.slice(0,10);
  try{
    if(!await _anketSatirYaz({sonraki_arama_tarihi:tar})) return;
    if(!await _anketGorevGuncelle(window._anket.taskId,{durum:'Tekrar Aranacak',deadline:dl,tamamlanma_tarihi:null,guncelleme_tarihi:new Date().toISOString()})) return;
    await _anketLog('Tekrar Aranacak','Yeni arama: '+fmtDate(tar)+(c.ulasilamama_neden?(' · '+c.ulasilamama_neden):''));
    toast('Tekrar aranacak olarak işaretlendi','info');
    closeModal('aramaAnketModal'); loadAramaListesi();
  }catch(e){ _anketHata('Tekrar aranacak', e); }
}

// V31.53: Musteri bir daha aranmak istemiyor.
// contacts.aranmak_istemiyor = true  -> sonraki ziyaretlerde uyari bandi
// arama_sonuclari.sonra_aranmak_istedi = false (bu kolon zaten vardi, kullanilmiyordu)
// gorev -> Tamamlandi (kisiye ulasildi, cevap alindi; is bitti)
async function araAnketAranmakIstemiyor(){
  const st=window._anket;
  try{
    if(!await _anketSatirYaz({sonra_aranmak_istedi:false})) return;
    if(st.contact_id){
      const {error}=await sb.from('contacts')
        .update({aranmak_istemiyor:true, aranmak_istemiyor_tarih:new Date().toISOString()})
        .eq('contact_id',st.contact_id);
      if(error) return _anketHata('Kontak "aranmak istemiyor" isareti', error);
    }
    if(!await _anketGorevGuncelle(st.taskId,{durum:'Tamamlandı',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()})) return;
    await _anketLog('Aranmak İstemiyor','Kontak: '+(st.contactAd||'-')+' — bir daha aranmak istemiyor olarak işaretlendi');
    toast('Kapatıldı — kontak aranmak istemiyor olarak işaretlendi','info');
    closeModal('aramaAnketModal'); loadAramaListesi();
  }catch(e){ _anketHata('Aranmak istemiyor', e); }
}

async function araAnketUlasilamiyor(){
  try{
    if(!await _anketSatirYaz()) return;
    if(!await _anketGorevGuncelle(window._anket.taskId,{durum:'Ulaşılamıyor',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()})) return;
    await _anketLog('Ulaşılamıyor','Ulaşılamama: '+(window._anket.c.ulasilamama_neden||'-'));
    toast('Ulaşılamıyor olarak kapatıldı','info');
    closeModal('aramaAnketModal'); loadAramaListesi();
  }catch(e){ _anketHata('Ulasilamiyor kapatma', e); }
}

// Yanlış numara / tekrar ulaşılamadı → MY'ye "Müşteri Bilgileri Güncelleme" görevi
// V31.48 SIRA DEGISIKLIGI: once anket kaydi + alt gorev acilir, gorev ancak
// ikisi de basariliysa kapatilir. Eskiden gorev once 'Ulasilamiyor'a cekiliyordu;
// alt gorev acilamasa bile kayit kapanmis oluyordu ve kullanici fark etmiyordu.
async function araAnketBilgiGuncelle(sebep){
  const st=window._anket;
  try{
    if(!await _anketSatirYaz()) return;

    // Atanacak MY: once ziyaretten, yoksa musterinin portfoy sahibinden.
    // V31.48: eskiden sadece ziyaretten aliniyordu; ziyaret yoksa/my_id bossa
    // gorev sessizce acilmiyordu.
    let atananId = st.my_id || null;
    let kaynak = 'ziyaret';
    if(!atananId && st.ncst){
      const {data:cst} = await sb.from('customers').select('my_id').eq('ncst',st.ncst).maybeSingle();
      if(cst?.my_id){ atananId = cst.my_id; kaynak = 'portföy sahibi'; }
    }

    const {data:tt, error:ttErr} = await sb.from('task_types')
      .select('type_id').eq('tip_adi','Müşteri Bilgileri Güncelleme').maybeSingle();
    if(ttErr) return _anketHata('Gorev tipi okuma', ttErr);

    if(!tt?.type_id){
      toast('Görev tipi bulunamadı: "Müşteri Bilgileri Güncelleme". Görev açılamadı, kayıt kapatılmadı.','error');
      return;
    }
    if(!atananId){
      toast('Bu müşterinin MY\'si bulunamadı (ne ziyarette ne portföyde). Görev açılamadı, kayıt kapatılmadı.','error');
      return;
    }

    const {error:insErr} = await sb.from('tasks').insert({
      type_id:tt.type_id, baslik:'Müşteri Bilgileri Güncelleme — '+(st.unvan||st.ncst),
      aciklama:'Teyit aramasında ulaşılamadı ('+sebep+'). Kontak/telefon güncellenmeli. Kontak: '+(st.contactAd||'-')+' · Tel: '+(st.telefon||'-'),
      ncst:st.ncst, parent_task_id:st.taskId, atayan_id:currentUser.my_id, atanan_id:atananId,
      durum:'Atandı', baslama_tarihi:new Date().toISOString(), olusturma_tarihi:new Date().toISOString(),
      // V31.48: deadline eklendi (+3 is gunu). Eskiden bos birakiliyordu; bos
      // deadline'li gorevler gorev listesinde siralamanin dibinde kalip
      // yoneticilere hic gorunmuyordu (bkz. gorev.js v1.2.11).
      deadline:_isGunuEkle(3),
      guncelleme_tarihi:new Date().toISOString()
    });
    if(insErr) return _anketHata('Bilgi guncelleme gorevi acma', insErr);

    // Alt gorev acildi — ancak simdi teyit gorevi kapatilir.
    if(!await _anketGorevGuncelle(st.taskId,{durum:'Ulaşılamıyor',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()})) return;

    await _anketLog('Bilgi Güncelleme Görevi','MY #'+atananId+' ('+kaynak+') → Müşteri Bilgileri Güncelleme ('+sebep+')');
    toast('Kapatıldı, MY\'ye bilgi güncelleme görevi açıldı','success');
    closeModal('aramaAnketModal'); loadAramaListesi();
  }catch(e){ _anketHata('Bilgi guncelleme gorevi', e); }
}

// ============================================================
// V31.76: SIKAYET / TALEP GOREV YONLENDIRME
// Ziyareti yapan MY'nin takim liderine acilir. Takim lideri yoksa (MY zaten
// takim lideriyse) ayni KCM'deki KCM Muduru'ne, o da yoksa Operasyon
// Muduru'ne acilir. Hicbiri bulunamazsa GUVENLI TARAFTA KALINIR: task
// acilmaz, agent'a net hata gosterilir (aramanin kendisi kapatilmaya devam
// edebilir — bu ek bir takip mekanizmasidir, ana akisi bloklamamali).
// ============================================================
async function _sikayetTalepHedefBul(visitMyId){
  if(!visitMyId) return {hata:'Görüşmeyi yapan MY belirlenemedi'};
  const {data:u,error}=await sb.from('users').select('my_id,kcm_id,takim_lideri_id').eq('my_id',visitMyId).maybeSingle();
  if(error||!u) return {hata:'MY kaydı okunamadı'};
  if(u.takim_lideri_id) return {atananId:u.takim_lideri_id, kaynak:'takım lideri'};
  if(!u.kcm_id) return {hata:'Bu MY\'nin takım lideri ve KÇM bilgisi yok'};
  const {data:kcmMud}=await sb.from('users').select('my_id').eq('kcm_id',u.kcm_id).eq('yetki_seviyesi','KÇM MÜDÜRÜ').eq('aktif',true).maybeSingle();
  if(kcmMud?.my_id) return {atananId:kcmMud.my_id, kaynak:'KÇM müdürü'};
  const {data:opMud}=await sb.from('users').select('my_id').eq('kcm_id',u.kcm_id).eq('yetki_seviyesi','OPERASYON MÜDÜRÜ').eq('aktif',true).maybeSingle();
  if(opMud?.my_id) return {atananId:opMud.my_id, kaynak:'operasyon müdürü'};
  return {hata:'Bu KÇM\'de takım lideri veya müdür tanımlı değil'};
}

// ctx: {ncst, my_id, taskId, unvan}. tipAdi: 'Müşteri Şikayeti' | 'Müşteri Talebi'.
// V31.106: Görev tipi adları "Şikayet Kaydı"/"Talep Kaydı" idi; mevcut
// "Müşteri Şikayeti" tipiyle çakışıyordu (duplicate type_id). task_types
// birleştirildi/yeniden adlandırıldı, kod burada eşleşecek şekilde güncellendi.
// V31.83: manualAtananId verilirse hedef zinciri (_sikayetTalepHedefBul)
// atlanir, dogrudan bu kisiye acilir. manualKaynakEtiket sadece log/gorunur
// metin icin (ornegin 'ziyareti yapan MY/FMY' ya da 'manuel seçim').
// Kullanim: Sikayet varsayilani hala takim lideri zinciri (manualAtananId
// verilmez); Talep varsayilani artik ziyareti yapan MY/FMY'nin kendisi
// (cagiran taraf ctx.my_id'yi manualAtananId olarak geçirir). Ikisi de
// Cagri Analizi ekranindaki "Yönlendir" ile sonradan degistirilebilir.
async function _sikayetTalepGoreviAc(ctx, tipAdi, baslikMetni, aciklamaMetni, manualAtananId, manualKaynakEtiket){
  let atananId, kaynak;
  if(manualAtananId){ atananId=manualAtananId; kaynak=manualKaynakEtiket||'manuel seçim'; }
  else {
    const hedef=await _sikayetTalepHedefBul(ctx.my_id);
    if(hedef.hata){ toast(tipAdi+' açılamadı: '+hedef.hata+'. Manuel yönlendirin.','error'); return null; }
    atananId=hedef.atananId; kaynak=hedef.kaynak;
  }
  const {data:tt,error:ttErr}=await sb.from('task_types').select('type_id').eq('tip_adi',tipAdi).maybeSingle();
  if(ttErr||!tt?.type_id){ toast('Görev tipi bulunamadı: "'+tipAdi+'". '+tipAdi+' açılamadı.','error'); return null; }
  const {data:gorev,error:insErr}=await sb.from('tasks').insert({
    type_id:tt.type_id, baslik:baslikMetni+' — '+(ctx.unvan||ctx.ncst),
    aciklama:aciklamaMetni, ncst:ctx.ncst, parent_task_id:ctx.taskId||null,
    atayan_id:currentUser.my_id, atanan_id:atananId, durum:'Atandı',
    baslama_tarihi:new Date().toISOString(), olusturma_tarihi:new Date().toISOString(),
    deadline:_isGunuEkle(3), guncelleme_tarihi:new Date().toISOString()
  }).select('task_id').single();
  if(insErr){ toast(tipAdi+' açılamadı: '+insErr.message,'error'); return null; }
  await _anketLog(tipAdi,kaynak+' (#'+atananId+') → '+baslikMetni);
  return gorev.task_id;
}

// Sikayet: kaydet aninda OTOMATIK acilir (best-effort — basarisiz olsa da arama kapanir).
async function _aramaSikayetGoreviOtomatikAc(ctx,c){
  try{
    const kimi=c.sikayet_kimi||'';
    const nedenEk=(kimi==='Ziyarete gelen MY/FMY'&&c.sikayet_my_neden)?(' / '+c.sikayet_my_neden):'';
    const aciklama='Şikayet kategorisi: '+kimi+nedenEk+'\nDetay: '+(c.sikayet_metni||'-');
    const tid=await _sikayetTalepGoreviAc(ctx,'Müşteri Şikayeti','Müşteri Şikayeti',aciklama);
    if(tid) toast('Şikayet kaydedildi, takım liderine/müdüre task açıldı','success');
  }catch(e){ console.error('[arama] sikayet gorevi:',e); toast('Şikayet task\'ı açılamadı, manuel yönlendirin','error'); }
}

// Talep: agent formu doldururken TEK TIKLA manuel acar (otomatik degil).
// V31.77: textarea oninput'tan cagrilir — tam yeniden cizim yapmadan (focus
// korunur) "task olustur" butonunun gizli/gorunur durumunu gunceller.
function _anketTalepBtnGuncelle(val){
  const b=document.getElementById('anketTalepTaskBtnBox');
  if(b && b.tagName==='BUTTON') b.classList.toggle('hide', !(val||'').trim());
}
async function _anketTalepTaskAc(){
  const st=window._anket, c=st.c;
  if(!(c.sikayet_metni||'').trim()){ toast('Önce talep detayını yazın','error'); return; }
  const ctx={ncst:st.ncst, my_id:st.my_id, taskId:st.taskId, unvan:st.unvan||st.contactAd};
  // V31.83: Talep varsayilan olarak takim lideri zincirine degil, ziyareti
  // yapan MY/FMY'nin kendisine (ctx.my_id) acilir — Cagri Analizi'ndeki
  // "Yönlendir" ile sonradan baska birine devredilebilir.
  const tid=await _sikayetTalepGoreviAc(ctx,'Müşteri Talebi','Müşteri Talebi','Talep: '+c.sikayet_metni,ctx.my_id,'ziyareti yapan MY/FMY');
  if(tid){ st._talepTaskId=tid; toast('Talep için task oluşturuldu','success'); _anketRender(); }
}

// ============================================================
// 5a: ÇAĞRI ANALİZİ (filtreli liste) — yetki: arama_rapor (kapsam bazlı)
// ============================================================
// V31.78: 'aranacak'/'tekrar'/'tamamlanan' kaldirildi — bu ekranin hemen
// ustundeki "Yeni/Tekrar Aranacak/Gelecek/Tamamlanan" ozet kutulariyla
// birebir tekrar ediyordu. 'yuzyuze' (Yuz yuze uyusmazlik) da kaldirildi —
// Oktay'in kendisi bu kutunun ne anlama geldigini anlayamadigi icin.
// Kalan 7 kategori render'da 2 satira bolunuyor (ANALIZ_UST/ANALIZ_ALT) —
// bkz. loadAramaAnaliz.
const ANALIZ_KAT = [
  {k:'ulasilamayan', ad:'Ulaşılamayan',    kaynak:'sonuc'},
  {k:'sahte',        ad:'Sahte ziyaret',   kaynak:'sonuc'},
  {k:'supheli',      ad:'Şüpheli',         kaynak:'sonuc'},
  {k:'memnuniyetsiz',ad:'Düşük<br>Puan',   kaynak:'sonuc'},
  {k:'sikayet',      ad:'Şikayet',         kaynak:'sonuc'},
  {k:'talep',        ad:'Talep',           kaynak:'sonuc'},
  {k:'aramadan',     ad:'Aramadan kapatılan', kaynak:'task'}
];
const ANALIZ_UST=['ulasilamayan','sahte','aramadan'];   // uzun metinli, 3'lu genis satir
const ANALIZ_ALT=['supheli','memnuniyetsiz','sikayet','talep']; // kisa metinli, 4'lu dar satir

// V31.53 — İKİ BUG BİRDEN DÜZELTİLDİ (kök neden aynı):
//   (1) currentUser.kcm_id null olduğunda .eq('kcm_id', null) üretiliyordu.
//       PostgREST null karşılaştırmasında 'eq.null' kabul etmez ('is.null' ister)
//       → 400 Bad Request. Hata yutuluyordu, data undefined kalıyordu.
//   (2) Hata sonucu BOŞ DİZİ dönüyordu ve çağıran taraflar `if(izinMy)` diye
//       kontrol ediyordu — JavaScript'te boş dizi TRUTHY'dir. Sonuç:
//         • Çağrı Analizi ve MY performans ekranları sessizce BOŞ görünüyordu
//         • MY/FMY filtre açılır listesi boşalıyordu ("Tüm FMY'ler çalışmıyor")
//       Etkilenenler: kcm_id'si null olan HERKES — tüm ADMIN'ler, Satış
//       Direktörü, Çağrı Merkezi Uzmanı. Yani raporlara en çok ihtiyacı olanlar.
// KARAR: kcm_id yoksa kısıtlanacak bir KÇM de yoktur → null döner (tümünü gör).
// Not: getScope('arama_rapor') PERM.scope'ta tanımlı olmadığı için herkese 'PRT'
// dönüyor; kök çözüm için o tanımın eklenmesi gerekir (ayrı iş).
async function _analizIzinMyList(){
  const scope=(typeof getScope==='function')?getScope('arama_rapor'):'TÜM';
  if(scope==='TÜM') return null;               // tüm veri
  if(!currentUser.kcm_id) return null;         // V31.53: KÇM yok → kısıt yok (400 üretme)
  const {data,error}=await sb.from('users').select('my_id').eq('kcm_id',currentUser.kcm_id);
  if(error){ console.error('[arama] izinli MY listesi alınamadı:', error); return null; }
  return (data||[]).map(u=>u.my_id);
}
function _analizOzet(k,r){
  if(k==='ulasilamayan') return 'Ulaşılamadı'+(r.ulasilamama_neden?(' ('+r.ulasilamama_neden+')'):'');
  if(k==='sahte')        return 'Sahte ziyaret şüphesi';
  if(k==='supheli')      return 'Ziyaret: Emin değil';
  if(k==='memnuniyetsiz')return (r.memnuniyet!=null?('Memnuniyet '+r.memnuniyet+'/10'):(r.memnuniyet_ret?'Değerlendirmek istemedi':'Memnuniyet -'))+(r.guven==='Hayır'?' · güven yok':'');
  if(k==='sikayet')      return 'Şikayet'+(r.sikayet_kimi?(' — '+r.sikayet_kimi+(r.sikayet_my_neden?(' / '+r.sikayet_my_neden):'')):'');
  if(k==='talep')        return 'Talep';
  if(k==='yuzyuze')      return 'Yüz yüze uyuşmazlık';
  return '';
}
function _analizKat(k){
  ARAMA.analiz.kat=k;
  document.querySelectorAll('#aramaFiltre .chip-btn[data-kat]').forEach(c=>c.classList.toggle('selected',c.getAttribute('data-kat')===k));
  loadAramaAnaliz();
}

async function loadAramaAnaliz(){
  ARAMA.analiz = ARAMA.analiz || {kat:'sahte',bas:'',bit:''};
  const g=document.getElementById('aramaListeGovde'); const fEl=document.getElementById('aramaFiltre');
  if(!g) return;
  const typeId=await _aramaTeyitTypeId();
  if(fEl && !fEl.dataset.ready){
    const _analizChip=c=>`<div class="chip-btn${ARAMA.analiz.kat===c.k?' selected':''}" data-kat="${c.k}" onclick="_analizKat('${c.k}')">${c.ad}</div>`;
    const _ustKat=ANALIZ_UST.map(k=>ANALIZ_KAT.find(c=>c.k===k));
    const _altKat=ANALIZ_ALT.map(k=>ANALIZ_KAT.find(c=>c.k===k));
    fEl.innerHTML=`
      <div class="chip-grid-box" style="grid-template-columns:repeat(3,1fr);margin-bottom:6px;">${_ustKat.map(_analizChip).join('')}</div>
      <div class="chip-grid-box" style="grid-template-columns:repeat(4,1fr);margin-bottom:8px;">${_altKat.map(_analizChip).join('')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <input type="date" id="analizBas" value="${ARAMA.analiz.bas}" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
        <input type="date" id="analizBit" value="${ARAMA.analiz.bit}" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
        <button class="btn btn-sm" style="background:var(--green);color:#04301f;" onclick="loadAramaAnaliz()">✓ Uygula</button></div>
      <div class="chip-btn" style="width:100%;text-align:center;margin-bottom:10px;" onclick="_aramaKirilimToggle()">
        📈 MY/FMY Ziyaret Performans Değerlendirme <span id="aramaKirilimOk">▾</span>
      </div>
      <div id="aramaKirilimIcerik" class="hide" style="max-height:44vh;overflow-y:auto;background:var(--navy3);border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:12px;"></div>`;
    fEl.dataset.ready='1';
  }
  ARAMA.analiz.bas=document.getElementById('analizBas')?.value||'';
  ARAMA.analiz.bit=document.getElementById('analizBit')?.value||'';
  const bas=ARAMA.analiz.bas, bit=ARAMA.analiz.bit;
  const kat=ANALIZ_KAT.find(c=>c.k===ARAMA.analiz.kat)||ANALIZ_KAT[3];
  g.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  _aramaKirilimRender(); // v31.22: liste ile paralel, sonucu beklemeden hesaplanır
  const izinMy=await _analizIzinMyList();
  let rows=[];

  if(kat.kaynak==='sonuc'){
    let q=sb.from('arama_sonuclari').select('task_id,ncst,my_id,ulasildi,ulasilamama_neden,ziyaret_dogrulandi,memnuniyet,memnuniyet_ret,guven,sikayet_var,kayit_turu,sikayet_kimi,sikayet_my_neden,sikayet_metni,agent_notu,yuzyuze_uyusmazlik,created_at').order('created_at',{ascending:false}).limit(500);
    if(kat.k==='ulasilamayan') q=q.eq('ulasildi',false);
    else if(kat.k==='sahte')   q=q.eq('ziyaret_dogrulandi','Hayır');
    else if(kat.k==='supheli') q=q.eq('ziyaret_dogrulandi','Emin değil');
    // V31.76: eskiden tek sikayet_var bayragina bakiyordu (talep de dahil oluyordu).
    // Artik kayit_turu ile ayrildi: 'sikayet' ve 'talep' ayri kutular.
    else if(kat.k==='sikayet') q=q.eq('kayit_turu','sikayet');
    else if(kat.k==='talep')   q=q.eq('kayit_turu','talep');
    else if(kat.k==='yuzyuze') q=q.eq('yuzyuze_uyusmazlik',true);
    else if(kat.k==='memnuniyetsiz') q=q.or('memnuniyet.lte.4,guven.eq.Hayır');
    if(bas) q=q.gte('created_at',bas+'T00:00:00+03:00');
    if(bit) q=q.lte('created_at',bit+'T23:59:59+03:00');
    if(izinMy) q=q.in('my_id',izinMy);
    const {data}=await q;
    rows=(data||[]).map(r=>({task_id:r.task_id,ncst:r.ncst,my_id:r.my_id,tarih:r.created_at,ozet:_analizOzet(kat.k,r),sikayet_metni:r.sikayet_metni||null,agent_notu:r.agent_notu||null}));
  } else {
    const durumlar = kat.k==='aranacak'?['Aranacak','Tekrar Aranacak']
      :(kat.k==='tekrar'?['Tekrar Aranacak']
      :(kat.k==='tamamlanan'?['Tamamlandı']:['Aramadan Kapatıldı']));
    let q=sb.from('tasks').select('task_id,ncst,visit_id,durum,deadline').eq('type_id',typeId).in('durum',durumlar).order('deadline',{ascending:false}).limit(500);
    if(bas) q=q.gte('deadline',bas);
    if(bit) q=q.lte('deadline',bit);
    const {data}=await q;
    let list=data||[];
    const vIds=[...new Set(list.map(t=>t.visit_id).filter(Boolean))];
    const vMap={}; if(vIds.length){ const {data:vs}=await sb.from('visits').select('visit_id,my_id').in('visit_id',vIds); (vs||[]).forEach(v=>vMap[v.visit_id]=v.my_id); }
    list.forEach(t=>t._my=vMap[t.visit_id]||null);
    if(izinMy) list=list.filter(t=>izinMy.includes(t._my));
    rows=list.map(t=>({task_id:t.task_id,ncst:t.ncst,my_id:t._my,tarih:t.deadline,ozet:t.durum}));
  }

  const ncstList=[...new Set(rows.map(r=>r.ncst).filter(Boolean))];
  const unvanMap={}; if(ncstList.length){ const {data}=await sb.from('customers').select('ncst,unvan').in('ncst',ncstList); (data||[]).forEach(c=>unvanMap[c.ncst]=c.unvan); }

  // V31.85: Tum kategorilerde kart uzerinde Takim Lideri de gorunsun —
  // window.userSecici'de takim_lideri_id yok, bu yuzden gorunen MY'ler icin
  // tek seferlik ek sorgu (satir basina degil, liste basina 1 sorgu).
  const myIdList=[...new Set(rows.map(r=>r.my_id).filter(Boolean))];
  const liderMap={};
  if(myIdList.length){
    const {data:liderData}=await sb.from('users').select('my_id,takim_lideri_id').in('my_id',myIdList);
    (liderData||[]).forEach(u=>{ liderMap[u.my_id]=u.takim_lideri_id||null; });
  }

  // V31.82: Sikayet/Talep kutularinda, bu aramadan otomatik/manuel acilan
  // Sikayet Kaydi / Talep Kaydi gorevinin durumunu da goster (parent_task_id
  // uzerinden baglantili — bkz. _sikayetTalepGoreviAc). Sadece bu 2 kategoride
  // ekstra sorgu yapilir, diger kategorilerde gereksiz yuk olusmasin.
  let gorevMap={};
  if((kat.k==='sikayet'||kat.k==='talep') && rows.length){
    const taskIds=[...new Set(rows.map(r=>r.task_id).filter(Boolean))];
    if(taskIds.length){
      const {data:tt2}=await sb.from('task_types').select('type_id').in('tip_adi',['Müşteri Şikayeti','Müşteri Talebi']);
      const ttIds=(tt2||[]).map(x=>x.type_id);
      if(ttIds.length){
        const {data:gorevler}=await sb.from('tasks').select('task_id,parent_task_id,durum').in('parent_task_id',taskIds).in('type_id',ttIds);
        (gorevler||[]).forEach(gv=>{ gorevMap[gv.parent_task_id]=gv; });
      }
    }
  }

  // V31.83: Görev oluştur / Yönlendir için satır bağlamı kaydediliyor
  // (görev oluştururken ncst/unvan/aciklama lazım). Seçici listesi artık
  // V31.84'te müşteriye/KÇM'ye göre daraltılıyor — bkz. _analizGorevOptions.
  if(kat.k==='sikayet'||kat.k==='talep'){
    ARAMA._analizRowMap=ARAMA._analizRowMap||{};
    rows.forEach(r=>{ ARAMA._analizRowMap[r.task_id]={ncst:r.ncst, unvan:unvanMap[r.ncst]||r.ncst, my_id:r.my_id, sikayet_metni:r.sikayet_metni}; });
  }

  if(!rows.length){ g.innerHTML='<div class="empty">Bu filtreye uyan kayıt yok.</div>'; return; }
  g.innerHTML=`<div style="font-size:12px;color:var(--text3);margin-bottom:8px;">${rows.length} kayıt · ${escapeHTML(kat.ad)}</div>`+
    rows.map(r=>{
      const aciklamaHTML = (kat.k==='sikayet'||kat.k==='talep') && r.sikayet_metni
        ? `<div class="visit-my" style="color:var(--text2);font-style:italic;">${escapeHTML(r.sikayet_metni.length>100?(r.sikayet_metni.slice(0,100)+'…'):r.sikayet_metni)}</div>` : '';
      // V31.84: bazi agent'lar aciklamayi sikayet_metni yerine genel arama
      // notuna (agent_notu) yazmis — o alan da onizlensin (ayni metinse tekrar gosterme).
      const notHTML = (kat.k==='sikayet'||kat.k==='talep') && r.agent_notu && r.agent_notu!==r.sikayet_metni
        ? `<div class="visit-my" style="color:var(--text2);">📝 ${escapeHTML(r.agent_notu.length>100?(r.agent_notu.slice(0,100)+'…'):r.agent_notu)}</div>` : '';
      let gorevHTML='';
      if(kat.k==='sikayet'||kat.k==='talep'){
        const gv=gorevMap[r.task_id];
        const selId=`analizAta_${kat.k}_${r.task_id}`;
        // V31.84: liste artik bu kaydin MY'sinin KÇM'sine gore daraltiliyor
        // (o KÇM'deki MY/FMY + Takım Lideri + KÇM Müdürü + Operasyon Müdürü).
        const visitUser=(window.userSecici||[]).find(u=>u.my_id===r.my_id);
        const optHTML=_analizGorevOptions(visitUser?visitUser.kcm_id:null);
        const selectHTML=`<select id="${selId}" style="flex:1;min-width:0;background:var(--navy3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:4px 6px;font-size:11px;">${optHTML}</select>`;
        gorevHTML = gv
          ? `<div class="visit-my"><span style="cursor:pointer;color:${(typeof GOREV_DURUM_RENK!=='undefined'&&GOREV_DURUM_RENK[gv.durum])||'var(--blue)'};font-weight:600;" onclick="event.stopPropagation();_analizGoreviAc(${gv.task_id})">🔗 Görev: ${escapeHTML(gv.durum)}</span></div>
             <div class="visit-my" style="display:flex;gap:4px;align-items:center;margin-top:4px;">${selectHTML}<button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px;white-space:nowrap;" onclick="event.stopPropagation();_analizGoreviYonlendir(${gv.task_id},'${kat.k}',${r.task_id})">🔀 Yönlendir</button></div>`
          : `<div class="visit-my" style="color:var(--text3);">Görev açılmadı</div>
             <div class="visit-my" style="display:flex;gap:4px;align-items:center;margin-top:4px;">${selectHTML}<button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px;white-space:nowrap;" onclick="event.stopPropagation();_analizGoreviOlustur('${kat.k}',${r.task_id})">📌 Görev Oluştur</button></div>`;
      }
      const liderId=liderMap[r.my_id];
      const liderHTML=`<div class="visit-my" style="color:var(--text3);">Takım Lideri: ${escapeHTML(liderId?(myIdToName[liderId]||('#'+liderId)):'—')}</div>`;
      return `<div class="visit-card"${r.task_id?` style="cursor:pointer;" onclick="araSonucDetayAc(${r.task_id})"`:''}><div class="visit-firm">${escapeHTML(unvanMap[r.ncst]||r.ncst||'—')}</div>
      <div class="visit-my">MY: ${escapeHTML(r.my_id?(myIdToName[r.my_id]||('#'+r.my_id)):'—')} · ${r.tarih?fmtDate(r.tarih):'—'}</div>
      ${liderHTML}
      <div class="visit-my" style="color:var(--amber);">${escapeHTML(r.ozet||'')}</div>${aciklamaHTML}${notHTML}${gorevHTML}</div>`;
    }).join('');
}

// V31.84: Görev Oluştur/Yönlendir seçicisinin kişi listesi — ilgili kaydin
// MY'sinin KÇM'sindeki MY/FMY + Takım Lideri + KÇM Müdürü + Operasyon
// Müdürü ile sınırlandırılır (önceden tüm MY/FMY kadrosu geliyordu).
// kcmId bulunamazsa (ör. veri eksikse) güvenli tarafta kalıp tüm MY/FMY'ye
// geri döner — liste tamamen boş kalmasın.
function _analizGorevOptions(kcmId){
  const roller=['MY','FMY','TAKIM LİDERİ','KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ'];
  const havuz=(window.userSecici||[]).filter(u=>roller.includes((u.rol||'').toUpperCase()) && kcmId!=null && u.kcm_id===kcmId);
  const liste=havuz.length?havuz:(window.userSecici||[]).filter(u=>['MY','FMY'].includes((u.rol||'').toUpperCase()));
  const siraliListe=liste.slice().sort((a,b)=>(a.ad_soyad||'').localeCompare(b.ad_soyad||''));
  return '<option value="">Kişi seçin…</option>'+siraliListe.map(u=>`<option value="${u.my_id}">${escapeHTML(u.ad_soyad)} (${escapeHTML((u.rol||'').replace('TAKIM LİDERİ','T.Lideri').replace('KÇM MÜDÜRÜ','KÇM Müd.').replace('OPERASYON MÜDÜRÜ','Op.Müd.'))})</option>`).join('');
}

// V31.82: Sikayet/Talep karti uzerindeki "Görev" rozetinden Görev modülünün
// kendi detay modalini acar. openGorevDetay modal oldugu icin kapatinca
// otomatik olarak bu ekranda kalinir, ekstra "geri dön" kodu gerekmez.
async function _analizGoreviAc(taskId){
  if(typeof openGorevDetay!=='function'){ toast('Görev modülü yüklenemedi','error'); return; }
  await openGorevDetay(taskId);
}

// V31.83: Sikayet/Talep icin sonradan (veya ilk kez) gorev acma — kart
// uzerindeki secicide secilen MY/FMY'ye acar. _sikayetTalepGoreviAc'in
// mevcut hedef-zinciri mantigina dokunmuyor, sadece manuel atama yolunu
// kullaniyor (bkz. yukarida eklenen manualAtananId parametresi).
async function _analizGoreviOlustur(kat, rowTaskId){
  const sel=document.getElementById('analizAta_'+kat+'_'+rowTaskId);
  const atananId=sel&&sel.value?Number(sel.value):null;
  if(!atananId){ toast('Önce kişi seçin','error'); return; }
  const ctx=ARAMA._analizRowMap&&ARAMA._analizRowMap[rowTaskId];
  if(!ctx){ toast('Kayıt bilgisi bulunamadı, listeyi yenileyin','error'); return; }
  const tipAdi = kat==='sikayet' ? 'Müşteri Şikayeti' : 'Müşteri Talebi';
  const aciklama = (kat==='sikayet'?'Şikayet':'Talep')+': '+(ctx.sikayet_metni||'-');
  const tid=await _sikayetTalepGoreviAc({ncst:ctx.ncst, my_id:ctx.my_id, taskId:rowTaskId, unvan:ctx.unvan}, tipAdi, tipAdi, aciklama, atananId, 'manuel seçim (Çağrı Analizi)');
  if(tid){ toast(tipAdi+' oluşturuldu','success'); loadAramaAnaliz(); }
}

// V31.83: Var olan Sikayet/Talep gorevini secilen baska bir MY/FMY'ye
// yeniden atar (gorev silinmez, sadece atanan_id degisir + log dusulur).
async function _analizGoreviYonlendir(gorevTaskId, kat, rowTaskId){
  const sel=document.getElementById('analizAta_'+kat+'_'+rowTaskId);
  const yeniId=sel&&sel.value?Number(sel.value):null;
  if(!yeniId){ toast('Önce kişi seçin','error'); return; }
  const {data:eski}=await sb.from('tasks').select('atanan_id').eq('task_id',gorevTaskId).maybeSingle();
  const {error}=await sb.from('tasks').update({atanan_id:yeniId,guncelleme_tarihi:new Date().toISOString()}).eq('task_id',gorevTaskId);
  if(error){ toast('Yönlendirilemedi: '+error.message,'error'); return; }
  await sb.from('task_logs').insert({
    task_id:gorevTaskId, user_id:currentUser.my_id, user_ad:currentUser.ad_soyad,
    aksiyon:'Yönlendirildi', detay:'Görev yeniden atandı (#'+(eski?eski.atanan_id:'-')+' → #'+yeniId+')'
  });
  toast('Görev yönlendirildi','success');
  loadAramaAnaliz();
}

// ============================================================
// 5b: MY KIRILIM / LİDERLİK TABLOSU (Çağrı Analizi'nin tarih aralığını kullanır)
//   • En çok yanlış numara (MY bazında)
//   • En temiz veri (yanlış numara + ulaşılamayan + sahte/şüpheli oranı en düşük)
//   • KÇM bazlı ziyaret memnuniyet skoru — en yüksek/düşük 3'er MY
// ============================================================
function _aramaKirilimToggle(){
  const el=document.getElementById('aramaKirilimIcerik');
  const ok=document.getElementById('aramaKirilimOk');
  if(!el) return;
  el.classList.toggle('hide');
  if(ok) ok.textContent = el.classList.contains('hide') ? '▾' : '▴';
}

async function _aramaKirilimVeriCek(){
  const bas=ARAMA.analiz?.bas, bit=ARAMA.analiz?.bit;
  const izinMy=await _analizIzinMyList(); // null=TÜM, aksi halde kendi KÇM'sindeki my_id listesi
  let q=sb.from('arama_sonuclari').select('my_id,ulasildi,ulasilamama_neden,ziyaret_dogrulandi,memnuniyet,created_at').not('my_id','is',null).limit(5000);
  if(bas) q=q.gte('created_at',bas+'T00:00:00+03:00');
  if(bit) q=q.lte('created_at',bit+'T23:59:59+03:00');
  if(!bas && !bit) q=q.gte('created_at', _istanbulTarihEkle(-90)+'T00:00:00+03:00');
  if(izinMy) q=q.in('my_id',izinMy);
  const {data}=await q;
  return data||[];
}

function _aramaKirilimAgg(rows){
  const map={};
  rows.forEach(r=>{
    const id=r.my_id; if(!map[id]) map[id]={toplam:0,yanlisNo:0,sorunlu:0,memnSum:0,memnCount:0};
    const m=map[id];
    m.toplam++;
    if(r.ulasilamama_neden==='Yanlış numara') m.yanlisNo++;
    if(r.ulasildi===false || r.ziyaret_dogrulandi==='Hayır' || r.ziyaret_dogrulandi==='Emin değil') m.sorunlu++;
    if(r.memnuniyet!=null){ m.memnSum+=r.memnuniyet; m.memnCount++; }
  });
  return map;
}

async function _aramaKirilimRender(){
  const box=document.getElementById('aramaKirilimIcerik');
  if(!box) return;
  box.innerHTML='<div style="color:var(--text3);padding:6px 0;">Hesaplanıyor…</div>';
  const rows=await _aramaKirilimVeriCek();
  if(!rows.length){ box.innerHTML='<div style="color:var(--text3);padding:6px 0;">Bu tarih aralığında arama kaydı yok.</div>'; return; }

  const agg=_aramaKirilimAgg(rows);
  const myIds=Object.keys(agg).map(Number);
  const [{data:users},{data:kcmler}]=await Promise.all([
    sb.from('users').select('my_id,ad_soyad,kcm_id').in('my_id',myIds),
    sb.from('kcm_groups').select('kcm_id,kcm_adi')
  ]);
  const userMap={}; (users||[]).forEach(u=>userMap[u.my_id]=u);
  const kcmAdMap={}; (kcmler||[]).forEach(k=>kcmAdMap[k.kcm_id]=k.kcm_adi);

  const MIN_ORNEK=3; // az sayıda arama olan MY'lerde oran/sıralama yanıltıcı olmasın diye eşik
  const list=myIds.map(id=>{
    const m=agg[id], u=userMap[id]||{};
    return {
      id, ad:u.ad_soyad||('MY#'+id), kcm_id:u.kcm_id,
      toplam:m.toplam, yanlisNo:m.yanlisNo,
      sorunOrani: m.toplam ? m.sorunlu/m.toplam : 0,
      memnOrt: m.memnCount ? (m.memnSum/m.memnCount) : null, memnCount:m.memnCount
    };
  });

  const satir=(x,deger,renk)=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);">
    <span>${escapeHTML(x.ad)}</span><span style="font-weight:700;${renk?('color:'+renk+';'):''}">${deger}</span></div>`;

  let h='';

  // 1) En çok yanlış numara
  const enCokYanlis=list.filter(x=>x.toplam>=MIN_ORNEK && x.yanlisNo>0).sort((a,b)=>b.yanlisNo-a.yanlisNo).slice(0,10);
  h+=`<div style="font-weight:700;margin-bottom:4px;">📵 En Çok Yanlış Numara <span style="font-weight:400;color:var(--text3);">(ilk 10, en az ${MIN_ORNEK} arama)</span></div>`;
  h+= enCokYanlis.length ? enCokYanlis.map(x=>satir(x, x.yanlisNo+' / '+x.toplam+' arama', 'var(--red)')).join('') : '<div style="color:var(--text3);padding:4px 0;">Kayıt yok.</div>';

  // 2) En temiz veri — genel sorun oranı (yanlış numara + ulaşılamayan + sahte/şüpheli) en düşük
  const enTemiz=list.filter(x=>x.toplam>=MIN_ORNEK).sort((a,b)=>a.sorunOrani-b.sorunOrani).slice(0,10);
  h+=`<div style="font-weight:700;margin:12px 0 4px;">✅ En Temiz Veri <span style="font-weight:400;color:var(--text3);">(ilk 10, en az ${MIN_ORNEK} arama, temiz oranı)</span></div>`;
  h+= enTemiz.length ? enTemiz.map(x=>satir(x, Math.round((1-x.sorunOrani)*100)+'%', 'var(--green)')).join('') : '<div style="color:var(--text3);padding:4px 0;">Kayıt yok.</div>';

  // 3) KÇM bazlı ziyaret memnuniyet skoru — en yüksek/düşük 3'er MY
  const kcmGruplar={};
  list.filter(x=>x.memnCount>=1 && x.kcm_id).forEach(x=>{ (kcmGruplar[x.kcm_id]=kcmGruplar[x.kcm_id]||[]).push(x); });
  h+=`<div style="font-weight:700;margin:12px 0 4px;">⭐ KÇM Bazlı Ziyaret Memnuniyeti — En Yüksek/Düşük 3</div>`;
  const kcmKeys=Object.keys(kcmGruplar).sort((a,b)=>(kcmAdMap[a]||'').localeCompare(kcmAdMap[b]||''));
  if(!kcmKeys.length){
    h+='<div style="color:var(--text3);padding:4px 0;">Kayıt yok.</div>';
  } else {
    kcmKeys.forEach(kid=>{
      const arr=kcmGruplar[kid].slice().sort((a,b)=>b.memnOrt-a.memnOrt);
      const top=arr.slice(0,3);
      h+=`<div style="font-weight:600;margin-top:8px;color:var(--text);">${escapeHTML(kcmAdMap[kid]||('KÇM#'+kid))}</div>`;
      h+='<div style="color:var(--green);font-size:11px;margin-top:2px;">En yüksek</div>';
      h+= top.map(x=>satir(x, x.memnOrt.toFixed(1)+'/10', 'var(--green)')).join('');
      if(arr.length>3){
        const bottom=arr.slice(-3).reverse();
        h+='<div style="color:var(--red);font-size:11px;margin-top:4px;">En düşük</div>';
        h+= bottom.map(x=>satir(x, x.memnOrt.toFixed(1)+'/10', 'var(--red)')).join('');
      }
    });
  }

  box.innerHTML=h;
}