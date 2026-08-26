// ============================================================
// veriyonetimi.js — v0.3  (M2: kolon eşleme + tip-farkında 4-grup analizi)
// Son güncelleme: 2026-08-26
// Değişiklikler:
//   v0.3 — (V31.35) Yetki kontrolu admin_panel -> veri_yonetimi. Ekran Admin'den
//          kaldirildi, Yonetici panelindeki 'Veri Yonetimi' butonuna baglandi.
//   v0.2 — (V31.34) M2 eklendi. Dosya okununca kolon eşleme paneli açılır:
//          her kolon → customers alanı (genel sözlükle otomatik ön-secim,
//          kullanici degistirebilir). "Analiz Et" → ncst'ler 100'luk chunk'larla
//          cekilir, tip-farkinda (int/num/bool/str) karsilastirma yapilir ve
//          4 gruba ayrilir: GUNCELLENECEK / YENI / BOS-ONAY / ATLANACAK
//          (+ DEGISIKLIK YOK). DB YAZMA YOK — yazma M3'te gelecek.
//          FK dogrulama (my_id/kcm_id/bolge_id) M3'e ertelendi.
//   v0.1 — (V31.34) M1 iskeleti: Excel/CSV oku + ham onizleme.
// ============================================================
'use strict';

// customers semasi — ncst haric guncellenebilir alanlar + tip
// tip: 'str' | 'int' | 'num' | 'bool' | 'ts'
window.VY_SCHEMA = [
  ['unvan','str'],['vergi_no','str'],['my_id','int'],['kayit_tarihi','ts'],
  ['kcm_id','int'],['sektor','str'],['il','str'],['ilce','str'],
  ['musteri_tipi','str'],['churn_riski','str'],['toplam_hat','int'],['aktif','bool'],
  ['beyaz_yakali_sayi','int'],['sube_lokasyon','bool'],['sube_detay','str'],
  ['sunucu_altyapisi','bool'],['sunucu_detay','str'],['it_ekibi','bool'],
  ['it_ekip_sayisi','int'],['firewall_kullanimi','bool'],['firewall_detay','str'],
  ['profil_tamamlandi','bool'],['adres','str'],['telefon','str'],
  ['enlem','num'],['boylam','num'],['guncelleme_tarihi','ts'],['bolge_id','int']
];
window.VY_TYPE = Object.fromEntries(VY_SCHEMA);

window.VY = { fileName:'', headers:[], rows:[], raw:[], mapping:[] };

function openVeriYonetimi(){
  if(!hasPerm('veri_yonetimi')){ toast('Bu ekran icin yetkiniz yok','error'); return; }
  vyReset();
  navTo('pageVeriYonetimi');
}
function vyReset(){
  window.VY = { fileName:'', headers:[], rows:[], raw:[], mapping:[] };
  ['vyInfo','vyMapping','vyAnalizSonuc','vyPreview'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=''; });
  const fi=document.getElementById('vyFile'); if(fi) fi.value='';
  const btn=document.getElementById('vyOkuBtn'); if(btn) btn.disabled=true;
}
function vyFileSelected(){
  const fi=document.getElementById('vyFile'), btn=document.getElementById('vyOkuBtn');
  if(btn) btn.disabled=!(fi&&fi.files&&fi.files.length);
}

// ---- Turkce baslik normalizasyonu ----
function vyNorm(s){
  return String(s==null?'':s)
    .replace(/\u0130/g,'I').replace(/\u0131/g,'i').replace(/\u015E/g,'S').replace(/\u015F/g,'s')
    .replace(/\u011E/g,'G').replace(/\u011F/g,'g').replace(/\u00DC/g,'U').replace(/\u00FC/g,'u')
    .replace(/\u00D6/g,'O').replace(/\u00F6/g,'o').replace(/\u00C7/g,'C').replace(/\u00E7/g,'c')
    .toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
}
var VY_DICT = {
  'NCST':'ncst',
  'UNVAN':'unvan','FIRMA ADI':'unvan','FIRMA':'unvan','FIRMA UNVAN':'unvan','MUSTERI':'unvan',
  'VERGI NO':'vergi_no','VKN':'vergi_no','VERGI':'vergi_no',
  'MY ID':'my_id','MYID':'my_id',
  'KCM ID':'kcm_id','KCMID':'kcm_id',
  'SEKTOR':'sektor',
  'IL':'il','SEHIR':'il',
  'ILCE':'ilce',
  'MUSTERI TIPI':'musteri_tipi','TIP':'musteri_tipi',
  'CHURN':'churn_riski','CHURN RISKI':'churn_riski',
  'TOPLAM HAT':'toplam_hat','HAT':'toplam_hat',
  'AKTIF':'aktif',
  'BEYAZ YAKALI SAYI':'beyaz_yakali_sayi','BEYAZ YAKALI':'beyaz_yakali_sayi',
  'ADRES':'adres',
  'TELEFON':'telefon','TEL':'telefon','GSM':'telefon',
  'ENLEM':'enlem','LAT':'enlem','LATITUDE':'enlem',
  'BOYLAM':'boylam','LNG':'boylam','LON':'boylam','LONGITUDE':'boylam',
  'BOLGE':'bolge_id','BOLGE ID':'bolge_id','BOLGE KODU':'bolge_id','KOD':'bolge_id'
};
function vyAutoField(header, idx){
  if(idx===0) return 'ncst';
  var n=vyNorm(header);
  return VY_DICT[n] || '';
}

// ---- Dosya oku ----
async function vyOku(){
  var fi=document.getElementById('vyFile');
  if(!fi||!fi.files||!fi.files.length){ toast('Once dosya secin','error'); return; }
  var file=fi.files[0], ext=(file.name.split('.').pop()||'').toLowerCase();
  var info=document.getElementById('vyInfo'); if(info) info.textContent='Okunuyor...';
  try{
    var aoa;
    if(ext==='csv'){
      var wb=XLSX.read(await file.text(), {type:'string'});
      aoa=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1,defval:'',raw:false});
    } else if(ext==='xlsx'||ext==='xls'){
      var wb2=XLSX.read(await file.arrayBuffer(), {type:'array'});
      aoa=XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], {header:1,defval:'',raw:false});
    } else { toast('Sadece .xlsx, .xls veya .csv','error'); if(info) info.textContent=''; return; }
    if(!aoa||!aoa.length){ toast('Dosya bos','error'); if(info) info.textContent=''; return; }

    var headers=(aoa[0]||[]).map(function(h){return String(h==null?'':h).trim();});
    var rows=aoa.slice(1).filter(function(r){return r.some(function(c){return String(c==null?'':c).trim().length>0;});});
    var mapping=headers.map(function(h,i){return vyAutoField(h,i);});
    window.VY={ fileName:file.name, headers:headers, rows:rows, raw:aoa, mapping:mapping };

    if(info) info.innerHTML='<b>'+escapeHTML(file.name)+'</b> — '+rows.length+' satir, '+headers.length+' kolon.';
    vyRenderPreview(headers, rows);
    vyRenderMapping();
    document.getElementById('vyAnalizSonuc').innerHTML='';
  }catch(e){ console.error(e); toast('Dosya okunamadi: '+(e.message||e),'error'); if(info) info.textContent=''; }
}

// ---- Kolon esleme paneli ----
function vyRenderMapping(){
  var box=document.getElementById('vyMapping'); if(!box) return;
  var optArr=['<option value="">(kullanma)</option>'];
  VY_SCHEMA.forEach(function(x){ optArr.push('<option value="'+x[0]+'">'+x[0]+'</option>'); });
  var h='<div style="background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px;">';
  h+='<div style="font-weight:700;margin-bottom:10px;">Kolon Esleme</div>';
  h+='<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px 12px;align-items:center;font-size:13px;">';
  VY.headers.forEach(function(hd,i){
    var sel=VY.mapping[i]||'';
    h+='<div style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(escapeHTML(hd)||('Kolon '+(i+1)))+'</div>';
    h+='<div style="color:var(--text2);">&rarr;</div>';
    if(i===0){
      h+='<div><b style="color:var(--green);">ncst</b> <span style="font-size:11px;color:var(--text2);">(kilitli)</span></div>';
    }else{
      var opts=optArr.map(function(o){
        var val=o.match(/value="([^"]*)"/)[1];
        return val===sel ? o.replace('>','  selected>') : o;
      }).join('');
      h+='<select onchange="VY.mapping['+i+']=this.value" style="padding:5px 8px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--line);font-size:12px;">'+opts+'</select>';
    }
  });
  h+='</div>';
  h+='<div style="margin-top:12px;display:flex;gap:8px;align-items:center;">';
  h+='<button class="btn-primary" onclick="vyAnaliz()" style="padding:8px 16px;font-size:13px;">Analiz Et</button>';
  h+='<span id="vyAnalizProg" style="font-size:12px;color:var(--text2);"></span></div></div>';
  box.innerHTML=h;
}

// ---- Tip-farkinda deger normalizasyonu ----
function vyNull(v){ var s=String(v==null?'':v).trim(); return s.length?s:null; }
function vyBool(v){
  var s=vyNorm(v); if(s==='') return null;
  if(['TRUE','1','EVET','VAR','X','DOGRU','E','Y','YES'].indexOf(s)>=0) return true;
  if(['FALSE','0','HAYIR','YOK','YANLIS','H','N','NO'].indexOf(s)>=0) return false;
  return null;
}
function vyNum(v){ var s=String(v==null?'':v).replace(',','.').trim(); if(!s) return null; var n=Number(s); return isNaN(n)?null:n; }
function vyInt(v){ var n=vyNum(v); return n===null?null:Math.trunc(n); }
function vyCast(field, val){
  var t=VY_TYPE[field]||'str';
  if(t==='bool') return vyBool(val);
  if(t==='int')  return vyInt(val);
  if(t==='num')  return vyNum(val);
  return vyNull(val);
}
function vyCastDb(field, val){
  var t=VY_TYPE[field]||'str';
  if(t==='bool') return (val===null||val===undefined)?null:!!val;
  if(t==='int')  return (val===null||val===undefined||val==='')?null:Math.trunc(Number(val));
  if(t==='num')  return (val===null||val===undefined||val==='')?null:Number(val);
  return (val===null||val===undefined||String(val).trim()==='')?null:String(val).trim();
}

// ---- Analiz ----
async function vyAnaliz(){
  var mapped=[];
  VY.mapping.forEach(function(f,i){ if(f && i!==0) mapped.push({idx:i, field:f}); });
  if(!VY.rows.length){ toast('Veri yok','error'); return; }

  var prog=document.getElementById('vyAnalizProg');
  var sonuc=document.getElementById('vyAnalizSonuc'); sonuc.innerHTML='';

  var fileNcst=[], seen={};
  VY.rows.forEach(function(r){ var n=vyNull(r[0]); if(n && !seen[n]){ seen[n]=1; fileNcst.push(n); } });

  var selFields=['ncst'].concat(mapped.map(function(m){return m.field;}));
  var uniqSel={}; selFields.forEach(function(f){uniqSel[f]=1;});
  var selStr=Object.keys(uniqSel).join(',');

  var dbMap={}, chunkSize=100, total=fileNcst.length;
  try{
    for(var i=0;i<total;i+=chunkSize){
      var chunk=fileNcst.slice(i,i+chunkSize);
      var res=await sb.from('customers').select(selStr).in('ncst',chunk);
      if(res.error) throw res.error;
      (res.data||[]).forEach(function(row){ dbMap[String(row.ncst)]=row; });
      if(prog) prog.textContent='Analiz ediliyor... '+Math.min(total,i+chunkSize)+'/'+total;
    }
  }catch(e){ console.error(e); toast('Analiz sirasinda hata: '+(e.message||e),'error'); if(prog) prog.textContent=''; return; }
  if(prog) prog.textContent='';

  var G={guncelle:[], yeni:[], bosonay:[], atla:[], degismez:0};
  var unvanMap=mapped.filter(function(m){return m.field==='unvan';})[0];
  VY.rows.forEach(function(r){
    var ncst=vyNull(r[0]); if(!ncst) return;
    var db=dbMap[ncst];
    if(!db){
      var unvanVal=unvanMap?vyNull(r[unvanMap.idx]):null;
      if(unvanVal) G.yeni.push({ncst:ncst, unvan:unvanVal});
      else G.atla.push({ncst:ncst, sebep:'Yeni kayit ama unvan bos'});
      return;
    }
    var changes=[], bos=[];
    mapped.forEach(function(m){
      var fileV=vyCast(m.field, r[m.idx]);
      var dbV=vyCastDb(m.field, db[m.field]);
      if(fileV===null){ if(dbV!==null) bos.push({field:m.field, eski:dbV}); }
      else if(fileV!==dbV){ changes.push({field:m.field, eski:dbV, yeni:fileV}); }
    });
    if(changes.length) G.guncelle.push({ncst:ncst, changes:changes, bos:bos});
    else if(bos.length) G.bosonay.push({ncst:ncst, bos:bos});
    else G.degismez++;
  });

  vyRenderAnaliz(G, fileNcst.length);
}

function vyRenderAnaliz(G, toplam){
  var box=document.getElementById('vyAnalizSonuc'); if(!box) return;
  function card(renk,baslik,adet){ return '<div style="flex:1;min-width:120px;background:var(--bg2);border:1px solid '+renk+';border-radius:10px;padding:10px 12px;"><div style="font-size:22px;font-weight:800;color:'+renk+';">'+adet+'</div><div style="font-size:12px;color:var(--text2);">'+baslik+'</div></div>'; }
  var h='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 12px;">';
  h+=card('#34d399','Guncellenecek',G.guncelle.length);
  h+=card('#60a5fa','Yeni Eklenecek',G.yeni.length);
  h+=card('#fbbf24','Bos -> Onay',G.bosonay.length);
  h+=card('#f87171','Atlanacak',G.atla.length);
  h+=card('#94a3b8','Degisiklik Yok',G.degismez);
  h+='</div>';
  h+='<div style="font-size:12px;color:var(--text2);margin-bottom:10px;">Toplam '+toplam+' benzersiz ncst analiz edildi. <b>Bu adimda hicbir kayit yapilmadi.</b></div>';

  if(G.guncelle.length){
    h+=vyDetay('Guncellenecek', G.guncelle.slice(0,100), function(row){
      var c=row.changes.map(function(ch){return escapeHTML(ch.field)+': <span style="color:var(--text2);">'+escapeHTML(String(ch.eski))+'</span> -> <b>'+escapeHTML(String(ch.yeni))+'</b>';}).join('<br>');
      var b=row.bos.length?'<div style="color:#fbbf24;font-size:11px;">+ '+row.bos.length+' bos-onay alani</div>':'';
      return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+c+b+'</td>';
    }, ['ncst','Degisiklikler']);
  }
  if(G.yeni.length){
    h+=vyDetay('Yeni Eklenecek', G.yeni.slice(0,100), function(row){
      return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+escapeHTML(row.unvan)+'</td>';
    }, ['ncst','unvan']);
  }
  if(G.bosonay.length){
    h+=vyDetay('Bos -> Onay Bekleyen', G.bosonay.slice(0,100), function(row){
      var b=row.bos.map(function(x){return escapeHTML(x.field)+': <span style="color:var(--text2);">'+escapeHTML(String(x.eski))+'</span> -> <i>bos</i>';}).join('<br>');
      return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+b+'</td>';
    }, ['ncst','Bos birakilan (DB dolu)']);
  }
  if(G.atla.length){
    h+=vyDetay('Atlanacak', G.atla.slice(0,100), function(row){
      return '<td style="padding:5px 8px;border-bottom:1px solid var(--line);"><b>'+escapeHTML(row.ncst)+'</b></td><td style="padding:5px 8px;border-bottom:1px solid var(--line);color:var(--text2);">'+escapeHTML(row.sebep)+'</td>';
    }, ['ncst','Sebep']);
  }
  box.innerHTML=h;
}
function vyDetay(baslik, rows, rowFn, cols){
  var h='<details style="margin-bottom:8px;"><summary style="cursor:pointer;font-weight:600;font-size:13px;padding:4px 0;">'+baslik+' ('+rows.length+(rows.length>=100?'+':'')+')</summary>';
  h+='<div style="overflow:auto;border:1px solid var(--line);border-radius:10px;margin-top:6px;"><table style="border-collapse:collapse;width:100%;font-size:12px;"><thead><tr>';
  h+=cols.map(function(c){return '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);color:var(--text2);">'+c+'</th>';}).join('');
  h+='</tr></thead><tbody>';
  rows.forEach(function(r){ h+='<tr>'+rowFn(r)+'</tr>'; });
  h+='</tbody></table></div></details>';
  return h;
}

// ---- Ham onizleme (M1) ----
function vyRenderPreview(headers, rows){
  var box=document.getElementById('vyPreview'); if(!box) return;
  var N=Math.min(rows.length,50);
  var h='<div style="overflow:auto;border:1px solid var(--line);border-radius:10px;"><table style="border-collapse:collapse;width:100%;font-size:12px;white-space:nowrap;"><thead><tr>';
  h+='<th style="padding:6px 8px;border-bottom:1px solid var(--line);color:var(--text2);">#</th>';
  headers.forEach(function(c,i){ var t=i===0?' <span style="color:var(--green);font-size:10px;">(ncst)</span>':''; h+='<th style="padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;">'+(escapeHTML(c)||('Kolon '+(i+1)))+t+'</th>'; });
  h+='</tr></thead><tbody>';
  for(var r=0;r<N;r++){ h+='<tr><td style="padding:5px 8px;color:var(--text2);border-bottom:1px solid var(--line);">'+(r+1)+'</td>';
    for(var c=0;c<headers.length;c++){ h+='<td style="padding:5px 8px;border-bottom:1px solid var(--line);">'+escapeHTML(rows[r][c]==null?'':String(rows[r][c]))+'</td>'; } h+='</tr>'; }
  h+='</tbody></table></div>';
  if(rows.length>N) h+='<div style="padding:8px 4px;color:var(--text2);font-size:12px;">... ve '+(rows.length-N)+' satir daha.</div>';
  box.innerHTML=h;
}
