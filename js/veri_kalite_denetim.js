// ============================================================
// veri_kalite_denetim.js — v1.0.1 (V31.89)
//   Devir notu: claude/DEVIR-NOTU_Veri-Kalitesi-Denetim-Modulu_2026-09-13.md
// ------------------------------------------------------------
// v1.0.1 DEĞİŞİKLİK: _vkIsimTutarsizligiTara — PK EŞLEŞTİRME BUG FIX.
//   Önceki sürümde PK, taramadan SONRA "aynı iliski_kolonu (örn. kcm_id)
//   değerine sahip satırlar arasında kolon_adi değeri eşleşen ilkini bul"
//   mantığıyla tahmin ediliyordu. Aynı KÇM'deki birden fazla kullanıcı aynı
//   hatalı cache değerine sahipse (gerçek vakada 33 kullanıcı, kcm_id=6)
//   hepsi YANLIŞLIKLA aynı tek satıra eşleniyor, "Seçilenleri Düzelt"
//   hep o satırı güncelliyor, diğer 32 kullanıcı hiç düzeltilmeden
//   "uygulandı" işaretleniyordu (tekrar taramada aynı bulgular geri geliyordu).
//   DÜZELTME: PK artık satırla birlikte İLK sorguda çekiliyor — sonradan
//   eşleştirme/tahmin adımı tamamen kaldırıldı.
//   Ayrıca üretimde şu da ortaya çıktı: kaynak tablo (örn. kcm_groups) da
//   hatalı olabilir (bu vakada sonunda fazladan boşluk). Motor "kaynak
//   her zaman doğrudur" varsayar — kaynağın kendisi bozuksa oraya göre
//   düzeltme yanlış yöne gider. Bu yüzden düzeltme UYGULAMADAN ÖNCE admin
//   ekrandaki "Mevcut" / "Önerilen" değerlerini gözle kontrol etmeli.
// ------------------------------------------------------------
// NE YAPAR (bu sürümde):
//   • veri_kalite_alan_haritasi tablosunu okur (hangi tablo.kolon hangi
//     referans tipini taşıyor, hangi kaynakla karşılaştırılacak).
//   • ID tipi kontroller (NCST/MY_ID/KCM_ID): kaynakta bulunmayan (orphan)
//     değerleri tespit eder.
//   • İsim tipi kontroller (KCM_ADI vb., iliski_kolonu doluysa): ilişkili
//     ID üzerinden kaynak tablodaki gerçek adla karşılaştırır, uyuşmuyorsa
//     düzeltme önerisi üretir.
//   • Sonuçları veri_kalite_tespit tablosuna yazar (SADECE OKUMA + INSERT —
//     hiçbir zaman kaynak tabloya yazmaz). Düzeltme uygulama AYRI bir
//     fonksiyondadır (veriKaliteDuzeltUygula, bu dosyanın sonunda) ve
//     yalnızca admin onayıyla çağrılır.
//
// NE YAPMAZ (henüz — ayrı adımlarda eklenecek):
//   • Durum/status typo kontrolü (madde 2 #10) — kural seti netleşmedi.
//   • Tarih mantığı kontrolü (madde 2 #11) — kural seti netleşmedi.
//   • Kontak mükerrerlik (isim+telefon farklı firma) — ayrı fonksiyon,
//     ayrı adımda (veri_kalitesi.js'e bağlanacak).
//   • Excel export — ayrı adımda.
//   • Admin ekranı / buton — ayrı adımda (admin.js).
//
// Bağımlılık: sb, escapeHTML (utils.js), hasPerm (yetki.js)
// ============================================================
'use strict';

/* ============================================================
   YARDIMCI: tarama kimliği üret
   ============================================================ */
function _vkTaramaIdUret(){
  if(typeof crypto!=='undefined' && crypto.randomUUID) return crypto.randomUUID();
  // eski tarayıcı geri düşüşü
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

/* ============================================================
   1) ANA TARAMA — dışarıdan çağrılan giriş noktası
   Döner: { taramaId, toplamBulgu, kontrolOzet: [{kontrol_tipi, adet}] }
   ============================================================ */
async function veriKaliteTara(){
  if(typeof hasPerm==='function' && !hasPerm('veri_kalite_calistir')){
    throw new Error('Bu işlem için yetkiniz yok (veri_kalite_calistir).');
  }

  const taramaId = _vkTaramaIdUret();
  const bulgular = []; // DB'ye toplu insert edilecek satırlar

  const { data: harita, error: hErr } = await sb
    .from('veri_kalite_alan_haritasi')
    .select('*')
    .eq('aktif', true);
  if(hErr) throw hErr;

  for(const satir of (harita||[])){
    try{
      const bulunanlar = await _vkSatirTara(satir);
      bulgular.push(...bulunanlar);
    }catch(e){
      console.error('Alan haritası satırı taranamadı:', satir, e);
      // Bir satırın taranamaması tüm taramayı durdurmasın; loglayıp devam.
    }
  }

  // Kontak mükerrerlik toplu raporu (madde 3-B) — ayrı fonksiyon, aynı taramaya dahil edilir
  try{
    const kontakBulgu = await _vkKontakMukerrerTara();
    bulgular.push(...kontakBulgu);
  }catch(e){
    console.error('Kontak mükerrerlik taraması başarısız:', e);
  }

  if(bulgular.length){
    const satirlar = bulgular.map(b=>({ tarama_id: taramaId, ...b }));
    // Supabase/PostgREST tek istekte çok satır kabul eder; 500'lük parçalara bölelim (güvenlik payı)
    for(let i=0;i<satirlar.length;i+=500){
      const parca = satirlar.slice(i,i+500);
      const { error: iErr } = await sb.from('veri_kalite_tespit').insert(parca);
      if(iErr) throw iErr;
    }
  }

  // Özet
  const ozetMap = {};
  bulgular.forEach(b=>{ ozetMap[b.kontrol_tipi] = (ozetMap[b.kontrol_tipi]||0)+1; });
  const kontrolOzet = Object.keys(ozetMap).map(k=>({ kontrol_tipi:k, adet:ozetMap[k] }));

  return { taramaId, toplamBulgu: bulgular.length, kontrolOzet };
}

/* ============================================================
   2) TEK ALAN HARİTASI SATIRINI TARA
   ============================================================ */
async function _vkSatirTara(satir){
  const { tablo_adi, kolon_adi, referans_tipi, kaynak_tablo, kaynak_kolon,
          iliski_kolonu, kaynak_iliski_kolonu } = satir;

  if(iliski_kolonu && kaynak_iliski_kolonu){
    return await _vkIsimTutarsizligiTara(satir);
  }
  return await _vkOrphanTara(satir);
}

/* ------------------------------------------------------------
   2a) ID TİPİ — ORPHAN TESPİTİ
   "Bu tablodaki değer, kaynak tabloda gerçekten var mı?"
   ------------------------------------------------------------ */
async function _vkOrphanTara(satir){
  const { tablo_adi, kolon_adi, referans_tipi, kaynak_tablo, kaynak_kolon } = satir;

  // 1) Bu tablodaki kullanılan (null olmayan, benzersiz) değerleri çek
  const { data: satirlar, error: e1 } = await sb
    .from(tablo_adi)
    .select(kolon_adi)
    .not(kolon_adi, 'is', null);
  if(e1) throw e1;

  const kullanilanDegerler = [...new Set((satirlar||[]).map(r=>r[kolon_adi]).filter(v=>v!==null && v!==undefined && v!==''))];
  if(kullanilanDegerler.length===0) return [];

  // 2) Kaynak tabloda gerçekten var olanları çek (parça parça — .in() büyük listede sorun çıkarabilir)
  const kaynaktaVarSet = new Set();
  for(let i=0;i<kullanilanDegerler.length;i+=300){
    const parca = kullanilanDegerler.slice(i,i+300);
    const { data: kdata, error: e2 } = await sb.from(kaynak_tablo).select(kaynak_kolon).in(kaynak_kolon, parca);
    if(e2) throw e2;
    (kdata||[]).forEach(r=>kaynaktaVarSet.add(r[kaynak_kolon]));
  }

  const eksikDegerler = kullanilanDegerler.filter(v=>!kaynaktaVarSet.has(v));
  if(eksikDegerler.length===0) return [];

  // 3) Eksik değerlere sahip satırların PK'sını bul (rapor için) — tablonun PK kolonunu tahmin etmiyoruz,
  //    aynı kolon + değer eşleşmesiyle ilk N satırı örnek olarak çekiyoruz.
  const bulgular = [];
  for(let i=0;i<eksikDegerler.length;i+=300){
    const parca = eksikDegerler.slice(i,i+300);
    const { data: ornekler, error: e3 } = await sb.from(tablo_adi).select('*').in(kolon_adi, parca).limit(2000);
    if(e3) throw e3;
    (ornekler||[]).forEach(row=>{
      bulgular.push({
        kontrol_tipi: referans_tipi,
        tablo_adi,
        kayit_pk: _vkPkTahmin(tablo_adi, row),
        kolon_adi,
        mevcut_deger: String(row[kolon_adi]),
        onerilen_deger: null, // orphan — otomatik "doğru" değer yok, insan karar verecek
        baglam_bilgisi: { not:'kaynakta_bulunamadi', kaynak_tablo, kaynak_kolon }
      });
    });
  }
  return bulgular;
}

/* ------------------------------------------------------------
   2b) İSİM TİPİ — CACHE TUTARSIZLIĞI TESPİTİ
   "Bu satırın iliski_kolonu değeri üzerinden kaynağa gidersem,
    oradaki ad, bu satırdaki cache'lenmiş adla aynı mı?"
   ------------------------------------------------------------ */
async function _vkIsimTutarsizligiTara(satir){
  const { tablo_adi, kolon_adi, referans_tipi, kaynak_tablo, kaynak_kolon,
          iliski_kolonu, kaynak_iliski_kolonu } = satir;

  // v1.0.1 DÜZELTME: PK, satırla BİRLİKTE ilk sorguda çekiliyor (aşağıdaki
  // pkKolon dahil select). Önceki sürümde PK sonradan, aynı iliski_kolonu
  // değerine sahip TÜM satırlar arasında "kolon_adi değeri eşleşen ilkini"
  // bularak tahmin ediliyordu — aynı ilişkiye (örn. aynı KÇM) bağlı birden
  // fazla satır aynı (hatalı) cache değerine sahipse hepsi YANLIŞLIKLA aynı
  // tek satıra eşleniyor, düzeltme hep o satıra yazılıyor, diğerleri hiç
  // düzeltilmeden "uygulandı" işaretleniyordu. Artık her satır kendi PK'sini
  // baştan taşıyor, eşleştirme adımına gerek yok.
  const pkKolon = (typeof _VK_PK_KOLONLARI!=='undefined') ? _VK_PK_KOLONLARI[tablo_adi] : null;
  const selectKolonlari = pkKolon ? `${pkKolon},${iliski_kolonu},${kolon_adi}` : `${iliski_kolonu},${kolon_adi}`;

  const { data: satirlar, error: e1 } = await sb
    .from(tablo_adi)
    .select(selectKolonlari)
    .not(iliski_kolonu, 'is', null);
  if(e1) throw e1;

  const iliskiIdleri = [...new Set((satirlar||[]).map(r=>r[iliski_kolonu]).filter(v=>v!==null && v!==undefined))];
  if(iliskiIdleri.length===0) return [];

  const kaynakAdMap = {};
  for(let i=0;i<iliskiIdleri.length;i+=300){
    const parca = iliskiIdleri.slice(i,i+300);
    const { data: kdata, error: e2 } = await sb.from(kaynak_tablo)
      .select(`${kaynak_iliski_kolonu},${kaynak_kolon}`)
      .in(kaynak_iliski_kolonu, parca);
    if(e2) throw e2;
    (kdata||[]).forEach(r=>{ kaynakAdMap[r[kaynak_iliski_kolonu]] = r[kaynak_kolon]; });
  }

  const bulgular = [];
  for(const row of (satirlar||[])){
    const dogruAd = kaynakAdMap[row[iliski_kolonu]];
    const mevcutAd = row[kolon_adi];
    if(dogruAd===undefined) continue; // ilişkili ID kendi de orphan — bu, referans_tipi=KCM_ID/MY_ID kontrolünde ayrıca yakalanır
    if((mevcutAd||'') !== (dogruAd||'')){
      bulgular.push({
        kontrol_tipi: referans_tipi,
        tablo_adi,
        kayit_pk: _vkPkTahmin(tablo_adi, row),
        kolon_adi,
        mevcut_deger: mevcutAd,
        onerilen_deger: dogruAd,
        baglam_bilgisi: { iliski_kolonu, iliski_degeri: row[iliski_kolonu] }
      });
    }
  }
  return bulgular;
}

/* ------------------------------------------------------------
   PK TAHMİNİ — tablo bazlı bilinen birincil anahtar kolonları.
   Bilinmeyen tablo için tüm satırı JSON olarak döner (kayıp olmasın).
   ------------------------------------------------------------ */
const _VK_PK_KOLONLARI = {
  customers:'ncst', users:'my_id', contacts:'contact_id', visits:'visit_id',
  kcm_groups:'kcm_id', opportunities:'opp_id', tasks:'task_id', task_logs:'log_id',
  complaints:'complaint_id', sales_declarations:'decl_id', user_targets:'ut_id',
  announcements:'ann_id', announcement_reads:'id', products:'product_id',
  duyuru_feed:'duyuru_id', stok_tedarik_talepleri:'talep_id'
};
function _vkPkTahmin(tablo_adi, row){
  const pkKolon = _VK_PK_KOLONLARI[tablo_adi];
  if(pkKolon && row[pkKolon]!==undefined) return String(row[pkKolon]);
  return JSON.stringify(row).slice(0,200); // bilinmeyen tablo — kayıp olmasın, ham veri
}

/* ============================================================
   3) KONTAK MÜKERRERLİK — TOPLU RAPOR (madde 3-B)
   Aynı isim+telefon kombinasyonu farklı NCST'lerde kaç kez geçiyor?
   ============================================================ */
async function _vkKontakMukerrerTara(){
  const { data: kontaklar, error } = await sb.from('contacts')
    .select('contact_id,ncst,ad_soyad,telefon,email').eq('aktif', true);
  if(error) throw error;

  const grupMap = {}; // 'normalize_ad|normalize_tel' -> [kontak,...]
  (kontaklar||[]).forEach(k=>{
    const adKey = (k.ad_soyad||'').trim().toLocaleLowerCase('tr').replace(/\s+/g,' ');
    const telKey = typeof telefonNormalize==='function' ? telefonNormalize(k.telefon) : (k.telefon||'').replace(/\D/g,'');
    if(!adKey && !telKey) return;
    const key = adKey+'|'+telKey;
    grupMap[key] = grupMap[key]||[];
    grupMap[key].push(k);
  });

  const bulgular = [];
  for(const key in grupMap){
    const grup = grupMap[key];
    const farkliNcst = new Set(grup.map(g=>g.ncst).filter(Boolean));
    if(farkliNcst.size < 2) continue; // aynı firma içinde tekrar değil, farklı firma mükerrerliği aranıyor

    // Müşteri ünvanlarını çek
    const { data: custs } = await sb.from('customers').select('ncst,unvan').in('ncst',[...farkliNcst]);
    const unvanMap = {}; (custs||[]).forEach(c=>unvanMap[c.ncst]=c.unvan);

    grup.forEach(k=>{
      bulgular.push({
        kontrol_tipi: 'KONTAK_MUKERRER',
        tablo_adi: 'contacts',
        kayit_pk: String(k.contact_id),
        kolon_adi: 'ad_soyad+telefon',
        mevcut_deger: `${k.ad_soyad} / ${k.telefon}`,
        onerilen_deger: null, // insan kararı — hangisi doğru firma insan belirler
        baglam_bilgisi: {
          ncst: k.ncst,
          musteri_unvani: unvanMap[k.ncst]||null,
          ayni_kisi_diger_firmalar: grup.filter(g=>g.contact_id!==k.contact_id).map(g=>({
            contact_id:g.contact_id, ncst:g.ncst, musteri_unvani:unvanMap[g.ncst]||null,
            ad_soyad:g.ad_soyad, telefon:g.telefon, email:g.email
          }))
        }
      });
    });
  }
  return bulgular;
}
