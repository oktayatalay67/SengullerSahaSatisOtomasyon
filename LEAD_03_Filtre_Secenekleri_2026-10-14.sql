-- ============================================================================
-- LEAD / ARAMA LİSTESİ FİLTRELERİ — SEÇENEK OKUMA FONKSİYONU
-- Tarih: 14.10.2026
--
-- NEDEN
--   Filtre ekranında İl / İlçe / Sektör / Müşteri tipi SERBEST METİN olarak
--   yazılmıştı ve .ilike() ile tam eşleşme aranıyordu. Türkçe İ/i, baştaki-
--   sondaki boşluk ve farklı yazımlar yüzünden pratikte hiçbir şey dönmüyordu.
--   Bu fonksiyon, ekranın seçenekleri DOĞRUDAN VERİDEN okumasını sağlar;
--   kullanıcı artık yazmaz, listeden seçer. Yanlış yazma ihtimali biter.
--
-- NE YAPAR
--   1) lead_filtre_secenekleri(alan, iller) → o alandaki farklı değerler + adet
--   2) sunucu_altyapisi / firewall_kullanimi / it_ekibi kolon tiplerini raporlar
--      (bekleyen LEAD_KONTROL sorgusu buraya alındı — tek adımda bitsin)
--
-- NE YAPMAZ
--   Hiçbir tablo değiştirmez, hiçbir satır yazmaz/silmez. Yalnız OKUR.
--   Tekrar çalıştırılabilir (create or replace).
--
-- PLATFORM BAĞIMSIZ (çalışma kuralları Bölüm 9)
--   Düz PostgreSQL. Zamanlayıcı yok, materialized view yok, tazeleme işi yok.
--   Kendi sunucuna taşıdığında aynen çalışır.
-- ============================================================================

-- ---------------------------------------------------------------- FONKSİYON
create or replace function public.lead_filtre_secenekleri(
  p_alan  text,
  p_iller text[] default null
)
returns table(deger text, adet bigint)
language plpgsql
stable
security invoker          -- anon'un customers üzerindeki mevcut hakkıyla çalışır,
                          -- yeni bir kapı açmaz
set search_path = public  -- fonksiyon içinde arama yolu sabitlenir
as $$
begin
  -- Alan adı KULLANICIDAN GELEN METİN. Beyaz listeyle sınırlanmazsa SQL
  -- enjeksiyonu olur — format() %I bile serbest kolon adını kabul eder.
  if p_alan not in ('il','ilce','sektor','musteri_tipi') then
    raise exception 'Gecersiz alan: %. Izinli: il, ilce, sektor, musteri_tipi', p_alan;
  end if;

  return query execute format($f$
    select btrim(c.%1$I::text)             as deger,
           count(*)::bigint                as adet
      from public.customers c
     where c.%1$I is not null
       and btrim(c.%1$I::text) <> ''
       and ($1 is null or array_length($1,1) is null or c.il = any($1))
     group by 1
     order by 1
  $f$, p_alan)
  using p_iller;
end;
$$;

comment on function public.lead_filtre_secenekleri(text, text[]) is
  'Lead filtre ekranı için customers tablosundan farklı değerleri okur.
   p_alan: il | ilce | sektor | musteri_tipi (beyaz liste, başkası reddedilir).
   p_iller: yalnız ilce için anlamlı — ilçe listesi seçilen illere daraltılır.
   SALT OKUMA. Zamanlayıcı/materialized view yoktur.';

-- Ekranı çalıştıran rol çağırabilsin
grant execute on function public.lead_filtre_secenekleri(text, text[]) to anon;

-- ============================================================================
-- KONTROL — bana bu üç bloğun çıktısını gönder
-- Supabase SQL Editor yalnız SON sorgunun sonucunu gösterir; blokları
-- TEK TEK seçip çalıştır, üç çıktıyı da yolla.
-- ============================================================================

-- 1) Fonksiyon çalışıyor mu — il listesi (ilk 15 satır + kaç il var)
select deger as il, adet as musteri_sayisi
  from public.lead_filtre_secenekleri('il')
 order by adet desc
 limit 15;

-- 2) İlçe, İSTANBUL'a daraltıldığında geliyor mu
--    (1. sorguda İstanbul hangi yazımla görünüyorsa onu yaz)
select deger as ilce, adet
  from public.lead_filtre_secenekleri('ilce', array['İSTANBUL'])
 order by adet desc
 limit 10;

-- 3) BEKLEYEN KONTROL — üç kolonun tipi gerçekten boolean mı?
--    Filtre ekranı bunları boolean varsayıyor (.eq(...,true)).
--    Değilse o üç filtre bugün de çalışmıyor demektir.
select column_name  as kolon,
       data_type    as tip,
       is_nullable  as bos_olabilir
  from information_schema.columns
 where table_schema='public' and table_name='customers'
   and column_name in ('sunucu_altyapisi','firewall_kullanimi','it_ekibi',
                       'il','ilce','sektor','musteri_tipi')
 order by column_name;
