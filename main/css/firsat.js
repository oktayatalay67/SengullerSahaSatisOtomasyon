'use strict';
/* ===== PİPELİNE ===== */
async function loadPipeline(){
  document.getElementById('pipelineList').innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    if(Object.keys(myIdToName).length===0) await loadKcmMyIds();
    // Müşteri ekranından filtreli gelindiyse adım filtresini uygula
    if(ppAdimFilter){
      ppAdimSec=ppAdimFilter;
      ppAdimFilter=null;
      // Filtre butonunu aktive et - DOM hazır olduktan sonra
      setTimeout(()=>{
        document.querySelectorAll('#ppAdimFilters .chip-btn').forEach(b=>b.classList.remove('active'));
        const activeBtn=document.querySelector(`#ppAdimFilters [data-adim="${ppAdimSec}"]`);
        if(activeBtn) activeBtn.classList.add('active');
      },100);
    } else {
      // Mevcut ppAdimSec butonunu aktive et
      setTimeout(()=>{
        document.querySelectorAll('#ppAdimFilters .chip-btn').forEach(b=>{
          b.classList.toggle('active', b.dataset.adim===ppAdimSec||(ppAdimSec==='tumu'&&b.dataset.adim==='tumu'));
        });
      },100);
    }
    let q=sb.from('opportunities').select('*, customers(ncst,unvan)');
    // v30.17: KÇM→Takım→MY filtresi - çapraz ziyaret görünürlüğü dahil
    const _ppMyF=document.getElementById('ppMyFilter2')?.value||'';
    const _ppTakimF=document.getElementById('ppKcmTakimFilter')?.value||'';
    const _ppKcmF=document.getElementById('ppKcmFilter')?.value||'';
    if(_ppMyF&&!isNaN(parseInt(_ppMyF))){
      // MY seçili: o MY'nin girdiği VEYA o MY'nin müşterisine girilen fırsatlar
      const _mid=parseInt(_ppMyF);
      q=q.or(`my_id.eq.${_mid},musteri_my_id.eq.${_mid}`);
    } else if(_ppTakimF&&!isNaN(parseInt(_ppTakimF))){
      // Takım seçili: takımın girdiği + takım müşterilerine girilen
      const _takimLiderId=parseInt(_ppTakimF);
      const{data:_tm}=await sb.from('users').select('my_id').eq('takim_lideri_id',_takimLiderId).eq('aktif',true);
      const _ids=[...new Set([_takimLiderId,...(_tm||[]).map(u=>u.my_id)])];
      if(!_ids.length){ q=q.eq('my_id',-1); }
      else { q=q.or(`my_id.in.(${_ids.join(',')}),musteri_my_id.in.(${_ids.join(',')})`); }
    } else if(_ppKcmF&&!isNaN(parseInt(_ppKcmF))){
      // KÇM seçili: kayıt bu KÇM'e ait VEYA müşteri bu KÇM'in portföyünde
      const _kcmId=parseInt(_ppKcmF);
      const{data:_km}=await sb.from('users').select('my_id').eq('kcm_id',_kcmId).eq('aktif',true);
      const _kIds=(_km||[]).map(u=>u.my_id);
      if(_kIds.length) q=q.or(`kcm_id.eq.${_kcmId},musteri_my_id.in.(${_kIds.join(',')})`);
      else q=q.eq('kcm_id',_kcmId);
    } else {
      // Filtre yok → RBAC (applyRBAC da aynı OR mantığını kullanıyor)
      q=applyRBAC(q);
    }
    if(ppAdimSec&&ppAdimSec!=='tumu') q=q.eq('adim',ppAdimSec);
    const ppMusteriNcst=document.getElementById('ppMusteriNcst')?.value||'';
    if(ppMusteriNcst) q=q.eq('ncst',ppMusteriNcst);
    if(ppTimeFilter!=='tumu'){
      const now=new Date();let sd='',ed='';
      if(ppTimeFilter==='ay'){
        sd=now.toISOString().slice(0,7)+'-01';
        const lastDay=new Date(now.getFullYear(),now.getMonth()+1,0);
        ed=lastDay.toISOString().split('T')[0];
      }
      if(ppTimeFilter==='hafta'){
        const mon=new Date(now);mon.setDate(now.getDate()-(now.getDay()||7)+1);
        sd=mon.toISOString().split('T')[0];
        const sun=new Date(mon);sun.setDate(mon.getDate()+6);
        ed=sun.toISOString().split('T')[0];
      }
      if(ppTimeFilter==='bugun') sd=ed=now.toISOString().split('T')[0];
      if(ppTimeFilter==='tarih'){
        sd=document.getElementById('ppStartDate')?.value||'';
        ed=document.getElementById('ppEndDate')?.value||'';
      }
      // Kapanış tarihine göre filtrele
      if(sd) q=q.gte('tahmini_kapanis_tarihi',sd);
      if(ed) q=q.lte('tahmini_kapanis_tarihi',ed+'T23:59:59');
    }
    // Yeni adım filtresi - hem adim hem durum alanını kontrol et
    if(ppStatusFilter!=='tumu'){
      q=q.or(`adim.eq.${ppStatusFilter},durum.eq.${ppStatusFilter}`);
    }
    q=q.order('guncelleme_tarihi',{ascending:false,nullsFirst:false}).order('olusturma_tarihi',{ascending:false}).limit(200);
    const{data,error}=await q;
    if(error)throw error;
    const opps=data||[];
    // Pipeline müşteri my_id haritası
    const ppNcstList=[...new Set(opps.map(o=>o.ncst).filter(Boolean))];
    const ppCustMyMap={};
    if(ppNcstList.length>0){
      const{data:ppCusts}=await sb.from('customers').select('ncst,my_id').in('ncst',ppNcstList);
      (ppCusts||[]).forEach(c=>{ppCustMyMap[c.ncst]=c.my_id;});
    }
    // Özet - adim alanını öncelikli kullan, yoksa durum
    const getAdim=o=>o.adim||o.durum||'Fırsat';
    const cnt=a=>opps.filter(o=>getAdim(o)===a).length;
    document.getElementById('ppFirsat').textContent=cnt('Fırsat');
    document.getElementById('ppTeklif').textContent=cnt('Teklif');
    document.getElementById('ppBeyan').textContent=cnt('Beyan');
    document.getElementById('ppEvrak').textContent=cnt('Evrak');
    document.getElementById('ppGercek').textContent=cnt('Gerçekleşen');
    const toplam=opps.filter(o=>getAdim(o)!=='İptal').reduce((s,o)=>s+(o.beklenen_ciro||0),0);
    document.getElementById('ppToplam').textContent=fmtTL(toplam);
    if(opps.length===0){document.getElementById('pipelineList').innerHTML='<div class="empty">Fırsat bulunamadı.</div>';return;}
    document.getElementById('pipelineList').innerHTML=opps.map(o=>{
      const firmName=o.customers?.unvan||o.ncst;
      const adim=getAdim(o);
      const tagCls=OPP_ADIM_TAGS[adim]||'tag-gray';
      const borderClr={'Fırsat':'var(--blue)','Teklif':'var(--amber)','Beyan':'var(--purple)',
        'Evrak':'rgba(77,159,255,.5)','Gerçekleşen':'var(--green)','İptal':'var(--red)'}[adim]||'var(--border)';
      const myAd = myIdToName[ppCustMyMap[o.ncst]]||myIdToName[o.my_id]||'';
      return `<div class="pipeline-card" style="border-left:3px solid ${borderClr};cursor:pointer;" onclick="openEditOppModal(${o.opp_id})">
        <div class="pipeline-header">
          <div><div class="pipeline-firm">${escapeHTML(firmName)}</div>
        <div class="pipeline-meta">NCST: ${o.ncst} | Giriş: ${fmtDate(o.olusturma_tarihi)}${o.tahmini_kapanis_tarihi?' | Kapanış: '+o.tahmini_kapanis_tarihi:''}</div>
          </div>
          ${o.beklenen_ciro?`<div class="pipeline-amount">${fmtTL(o.beklenen_ciro)}</div>`:''}
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px;">📦 ${escapeHTML(o.urun_adi||'—')}</div>
        ${(()=>{
          // v30.20: musteri_my_id = kayıt anındaki portföy sahibi (değişmez, tarihi)
          // ppCustMyMap[ncst] = müşterinin güncel sahibi (değişebilir)
          const kayitSahibiId = o.musteri_my_id;
          const guncelSahibiId = ppCustMyMap[o.ncst];
          const girenId = o.my_id;
          const kayitSahibiAd = myIdToName[kayitSahibiId]||'';
          const guncelSahibiAd = myIdToName[guncelSahibiId]||'';
          const girenAd = myIdToName[girenId]||'';
          let html='';
          // Portföy sahibi satırı
          if(kayitSahibiId){
            html+=`<div style="font-size:11px;color:var(--text2);margin-bottom:2px;">👤 Portföy: ${escapeHTML(kayitSahibiAd||'#'+kayitSahibiId)}`;
            // Güncel sahip farklıysa göster
            if(guncelSahibiId&&guncelSahibiId!==kayitSahibiId){
              html+=` → <span style="color:var(--blue);">${escapeHTML(guncelSahibiAd||'#'+guncelSahibiId)}</span>`;
            }
            html+='</div>';
          } else if(guncelSahibiId){
            html+=`<div style="font-size:11px;color:var(--text2);margin-bottom:2px;">👤 Portföy: ${escapeHTML(guncelSahibiAd||'#'+guncelSahibiId)}</div>`;
          } else {
            html+=`<div style="font-size:11px;color:var(--amber);margin-bottom:2px;">⚠ Portföy atanmamış</div>`;
          }
          // Gireni ayrıca göster (portföy sahibinden farklıysa)
          if(girenId&&girenId!==kayitSahibiId&&girenId!==guncelSahibiId){
            html+=`<div style="font-size:11px;color:var(--text3);">✏ Giren: ${escapeHTML(girenAd||'#'+girenId)}</div>`;
          }
          return html;
        })()}
        ${o.tahmini_kapanis_tarihi?`<div style="font-size:11px;color:var(--text2);">🗓️ Kapanış: ${o.tahmini_kapanis_tarihi}</div>`:''}
        ${o.aciklama?`<div style="font-size:11px;color:var(--text3);margin-top:4px;">${escapeHTML(o.aciklama.substring(0,60))}</div>`:''}
        <div class="visit-tags mt-8" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span class="tag ${tagCls}">${adim}</span>
            ${o.olasilik?`<span class="tag tag-gray">%${o.olasilik}</span>`:''}
            ${o.users?`<span class="tag tag-gray">👤 ${escapeHTML(o.users.ad_soyad)}</span>`:''}
          </div>
          ${isAdmin()?`<button onclick="event.stopPropagation();deleteOpportunity(${o.opp_id})" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;">🗑</button>`:''}
        </div>
      </div>`;
    }).join('');
  }catch(err){console.error(err);document.getElementById('pipelineList').innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;}
}
let ppAdimSec='tumu', ppAdimFilter=null;
function setPpAdimSec(val,el){
  document.querySelectorAll('#ppAdimFilters .chip-btn').forEach(b=>b.classList.remove('active'));
  el?.classList.add('active');
  ppAdimSec=val;
  loadPipeline();
}
function setPpTimeFilter(val,el){ppTimeFilter=val;document.querySelectorAll('#ppTimeFilters .chip-btn').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');document.getElementById('ppDateRangeBox').classList.toggle('hide',val!=='tarih');loadPipeline();}
// togglePpStatus kaldırıldı - ppAdimFilters kullanılıyor

/* ===== YENİ / DÜZENLE FIRSAT MODAL ===== */
function openNewOppModal(prefillNcst=null){
  currentEditingOppId=null;
  oppSelectedNcst=prefillNcst;
  oppSelectedUnvan=null;
  oppSecilenKontakId=null;
  oppSecilenKontaklar=new Map(); // v30.30: çoklu kontak sıfırla
  if(prefillNcst) loadOppKontaklar(prefillNcst);
  else { const kDiv=document.getElementById('oppKontakDiv'); if(kDiv) kDiv.style.display='none'; }
  document.getElementById('oppModalTitle').textContent='💼 Yeni Fırsat';
  document.getElementById('oppCustField').classList.toggle('hide',!!prefillNcst);
  document.getElementById('oppCustSearch').value='';
  document.getElementById('oppCustResults').classList.remove('show');
  document.getElementById('oppSelectedCust').classList.add('hide');
  document.getElementById('oppKapanis').value='';
  document.getElementById('oppAciklama').value='';
  document.getElementById('oppMusteriOzetBox').classList.add('hide');
  const ei=document.getElementById('oppEditCustInfo');
  if(ei)ei.classList.add('hide');
  const logSec=document.getElementById('oppLogSection');
  if(logSec)logSec.classList.add('hide');
  const delBtnN=document.getElementById('oppDeleteBtn');
  if(delBtnN) delBtnN.style.display='none';
  oppSecilenKontakId=null;
  oppSecilenKontaklar=new Map(); // v30.30
  loadOppKontaklar(oppSelectedNcst||null);
  if(prefillNcst) loadOppMusteriOzet(prefillNcst);
  // Kaydet butonunu normal haline getir
  const saveBtn=document.getElementById('oppSaveBtn');
  if(saveBtn){saveBtn.onclick=saveOpp;saveBtn.textContent='💾 Kaydet';}
  // Ürün listesini sıfırla + boş satır ekle
  clearOppUrunRows();
  openModal('oppModal');
  setTimeout(()=>{addOppUrunRow();selectOppAdim('Fırsat');},100);
}
async function openEditOppModal(oppId){
  try{
    const{data:o,error}=await sb.from('opportunities').select('*').eq('opp_id',oppId).single();
    if(error||!o){toast('Fırsat bulunamadı: '+(error?.message||''),'error');return;}
    // Yetki kontrolü - MY KÇM'sindeki tüm kayıtları açabilir
    const _rOppEdit=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    if(_rOppEdit==='MY'||_rOppEdit==='FMY'||_rOppEdit==='USER'){
      // KÇM kontrolü - aynı KÇM'de mi
      if(currentUser.kcm_id && o.kcm_id && o.kcm_id!==currentUser.kcm_id){
        toast('Bu kaydı görmeye yetkiniz yok','error');return;
      }
    }
    currentEditingOppId=oppId;
    oppSelectedNcst=o.ncst;
    document.getElementById('oppModalTitle').textContent='✏️ Fırsatı Düzenle';
    document.getElementById('oppCustField').classList.add('hide');
    document.getElementById('oppMusteriOzetBox').classList.add('hide');
    // Müşteri adı
    let unvan=o.ncst||'—';
    if(o.ncst){
      const{data:cust}=await sb.from('customers').select('unvan').eq('ncst',o.ncst).maybeSingle();
      if(cust?.unvan) unvan=cust.unvan;
    }
    oppSelectedUnvan=unvan;
    const eiInfo=document.getElementById('oppEditCustInfo');
    if(eiInfo){eiInfo.textContent=unvan+' ('+o.ncst+')';eiInfo.classList.remove('hide');}
    // Ürün listesi - opportunity_products'tan çek
    const{data:prods}=await sb.from('opportunity_products').select('urun_adi,adet,tutar').eq('opp_id',oppId);
    clearOppUrunRows();
    if(prods?.length){
      prods.forEach(p=>addOppUrunRow(p.urun_adi||'', p.adet||1, p.tutar||''));
    } else {
      addOppUrunRow(o.urun_adi||'', 1, o.beklenen_ciro||'');
    }
    document.getElementById('oppKapanis').value=o.tahmini_kapanis_tarihi||'';
    // Adım - eski değerleri map et
    const adimMap={'Açık':'Fırsat','Teklif Verildi':'Teklif','Kazanıldı':'Gerçekleşen','Kaybedildi':'İptal'};
    const rawAdim=o.adim||o.durum||'Fırsat';
    const adim=adimMap[rawAdim]||rawAdim;
    // Madde 7+8: statü ve olasılık butonlarını set et
    setTimeout(()=>{
      selectOppAdim(adim);
      selectOppOlasilik(o.olasilik||OPP_ADIM_OLASILIK[adim]||10);
    },50);
    // Açıklama
    document.getElementById('oppAciklama').value=''; // Yeni not için boş - geçmiş timeline'da
    // Edit modunda müşteri bilgisi göster
    const editInfo=document.getElementById('oppEditCustInfo');
    if(editInfo){
      editInfo.textContent='🏢 '+unvan+(o.ncst?' — NCST: '+o.ncst:'');
      editInfo.classList.remove('hide');
    }
    // Log bölümünü yükle
    const logSec=document.getElementById('oppLogSection');
    if(logSec){
      logSec.classList.remove('hide');
      const logs=await loadLogs('opportunities',oppId);
      logSec.innerHTML=renderLogSection('opportunities',oppId,logs,'opp_'+oppId);
    }
    // v30.31: Kontak listesi yükle + retry ile seçili getir
    oppSecilenKontakId = null;
    oppSecilenKontaklar = new Map();
    await loadOppKontaklar(o.ncst);
    if(o.contact_id){
      // Retry: DOM'a yüklenince seç
      let att=0;
      const tryKontak=async ()=>{
        const cEl=document.getElementById('citem_'+o.contact_id);
        if(cEl){
          // Adını DB'den al
          const{data:cData}=await sb.from('contacts').select('ad_soyad').eq('contact_id',o.contact_id).single();
          toggleOppContact(o.contact_id, cData?.ad_soyad||'Kontak');
        } else if(att<8){ att++; setTimeout(tryKontak,250); }
      };
      setTimeout(tryKontak,200);
    }
    // Admin sil butonu
    const delBtn=document.getElementById('oppDeleteBtn');
    if(delBtn) delBtn.style.display=isAdmin()?'':'none';
    if(delBtn) delBtn.onclick=()=>deleteOpportunity(oppId);

    // Onay butonları - role göre göster
    const _rOpp=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    const evrakOnayDiv=document.getElementById('oppEvrakOnayDiv');
    const mudurOnayDiv=document.getElementById('oppMudurOnayDiv');
    const iptalOnayDiv=document.getElementById('oppIptalOnayDiv');
    const iptalBtn=document.getElementById('oppIptalBtn');

    // Evrak onay butonu - Satış Destek/Admin için, adım Evrak ise
    if(evrakOnayDiv){
      const showEvrak=['ADMIN','SATIŞ DESTEK','SATIŞ KOORDİNATÖRÜ'].includes(_rOpp) && o.adim==='Evrak';
      evrakOnayDiv.style.display=showEvrak?'':'none';
      const evrakBtn=document.getElementById('oppEvrakOnayBtn');
      if(evrakBtn) evrakBtn.onclick=()=>evrakOnayla(oppId);
    }

    // Müdür onay butonu - Müdür/Takım Lideri için, onay_durumu Müdür Onayı Bekleniyor ise
    if(mudurOnayDiv){
      const showMudur=['ADMIN','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ KOORDİNATÖRÜ'].includes(_rOpp)
        && o.onay_durumu==='Müdür Onayı Bekleniyor';
      mudurOnayDiv.style.display=showMudur?'':'none';
      if(showMudur){
        // Giren ve hesap sahibi bilgilerini göster
        const girenAd=myIdToName[o.my_id]||'Bilinmiyor';
        const sahibiAd=myIdToName[o.musteri_my_id]||'Bilinmiyor';
        const mudurInfo=document.getElementById('oppMudurOnayInfo');
        if(mudurInfo) mudurInfo.textContent='Giren: '+girenAd+' | Hesap Sahibi: '+sahibiAd;
        const btn1=document.getElementById('oppMudurOnayGiren');
        const btn2=document.getElementById('oppMudurOnaySahip');
        if(btn1){btn1.textContent=girenAd+' hedefine say'; btn1.onclick=()=>mudurOnayiVer(oppId,o.my_id);}
        if(btn2){btn2.textContent=sahibiAd+' hedefine say'; btn2.onclick=()=>mudurOnayiVer(oppId,o.musteri_my_id);}
      }
    }

    // İptal onay butonu - Müdür/Takım Lideri için
    if(iptalOnayDiv){
      const showIptal=['ADMIN','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ KOORDİNATÖRÜ'].includes(_rOpp)
        && o.iptal_onay_durumu==='Bekliyor';
      iptalOnayDiv.style.display=showIptal?'':'none';
      const iptalOnayBtn=document.getElementById('oppIptalOnayBtn');
      const iptalRedBtn=document.getElementById('oppIptalRedBtn');
      if(iptalOnayBtn) iptalOnayBtn.onclick=()=>iptalOnayla(oppId);
      if(iptalRedBtn) iptalRedBtn.onclick=()=>iptalReddet(oppId);
    }

    // İptal başlat butonu - herkes görebilir, Gerçekleşen/İptal değilse
    if(iptalBtn){
      const showIptalBtn = o.adim!=='İptal' && o.adim!=='Gerçekleşen' && o.iptal_onay_durumu!=='Bekliyor';
      iptalBtn.style.display=showIptalBtn?'':'none';
      iptalBtn.onclick=()=>iptalBaslat(oppId);
    }

    openModal('oppModal');
  }catch(err){
    console.error('openEditOppModal hata:',err);
    toast('Fırsat açılamadı: '+err.message,'error');
  }
}
let oppCustTimer;

function selectOppCust(ncst,unvan){
  oppSelectedNcst=ncst; oppSelectedUnvan=unvan;
  document.getElementById('oppCustSearch').value='';
  document.getElementById('oppCustResults').classList.remove('show');
  const nameEl=document.getElementById('oppSelectedCustName');
  if(nameEl) nameEl.textContent=unvan+' ('+ncst+')';
  document.getElementById('oppSelectedCust').classList.remove('hide');
  loadOppMusteriOzet(ncst);
  loadOppKontaklar(ncst);
}
async function saveOpp(context='modal'){
  // context: 'modal' = oppModal, 'form' = bağımsız fırsat formu

  // === Validasyon ===
  if(!oppSelectedNcst&&!currentEditingOppId){toast('Müşteri seçin','error');return;}
  // v30.31: Kontak her zaman zorunlu (yeni + edit)
  if(!oppSecilenKontakId){
    toast('Görüşülen kişiyi seçin — kontak seçimi zorunludur','error');return;
  }

  // v30.30 BUG-7: adim ÖNCE okunuyor, sonra validasyonda kullanılıyor
  const adim = document.getElementById('oppDurum').value;
  // Edit modunda yetki kontrolü
  if(currentEditingOppId){
    const _rSave=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    const myRoller=['MY','FMY','USER'];
    if(myRoller.includes(_rSave)){
      const{data:oppCheck}=await sb.from('opportunities').select('my_id,adim').eq('opp_id',currentEditingOppId).single();
      if(oppCheck&&oppCheck.my_id!==currentUser.my_id){
        toast('Sadece kendi girdiğiniz kayıtları düzenleyebilirsiniz','error');return;
      }
      if(adim==='Ger\u00e7ekle\u015fen'){
        toast('Evrak onayı için Satış Destek yetkisi gereklidir','error');return;
      }
    }
  }

  // === Ürün verisi ===
  const urunData = getOppUrunData();
  if(urunData.length===0){toast('En az bir ürün ekleyin','error');return;}

  // === Form değerleri ===
  const kapanis = document.getElementById('oppKapanis').value||null;
  const aciklama = document.getElementById('oppAciklama').value||null;
  const olasilik = parseInt(document.getElementById('oppOlasilikVal')?.value)||10;
  const ilkUrun = urunData[0];
  const toplamTutar = urunData.reduce((s,r)=>s+(r.tutar||0),0);

  // === Müşteri bilgileri (tek sorgu ile) ===
  // v30.19: kcm_id öncelik sırası: müşteri.kcm_id → müşteri.my_id'nin kcm_id'si → girenin kcm_id'si
  let oppKcmId = currentUser.kcm_id;
  let oppMusteriMyId = null;
  if(oppSelectedNcst){
    const{data:custInfo}=await sb.from('customers').select('kcm_id,my_id').eq('ncst',oppSelectedNcst).single();
    if(custInfo){
      oppMusteriMyId=custInfo.my_id||null;
      if(custInfo.kcm_id){
        oppKcmId=custInfo.kcm_id;
      } else if(custInfo.my_id){
        // Müşteride kcm_id yoksa, müşterinin MY'sinden al
        const{data:myInfo}=await sb.from('users').select('kcm_id').eq('my_id',custInfo.my_id).single();
        oppKcmId=myInfo?.kcm_id||currentUser.kcm_id||null;
      }
    }
  }

  // === Payload ===
  const payload={
    urun_adi:ilkUrun.urun,
    guncelleme_tarihi:new Date().toISOString(),
    beklenen_ciro:toplamTutar||null,
    tahmini_kapanis_tarihi:kapanis,
    durum:adim, adim, aciklama, olasilik,
    my_id:currentUser.my_id,
    kcm_id:oppKcmId,
    musteri_my_id:oppMusteriMyId,
    contact_id:oppSecilenKontakId||null,
    onay_durumu:null
  };

  // === DB İşlemi ===
  let error, oppId=currentEditingOppId;
  if(currentEditingOppId){
    const res=await sb.from('opportunities').update(payload).eq('opp_id',currentEditingOppId);
    error=res.error;
  } else {
    const res=await sb.from('opportunities').insert({...payload,ncst:oppSelectedNcst}).select();
    error=res.error;
    if(!error&&res.data?.length) oppId=res.data[0].opp_id;
  }
  if(error){toast('Kayıt hatası: '+error.message,'error');return;}

  // === Ürünler ===
  if(oppId){
    await sb.from('opportunity_products').delete().eq('opp_id',oppId);
    const prodInserts=urunData.map(r=>({opp_id:oppId,urun_adi:r.urun,adet:r.adet,tutar:r.tutar||null}));
    if(prodInserts.length) await sb.from('opportunity_products').insert(prodInserts);
  }

  // === Adım değişim tetikleyicisi ===
  if(currentEditingOppId){
    const{data:old}=await sb.from('opportunities').select('adim,durum,my_id,tahmini_kapanis_tarihi,urun_adi').eq('opp_id',currentEditingOppId).maybeSingle();
    const eskiAdim=old?.adim||old?.durum||'F\u0131rsat';
    if(eskiAdim!==adim){
      const devamEt=await processOppAdimChange(
        currentEditingOppId,adim,
        old?.my_id||currentUser.my_id,
        old?.tahmini_kapanis_tarihi||kapanis,
        old?.urun_adi||ilkUrun.urun,
        eskiAdim
      );
      if(!devamEt){closeModal('oppModal');return;}
    }
  }

  // === Log ===
  const logAksiyon=currentEditingOppId?'G\u00fcncellendi':'Olu\u015fturuldu';
  const logDetay=adim+(urunData.length>0?' | '+urunData.map(u=>u.urun).join(', '):'');
  if(oppId) await addLog('opportunities',oppId,logAksiyon,logDetay);
  if(oppId&&aciklama) await addLog('opportunities',oppId,'Not',aciklama);

  toast(currentEditingOppId?'F\u0131rsat g\u00fcncellendi':'F\u0131rsat eklendi \u2705','success');

  // Açıklama alanını sonraki açılış için temizle
  const aciklamaEl2 = document.getElementById('oppAciklama');
  if(aciklamaEl2) aciklamaEl2.value='';

  // === Sonuç — context'e göre ===
  if(context==='form'){
    navHistory=[];
    showPage('pagePipeline');
    loadPipeline();
  } else {
    closeModal('oppModal');
    if(document.getElementById('pagePipeline')?.classList.contains('active')) loadPipeline();
    if(selectedMusteri&&document.getElementById('pageMusteri')?.classList.contains('active')) loadMusteriFirsatlar(selectedMusteri.ncst);
  }
}

async function saveFirsatForm(){
  // Bağımsız fırsat formu — state'i oppModal state'ine kopyalayıp saveOpp çağırır
  if(!firsatSelectedMusteri){toast('M\u00fc\u015fteri se\u00e7in','error');return;}
  if(firsatSecilenKontaklar.size===0){toast('En az bir ki\u015fi se\u00e7in','error');return;}
  // firsatUrunListesi → oppUrunListesi'ne kopyala
  const firsatUrunData=getFirsatUrunData();
  if(!firsatUrunData.length){toast('En az bir \u00fcr\u00fcn ekleyin','error');return;}
  // oppModal state'ini doldur
  oppSelectedNcst=firsatSelectedMusteri.ncst;
  oppSelectedUnvan=firsatSelectedMusteri.unvan||'';
  oppSecilenKontakId=Array.from(firsatSecilenKontaklar.keys())[0]||null;
  currentEditingOppId=null;
  // oppUrunListesi'ni fırsat ürünleriyle doldur
  clearOppUrunRows();
  firsatUrunData.forEach(r=>addOppUrunRow(r.urun,r.adet,r.tutar));
  // Adım ve olasılık
  document.getElementById('oppDurum').value=firsatSelectedAdim||'F\u0131rsat';
  const olasilikEl=document.getElementById('oppOlasilikVal');
  if(olasilikEl) olasilikEl.value=document.getElementById('firsatOlasilik')?.value||10;
  // Not ve tarih
  const aciklamaEl=document.getElementById('oppAciklama');
  if(aciklamaEl) aciklamaEl.value=document.getElementById('firsatAciklama')?.value||'';
  const kapanisEl=document.getElementById('oppKapanis');
  if(kapanisEl) kapanisEl.value=document.getElementById('firsatKapanis')?.value||'';
  // saveOpp'u form context'i ile çağır
  await saveOpp('form');
}

/* ===== PİPELİNE RAPORU ===== */
function setPrPeriod(val,el){
  document.querySelectorAll('#pagePipelineRapor .chip-btn').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');
  const now=new Date();
  if(val==='bugun'){document.getElementById('prStartDate').value=now.toISOString().split('T')[0];document.getElementById('prEndDate').value=now.toISOString().split('T')[0];}
  if(val==='hafta'){const mon=new Date(now);mon.setDate(now.getDate()-(now.getDay()||7)+1);document.getElementById('prStartDate').value=mon.toISOString().split('T')[0];document.getElementById('prEndDate').value=now.toISOString().split('T')[0];}
  if(val==='ay'){document.getElementById('prStartDate').value=now.toISOString().slice(0,7)+'-01';document.getElementById('prEndDate').value=now.toISOString().split('T')[0];}
}
let prAdimSec='tumu';
function setPrAdim(val,el){
  prAdimSec=val;
  document.querySelectorAll('#prAdimFilters .chip-btn').forEach(b=>b.classList.remove('active'));
  el?.classList.add('active');
  fetchPipelineReport();
}

async function initPipelineRapor(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const full=['ADMIN','SATIŞ KOORDİNATÖRÜ','KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ','SATIŞ DESTEK','TAKIM LİDERİ'];
  const myRoller=['MY','FMY','USER'];

  // KÇM filtresi - sadece admin/koordinatör (birden fazla KÇM görebilen)
  const kcmDiv=document.getElementById('prKcmFilterDiv');
  if(kcmDiv){
    if(full.includes(r)){
      kcmDiv.style.display='';
      const kcmSel=document.getElementById('prKcmFilter');
      if(kcmSel&&kcmSel.options.length<=1){
        const{data:kcmler}=await sb.from('kcm_groups').select('*').order('kcm_id');
        (kcmler||[]).forEach(k=>{const o=document.createElement('option');o.value=k.kcm_id;o.textContent=k.kcm_adi;kcmSel.appendChild(o);});
      }
    } else {
      kcmDiv.style.display='none';
    }
  }

  // Takım Lideri filtresi - MY hariç herkes görür
  const takimDiv=document.getElementById('prTakimFilterDiv');
  if(takimDiv){
    if(!myRoller.includes(r)){
      takimDiv.style.display='';
      const takimSel=document.getElementById('prTakimFilter');
      if(takimSel&&takimSel.options.length<=1){
        let takimQ=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
        if(!full.includes(r)&&currentUser.kcm_id) takimQ=takimQ.eq('kcm_id',currentUser.kcm_id);
        const{data:takimler}=await takimQ.order('ad_soyad');
        (takimler||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
      }
    } else {
      takimDiv.style.display='none';
    }
  }

  // MY filtresi - MY hariç herkes görür
  const myDiv=document.getElementById('prMyFilterDiv');
  if(myDiv){
    if(!myRoller.includes(r)){
      myDiv.style.display='';
      const mySel=document.getElementById('prMyFilter');
      if(mySel&&mySel.options.length<=1){
        let myQ=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
        if(!full.includes(r)&&currentUser.kcm_id) myQ=myQ.eq('kcm_id',currentUser.kcm_id);
        const{data:myler}=await myQ.order('ad_soyad');
        (myler||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
      }
    } else {
      myDiv.style.display='none';
    }
  }
}

async function fetchPipelineReport(){
  const c=document.getElementById('prContent');
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const sd=document.getElementById('prStartDate').value;
  const ed=document.getElementById('prEndDate').value;
  const kcmFilter=document.getElementById('prKcmFilter')?.value||'';
  const takimFilter=document.getElementById('prTakimFilter')?.value||'';
  const myFilter=document.getElementById('prMyFilter')?.value||'';
  const musteriNcst=document.getElementById('prMusteriNcst')?.value||'';
  try{
    let q=sb.from('opportunities').select('*, customers(ncst,unvan), users(ad_soyad), opportunity_products(urun_adi,adet,tutar)');
    q=applyRBAC(q);
    if(sd)q=q.gte('olusturma_tarihi',trStartOfDay(sd));
    if(ed)q=q.lte('olusturma_tarihi',trEndOfDay(ed));
    if(kcmFilter) q=q.eq('kcm_id',parseInt(kcmFilter));
    if(takimFilter) q=q.in('my_id', await getTakimMyIds(parseInt(takimFilter)));
    if(myFilter) q=q.eq('my_id',parseInt(myFilter));
    if(musteriNcst) q=q.eq('ncst',musteriNcst);
    if(prAdimSec&&prAdimSec!=='tumu') q=q.eq('adim',prAdimSec);
    const{data:oppsRaw,error}=await q.order('guncelleme_tarihi',{ascending:false,nullsFirst:false}).order('olusturma_tarihi',{ascending:false}).limit(500);
    if(error)throw error;
    const opps=oppsRaw||[];
    // Excel için sakla
    window._lastPrData=opps.map(o=>{
      const kcmId=o.kcm_id;
      const prods=(o.opportunity_products||[]).map(p=>p.urun_adi+(p.adet?' x'+p.adet:'')).join(', ');
      return [o.kcm_id||'',o.users?.ad_soyad||'',o.customers?.unvan||o.ncst||'',o.ncst||'',
        o.adim||'',o.beklenen_ciro||'',prods,o.aciklama||'',o.olusturma_tarihi?.slice(0,10)||''];
    });
    document.getElementById('prExcelBtn')?.classList.remove('hide');
const getAdim=o=>o.adim||o.durum||'Fırsat';
    const cntAdim=a=>opps.filter(o=>getAdim(o)===a).length;
    const pipeline=opps.filter(o=>!['Gerçekleşen','İptal'].includes(getAdim(o))).reduce((s,o)=>s+(o.beklenen_ciro||0),0);
    const toplam=opps.reduce((s,o)=>s+(o.beklenen_ciro||0),0);
    document.getElementById('prFirsat').textContent=cntAdim('Fırsat');
    document.getElementById('prTeklif').textContent=cntAdim('Teklif');
    document.getElementById('prBeyan').textContent=cntAdim('Beyan');
    document.getElementById('prEvrak').textContent=cntAdim('Evrak');
    document.getElementById('prGerceklesen').textContent=cntAdim('Gerçekleşen');
    document.getElementById('prPipeline').textContent=fmtTL(pipeline);
    document.getElementById('prToplam').textContent=fmtTL(toplam);
    document.getElementById('prSummary').classList.remove('hide');
    if(opps.length===0){c.innerHTML='<div class="empty">Kayıt bulunamadı.</div>';return;}
    // Kişi bazlı grupla
    const byUser={};
    opps.forEach(o=>{const uid=o.my_id;const uname=o.users?.ad_soyad||'Bilinmiyor';if(!byUser[uid])byUser[uid]={name:uname,opps:[],total:0};byUser[uid].opps.push(o);byUser[uid].total+=(o.beklenen_ciro||0);});
    c.innerHTML=Object.values(byUser).map(u=>`
      <div class="form-section">
        <div class="form-section-title">👤 ${escapeHTML(u.name)} — ${u.opps.length} Fırsat | ${fmtTL(u.total)}</div>
        ${u.opps.map(o=>{
          const firmName=o.customers?.unvan||o.ncst;
          const tagClass={'Açık':'tag-blue','Teklif Verildi':'tag-amber','Kazanıldı':'tag-green','Kaybedildi':'tag-red'}[o.durum]||'tag-gray';
          const prods=o.opportunity_products?.map(p=>`${p.urun_adi} × ${p.adet}${p.tutar?' = '+fmtTL(p.tutar):''}`).join(' | ')||'';
          return `<div class="visit-card" style="margin-bottom:7px;">
            <div class="pipeline-header">
              <div><div class="visit-firm">${escapeHTML(firmName)}</div><div style="font-size:11px;color:var(--text2);">NCST: ${o.ncst} | ${fmtDate(o.olusturma_tarihi)}</div></div>
              ${o.beklenen_ciro?`<div style="font-size:14px;font-weight:800;color:var(--green);">${fmtTL(o.beklenen_ciro)}</div>`:''}
            </div>
            <div style="font-size:12px;font-weight:700;">📦 ${escapeHTML(o.urun_adi||'—')}</div>
            ${prods?`<div style="font-size:11px;color:var(--text2);margin-top:3px;">${escapeHTML(prods)}</div>`:''}
            ${o.tahmini_kapanis_tarihi?`<div style="font-size:11px;color:var(--amber);margin-top:3px;">🗓️ Kapanış: ${o.tahmini_kapanis_tarihi}</div>`:''}
            <div class="visit-tags mt-8"><span class="tag ${tagClass}">${o.durum}</span></div>
          </div>`;
        }).join('')}
      </div>
    `).join('');
  }catch(err){console.error(err);c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${escapeHTML(err.message)}</div>`;}
}

