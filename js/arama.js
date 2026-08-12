// ============================================================
// arama.js — v1.0.1
//   v1.0.1 (V31.14): 3b-1 Ara anket modali (asama asama) + arama_sonuclari kaydi
//     + gorev durumu (Tamamlandi/Tekrar Aranacak/Ulasilamiyor) + telefon bazli deneme
//     kurali + 'Musteri Bilgileri Guncelleme' gorevi (yanlis numara / tekrar ulasilamadi).
// MEMNUNİYET ARAMA (Agent) — Adım 3a
//   • Ziyaret Teyit Araması görev listesi (deadline<=bugün, Aranacak/Tekrar Aranacak)
//   • 7 gün (parametrik) SLA anlık otomatik kapama ("Arama Yapılmadı")
//   • Aramadan Kapat (sebepli) → arama_sonuclari kaydı
//   • Ara (anket) 3b'de gelecek — şimdilik placeholder
//   Yetki: arama_agent
// ============================================================
'use strict';

const ARAMA = { teyitTypeId:null, tasks:[] };

async function _aramaTeyitTypeId(){
  if(ARAMA.teyitTypeId) return ARAMA.teyitTypeId;
  const {data}=await sb.from('task_types').select('type_id').eq('tip_adi','Ziyaret Teyit Araması').maybeSingle();
  ARAMA.teyitTypeId = data?.type_id || null;
  return ARAMA.teyitTypeId;
}
async function _aramaSlaGun(){
  try{
    const {data}=await sb.from('sistem_ayarlari').select('deger').eq('ayar_tipi','arama_sla_gun').eq('aktif',true).maybeSingle();
    const n=parseInt(data?.deger); return (n&&n>0)?n:7;
  }catch(e){ return 7; }
}

async function initAramaEkrani(){
  const listEl=document.getElementById('aramaListesi');
  if(listEl) listEl.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const typeId=await _aramaTeyitTypeId();
  if(!typeId){ if(listEl) listEl.innerHTML='<div class="empty">Arama görev tipi bulunamadı.</div>'; return; }
  await _aramaSlaOtomatikKapat(typeId);   // 7 gün SLA (anlık)
  await loadAramaListesi(typeId);
}

// SLA: deadline'ı N (parametrik, vars. 7) günden fazla geçmiş ve hâlâ Aranacak/Tekrar
// Aranacak görevleri "Arama Yapılmadı" olarak kapatır (anlık — ekran açılışında).
async function _aramaSlaOtomatikKapat(typeId){
  try{
    const sla=await _aramaSlaGun();
    const sinir=new Date(); sinir.setDate(sinir.getDate()-sla);
    const sinirStr=sinir.toISOString().slice(0,10);
    const {data:eskiler}=await sb.from('tasks').select('task_id,ncst,visit_id')
      .eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak'])
      .lt('deadline',sinirStr);
    if(!eskiler || !eskiler.length) return;
    for(const t of eskiler){
      await sb.from('tasks').update({durum:'Arama Yapılmadı', tamamlanma_tarihi:new Date().toISOString(), guncelleme_tarihi:new Date().toISOString()}).eq('task_id',t.task_id);
      await sb.from('arama_sonuclari').insert({
        task_id:t.task_id, visit_id:t.visit_id, ncst:t.ncst, agent_id:currentUser.my_id,
        ulasildi:false, ulasilamama_neden:'Arama Yapılmadı (SLA '+sla+' gün)', agent_notu:'Otomatik SLA kapanışı'
      });
    }
    toast(eskiler.length+' arama SLA ile kapatıldı','info');
  }catch(e){ console.warn('SLA kapama:', e); }
}

async function loadAramaListesi(typeId){
  typeId = typeId || await _aramaTeyitTypeId();
  const listEl=document.getElementById('aramaListesi');
  if(!listEl) return;
  const bugun=new Date().toISOString().slice(0,10);
  const {data:tasks,error}=await sb.from('tasks')
    .select('task_id,ncst,visit_id,durum,deadline,olusturma_tarihi')
    .eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak'])
    .lte('deadline',bugun).order('deadline',{ascending:true}).limit(200);
  if(error){ listEl.innerHTML='<div class="empty" style="color:var(--red)">'+escapeHTML(error.message)+'</div>'; return; }
  if(!tasks || !tasks.length){ listEl.innerHTML='<div class="empty">Aranacak kayıt yok.</div>'; ARAMA.tasks=[]; return; }
  ARAMA.tasks=tasks;

  const ncstList=[...new Set(tasks.map(t=>t.ncst).filter(Boolean))];
  const unvanMap={};
  if(ncstList.length){ const {data:cs}=await sb.from('customers').select('ncst,unvan').in('ncst',ncstList); (cs||[]).forEach(c=>unvanMap[c.ncst]=c.unvan); }
  const visitIds=[...new Set(tasks.map(t=>t.visit_id).filter(Boolean))];
  const visitMap={};
  if(visitIds.length){ const {data:vs}=await sb.from('visits').select('visit_id,my_id,tarih_saat,contact_id').in('visit_id',visitIds); (vs||[]).forEach(v=>visitMap[v.visit_id]=v); }

  listEl.innerHTML='<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">'+tasks.length+' arama bekliyor</div>'+
  tasks.map(t=>{
    const unvan=unvanMap[t.ncst]||t.ncst||'—';
    const v=visitMap[t.visit_id]||{};
    const myAd = v.my_id ? (myIdToName[v.my_id]||('MY#'+v.my_id)) : '—';
    const zTarih = v.tarih_saat ? fmtDate(v.tarih_saat) : '—';
    const tekrar = t.durum==='Tekrar Aranacak' ? ' · <span style="color:var(--amber);">Tekrar</span>' : '';
    return `<div class="visit-card">
      <div class="visit-firm">${escapeHTML(unvan)}</div>
      <div class="visit-my">Ziyaret: ${escapeHTML(myAd)} · ${zTarih}${tekrar}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="araModalAc(${t.task_id})">📞 Ara</button>
        <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="aramadanKapatAc(${t.task_id})">Aramadan Kapat</button>
      </div>
    </div>`;
  }).join('');
}

// ---- Aramadan Kapat (sebepli) ----
const ARAMADAN_KAPAT_NEDEN=['Yakında tekrar ziyaret edilecek','Bilgi yetersiz','Yönetici talimatı','Diğer'];
let _aramaKapatTaskId=null;
function aramadanKapatAc(taskId){
  _aramaKapatTaskId=taskId;
  const box=document.getElementById('aramadanKapatNedenler');
  if(box) box.innerHTML=ARAMADAN_KAPAT_NEDEN.map(n=>`<div class="sonuc-item" onclick="_aramadanKapatSec(this,'${escapeHTML(n)}')">${escapeHTML(n)}</div>`).join('');
  const notEl=document.getElementById('aramadanKapatNot'); if(notEl) notEl.value='';
  window._aramadanKapatNeden=null;
  openModal('aramadanKapatModal');
}
function _aramadanKapatSec(el,neden){
  document.querySelectorAll('#aramadanKapatNedenler .sonuc-item').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  window._aramadanKapatNeden=neden;
}
async function aramadanKapatKaydet(){
  if(!_aramaKapatTaskId) return;
  const neden=window._aramadanKapatNeden;
  if(!neden){ toast('Bir neden seçin','error'); return; }
  const not=(document.getElementById('aramadanKapatNot')?.value||'').trim();
  const t=ARAMA.tasks.find(x=>x.task_id===_aramaKapatTaskId)||{};
  await sb.from('tasks').update({durum:'Aramadan Kapatıldı', tamamlanma_tarihi:new Date().toISOString(), guncelleme_tarihi:new Date().toISOString()}).eq('task_id',_aramaKapatTaskId);
  await sb.from('arama_sonuclari').insert({
    task_id:_aramaKapatTaskId, visit_id:t.visit_id, ncst:t.ncst, agent_id:currentUser.my_id,
    ulasildi:null, ulasilamama_neden:'Aramadan Kapatıldı: '+neden, agent_notu:not||null
  });
  toast('Kayıt aramadan kapatıldı','success');
  closeModal('aramadanKapatModal');
  _aramaKapatTaskId=null;
  loadAramaListesi();
}

// ============================================================
// 3b-1: ARA anket modalı (aşama aşama) + arama_sonuclari kaydı + görev durumu
// ============================================================
async function araModalAc(taskId){
  const t=(ARAMA.tasks||[]).find(x=>x.task_id===taskId);
  if(!t){ toast('Kayıt bulunamadı','error'); return; }
  // ziyaret + kontak + müşteri bilgisi
  let v={}, unvan=t.ncst, contactAd='—', telefon='';
  if(t.visit_id){ const {data:vd}=await sb.from('visits').select('visit_id,my_id,tarih_saat,contact_id').eq('visit_id',t.visit_id).maybeSingle(); v=vd||{}; }
  if(t.ncst){ const {data:c}=await sb.from('customers').select('unvan').eq('ncst',t.ncst).maybeSingle(); if(c?.unvan) unvan=c.unvan; }
  if(v.contact_id){ const {data:ct}=await sb.from('contacts').select('ad_soyad,telefon').eq('contact_id',v.contact_id).maybeSingle(); if(ct){ contactAd=ct.ad_soyad||'—'; telefon=ct.telefon||''; } }
  const myAd = v.my_id ? (myIdToName[v.my_id]||('MY#'+v.my_id)) : '—';

  // deneme_no = bu görev için önceki arama_sonuclari + 1
  let deneme=1;
  { const {count}=await sb.from('arama_sonuclari').select('*',{count:'exact',head:true}).eq('task_id',taskId); deneme=(count||0)+1; }

  // telefon bazlı geçmiş ulaşılamama (SLA hariç)
  let oncedenUlasilamadi=false;
  if(telefon){
    const {data:gecmis}=await sb.from('arama_sonuclari').select('ulasilamama_neden')
      .eq('ncst',t.ncst).eq('telefon',telefon).eq('ulasildi',false);
    oncedenUlasilamadi = (gecmis||[]).some(g=>g.ulasilamama_neden && !/^Arama Yapılmadı/.test(g.ulasilamama_neden) && !/^Aramadan Kapatıldı/.test(g.ulasilamama_neden));
  }

  window._anket={ taskId, ncst:t.ncst, visit_id:t.visit_id||null, my_id:v.my_id||null, contact_id:v.contact_id||null,
                  telefon, unvan, contactAd, ziyaretTarih:v.tarih_saat, deneme, oncedenUlasilamadi, c:{} };
  document.getElementById('aramaAnketKunye').innerHTML =
    `<b>${escapeHTML(unvan)}</b> · ☎ ${escapeHTML(telefon||'telefon yok')}<br>Kontak: ${escapeHTML(contactAd)} · Ziyaret: ${escapeHTML(myAd)} · ${v.tarih_saat?fmtDate(v.tarih_saat):'—'} · ${deneme}. arama`+
    (oncedenUlasilamadi?'<br><span style="color:var(--amber);">⚠ Bu numaraya daha önce ulaşılamamış.</span>':'');
  _anketRender();
  openModal('aramaAnketModal');
}

function _anketSec(key,val){ window._anket.c[key]=val; _anketRender(); }
function _anketText(key,val){ window._anket.c[key]=val; } // re-render yok (focus korunur)

function _chips(key,label,opts){
  const c=window._anket.c;
  return `<div class="field" style="margin-bottom:10px;"><label>${label}</label><div class="chip-grid-box">`+
    opts.map(o=>`<div class="chip-btn${c[key]===o?' selected':''}" onclick="_anketSec('${key}','${escapeHTML(o)}')">${escapeHTML(o)}</div>`).join('')+
    `</div></div>`;
}
function _scale(key,label,min,max){
  const c=window._anket.c; let s='';
  for(let i=min;i<=max;i++){ s+=`<div class="chip-btn${String(c[key])===String(i)?' selected':''}" onclick="_anketSec('${key}','${i}')" style="min-width:36px;text-align:center;">${i}</div>`; }
  return `<div class="field" style="margin-bottom:10px;"><label>${label}</label><div class="chip-grid-box">${s}</div></div>`;
}

function _anketRender(){
  const c=window._anket.c;
  const g=document.getElementById('aramaAnketGovde');
  let h='';
  h+=_chips('ulasildi','Ulaşıldı mı?',['Evet','Hayır']);

  if(c.ulasildi==='Hayır'){
    h+=_chips('ulasilamama_neden','Ulaşılamama nedeni',['Cevap yok','Sürekli meşgul','Telefon kapalı','Santralden geçilemedi','Yanlış numara']);
  }
  if(c.ulasildi==='Evet'){
    h+=_chips('muhatap_dogru','Doğru muhatap mı?',['Doğru kişi','Başka kişi','Bilinmiyor']);
    h+=_chips('gorusmek_istedi','Görüşmek uygun mu?',['Evet','Hayır']);
    if(c.gorusmek_istedi==='Hayır'){
      h+=_chips('sonra_aranmak_istedi','Sonra aranmak ister mi?',['Evet','Hayır']);
      if(c.sonra_aranmak_istedi==='Evet'){
        h+=`<div class="field" style="margin-bottom:10px;"><label>Sonraki arama tarihi</label><input type="datetime-local" id="anketSonrakiTarih" value="${c.sonraki_arama_tarihi||''}" oninput="_anketText('sonraki_arama_tarihi',this.value)" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;"></div>`;
      }
    }
    if(c.gorusmek_istedi==='Evet'){
      h+=_chips('ziyaret_dogrulandi','Bu tarihte firmadan ziyaret oldu mu?',['Evet','Hayır','Emin değil']);
      if(c.ziyaret_dogrulandi){
        h+=_chips('yuzyuze','Görüşme yüz yüze miydi?',['Yüz yüze','Telefonla','Hatırlamıyor']);
        h+=_chips('isim_dogru','Ziyaret edenin adını hatırlıyor mu?',['Doğru','Yanlış','Hatırlamıyor']);
      }
      if(c.ziyaret_dogrulandi==='Hayır'){
        h+=_chips('ziyaret_yok_neden','Ziyaret olmadıysa neden?',['MY gelmedi (MY kaynaklı)','Randevu ertelendi','Müşteri müsait değildi','Yanlış adres/kişi']);
      }
      if(c.ziyaret_dogrulandi==='Evet'){
        h+=_chips('gorusme_suresi','Görüşme süresi',['<5 dk','5-15 dk','15+ dk']);
        h+=_chips('guven','Temsilci güven verdi mi?',['Evet','Kısmen','Hayır']);
        h+=_chips('ihtiyac_anlasildi','İhtiyaç anlaşıldı mı?',['Evet','Kısmen','Hayır']);
        h+=_scale('memnuniyet','Memnuniyet (1-5)',1,5);
        h+=_scale('nps','Tavsiye eder mi? (0-10)',0,10);
        h+=_chips('takip_sozu','Takip sözü verildi mi?',['Evet','Hayır']);
        if(c.takip_sozu==='Evet') h+=_chips('takip_tutuldu','Söz tutuldu mu?',['Evet','Hayır']);
      }
      h+=_chips('sikayet_var','Şikayet / talep var mı?',['Evet','Hayır']);
      if(c.sikayet_var==='Evet'){
        h+=`<div class="field" style="margin-bottom:10px;"><label>Şikayet / talep</label><textarea id="anketSikayet" oninput="_anketText('sikayet_metni',this.value)" style="width:100%;">${escapeHTML(c.sikayet_metni||'')}</textarea></div>`;
      }
    }
  }
  // Agent notu (her durumda)
  if(c.ulasildi){
    h+=`<div class="field" style="margin-bottom:6px;"><label>Agent notu</label><textarea id="anketNot" oninput="_anketText('agent_notu',this.value)" style="width:100%;">${escapeHTML(c.agent_notu||'')}</textarea></div>`;
  }
  g.innerHTML=h;
  _anketAksiyonRender();
}

function _anketAksiyonRender(){
  const c=window._anket.c, st=window._anket;
  const box=document.getElementById('aramaAnketAksiyon');
  let h='';
  if(c.ulasildi==='Evet'){
    h=`<button class="btn" style="width:100%;background:var(--green);" onclick="araAnketKaydet()">Kaydet (Tamamlandı)</button>`;
  } else if(c.ulasildi==='Hayır' && c.ulasilamama_neden){
    if(c.ulasilamama_neden==='Yanlış numara'){
      h=`<button class="btn" style="width:100%;background:var(--amber);color:#000;" onclick="araAnketBilgiGuncelle('Yanlış numara')">Kapat + MY'ye Bilgi Güncelleme Görevi</button>`;
    } else if(st.oncedenUlasilamadi){
      h=`<div style="font-size:12px;color:var(--amber);margin-bottom:6px;">Bu numaraya daha önce de ulaşılamamış. Tekrar denemek yerine MY'ye bilgi güncelleme görevi açılması önerilir.</div>
         <button class="btn" style="width:100%;background:var(--amber);color:#000;" onclick="araAnketBilgiGuncelle('Tekrar ulaşılamadı')">Kapat + MY'ye Bilgi Güncelleme Görevi</button>
         <button class="btn btn-ghost" style="width:100%;margin-top:6px;" onclick="araAnketTekrar()">Yine de tekrar aranacak</button>`;
    } else {
      h=`<div class="field" style="margin-bottom:6px;"><label>Tekrar arama tarihi</label><input type="datetime-local" id="anketTekrarTarih" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px;"></div>
         <button class="btn" style="width:100%;background:var(--blue);" onclick="araAnketTekrar()">Tekrar Aranacak</button>
         <button class="btn btn-ghost" style="width:100%;margin-top:6px;" onclick="araAnketUlasilamiyor()">Ulaşılamıyor (kapat)</button>`;
    }
  }
  box.innerHTML=h;
}

// arama_sonuclari satırı (ortak)
function _anketSatir(extra){
  const st=window._anket, c=st.c;
  return Object.assign({
    task_id:st.taskId, visit_id:st.visit_id, ncst:st.ncst, my_id:st.my_id,
    agent_id:currentUser.my_id, contact_id:st.contact_id, telefon:st.telefon||null, deneme_no:st.deneme,
    ulasildi:c.ulasildi==='Evet'?true:(c.ulasildi==='Hayır'?false:null),
    ulasilamama_neden:c.ulasilamama_neden||null,
    muhatap_dogru:c.muhatap_dogru||null, gorusmek_istedi:c.gorusmek_istedi==null?null:(c.gorusmek_istedi==='Evet'),
    sonra_aranmak_istedi:c.sonra_aranmak_istedi==null?null:(c.sonra_aranmak_istedi==='Evet'),
    sonraki_arama_tarihi:c.sonraki_arama_tarihi||null,
    ziyaret_dogrulandi:c.ziyaret_dogrulandi||null, yuzyuze_uyusmazlik:(c.yuzyuze==='Telefonla')?true:(c.yuzyuze?false:null),
    isim_dogru:c.isim_dogru||null, ziyaret_yok_neden:c.ziyaret_yok_neden||null,
    gorusme_suresi:c.gorusme_suresi||null, guven:c.guven||null, ihtiyac_anlasildi:c.ihtiyac_anlasildi||null,
    memnuniyet:c.memnuniyet?parseInt(c.memnuniyet):null, nps:(c.nps!=null&&c.nps!=='')?parseInt(c.nps):null,
    takip_sozu:c.takip_sozu==null?null:(c.takip_sozu==='Evet'), takip_tutuldu:c.takip_tutuldu==null?null:(c.takip_tutuldu==='Evet'),
    sikayet_var:c.sikayet_var==null?null:(c.sikayet_var==='Evet'), sikayet_metni:c.sikayet_metni||null,
    agent_notu:c.agent_notu||null
  }, extra||{});
}
async function _anketLog(aksiyon,detay){
  try{ await sb.from('task_logs').insert({task_id:window._anket.taskId,user_id:currentUser.my_id,user_ad:currentUser.ad_soyad,aksiyon,detay}); }catch(e){}
}

async function araAnketKaydet(){
  const c=window._anket.c;
  if(!c.ulasildi){ toast('Ulaşıldı mı? seçin','error'); return; }
  await sb.from('arama_sonuclari').insert(_anketSatir());
  await sb.from('tasks').update({durum:'Tamamlandı',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()}).eq('task_id',window._anket.taskId);
  await _anketLog('Arama Tamamlandı','Teyit araması dolduruldu');
  toast('Arama kaydedildi','success');
  closeModal('aramaAnketModal'); loadAramaListesi();
}
async function araAnketTekrar(){
  const c=window._anket.c;
  const tar=document.getElementById('anketTekrarTarih')?.value || c.sonraki_arama_tarihi;
  if(!tar){ toast('Tekrar arama tarihi seçin','error'); return; }
  const dl=tar.slice(0,10);
  await sb.from('arama_sonuclari').insert(_anketSatir({sonraki_arama_tarihi:tar}));
  await sb.from('tasks').update({durum:'Tekrar Aranacak',deadline:dl,tamamlanma_tarihi:null,guncelleme_tarihi:new Date().toISOString()}).eq('task_id',window._anket.taskId);
  await _anketLog('Tekrar Aranacak','Yeni arama: '+fmtDate(tar)+(c.ulasilamama_neden?(' · '+c.ulasilamama_neden):''));
  toast('Tekrar aranacak olarak işaretlendi','info');
  closeModal('aramaAnketModal'); loadAramaListesi();
}
async function araAnketUlasilamiyor(){
  await sb.from('arama_sonuclari').insert(_anketSatir());
  await sb.from('tasks').update({durum:'Ulaşılamıyor',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()}).eq('task_id',window._anket.taskId);
  await _anketLog('Ulaşılamıyor','Ulaşılamama: '+(window._anket.c.ulasilamama_neden||'-'));
  toast('Ulaşılamıyor olarak kapatıldı','info');
  closeModal('aramaAnketModal'); loadAramaListesi();
}
// Yanlış numara / tekrar ulaşılamadı → MY'ye "Müşteri Bilgileri Güncelleme" görevi
async function araAnketBilgiGuncelle(sebep){
  const st=window._anket;
  await sb.from('arama_sonuclari').insert(_anketSatir());
  await sb.from('tasks').update({durum:'Ulaşılamıyor',tamamlanma_tarihi:new Date().toISOString(),guncelleme_tarihi:new Date().toISOString()}).eq('task_id',st.taskId);
  // task_type: Müşteri Bilgileri Güncelleme
  const {data:tt}=await sb.from('task_types').select('type_id').eq('tip_adi','Müşteri Bilgileri Güncelleme').maybeSingle();
  if(tt?.type_id && st.my_id){
    await sb.from('tasks').insert({
      type_id:tt.type_id, baslik:'Müşteri Bilgileri Güncelleme — '+(st.unvan||st.ncst),
      aciklama:'Teyit aramasında ulaşılamadı ('+sebep+'). Kontak/telefon güncellenmeli. Kontak: '+(st.contactAd||'-')+' · Tel: '+(st.telefon||'-'),
      ncst:st.ncst, parent_task_id:st.taskId, atayan_id:currentUser.my_id, atanan_id:st.my_id,
      durum:'Atandı', baslama_tarihi:new Date().toISOString(), olusturma_tarihi:new Date().toISOString()
    });
    await _anketLog('Bilgi Güncelleme Görevi','MY #'+st.my_id+' → Müşteri Bilgileri Güncelleme ('+sebep+')');
    toast('Kapatıldı, MY\'ye bilgi güncelleme görevi açıldı','success');
  } else {
    toast('Kapatıldı (bilgi güncelleme görevi açılamadı: MY/görev tipi yok)','info');
  }
  closeModal('aramaAnketModal'); loadAramaListesi();
}
