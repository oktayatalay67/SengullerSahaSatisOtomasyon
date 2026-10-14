-- ============================================================================
-- LEAD / ÇAĞRI MERKEZİ — SİLME YETKİSİ VE ARAMA İZİNİN KORUNMASI
-- Tarih: 13.10.2026
--
-- NE YAPAR
--   1) lead_arama.kayit_id bağını CASCADE'den SET NULL'a çevirir.
--      Bugün: firma listeden silinirse o firmaya yapılmış TÜM arama izi de
--      siliniyor. Bundan sonra: kayıt silinir, arama izi DURUR.
--   2) lead_arama'ya liste_adi anlık kopyası (snapshot) ekler — liste silinse
--      bile raporda hangi kampanyada arandığı okunabilir kalsın.
--   3) 'lead_sil' yetkisini yetki matrisine ekler ve bugün admin_panel yetkisi
--      olan rollere verir. ROL ADI VARSAYILMIYOR.
--
-- NE YAPMAZ
--   Hiçbir satır silmez. Mevcut veriyi değiştirmez. Tekrar çalıştırılabilir.
--   Yeni DELETE yetkisi GEREKMEZ — lead_liste ve lead_kayit üzerinde anon'un
--   DELETE hakkı zaten LEAD_01 ile verilmişti; eksik olan tek şey arama izinin
--   silinmekten korunmasıydı.
-- ============================================================================

-- ---------------------------------------------------------------- 1) FK
-- Önce kolon null kabul etmeli: kaydı silinen aramanın kayit_id'si boşalacak.
alter table public.lead_arama alter column kayit_id drop not null;

-- Eski CASCADE bağını kaldır (adı ne olursa olsun bul ve düşür).
do $$
declare k text;
begin
  select conname into k
    from pg_constraint
   where conrelid = 'public.lead_arama'::regclass
     and contype  = 'f'
     and conkey   = array[(select attnum from pg_attribute
                            where attrelid='public.lead_arama'::regclass
                              and attname='kayit_id')];
  if k is not null then
    execute format('alter table public.lead_arama drop constraint %I', k);
  end if;
end $$;

alter table public.lead_arama
  add constraint lead_arama_kayit_fk
  foreign key (kayit_id) references public.lead_kayit(kayit_id)
  on delete set null;

comment on column public.lead_arama.kayit_id is
  'Kayıt silinirse NULL olur — arama izi silinmez. Hangi firma olduğu ncst kolonunda durur.';

-- ---------------------------------------------------------------- 2) SNAPSHOT
alter table public.lead_arama add column if not exists liste_adi text;

comment on column public.lead_arama.liste_adi is
  'Arama anındaki liste adı. Liste sonradan silinse de raporda kampanya adı okunur.';

-- Mevcut satırları bir kerelik doldur (liste hâlâ duruyorsa).
update public.lead_arama a
   set liste_adi = l.ad
  from public.lead_liste l
 where a.liste_id = l.liste_id
   and a.liste_adi is null;

-- ---------------------------------------------------------------- 3) YETKİ
-- lead_sil → bugün admin_panel yetkisi olan roller. "Admin" adı sabit yazılmaz;
-- hangi rol admin paneline giriyorsa silme yetkisi de ona gider.
insert into public.role_permissions (role_kod, perm_tip, perm_key, deger)
select p.role_kod, 'action', 'lead_sil', '1'
from public.role_permissions p
where p.perm_tip='action' and p.perm_key='admin_panel' and p.deger='1'
  and not exists (select 1 from public.role_permissions x
                  where x.role_kod=p.role_kod and x.perm_tip='action' and x.perm_key='lead_sil');

-- ============================================================================
-- KONTROL — bana bu üç bloğun çıktısını gönder
-- ============================================================================

-- 1) FK artık SET NULL olmalı (silme_kurali = 'SET NULL')
select con.conname as kisit,
       case con.confdeltype when 'c' then 'CASCADE'
                            when 'n' then 'SET NULL'
                            when 'a' then 'NO ACTION'
                            when 'r' then 'RESTRICT'
                            else con.confdeltype::text end as silme_kurali
  from pg_constraint con
 where con.conrelid='public.lead_arama'::regclass and con.contype='f';

-- 2) lead_arama'da anon yetkisi hâlâ yalnız SELECT + INSERT olmalı
select privilege_type
  from information_schema.role_table_grants
 where table_schema='public' and table_name='lead_arama' and grantee='anon'
 order by 1;

-- 3) lead_sil yetkisi hangi rollere gitti
select role_kod, perm_key, deger
  from public.role_permissions
 where perm_tip='action' and perm_key in ('lead_sil','admin_panel')
 order by role_kod, perm_key;
