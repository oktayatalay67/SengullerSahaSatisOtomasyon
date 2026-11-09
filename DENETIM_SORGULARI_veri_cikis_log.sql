-- ============================================================================
-- VERİ ÇIKIŞ İZİ — HAZIR SORGULAR
-- Tablo: public.veri_cikis_log   ·   Tarih: 11.10.2026
--
-- NASIL KULLANILIR
--   Supabase SQL editöründe **TEK SORGU** seçip çalıştır. Editör birden fazla
--   sorgu gönderdiğinde yalnız sonuncunun sonucunu gösterir — bu yüzden
--   istediğin sorgunun metnini fare ile seçip "Run selected" ile çalıştır.
--
--   Saatler Europe/Istanbul'a çevrilmiş olarak gelir.
--   Tarih aralığını değiştirmek için her sorgudaki `interval '30 days'`
--   ifadesini düzenle.
--
-- BU SORGULAR DASHBOARD'UN KARTLARIDIR
--   1-4  : "ne oldu" — olgu raporları
--   5-10 : "şüpheli olan ne" — kural tabanlı tespit
-- ============================================================================


-- ============================================================================
-- 1) ZAMAN TÜNELİ — kim, ne zaman, hangi raporu, kaç satır
--    Senin "kim ne zaman hangi raporu Excel indirdi" sorunun doğrudan cevabı.
-- ============================================================================
select
  to_char(olusturma at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI:SS') as zaman,
  ad_soyad,
  yetki_seviyesi,
  case when vekaleten then 'VEKALETEN → ' || coalesce(gercek_ad_soyad,'?') else '' end as gercek_kisi,
  case tur when 'disa_aktarim' then 'İNDİRDİ' when 'rapor_goruntuleme' then 'ekranda baktı' else tur end as hareket,
  rapor_adi,
  bicim,
  satir_sayisi,
  kapsam,
  oturum_id
from public.veri_cikis_log
where olusturma > now() - interval '30 days'
order by olusturma desc
limit 200;


-- ============================================================================
-- 2) KİŞİ BAZLI ÖZET — kim hangi zaman aralığında kaç Excel indirdi
--    Dashboard'un ana tablosu. Bir satıra tıklanınca sorgu 1'in o kişiye
--    filtrelenmiş hali açılacak.
-- ============================================================================
select
  ad_soyad,
  yetki_seviyesi,
  count(*) filter (where tur = 'disa_aktarim')      as excel_indirme,
  count(*) filter (where tur = 'rapor_goruntuleme') as ekran_goruntuleme,
  count(distinct rapor_adi) filter (where tur = 'disa_aktarim') as farkli_rapor_tipi,
  sum(satir_sayisi) filter (where tur = 'disa_aktarim')         as toplam_satir,
  max(satir_sayisi) filter (where tur = 'disa_aktarim')         as en_buyuk_tek_indirme,
  count(*) filter (where vekaleten)                 as vekaleten_hareket,
  to_char(min(olusturma) at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as ilk_hareket,
  to_char(max(olusturma) at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as son_hareket
from public.veri_cikis_log
where olusturma > now() - interval '30 days'
group by ad_soyad, yetki_seviyesi
order by toplam_satir desc nulls last;


-- ============================================================================
-- 3) RAPOR TİPİNE GÖRE — hangi rapor kaç kez, kaç kişi tarafından indirildi
--    "Rapor tiplerine göre indirilen excel rapor sayısı" sorunun cevabı.
-- ============================================================================
select
  rapor_adi,
  bicim,
  count(*)                      as indirme_sayisi,
  count(distinct user_id)       as kac_kisi,
  sum(satir_sayisi)             as toplam_satir,
  round(avg(satir_sayisi))      as ortalama_satir,
  max(satir_sayisi)             as en_buyuk,
  to_char(max(olusturma) at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as son_indirme
from public.veri_cikis_log
where tur = 'disa_aktarim'
  and olusturma > now() - interval '30 days'
group by rapor_adi, bicim
order by toplam_satir desc nulls last;


-- ============================================================================
-- 4) GÜN × KİŞİ YOĞUNLUK — hangi gün kim kaç Excel indirdi
--    Dashboard'da ısı haritası olarak gösterilecek. Bir günde patlama varsa
--    burada tek bakışta görünür.
-- ============================================================================
select
  (olusturma at time zone 'Europe/Istanbul')::date as gun,
  ad_soyad,
  count(*)          as excel_adedi,
  sum(satir_sayisi) as toplam_satir,
  string_agg(distinct rapor_adi, ' · ') as raporlar
from public.veri_cikis_log
where tur = 'disa_aktarim'
  and olusturma > now() - interval '30 days'
group by gun, ad_soyad
order by gun desc, toplam_satir desc nulls last;


-- ============================================================================
-- 5) ŞÜPHELİ: KENDİ ALIŞKANLIĞININ DIŞINA ÇIKAN İNDİRME
--    Mantık: her kişinin kendi ortalaması hesaplanır; o ortalamanın 3 katından
--    büyük tek indirmeler işaretlenir. Sabit bir eşik (örn. "1000 satır")
--    kullanmıyoruz — 1000 satır bir MY için anormal, bir ADMIN için normaldir.
--    En az 3 hareketi olan kişiler değerlendirilir (ortalama anlamlı olsun).
-- ============================================================================
with d as (
  select user_id, ad_soyad, yetki_seviyesi, olusturma, rapor_adi, satir_sayisi,
         vekaleten, gercek_ad_soyad,
         avg(satir_sayisi) over (partition by user_id) as kisi_ortalamasi,
         count(*)          over (partition by user_id) as kisi_hareket_sayisi
  from public.veri_cikis_log
  where tur = 'disa_aktarim' and satir_sayisi is not null
)
select
  to_char(olusturma at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as zaman,
  ad_soyad, yetki_seviyesi, rapor_adi,
  satir_sayisi,
  round(kisi_ortalamasi)                                  as kisi_ortalamasi,
  round(satir_sayisi / nullif(kisi_ortalamasi, 0), 1)      as ortalamanin_kati,
  case when vekaleten then coalesce(gercek_ad_soyad,'?') end as gercek_kisi
from d
where kisi_hareket_sayisi >= 3
  and satir_sayisi > kisi_ortalamasi * 3
order by ortalamanin_kati desc nulls last;


-- ============================================================================
-- 6) ŞÜPHELİ: SERİ İNDİRME (10 dakikada 3+ Excel)
--    Toplu veri çekme davranışının en net imzası. Normal kullanıcı bir raporu
--    indirir, bakar, işine döner; veri toplayan arka arkaya indirir.
-- ============================================================================
with x as (
  select user_id, ad_soyad, yetki_seviyesi, olusturma, rapor_adi, satir_sayisi, oturum_id,
         count(*) over (
           partition by user_id
           order by olusturma
           range between interval '10 minutes' preceding and current row
         ) as on_dakikada_adet
  from public.veri_cikis_log
  where tur = 'disa_aktarim'
)
select
  to_char(olusturma at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI:SS') as zaman,
  ad_soyad, yetki_seviyesi, rapor_adi, satir_sayisi,
  on_dakikada_adet,
  oturum_id
from x
where on_dakikada_adet >= 3
order by olusturma desc;


-- ============================================================================
-- 7) ŞÜPHELİ: MESAİ DIŞI VE HAFTA SONU İNDİRME
--    08:00'den önce, 20:00'den sonra veya Cumartesi/Pazar yapılan indirmeler.
--    Saha ekibinin gece 02:00'de Excel indirmesi için iyi bir sebep yoktur.
-- ============================================================================
select
  to_char(olusturma at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as zaman,
  to_char(olusturma at time zone 'Europe/Istanbul', 'Day')                as gun_adi,
  ad_soyad, yetki_seviyesi, rapor_adi, satir_sayisi,
  case
    when extract(dow from olusturma at time zone 'Europe/Istanbul') in (0,6) then 'HAFTA SONU'
    when extract(hour from olusturma at time zone 'Europe/Istanbul') < 8    then 'SABAH 08 ÖNCESİ'
    else 'AKŞAM 20 SONRASI'
  end as neden
from public.veri_cikis_log
where tur = 'disa_aktarim'
  and (
       extract(dow  from olusturma at time zone 'Europe/Istanbul') in (0,6)
    or extract(hour from olusturma at time zone 'Europe/Istanbul') < 8
    or extract(hour from olusturma at time zone 'Europe/Istanbul') >= 20
  )
order by olusturma desc;


-- ============================================================================
-- 8) ŞÜPHELİ: VEKALETEN YAPILAN İNDİRMELER
--    ADMIN başkasının profiline girip veri indirdiğinde, eskiden iz o kişinin
--    adına çıkıyordu. Artık gerçek kişi görünür. Sistemde 2 ADMIN var.
-- ============================================================================
select
  to_char(olusturma at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as zaman,
  gercek_ad_soyad  as gercekte_kim,
  ad_soyad         as kimin_profilinde,
  tur, rapor_adi, bicim, satir_sayisi, kapsam
from public.veri_cikis_log
where vekaleten
order by olusturma desc;


-- ============================================================================
-- 9) ŞÜPHELİ: FİLTRESİZ GENİŞ ÇEKİM
--    KÇM / MY / takım filtresi hiç uygulanmadan 500+ satır indirilmiş.
--    Kendi portföyüne bakan biri filtre kullanır; veri toplayan filtreyi
--    kaldırıp hepsini çeker.
-- ============================================================================
select
  to_char(olusturma at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as zaman,
  ad_soyad, yetki_seviyesi, rapor_adi, satir_sayisi, kapsam
from public.veri_cikis_log
where tur = 'disa_aktarim'
  and coalesce(satir_sayisi, 0) >= 500
  and not (coalesce(kapsam, '{}'::jsonb) ?| array['kcm','my','takim','ncst'])
order by satir_sayisi desc;


-- ============================================================================
-- 10) ŞÜPHELİ: YENİ DAVRANIŞ — ilk kez indirmeye başlayanlar
--    Aylardır rapor indirmeyen biri bir anda indirmeye başladıysa bu bir
--    davranış değişikliğidir. İşten ayrılmak üzere olan birinin tipik imzası.
--    (İz katmanı 10.10.2026'da açıldı; bu sorgu birkaç hafta sonra anlam
--     kazanır — şimdilik herkes "yeni" görünür, bu normaldir.)
-- ============================================================================
with ilk as (
  select user_id, ad_soyad, yetki_seviyesi,
         min(olusturma) as ilk_indirme,
         count(*)       as toplam_indirme,
         sum(satir_sayisi) as toplam_satir
  from public.veri_cikis_log
  where tur = 'disa_aktarim'
  group by user_id, ad_soyad, yetki_seviyesi
)
select
  ad_soyad, yetki_seviyesi,
  to_char(ilk_indirme at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as ilk_indirme,
  toplam_indirme, toplam_satir
from ilk
where ilk_indirme > now() - interval '7 days'
order by toplam_satir desc nulls last;


-- ============================================================================
-- EK) ÜST SATIR SAYAÇLARI — dashboard'un tepesindeki kutular (son 30 gün)
--     Tek satır döner; her sayı tıklanabilir kart olacak.
-- ============================================================================
select
  count(*) filter (where tur = 'disa_aktarim')                     as excel_indirme,
  sum(satir_sayisi) filter (where tur = 'disa_aktarim')            as disariya_cikan_satir,
  count(distinct user_id) filter (where tur = 'disa_aktarim')      as indiren_kisi,
  max(satir_sayisi) filter (where tur = 'disa_aktarim')            as en_buyuk_tek_indirme,
  count(*) filter (where tur = 'disa_aktarim'
                     and (extract(dow  from olusturma at time zone 'Europe/Istanbul') in (0,6)
                       or extract(hour from olusturma at time zone 'Europe/Istanbul') < 8
                       or extract(hour from olusturma at time zone 'Europe/Istanbul') >= 20)) as mesai_disi,
  count(*) filter (where tur = 'disa_aktarim' and vekaleten)       as vekaleten_indirme,
  count(*) filter (where tur = 'rapor_goruntuleme')                as ekran_goruntuleme
from public.veri_cikis_log
where olusturma > now() - interval '30 days';
