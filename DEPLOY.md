# Şengüller Saha Satış — Deploy Kılavuzu

Branch akışı: **staging-test** (geliştirme) → **main** (canlı).
Cloudflare Pages, **main**'e her push'ta otomatik deploy eder.
> Not: "test" diye bir branch YOK. Sadece staging-test ve main.

---

## 0) Her sürümde ÖNCE (kod tarafı)
Yeni sürümde şu üç yeri birlikte güncelle (cache sorunlarının kökten çözümü):
- `js/config.js` → `APP_VERSION` (örn. V30.70)
- `index.html` → başlıktaki sürüm + tüm `?v=vXX.XX` değerleri
- Dokunulan her dosyanın başlık sürümü + `index.html` changelog

EOL kuralı: `temas.js` ve `index.html` = LF; `config.js`, `gorev.js`, `musteri.js`, `rapor.js` = CRLF.

---

## 1) staging-test'e gönder
```powershell
git checkout staging-test
git add -A
git status                 # Beklenen dosyalar listeleniyor mu? (yeni dosya varsa özellikle kontrol)
git commit -m "VXX.XX: kısa açıklama"
git push origin staging-test
```

## 2) main'e (canlıya) al
```powershell
git checkout main
git merge staging-test
git push origin main       # <-- Cloudflare deploy'u BU tetikler
```

### Merge'de Vim/editör açılırsa
Hazır mesajı kabul edip çıkmak için: `Esc` → `:wq` → `Enter`.
İptal etmek için: `Esc` → `:q!` → `Enter`.
(Kalıcı kolaylık: `git config --global core.editor notepad` → bundan sonra Not Defteri açılır.)

### Çakışma (conflict) çıkarsa
Dur. `git status` çakışan dosyaları gösterir. Çözüp `git add <dosya>` sonra `git commit`.
Emin değilsen: `git merge --abort` ile geri al, sonra tekrar dene.

---

## 3) Push'un gittiğini doğrula
```powershell
git log origin/main -1 --oneline
git log main -1 --oneline
```
İki satır da AYNI commit hash'ini göstermeli. Farklıysa push gitmemiştir → `git push origin main` tekrar.

---

## 4) Cloudflare Pages tarafı
- Panel → proje → **Deployments**: en üstteki deployment'ın commit'i main'deki hash ile aynı + durum **Success** olmalı (1-2 dk).
- Panel → **Settings → Builds & deployments → Production branch** = **main** olmalı. Değilse main'e push canlıyı güncellemez.
- Deployment yeni commit'i görmediyse: **Create deployment** (branch=main) veya son deployment'ta **Retry**.

---

## 5) Canlıda doğrula
1. Uygulamada görünen sürüm = yeni sürüm (örn. V30.70) mü?
2. Hard refresh: **Ctrl+Shift+R**.
3. Yeni/kritik dosya erişilebilir mi? Örn. tarayıcıda: `https://SITE/js/xlsx.full.min.js` → 404 olmamalı.

---

## Hâlâ eski sürüm görünüyorsa — HIZLI TEŞHİS

**Adım 1 — Cache mi, deploy mi?**
Canlı URL'yi sorgu ekleyerek aç: `https://SITE/?x=1`
- Yeni sürüm geliyorsa → sorun **CACHE**. (Adım 2)
- Hâlâ eski sürüm → sorun **DEPLOY**. (Adım 3)

**Adım 2 — Cache çözümü**
- Tarayıcı: sekmeyi kapat-aç + Ctrl+Shift+R.
- Cloudflare: Deployments → son deployment → **Retry deployment**.
- `?v=` değerlerini bumpladığın sürece JS dosyaları zaten taze gelir; sorun genelde `index.html`'in kendisidir.

**Adım 3 — Deploy çözümü**
- Deployments'ta yeni commit yok/eski → Production branch `main` mi? Değilse düzelt.
- Build **Failed** ise → deployment'a tıkla, log'a bak.
- Gerekirse **Create deployment** ile manuel tetikle (branch=main).

---

## Tek bakışta kontrol listesi
- [ ] config.js APP_VERSION bump
- [ ] index.html sürüm + tüm ?v= bump
- [ ] commit + push staging-test
- [ ] checkout main + merge staging-test + push main
- [ ] git log origin/main == main (aynı hash)
- [ ] Cloudflare Deployments: doğru commit + Success
- [ ] Canlıda hard refresh + sürüm doğru
- [ ] ?x=1 testi (gerekirse)
