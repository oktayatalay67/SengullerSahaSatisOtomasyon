'use strict';
/* ===== RAPOR & EXCEL ===== */
async function downloadTemasExcel(){
  const data = window._lastReportData;
  const custMap = window._lastReportCustMap||{};
  if(!data||!data.length){toast('Önce raporu getirin','error');return;}
  toast('Excel hazırlanıyor...','success');

  // KÇM filtresi
  const kcmFilter=document.getElementById('repKcmFilter')?.value||'';

  // Müşteri detayları
  const ncstList=[...new Set(data.map(v=>v.ncst))];
  const custDetailMap={};
  if(ncstList.length>0){
    const{data:cd}=await sb.from('customers')
      .select('ncst,unvan,kcm_id,my_id,il,ilce')
      .in('ncst',ncstList);
    (cd||[]).forEach(c=>{custDetailMap[c.ncst]=c;});
  }

  // KÇM adı map
  const{data:kcmler}=await sb.from('kcm_groups').select('kcm_id,kcm_adi');
  const kcmMap={};
  (kcmler||[]).forEach(k=>{kcmMap[k.kcm_id]=k.kcm_adi;});

  // Kontak detayları
  const{data:contacts}=await sb.from('contacts')
    .select('contact_id,ncst,ad_soyad,telefon,email')
    .in('ncst',ncstList);
  const contactMap={};
  (contacts||[]).forEach(c=>{
    if(!contactMap[c.ncst]) contactMap[c.ncst]=[];
    contactMap[c.ncst].push(c);
  });

  // Form kolonlarıyla birebir uyumlu başlıklar
  const headers=[
    'Id',
    'Başlangıç saati',
    'Başlangıç saati2',
    'E-posta',
    'Ad',
    'İsminizi Seçiniz',
    'Ziyaret edilen firmanın unvanını giriniz',
    'Sütun1',
    'Ziyaret edilen firmanın NCST Numarasını giriniz',
    'Adet Ünvan/Müşteri',
    'Adet NTCS/Müşteri',
    'Ziyaret Tarihini Giriniz',
    'Görüşülen Yetkilinin Adını ve Soyadını Giriniz',
    'Görüşen Yetkili Kişinin GSM Numarası Giriniz.',
    'Görüşen Yetkili Kişinin Email Adresini Giriniz.',
    'Görüşülen Ürün ve Servisler',
    'Görüşme ile ilgili notlar',
    'Ziyaret Adresi / İlçe',
    'Ziyaret Adresi / Mahalle/Sokak/Site/Bina No vb. detay',
    'Ziyaret sonucu',
    'Otomatik tarih',
    'Portföy Kontrol NCST',
    'Portföy Kontrol İsim',
    'KÇM'
  ];

  // KÇM filtrele
  let filteredData = data;
  if(kcmFilter){
    filteredData = data.filter(v=>{
      const cust=custDetailMap[v.ncst];
      return cust&&String(cust.kcm_id)===String(kcmFilter);
    });
  }

  const rows=filteredData.map(v=>{
    const cust=custDetailMap[v.ncst]||{};
    const isPlan=v.durum==='Planlandı';
    const tarihSaat=isPlan?(v.planlanan_tarih||''):(v.tarih_saat||'');
    const tarih=v.tarih_saat?v.tarih_saat.slice(0,10):(v.planlanan_tarih||'');
    const girenAd=myIdToName[v.my_id]||'';
    const kcmAdi=kcmMap[cust.kcm_id]||'';
    // Kontak bilgisi
    const kontaklar=contactMap[v.ncst]||[];
    const kontak=kontaklar.find(c=>c.contact_id===v.contact_id)||kontaklar[0]||{};

    return [
      'SNG-SOU-'+v.visit_id,   // Id
      tarihSaat,                 // Başlangıç saati
      tarihSaat,                 // Başlangıç saati2
      '',                        // E-posta
      '',                        // Ad
      girenAd,                   // İsminizi Seçiniz
      custMap[v.ncst]||cust.unvan||v.ncst||'', // Müşteri ünvanı
      '',                        // Sütun1
      v.ncst||'',                // NCST
      '',                        // Adet Ünvan
      '',                        // Adet NCST
      tarih,                     // Ziyaret Tarihi
      kontak.ad_soyad||'',       // Görüşülen Yetkili
      kontak.telefon||'',        // GSM
      kontak.email||'',          // Email
      v.urun_gruplari||'',       // Ürünler
      v.ziyaret_amaci_detay||v.ziyaret_amaci||'', // Notlar
      cust.ilce||cust.il||'',   // İlçe
      '',                        // Mahalle/Sokak
      v.ziyaret_sonucu||'',      // Sonuç
      tarih,                     // Otomatik tarih
      v.ncst||'',                // Portföy Kontrol NCST
      myIdToName[cust.my_id]||'', // Portföy Kontrol İsim
      kcmAdi                     // KÇM (en sağ)
    ];
  });


  const BOM='\uFEFF';
  const lines=[headers,...rows].map(r=>r.map(csvCell).join(','));
  const sep='\r\n';
  const blob=new Blob([BOM+lines.join(sep)],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const d=new Date().toLocaleDateString('tr-TR').replace(/[/.]/g,'-');
  a.href=url;
  a.download='Temas_Raporu_'+d+'.csv';
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
  toast(filteredData.length+' kayıt indirildi','success');
}



/* ===== PORTFÖY YÖNETİMİ ===== */
// ===== PORTFÖY YÖNETİMİ =====
let portfoyData = [];

// ===== MÜŞTERİ RAPORU =====
let mrData = [];

async function initMusteriRapor(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const fullRoller=['ADMIN','SATIŞ DİREKTÖRÜ'];
  const myRoller=['MY','FMY','USER'];

  // KÇM — sadece admin/koordinatör
  const kcmDiv=document.getElementById('mrKcmFilterDiv');
  if(kcmDiv){
    if(fullRoller.includes(r)){
      kcmDiv.style.display='';
      const kcmSel=document.getElementById('mrKcmFilter');
      if(kcmSel&&kcmSel.options.length<=1){
        const{data:kcmler}=await sb.from('kcm_groups').select('*').order('kcm_id');
        (kcmler||[]).forEach(k=>{const o=document.createElement('option');o.value=k.kcm_id;o.textContent=k.kcm_adi;kcmSel.appendChild(o);});
      }
    } else { kcmDiv.style.display='none'; }
  }

  // Takım Lideri — MY hariç
  const takimDiv=document.getElementById('mrTakimFilterDiv');
  if(takimDiv){
    if(!myRoller.includes(r)){
      takimDiv.style.display='';
      const takimSel=document.getElementById('mrTakimFilter');
      if(takimSel&&takimSel.options.length<=1){
        let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
        if(!fullRoller.includes(r)&&currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
        const{data}=await q.order('ad_soyad');
        (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
      }
    } else { takimDiv.style.display='none'; }
  }

  // MY — MY hariç
  const myDiv=document.getElementById('mrMyFilterDiv');
  if(myDiv){
    if(!myRoller.includes(r)){
      myDiv.style.display='';
      const mySel=document.getElementById('mrMyFilter');
      if(mySel&&mySel.options.length<=1){
        let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
        if(!fullRoller.includes(r)&&currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
        const{data:myler}=await q.order('ad_soyad');
        (myler||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
      }
    } else { myDiv.style.display='none'; }
  }

  // Sektör listesi
  const sektorSel=document.getElementById('mrSektorFilter');
  if(sektorSel&&sektorSel.options.length<=1){
    const{data:sektorler}=await sb.from('customers').select('sektor').not('sektor','is',null).neq('sektor','');
    const unique=[...new Set((sektorler||[]).map(s=>s.sektor).filter(Boolean))].sort();
    unique.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;sektorSel.appendChild(o);});
  }

  // İl listesi
  const ilSel=document.getElementById('mrIlFilter');
  if(ilSel&&ilSel.options.length<=1){
    const{data:iller}=await sb.from('customers').select('il').not('il','is',null).neq('il','');
    const unique=[...new Set((iller||[]).map(i=>i.il).filter(Boolean))].sort();
    unique.forEach(i=>{const o=document.createElement('option');o.value=i;o.textContent=i;ilSel.appendChild(o);});
  }
}

async function mrKcmChanged(){
  const kcmId=document.getElementById('mrKcmFilter')?.value||'';
  const takimSel=document.getElementById('mrTakimFilter');
  if(takimSel){
    takimSel.innerHTML='<option value="">Tüm Takım Liderleri</option>';
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).eq('yetki_seviyesi','TAKIM LİDERİ');
    if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data}=await q.order('ad_soyad');
    (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;takimSel.appendChild(o);});
  }
  const mySel=document.getElementById('mrMyFilter');
  if(mySel){
    mySel.innerHTML='<option value="">Tüm MY\'ler</option>';
    let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
    if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
    const{data:myler}=await q.order('ad_soyad');
    (myler||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
  }
}

async function mrTakimChanged(){
  const takimId=document.getElementById('mrTakimFilter')?.value||'';
  const kcmId=document.getElementById('mrKcmFilter')?.value||'';
  const mySel=document.getElementById('mrMyFilter');
  if(!mySel) return;
  mySel.innerHTML='<option value="">Tüm MY\'ler</option>';
  let q=sb.from('users').select('my_id,ad_soyad').eq('aktif',true).in('yetki_seviyesi',['MY','FMY','USER']);
  if(takimId) q=q.eq('takim_lideri_id',parseInt(takimId));
  else if(kcmId) q=q.eq('kcm_id',parseInt(kcmId));
  else if(currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
  const{data}=await q.order('ad_soyad');
  (data||[]).forEach(u=>{const o=document.createElement('option');o.value=u.my_id;o.textContent=u.ad_soyad;mySel.appendChild(o);});
}

async function fetchMusteriRapor(){
  const content=document.getElementById('mrContent');
  content.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  document.getElementById('mrOzetDiv').style.display='none';
  mrData=[];

  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const fullRoller=['ADMIN','SATIŞ DİREKTÖRÜ'];
  const genisCap=['ADMIN','SATIŞ DİREKTÖRÜ','KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ','SATIŞ DESTEK','TAKIM LİDERİ'];

  const kcmVal=document.getElementById('mrKcmFilter')?.value||'';
  const takimVal=document.getElementById('mrTakimFilter')?.value||'';
  const myVal=document.getElementById('mrMyFilter')?.value||'';
  const sektorVal=document.getElementById('mrSektorFilter').value;
  const ilVal=document.getElementById('mrIlFilter').value;
  const tipVal=document.getElementById('mrTipFilter').value;
  const aktifVal=document.getElementById('mrAktifFilter').value;
  const temasVal=document.getElementById('mrTemasFilter').value;

  // Müşteri sorgusu
  let q=sb.from('customers').select('ncst,unvan,my_id,kcm_id,sektor,il,musteri_tipi,aktif,toplam_hat');
  // RBAC
  if(!fullRoller.includes(r)){
    if(genisCap.includes(r)){
      if(currentUser.kcm_id) q=q.eq('kcm_id',currentUser.kcm_id);
    } else {
      q=q.eq('my_id',currentUser.my_id);
    }
  }
  if(kcmVal) q=q.eq('kcm_id',parseInt(kcmVal));
  if(myVal) q=q.eq('my_id',parseInt(myVal));
  else if(takimVal){
    const{data:takimMyler}=await sb.from('users').select('my_id').eq('takim_lideri_id',parseInt(takimVal));
    const ids=(takimMyler||[]).map(u=>u.my_id);
    if(ids.length) q=q.in('my_id',ids);
  }
  if(sektorVal) q=q.eq('sektor',sektorVal);
  if(ilVal) q=q.eq('il',ilVal);
  if(tipVal) q=q.eq('musteri_tipi',tipVal);
  if(aktifVal!=='') q=q.eq('aktif',aktifVal==='true');

  const{data:musteriler,error}=await q.order('unvan');
  if(error){content.innerHTML=`<div class="empty">Hata: ${error.message}</div>`;return;}
  if(!musteriler||!musteriler.length){content.innerHTML='<div class="empty">Sonuç bulunamadı.</div>';return;}

  const ncstList=musteriler.map(m=>m.ncst);

  // Temas verisi — chunk'lı çek
  function chunk(a,n){const r=[];for(let i=0;i<a.length;i+=n)r.push(a.slice(i,i+n));return r;}
  const visitResults=await Promise.all(
    chunk(ncstList,200).map(c=>
      sb.from('visits').select('ncst,tarih_saat').in('ncst',c).order('tarih_saat',{ascending:false})
    )
  );
  const visits=visitResults.flatMap(r=>r.data||[]);

  // Fırsat verisi — chunk'lı çek
  const oppResults=await Promise.all(
    chunk(ncstList,200).map(c=>
      sb.from('opportunities').select('ncst,adim').in('ncst',c).neq('adim','İptal')
    )
  );
  const opps=oppResults.flatMap(r=>r.data||[]);

  // Kullanıcı adları
  const myIds=[...new Set(musteriler.map(m=>m.my_id).filter(Boolean))];
  const userResults=await Promise.all(
    chunk(myIds,200).map(c=>sb.from('users').select('my_id,ad_soyad').in('my_id',c))
  );
  const userMap={};
  userResults.flatMap(r=>r.data||[]).forEach(u=>userMap[u.my_id]=u.ad_soyad);

  // Temas haritası: ncst → {count, sonTarih}
  const temasMap={};
  visits.forEach(v=>{
    if(!temasMap[v.ncst]) temasMap[v.ncst]={count:0,sonTarih:null};
    temasMap[v.ncst].count++;
    if(!temasMap[v.ncst].sonTarih||v.tarih_saat>temasMap[v.ncst].sonTarih)
      temasMap[v.ncst].sonTarih=v.tarih_saat;
  });

  // Fırsat haritası: ncst → aktif sayı
  const oppMap={};
  opps.forEach(o=>{
    if(!oppMap[o.ncst]) oppMap[o.ncst]=0;
    oppMap[o.ncst]++;
  });

  // Temas filtresi uygula
  let filtrelenmis=musteriler;
  if(temasVal==='temas_edildi') filtrelenmis=musteriler.filter(m=>temasMap[m.ncst]?.count>0);
  else if(temasVal==='temas_edilmedi') filtrelenmis=musteriler.filter(m=>!temasMap[m.ncst]?.count);

  if(!filtrelenmis.length){content.innerHTML='<div class="empty">Sonuç bulunamadı.</div>';return;}

  // mrData'ya yaz (Excel için)
  mrData=filtrelenmis.map(m=>({
    ncst:m.ncst,
    unvan:m.unvan||'',
    myAd:userMap[m.my_id]||String(m.my_id||'-'),
    sektor:m.sektor||'-',
    il:m.il||'-',
    tip:m.musteri_tipi||'-',
    aktif:m.aktif?'Aktif':'Pasif',
    hat:m.toplam_hat||0,
    temasSayisi:temasMap[m.ncst]?.count||0,
    sonTemas:temasMap[m.ncst]?.sonTarih?new Date(temasMap[m.ncst].sonTarih).toLocaleDateString('tr-TR'):'-',
    aktifFirsat:oppMap[m.ncst]||0
  }));

  // Özet hesapla
  const toplamHat=mrData.reduce((s,m)=>s+(m.hat||0),0);
  const temasEdildi=mrData.filter(m=>m.temasSayisi>0).length;
  document.getElementById('mrToplamMusteri').textContent=mrData.length;
  document.getElementById('mrToplamHat').textContent=toplamHat.toLocaleString('tr-TR');
  document.getElementById('mrTemasEdildi').textContent=temasEdildi;
  document.getElementById('mrTemasEdilmedi').textContent=mrData.length-temasEdildi;
  document.getElementById('mrOzetDiv').style.display='';

  // Tablo render
  const thS='padding:7px 8px;border:1px solid var(--border);text-align:left;white-space:nowrap;font-size:11px;background:var(--navy3);';
  const tdS='padding:6px 8px;border:1px solid var(--border);font-size:12px;word-break:break-word;';
  let html=`<div style="font-size:12px;color:var(--text2);margin-bottom:8px;">${mrData.length} müşteri listelendi</div>`;
  html+=`<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    <colgroup>
      <col style="width:auto;min-width:130px;">
      <col style="width:90px;">
      <col style="width:70px;">
      <col style="width:60px;">
      <col style="width:60px;">
      <col style="width:55px;">
      <col style="width:55px;">
      <col style="width:95px;">
    </colgroup>
    <thead><tr>
      <th style="${thS}">Müşteri</th>
      <th style="${thS}">MY</th>
      <th style="${thS}">Sektör</th>
      <th style="${thS}">Hat</th>
      <th style="${thS}">Temas</th>
      <th style="${thS}">Fırsat</th>
      <th style="${thS}">Durum</th>
      <th style="${thS}">Son Temas</th>
    </tr></thead><tbody>`;

  mrData.forEach(m=>{
    const temasRenk=m.temasSayisi===0?'color:var(--amber);font-weight:700;':'';
    const aktifRenk=m.aktif==='Aktif'?'color:var(--green);':'color:var(--text3);';
    html+=`<tr>
      <td style="${tdS}" title="${escapeHTML(m.ncst)}">${escapeHTML(m.unvan)}<div style="font-size:10px;color:var(--text3);">${m.ncst}</div></td>
      <td style="${tdS}">${escapeHTML(m.myAd)}</td>
      <td style="${tdS}">${escapeHTML(m.sektor)}</td>
      <td style="${tdS};text-align:center;">${m.hat||'-'}</td>
      <td style="${tdS};text-align:center;${temasRenk}">${m.temasSayisi}</td>
      <td style="${tdS};text-align:center;">${m.aktifFirsat||'-'}</td>
      <td style="${tdS};${aktifRenk}">${m.aktif}</td>
      <td style="${tdS};font-size:11px;">${m.sonTemas}</td>
    </tr>`;
  });
  html+='</tbody></table></div>';
  content.innerHTML=html;
}

function mrExcelIndir(){
  if(!mrData.length){toast('Önce raporu getirin','error');return;}
  const BOM='\uFEFF';
  const headers=['NCST','Müşteri Ünvanı','MY','Sektör','İl','Müşteri Tipi','Aktif/Pasif','Toplam Hat','Temas Sayısı','Aktif Fırsat','Son Temas Tarihi'];

  const rows=mrData.map(m=>[m.ncst,m.unvan,m.myAd,m.sektor,m.il,m.tip,m.aktif,m.hat,m.temasSayisi,m.aktifFirsat,m.sonTemas]);
  const lines=[headers,...rows].map(r=>r.map(csvCell).join(','));
  const blob=new Blob([BOM+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='Musteri_Raporu_'+new Date().toLocaleDateString('tr-TR').replace(/[/.]/g,'-')+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Excel indirildi','success');
}

async function parsePortfoyFile(input){
  const file = input.files[0];
  if(!file) return;
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const yetkili=['ADMIN','SATIŞ DİREKTÖRÜ','SATIŞ DİREKTÖRÜ','KÇM MÜDÜRÜ','TAKIM LİDERİ','SATIŞ DESTEK','OPERASYON MÜDÜRÜ'];
  if(!yetkili.includes(r)){toast('Bu işlem için yetkiniz yok','error');return;}
  toast('Dosya okunuyor...','info');
  portfoyData = [];
  const ext = file.name.split('.').pop().toLowerCase();
  let rows = [];
  try{
    if(ext==='csv'){
      const text = await file.text();
      const cleanText = text.replace(/\r/g,'');
      const firstLine = cleanText.split('\n')[0];
      const delim = firstLine.includes(';') ? ';' : ',';
      rows = cleanText.split('\n').map(l=>l.split(delim).map(c=>c.trim().replace(/^\uFEFF/,'').replace(/^"|"$/g,'')));
    } else {
      if(typeof XLSX==='undefined'){toast('XLSX kütüphanesi yüklü değil. Lütfen CSV formatını kullanın.','error');return;}
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf,{type:'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    }
  } catch(e){toast('Dosya okunamadı: '+e.message,'error');return;}
  if(rows.length<2){toast('Dosya boş veya başlık satırı eksik','error');return;}
  const dataRows = rows.slice(1).filter(r=>r[0]&&r[1]);
  if(!dataRows.length){toast('Geçerli veri bulunamadı','error');return;}
  const ncstList = dataRows.map(r=>String(r[0]).trim());
  const myIdMap = {};
  dataRows.forEach(r=>{myIdMap[String(r[0]).trim()]=parseInt(r[1]);});
  // Yardımcı chunk fonksiyonu
  function chunk(arr,n){const r=[];for(let i=0;i<arr.length;i+=n)r.push(arr.slice(i,i+n));return r;}

  toast('Müşteri bilgileri çekiliyor... ('+ncstList.length+' kayıt)','info');
  const musteriResults = await Promise.all(
    chunk(ncstList,200).map(c=>sb.from('customers').select('ncst,unvan,my_id').in('ncst',c))
  );
  const musteriData = musteriResults.flatMap(r=>r.data||[]);
  const mErr = musteriResults.find(r=>r.error)?.error;
  if(mErr){toast('DB hatası: '+mErr.message,'error');return;}
  const allMyIds=[...(new Set([...musteriData.map(m=>m.my_id).filter(Boolean),...Object.values(myIdMap).filter(Boolean)]))];
  const userResults = await Promise.all(
    chunk(allMyIds,200).map(c=>sb.from('users').select('my_id,ad_soyad').in('my_id',c))
  );
  const userMap={};
  userResults.flatMap(r=>r.data||[]).forEach(u=>userMap[u.my_id]=u.ad_soyad);
  // Yeni MY'lerin KÇM bilgisini de çek
  const yeniMyIdList=[...new Set(Object.values(myIdMap).filter(Boolean))];
  const kcmResults = yeniMyIdList.length
    ? await Promise.all(chunk(yeniMyIdList,200).map(c=>sb.from('users').select('my_id,kcm_id').in('my_id',c)))
    : [];
  const kcmMap={};
  kcmResults.flatMap(r=>r.data||[]).forEach(u=>{if(u.kcm_id)kcmMap[u.my_id]=u.kcm_id;});

  portfoyData = musteriData.map(m=>{
    const yeniMyId=myIdMap[m.ncst];
    const yeniKcmId=kcmMap[yeniMyId]||null;
    return{ncst:m.ncst,unvan:m.unvan||m.ncst,eskiMyId:m.my_id,eskiMyAd:userMap[m.my_id]||String(m.my_id||'Atanmamış'),yeniMyId,yeniMyAd:userMap[yeniMyId]||String(yeniMyId||'?'),yeniKcmId,degisti:m.my_id!==yeniMyId};
  });
  const bulunanNcst=musteriData.map(m=>m.ncst);
  const bulunamayan=ncstList.filter(n=>!bulunanNcst.includes(n));
  const degisecek=portfoyData.filter(r=>r.degisti).length;
  let html='<div style="margin-bottom:8px;font-size:12px;color:var(--text2);">Toplam: <b>'+portfoyData.length+'</b> | Değişecek: <b style="color:var(--amber);">'+degisecek+'</b> | Aynı: <b>'+(portfoyData.length-degisecek)+'</b></div>';
  html+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:var(--navy3);">'
    +'<th style="padding:5px 6px;border:1px solid var(--border);text-align:left;white-space:nowrap;">NCST</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);text-align:left;">Ünvan</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);text-align:left;white-space:nowrap;">Eski MY</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);text-align:left;white-space:nowrap;">Yeni MY</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);white-space:nowrap;">Durum</th>'
    +'</tr></thead><tbody>';
  portfoyData.forEach(r=>{
    const bg=r.degisti?'rgba(255,180,0,0.1)':'transparent';
    const durum=r.degisti?'&#128260;':'&#10003;';
    const eskiKisa=r.eskiMyAd.length>15?r.eskiMyAd.slice(0,15)+'...':r.eskiMyAd;
    const yeniKisa=r.yeniMyAd.length>15?r.yeniMyAd.slice(0,15)+'...':r.yeniMyAd;
    const unvanKisa=r.unvan.length>25?r.unvan.slice(0,25)+'...':r.unvan;
    html+='<tr style="background:'+bg+';">'
      +'<td style="padding:4px 6px;border:1px solid var(--border);white-space:nowrap;">'+r.ncst+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);" title="'+escapeHTML(r.unvan)+'">'+escapeHTML(unvanKisa)+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);color:var(--text2);" title="'+escapeHTML(r.eskiMyAd)+'">'+escapeHTML(eskiKisa)+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);font-weight:700;color:var(--amber);" title="'+escapeHTML(r.yeniMyAd)+'">'+escapeHTML(yeniKisa)+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);text-align:center;">'+durum+'</td>'
      +'</tr>';
  });
  if(bulunamayan.length) html+='<tr style="background:rgba(255,0,0,0.1);"><td colspan="5" style="padding:5px 6px;border:1px solid var(--border);color:var(--red);font-size:11px;">Bulunamayan: '+bulunamayan.join(', ')+'</td></tr>';
  html+='</tbody></table></div>';
  document.getElementById('portfoyOnizlemeTablo').innerHTML=html;
  document.getElementById('portfoyOnizleme').classList.remove('hide');
  document.getElementById('portfoySonuc').classList.add('hide');
  toast(portfoyData.length+' kayıt yüklendi, '+degisecek+' değişecek','success');
}

async function portfoyGuncelle(){
  const degisecekler=portfoyData.filter(r=>r.degisti);
  if(!degisecekler.length){toast('Değişecek kayıt yok','info');return;}
  if(!confirm(degisecekler.length+' müşterinin MY bilgisi güncellenecek. Onaylıyor musunuz?')) return;
  toast('Güncelleniyor...','info');
  const sonuclar=[];

  // Aynı yeniMyId olan NCST'leri grupla → tek sorguda toplu update
  const gruplar={};
  degisecekler.forEach(r=>{
    const key=String(r.yeniMyId);
    if(!gruplar[key]) gruplar[key]=[];
    gruplar[key].push(r);
  });

  const CHUNK=500; // Supabase .in() limit
  for(const [myId, kayitlar] of Object.entries(gruplar)){
    const ncstList=kayitlar.map(r=>r.ncst);
    // 500'erli parçalara böl
    for(let i=0;i<ncstList.length;i+=CHUNK){
      const chunk=ncstList.slice(i,i+CHUNK);
      const chunkKayitlar=kayitlar.slice(i,i+CHUNK);
      // v30.27: my_id ile birlikte yeni MY'nin kcm_id'sini de güncelle
      const yeniKcmId = chunkKayitlar[0]?.yeniKcmId || null;
      const updateData = {my_id:parseInt(myId)};
      if(yeniKcmId) updateData.kcm_id=yeniKcmId;
      const {error}=await sb.from('customers')
        .update(updateData)
        .in('ncst', chunk);
      chunkKayitlar.forEach(r=>{
        sonuclar.push({...r, durum: error?'Hata: '+error.message:'Güncellendi'});
      });
      // İlerleme göster
      toast('Güncelleniyor... '+sonuclar.length+'/'+degisecekler.length,'info');
    }
  }

  // Tek log satırı
  const basarili=sonuclar.filter(r=>r.durum==='Güncellendi').length;
  await addLog('customers','TOPLU','Portföy Toplu Güncelleme',basarili+'/'+degisecekler.length+' başarılı - Yapan: '+currentUser.ad_soyad);
  let html='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:var(--navy3);">'
    +'<th style="padding:5px 6px;border:1px solid var(--border);white-space:nowrap;">NCST</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);">Ünvan</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);white-space:nowrap;">Eski MY</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);white-space:nowrap;">Yeni MY</th>'
    +'<th style="padding:5px 6px;border:1px solid var(--border);">Durum</th>'
    +'</tr></thead><tbody>';
  sonuclar.forEach(r=>{
    const bg=r.durum==='Güncellendi'?'rgba(0,214,143,0.08)':'rgba(255,0,0,0.08)';
    const unvanKisa=r.unvan.length>25?r.unvan.slice(0,25)+'...':r.unvan;
    const eskiKisa=r.eskiMyAd.length>15?r.eskiMyAd.slice(0,15)+'...':r.eskiMyAd;
    const yeniKisa=r.yeniMyAd.length>15?r.yeniMyAd.slice(0,15)+'...':r.yeniMyAd;
    html+='<tr style="background:'+bg+';">'
      +'<td style="padding:4px 6px;border:1px solid var(--border);white-space:nowrap;">'+r.ncst+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);" title="'+escapeHTML(r.unvan)+'">'+escapeHTML(unvanKisa)+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);color:var(--text2);" title="'+escapeHTML(r.eskiMyAd)+'">'+escapeHTML(eskiKisa)+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);font-weight:700;color:var(--green);" title="'+escapeHTML(r.yeniMyAd)+'">'+escapeHTML(yeniKisa)+'</td>'
      +'<td style="padding:4px 6px;border:1px solid var(--border);">'+r.durum+'</td>'
      +'</tr>';
  });
  html+='</tbody></table></div>';
  document.getElementById('portfoySonucTablo').innerHTML=html;
  document.getElementById('portfoySonuc').classList.remove('hide');
  document.getElementById('portfoyOnizleme').classList.add('hide');
  window._portfoySonuclar=sonuclar;
  toast(basarili+'/'+degisecekler.length+' kayıt güncellendi','success');
}

function portfoyIptal(){
  portfoyData=[];
  document.getElementById('portfoyOnizleme').classList.add('hide');
  document.getElementById('portfoySonuc').classList.add('hide');
  const pf=document.getElementById('portfoyFile');if(pf)pf.value='';
}

function portfoyExcelIndir(){
  const sonuclar=window._portfoySonuclar||[];
  if(!sonuclar.length){toast('Önce güncelleme yapın','error');return;}
  const BOM='\uFEFF';
  const headers=['NCST','Ünvan','Eski MY','Yeni MY','Durum'];

  const lines=[headers,...sonuclar.map(r=>[r.ncst,r.unvan,r.eskiMyAd,r.yeniMyAd,r.durum])].map(r=>r.map(csvCell).join(','));
  const blob=new Blob([BOM+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='Portfoy_Degisikligi_'+new Date().toLocaleDateString('tr-TR').replace(/[/.]/g,'-')+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('Excel indirildi','success');
}

function doLogout(){localStorage.removeItem('cu');location.reload();}

function openUserMenu(){
  document.getElementById('umAdSoyad').textContent=currentUser.ad_soyad||'—';
  document.getElementById('umRol').textContent=currentUser.yetki_seviyesi||currentUser.role||'—';
  document.getElementById('umKcm').textContent=currentUser.kcm_adi||'';
  openModal('userMenuModal');
}

function openSifreModal(){
  document.getElementById('sifreModalTitle').textContent='🔐 Şifre Değiştir';
  document.getElementById('sifreIptalBtn').style.display='';
  document.getElementById('sifreMevcut').value='';
  document.getElementById('sifreYeni').value='';
  document.getElementById('sifreYeniTekrar').value='';
  openModal('sifreModal');
}

async function saveSifre(){
  const mevcut=document.getElementById('sifreMevcut').value;
  const yeni=document.getElementById('sifreYeni').value;
  const tekrar=document.getElementById('sifreYeniTekrar').value;
  if(mevcut!==currentUser.sifre_hash){toast('Mevcut şifre yanlış','error');return;}
  if(yeni.length<6){toast('Şifre en az 6 karakter olmalı','error');return;}
  if(yeni!==tekrar){toast('Şifreler eşleşmiyor','error');return;}
  try{
    const{error}=await sb.from('users').update({sifre_hash:yeni}).eq('my_id',currentUser.my_id);
    if(error)throw error;
    currentUser.sifre_hash=yeni;
    // v30.07: sifre_hash localStorage'a yazılmıyor
    const safeUser2 = Object.assign({}, currentUser);
    delete safeUser2.sifre_hash;
    localStorage.setItem('cu',JSON.stringify(safeUser2));
    closeModal('sifreModal');
    toast('Şifre güncellendi ✅','success');
  }catch(e){toast('Hata: '+e.message,'error');}
}

