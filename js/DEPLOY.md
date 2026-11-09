# DEPLOY — V31.10 (IMEI modal otomatik listeleme)

## Ne degisti
IMEI eslestirme modali acilinca, her bos kalem icin o urunun bostaki (Depoda)
IMEI'leri OTOMATIK listelenir. Arama sart degil; yazinca filtreler.
Seri yoksa net mesaj: "Bu urun icin bosta (Depoda) IMEI bulunamadi."
(Listeleme/arama SALT-OKUNUR; hicbir sey baglamaz. Yalniz Kaydet baglar.)

## SQL
Yok.

## Degisen dosyalar (3)
- js/donanim.js  — donanimImeiAra (bos sorgu -> ilk N) + _imeiRender auto-list
- js/config.js   — APP_VERSION -> V31.10
- index.html     — TÜM ?v= -> v31.10 + changelog

## Deploy
git add js/donanim.js js/config.js index.html
git commit -m "V31.10: IMEI modal otomatik listeleme"
git push

## Test
1. Hard refresh, V31.10.
2. 'Hazırlanıyor' kaydinda [IMEI Eşleştir] -> modal acilinca IMEI'ler LISTELENMELI.
3. Hala bos ise -> "bosta IMEI bulunamadi" -> asagidaki TEHIS SQL'ini calistir.

## TEHIS (liste bos gelirse) — o urunun serilerini incele
-- Once ilgili rezervasyon kaleminin urun_id'sini ogren, sonra:
SELECT urun_id, durum, count(*) 
FROM stok_seri_no 
GROUP BY urun_id, durum 
ORDER BY urun_id;
-- Beklenen: kalemin urun_id'sinde durum='Depoda' satirlar olmali.
-- durum farkli (or. 'DEPODA', 'Stokta') ise -> filtreyi ona gore ayarlariz.
-- urun_id farkli (seriler baska KCM/urun satirinda) ise -> transfer seri tasima gerekir.
