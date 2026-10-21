// ============================================================
// gorev_tamamla.js — v1.0.0
// Son güncelleme: 2026-10-21
// Değişiklikler:
//   v1.0.0 — (V31.201) "Görevi Tamamla" penceresi. Listedeki "Tamamla" ve detaydaki
//     "Tamamlandı" butonları ARTIK Temas/ziyaret planlama formunu AÇMAZ ve ziyaret
//     kaydı oluşturmaz. Görev tipinin soru/sonuç alanı yoksa görev doğrudan tamamlanır;
//     varsa o alanlar (önceki cevaplar dolu) küçük bir pencerede gösterilir, zorunlu
//     alanlar denetlenir ve "Tamamla" cevapları kaydedip görevi kapatır.
//     Alan çizimi ve kaydetme temas.js'teki mevcut motoru kullanır (_gorevAlanCiz,
//     _gorevFormDegerleriYansit, saveGorevSonuclari) — yeni mantık yok. Şikayet kuralı
//     aynen geçerli (kapanış "Çözüldü" değilse görev Devam'da açık kalır).
//     Fırsat gerektiren tiplerde (Satış Gücü Fırsatı, Müşteri Potansiyeli) pencerede
//     "Fırsat Ekle" butonu çıkar; fırsat girilmeden "olumlu/satış" sonucu kaydedilemez.
//     gorev.js ve temas.js'ten sonra yüklenir (çağrılar çalışma anında çözülür).
// ============================================================

var _gtTask = null;           // {task_id, ncst, unvan, type_id, bagli_form, visit_id, my_id, kcm_id}
var _gtKaydediliyor = false;

function _gtTemizle() {
  // temas.js'in görev bloğunu ve durumunu sıfırla: aynı id'li alanlar çift çizilmesin
  hideGorevBloklar();
  ['gorevDinamikSoruAlani', 'gorevDinamikSonucAlani'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  const n = document.getElementById('gorevDinamikNot');
  if (n) n.value = '';
  tmsEklenmisFirsatList = [];
}

async function _gtDirektTamamla(taskId) {
  const simdi = new Date().toISOString();
  const { error } = await sb.from('tasks')
    .update({ durum: 'Tamamlandı', tamamlanma_tarihi: simdi, guncelleme_tarihi: simdi })
    .eq('task_id', taskId);
  if (error) { toast('Hata: ' + error.message, 'error'); return; }
  await sb.from('task_logs').insert({
    task_id: taskId, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad,
    aksiyon: 'Tamamlandı', detay: 'Durum güncellendi: Tamamlandı'
  });
  toast('Görev tamamlandı', 'success');
  await loadGorevler();
}

async function gorevTamamlaPencereAc(taskId) {
  const { data: task, error } = await sb.from('tasks')
    .select('task_id,baslik,type_id,ncst,visit_id,cevaplar,sonuc_detaylari,sonuc_notu,task_types(bagli_form,soru_seti,sonuc_seti,ziyaret_amaci)')
    .eq('task_id', taskId).maybeSingle();
  if (error || !task) { toast('Görev okunamadı', 'error'); return; }

  const tip = task.task_types || {};
  const soruSeti = tip.soru_seti || [];
  const sonucSeti = tip.sonuc_seti || [];
  if (!soruSeti.length && !sonucSeti.length) { await _gtDirektTamamla(taskId); return; }

  _gtTemizle();

  // Müşteri bilgisi (başlık, fırsat için kcm/sahip)
  let cust = null;
  if (task.ncst) {
    const r = await sb.from('customers').select('unvan,my_id,kcm_id').eq('ncst', task.ncst).maybeSingle();
    cust = r.data || null;
  }
  _gtTask = {
    task_id: taskId, ncst: task.ncst || null, unvan: cust ? cust.unvan : '',
    type_id: task.type_id, bagli_form: tip.bagli_form || null, visit_id: task.visit_id || null,
    my_id: cust ? cust.my_id : null, kcm_id: cust ? cust.kcm_id : null
  };

  // temas.js motorunun durumunu bu görev için kur (loadGorevBlogu ile aynı)
  _gorevBagliForm = _gtTask.bagli_form;
  window._gorevBagliForm = _gtTask.bagli_form;
  _gorevAktifTask = { task_id: taskId, type_id: task.type_id, soru_seti: soruSeti, sonuc_seti: sonucSeti, ncst: task.ncst };
  const mevcutCevaplar = task.cevaplar || {};
  const mevcutSonuc = task.sonuc_detaylari || {};
  _gorevAlanDeger = Object.assign({}, _gorevValueObjFromSchema(soruSeti, mevcutCevaplar), _gorevValueObjFromSchema(sonucSeti, mevcutSonuc));

  const custAlanlari = soruSeti.concat(sonucSeti).filter(function (f) { return f.hedef_tablo === 'customers' && mevcutCevaplar[f.anahtar] === undefined; });
  if (custAlanlari.length && task.ncst) {
    const r2 = await sb.from('customers').select(custAlanlari.map(function (f) { return f.hedef_kolon; }).join(',')).eq('ncst', task.ncst).maybeSingle();
    if (r2.data) custAlanlari.forEach(function (f) { if (r2.data[f.hedef_kolon] != null) _gorevAlanDeger[f.anahtar] = r2.data[f.hedef_kolon]; });
  }
  _gorevAlanEski = Object.assign({}, _gorevAlanDeger, { __not__: task.sonuc_notu || null });

  // Pencereyi çiz
  document.getElementById('gtBaslik').textContent = tip.ziyaret_amaci || 'Görevi Tamamla';
  document.getElementById('gtBilgi').innerHTML =
    '<div style="font-weight:700;">' + escapeHTML(task.baslik || '') + '</div>' +
    (_gtTask.unvan ? '<div style="color:var(--text2);margin-top:2px;">🏢 ' + escapeHTML(_gtTask.unvan) + '</div>' : '');
  const soruEl = document.getElementById('gtSoruAlani');
  const sonucEl = document.getElementById('gtSonucAlani');
  soruEl.innerHTML = ''; sonucEl.innerHTML = '';
  for (const f of soruSeti) await _gorevAlanCiz(f, soruEl);
  for (const f of sonucSeti) await _gorevAlanCiz(f, sonucEl);
  document.getElementById('gtNot').value = task.sonuc_notu || '';
  _gorevFormDegerleriYansit(soruSeti);
  _gorevFormDegerleriYansit(sonucSeti);

  // Fırsat bölümü: sadece fırsat tetikleyicili tiplerde
  const firsatBlok = document.getElementById('gtFirsatBlok');
  firsatBlok.style.display = (_GOREV_FIRSAT_TETIKLEYICI[task.type_id] && task.ncst) ? '' : 'none';
  _gtFirsatListeCiz();

  const btn = document.getElementById('gtKaydetBtn');
  if (btn) { btn.disabled = false; btn.textContent = '✓ Tamamla'; }
  _gtKaydediliyor = false;
  openModal('gorevTamamlaModal');
}

function gtKapat() {
  closeModal('gorevTamamlaModal');
  _gtTask = null;
  _gtTemizle();
}

// ---------- Fırsat (temas.js'in fırsat penceresi ve listesi yeniden kullanılır) ----------
function gtFirsatAc() {
  if (!_gtTask || !_gtTask.ncst) return;
  currentEditingOppId = null;
  oppSelectedNcst = _gtTask.ncst;
  oppSelectedUnvan = _gtTask.unvan || null;
  document.getElementById('oppModalTitle').textContent = '💼 Yeni Fırsat Ekle';
  document.getElementById('oppCustField').classList.add('hide');
  document.getElementById('oppEditCustInfo').textContent = _gtTask.unvan || '';
  document.getElementById('oppEditCustInfo').classList.remove('hide');
  document.getElementById('oppMusteriOzetBox').classList.add('hide');
  document.getElementById('oppAciklama').value = '';
  document.getElementById('oppKapanis').value = '';
  clearOppUrunRows();
  setTimeout(function () {
    addOppUrunRow();
    selectOppAdim('Fırsat');
    document.getElementById('oppSaveBtn').onclick = gtFirsatKaydet;
    document.getElementById('oppSaveBtn').textContent = '➕ Fırsatı Göreve Ekle';
  }, 50);
  openModal('oppModal');
}

function gtFirsatKaydet() {
  const onceki = tmsEklenmisFirsatList.length;
  saveOppToTemas(); // doğrular, listeye ekler, pencereyi kapatır, kaydet düğmesini geri alır
  if (tmsEklenmisFirsatList.length > onceki) _gtFirsatListeCiz();
}

function gtFirsatSil(i) {
  tmsEklenmisFirsatList.splice(i, 1);
  _gtFirsatListeCiz();
}

function _gtFirsatListeCiz() {
  const el = document.getElementById('gtFirsatListe');
  if (!el) return;
  el.innerHTML = tmsEklenmisFirsatList.map(function (f, i) {
    return '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">' +
      '<div style="flex:1;"><div style="font-size:13px;font-weight:700;">' + escapeHTML(f.urun) + '</div>' +
      '<div style="font-size:11px;color:var(--text2);">' + f.adim + ' · %' + f.olasilik + (f.tutar ? ' · ' + fmtTL(f.tutar) : '') + (f.adet > 1 ? ' · ' + f.adet + ' adet' : '') + '</div></div>' +
      '<button onclick="gtFirsatSil(' + i + ')" style="background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;">✕</button></div>';
  }).join('');
}

// ---------- Kaydet ----------
async function gtKaydet() {
  if (_gtKaydediliyor || !_gtTask) return;
  _gtKaydediliyor = true;
  const btn = document.getElementById('gtKaydetBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }
  const t = _gtTask;
  let basarili = false;
  try {
    // saveGorevSonuclari notu temas formundaki alandan okur — pencere notunu oraya aktar
    const notEl = document.getElementById('gorevDinamikNot');
    if (notEl) notEl.value = document.getElementById('gtNot').value || '';

    const ok = await saveGorevSonuclari(null, t.task_id, t.ncst, false);
    if (!ok) return; // zorunlu alan / fırsat uyarısı toast ile gösterildi, pencere açık kalır

    // Fırsatlar (temas.js saveTemas ile aynı alanlar)
    if (tmsEklenmisFirsatList.length && t.ncst) {
      let kcmId = t.kcm_id || null;
      if (!kcmId && t.my_id && Number.isInteger(t.my_id)) {
        try { const r = await sb.from('users').select('kcm_id').eq('my_id', t.my_id).maybeSingle(); kcmId = (r.data && r.data.kcm_id) || null; } catch (e) { /* yut */ }
      }
      if (!kcmId) kcmId = currentUser.kcm_id || null;
      const kaynak = t.bagli_form === 'firsat' ? 'GörevSGF' : (t.bagli_form === 'potansiyel' ? 'GörevPotansiyel' : null);
      for (const f of tmsEklenmisFirsatList) {
        const { data: oppData, error: oErr } = await sb.from('opportunities').insert({
          ncst: t.ncst, my_id: currentUser.my_id, visit_id: t.visit_id || null,
          kcm_id: kcmId, musteri_my_id: t.my_id || null,
          urun_adi: f.urun, beklenen_ciro: f.tutar || null,
          tahmini_kapanis_tarihi: f.kapanis || null, olasilik: f.olasilik || 10,
          durum: f.adim || 'Fırsat', adim: f.adim || 'Fırsat',
          aciklama: f.aciklama || null, kaynak: kaynak
        }).select();
        if (oErr) { toast('Fırsat kaydedilemedi: ' + oErr.message, 'error'); continue; }
        if (oppData && oppData.length) {
          await sb.from('opportunity_products').insert({ opp_id: oppData[0].opp_id, urun_adi: f.urun, adet: f.adet || 1, tutar: f.tutar || null });
          await addLog('opportunities', oppData[0].opp_id, 'Oluşturuldu', (f.adim || 'Fırsat') + (f.urun ? ' | ' + f.urun : ''));
          if (f.aciklama) await addLog('opportunities', oppData[0].opp_id, 'Not', f.aciklama);
        }
      }
    }

    const { data: g } = await sb.from('tasks').select('durum').eq('task_id', t.task_id).maybeSingle();
    const durum = (g && g.durum) || 'Tamamlandı';
    await sb.from('task_logs').insert({
      task_id: t.task_id, user_id: currentUser.my_id, user_ad: currentUser.ad_soyad,
      aksiyon: durum, detay: 'Görevi Tamamla penceresinden: ' + durum
    });
    basarili = true;
    gtKapat();
    toast(durum === 'Tamamlandı' ? 'Görev tamamlandı' : 'Kaydedildi — görev açık kalır (' + durum + ')', durum === 'Tamamlandı' ? 'success' : 'info');
    await loadGorevler();
  } catch (e) {
    toast('Hata: ' + (e && e.message ? e.message : e), 'error');
  } finally {
    _gtKaydediliyor = false;
    if (!basarili && btn) { btn.disabled = false; btn.textContent = '✓ Tamamla'; }
  }
}

console.log('Görev tamamla modülü yüklendi ✓');
