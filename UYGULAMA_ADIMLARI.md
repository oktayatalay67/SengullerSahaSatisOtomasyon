# Yetki Merkezileştirme — Uygulama Adımları

Otorite = **kod**. Yetki eşlemesi elle yazılmadı; `config.js`'ten script'le üretiliyor.
Hiçbir adım `users` tablosuna dokunmaz. Sıra önemli.

## A. Veritabanı (Supabase SQL Editor)

1. **`01_schema.sql`** çalıştır → `roles` + `role_permissions` tabloları oluşur. (Veri değişmez.)
2. **`02_roles_seed.sql`** çalıştır → 14 rol yüklenir. (Idempotent.)
3. **Seed'i üret:** repo/test klasöründe terminalde:
   ```
   node generate_permissions_seed.js ./js/config.js
   ```
   → `03_role_permissions_seed.sql` üretilir. Ekrandaki özet sayıları not al
   (kaç scope / action satırı). Dosyayı **aç ve göz at** — koddaki PERM'in birebir aynısı olmalı.
4. **`03_role_permissions_seed.sql`** çalıştır → izinler DB'ye yazılır. (BEGIN/COMMIT'li, idempotent.)
5. **Doğrula:**
   ```sql
   SELECT perm_tip, count(*) FROM role_permissions GROUP BY perm_tip;
   ```

## B. Frontend

6. `js/roles-loader.js`'i repoya ekle. `index.html`'de **config.js'ten SONRA** script tag'i ekle.
7. `auth.js` login akışında, `loadKcmMyIds()`'ten **önce**:
   ```js
   await loadPermFromDB();
   ```
8. `config.js`: sabit `const PERM = {...}` bloğunu **kaldır** (artık window.PERM DB'den geliyor).
   `getScope()` içindeki `PERM.scope[...]` referansı aynen çalışır (window.PERM aynı şekilde).
9. `index.html` (satır ~1690-1697): sabit `<option>` listesini **boşalt**, kullanıcı modalı
   açılışında `populateRoleDropdown(document.getElementById('kullYetki'), mevcutYetki)` çağır.
10. `admin.js` (satır ~1272-1274): `fallbackRoller` dizisini **kaldır**, yerine `window.ROLES` kullan.

## C. Ölü referans temizliği (SATIŞ KOORDİNATÖRÜ)

11. `index.html` satır 1696: `SATIŞ KOORDİNATÖRÜ` <option> zaten dropdown DB'den gelince kalkacak.
12. `rapor.js` satır 484: `'SATIŞ DİREKTÖRÜ','SATIŞ DİREKTÖRÜ'` yinelemesi → tek `'SATIŞ DİREKTÖRÜ'`.
13. Yorum satırlarındaki (temas.js 39/1419 vb.) `SATIŞ KOORDİNATÖRÜ` sadece açıklama — dokunma.

## D. USER rolü (işten ayrılanlar — yetkisiz)

14. `roles`'ta USER var ama `role_permissions`'ta **hiçbir satırı yok** → otomatik yetkisiz.
15. Kodda `MY||FMY||USER` kalıplarından USER çıkarılmalı (auth.js 160, firsat.js 231/402/412/587,
    hedef.js 353/405, musteri.js 220/602/841/1031, temas.js 300/1031/1085/1423/1694/1988/2223).
    **Bu ayrı ve dikkatli bir değişiklik** — her biri tek tek, senin onayınla yapılmalı.

## Versiyonlama (proje kuralı)
- `config.js` APP_VERSION bump + changelog + tüm `?v=` cache-bust güncelle.
- Dokunulan her dosyanın header versiyonu güncellensin.
- `node --check` tüm JS dosyalarında.
- `staging-test` branch → doğrula → `main`.
