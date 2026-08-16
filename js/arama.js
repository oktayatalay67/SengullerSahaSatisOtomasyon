// ============================================================
// arama.js — v1.0.10
//   v1.0.10 (V31.24): FIX — Detay modali 'kayit bulunamadi' gosteriyordu cunku
//     araSonucDetayAc'in arama_sonuclari select'i sabit kolon listesi kullaniyordu
//     ve PostgREST bir kolon uyusmazliginda TUM select'i hatayla reddediyor,
//     kod bu hatayi kontrol etmedigi icin sessizce 'kayit yok' gibi gorunuyordu.
//     select('*') + hata mesaji ekranda gosterilir oldu.
//   v1.0.9 (V31.23): Tamamlanan arama kartlari artik hep anlamli bir ozet
//     gosterir (_aramaSonucOzet — sikayet/yanlis numara/sahte supheli oncelikli).
//     Karta tiklamak veya yeni "Detay" tusu, o goreve ait TUM arama_sonuclari
//     denemelerini (her alan) gosteren yeni salt-okunur modal (aramaSonucDetayModal)
//     acar. "Tekrar Ara" tusu "Yeniden Ara" olarak yeniden adlandirildi.
//   v1.0.8 (V31.22): Kart cercevesine 5. renk (mor: sahte/supheli ziyaret).
//     Cagri Analizi'ne 5b MY Kirilim/Liderlik Tablosu paneli eklendi (acilir/
//     kapanir, analiz tarih araligini kullanir): en cok yanlis numara (MY),
//     en temiz veri (genel sorun orani en dusuk MY), KCM bazli ziyaret
//     memnuniyet skoru en yuksek/dusuk 3'er MY. Min 3 arama esigi uygulanir.
//   v1.0.7 (V31.21): 'Bugun' sekmesi -> 'Bekleyen Cagrilar' (+ tarih filtresi,
//     Tamamlananlar'daki gibi). Kutu etiketleri: Bekleyen/Gelecek/Tamamlanan.
//     Kart cerceve renklendirme: kirmizi=yanlis numara/sikayet, sari=ulasildi+
//     tekrar aranacak, yesil=tamamlandi+ziyaret teyit edildi, turuncu=ulasilamayan/
//     kapanan. main.css: --orange degiskeni eklendi.
//   v1.0.6 (V31.20): UI — Bugun/Gelecek/Tamamlanan sekmeleri alttaki liste
//     kutusuyla ayni genislikte 3 istatistik kutusuna (.summary-box) donusturuldu;
//     sayi kutu icinde buyuk+bold, etiket altinda, kutuya tiklamak sekmeyi acar.
//   v1.0.5 (V31.19): Ara modalina 'Firma Gecmisi' paneli — bu ncst'ye yapilmis
//     TUM ziyaretler (visits) + daha once yapilmis TUM teyit aramalari
//     (arama_sonuclari) listelenir (acilir/kapanir). Agent aradigi firma
//     hakkinda aramadan once istihbarat toplayabilir.
//   v1.0.4 (V31.17): Liste ozetine ziyaret amaci+urun; arama modalinda tam ziyaret
//     bilgisi paneli (amac/detay, urun_gruplari, ziyaret notu, firsat olustu mu).
//   v1.0.3 (V31.16): 5a — Cagri Analizi sekmesi (arama_rapor), kategori+tarih
//     filtreli liste, kapsam bazli (TUM/KCM). Operasyon sekmeleri arama_agent'a bagli.
//   v1.0.2 (V31.15): 3c — Bugün/Gelecek/Tamamlanan sekmeleri + ozet sayaclar
//     + Gelecek tarihe gore gruplu + Tamamlananlarda tarih filtresi + Tekrar Ara.
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
  const agent=hasPerm('arama_agent');
  if(agent) await _aramaSlaOtomatikKapat(typeId);   // SLA yalnız agent ekranında
  ARAMA.aktifSekme = ARAMA.aktifSekme || (agent?'bugun':'analiz');
  _aramaShellRender();
  if(agent) _aramaSayaclariYukle();
  _aramaSekmeGoster(ARAMA.aktifSekme);
}

// v31.20: 3 sekme (Bugün/Gelecek/Tamamlanan) artık alttaki liste kutusuyla aynı
// genişlikte 3 istatistik kutusu (.summary-box) olarak gösteriliyor — sayı kutu
// içinde büyük+bold, etiket altında; kutuya tıklamak ilgili sekmeye geçer.
function _aramaShellRender(){
  const el=document.getElementById('aramaListesi'); if(!el) return;
  const agent=hasPerm('arama_agent'), rapor=hasPerm('arama_rapor');
  let h='';
  if(agent){
    h+=`<div id="aramaSekmeler" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
      <div class="summary-box" data-sekme="bugun" style="cursor:pointer;" onclick="_aramaSekmeGoster('bugun')">
        <div class="summary-val lg" id="aramaStatBugun" style="color:var(--amber);">—</div>
        <div class="summary-label lg">Bekleyen</div>
      </div>
      <div class="summary-box" data-sekme="gelecek" style="cursor:pointer;" onclick="_aramaSekmeGoster('gelecek')">
        <div class="summary-val lg" id="aramaStatGelecek" style="color:var(--blue);">—</div>
        <div class="summary-label lg">Gelecek</div>
      </div>
      <div class="summary-box" data-sekme="tamamlanan" style="cursor:pointer;" onclick="_aramaSekmeGoster('tamamlanan')">
        <div class="summary-val lg" id="aramaStatTamamlanan" style="color:var(--green);">—</div>
        <div class="summary-label lg">Tamamlanan</div>
      </div>
    </div>`;
  }
  if(rapor) h+=`<div style="display:flex;gap:6px;margin-bottom:10px;"><div class="chip-btn" data-sekme="analiz" onclick="_aramaSekmeGoster('analiz')">📊 Çağrı Analizi</div></div>`;
  h+=`<div id="aramaFiltre"></div>
    <div id="aramaListeGovde"><div class="loader"><div class="spinner"></div></div></div>`;
  el.innerHTML=h;
}

async function _aramaSayaclariYukle(){
  const typeId=await _aramaTeyitTypeId();
  const bugun=new Date().toISOString().slice(0,10);
  const [bek,gel,tam]=await Promise.all([
    sb.from('tasks').select('*',{count:'exact',head:true}).eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak']).lte('deadline',bugun).then(r=>r.count||0),
    sb.from('tasks').select('*',{count:'exact',head:true}).eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak']).gt('deadline',bugun).then(r=>r.count||0),
    sb.from('tasks').select('*',{count:'exact',head:true}).eq('type_id',typeId).eq('durum','Tamamlandı').gte('tamamlanma_tarihi',bugun+'T00:00:00').then(r=>r.count||0)
  ]);
  const b=document.getElementById('aramaStatBugun'); if(b) b.textContent=bek;
  const g=document.getElementById('aramaStatGelecek'); if(g) g.textContent=gel;
  const t=document.getElementById('aramaStatTamamlanan'); if(t) t.textContent=tam;
}

function _aramaSekmeGoster(sekme){
  ARAMA.aktifSekme=sekme;
  document.querySelectorAll('#aramaListesi [data-sekme]').forEach(c=>c.classList.toggle('active', c.getAttribute('data-sekme')===sekme));
  const f=document.getElementById('aramaFiltre'); if(f){ f.innerHTML=''; delete f.dataset.ready; }
  if(sekme==='bugun') loadAramaBugun();
  else if(sekme==='gelecek') loadAramaGelecek();
  else if(sekme==='analiz') loadAramaAnaliz();
  else loadAramaTamamlanan();
}

// Eski çağrı noktaları (kaydet/kapat sonrası): aktif sekmeyi + sayaçları yenile
function loadAramaListesi(){ _aramaSayaclariYukle(); _aramaSekmeGoster(ARAMA.aktifSekme||'bugun'); }

async function _aramaEnrich(tasks){
  const ncstList=[...new Set(tasks.map(t=>t.ncst).filter(Boolean))];
  const unvanMap={}; if(ncstList.length){ const {data}=await sb.from('customers').select('ncst,unvan').in('ncst',ncstList); (data||[]).forEach(c=>unvanMap[c.ncst]=c.unvan); }
  const vIds=[...new Set(tasks.map(t=>t.visit_id).filter(Boolean))];
  const vMap={}; if(vIds.length){ const {data}=await sb.from('visits').select('visit_id,my_id,tarih_saat,ziyaret_amaci,urun_gruplari,ziyaret_sonucu').in('visit_id',vIds); (data||[]).forEach(v=>vMap[v.visit_id]=v); }
  return {unvanMap,vMap};
}
// v31.22: kart çerçeve rengi — durum + son arama sonucuna göre görsel önceliklendirme.
//   Kırmızı: yanlış numara veya şikayet kaydı var (en yüksek öncelik)
//   Mor: sahte ziyaret şüphesi (Hayır) veya şüpheli (Emin değil)
//   Sarı (amber): ulaşıldı ama tekrar aranacak
//   Yeşil: görüşüldü ve ziyaret teyit alındı (Tamamlandı + ziyaret_dogrulandi=Evet)
//   Turuncu: ulaşılamayan / aramadan kapatılan / SLA ile kapanan
function _aramaKartRenk(t){
  const s=t._sonucRaw||{};
  if(s.sikayet_var===true || s.ulasilamama_neden==='Yanlış numara') return 'var(--red)';
  if(t.durum==='Tamamlandı' && (s.ziyaret_dogrulandi==='Hayır' || s.ziyaret_dogrulandi==='Emin değil')) return 'var(--purple)';
  if(t.durum==='Tekrar Aranacak' && s.ulasildi===true) return 'var(--amber)';
  if(t.durum==='Tamamlandı' && s.ziyaret_dogrulandi==='Evet') return 'var(--green)';
  if(['Ulaşılamıyor','Aramadan Kapatıldı','Arama Yapılmadı'].includes(t.durum)) return 'var(--orange)';
  return null;
}
// Bekleyen/Gelecek listelerindeki 'Tekrar Aranacak' kayıtlar için son arama
// sonucunu (ulasildi/sikayet_var/yanlış numara) çeker — çerçeve rengi için gerekli.
async function _aramaKartRenkYukle(tasks){
  const ids=tasks.filter(t=>t.durum==='Tekrar Aranacak').map(t=>t.task_id);
  if(!ids.length) return;
  const {data:sonuclar}=await sb.from('arama_sonuclari').select('task_id,ulasildi,sikayet_var,ulasilamama_neden,created_at').in('task_id',ids).order('created_at',{ascending:false});
  const sonMap={};
  (sonuclar||[]).forEach(s=>{ if(!sonMap[s.task_id]) sonMap[s.task_id]=s; }); // desc sıralı: ilk gelen = en yeni
  tasks.forEach(t=>{ if(sonMap[t.task_id]) t._sonucRaw=sonMap[t.task_id]; });
}

// v31.23: Tamamlanan arama kartındaki tek satır özet — daima anlamlı bir şey
// göstermesi için öncelik sırasına göre (şikayet/yanlış numara/sahte şüphesi önce)
// en önemli bulguyu yansıtır. Önceki hali çoğu kayıtta boş kalıyordu.
function _aramaSonucOzet(s){
  if(!s) return '';
  const kisalt=(t,n)=>{ t=(t||'').trim(); return t.length>n?t.slice(0,n)+'…':t; };
  if(s.ulasilamama_neden==='Yanlış numara') return '☎️ Yanlış numara';
  if(s.ulasildi===false) return 'Ulaşılamadı'+(s.ulasilamama_neden?(' ('+s.ulasilamama_neden+')'):'');
  if(s.sikayet_var===true) return '⚠️ Şikayet: '+(s.sikayet_metni?kisalt(s.sikayet_metni,40):'kayıt var');
  if(s.ziyaret_dogrulandi==='Hayır') return '🚩 Ziyaret teyit edilemedi (sahte şüphesi)';
  if(s.ziyaret_dogrulandi==='Emin değil') return '❓ Ziyaret teyidi belirsiz';
  const p=[];
  if(s.ziyaret_dogrulandi) p.push('Ziyaret teyit: '+s.ziyaret_dogrulandi);
  if(s.memnuniyet) p.push('Memnuniyet '+s.memnuniyet+'/5');
  if(s.nps!=null) p.push('NPS '+s.nps+'/10');
  if(s.guven==='Hayır') p.push('güven yok');
  if(!p.length) p.push('Görüşüldü');
  return p.join(' · ');
}

function _aramaKart(t,unvanMap,vMap,mod){
  const unvan=unvanMap[t.ncst]||t.ncst||'—';
  const v=vMap[t.visit_id]||{};
  const myAd=v.my_id?(myIdToName[v.my_id]||('MY#'+v.my_id)):'—';
  const zt=v.tarih_saat?fmtDate(v.tarih_saat):'—';
  let alt='';
  if(mod==='aktif'){
    alt=`<div style="display:flex;gap:6px;margin-top:8px;">
      <button class="btn btn-sm" style="flex:1;background:var(--green);" onclick="araModalAc(${t.task_id})">📞 Ara</button>
      <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="aramadanKapatAc(${t.task_id})">Aramadan Kapat</button></div>`;
  } else if(mod==='gelecek'){
    alt=`<div class="visit-my" style="color:var(--text3);">Aranacak: ${t.deadline||'—'}</div>`;
  } else {
    // v31.23: her zaman anlamlı bir özet (_aramaSonucOzet) + Detay modalı + yeniden ara
    alt=`<div class="visit-my">${escapeHTML(t.durum)}${t._sonuc?(' · '+escapeHTML(t._sonuc)):''}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();araSonucDetayAc(${t.task_id})">📋 Detay</button>
        <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="event.stopPropagation();araModalAc(${t.task_id})">Yeniden Ara</button>
      </div>`;
  }
  const tekrar=(t.durum==='Tekrar Aranacak'&&mod==='aktif')?' · <span style="color:var(--amber);">Tekrar</span>':'';
  const kisalt=(s,n)=>{ s=(s||'').trim(); return s.length>n?s.slice(0,n)+'…':s; };
  const ozetSatir = (v.ziyaret_amaci||v.urun_gruplari)
    ? `<div class="visit-my" style="color:var(--text3);">Amaç: ${escapeHTML(v.ziyaret_amaci||'—')}${v.urun_gruplari?(' · Ürün: '+escapeHTML(kisalt(v.urun_gruplari,50))):''}</div>` : '';
  const renk=_aramaKartRenk(t);
  const stilParca=[]; if(renk) stilParca.push(`border:1.5px solid ${renk};`); if(mod==='tamamlanan') stilParca.push('cursor:pointer;');
  const cerceve=stilParca.length?` style="${stilParca.join('')}"`:'';
  const tiklaAttr=(mod==='tamamlanan')?` onclick="araSonucDetayAc(${t.task_id})"`:'';
  return `<div class="visit-card"${tiklaAttr}${cerceve}><div class="visit-firm">${escapeHTML(unvan)}</div>
    <div class="visit-my">Ziyaret: ${escapeHTML(myAd)} · ${zt}${tekrar}</div>${ozetSatir}${alt}</div>`;
}

async function loadAramaBugun(){
  const typeId=await _aramaTeyitTypeId(); const g=document.getElementById('aramaListeGovde'); if(!g)return;
  const bugun=new Date().toISOString().slice(0,10);
  // v31.21: Tamamlananlar'daki gibi tarih filtresi (deadline aralığı) — sekme adı 'Bekleyen Çağrılar'
  const fEl=document.getElementById('aramaFiltre');
  if(fEl && !fEl.dataset.ready){
    fEl.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      <input type="date" id="aramaBekBas" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      <input type="date" id="aramaBekBit" max="${bugun}" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      <button class="btn btn-sm" style="background:var(--blue);" onclick="loadAramaBugun()">Filtrele</button></div>`;
    fEl.dataset.ready='1';
  }
  const bas=document.getElementById('aramaBekBas')?.value;
  const bit=document.getElementById('aramaBekBit')?.value;
  let q=sb.from('tasks').select('task_id,ncst,visit_id,durum,deadline').eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak']).lte('deadline',bugun).order('deadline',{ascending:true}).limit(500);
  if(bas) q=q.gte('deadline',bas);
  if(bit) q=q.lte('deadline',bit);
  const {data:tasks}=await q;
  ARAMA.tasks=tasks||[];
  if(!tasks||!tasks.length){ g.innerHTML='<div class="empty">Bekleyen çağrı yok.</div>'; return; }
  await _aramaKartRenkYukle(tasks);
  const {unvanMap,vMap}=await _aramaEnrich(tasks);
  g.innerHTML=tasks.map(t=>_aramaKart(t,unvanMap,vMap,'aktif')).join('');
}

async function loadAramaGelecek(){
  const typeId=await _aramaTeyitTypeId(); const g=document.getElementById('aramaListeGovde'); if(!g)return;
  const bugun=new Date().toISOString().slice(0,10);
  const {data:tasks}=await sb.from('tasks').select('task_id,ncst,visit_id,durum,deadline').eq('type_id',typeId).in('durum',['Aranacak','Tekrar Aranacak']).gt('deadline',bugun).order('deadline',{ascending:true}).limit(1000);
  ARAMA.tasks=tasks||[];
  if(!tasks||!tasks.length){ g.innerHTML='<div class="empty">Gelecek çağrı yok.</div>'; return; }
  await _aramaKartRenkYukle(tasks);
  const {unvanMap,vMap}=await _aramaEnrich(tasks);
  const gruplar={}; tasks.forEach(t=>{ (gruplar[t.deadline]=gruplar[t.deadline]||[]).push(t); });
  let h='';
  Object.keys(gruplar).sort().forEach(d=>{
    h+=`<div style="font-weight:700;font-size:13px;margin:12px 0 6px;color:var(--text);">${d} <span style="color:var(--text3);font-weight:400;">(${gruplar[d].length})</span></div>`;
    h+=gruplar[d].map(t=>_aramaKart(t,unvanMap,vMap,'gelecek')).join('');
  });
  g.innerHTML=h;
}

async function loadAramaTamamlanan(){
  const typeId=await _aramaTeyitTypeId(); const g=document.getElementById('aramaListeGovde'); if(!g)return;
  const fEl=document.getElementById('aramaFiltre');
  if(fEl && !fEl.dataset.ready){
    fEl.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      <input type="date" id="aramaTamBas" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      <input type="date" id="aramaTamBit" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
      <button class="btn btn-sm" style="background:var(--blue);" onclick="loadAramaTamamlanan()">Filtrele</button></div>`;
    fEl.dataset.ready='1';
  }
  const bas=document.getElementById('aramaTamBas')?.value;
  const bit=document.getElementById('aramaTamBit')?.value;
  let q=sb.from('tasks').select('task_id,ncst,visit_id,durum,deadline,tamamlanma_tarihi').eq('type_id',typeId).in('durum',['Tamamlandı','Ulaşılamıyor','Aramadan Kapatıldı','Arama Yapılmadı']).order('tamamlanma_tarihi',{ascending:false}).limit(300);
  if(bas) q=q.gte('tamamlanma_tarihi',bas+'T00:00:00');
  if(bit) q=q.lte('tamamlanma_tarihi',bit+'T23:59:59');
  const {data:tasks}=await q;
  ARAMA.tasks=tasks||[];
  if(!tasks||!tasks.length){ g.innerHTML='<div class="empty">Tamamlanan kayıt yok.</div>'; return; }
  const ids=tasks.map(t=>t.task_id);
  const {data:sonuclar}=await sb.from('arama_sonuclari').select('task_id,ulasildi,memnuniyet,nps,guven,ulasilamama_neden,ziyaret_dogrulandi,sikayet_var,sikayet_metni,created_at').in('task_id',ids).order('created_at',{ascending:false});
  const sMap={}; (sonuclar||[]).forEach(s=>{ if(!sMap[s.task_id]) sMap[s.task_id]=s; }); // desc: ilk gelen = en son deneme
  tasks.forEach(t=>{
    const s=sMap[t.task_id];
    if(s){
      t._sonucRaw=s;
      t._sonuc = _aramaSonucOzet(s);
    }
  });
  const {unvanMap,vMap}=await _aramaEnrich(tasks);
  g.innerHTML=tasks.map(t=>_aramaKart(t,unvanMap,vMap,'tamamlanan')).join('');
}

// ============================================================
// v31.23: Tamamlanan arama kaydı — DETAY modalı. Bir göreve ait TÜM
// arama_sonuclari denemelerini (deneme_no sırasıyla), her alanı boş
// olmayanları göstererek listeler. Kart tıklaması ve "📋 Detay" tuşu buraya bağlı.
// ============================================================
async function araSonucDetayAc(taskId){
  const t=(ARAMA.tasks||[]).find(x=>x.task_id===taskId);
  if(!t){ toast('Kayıt bulunamadı','error'); return; }
  const kunyeEl=document.getElementById('aramaSonucDetayKunye');
  const icerikEl=document.getElementById('aramaSonucDetayIcerik');
  if(icerikEl) icerikEl.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  if(kunyeEl) kunyeEl.innerHTML='';
  openModal('aramaSonucDetayModal');

  let unvan=t.ncst, myAd='—', zt='—';
  const [{data:c}, vRes] = await Promise.all([
    sb.from('customers').select('unvan').eq('ncst',t.ncst).maybeSingle(),
    t.visit_id ? sb.from('visits').select('my_id,tarih_saat').eq('visit_id',t.visit_id).maybeSingle() : Promise.resolve({data:null})
  ]);
  if(c?.unvan) unvan=c.unvan;
  if(vRes?.data){
    myAd = vRes.data.my_id?(myIdToName[vRes.data.my_id]||('MY#'+vRes.data.my_id)):'—';
    zt = vRes.data.tarih_saat?fmtDate(vRes.data.tarih_saat):'—';
  }
  if(kunyeEl) kunyeEl.innerHTML=`<b>${escapeHTML(unvan)}</b><br>Ziyaret: ${escapeHTML(myAd)} · ${zt} · Görev durumu: ${escapeHTML(t.durum)}`;

  // v31.24: select('*') kullanılır — sabit kolon listesi, canlı şemada tek bir
  // kolon adı bile uyuşmazsa PostgREST TÜM select'i reddediyor ve hata sessizce
  // yutulup 'kayıt yok' gibi görünüyordu. '*' + hata mesajını göstermek bunu önler.
  const {data:sonuclar, error:sonucErr}=await sb.from('arama_sonuclari')
    .select('*')
    .eq('task_id',taskId).order('created_at',{ascending:true});
  if(!icerikEl) return;
  if(sonucErr){
    console.error('araSonucDetayAc select hatası:', sonucErr);
    icerikEl.innerHTML='<div class="empty">Kayıtlar yüklenirken hata oluştu: '+escapeHTML(sonucErr.message||String(sonucErr))+'</div>';
    return;
  }
  if(!sonuclar || !sonuclar.length){ icerikEl.innerHTML='<div class="empty">Bu görev için arama kaydı bulunamadı.</div>'; return; }

  const boolTxt=(b)=> b===true?'Evet':(b===false?'Hayır':'');
  const blok=(label,val)=>{
    if(val===null||val===undefined||val==='') return '';
    return `<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">
      <span style="color:var(--text3);">${escapeHTML(label)}</span><span style="color:var(--text);text-align:right;">${escapeHTML(String(val))}</span></div>`;
  };

  icerikEl.innerHTML = sonuclar.map((s,i)=>{
    let renk='var(--border)';
    if(s.sikayet_var===true || s.ulasilamama_neden==='Yanlış numara') renk='var(--red)';
    else if(s.ziyaret_dogrulandi==='Hayır' || s.ziyaret_dogrulandi==='Emin değil') renk='var(--purple)';
    else if(s.ziyaret_dogrulandi==='Evet') renk='var(--green)';
    else if(s.ulasildi===false) renk='var(--orange)';
    const agentAd = s.agent_id?(myIdToName[s.agent_id]||('#'+s.agent_id)):'—';
    const baslik='Deneme '+(s.deneme_no||(i+1))+' · '+(s.created_at?fmtDate(s.created_at):'—')+' · '+agentAd;
    let gov='';
    gov+=blok('Ulaşıldı mı', boolTxt(s.ulasildi));
    gov+=blok('Ulaşılamama nedeni', s.ulasilamama_neden);
    gov+=blok('Telefon', s.telefon);
    gov+=blok('Doğru muhatap mı', s.muhatap_dogru);
    gov+=blok('Görüşmek uygun muydu', boolTxt(s.gorusmek_istedi));
    gov+=blok('Sonra aranmak istedi mi', boolTxt(s.sonra_aranmak_istedi));
    gov+=blok('Sonraki arama tarihi', s.sonraki_arama_tarihi?fmtDate(s.sonraki_arama_tarihi):'');
    gov+=blok('Ziyaret teyit edildi mi', s.ziyaret_dogrulandi);
    gov+=blok('Görüşme şekli', s.yuzyuze_uyusmazlik===true?'Telefonla':(s.yuzyuze_uyusmazlik===false?'Yüz yüze':''));
    gov+=blok('Ziyaret edenin adı doğru mu', s.isim_dogru);
    gov+=blok('Ziyaret olmadıysa neden', s.ziyaret_yok_neden);
    gov+=blok('Görüşme süresi', s.gorusme_suresi);
    gov+=blok('Temsilci güven verdi mi', s.guven);
    gov+=blok('İhtiyaç anlaşıldı mı', s.ihtiyac_anlasildi);
    gov+=blok('Memnuniyet', s.memnuniyet?(s.memnuniyet+'/5'):'');
    gov+=blok('NPS (tavsiye)', s.nps!=null?(s.nps+'/10'):'');
    gov+=blok('Takip sözü verildi mi', boolTxt(s.takip_sozu));
    gov+=blok('Takip sözü tutuldu mu', boolTxt(s.takip_tutuldu));
    gov+=blok('Şikayet / talep var mı', boolTxt(s.sikayet_var));
    gov+=blok('Şikayet / talep detayı', s.sikayet_metni);
    gov+=blok('Agent notu', s.agent_notu);
    return `<div style="border-left:3px solid ${renk};background:var(--navy3);border-radius:8px;padding:8px 10px;margin-bottom:10px;">
      <div style="font-weight:700;font-size:12px;color:var(--text);margin-bottom:4px;">${escapeHTML(baslik)}</div>${gov}
    </div>`;
  }).join('');
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
  if(t.visit_id){ const {data:vd}=await sb.from('visits').select('visit_id,my_id,tarih_saat,contact_id,ziyaret_amaci,ziyaret_amaci_detay,urun_gruplari,ziyaret_sonucu,gorusulen_yetkili').eq('visit_id',t.visit_id).maybeSingle(); v=vd||{}; }
  if(t.ncst){ const {data:c}=await sb.from('customers').select('unvan').eq('ncst',t.ncst).maybeSingle(); if(c?.unvan) unvan=c.unvan; }
  if(v.contact_id){ const {data:ct}=await sb.from('contacts').select('ad_soyad,telefon').eq('contact_id',v.contact_id).maybeSingle(); if(ct){ contactAd=ct.ad_soyad||'—'; telefon=ct.telefon||''; } }
  const myAd = v.my_id ? (myIdToName[v.my_id]||('MY#'+v.my_id)) : '—';

  // Fırsat oluşmuş mu? (opportunities.visit_id)
  let firsatText='Hayır';
  if(t.visit_id){
    const {data:opps}=await sb.from('opportunities').select('opp_id,durum').eq('visit_id',t.visit_id);
    if(opps && opps.length){
      let urunler='';
      const oppIds=opps.map(o=>o.opp_id);
      const {data:pr}=await sb.from('opportunity_products').select('urun_adi').in('opp_id',oppIds).limit(5);
      if(pr && pr.length) urunler=' ('+pr.map(p=>p.urun_adi).filter(Boolean).join(', ')+')';
      firsatText='Evet · '+opps.map(o=>o.durum).join(', ')+urunler;
    }
  }

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
    (oncedenUlasilamadi?'<br><span style="color:var(--amber);">⚠ Bu numaraya daha önce ulaşılamamış.</span>':'')+
    `<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;color:var(--text2);">`+
    `<div><b>Ziyaret amacı:</b> ${escapeHTML(v.ziyaret_amaci||'—')}${v.ziyaret_amaci_detay?(' — '+escapeHTML(v.ziyaret_amaci_detay)):''}</div>`+
    `<div><b>Konuşulan ürün/servis:</b> ${escapeHTML(v.urun_gruplari||'—')}</div>`+
    `<div><b>Ziyaret notu/sonucu:</b> ${escapeHTML(v.ziyaret_sonucu||'—')}</div>`+
    `<div><b>Fırsat oluşmuş mu:</b> ${escapeHTML(firsatText)}</div>`+
    `</div>`;

  // v31.19: Firma geçmişi — tüm ziyaretler + daha önceki teyit aramaları (istihbarat)
  _aramaGecmisYukle(t.ncst, t.visit_id);

  _anketRender();
  openModal('aramaAnketModal');
}

// v31.19: bu ncst'ye ait TÜM ziyaretleri (visits) + TÜM önceki teyit aramalarını
// (arama_sonuclari) çeker ve açılır/kapanır bir panelde gösterir. Agent aramadan
// önce firma hakkında geçmiş bilgiyi görebilsin diye eklendi.
async function _aramaGecmisYukle(ncst, guncelVisitId){
  const box=document.getElementById('aramaAnketGecmis');
  if(!box) return;
  box.innerHTML='<div style="font-size:11px;color:var(--text3);">Firma geçmişi yükleniyor…</div>';
  if(!ncst){ box.innerHTML=''; return; }

  const [{data:ziyaretler}, {data:aramalar}] = await Promise.all([
    sb.from('visits').select('visit_id,tarih_saat,my_id,temas_turu,durum,ziyaret_amaci,ziyaret_sonucu')
      .eq('ncst',ncst).order('tarih_saat',{ascending:false}).limit(20),
    sb.from('arama_sonuclari').select('created_at,agent_id,ulasildi,ulasilamama_neden,ziyaret_dogrulandi,memnuniyet,guven,sikayet_var,agent_notu')
      .eq('ncst',ncst).order('created_at',{ascending:false}).limit(20)
  ]);
  // SLA'nın otomatik kapattığı "aranmadı" kayıtları gürültü — istihbaratta gösterilmez
  const aramaTemiz=(aramalar||[]).filter(s=>!(s.ulasilamama_neden||'').startsWith('Arama Yapılmadı (SLA'));

  _aramaGecmisRender(ziyaretler||[], aramaTemiz, guncelVisitId);
}

function _aramaGecmisRender(ziyaretler, aramalar, guncelVisitId){
  const box=document.getElementById('aramaAnketGecmis');
  if(!box) return;
  const vSayi=ziyaretler.length, aSayi=aramalar.length;

  const vList = ziyaretler.length ? ziyaretler.map(v=>{
    const myAd = v.my_id?(myIdToName[v.my_id]||('MY#'+v.my_id)):'—';
    const guncel = (v.visit_id===guncelVisitId) ? ' <span style="color:var(--blue);">(bu görev)</span>' : '';
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;gap:6px;">
        <span style="font-weight:600;">${escapeHTML(v.temas_turu||'Temas')}${guncel}</span>
        <span style="color:var(--text3);white-space:nowrap;">${v.tarih_saat?fmtDate(v.tarih_saat):'—'}</span>
      </div>
      <div style="color:var(--text2);">${escapeHTML(myAd)}${v.ziyaret_amaci?(' · '+escapeHTML(v.ziyaret_amaci)):''}</div>
      ${v.ziyaret_sonucu?`<div style="color:var(--text3);">${escapeHTML(v.ziyaret_sonucu)}</div>`:''}
    </div>`;
  }).join('') : '<div style="color:var(--text3);padding:6px 0;">Bu firmaya kayıtlı başka ziyaret yok.</div>';

  const aList = aramalar.length ? aramalar.map(s=>{
    const agentAd = s.agent_id?(myIdToName[s.agent_id]||('#'+s.agent_id)):'—';
    let ozet, renk='var(--text2)';
    if(s.ulasildi===false){ ozet='Ulaşılamadı'+(s.ulasilamama_neden?(' ('+s.ulasilamama_neden+')'):''); }
    else if(s.ulasildi===true){
      const p=[];
      if(s.ziyaret_dogrulandi) p.push('Ziyaret: '+s.ziyaret_dogrulandi);
      if(s.memnuniyet!=null) p.push('Memnuniyet '+s.memnuniyet+'/5');
      if(s.guven==='Hayır') p.push('Güven yok');
      if(s.sikayet_var) p.push('Şikayet var');
      ozet=p.join(' · ')||'Ulaşıldı';
      if(s.ziyaret_dogrulandi==='Hayır'||s.sikayet_var) renk='var(--red)';
      else if(s.ziyaret_dogrulandi==='Emin değil') renk='var(--amber)';
    } else { ozet='Aramadan kapatıldı'+(s.ulasilamama_neden?(' ('+s.ulasilamama_neden.replace('Aramadan Kapatıldı: ','')+')'):''); }
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;gap:6px;">
        <span style="font-weight:600;">☎ ${escapeHTML(agentAd)}</span>
        <span style="color:var(--text3);white-space:nowrap;">${s.created_at?fmtDate(s.created_at):'—'}</span>
      </div>
      <div style="color:${renk};">${escapeHTML(ozet)}</div>
      ${s.agent_notu?`<div style="color:var(--text3);">${escapeHTML(s.agent_notu)}</div>`:''}
    </div>`;
  }).join('') : '<div style="color:var(--text3);padding:6px 0;">Bu firmaya daha önce teyit araması yapılmamış.</div>';

  box.innerHTML = `
    <div class="chip-btn" style="width:100%;text-align:center;" onclick="_aramaGecmisToggle()">
      📋 Firma geçmişi — ${vSayi} ziyaret · ${aSayi} arama <span id="aramaGecmisOkSpan">▾</span>
    </div>
    <div id="aramaGecmisIcerik" class="hide" style="max-height:32vh;overflow-y:auto;background:var(--navy3);border-radius:8px;padding:8px 10px;margin-top:6px;font-size:12px;">
      <div style="font-weight:700;margin-bottom:2px;">Ziyaretler (${vSayi})</div>
      ${vList}
      <div style="font-weight:700;margin:10px 0 2px;">Önceki Teyit Aramaları (${aSayi})</div>
      ${aList}
    </div>`;
}

function _aramaGecmisToggle(){
  const el=document.getElementById('aramaGecmisIcerik');
  const ok=document.getElementById('aramaGecmisOkSpan');
  if(!el) return;
  el.classList.toggle('hide');
  if(ok) ok.textContent = el.classList.contains('hide') ? '▾' : '▴';
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

// ============================================================
// 5a: ÇAĞRI ANALİZİ (filtreli liste) — yetki: arama_rapor (kapsam bazlı)
// ============================================================
const ANALIZ_KAT = [
  {k:'aranacak',     ad:'Henüz aranmamış', kaynak:'task'},
  {k:'tekrar',       ad:'Tekrar aranacak', kaynak:'task'},
  {k:'ulasilamayan', ad:'Ulaşılamayan',    kaynak:'sonuc'},
  {k:'sahte',        ad:'Sahte ziyaret',   kaynak:'sonuc'},
  {k:'supheli',      ad:'Şüpheli',         kaynak:'sonuc'},
  {k:'memnuniyetsiz',ad:'Memnuniyetsiz',   kaynak:'sonuc'},
  {k:'sikayet',      ad:'Şikayetli',       kaynak:'sonuc'},
  {k:'yuzyuze',      ad:'Yüz yüze uyuşmazlık', kaynak:'sonuc'},
  {k:'tamamlanan',   ad:'Tamamlanan',      kaynak:'task'},
  {k:'aramadan',     ad:'Aramadan kapatılan', kaynak:'task'}
];

async function _analizIzinMyList(){
  const scope=(typeof getScope==='function')?getScope('arama_rapor'):'TÜM';
  if(scope==='TÜM') return null;               // tüm veri
  const {data}=await sb.from('users').select('my_id').eq('kcm_id',currentUser.kcm_id);
  return (data||[]).map(u=>u.my_id);
}
function _analizOzet(k,r){
  if(k==='ulasilamayan') return 'Ulaşılamadı'+(r.ulasilamama_neden?(' ('+r.ulasilamama_neden+')'):'');
  if(k==='sahte')        return 'Sahte ziyaret şüphesi';
  if(k==='supheli')      return 'Ziyaret: Emin değil';
  if(k==='memnuniyetsiz')return 'Memnuniyet '+(r.memnuniyet??'-')+'/5'+(r.guven==='Hayır'?' · güven yok':'');
  if(k==='sikayet')      return 'Şikayet var';
  if(k==='yuzyuze')      return 'Yüz yüze uyuşmazlık';
  return '';
}
function _analizKat(k){
  ARAMA.analiz.kat=k;
  document.querySelectorAll('#aramaFiltre .chip-btn[data-kat]').forEach(c=>c.classList.toggle('selected',c.getAttribute('data-kat')===k));
  loadAramaAnaliz();
}

async function loadAramaAnaliz(){
  ARAMA.analiz = ARAMA.analiz || {kat:'sahte',bas:'',bit:''};
  const g=document.getElementById('aramaListeGovde'); const fEl=document.getElementById('aramaFiltre');
  if(!g) return;
  const typeId=await _aramaTeyitTypeId();
  if(fEl && !fEl.dataset.ready){
    fEl.innerHTML=`
      <div class="chip-grid-box" style="margin-bottom:8px;">${ANALIZ_KAT.map(c=>`<div class="chip-btn${ARAMA.analiz.kat===c.k?' selected':''}" data-kat="${c.k}" onclick="_analizKat('${c.k}')">${c.ad}</div>`).join('')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <input type="date" id="analizBas" value="${ARAMA.analiz.bas}" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
        <input type="date" id="analizBit" value="${ARAMA.analiz.bit}" style="flex:1;min-width:120px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:8px;">
        <button class="btn btn-sm" style="background:var(--blue);" onclick="loadAramaAnaliz()">Uygula</button></div>
      <div class="chip-btn" style="width:100%;text-align:center;margin-bottom:10px;" onclick="_aramaKirilimToggle()">
        📈 MY Kırılım / Liderlik Tablosu <span id="aramaKirilimOk">▾</span>
      </div>
      <div id="aramaKirilimIcerik" class="hide" style="max-height:44vh;overflow-y:auto;background:var(--navy3);border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:12px;"></div>`;
    fEl.dataset.ready='1';
  }
  ARAMA.analiz.bas=document.getElementById('analizBas')?.value||'';
  ARAMA.analiz.bit=document.getElementById('analizBit')?.value||'';
  const bas=ARAMA.analiz.bas, bit=ARAMA.analiz.bit;
  const kat=ANALIZ_KAT.find(c=>c.k===ARAMA.analiz.kat)||ANALIZ_KAT[3];
  g.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  _aramaKirilimRender(); // v31.22: liste ile paralel, sonucu beklemeden hesaplanır
  const izinMy=await _analizIzinMyList();
  let rows=[];

  if(kat.kaynak==='sonuc'){
    let q=sb.from('arama_sonuclari').select('task_id,ncst,my_id,ulasildi,ulasilamama_neden,ziyaret_dogrulandi,memnuniyet,guven,sikayet_var,yuzyuze_uyusmazlik,created_at').order('created_at',{ascending:false}).limit(500);
    if(kat.k==='ulasilamayan') q=q.eq('ulasildi',false);
    else if(kat.k==='sahte')   q=q.eq('ziyaret_dogrulandi','Hayır');
    else if(kat.k==='supheli') q=q.eq('ziyaret_dogrulandi','Emin değil');
    else if(kat.k==='sikayet') q=q.eq('sikayet_var',true);
    else if(kat.k==='yuzyuze') q=q.eq('yuzyuze_uyusmazlik',true);
    else if(kat.k==='memnuniyetsiz') q=q.or('memnuniyet.lte.2,guven.eq.Hayır');
    if(bas) q=q.gte('created_at',bas+'T00:00:00');
    if(bit) q=q.lte('created_at',bit+'T23:59:59');
    if(izinMy) q=q.in('my_id',izinMy);
    const {data}=await q;
    rows=(data||[]).map(r=>({ncst:r.ncst,my_id:r.my_id,tarih:r.created_at,ozet:_analizOzet(kat.k,r)}));
  } else {
    const durumlar = kat.k==='aranacak'?['Aranacak','Tekrar Aranacak']
      :(kat.k==='tekrar'?['Tekrar Aranacak']
      :(kat.k==='tamamlanan'?['Tamamlandı']:['Aramadan Kapatıldı']));
    let q=sb.from('tasks').select('task_id,ncst,visit_id,durum,deadline').eq('type_id',typeId).in('durum',durumlar).order('deadline',{ascending:false}).limit(500);
    if(bas) q=q.gte('deadline',bas);
    if(bit) q=q.lte('deadline',bit);
    const {data}=await q;
    let list=data||[];
    const vIds=[...new Set(list.map(t=>t.visit_id).filter(Boolean))];
    const vMap={}; if(vIds.length){ const {data:vs}=await sb.from('visits').select('visit_id,my_id').in('visit_id',vIds); (vs||[]).forEach(v=>vMap[v.visit_id]=v.my_id); }
    list.forEach(t=>t._my=vMap[t.visit_id]||null);
    if(izinMy) list=list.filter(t=>izinMy.includes(t._my));
    rows=list.map(t=>({ncst:t.ncst,my_id:t._my,tarih:t.deadline,ozet:t.durum}));
  }

  const ncstList=[...new Set(rows.map(r=>r.ncst).filter(Boolean))];
  const unvanMap={}; if(ncstList.length){ const {data}=await sb.from('customers').select('ncst,unvan').in('ncst',ncstList); (data||[]).forEach(c=>unvanMap[c.ncst]=c.unvan); }
  if(!rows.length){ g.innerHTML='<div class="empty">Bu filtreye uyan kayıt yok.</div>'; return; }
  g.innerHTML=`<div style="font-size:12px;color:var(--text3);margin-bottom:8px;">${rows.length} kayıt · ${escapeHTML(kat.ad)}</div>`+
    rows.map(r=>`<div class="visit-card"><div class="visit-firm">${escapeHTML(unvanMap[r.ncst]||r.ncst||'—')}</div>
      <div class="visit-my">MY: ${escapeHTML(r.my_id?(myIdToName[r.my_id]||('#'+r.my_id)):'—')} · ${r.tarih?fmtDate(r.tarih):'—'}</div>
      <div class="visit-my" style="color:var(--amber);">${escapeHTML(r.ozet||'')}</div></div>`).join('');
}

// ============================================================
// 5b: MY KIRILIM / LİDERLİK TABLOSU (Çağrı Analizi'nin tarih aralığını kullanır)
//   • En çok yanlış numara (MY bazında)
//   • En temiz veri (yanlış numara + ulaşılamayan + sahte/şüpheli oranı en düşük)
//   • KÇM bazlı ziyaret memnuniyet skoru — en yüksek/düşük 3'er MY
// ============================================================
function _aramaKirilimToggle(){
  const el=document.getElementById('aramaKirilimIcerik');
  const ok=document.getElementById('aramaKirilimOk');
  if(!el) return;
  el.classList.toggle('hide');
  if(ok) ok.textContent = el.classList.contains('hide') ? '▾' : '▴';
}

async function _aramaKirilimVeriCek(){
  const bas=ARAMA.analiz?.bas, bit=ARAMA.analiz?.bit;
  const izinMy=await _analizIzinMyList(); // null=TÜM, aksi halde kendi KÇM'sindeki my_id listesi
  let q=sb.from('arama_sonuclari').select('my_id,ulasildi,ulasilamama_neden,ziyaret_dogrulandi,memnuniyet,created_at').not('my_id','is',null).limit(5000);
  if(bas) q=q.gte('created_at',bas+'T00:00:00');
  if(bit) q=q.lte('created_at',bit+'T23:59:59');
  if(!bas && !bit){ const d=new Date(); d.setDate(d.getDate()-90); q=q.gte('created_at', d.toISOString().slice(0,10)+'T00:00:00'); }
  if(izinMy) q=q.in('my_id',izinMy);
  const {data}=await q;
  return data||[];
}

function _aramaKirilimAgg(rows){
  const map={};
  rows.forEach(r=>{
    const id=r.my_id; if(!map[id]) map[id]={toplam:0,yanlisNo:0,sorunlu:0,memnSum:0,memnCount:0};
    const m=map[id];
    m.toplam++;
    if(r.ulasilamama_neden==='Yanlış numara') m.yanlisNo++;
    if(r.ulasildi===false || r.ziyaret_dogrulandi==='Hayır' || r.ziyaret_dogrulandi==='Emin değil') m.sorunlu++;
    if(r.memnuniyet!=null){ m.memnSum+=r.memnuniyet; m.memnCount++; }
  });
  return map;
}

async function _aramaKirilimRender(){
  const box=document.getElementById('aramaKirilimIcerik');
  if(!box) return;
  box.innerHTML='<div style="color:var(--text3);padding:6px 0;">Hesaplanıyor…</div>';
  const rows=await _aramaKirilimVeriCek();
  if(!rows.length){ box.innerHTML='<div style="color:var(--text3);padding:6px 0;">Bu tarih aralığında arama kaydı yok.</div>'; return; }

  const agg=_aramaKirilimAgg(rows);
  const myIds=Object.keys(agg).map(Number);
  const [{data:users},{data:kcmler}]=await Promise.all([
    sb.from('users').select('my_id,ad_soyad,kcm_id').in('my_id',myIds),
    sb.from('kcm_groups').select('kcm_id,kcm_adi')
  ]);
  const userMap={}; (users||[]).forEach(u=>userMap[u.my_id]=u);
  const kcmAdMap={}; (kcmler||[]).forEach(k=>kcmAdMap[k.kcm_id]=k.kcm_adi);

  const MIN_ORNEK=3; // az sayıda arama olan MY'lerde oran/sıralama yanıltıcı olmasın diye eşik
  const list=myIds.map(id=>{
    const m=agg[id], u=userMap[id]||{};
    return {
      id, ad:u.ad_soyad||('MY#'+id), kcm_id:u.kcm_id,
      toplam:m.toplam, yanlisNo:m.yanlisNo,
      sorunOrani: m.toplam ? m.sorunlu/m.toplam : 0,
      memnOrt: m.memnCount ? (m.memnSum/m.memnCount) : null, memnCount:m.memnCount
    };
  });

  const satir=(x,deger,renk)=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);">
    <span>${escapeHTML(x.ad)}</span><span style="font-weight:700;${renk?('color:'+renk+';'):''}">${deger}</span></div>`;

  let h='';

  // 1) En çok yanlış numara
  const enCokYanlis=list.filter(x=>x.toplam>=MIN_ORNEK && x.yanlisNo>0).sort((a,b)=>b.yanlisNo-a.yanlisNo).slice(0,10);
  h+=`<div style="font-weight:700;margin-bottom:4px;">📵 En Çok Yanlış Numara <span style="font-weight:400;color:var(--text3);">(ilk 10, en az ${MIN_ORNEK} arama)</span></div>`;
  h+= enCokYanlis.length ? enCokYanlis.map(x=>satir(x, x.yanlisNo+' / '+x.toplam+' arama', 'var(--red)')).join('') : '<div style="color:var(--text3);padding:4px 0;">Kayıt yok.</div>';

  // 2) En temiz veri — genel sorun oranı (yanlış numara + ulaşılamayan + sahte/şüpheli) en düşük
  const enTemiz=list.filter(x=>x.toplam>=MIN_ORNEK).sort((a,b)=>a.sorunOrani-b.sorunOrani).slice(0,10);
  h+=`<div style="font-weight:700;margin:12px 0 4px;">✅ En Temiz Veri <span style="font-weight:400;color:var(--text3);">(ilk 10, en az ${MIN_ORNEK} arama, temiz oranı)</span></div>`;
  h+= enTemiz.length ? enTemiz.map(x=>satir(x, Math.round((1-x.sorunOrani)*100)+'%', 'var(--green)')).join('') : '<div style="color:var(--text3);padding:4px 0;">Kayıt yok.</div>';

  // 3) KÇM bazlı ziyaret memnuniyet skoru — en yüksek/düşük 3'er MY
  const kcmGruplar={};
  list.filter(x=>x.memnCount>=1 && x.kcm_id).forEach(x=>{ (kcmGruplar[x.kcm_id]=kcmGruplar[x.kcm_id]||[]).push(x); });
  h+=`<div style="font-weight:700;margin:12px 0 4px;">⭐ KÇM Bazlı Ziyaret Memnuniyeti — En Yüksek/Düşük 3</div>`;
  const kcmKeys=Object.keys(kcmGruplar).sort((a,b)=>(kcmAdMap[a]||'').localeCompare(kcmAdMap[b]||''));
  if(!kcmKeys.length){
    h+='<div style="color:var(--text3);padding:4px 0;">Kayıt yok.</div>';
  } else {
    kcmKeys.forEach(kid=>{
      const arr=kcmGruplar[kid].slice().sort((a,b)=>b.memnOrt-a.memnOrt);
      const top=arr.slice(0,3);
      h+=`<div style="font-weight:600;margin-top:8px;color:var(--text);">${escapeHTML(kcmAdMap[kid]||('KÇM#'+kid))}</div>`;
      h+='<div style="color:var(--green);font-size:11px;margin-top:2px;">En yüksek</div>';
      h+= top.map(x=>satir(x, x.memnOrt.toFixed(1)+'/5', 'var(--green)')).join('');
      if(arr.length>3){
        const bottom=arr.slice(-3).reverse();
        h+='<div style="color:var(--red);font-size:11px;margin-top:4px;">En düşük</div>';
        h+= bottom.map(x=>satir(x, x.memnOrt.toFixed(1)+'/5', 'var(--red)')).join('');
      }
    });
  }

  box.innerHTML=h;
}
