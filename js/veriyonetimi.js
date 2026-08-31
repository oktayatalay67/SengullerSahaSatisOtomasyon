// ============================================================
// veriyonetimi.js — v1.4.0  (2 sekme: Musteri + Kontak)
// Son güncelleme: 2026-08-26
// Değişiklikler:
//   v1.4.0 — (V31.43) B2: MY'ye Atama tam calisir. Secili MY dosyadaki tum
//            musteriye atanir (my_id enjeksiyon); mevcut portfoyden DUSEN (listede
//            olmayan) musteriler tespit edilir, istatistik gosterilir, istege bagli
//            baska MY/FMY'ye tasinir (2. secici). Diger alanlar da guncellenir.
//   v1.3.0 — (V31.42) B1: MY secici bileseni (isim/EXT ile ara -> my_id) +
//            3. sekme 'MY'ye Atama' iskeleti. Dosya/mutabakat B2'de gelecek.
//            (auth.js v1.2.19: window.userSecici saglar.)
//   v1.2.3 — (V31.41) Kontak: musteri_unvani dropdown'a eklendi (dosyadaki 'Musteri
//            Unvani'/'Firma Adi' kolonu eslenebilir). Doldurma onceligi: ncst'den
//            customers.unvan; yoksa dosyadaki deger. Boş birakilmaz. Mevcut kayitta
//            yalnizca DB bossa doldurulur (dolu unvan korunur).
//   v1.2.2 — (V31.40) Kontak 'Yeni Eklenecek' tablosuna 'Musteri Unvani' kolonu
//            eklendi (otomatik cekilen unvan artik onizlemede gorunur).
//   v1.2.1 — (V31.39) KONTAK: yeni/guncelleme kayitlarinda musteri_unvani artik
//            ncst'den customers.unvan ile OTOMATIK dolduruluyor (bossa doldur).
//   v1.2.0 — (V31.38) KONTAK sekmesi eklendi (contacts tablosu).
//     • Sekme bar: Musteri / Kontak. Musteri akisi AYNEN korundu.
//     • Kontak anahtari: ncst + ad_soyad (UNIQUE(ncst,ad_soyad)). Ayni kisi
//       gelince GUNCELLE (telefon/gorev/email). ad_soyad anahtar, guncellenmez.
//     • Kalite (veri_kalitesi.js): telefon telefonNormalize; email gecersizse
//       alan BOS gecilir (yazilmaz); ATLA kosulu = ad_soyad gecersiz AND telefon
//       gecersiz (ikisi de fake). Yeni kayit: dogrulandi=false, aktif=true.
//     • Satir secimi + sayfalama + detayli rapor MUSTERI ile ortak kod.
//   v1.1.0 — (V31.37) satir secimi + sayfali tablo + detayli rapor.
//   v1.0.0 — (V31.36) M3 yazma motoru.  v0.x — okuma/analiz/yetki.
// ============================================================
'use strict';

// ---- MOD TANIMLARI ----
window.VY_MODES = {
  musteri: {
    table:'customers', keyFields:['ncst'], reqNew:['unvan'], dogrulandiDefault:null, aktifDefault:true,
    schema:[['unvan','str'],['vergi_no','str'],['my_id','int'],['kayit_tarihi','ts'],['kcm_id','int'],['sektor','str'],['il','str'],['ilce','str'],['musteri_tipi','str'],['churn_riski','str'],['toplam_hat','int'],['aktif','bool'],['beyaz_yakali_sayi','int'],['sube_lokasyon','bool'],['sube_detay','str'],['sunucu_altyapisi','bool'],['sunucu_detay','str'],['it_ekibi','bool'],['it_ekip_sayisi','int'],['firewall_kullanimi','bool'],['firewall_detay','str'],['profil_tamamlandi','bool'],['adres','str'],['telefon','str'],['enlem','num'],['boylam','num'],['guncelleme_tarihi','ts'],['bolge_id','int']],
    fk:{ my_id:{tbl:'users',col:'my_id'}, kcm_id:{tbl:'kcm_groups',col:'kcm_id'}, bolge_id:{tbl:'bolgeler',col:'bolge_id'} },
    dict:{'NCST':'ncst','UNVAN':'unvan','FIRMA ADI':'unvan','FIRMA':'unvan','MUSTERI':'unvan','VERGI NO':'vergi_no','VKN':'vergi_no','MY ID':'my_id','KCM ID':'kcm_id','SEKTOR':'sektor','IL':'il','SEHIR':'il','ILCE':'ilce','MUSTERI TIPI':'musteri_tipi','ADRES':'adres','TELEFON':'telefon','TEL':'telefon','ENLEM':'enlem','BOYLAM':'boylam','BOLGE':'bolge_id','BOLGE ID':'bolge_id','KOD':'bolge_id'},
    kontakKurallari:false,
    ipucu:'Ilk kolon <b>ncst</b> olmali. Anahtar: ncst.'
  },
  kontak: {
    table:'contacts', keyFields:['ncst','ad_soyad'], reqNew:['ad_soyad'], dogrulandiDefault:false, aktifDefault:true,
    schema:[['ad_soyad','str'],['gorev_unvani','str'],['telefon','str'],['email','str'],['aktif','bool'],['musteri_unvani','str']],
    fk:{},
    dict:{'NCST':'ncst','AD SOYAD':'ad_soyad','ADSOYAD':'ad_soyad','AD-SOYAD':'ad_soyad','YETKILI':'ad_soyad','YETKILI KISI':'ad_soyad','YETKILI ISIM':'ad_soyad','ISIM':'ad_soyad','KISI':'ad_soyad','GOREV':'gorev_unvani','UNVAN':'gorev_unvani','GOREV UNVANI':'gorev_unvani','YETKI TIPI':'gorev_unvani','GOREV TIPI':'gorev_unvani','TELEFON':'telefon','TEL':'telefon','GSM':'telefon','CEP':'telefon','EMAIL':'email','E POSTA':'email','EPOSTA':'email','MAIL':'email','MUSTERI UNVANI':'musteri_unvani','MUSTERI UNVAN':'musteri_unvani','FIRMA ADI':'musteri_unvani','FIRMA UNVANI':'musteri_unvani','FIRMA':'musteri_unvani'},
  },
  atama: {
    table:'customers', keyFields:['ncst'], reqNew:['unvan'], dogrulandiDefault:null, aktifDefault:true, atamaMode:true,
    schema:[['unvan','str'],['vergi_no','str'],['kayit_tarihi','ts'],['kcm_id','int'],['sektor','str'],['il','str'],['ilce','str'],['musteri_tipi','str'],['churn_riski','str'],['toplam_hat','int'],['aktif','bool'],['beyaz_yakali_sayi','int'],['sube_lokasyon','bool'],['sube_detay','str'],['sunucu_altyapisi','bool'],['sunucu_detay','str'],['it_ekibi','bool'],['it_ekip_sayisi','int'],['firewall_kullanimi','bool'],['firewall_detay','str'],['profil_tamamlandi','bool'],['adres','str'],['telefon','str'],['enlem','num'],['boylam','num'],['guncelleme_tarihi','ts'],['bolge_id','int']],
    fk:{ kcm_id:{tbl:'kcm_groups',col:'kcm_id'}, bolge_id:{tbl:'bolgeler',col:'bolge_id'} },
    dict:{'NCST':'ncst','UNVAN':'unvan','FIRMA ADI':'unvan','FIRMA':'unvan','VERGI NO':'vergi_no','VKN':'vergi_no','SEKTOR':'sektor','IL':'il','SEHIR':'il','ILCE':'ilce','MUSTERI TIPI':'musteri_tipi','ADRES':'adres','TELEFON':'telefon','TEL':'telefon','ENLEM':'enlem','BOYLAM':'boylam','BOLGE':'bolge_id','BOLGE ID':'bolge_id','KOD':'bolge_id'},
    kontakKurallari:false,
    ipucu:'Secili MY/FMY icin musteri listesi. Ilk kolon <b>ncst</b>. Listedeki tum musteriler secili MYye atanir; diger alanlar da guncellenir.'
  }
};
var VY_PAGE=100;
window.VY = { mode:'musteri', fileName:'', headers:[], rows:[], raw:[], mapping:[], analiz:null, nullSet:null, secim:null, pagers:{} };
function vyCfg(){ return VY_MODES[VY.mode]; }
function vyType(f){ const s=vyCfg().schema.find(x=>x[0]===f); return s?s[1]:'str'; }

function openVeriYonetimi(){ if(!hasPerm('veri_yonetimi')){ toast('Bu ekran icin yetkiniz yok','error'); return; } vyReset('musteri'); navTo('pageVeriYonetimi'); vyTabStyle(); }
function vyReset(mode){
  window.VY = { mode:mode||VY.mode||'musteri', fileName:'', headers:[], rows:[], raw:[], mapping:[], analiz:null, nullSet:null, secim:null, pagers:{} };
  ['vyInfo','vyMapping','vyAnalizSonuc','vyPreview'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=''; });
  const fi=document.getElementById('vyFile'); if(fi) fi.value='';
  const btn=document.getElementById('vyOkuBtn'); if(btn) btn.disabled=true;
  const ip=document.getElementById('vyIpucu'); if(ip) ip.innerHTML=vyCfg().ipucu;
}
function vyTab(mode){
  if(mode==='atama'){
    VY.mode='atama'; vyTabStyle();
    const np=document.getElementById('vyNormalPanel'); if(np) np.style.display='none';
    const ap=document.getElementById('vyAtamaPanel'); if(ap){ ap.style.display=''; vyAtamaInit(); }
    return;
  }
  const ap=document.getElementById('vyAtamaPanel'); if(ap) ap.style.display='none';
  const np=document.getElementById('vyNormalPanel'); if(np) np.style.display='';
  vyReset(mode); vyTabStyle();
}
function vyTabStyle(){
  ['musteri','kontak','atama'].forEach(m=>{ const b=document.getElementById('vyTab_'+m); if(b){ const on=VY.mode===m; b.style.background=on?'#34d399':'var(--bg2)'; b.style.color=on?'#062':'var(--text2)'; b.style.fontWeight=on?'700':'500'; } });
  const ip=document.getElementById('vyIpucu'); if(ip && VY.mode!=='atama') ip.innerHTML=vyCfg().ipucu;
}

// ============================================================
// MY SECICI — yeniden kullanilabilir (isim veya EXT ile ara -> my_id)
// ============================================================
window._vySeciciCb = window._vySeciciCb || {};
function vyMySeciciRender(containerId, onSelect, placeholder){
  const box=document.getElementById(containerId); if(!box) return;
  window._vySeciciCb[containerId]=onSelect;
  box.innerHTML='<input type="text" id="'+containerId+'_inp" oninput="vyMySeciciFiltre(\''+containerId+'\')" placeholder="'+(placeholder||'MY ara: isim veya EXT...')+'" autocomplete="off" style="width:100%;max-width:420px;padding:9px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg);color:var(--text);font-size:14px;">'
    +'<div id="'+containerId+'_res" style="max-width:420px;margin-top:4px;"></div>'
    +'<div id="'+containerId+'_sec" style="margin-top:8px;"></div>';
}
function vyMySeciciFiltre(containerId){
  const inp=document.getElementById(containerId+'_inp'); const res=document.getElementById(containerId+'_res');
  if(!inp||!res) return;
  const raw=inp.value.trim(); if(raw.length<1){ res.innerHTML=''; return; }
  const q=vyNorm(raw); const qLow=raw.toLowerCase();
  const list=(window.userSecici||[]).filter(u=>{
    const nad=vyNorm(u.ad_soyad); const ext=(u.ext_kod||'').toLowerCase();
    return nad.indexOf(q)>=0 || (ext && ext.indexOf(qLow)>=0);
  }).sort((a,b)=>a.ad_soyad.localeCompare(b.ad_soyad,'tr')).slice(0,25);
  if(!list.length){ res.innerHTML='<div style="padding:8px;color:var(--text2);font-size:12px;">Eslesme yok.</div>'; return; }
  res.innerHTML='<div style="max-height:320px;overflow:auto;border:1px solid var(--line);border-radius:9px;">'+list.map(u=>'<div class="vy-sec-row" onclick="vyMySeciciPick(\''+containerId+'\','+u.my_id+')" onmouseover="this.style.background=\'rgba(52,211,153,.15)\'" onmouseout="this.style.background=\'transparent\'" style="padding:9px 11px;cursor:pointer;border-bottom:1px solid var(--line);background:transparent;font-size:13px;">'
    +'<b>'+escapeHTML(u.ad_soyad)+'</b> <span style="color:var(--text2);font-size:11px;">'+escapeHTML(u.rol||'')+(u.kcm_id?(' · KCM '+u.kcm_id):'')+'</span>'
    +(u.ext_kod?'<span style="color:#60a5fa;font-size:11px;float:right;">'+escapeHTML(u.ext_kod)+'</span>':'')+'</div>').join('')+'</div>';
}
function vyMySeciciPick(containerId, myId){
  const u=(window.userSecici||[]).find(x=>x.my_id===myId); if(!u) return;
  const res=document.getElementById(containerId+'_res'); if(res) res.innerHTML='';
  const inp=document.getElementById(containerId+'_inp'); if(inp) inp.value='';
  const sec=document.getElementById(containerId+'_sec');
  if(sec) sec.innerHTML='<div style="padding:8px 12px;background:rgba(52,211,153,.12);border:1px solid #34d399;border-radius:9px;font-size:13px;">Secildi: <b>'+escapeHTML(u.ad_soyad)+'</b> <span style="color:var(--text2);">('+escapeHTML(u.rol||'')+', my_id='+u.my_id+(u.ext_kod?(', '+escapeHTML(u.ext_kod)):'')+')</span> <button onclick="vyMySeciciClear(\''+containerId+'\')" style="margin-left:8px;font-size:11px;padding:2px 8px;">Degistir</button></div>';
  const cb=window._vySeciciCb[containerId]; if(cb) cb(u);
}
function vyMySeciciClear(containerId){ const sec=document.getElementById(containerId+'_sec'); if(sec) sec.innerHTML=''; const cb=window._vySeciciCb[containerId]; if(cb) cb(null); }

// ============================================================
// MY'YE ATAMA sekmesi (B1: secici iskeleti — dosya/analiz B2'de)
// ============================================================
window.VYATAMA = window.VYATAMA || { selectedMy:null };
function vyAtamaInit(){
  const box=document.getElementById('vyAtamaPanel'); if(!box) return;
  VYATAMA.selectedMy=null;
  box.innerHTML='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px;">'
    +'<div style="font-weight:700;margin-bottom:6px;">1. Adim: MY/FMY Sec</div>'
    +'<div style="font-size:12px;color:var(--text2);margin-bottom:10px;">Isim veya EXT kodu yazarak ara. my_id bilmene gerek yok.</div>'
    +'<div id="vyAtamaSecici"></div></div>'
    +'<div id="vyAtamaSonraki"></div>';
  vyMySeciciRender('vyAtamaSecici', function(u){
    VYATAMA.selectedMy=u;
    const nx=document.getElementById('vyAtamaSonraki');
    const np=document.getElementById('vyNormalPanel');
    if(u){
      nx.innerHTML='<div style="background:rgba(52,211,153,.10);border:1px solid #34d399;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:13px;">2. Adim: <b>'+escapeHTML(u.ad_soyad)+'</b> icin musteri listesini yukle. Listedeki tum musteriler bu kisiye atanacak.</div>';
      // normal dosya akisini atama modunda ac (ayni container'lar)
      if(np){ np.style.display=''; }
      vyResetNormalOnly();
      const ip=document.getElementById('vyIpucu'); if(ip) ip.innerHTML=vyCfg().ipucu;
    } else { nx.innerHTML=''; if(np) np.style.display='none'; }
  }, 'MY/FMY ara: isim veya EXT...');
}
// atama modunda dosya akisini sifirla (mode='atama' korunur)
function vyResetNormalOnly(){
  VY.fileName=''; VY.headers=[]; VY.rows=[]; VY.raw=[]; VY.mapping=[]; VY.analiz=null; VY.nullSet=null; VY.secim=null; VY.pagers={};
  ['vyInfo','vyMapping','vyAnalizSonuc','vyPreview'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=''; });
  const fi=document.getElementById('vyFile'); if(fi) fi.value='';
  const btn=document.getElementById('vyOkuBtn'); if(btn) btn.disabled=true;
}
function vyFileSelected(){ const fi=document.getElementById('vyFile'), btn=document.getElementById('vyOkuBtn'); if(btn) btn.disabled=!(fi&&fi.files&&fi.files.length); }

function vyNorm(s){ return String(s==null?'':s).replace(/\u0130/g,'I').replace(/\u0131/g,'i').replace(/\u015E/g,'S').replace(/\u015F/g,'s').replace(/\u011E/g,'G').replace(/\u011F/g,'g').replace(/\u00DC/g,'U').replace(/\u00FC/g,'u').replace(/\u00D6/g,'O').replace(/\u00F6/g,'o').replace(/\u00C7/g,'C').replace(/\u00E7/g,'c').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim(); }
function vyAutoField(header, idx){ if(idx===0) return 'ncst'; return vyCfg().dict[vyNorm(header)] || ''; }

async function vyOku(){
  const fi=document.getElementById('vyFile');
  if(!fi||!fi.files||!fi.files.length){ toast('Once dosya secin','error'); return; }
  const file=fi.files[0], ext=(file.name.split('.').pop()||'').toLowerCase();
  const info=document.getElementById('vyInfo'); if(info) info.textContent='Okunuyor...';
  try{
    let aoa;
    if(ext==='csv'){ const wb=XLSX.read(await file.text(),{type:'string'}); aoa=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false}); }
    else if(ext==='xlsx'||ext==='xls'){ const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}); aoa=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false}); }
    else { toast('Sadece .xlsx, .xls veya .csv','error'); if(info) info.textContent=''; return; }
    if(!aoa||!aoa.length){ toast('Dosya bos','error'); if(info) info.textContent=''; return; }
    const headers=(aoa[0]||[]).map(h=>String(h==null?'':h).trim());
    const rows=aoa.slice(1).filter(r=>r.some(c=>String(c==null?'':c).trim().length>0));
    const mapping=headers.map((h,i)=>vyAutoField(h,i));
    VY.fileName=file.name; VY.headers=headers; VY.rows=rows; VY.raw=aoa; VY.mapping=mapping; VY.analiz=null; VY.nullSet=null; VY.secim=null; VY.pagers={};
    if(info) info.innerHTML='<b>'+escapeHTML(file.name)+'</b> — '+rows.length+' satir, '+headers.length+' kolon.';
    vyRenderPreview(headers, rows); vyRenderMapping(); document.getElementById('vyAnalizSonuc').innerHTML='';
  }catch(e){ console.error(e); toast('Dosya okunamadi: '+(e.message||e),'error'); if(info) info.textContent=''; }
}

function vyRenderMapping(){
  const box=document.getElementById('vyMapping'); if(!box) return;
  const optArr=['<option value="">(kullanma)</option>'].concat(vyCfg().schema.map(x=>'<option value="'+x[0]+'">'+x[0]+'</option>'));
  let h='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px;"><div style="font-weight:700;margin-bottom:10px;">Kolon Esleme</div><div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px 12px;align-items:center;font-size:13px;">';
  VY.headers.forEach((hd,i)=>{ const sel=VY.mapping[i]||'';
    h+='<div style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(escapeHTML(hd)||('Kolon '+(i+1)))+'</div><div style="color:var(--text2);">&rarr;</div>';
    if(i===0){ h+='<div><b style="color:var(--green);">ncst</b> <span style="font-size:11px;color:var(--text2);">(kilitli)</span></div>'; }
    else{ const opts=optArr.map(o=>{const val=o.match(/value="([^"]*)"/)[1];return val===sel?o.replace('>','  selected>'):o;}).join('');
      h+='<select onchange="VY.mapping['+i+']=this.value" style="padding:5px 8px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--line);font-size:12px;">'+opts+'</select>'; } });
  h+='</div><div style="margin-top:12px;display:flex;gap:8px;align-items:center;"><button class="btn-primary" onclick="vyAnaliz()" style="padding:8px 16px;font-size:13px;">Analiz Et</button><span id="vyAnalizProg" style="font-size:12px;color:var(--text2);"></span></div></div>';
  box.innerHTML=h;
}

function vyNull(v){ const s=String(v==null?'':v).trim(); return s.length?s:null; }
function vyBool(v){ const s=vyNorm(v); if(s==='') return null; if(['TRUE','1','EVET','VAR','X','DOGRU','E','Y','YES'].indexOf(s)>=0) return true; if(['FALSE','0','HAYIR','YOK','YANLIS','H','N','NO'].indexOf(s)>=0) return false; return null; }
function vyNum(v){ const s=String(v==null?'':v).replace(',','.').trim(); if(!s) return null; const n=Number(s); return isNaN(n)?null:n; }
function vyInt(v){ const n=vyNum(v); return n===null?null:Math.trunc(n); }
function vyCast(f,v){ const t=vyType(f); if(t==='bool') return vyBool(v); if(t==='int') return vyInt(v); if(t==='num') return vyNum(v); return vyNull(v); }
function vyCastDb(f,v){ const t=vyType(f); if(t==='bool') return (v==null)?null:!!v; if(t==='int') return (v==null||v==='')?null:Math.trunc(Number(v)); if(t==='num') return (v==null||v==='')?null:Number(v); return (v==null||String(v).trim()==='')?null:String(v).trim(); }

// kontak: telefon normalize + gecerlilik (veri_kalitesi.js)
function vyTel(v){ if(typeof telefonNormalize==='function'){ const n=telefonNormalize(v); return n||null; } return vyNull(v); }
function vyTelGecerli(v){ if(typeof telefonGecerli==='function') return telefonGecerli(v).ok; const n=vyTel(v); return !!(n&&n.length===10&&n[0]==='5'); }
function vyAdGecerli(v){ if(typeof adSoyadGecerli==='function') return adSoyadGecerli(v).ok; return !!vyNull(v); }
function vyEmailGecerli(v){ if(!vyNull(v)) return false; if(typeof emailGecerli==='function') return emailGecerli(v).ok; return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }

async function vyAnaliz(){
  const cfg=vyCfg();
  const mapped=[]; VY.mapping.forEach((f,i)=>{ if(f && i!==0) mapped.push({idx:i, field:f}); });
  if(!VY.rows.length){ toast('Veri yok','error'); return; }
  // kontak: ad_soyad eslenmeli
  if(cfg.kontakKurallari && !mapped.some(m=>m.field==='ad_soyad')){ toast('Kontak icin ad_soyad kolonu eslenmeli','error'); return; }
  const prog=document.getElementById('vyAnalizProg'); const sonuc=document.getElementById('vyAnalizSonuc'); sonuc.innerHTML='';
  const fileNcst=[], seen={}; VY.rows.forEach(r=>{ const n=vyNull(r[0]); if(n && !seen[n]){ seen[n]=1; fileNcst.push(n); } });
  const selSet={}; cfg.keyFields.forEach(f=>selSet[f]=1); mapped.forEach(m=>selSet[m.field]=1); selSet['ncst']=1;
  if(cfg.kontakKurallari) selSet['musteri_unvani']=1; // otomatik unvan icin mevcut deger
  if(cfg.atamaMode) selSet['my_id']=1; // mevcut MY'yi bilmek icin
  const selStr=Object.keys(selSet).join(',');
  // mevcut kayitlari ncst ile cek
  const dbRows=[], total=fileNcst.length;
  try{ for(let i=0;i<total;i+=100){ const chunk=fileNcst.slice(i,i+100); const res=await sb.from(cfg.table).select(selStr).in('ncst',chunk); if(res.error) throw res.error; (res.data||[]).forEach(row=>dbRows.push(row)); if(prog) prog.textContent='Analiz ediliyor... '+Math.min(total,i+100)+'/'+total; } }
  catch(e){ console.error(e); toast('Analiz hatasi: '+(e.message||e),'error'); if(prog) prog.textContent=''; return; }
  if(prog) prog.textContent='';
  // anahtar map
  const keyOf=(o)=>cfg.keyFields.map(f=> f==='ad_soyad' ? vyNorm(o.ad_soyad) : String(o.ncst==null?'':o.ncst) ).join('||');
  const dbMap={}; dbRows.forEach(row=>{ dbMap[keyOf(row)]=row; });

  // KONTAK: her ncst icin customers.unvan (otomatik musteri_unvani icin)
  const custUnvan={};
  if(cfg.kontakKurallari){
    if(prog) prog.textContent='Musteri unvanlari cekiliyor...';
    try{ for(let i=0;i<fileNcst.length;i+=100){ const chunk=fileNcst.slice(i,i+100);
        const res=await sb.from('customers').select('ncst,unvan').in('ncst',chunk); if(res.error) throw res.error;
        (res.data||[]).forEach(r=>{ const u=vyNull(r.unvan); if(u) custUnvan[String(r.ncst)]=u; }); } }
    catch(e){ console.error(e); toast('Musteri unvani cekilemedi: '+(e.message||e),'error'); }
    if(prog) prog.textContent='';
  }

  const G={guncelle:[], yeni:[], bosonay:[], atla:[], degismez:0};
  const adMap=mapped.filter(m=>m.field==='ad_soyad')[0];
  const unvanMap=mapped.filter(m=>m.field==='unvan')[0];

  VY.rows.forEach(r=>{
    const ncst=vyNull(r[0]);
    // kontak fake kontrolu
    if(cfg.kontakKurallari){
      const adRaw=adMap?r[adMap.idx]:null;
      const telMap=mapped.filter(m=>m.field==='telefon')[0];
      const telRaw=telMap?r[telMap.idx]:null;
      const adOk=vyAdGecerli(adRaw), telOk=vyTelGecerli(telRaw);
      if(!adOk && !telOk){ G.atla.push({ncst:ncst||'(ncst yok)', islem:'ATLANDI', changes:[], sonuc:'ad_soyad ve telefon gecersiz (fake)'}); return; }
    }
    // anahtar
    const keyObj={ncst:ncst}; if(cfg.kontakKurallari && adMap) keyObj.ad_soyad=r[adMap.idx];
    const key=cfg.keyFields.map(f=> f==='ad_soyad' ? vyNorm(keyObj.ad_soyad) : String(ncst==null?'':ncst)).join('||');
    const db=dbMap[key];

    if(!db){ // YENI
      if(cfg.kontakKurallari){
        if(!adMap || !vyNull(r[adMap.idx])){ G.atla.push({ncst:ncst||'-', islem:'ATLANDI', changes:[], sonuc:'ad_soyad bos'}); return; }
        const obj={ ad_soyad: vyNull(r[adMap.idx]) };
        mapped.forEach(m=>{ if(m.field==='ad_soyad') return;
          if(m.field==='telefon'){ const t=vyTel(r[m.idx]); if(t) obj.telefon=t; }
          else if(m.field==='email'){ if(vyEmailGecerli(r[m.idx])) obj.email=vyNull(r[m.idx]); }
          else { const v=vyCast(m.field,r[m.idx]); if(v!==null) obj[m.field]=v; } });
        if(ncst && custUnvan[ncst]) obj.musteri_unvani=custUnvan[ncst]; // otomatik unvan
        G.yeni.push({ncst, unvan:obj.ad_soyad, obj});
      } else {
        const uv=unvanMap?vyNull(r[unvanMap.idx]):null;
        if(uv){ const obj={}; mapped.forEach(m=>{const v=vyCast(m.field,r[m.idx]); if(v!==null) obj[m.field]=v;}); if(cfg.atamaMode && VYATAMA.selectedMy) obj.my_id=VYATAMA.selectedMy.my_id; G.yeni.push({ncst, unvan:uv, obj}); }
        else G.atla.push({ncst:ncst||'-', islem:'ATLANDI', changes:[], sonuc:'Yeni kayit ama unvan bos'});
      }
      return;
    }
    // MEVCUT — karsilastir
    const changes=[], bos=[]; const dbKeyVals={ncst:db.ncst}; if(cfg.kontakKurallari) dbKeyVals.ad_soyad=db.ad_soyad;
    mapped.forEach(m=>{
      if(cfg.kontakKurallari && m.field==='ad_soyad') return; // anahtar, guncellenmez
      if(cfg.kontakKurallari && m.field==='musteri_unvani') return; // asagida ozel: bossa doldur
      if(cfg.kontakKurallari && m.field==='email'){ if(!vyEmailGecerli(r[m.idx])) return; const fv=vyNull(r[m.idx]); const dv=vyCastDb('email',db.email); if(fv!==dv) changes.push({field:'email',eski:dv,yeni:fv}); return; }
      if(cfg.kontakKurallari && m.field==='telefon'){ const fv=vyTel(r[m.idx]); const dv=vyCastDb('telefon',db.telefon); if(fv!==null && fv!==dv) changes.push({field:'telefon',eski:dv,yeni:fv}); else if(fv===null && dv!==null) bos.push({field:'telefon',eski:dv}); return; }
      const fileV=vyCast(m.field,r[m.idx]); const dbV=vyCastDb(m.field,db[m.field]);
      if(fileV===null){ if(dbV!==null) bos.push({field:m.field, eski:dbV}); } else if(fileV!==dbV){ changes.push({field:m.field, eski:dbV, yeni:fileV}); }
    });
    // ATAMA: secili MY farkliysa my_id degisikligi ekle
    if(cfg.atamaMode && VYATAMA.selectedMy){ const sel=VYATAMA.selectedMy.my_id; const dbMy=vyCastDb('int',db.my_id); if(dbMy!==sel) changes.push({field:'my_id', eski:dbMy, yeni:sel}); }
    // KONTAK: musteri_unvani DB'de bossa doldur — oncelik: ncst(customers) -> dosya
    if(cfg.kontakKurallari && vyNull(db.musteri_unvani)===null){
      const muMap=mapped.filter(m=>m.field==='musteri_unvani')[0];
      const fileMu=muMap?vyNull(r[muMap.idx]):null;
      const mu=(ncst && custUnvan[ncst]) ? custUnvan[ncst] : fileMu;
      if(mu) changes.push({field:'musteri_unvani', eski:'(bos)', yeni:mu});
    }
    if(changes.length) G.guncelle.push({ncst, changes, bos, keyVals:dbKeyVals}); else if(bos.length) G.bosonay.push({ncst, bos, keyVals:dbKeyVals}); else G.degismez++;
  });

  // ATAMA: DUSEN musteriler — DB'de secili MY'de olup listede OLMAYANlar
  if(cfg.atamaMode && VYATAMA.selectedMy){
    const sel=VYATAMA.selectedMy.my_id; const fset={}; fileNcst.forEach(n=>fset[n]=1); const dusen=[]; let from=0;
    if(prog) prog.textContent='Dusen musteriler hesaplaniyor...';
    try{ while(true){ const {data,error}=await sb.from('customers').select('ncst,unvan').eq('my_id',sel).range(from,from+999); if(error) throw error;
        (data||[]).forEach(rr=>{ if(!fset[String(rr.ncst)]) dusen.push({ncst:String(rr.ncst), unvan:rr.unvan||''}); }); if(!data||data.length<1000) break; from+=1000; } }
    catch(e){ console.error(e); }
    G.dusen=dusen; if(prog) prog.textContent='';
  }
  VYATAMA.dusenTargetMy=null;

  VY.analiz={ G, mapped, toplam:VY.rows.length, cfg };
  VY.nullSet=new Set();
  VY.secim={ guncelle:new Set(G.guncelle.map(r=>r.ncst+'||'+(r.keyVals&&r.keyVals.ad_soyad?vyNorm(r.keyVals.ad_soyad):''))), yeni:new Set(G.yeni.map((r,i)=>r.ncst+'||yeni'+i)) };
  // yeni icin index bazli id
  G.yeni.forEach((r,i)=>{ r._id=r.ncst+'||yeni'+i; }); G.guncelle.forEach(r=>{ r._id=r.ncst+'||'+(r.keyVals&&r.keyVals.ad_soyad?vyNorm(r.keyVals.ad_soyad):''); });
  vyRenderAnaliz(G, VY.rows.length);
}

function vyBosKey(id,field){ return id+'##'+field; }
function vyNullToggle(id,field,el){ const k=vyBosKey(id,field); if(el.checked) VY.nullSet.add(k); else VY.nullSet.delete(k); }
function vyBosTumu(sec){ const A=VY.analiz; if(!A) return; VY.nullSet=new Set();
  if(sec){ A.G.bosonay.forEach(r=>r.bos.forEach(b=>VY.nullSet.add(vyBosKey(r._id||r.ncst,b.field)))); A.G.guncelle.forEach(r=>r.bos.forEach(b=>VY.nullSet.add(vyBosKey(r._id,b.field)))); }
  vyRenderAnaliz(A.G, A.toplam); }
function vySecimToggle(grup,id,el){ if(el.checked) VY.secim[grup].add(id); else VY.secim[grup].delete(id); }
function vySecimTumu(grup,sec){ const A=VY.analiz; if(!A) return; VY.secim[grup]=new Set(sec?A.G[grup].map(r=>r._id):[]); vyRenderPaged(grup); }

// ---------- SAYFALI TABLO ----------
function vyPageInit(key, rows, type, containerId){ VY.pagers[key]={rows, type, containerId, page:0}; vyRenderPaged(key); }
function vyPageGo(key, d){ const st=VY.pagers[key]; if(!st) return; const pages=Math.max(1,Math.ceil(st.rows.length/VY_PAGE)); st.page=Math.min(pages-1,Math.max(0,st.page+d)); if(key==='bos') vyRenderPagedBos(); else vyRenderPaged(key); }
function vyRenderPaged(key){
  const st=VY.pagers[key]; if(!st) return; const cont=document.getElementById(st.containerId); if(!cont) return;
  const total=st.rows.length, pages=Math.max(1,Math.ceil(total/VY_PAGE)); if(st.page>=pages) st.page=pages-1; if(st.page<0) st.page=0;
  const slice=st.rows.slice(st.page*VY_PAGE,(st.page+1)*VY_PAGE);
  let cols, rowFn;
  if(st.type==='guncelle'){ cols=['Isle','ncst','Degisiklikler'];
    rowFn=row=>{ const on=VY.secim.guncelle.has(row._id);
      const c=row.changes.map(ch=>escapeHTML(ch.field)+': <span style="color:var(--text2);">'+escapeHTML(String(ch.eski))+'</span> -> <b>'+escapeHTML(String(ch.yeni))+'</b>').join('<br>');
      let b=''; if(row.bos.length){ b='<div style="margin-top:4px;font-size:11px;">'+row.bos.map(x=>{const k=vyBosKey(row._id,x.field);const o=VY.nullSet.has(k);return '<label style="color:#fbbf24;display:inline-flex;gap:4px;margin-right:10px;"><input type="checkbox" '+(o?'checked':'')+' onchange="vyNullToggle(\''+row._id+'\',\''+x.field+'\',this)"> '+escapeHTML(x.field)+' NULL</label>';}).join('')+'</div>'; }
      return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);text-align:center;"><input type="checkbox" '+(on?'checked':'')+' onchange="vySecimToggle(\'guncelle\',\''+row._id+'\',this)"></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b>'+(row.keyVals&&row.keyVals.ad_soyad?'<br><span style="font-size:11px;color:var(--text2);">'+escapeHTML(row.keyVals.ad_soyad)+'</span>':'')+'</td><td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+c+b+'</td>'; };
  } else if(st.type==='yeni'){ cols=['Isle','ncst','ad_soyad','Musteri Unvani'];
    rowFn=row=>{ const on=VY.secim.yeni.has(row._id); const mu=(row.obj&&row.obj.musteri_unvani)?row.obj.musteri_unvani:''; return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);text-align:center;"><input type="checkbox" '+(on?'checked':'')+' onchange="vySecimToggle(\'yeni\',\''+row._id+'\',this)"></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+escapeHTML(row.unvan)+'</td><td style="padding:5px 8px;border-bottom:1px solid var(--line);'+(mu?'':'color:#f87171;')+'">'+(mu?escapeHTML(mu):'(bos)')+'</td>'; };
  } else if(st.type==='rapor'){ cols=['ncst','islem','Degisiklik','sonuc'];
    rowFn=row=>{ const renk=row.sonuc==='OK'?'#34d399':(row.islem==='ATLANDI'?'#fbbf24':'#f87171');
      const d=(row.changes||[]).map(ch=>escapeHTML(ch.field)+': '+escapeHTML(String(ch.eski==null?'':ch.eski))+' -> '+escapeHTML(String(ch.yeni==null?'(NULL)':ch.yeni))).join('<br>')||'—';
      return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);color:'+renk+';font-weight:700;">'+escapeHTML(row.islem)+'</td><td style="padding:5px 8px;border-bottom:1px solid var(--line);font-size:11px;">'+d+'</td><td style="padding:5px 8px;border-bottom:1px solid var(--line);color:'+renk+';">'+escapeHTML(row.sonuc)+'</td>'; };
  } else { cols=['ncst']; rowFn=row=>'<td>'+escapeHTML(row.ncst)+'</td>'; }
  let h='<div style="overflow:auto;border:1px solid var(--line);border-radius:10px;"><table style="border-collapse:collapse;width:100%;font-size:12px;"><thead><tr>'+cols.map(c=>'<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);color:var(--text2);">'+c+'</th>').join('')+'</tr></thead><tbody>'+slice.map(r=>'<tr>'+rowFn(r)+'</tr>').join('')+'</tbody></table></div>';
  h+='<div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:8px;font-size:12px;"><button onclick="vyPageGo(\''+key+'\',-1)" '+(st.page<=0?'disabled':'')+' style="padding:4px 10px;">&larr; Onceki</button><span style="color:var(--text2);">Sayfa '+(st.page+1)+' / '+pages+' &middot; '+total+' kayit</span><button onclick="vyPageGo(\''+key+'\',1)" '+(st.page>=pages-1?'disabled':'')+' style="padding:4px 10px;">Sonraki &rarr;</button></div>';
  cont.innerHTML=h;
}
function vyRenderPagedBos(){
  const st=VY.pagers['bos']; if(!st) return; const cont=document.getElementById(st.containerId); if(!cont) return;
  const total=st.rows.length, pages=Math.max(1,Math.ceil(total/VY_PAGE)); if(st.page>=pages)st.page=pages-1; if(st.page<0)st.page=0;
  const slice=st.rows.slice(st.page*VY_PAGE,(st.page+1)*VY_PAGE);
  let h='<div style="overflow:auto;border:1px solid var(--line);border-radius:10px;"><table style="border-collapse:collapse;width:100%;font-size:12px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);color:var(--text2);">ncst</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);color:var(--text2);">Bos alanlar (isaretli = NULL)</th></tr></thead><tbody>';
  slice.forEach(row=>{ const b=row.bos.map(x=>{const k=vyBosKey(row._id||row.ncst,x.field);const o=VY.nullSet.has(k);return '<label style="display:inline-flex;gap:4px;margin-right:10px;"><input type="checkbox" '+(o?'checked':'')+' onchange="vyNullToggle(\''+(row._id||row.ncst)+'\',\''+x.field+'\',this)"> '+escapeHTML(x.field)+': <span style="color:var(--text2);">'+escapeHTML(String(x.eski))+'</span> -> NULL</label>';}).join('');
    h+='<tr><td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+b+'</td></tr>'; });
  h+='</tbody></table></div><div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:8px;font-size:12px;"><button onclick="vyPageGo(\'bos\',-1)" '+(st.page<=0?'disabled':'')+' style="padding:4px 10px;">&larr; Onceki</button><span style="color:var(--text2);">Sayfa '+(st.page+1)+' / '+pages+'</span><button onclick="vyPageGo(\'bos\',1)" '+(st.page>=pages-1?'disabled':'')+' style="padding:4px 10px;">Sonraki &rarr;</button></div>';
  cont.innerHTML=h;
}

function vyRenderAnaliz(G, toplam){
  const box=document.getElementById('vyAnalizSonuc'); if(!box) return;
  const card=(renk,b,a)=>'<div style="flex:1;min-width:110px;background:var(--bg2);border:1px solid '+renk+';border-radius:10px;padding:10px 12px;"><div style="font-size:22px;font-weight:800;color:'+renk+';">'+a+'</div><div style="font-size:12px;color:var(--text2);">'+b+'</div></div>';
  let h='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 12px;">'+card('#34d399','Guncellenecek',G.guncelle.length)+card('#60a5fa','Yeni Eklenecek',G.yeni.length)+card('#fbbf24','Bos->Onay',G.bosonay.length)+card('#f87171','Atlanacak',G.atla.length)+card('#94a3b8','Degisiklik Yok',G.degismez)+'</div>';
  h+='<div style="font-size:12px;color:var(--text2);margin-bottom:10px;">Toplam '+toplam+' satir. Yalnizca <b>isaretli</b> satirlar yazilir. Tablo: <b>'+vyCfg().table+'</b></div>';
  // ATAMA istatistik
  if(VY.mode==='atama' && VYATAMA.selectedMy){
    const sel=VYATAMA.selectedMy;
    const cekilen=G.guncelle.filter(r=>r.changes.some(c=>c.field==='my_id')).length;
    const dusen=(G.dusen||[]).length;
    const listeMevcut=G.guncelle.length+G.degismez;
    const toplamAtan=listeMevcut+G.yeni.length;
    h+='<div style="background:rgba(96,165,250,.08);border:1px solid #60a5fa;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:13px;line-height:1.7;">';
    h+='<div style="font-weight:700;margin-bottom:4px;">📊 Atama Ozeti — <span style="color:#60a5fa;">'+escapeHTML(sel.ad_soyad)+'</span></div>';
    h+='• Bu MY\'ye toplam atanacak: <b>'+toplamAtan+'</b> ('+listeMevcut+' mevcut + '+G.yeni.length+' yeni)<br>';
    h+='• Baska MY\'den cekilen (MY degisen): <b style="color:#fbbf24;">'+cekilen+'</b><br>';
    h+='• Yeni musteri (customers\'ta yok): <b>'+G.yeni.length+'</b><br>';
    h+='• Bu MY\'den <u>dusen</u> (listede yok): <b style="color:#f87171;">'+dusen+'</b>';
    h+='</div>';
    if(dusen){
      h+='<div style="background:rgba(248,113,113,.06);border:1px solid #f87171;border-radius:12px;padding:12px 14px;margin-bottom:12px;">';
      h+='<div style="font-weight:700;margin-bottom:6px;">Dusen '+dusen+' musteri ne olsun?</div>';
      h+='<div style="font-size:12px;color:var(--text2);margin-bottom:8px;">Varsayilan: bu MY\'de kalir. Baska MY/FMY\'ye tasimak istersen sec:</div>';
      h+='<div id="vyDusenSecici"></div><div id="vyDusenBilgi" style="font-size:12px;color:#fbbf24;margin-top:6px;"></div>';
      h+='<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:12px;color:var(--text2);">Dusen musteri listesi</summary><div id="vyPage_dusen" style="margin-top:6px;"></div></details>';
      h+='</div>';
    }
  }
  if(G.guncelle.length){ h+='<div style="font-weight:600;font-size:13px;margin:8px 0 4px;">Guncellenecek <button onclick="vySecimTumu(\'guncelle\',true)" style="font-size:11px;padding:3px 8px;margin-left:6px;">Tumunu sec</button> <button onclick="vySecimTumu(\'guncelle\',false)" style="font-size:11px;padding:3px 8px;">Tumunu kaldir</button></div><div id="vyPage_guncelle"></div>'; }
  if(G.yeni.length){ h+='<div style="font-weight:600;font-size:13px;margin:12px 0 4px;">Yeni Eklenecek <button onclick="vySecimTumu(\'yeni\',true)" style="font-size:11px;padding:3px 8px;margin-left:6px;">Tumunu sec</button> <button onclick="vySecimTumu(\'yeni\',false)" style="font-size:11px;padding:3px 8px;">Tumunu kaldir</button></div><div id="vyPage_yeni"></div>'; }
  if(G.bosonay.length){ h+='<div style="font-weight:600;font-size:13px;margin:12px 0 4px;">Bos -> Onay <button onclick="vyBosTumu(true)" style="font-size:11px;padding:3px 8px;margin-left:6px;">Tum boslari NULL</button> <button onclick="vyBosTumu(false)" style="font-size:11px;padding:3px 8px;">Tumunu tut</button></div><div id="vyPage_bos"></div>'; }
  if(G.atla.length){ h+='<div style="font-weight:600;font-size:13px;margin:12px 0 4px;">Atlanacak</div><div id="vyPage_atla"></div>'; }
  h+='<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);"><button class="btn-primary" onclick="vyUygula()" style="padding:10px 20px;font-size:14px;font-weight:700;background:#34d399;">💾 Uygula (secili kayitlari yaz)</button><span id="vyUygulaProg" style="margin-left:10px;font-size:12px;color:var(--text2);"></span></div><div id="vyOnayKutu"></div><div id="vyRapor"></div>';
  box.innerHTML=h;
  if(G.guncelle.length) vyPageInit('guncelle',G.guncelle,'guncelle','vyPage_guncelle');
  if(G.yeni.length) vyPageInit('yeni',G.yeni,'yeni','vyPage_yeni');
  if(G.bosonay.length){ VY.pagers['bos']={rows:G.bosonay, type:'bos', containerId:'vyPage_bos', page:0}; vyRenderPagedBos(); }
  if(G.atla.length){ VY.pagers['atla']={rows:G.atla.map(a=>({ncst:a.ncst, islem:'ATLANACAK', changes:[], sonuc:a.sonuc})), type:'rapor', containerId:'vyPage_atla', page:0}; vyRenderPaged('atla'); }
  // ATAMA: dusen secici + liste
  if(VY.mode==='atama' && (G.dusen||[]).length){
    vyMySeciciRender('vyDusenSecici', function(u){ VYATAMA.dusenTargetMy=u?u.my_id:null; const inf=document.getElementById('vyDusenBilgi'); if(inf) inf.textContent=u?('Dusenler -> '+u.ad_soyad+' (my_id='+u.my_id+') tasinacak'):'(Dusenler bu MY\'de kalacak)'; }, 'Dusenleri atamak icin MY/FMY ara...');
    VY.pagers['dusen']={rows:G.dusen.map(d=>({ncst:d.ncst, islem:'DUSEN', changes:[], sonuc:d.unvan||''})), type:'rapor', containerId:'vyPage_dusen', page:0}; vyRenderPaged('dusen');
  }
}

// ---------- UYGULA ----------
async function vyUygula(){
  const A=VY.analiz; if(!A){ toast('Once analiz edin','error'); return; }
  const cfg=A.cfg; const prog=document.getElementById('vyUygulaProg');
  const fkFields=A.mapped.map(m=>m.field).filter(f=>cfg.fk[f]); const fkValid={};
  if(fkFields.length){ if(prog) prog.textContent='FK dogrulaniyor...';
    try{ for(const f of [...new Set(fkFields)]){ const {tbl,col}=cfg.fk[f]; const set=new Set(); let from=0;
        while(true){ const {data,error}=await sb.from(tbl).select(col).range(from,from+999); if(error) throw error; (data||[]).forEach(r=>set.add(Number(r[col]))); if(!data||data.length<1000) break; from+=1000; } fkValid[f]=set; } }
    catch(e){ console.error(e); toast('FK dogrulama hatasi: '+(e.message||e),'error'); if(prog) prog.textContent=''; return; } }
  if(prog) prog.textContent='';
  const now=new Date().toISOString(); const updates=[], inserts=[], fkAtla=[];
  A.G.guncelle.forEach(row=>{ if(!VY.secim.guncelle.has(row._id)) return; const obj={}, detay=[]; let fkBad=null;
    row.changes.forEach(ch=>{ if(cfg.fk[ch.field] && !fkValid[ch.field].has(Number(ch.yeni))) fkBad=ch.field; else { obj[ch.field]=ch.yeni; detay.push({field:ch.field, eski:ch.eski, yeni:ch.yeni}); } });
    row.bos.forEach(b=>{ if(VY.nullSet.has(vyBosKey(row._id,b.field))){ obj[b.field]=null; detay.push({field:b.field, eski:b.eski, yeni:null}); } });
    if(fkBad){ fkAtla.push({ncst:row.ncst, islem:'ATLANDI', changes:[], sonuc:fkBad+' gecersiz'}); return; }
    if(Object.keys(obj).length){ if(vyType('guncelleme_tarihi')) obj.guncelleme_tarihi=now; updates.push({keyVals:row.keyVals, obj, detay, ncst:row.ncst}); } });
  A.G.bosonay.forEach(row=>{ const obj={}, detay=[]; row.bos.forEach(b=>{ if(VY.nullSet.has(vyBosKey(row._id,b.field))){ obj[b.field]=null; detay.push({field:b.field, eski:b.eski, yeni:null}); } });
    if(Object.keys(obj).length){ obj.guncelleme_tarihi=now; updates.push({keyVals:row.keyVals, obj, detay, ncst:row.ncst}); } });
  A.G.yeni.forEach(row=>{ if(!VY.secim.yeni.has(row._id)) return; const obj=Object.assign({}, row.obj); obj.ncst=row.ncst;
    let fkBad=null; Object.keys(obj).forEach(f=>{ if(cfg.fk[f] && obj[f]!=null && !fkValid[f].has(Number(obj[f]))) fkBad=f; });
    if(fkBad){ fkAtla.push({ncst:row.ncst, islem:'ATLANDI', changes:[], sonuc:fkBad+' gecersiz'}); return; }
    if(cfg.dogrulandiDefault!==null && obj.dogrulandi===undefined) obj.dogrulandi=cfg.dogrulandiDefault;
    if(obj.aktif===undefined) obj.aktif=cfg.aktifDefault;
    const detay=Object.keys(row.obj).map(f=>({field:f, eski:'', yeni:row.obj[f]})); inserts.push({obj, ncst:row.ncst, detay}); });

  // ATAMA: dusen musteriler secili hedefe tasinsin (sadece hedef secildiyse)
  if(cfg.atamaMode && VYATAMA.dusenTargetMy && A.G.dusen && A.G.dusen.length){
    const t=VYATAMA.dusenTargetMy, kaynak=VYATAMA.selectedMy.my_id;
    A.G.dusen.forEach(d=>{ updates.push({keyVals:{ncst:d.ncst}, obj:{my_id:t, guncelleme_tarihi:now}, detay:[{field:'my_id', eski:kaynak, yeni:t}], ncst:d.ncst}); });
  }

  window._vyPending={updates, inserts, fkAtla, cfg};
  const dusenTasin=(cfg.atamaMode && VYATAMA.dusenTargetMy && A.G.dusen)?A.G.dusen.length:0;
  const kutu=document.getElementById('vyOnayKutu');
  kutu.innerHTML='<div style="margin-top:12px;background:rgba(52,211,153,.08);border:1px solid #34d399;border-radius:10px;padding:14px;"><div style="font-weight:700;margin-bottom:6px;">Son Onay ('+cfg.table+')</div><div style="font-size:13px;line-height:1.6;">• <b>'+updates.length+'</b> secili kayit GUNCELLENECEK'+(dusenTasin?(' ('+dusenTasin+' dusen musteri tasima dahil)'):'')+'<br>• <b>'+inserts.length+'</b> secili kayit YENI EKLENECEK<br>'+(fkAtla.length?('• <b style="color:#f87171;">'+fkAtla.length+'</b> gecersiz -> atlanacak<br>'):'')+'</div><div style="margin-top:10px;"><button class="btn-primary" onclick="vyUygulaExec()" style="padding:8px 18px;background:#34d399;font-weight:700;">Onayla ve Yaz</button><button onclick="document.getElementById(\'vyOnayKutu\').innerHTML=\'\'" style="padding:8px 14px;margin-left:8px;">Iptal</button></div></div>';
  kutu.scrollIntoView({behavior:'smooth', block:'center'});
}

async function vyUygulaExec(){
  const P=window._vyPending; if(!P) return; const {updates, inserts, fkAtla, cfg}=P;
  document.getElementById('vyOnayKutu').innerHTML='';
  const prog=document.getElementById('vyUygulaProg'); const detayRows=[]; let okU=0, okI=0, hataN=0;
  const conc=25;
  for(let i=0;i<updates.length;i+=conc){ const batch=updates.slice(i,i+conc);
    const res=await Promise.all(batch.map(u=>{ let q=sb.from(cfg.table).update(u.obj); cfg.keyFields.forEach(f=>{ q=q.eq(f, u.keyVals[f]); }); return q.then(r=>({u, error:r.error})); }));
    res.forEach(x=>{ if(x.error){ hataN++; detayRows.push({ncst:x.u.ncst, islem:'HATA', changes:x.u.detay, sonuc:x.error.message}); } else { okU++; detayRows.push({ncst:x.u.ncst, islem:'GUNCELLENDI', changes:x.u.detay, sonuc:'OK'}); } });
    if(prog) prog.textContent='Guncelleniyor... '+Math.min(updates.length,i+conc)+'/'+updates.length; }
  for(let i=0;i<inserts.length;i+=50){ const batch=inserts.slice(i,i+50);
    const {error}=await sb.from(cfg.table).insert(batch.map(x=>x.obj));
    if(error){ for(const rec of batch){ const {error:e2}=await sb.from(cfg.table).insert(rec.obj);
        if(e2){ hataN++; detayRows.push({ncst:rec.ncst, islem:'HATA', changes:rec.detay, sonuc:e2.message}); } else { okI++; detayRows.push({ncst:rec.ncst, islem:'EKLENDI', changes:rec.detay, sonuc:'OK'}); } } }
    else { batch.forEach(rec=>{ okI++; detayRows.push({ncst:rec.ncst, islem:'EKLENDI', changes:rec.detay, sonuc:'OK'}); }); }
    if(prog) prog.textContent='Ekleniyor... '+Math.min(inserts.length,i+50)+'/'+inserts.length; }
  fkAtla.forEach(a=>detayRows.push(a));
  if(prog) prog.textContent='';
  window._vyRaporFull={okU, okI, atla:fkAtla.length, hata:hataN, detay:detayRows};
  vyRaporGoster();
}

function vyRaporGoster(){
  const R=window._vyRaporFull; const box=document.getElementById('vyRapor'); if(!box||!R) return;
  let h='<div style="margin-top:14px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:14px;"><div style="font-weight:700;margin-bottom:8px;">✅ Islem Tamamlandi</div><div style="font-size:13px;line-height:1.7;">• Guncellenen: <b style="color:#34d399;">'+R.okU+'</b><br>• Eklenen: <b style="color:#60a5fa;">'+R.okI+'</b><br>'+(R.atla?'• Atlanan: <b style="color:#fbbf24;">'+R.atla+'</b><br>':'')+(R.hata?'• Hata: <b style="color:#f87171;">'+R.hata+'</b><br>':'')+'</div><div style="margin:10px 0;"><button onclick="vyRaporExcel()" style="padding:8px 14px;font-size:12px;">📥 Detayli raporu Excel indir</button></div><div style="font-weight:600;font-size:13px;margin:8px 0 4px;">Islem Detayi</div><div id="vyPage_rapor"></div></div>';
  box.innerHTML=h;
  VY.pagers['rapor']={rows:R.detay, type:'rapor', containerId:'vyPage_rapor', page:0}; vyRenderPaged('rapor');
  box.scrollIntoView({behavior:'smooth', block:'start'});
}
function vyRaporExcel(){
  const R=window._vyRaporFull; if(!R) return;
  const ozet=[['Ozet',''],['Guncellenen',R.okU],['Eklenen',R.okI],['Atlanan',R.atla],['Hata',R.hata]];
  const det=[['ncst','islem','alan','eski','yeni','sonuc']];
  R.detay.forEach(row=>{ if(row.changes&&row.changes.length){ row.changes.forEach(ch=>det.push([row.ncst,row.islem,ch.field,ch.eski==null?'':ch.eski,ch.yeni==null?'(NULL)':ch.yeni,row.sonuc])); } else det.push([row.ncst,row.islem,'','','',row.sonuc]); });
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ozet), 'Ozet'); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(det), 'Detay');
  XLSX.writeFile(wb,'veri_yonetimi_rapor.xlsx');
}

function vyRenderPreview(headers, rows){
  const box=document.getElementById('vyPreview'); if(!box) return; const N=Math.min(rows.length,50);
  let h='<div style="overflow:auto;border:1px solid var(--line);border-radius:10px;"><table style="border-collapse:collapse;width:100%;font-size:12px;white-space:nowrap;"><thead><tr><th style="padding:6px 8px;border-bottom:1px solid var(--line);color:var(--text2);">#</th>';
  headers.forEach((c,i)=>{ const t=i===0?' <span style="color:var(--green);font-size:10px;">(ncst)</span>':''; h+='<th style="padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;">'+(escapeHTML(c)||('Kolon '+(i+1)))+t+'</th>'; });
  h+='</tr></thead><tbody>';
  for(let r=0;r<N;r++){ h+='<tr><td style="padding:5px 8px;color:var(--text2);border-bottom:1px solid var(--line);">'+(r+1)+'</td>'; for(let c=0;c<headers.length;c++){ h+='<td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+escapeHTML(rows[r][c]==null?'':String(rows[r][c]))+'</td>'; } h+='</tr>'; }
  h+='</tbody></table></div>'; if(rows.length>N) h+='<div style="padding:8px 4px;color:var(--text2);font-size:12px;">... ve '+(rows.length-N)+' satir daha.</div>';
  box.innerHTML=h;
}
