// ============================================================
// arama.js — v1.0.0
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

// ---- Ara (anket) — 3b'de gelecek ----
function araModalAc(taskId){ toast('Arama anketi bir sonraki adımda (3b) eklenecek','info'); }
