-- ============================================================================
-- VERİ GÜVENLİĞİ EKRANI — ADIM 2 / ERİŞİM
-- Tarih: 11.10.2026  ·  Sürüm: V31.172
--
-- İki şey yapar:
--   1) veri_cikis_log'a OKUMA yetkisi verir (ADMIN ekranı okuyabilsin).
--   2) tur kolonuna 'vekaleten' değerini ekler.
--
-- HİÇBİR VERİ SİLİNMEZ, HİÇBİR BAŞKA TABLOYA DOKUNULMAZ.
-- Müşteri/ziyaret/fırsat tabloları bu bloğun dışındadır — veri girişi
-- hiçbir şekilde etkilenmez.
--
-- KARAR NOTU (Oktay, 11.10.2026): "Admin direkt olarak kimin veri çaldığını
-- ekranında görsün." Parola/anahtar sorulmayacak. Bunun bedeli: anon rolüne
-- okuma yetkisi verildiği için izi, publishable key'e sahip olan herkes
-- teknik olarak okuyabilir. İzin içinde müşteri verisi YOKTUR (yalnız
-- "kim ne zaman hangi raporu indirdi"). Gerçek daraltma portal oturumu +
-- RLS ile gelecek — bkz. PLAN_Tek_Parola_4_Hafta.
--
-- SİLME ve GÜNCELLEME yetkisi VERİLMEZ: kullanıcı izi okuyabilir ama
-- temizleyemez ve değiştiremez. Bu kasıtlıdır.
-- ============================================================================

-- ------------------------------------------------- 1) tur: 'vekaleten' eklendi
-- Önceden vekalet hareketi 'rapor_goruntuleme' olarak yazılıyordu ve ekran
-- sayaçlarını şişiriyordu. Artık ayrı tür.
alter table public.veri_cikis_log
  drop constraint if exists veri_cikis_log_tur_chk;

alter table public.veri_cikis_log
  add constraint veri_cikis_log_tur_chk
  check (tur in ('rapor_goruntuleme','disa_aktarim','vekaleten'));

-- Geçmişte yazılmış vekalet satırlarını da yeni türe taşı (2 satır bekleniyor)
update public.veri_cikis_log
   set tur = 'vekaleten'
 where modul = 'auth'
   and fonksiyon in ('startImpersonation','stopImpersonation')
   and tur <> 'vekaleten';

-- ------------------------------------------------- 2) OKUMA yetkisi
grant select on public.veri_cikis_log to anon;

drop policy if exists veri_cikis_log_oku on public.veri_cikis_log;
create policy veri_cikis_log_oku
  on public.veri_cikis_log
  for select
  to anon
  using (true);

-- UPDATE / DELETE politikası ve yetkisi hâlâ YOK — bilerek.

-- ============================================================================
-- KONTROL — görmen gerekenler:
--   anon yetkileri            : INSERT, SELECT   (UPDATE/DELETE olmamalı)
--   anon yazabildigi kolonlar : olusturma ve id BU LİSTEDE OLMAMALI
--   tur degerleri             : vekaleten satırları ayrışmış olmalı
-- ============================================================================
select 'anon yetkileri' as kontrol,
       coalesce(string_agg(distinct privilege_type, ', ' order by privilege_type), 'YOK') as sonuc
from information_schema.role_table_grants
where table_schema='public' and table_name='veri_cikis_log' and grantee='anon'
union all
select 'anon yazabildigi kolonlar',
       coalesce(string_agg(column_name, ', ' order by column_name), 'YOK')
from information_schema.column_privileges
where table_schema='public' and table_name='veri_cikis_log'
  and grantee='anon' and privilege_type='INSERT'
union all
select 'tur: ' || tur, count(*)::text
from public.veri_cikis_log
group by tur;
