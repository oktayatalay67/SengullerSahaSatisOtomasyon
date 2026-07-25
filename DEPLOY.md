# V30.78 — Takım Lideri MY/FMY kırılımı düzeltmesi

## Sorun
Temas Yönetimi özet kartlarında "Toplam" doğru daralıyordu ama alttaki
MY/FMY kırılımı tüm KÇM geneli gösteriliyordu — her Takım Lideri'nde aynı
sayılar (ör. MY 3.183 / FMY 5.255) çıkıyordu.

## Kök neden
loadTemasDashboard'daki MY/FMY kırılım dallarında BAĞLI kapsamlı roller
(TAKIM LİDERİ / ÇÖZÜM SATIŞ TEMSİLCİSİ) için dal yoktu; "kendi KÇM önbelleği"
dalına düşüp window.userScope (tüm KÇM listesi) kullanıyorlardı.

## Düzeltme
Filtre yokken scope BAĞLI ise kırılım bagliMyIds'ten hesaplanıyor.

## Dosyalar
- js/temas.js  (v2.10.39)
- js/config.js (v1.2.27, APP_VERSION V30.78)
- index.html   (?v=v30.78 + changelog)

## Git (main → canlı)
    git add -A
    git status   # sadece bu 3 dosya değişmiş olmalı
    git commit -m "V30.78 - Takim Lideri MY/FMY kirilimi bagliMyIds'ten hesaplaniyor"
    git push origin main

## Test
Aynı KÇM'deki 2 Takım Lideri + KÇM Müdürü profillerine bak:
- Her TL'nin MY/FMY kırılımı FARKLI olmalı (artık aynı değil)
- 2 TL'nin toplamları ≈ KÇM Müdürü toplamını vermeli
  (KÇM'de doğrudan bağlı, takıma dahil olmayan MY varsa küçük fark olabilir)
