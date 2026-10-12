-- ============================================================================
-- ÇAĞRI MERKEZİ / LEAD ARAMALARI — FAZ 1 / TABLOLAR + YETKİLER
-- Tarih: 12.10.2026
--
-- Bu blok YALNIZCA yeni tablo açar, bir görev tipi ve yetki satırları ekler.
-- MEVCUT HİÇBİR TABLOYA DOKUNMAZ. Veri silmez. Ekran kodu olmadan çalıştırılır
-- ve hiçbir şeyi bozmaz — ekranlar Faz 2'de gelecek.
-- Tamamı IF NOT EXISTS / not exists korumalı: tekrar çalıştırılabilir.
--
-- ZAMANLAYICI YOKTUR (çalışma kuralları Bölüm 9). Sonraki arama tarihi,
-- rakip sözleşme bitişi ve deneme limiti okuma anında hesaplanır.
-- ============================================================================

-- ---------------------------------------------------------------- 1) LİSTE
create table if not exists public.lead_liste (
  liste_id        uuid        primary key default gen_random_uuid(),
  ad              text        not null,
  aciklama        text,
  urun_odak       text,                  -- Mobil | Cihaz & Kampanya | SOL | DBS | M2M / IoT | DSS
  konusma_metni   text,                  -- agent ekranında gösterilen script
  kaynak          text        not null default 'filtre',  -- excel | filtre | manuel | karma
  kcm_id          bigint,                -- listeyi sahiplenen KÇM (null = şirket geneli)
  durum           text        not null default 'hazirlik',-- hazirlik | aktif | durdu | bitti
  deneme_limiti   smallint    not null default 4,
  olusturan_my_id bigint,
  olusturma       timestamptz not null default now(),
  kapanis         timestamptz,
  constraint lead_liste_durum_chk  check (durum  in ('hazirlik','aktif','durdu','bitti')),
  constraint lead_liste_kaynak_chk check (kaynak in ('excel','filtre','manuel','karma')),
  constraint lead_liste_deneme_chk check (deneme_limiti between 1 and 20)
);

comment on table public.lead_liste is
  'Lead arama listesi (kampanya). Agent ekranı bu listelerden birini seçerek çalışır.';
comment on column public.lead_liste.konusma_metni is
  'Agent arama ekranında açılır kutuda gösterilir. Metni değiştirip red nedenleri raporuyla sonucu ölçebilirsin.';
comment on column public.lead_liste.deneme_limiti is
  'Bu kadar denemeden sonra kayıt otomatik "ulaşılamadı/tamamlandı"ya geçer. Gece çalışan iş YOKTUR — agent ekranı açılınca süpürülür.';

create index if not exists lead_liste_ix_durum on public.lead_liste (durum, olusturma desc);
create index if not exists lead_liste_ix_kcm   on public.lead_liste (kcm_id) where kcm_id is not null;

-- ---------------------------------------------------------------- 2) KAYIT
create table if not exists public.lead_kayit (
  kayit_id        uuid        primary key default gen_random_uuid(),
  liste_id        uuid        not null references public.lead_liste(liste_id) on delete cascade,
  ncst            text        not null,
  unvan           text,                  -- SNAPSHOT: Excel'den gelen unvan customers'ta olmayabilir
  kaynak_satir    jsonb,                 -- Excel'in ham satırı — hiçbir kolon kaybolmaz
  sistemde_var    boolean     not null default true,  -- customers'ta karşılığı var mı

  durum           text        not null default 'henuz_aranmadi',
  durum_grubu     text        not null default 'yeni',   -- yeni | tekrar | ulasilamadi | tamam
  sonuc_grubu     text,                                   -- olumlu | olumsuz | istemiyor

  deneme_sayisi   integer     not null default 0,
  son_arama       timestamptz,
  sonraki_arama   timestamptz,
  rakip_sozlesme_bitis date,             -- dolduysa bitişten 60 gün önce tekrar kuyruğa düşer

  atanan_agent_id bigint,                -- null = havuz
  oncelik         smallint    not null default 2,         -- 1 yüksek · 2 normal · 3 düşük

  kilit_agent_id  bigint,                -- yumuşak kilit: şu an kim arıyor
  kilit_zaman     timestamptz,

  olusturma       timestamptz not null default now(),
  guncelleme      timestamptz not null default now(),

  constraint lead_kayit_grup_chk  check (durum_grubu in ('yeni','tekrar','ulasilamadi','tamam')),
  constraint lead_kayit_sonuc_chk check (sonuc_grubu is null or sonuc_grubu in ('olumlu','olumsuz','istemiyor')),
  constraint lead_kayit_oncelik_chk check (oncelik between 1 and 3),
  -- aynı müşteri bir listede iki kez olamaz
  constraint lead_kayit_tekil unique (liste_id, ncst)
);

comment on column public.lead_kayit.unvan is
  'Liste oluşturulduğu andaki unvan. Excel NCST customers''ta yoksa kayıt ATILMAZ: unvan ve kaynak_satir ile listeye girer, sistemde_var=false işaretlenir.';
comment on column public.lead_kayit.kilit_agent_id is
  'Müşteri açıldığında yazılır. 15 dakika boyunca diğer agentlara "şu an X arıyor" diye görünür — iki agent aynı firmayı aramaz.';
comment on column public.lead_kayit.rakip_sozlesme_bitis is
  'Rakipte sözleşmeli müşteri. Bitişten 60 gün önce kayıt tekrar aranacaklara düşer; hesap okuma anında yapılır, zamanlayıcı yoktur.';

create index if not exists lead_kayit_ix_kuyruk   on public.lead_kayit (liste_id, durum_grubu, oncelik);
create index if not exists lead_kayit_ix_sonraki  on public.lead_kayit (sonraki_arama) where sonraki_arama is not null;
create index if not exists lead_kayit_ix_ncst     on public.lead_kayit (ncst);
create index if not exists lead_kayit_ix_agent    on public.lead_kayit (atanan_agent_id) where atanan_agent_id is not null;
create index if not exists lead_kayit_ix_sozlesme on public.lead_kayit (rakip_sozlesme_bitis) where rakip_sozlesme_bitis is not null;

-- ---------------------------------------------------------------- 3) ARAMA (her deneme bir satır)
create table if not exists public.lead_arama (
  id              uuid        primary key default gen_random_uuid(),
  kayit_id        uuid        not null references public.lead_kayit(kayit_id) on delete cascade,
  liste_id        uuid        not null,
  ncst            text        not null,
  agent_id        bigint,
  deneme_no       integer     not null default 1,

  baslangic       timestamptz not null default now(),
  bitis           timestamptz,
  sure_sn         integer,                -- görüşme süresi

  telefon         text,
  contact_id      bigint,

  durum           text        not null,  -- seçilen sonuç (durum ağacının yaprağı)
  ulasildi        boolean,
  ulasilamama_neden text,
  muhatap_dogru   boolean,

  -- satış bilgileri (sipariş / detay / çapraz satış hallerinde)
  urun_id         bigint,
  urun_tipi       text,
  cihaz_marka_model text,                 -- serbest metin
  adet            integer,
  tahmini_ciro    numeric(14,2),
  ilgi_seviyesi   smallint,               -- 1..5

  rakip_sozlesme_bitis date,
  randevu_tarihi  timestamptz,

  olusan_task_id  bigint,                 -- açılan fırsat görev kartı
  yeni_contact_id bigint,                 -- yönlendirme ile alınan yeni kontak

  agent_notu      text,
  olusturma       timestamptz not null default now(),

  constraint lead_arama_ilgi_chk check (ilgi_seviyesi is null or ilgi_seviyesi between 1 and 5)
);

comment on table public.lead_arama is
  'Her arama denemesi bir satır. GÜNCELLENMEZ ve SİLİNMEZ — çağrı izi. Raporlar bu tablodan beslenir.';
comment on column public.lead_arama.olusan_task_id is
  'Bu aramadan doğan "Lead Satış Fırsatı" görev kartı. Fırsat kaydı AÇILMAZ — fırsatı MY, ziyaret formunu doldurarak açar.';

create index if not exists lead_arama_ix_kayit on public.lead_arama (kayit_id, deneme_no);
create index if not exists lead_arama_ix_liste on public.lead_arama (liste_id, olusturma desc);
create index if not exists lead_arama_ix_agent on public.lead_arama (agent_id, olusturma desc);
create index if not exists lead_arama_ix_durum on public.lead_arama (durum);
create index if not exists lead_arama_ix_saat  on public.lead_arama (olusturma);

-- ============================================================================
-- YETKİLER
-- lead_arama: UPDATE/DELETE YOK — çağrı izi değiştirilemez, silinemez.
-- ============================================================================
alter table public.lead_liste enable row level security;
alter table public.lead_kayit enable row level security;
alter table public.lead_arama enable row level security;

revoke all on public.lead_liste from anon, authenticated;
revoke all on public.lead_kayit from anon, authenticated;
revoke all on public.lead_arama from anon, authenticated;

grant select, insert, update, delete on public.lead_liste to anon;
grant select, insert, update, delete on public.lead_kayit to anon;
grant select, insert                 on public.lead_arama to anon;

drop policy if exists lead_liste_tum on public.lead_liste;
create policy lead_liste_tum on public.lead_liste for all to anon using (true) with check (true);

drop policy if exists lead_kayit_tum on public.lead_kayit;
create policy lead_kayit_tum on public.lead_kayit for all to anon using (true) with check (true);

drop policy if exists lead_arama_oku on public.lead_arama;
create policy lead_arama_oku on public.lead_arama for select to anon using (true);
drop policy if exists lead_arama_yaz on public.lead_arama;
create policy lead_arama_yaz on public.lead_arama for insert to anon with check (true);

-- ============================================================================
-- GÖREV TİPİ — fırsat görev kartı
-- bagli_form='ziyaret_firsat': MY görevi ziyaret + fırsat formunu doldurarak
-- kapatır. Yani FIRSAT KAYDI ÇAĞRI MERKEZİNDE AÇILMAZ, sahada açılır.
-- ============================================================================
insert into public.task_types (tip_adi, bagli_form, ziyaret_amaci, aktif, sira)
select 'Lead Satış Fırsatı', 'ziyaret_firsat', null, true,
       coalesce((select max(sira) from public.task_types), 0) + 1
where not exists (
  select 1 from public.task_types where tip_adi = 'Lead Satış Fırsatı'
);

-- ============================================================================
-- ROL & YETKİ MATRİSİ
-- Rol adı VARSAYILMIYOR: yetkiler, bugün arama_agent / arama_rapor /
-- yetki_yonet olan rollere verilir. Ekranda görünmesi için yetki.js
-- güncellemesi Faz 2'de gelecek — satırların şimdiden olması zararsız.
-- ============================================================================

-- lead_agent  → bugün arama_agent olan roller
insert into public.role_permissions (role_kod, perm_tip, perm_key, deger)
select p.role_kod, 'action', 'lead_agent', '1'
from public.role_permissions p
where p.perm_tip='action' and p.perm_key='arama_agent' and p.deger='1'
  and not exists (select 1 from public.role_permissions x
                  where x.role_kod=p.role_kod and x.perm_tip='action' and x.perm_key='lead_agent');

-- lead_rapor  → bugün arama_rapor olan roller
insert into public.role_permissions (role_kod, perm_tip, perm_key, deger)
select p.role_kod, 'action', 'lead_rapor', '1'
from public.role_permissions p
where p.perm_tip='action' and p.perm_key='arama_rapor' and p.deger='1'
  and not exists (select 1 from public.role_permissions x
                  where x.role_kod=p.role_kod and x.perm_tip='action' and x.perm_key='lead_rapor');

-- lead_liste_yonet → bugün yetki_yonet olan roller (liste kurmak yönetim işi)
insert into public.role_permissions (role_kod, perm_tip, perm_key, deger)
select p.role_kod, 'action', 'lead_liste_yonet', '1'
from public.role_permissions p
where p.perm_tip='action' and p.perm_key='yetki_yonet' and p.deger='1'
  and not exists (select 1 from public.role_permissions x
                  where x.role_kod=p.role_kod and x.perm_tip='action' and x.perm_key='lead_liste_yonet');

-- KAPSAM: 'lead' modülü. Her role, o rolün ZİYARET TEYİT (arama) kapsamı ne ise
-- aynısı verilir; yoksa 'KÇM'. Admin ekranından tek tek değiştirilebilir.
insert into public.role_permissions (role_kod, perm_tip, perm_key, deger)
select r.role_adi, 'scope', 'lead',
       coalesce(
         (select s.deger from public.role_permissions s
           where s.role_kod=r.role_adi and s.perm_tip='scope' and s.perm_key='arama'),
         'KÇM')
from public.roles r
where not exists (select 1 from public.role_permissions x
                  where x.role_kod=r.role_adi and x.perm_tip='scope' and x.perm_key='lead');

-- ============================================================================
-- KONTROL — görmen gerekenler
--   1) 3 tablo, rls_acik = true
--   2) lead_arama'da anon yetkisi: INSERT, SELECT  (UPDATE/DELETE olmamalı)
--   3) 'Lead Satış Fırsatı' görev tipi: 1 satır
--   4) yetki satırları: lead_agent / lead_rapor / lead_liste_yonet + lead kapsamı
-- ============================================================================
select '1) tablo+rls' as kontrol, table_name as ad,
       (select relrowsecurity from pg_class where relname=t.table_name)::text as deger
from information_schema.tables t
where table_schema='public' and table_name in ('lead_liste','lead_kayit','lead_arama')
union all
select '2) anon yetki', table_name,
       string_agg(distinct privilege_type, ', ' order by privilege_type)
from information_schema.role_table_grants
where table_schema='public' and grantee='anon'
  and table_name in ('lead_liste','lead_kayit','lead_arama')
group by table_name
union all
select '3) gorev tipi', tip_adi, type_id::text
from public.task_types where tip_adi='Lead Satış Fırsatı'
union all
select '4) yetki', perm_key || ' · ' || role_kod, deger
from public.role_permissions
where perm_key in ('lead_agent','lead_rapor','lead_liste_yonet','lead')
order by 1, 2;
