-- ============================================================================
-- KONTROL — profil kolonlarının veri tipi
-- Tarih: 12.10.2026 · Sadece OKUR, hiçbir şeyi değiştirmez.
--
-- NEDEN: Faz 3 filtre panelinde "Sunucu altyapısı var/yok", "Firewall var/yok",
-- "IT ekibi var/yok" seçenekleri bu kolonları BOOLEAN kabul ederek sorguluyor.
-- Kolonlar metin (text) ise o üç filtre sessizce boş sonuç döndürür.
-- Tipi görüp gerekirse sorguyu düzeltelim — tahminle bırakmıyorum.
-- ============================================================================
select column_name as kolon, data_type as tip, is_nullable as bos_olabilir
from information_schema.columns
where table_schema='public' and table_name='customers'
  and column_name in ('sunucu_altyapisi','firewall_kullanimi','it_ekibi',
                      'profil_tamamlandi','beyaz_yakali_sayi','toplam_hat',
                      'ziyaret_potansiyeli_yok','sektor','churn_riski')
order by column_name;
