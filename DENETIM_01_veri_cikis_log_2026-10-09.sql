-- ============================================================================
-- İZ SÜRME KATMANI — ADIM 1 / TABLO
-- Tarih: 09.10.2026
--
-- Ne yapar: Uygulama içindeki her rapor görüntüleme ve her dışa aktarma
-- (Excel/CSV) hareketini tek tabloya yazar.
--
-- Bu blok YALNIZCA tablo açar. Mevcut hiçbir tabloya dokunmaz, veri silmez.
-- Tamamı IF NOT EXISTS — hata alırsan düzeltip bloğu TEKRAR çalıştırabilirsin.
--
-- GÜVENLİK TASARIMI (önemli):
--   · RLS AÇIK.
--   · anon rolüne YALNIZCA INSERT verilir — ve yalnız belirli kolonlara.
--     Tarayıcı bu tabloyu OKUYAMAZ, SİLEMEZ, GÜNCELLEYEMEZ.
--     Yani kendi izini okuyup kontrol edemez, silip temizleyemez.
--   · olusturma kolonu anon'a verilmez → zaman damgasını SUNUCU yazar,
--     istemci geçmiş/gelecek tarih uyduramaz.
--   · id uuid default gen_random_uuid() — sequence yetkisi gerekmez
--     (bigserial olsaydı anon'a sequence USAGE vermek zorunda kalırdık).
--
-- DÜRÜST SINIR: kimlik kolonları (user_id, ad_soyad...) tarayıcıdan gelir.
-- Uygulamayı kullanan birinin izini tutar. Publishable key'i alıp doğrudan
-- PostgREST'e istek atan biri bu tabloya hiç yazmaz. Okuma yetkisi
-- daraltılana kadar (portal oturumu + RLS) bu sınır böyle kalacak.
-- ============================================================================

create table if not exists public.veri_cikis_log (
  id                uuid        primary key default gen_random_uuid(),
  olusturma         timestamptz not null default now(),   -- SUNUCU yazar

  -- kim
  user_id           bigint,
  ad_soyad          text,
  yetki_seviyesi    text,
  kcm_id            bigint,

  -- vekaleten (impersonation) — ADMIN başka birinin profilindeyken
  vekaleten         boolean     not null default false,
  gercek_user_id    bigint,
  gercek_ad_soyad   text,

  -- ne
  tur               text        not null,   -- rapor_goruntuleme | disa_aktarim
  modul             text,                   -- rapor | admin | veriyonetimi | donanim | firsat | temas
  fonksiyon         text,                   -- downloadTemasExcel vb.
  rapor_adi         text,                   -- insan okur: "Temas Raporu"
  bicim             text,                   -- xlsx | csv | ekran
  dosya_adi         text,
  satir_sayisi      integer,                -- kaç satır veri dışarı çıktı

  -- hangi kapsam: tarih aralığı, KÇM, MY, takım, sekme vb.
  kapsam            jsonb,

  -- oturum / cihaz
  oturum_id         text,                   -- sekme başına üretilir, hareketleri gruplar
  sayfa_url         text,
  tarayici          text,

  constraint veri_cikis_log_tur_chk check (tur in ('rapor_goruntuleme','disa_aktarim'))
);

comment on table public.veri_cikis_log is
  'Veri raporlama ve dışa aktarma izi. Yalnız INSERT edilir; uygulama okumaz ve silmez. Okuma Supabase SQL editöründen yapılır.';
comment on column public.veri_cikis_log.olusturma is
  'Sunucu zamanı. anon bu kolona yazamaz — istemci tarih uyduramaz.';
comment on column public.veri_cikis_log.satir_sayisi is
  'Dosyaya/ekrana giden satır sayısı. Anormal büyük değerler sızma şüphesinin ilk göstergesidir.';
comment on column public.veri_cikis_log.vekaleten is
  'true ise bu hareket bir ADMIN''in başka kullanıcının profilinde yaptığı harekettir; gercek_user_id gerçek kişiyi verir.';

-- sorgular: "son 7 gün", "şu kişi", "en büyük indirmeler"
create index if not exists veri_cikis_log_ix_zaman
  on public.veri_cikis_log (olusturma desc);
create index if not exists veri_cikis_log_ix_kisi
  on public.veri_cikis_log (user_id, olusturma desc);
create index if not exists veri_cikis_log_ix_buyuk
  on public.veri_cikis_log (satir_sayisi desc) where satir_sayisi is not null;

-- ============================================================================
-- YETKİ — yalnız INSERT, yalnız şu kolonlara
-- ============================================================================
alter table public.veri_cikis_log enable row level security;

revoke all on public.veri_cikis_log from anon, authenticated;

grant insert (
  user_id, ad_soyad, yetki_seviyesi, kcm_id,
  vekaleten, gercek_user_id, gercek_ad_soyad,
  tur, modul, fonksiyon, rapor_adi, bicim, dosya_adi, satir_sayisi,
  kapsam, oturum_id, sayfa_url, tarayici
) on public.veri_cikis_log to anon;

drop policy if exists veri_cikis_log_yaz on public.veri_cikis_log;
create policy veri_cikis_log_yaz
  on public.veri_cikis_log
  for insert
  to anon
  with check (true);

-- SELECT / UPDATE / DELETE politikası YOK → anon hiçbirini yapamaz.

-- ============================================================================
-- KONTROL — bloğun sonunda görmen gerekenler
-- 1) rls_acik = true
-- 2) anon_yetkileri = yalnız INSERT (SELECT/UPDATE/DELETE görünmemeli)
-- 3) olusturma kolonu anon'un yazabildikleri listesinde OLMAMALI
-- ============================================================================
select 'tablo' as kontrol,
       (select relrowsecurity from pg_class where relname='veri_cikis_log')::text as sonuc
union all
select 'anon yetkileri',
       coalesce(string_agg(distinct privilege_type, ', ' order by privilege_type), 'YOK')
from information_schema.role_table_grants
where table_schema='public' and table_name='veri_cikis_log' and grantee='anon'
union all
select 'anon yazabildigi kolonlar',
       coalesce(string_agg(column_name, ', ' order by column_name), 'YOK')
from information_schema.column_privileges
where table_schema='public' and table_name='veri_cikis_log'
  and grantee='anon' and privilege_type='INSERT';
