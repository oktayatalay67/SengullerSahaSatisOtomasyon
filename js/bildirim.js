// ============================================================
// bildirim.js — v1.0.0 (V31.168)
// Son guncelleme: 05.10.2026
//
// AMAC: Uygulamanin TEK bildirim gonderme noktasi. Baska hicbir is yapmaz.
//
// NEDEN AYRI DOSYA (bkz. CALISMA-KURALLARI Bolum 12):
//   Bu fonksiyon onceden donanim.js icindeydi ve auth.js oradan cagiriyordu.
//   Yani e-posta altyapisi bir OZELLIK modulunun icinde duruyordu; kodu okuyan
//   "parola e-postasi nerede gonderiliyor" sorusunu donanim modulunde aramaz.
//   arama.js ise ayni istegi kendi icinde ikinci kez yazmisti. Uc kopya bire
//   indirildi.
//
// KANAL BURADA SECILMEZ. Bu dosya "su kisilere su bildirimi gonder" der;
// e-postayla mi WhatsApp'la mi gittigini SUNUCU belirler. Boylece WhatsApp'a
// gecildiginde tarayici tarafinda hicbir dosya degismez, yalnizca sunucudaki
// bildirim modulu degisir.
//
// SONRAKI ADIM (planlanan): govde {sablon, hedef} bicimine donecek; alici ve
// metin sunucuda uretilecek. WhatsApp Business API 24 saat disinda yalnizca
// ONAYLI SABLON gonderilmesine izin verdigi icin bu zorunlu.
//
// YUKLEME SIRASI: index.html'de config.js'ten hemen sonra, kendisini cagiran
// donanim.js / auth.js / arama.js dosyalarindan ONCE yuklenir.
// `typeof bildirimGonder === 'function'` gibi koruma KULLANILMAZ — fonksiyon
// yoksa kod patlamali, sessizce gecmemeli.
// ============================================================
'use strict';

// Sunucu tarafi uc nokta (_worker.js). Kanal secimi orada yapilir.
const BILDIRIM_UC = '/api/send-mail';

/**
 * Bildirim gonderir. BEST-EFFORT: basarisiz olursa konsola yazar, cagiran
 * akisi ASLA durdurmaz.
 *
 * @param {string|string[]} alicilar         Bir veya daha fazla adres
 * @param {string}          konu             Bildirim basligi
 * @param {string}          metin            Duz metin govde
 * @param {string}          [html]           HTML govde (varsa)
 * @param {string}          [gonderenAnahtari] Sunucudaki gonderen listesinden
 *                          secim yapar ('sifre' | 'donanim'). Verilmezse
 *                          sunucu varsayilani kullanir.
 * @returns {Promise<boolean>} gonderildi mi
 */
async function bildirimGonder(alicilar, konu, metin, html, gonderenAnahtari){
  const hedefler = (Array.isArray(alicilar) ? alicilar : [alicilar]).filter(Boolean);
  if(!hedefler.length){
    // Eskiden bu durumda sunucuya bos istek gidip 400 donuyordu. Burada kesiyoruz.
    console.error('[bildirim] alici yok, gonderilmedi:', konu);
    return false;
  }
  try{
    const resp = await fetch(BILDIRIM_UC, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        to: hedefler,
        subject: konu,
        text: metin || '',
        html: html || undefined,
        fromKey: gonderenAnahtari
      })
    });
    if(!resp.ok){
      const raw = await resp.text().catch(()=>String(resp.status));
      console.error('[bildirim] gonderilemedi:', resp.status, raw);
      return false;
    }
    return true;
  }catch(err){
    console.error('[bildirim] gonderim hatasi:', (err && err.message) ? err.message : err);
    return false;
  }
}
