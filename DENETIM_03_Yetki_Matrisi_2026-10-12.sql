-- ============================================================================
-- VERİ GÜVENLİĞİ YETKİLERİ — ROL & YETKİ MATRİSİNE EKLEME
-- Tarih: 12.10.2026  ·  Sürüm: V31.175
--
-- İki yeni action yetkisi Rol & Yetki matrisine giriyor:
--   veri_guvenlik_gor   → Veri Güvenliği ekranını görüntüler
--   veri_guvenlik_ozet  → Haftalık şüpheli hareket özetini e-posta ile alır
--
-- NEDEN İKİ AYRI YETKİ: ekranı görmek ile özeti almak farklı kararlar.
-- Bir takım lideri ekranı görmesi gerekmeden özeti alabilir; tersi de olabilir.
-- Önce ikisi de admin_panel'e yapıştırılmıştı — yanlıştı, düzeltildi.
--
-- ROL ADI VARSAYILMIYOR. "ADMIN", "SÜPER ADMIN" gibi adlar bu blokta hiç
-- yazmaz. Yetki, **bugün admin_panel yetkisi olan her role** verilir — yani
-- hâlihazırda Admin paneline girebilen kim varsa o. Yeni bir yönetici rolü
-- tanımlarsan Rol & Yetki ekranından işaretlemen yeterli.
--
-- VERİ SİLİNMEZ. Zaten işaretli olan satıra dokunulmaz (not exists kontrolü),
-- blok tekrar tekrar çalıştırılabilir.
-- ============================================================================

insert into public.role_permissions (role_kod, perm_tip, perm_key, deger)
select p.role_kod, 'action', y.perm_key, '1'
from public.role_permissions p
cross join (values ('veri_guvenlik_gor'), ('veri_guvenlik_ozet')) as y(perm_key)
where p.perm_tip = 'action'
  and p.perm_key = 'admin_panel'
  and p.deger    = '1'
  and not exists (
    select 1 from public.role_permissions x
    where x.role_kod = p.role_kod
      and x.perm_tip = 'action'
      and x.perm_key = y.perm_key
  );

-- ============================================================================
-- KONTROL — admin_panel'i olan her rol için iki satır daha görmen gerekiyor.
-- "ozeti_alir" sütunu false olan bir rol varsa özet ona gitmez.
-- ============================================================================
select
  p.role_kod                                               as rol,
  max(case when p.perm_key='admin_panel'        then '✓' end) as admin_paneli,
  max(case when p.perm_key='veri_guvenlik_gor'  then '✓' end) as ekrani_gorur,
  max(case when p.perm_key='veri_guvenlik_ozet' then '✓' end) as ozeti_alir
from public.role_permissions p
where p.perm_tip = 'action'
  and p.perm_key in ('admin_panel','veri_guvenlik_gor','veri_guvenlik_ozet')
  and p.deger = '1'
group by p.role_kod
order by p.role_kod;
