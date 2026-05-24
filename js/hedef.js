'use strict';
/* ===== HEDEF SİSTEMİ ===== */
function ayStr(d){return d.toISOString().slice(0,7)+'-01';}
function ayLabel(s){const d=new Date(s+'T00:00:00');return d.toLocaleDateString('tr-TR',{month:'long',year:'numeric'});}

// ---- HEDEF KALEMLERİ CRUD (Yönetici) ----
async function loadYoneticiHedefKalemler(){
  const c=document.getElementById('yoneticiHedefKalemList');
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  const{data,error}=await sb.from('target_items').select('*').order('sira').order('target_id');
  if(error||!data||!data.length){c.innerHTML=error?`<div class="empty" style="color:var(--red);">${error.message}</div>`:'<div class="empty">Hedef kalemi yok.</div>';return;}
  c.innerHTML=data.map(t=>`
    <div class="urun-row" style="${!t.is_active?'opacity:.45;':''}">
      <div class="urun-row-info">
        <div class="urun-row-name">${escapeHTML(t.target_name)}</div>
        <div class="urun-row-meta">Birim: ${t.unit_type} | Sıra: ${t.sira||0}${!t.is_active?' | <span style="color:var(--red);">Pasif</span>':''}</div>
      </div>
      <div class="urun-row-actions">
        <button class="icon-btn" onclick="openEditHedefKalemModal(${t.target_id})">✏️</button>
        <button class="icon-btn" onclick="toggleHedefKalemAktif(${t.target_id},${!t.is_active})">${t.is_active?'🔴':'🟢'}</button>
      </div>
    </div>`).join('');
}

function openAddHedefKalemModal(){
  document.getElementById('modalHedefKalemTitle').textContent='Yeni Hedef Kalemi';
  document.getElementById('editHedefKalemId').value='';
  document.getElementById('hkAdi').value='';
  document.getElementById('hkBirim').value='ADET';
  document.getElementById('hkSira').value='0';
  openModal('modalHedefKalem');
}
async function openEditHedefKalemModal(id){
  const{data}=await sb.from('target_items').select('*').eq('target_id',id).single();
  if(!data)return;
  document.getElementById('modalHedefKalemTitle').textContent='Hedef Kalemi Düzenle';
  document.getElementById('editHedefKalemId').value=id;
  document.getElementById('hkAdi').value=data.target_name||'';
  document.getElementById('hkBirim').value=data.unit_type||'ADET';
  document.getElementById('hkSira').value=data.sira||0;
  openModal('modalHedefKalem');
}
async function saveHedefKalem(){
  const id=document.getElementById('editHedefKalemId').value;
  const target_name=document.getElementById('hkAdi').value.trim();
  const unit_type=document.getElementById('hkBirim').value;
  const sira=parseInt(document.getElementById('hkSira').value)||0;
  if(!target_name){toast('Hedef adı zorunlu','error');return;}
  try{
    if(id){const{error}=await sb.from('target_items').update({target_name,unit_type,sira}).eq('target_id',id);if(error)throw error;}
    else{const{error}=await sb.from('target_items').insert({target_name,unit_type,sira,is_active:true,display_order:sira});if(error)throw error;}
    toast(id?'Güncellendi':'Eklendi','success');
    closeModal('modalHedefKalem');
    loadYoneticiHedefKalemler();
  }catch(e){toast('Hata: '+e.message,'error');}
}
async function toggleHedefKalemAktif(id,yeni){
  const{error}=await sb.from('target_items').update({is_active:yeni}).eq('target_id',id);
  if(!error){toast(yeni?'Aktif':'Pasif','success');loadYoneticiHedefKalemler();}
  else toast('Hata: '+error.message,'error');
}

// ---- ÜRÜN-HEDEF MAP ----
async function loadYoneticiUrunHedefMap(){
  const c=document.getElementById('yoneticiUrunHedefMap');
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    const[{data:prods},{data:targets},{data:maps}]=await Promise.all([
      sb.from('products').select('product_id,urun_adi,kategori').eq('aktif',true).order('kategori').order('sira'),
      sb.from('target_items').select('target_id,target_name,unit_type').eq('is_active',true).order('sira'),
      sb.from('product_target_map').select('product_id,target_id')
    ]);
    if(!prods||!targets){c.innerHTML='<div class="empty">Veri yüklenemedi.</div>';return;}
    const mapSet=new Set((maps||[]).map(m=>m.product_id+'_'+m.target_id));
    const grouped={};
    prods.forEach(p=>{if(!grouped[p.kategori])grouped[p.kategori]=[];grouped[p.kategori].push(p);});
    // Sticky header + sol kolon için wrapper
    let html=`<div style="position:relative;overflow:auto;max-height:65vh;border:1px solid var(--border);border-radius:8px;">
      <table style="border-collapse:collapse;font-size:11px;min-width:max-content;">
        <thead><tr style="background:var(--panel);">
          <th style="position:sticky;top:0;left:0;z-index:3;padding:8px 12px;text-align:left;border:1px solid var(--border);min-width:150px;background:var(--panel);font-size:11px;">Ürün / Hedef</th>
          ${targets.map(t=>`<th style="position:sticky;top:0;z-index:2;padding:6px 4px;border:1px solid var(--border);text-align:center;min-width:70px;font-size:10px;background:var(--panel);">${escapeHTML(t.target_name)}<br><span style="font-size:9px;color:var(--text3);">${t.unit_type}</span></th>`).join('')}
        </tr></thead><tbody>`;
    Object.entries(grouped).forEach(([cat,items])=>{
      html+=`<tr><td colspan="${targets.length+1}" style="position:sticky;left:0;padding:5px 8px;font-size:10px;font-weight:700;color:var(--text3);background:var(--card);text-transform:uppercase;border:1px solid var(--border);">${escapeHTML(cat)}</td></tr>`;
      items.forEach(p=>{
        html+=`<tr onmouseover="this.style.background='var(--row-hover)'" onmouseout="this.style.background=''">
          <td style="position:sticky;left:0;padding:7px 10px;border:1px solid var(--border);font-size:11px;background:var(--panel);white-space:nowrap;">${escapeHTML(p.urun_adi)}</td>
          ${targets.map(t=>{
            const checked=mapSet.has(p.product_id+'_'+t.target_id);
            return `<td style="padding:4px;border:1px solid var(--border);text-align:center;">
              <input type="checkbox" ${checked?'checked':''} style="width:16px;height:16px;cursor:pointer;accent-color:var(--blue);"
                onchange="toggleProductTargetMap(${p.product_id},${t.target_id},this.checked)"></td>`;
          }).join('')}</tr>`;
      });
    });
    html+='</tbody></table></div>';
    c.innerHTML=html;
  }catch(e){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${e.message}</div>`;}
}

async function toggleProductTargetMap(productId,targetId,checked){
  try{
    if(checked){
      const{error}=await sb.from('product_target_map').upsert({product_id:productId,target_id:targetId,carpan:1},{onConflict:'product_id,target_id'});
      if(error)throw error;
    }else{
      const{error}=await sb.from('product_target_map').delete().eq('product_id',productId).eq('target_id',targetId);
      if(error)throw error;
    }
  }catch(e){toast('Hata: '+e.message,'error');}
}

// ---- HEDEF GİRİŞİ ----
let hedefGirisData={};
async function initHedefGirisAylar(){
  const sel=document.getElementById('hedefGirisAy');
  if(!sel||sel.options.length>0)return;
  const now=new Date();
  for(let i=-1;i<=4;i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    const val=ayStr(d);
    const opt=document.createElement('option');
    opt.value=val;opt.textContent=ayLabel(val);
    if(i===0)opt.selected=true;
    sel.appendChild(opt);
  }
}
async function loadHedefGirisTable(){
  const c=document.getElementById('hedefGirisTable');
  const ay=document.getElementById('hedefGirisAy')?.value;
  if(!ay){c.innerHTML='<div class="empty">Ay seçin.</div>';return;}
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    const[{data:users},{data:targets},{data:existing}]=await Promise.all([
      sb.from('users').select('my_id,ad_soyad,kcm_adi,role').eq('aktif',true).order('kcm_adi').order('ad_soyad'),
      sb.from('target_items').select('target_id,target_name,unit_type').eq('is_active',true).order('sira'),
      sb.from('user_targets').select('*').eq('ay',ay)
    ]);
    if(!users||!targets){c.innerHTML='<div class="empty">Veri yüklenemedi.</div>';return;}
    const existMap={};
    (existing||[]).forEach(e=>{existMap[e.user_id+'_'+e.target_id]={ut_id:e.ut_id,value:e.target_value};});
    hedefGirisData={ay,existMap,pendingChanges:{}};
    let html=`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:var(--navy2);position:sticky;top:0;z-index:2;">
        <th style="padding:6px;text-align:left;border:1px solid var(--border);min-width:30px;">ID</th>
        <th style="padding:6px;text-align:left;border:1px solid var(--border);min-width:110px;">Personel</th>
        <th style="padding:6px;text-align:left;border:1px solid var(--border);min-width:55px;">KÇM</th>
        ${targets.map(t=>`<th style="padding:4px;border:1px solid var(--border);text-align:center;min-width:65px;font-size:10px;">${escapeHTML(t.target_name)}<br><span style="font-size:9px;color:var(--text3);">${t.unit_type}</span></th>`).join('')}
      </tr></thead><tbody>`;
    users.forEach(u=>{
      html+=`<tr>
        <td style="padding:5px;border:1px solid var(--border);color:var(--text3);font-size:10px;">${u.my_id}</td>
        <td style="padding:5px;border:1px solid var(--border);font-weight:600;font-size:11px;">${escapeHTML(u.ad_soyad)}</td>
        <td style="padding:5px;border:1px solid var(--border);color:var(--text2);font-size:10px;">${escapeHTML(u.kcm_adi||'—')}</td>
        ${targets.map(t=>{
          const key=u.my_id+'_'+t.target_id;
          const val=existMap[key]?.value||0;
          return `<td style="padding:2px;border:1px solid var(--border);">
            <input type="number" min="0" value="${val}"
              style="width:100%;background:var(--navy2);border:none;border-radius:3px;color:var(--text);padding:4px;text-align:center;font-size:11px;"
              data-uid="${u.my_id}" data-tid="${t.target_id}" data-ay="${ay}"
              oninput="hedefInputChange(this)">
          </td>`;
        }).join('')}
      </tr>`;
    });
    html+='</tbody></table></div>';
    c.innerHTML=html;
    const btn=document.getElementById('hedefSaveBtn');
    if(btn)btn.style.display='block';
  }catch(e){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${e.message}</div>`;}
}
function hedefInputChange(el){
  if(!hedefGirisData.pendingChanges)hedefGirisData.pendingChanges={};
  hedefGirisData.pendingChanges[el.dataset.uid+'_'+el.dataset.tid]={
    user_id:parseInt(el.dataset.uid),target_id:parseInt(el.dataset.tid),
    ay:el.dataset.ay,value:parseFloat(el.value)||0
  };
}
async function saveAllHedefler(){
  const btn=document.getElementById('hedefSaveBtn');
  const changes=hedefGirisData.pendingChanges||{};
  if(!Object.keys(changes).length){toast('Değişiklik yok.','info');return;}
  if(btn){btn.textContent='Kaydediliyor...';btn.disabled=true;}
  try{
    const{existMap,ay}=hedefGirisData;
    for(const[key,ch] of Object.entries(changes)){
      const ex=existMap[key];
      if(ex?.ut_id){await sb.from('user_targets').update({target_value:ch.value}).eq('ut_id',ex.ut_id);}
      else{await sb.from('user_targets').insert({user_id:ch.user_id,target_id:ch.target_id,ay:ch.ay,target_value:ch.value,actual_value:0});}
    }
    toast('Hedefler kaydedildi','success');
    hedefGirisData.pendingChanges={};
    await loadHedefGirisTable();
  }catch(e){toast('Hata: '+e.message,'error');}
  finally{if(btn){btn.textContent='💾 Tümünü Kaydet';btn.disabled=false;}}
}

// CSV şablon indir
async function downloadHedefTemplate(){
  const[{data:targets},{data:users}]=await Promise.all([
    sb.from('target_items').select('target_id,target_name').eq('is_active',true).order('sira'),
    sb.from('users').select('my_id,ad_soyad,kcm_adi').eq('aktif',true).order('kcm_adi').order('ad_soyad')
  ]);
  if(!targets||!users){toast('Veri yüklenemedi','error');return;}
  const sep=',';
  const cols=['my_id','ad_soyad','kcm_adi',...targets.map(t=>t.target_name)];
  const dataRows=users.map(u=>[u.my_id,u.ad_soyad,u.kcm_adi||'',...targets.map(()=>0)]);
  const allRows=[cols,...dataRows];
  const lines=allRows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(sep));
  const bom=String.fromCharCode(0xFEFF);
  const csvText=bom+lines.join('\r\n');
  const blob=new Blob([csvText],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='hedef_sablonu.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Şablon indirildi','success');
}

// CSV yükle
async function uploadHedefExcel(input){
  const file=input.files[0];if(!file)return;
  const text=await file.text();
  const parseCSVLine=s=>{const r=[];let cur='',inQ=false;for(const c of s){if(c==='"')inQ=!inQ;else if(c===','&&!inQ){r.push(cur.trim());cur='';}else cur+=c;}r.push(cur.trim());return r.map(v=>v.replace(/^"|"$/g,''));};
  const rawLines=text.replace(/\r/g,'').split('\n').filter(l=>l.trim());
  if(rawLines.length<2){toast('Dosya boş','error');return;}
  const headers=parseCSVLine(rawLines[0]);
  const myIdIdx=headers.findIndex(h=>h.toLowerCase()==='my_id');
  if(myIdIdx<0){toast('my_id kolonu bulunamadı','error');return;}
  const{data:targets}=await sb.from('target_items').select('target_id,target_name').eq('is_active',true);
  const targetMap={};(targets||[]).forEach(t=>{targetMap[t.target_name.toLowerCase().trim()]=t.target_id;});
  const ay=document.getElementById('hedefGirisAy').value;
  const skipCols=new Set(['my_id','ad_soyad','kcm_adi'].map(h=>headers.findIndex(hh=>hh.toLowerCase()===h)));
  let ok=0;
  for(let i=1;i<rawLines.length;i++){
    const cols=parseCSVLine(rawLines[i]);
    const myId=parseInt(cols[myIdIdx]);
    if(!myId||isNaN(myId))continue;
    for(let j=0;j<headers.length;j++){
      if(skipCols.has(j))continue;
      const tId=targetMap[headers[j].toLowerCase().trim()];
      if(!tId)continue;
      const val=parseFloat(cols[j])||0;
      const{data:ex}=await sb.from('user_targets').select('ut_id').eq('user_id',myId).eq('target_id',tId).eq('ay',ay).maybeSingle();
      if(ex){await sb.from('user_targets').update({target_value:val}).eq('ut_id',ex.ut_id);}
      else{await sb.from('user_targets').insert({user_id:myId,target_id:tId,ay,target_value:val,actual_value:0});}
      ok++;
    }
  }
  toast(ok+' hedef değeri yüklendi','success');
  input.value='';
  await loadHedefGirisTable();
}

// ---- İPTAL ONAY ----
async function loadIptalBekleyenler(){
  const c=document.getElementById('yoneticiIptalList');
  if(!c)return;
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    // Önce kolon var mı test et - tek kayıt sorgula
    const testQ=await sb.from('opportunities').select('iptal_onay_durumu').limit(1);
    if(testQ.error&&testQ.error.message&&testQ.error.message.includes('iptal_onay_durumu')){
      c.innerHTML=`<div style="background:rgba(255,180,0,.1);border:1px solid var(--amber);border-radius:10px;padding:14px;font-size:12px;">
        <div style="font-weight:700;color:var(--amber);margin-bottom:8px;">⚠️ Veritabanı güncellemesi gerekiyor</div>
        <div style="color:var(--text2);margin-bottom:10px;">Aşağıdaki SQL'i Supabase SQL Editor'da çalıştırın:</div>
        <div style="background:var(--navy);border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:var(--green);">
          ALTER TABLE opportunities<br>ADD COLUMN iptal_onay_durumu varchar DEFAULT NULL;
        </div>
        <div style="color:var(--text3);font-size:11px;margin-top:8px;">Çalıştırdıktan sonra bu sayfayı yenileyin.</div>
      </div>`;
      return;
    }
    const{data,error}=await sb.from('opportunities')
      .select('opp_id,urun_adi,aciklama,ncst,adim,olusturma_tarihi,beklenen_ciro,iptal_onay_durumu,customers(unvan),users(ad_soyad,kcm_adi)')
      .eq('iptal_onay_durumu','Bekliyor')
      .order('olusturma_tarihi',{ascending:false});
    if(error)throw error;
    if(!data||!data.length){c.innerHTML='<div class="empty">İptal bekleyen fırsat yok. ✅</div>';return;}
    c.innerHTML=data.map(o=>`
      <div class="visit-card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <div class="visit-firm">${escapeHTML(o.customers?.unvan||o.ncst||'—')}</div>
            <div class="visit-my">${escapeHTML(o.users?.ad_soyad||'—')} | ${escapeHTML(o.users?.kcm_adi||'—')}</div>
          </div>
          <span class="tag tag-amber">İptal Bekliyor</span>
        </div>
        <div style="font-size:12px;font-weight:700;margin-bottom:4px;">📦 ${escapeHTML(o.urun_adi||'—')}</div>
        ${o.aciklama?`<div style="font-size:11px;color:var(--text2);margin-bottom:8px;">${escapeHTML(o.aciklama)}</div>`:''}
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" style="flex:1;background:var(--green);color:#000;" onclick="onaylaIptal(${o.opp_id})">✅ Onayla</button>
          <button class="btn btn-ghost btn-sm" style="flex:1;border-color:var(--red);color:var(--red);" onclick="reddetIptal(${o.opp_id})">❌ Reddet</button>
        </div>
      </div>`).join('');
  }catch(e){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${e.message}</div>`;}
}

async function onaylaIptal(oppId){
  if(!confirm('Bu fırsatı iptal olarak onaylıyor musunuz?'))return;
  try{
    await sb.from('opportunities').update({adim:'İptal',durum:'İptal',iptal_onay_durumu:'Onaylandi'}).eq('opp_id',oppId).throwOnError();
    await sb.from('sales_declarations').delete().eq('opp_id',oppId);
    toast('İptal onaylandı','success');loadIptalBekleyenler();
  }catch(e){toast('Hata: '+e.message,'error');}
}

async function reddetIptal(oppId){
  const eskiAdim=prompt('Fırsat hangi adıma geri dönsün?\nFırsat / Teklif / Beyan / Evrak','Evrak');
  if(!eskiAdim)return;
  const gecerliAdimlar=['Fırsat','Teklif','Beyan','Evrak','Gerçekleşen'];
  if(!gecerliAdimlar.includes(eskiAdim)){toast('Geçersiz adım','error');return;}
  try{
    await sb.from('opportunities').update({iptal_onay_durumu:null,adim:eskiAdim,durum:eskiAdim}).eq('opp_id',oppId).throwOnError();
    toast('İptal reddedildi','success');loadIptalBekleyenler();
  }catch(e){toast('Hata: '+e.message,'error');}
}

// ---- HEDEF TAKİP (MY Ekranı) ----
let hedefGorunum = 'kendi'; // 'kendi' | 'takim' | 'kcm' | 'tumkcm' | kcm_id

async function initHedefTakip(){
  const sel=document.getElementById('hedefAySelect');
  if(!sel)return;
  if(sel.options.length===0){
    const now=new Date();
    for(let i=-3;i<=1;i++){
      const d=new Date(now.getFullYear(),now.getMonth()+i,1);
      const val=ayStr(d);
      const opt=document.createElement('option');
      opt.value=val;opt.textContent=ayLabel(val);
      if(i===0)opt.selected=true;
      sel.appendChild(opt);
    }
  }
  await buildHedefGorunumBar();
  await loadHedefTakip();
}

async function buildHedefGorunumBar(){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const bar=document.getElementById('hedefGorunumBar');
  const btnlar=document.getElementById('hedefGorunumBtnlar');
  if(!bar||!btnlar)return;
  
  const full=['ADMIN','SATIŞ DİREKTÖRÜ'];
  const kcmRol=['KÇM MÜDÜRÜ','OPERASYON MÜDÜRÜ','ÇÖZÜM SATIŞ MÜDÜRÜ'];
  const takimRol=['TAKIM LİDERİ','SATIŞ DESTEK'];
  
  if(r==='MY'||r==='FMY'||r==='USER'){
    bar.style.display='none'; return; // MY için sadece kendi
  }
  bar.style.display='';
  btnlar.innerHTML='';
  
  const addBtn=(label, val)=>{
    const b=document.createElement('div');
    b.className='chip-btn'+(hedefGorunum===val?' selected':'');
    b.textContent=label;
    b.onclick=()=>{
      hedefGorunum=val;
      document.querySelectorAll('#hedefGorunumBtnlar .chip-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      loadHedefTakip();
    };
    btnlar.appendChild(b);
  };
  
  if(full.includes(r)){
    // Admin/Koordinatör: tüm KÇM'leri ayrı ayrı + toplam
    addBtn('Kendi', 'kendi');
    addBtn('Tüm KÇM Toplamı', 'tumkcm');
    // KÇM gruplarını çek
    const{data:kcmler}=await sb.from('kcm_groups').select('*').order('kcm_id');
    (kcmler||[]).forEach(k=>addBtn('KÇM: '+k.kcm_adi, 'kcm_'+k.kcm_id));
    if(hedefGorunum==='kendi') hedefGorunum='tumkcm'; // default
  } else if(kcmRol.includes(r)){
    addBtn('KÇM Toplamı', 'kcm');
    addBtn('Takım Bazında', 'takim');
    addBtn('Kişi Bazında', 'kisi');
    hedefGorunum=hedefGorunum==='kendi'?'kcm':hedefGorunum;
  } else if(takimRol.includes(r)){
    addBtn('Takım Toplamı', 'takim');
    addBtn('Kişi Bazında', 'kisi');
    hedefGorunum=hedefGorunum==='kendi'?'takim':hedefGorunum;
  }
  // İlk buton selected
  document.querySelectorAll('#hedefGorunumBtnlar .chip-btn').forEach((b,i)=>{
    b.classList.toggle('selected', b.textContent===(hedefGorunum==='kcm'?'KÇM Toplamı':
      hedefGorunum==='takim'?'Takım Toplamı':hedefGorunum==='kisi'?'Kişi Bazında':
      hedefGorunum==='tumkcm'?'Tüm KÇM Toplamı':'Kendi'));
  });
}
async function loadHedefTakip(){
  const c=document.getElementById('hedefTakipContent');
  const ay=document.getElementById('hedefAySelect')?.value;
  if(!ay||!currentUser||!c)return;
  c.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  try{
    const uid=currentUser.my_id;
    const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
    const myRoller=['MY','FMY','USER'];
    
    let hedefQ = sb.from('user_targets').select('*,target_items(target_name,unit_type)').eq('ay',ay);
    let beyanQ = sb.from('sales_declarations').select('target_id,declared_value,adet,tutar,durum,user_id').eq('ay',ay);
    let gorunumBaslik = '';
    
    if(myRoller.includes(r)||hedefGorunum==='kendi'){
      // MY/FMY/USER: sadece kendi
      hedefQ=hedefQ.eq('user_id',uid);
      beyanQ=beyanQ.eq('user_id',uid);
      gorunumBaslik='Kişisel Hedef';
    } else if(hedefGorunum==='takim'){
      // Takım lideri: kendi takımındaki MY'ler
      const{data:takimUyeler}=await sb.from('users').select('my_id').eq('takim_lideri_id',uid).eq('aktif',true);
      const takimIds=(takimUyeler||[]).map(u=>u.my_id);
      takimIds.push(uid); // kendisi de dahil
      hedefQ=hedefQ.in('user_id',takimIds);
      beyanQ=beyanQ.in('user_id',takimIds);
      gorunumBaslik='Takım Hedefi';
    } else if(hedefGorunum==='kcm'){
      // KÇM Müdürü: kendi KÇM'i
      hedefQ=hedefQ.in('user_id',kcmMyIds);
      beyanQ=beyanQ.in('user_id',kcmMyIds);
      gorunumBaslik='KÇM Hedefi';
    } else if(hedefGorunum==='kisi'){
      // Kişi bazında - tüm KÇM üyelerini listele
      hedefQ=hedefQ.in('user_id',kcmMyIds);
      beyanQ=beyanQ.in('user_id',kcmMyIds);
      gorunumBaslik='Kişi Bazında';
    } else if(hedefGorunum==='tumkcm'){
      // Admin: tüm KÇM'ler
      gorunumBaslik='Tüm KÇM Toplamı';
    } else if(hedefGorunum?.startsWith('kcm_')){
      // Belirli bir KÇM
      const kcmId=parseInt(hedefGorunum.split('_')[1]);
      const{data:kcmUsers}=await sb.from('users').select('my_id').eq('kcm_id',kcmId).eq('aktif',true);
      const kcmUserIds=(kcmUsers||[]).map(u=>u.my_id);
      hedefQ=hedefQ.in('user_id',kcmUserIds);
      beyanQ=beyanQ.in('user_id',kcmUserIds);
      gorunumBaslik='KÇM Hedefi';
    }
    
    const[{data:hedefler},{data:beyanlar}]=await Promise.all([hedefQ, beyanQ]);
    if(!hedefler||!hedefler.length){
      c.innerHTML='<div class="empty">Bu ay için hedef tanımlanmamış.<br><span style="font-size:12px;color:var(--text3);">Yönetici panelinden hedef girişi yapılmalıdır.</span></div>';return;
    }
    const fmt=(v,birim)=>birim==='TL'?fmtTL(v):(v||0).toLocaleString('tr-TR');
    
    // Kişi bazında görünüm
    if(hedefGorunum==='kisi'){
      // Kullanıcı bazında grupla
      const userIds=[...new Set(hedefler.map(h=>h.user_id))];
      const userRows=userIds.map(userId=>{
        const userHedefler=hedefler.filter(h=>h.user_id===userId);
        const userBeyanlar=(beyanlar||[]).filter(b=>b.user_id===userId);
        const bMap={};
        userBeyanlar.forEach(b=>{
          if(!bMap[b.target_id])bMap[b.target_id]={gercek:0,beyan:0};
          const v=b.declared_value||b.adet||b.tutar||0;
          if(b.durum==='Gerçekleşen')bMap[b.target_id].gercek+=v;
          else if(b.durum==='Beyan')bMap[b.target_id].beyan+=v;
        });
        const isim=myIdToName[userId]||'Kullanıcı '+userId;
        let satirlar=userHedefler.map(h=>{
          const tName=h.target_items?.target_name||'—';
          const birim=h.target_items?.unit_type||'ADET';
          const hedef=h.target_value||0;
          const gercek=bMap[h.target_id]?.gercek||0;
          const pG=hedef>0?Math.min(100,Math.round((gercek/hedef)*100)):0;
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);">
            <span style="font-size:11px;color:var(--text2);">${escapeHTML(tName)}</span>
            <span style="font-size:11px;">${fmt(gercek,birim)} / ${fmt(hedef,birim)} <b style="color:${pG>=100?'var(--green)':pG>=70?'var(--amber)':'var(--text2)'};">(${pG}%)</b></span>
          </div>`;
        }).join('');
        return `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;">👤 ${escapeHTML(isim)}</div>
          ${satirlar}
        </div>`;
      });
      c.innerHTML=`<div style="padding:4px 0;">${userRows.join('')}</div>`;
      return;
    }
    
    // Toplam görünüm (kendi, kcm, takim_toplam, tumkcm)
    const bMap={};
    (beyanlar||[]).forEach(b=>{
      if(!bMap[b.target_id])bMap[b.target_id]={gercek:0,beyan:0};
      const v=b.declared_value||b.adet||b.tutar||0;
      if(b.durum==='Gerçekleşen')bMap[b.target_id].gercek+=v;
      else if(b.durum==='Beyan')bMap[b.target_id].beyan+=v;
    });
    // Hedefleri target_id bazında topla
    const hedefMap={};
    hedefler.forEach(h=>{
      if(!hedefMap[h.target_id]){
        hedefMap[h.target_id]={target_id:h.target_id,target_items:h.target_items,target_value:0,actual_value:0};
      }
      hedefMap[h.target_id].target_value+=h.target_value||0;
      hedefMap[h.target_id].actual_value+=h.actual_value||0;
    });
    let html='';
    Object.values(hedefMap).forEach(h=>{
      const tName=h.target_items?.target_name||'—';
      const birim=h.target_items?.unit_type||'ADET';
      const hedef=h.target_value||0;
      const gercek=h.actual_value||(bMap[h.target_id]?.gercek||0);
      const beyan=bMap[h.target_id]?.beyan||0;
      const toplam=gercek+beyan;
      const pG=hedef>0?Math.min(100,Math.round((gercek/hedef)*100)):0;
      const pT=hedef>0?Math.min(100,Math.round((toplam/hedef)*100)):0;
      const beyanPct=toplam>0&&pT>pG?Math.round(((toplam-gercek)/hedef)*100):0;
      html+=`<div class="form-section" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:800;">${escapeHTML(tName)}</div>
          <div style="font-size:11px;color:var(--text2);">Hedef: <b style="color:var(--text);">${fmt(hedef,birim)}</b></div>
        </div>
        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:2px;"><span>🎯 Hedef</span><span>${fmt(hedef,birim)}</span></div>
          <div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;"></div>
        </div>
        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--green);margin-bottom:2px;"><span>✅ Gerçekleşen</span><span>${fmt(gercek,birim)} (%${pG})</span></div>
          <div style="height:10px;background:var(--navy3);border-radius:5px;overflow:hidden;">
            <div style="height:100%;width:${pG}%;background:var(--green);border-radius:5px;transition:.5s;"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--blue);margin-bottom:2px;"><span>📋 Gerçekleşen + Beyan</span><span>${fmt(toplam,birim)} (%${pT})</span></div>
          <div style="height:10px;background:var(--navy3);border-radius:5px;overflow:hidden;position:relative;">
            <div style="height:100%;width:${pG}%;background:var(--green);border-radius:5px 0 0 5px;position:absolute;left:0;top:0;"></div>
            <div style="height:100%;width:${beyanPct}%;background:rgba(77,159,255,.5);position:absolute;left:${pG}%;top:0;"></div>
          </div>
        </div>
      </div>`;
    });
    c.innerHTML=html;
  }catch(e){c.innerHTML=`<div class="empty" style="color:var(--red);">Hata: ${e.message}</div>`;}
}

// ---- FIRSAT ADIM TETİKLEYİCİ ----
async function processOppAdimChange(oppId,yeniAdim,myId,tahminiTarih,urunAdi,eskiAdim){
  try{
    const ay=tahminiTarih?tahminiTarih.slice(0,7)+'-01':ayStr(new Date());
    const adimMap={'Açık':'Fırsat','Teklif Verildi':'Teklif','Kazanıldı':'Gerçekleşen','Kaybedildi':'İptal'};
    const yeni=adimMap[yeniAdim]||yeniAdim;
    if(yeni==='Beyan'){
      const{data:ex}=await sb.from('sales_declarations').select('decl_id').eq('opp_id',oppId).maybeSingle();
      if(!ex){
        const{data:prods}=await sb.from('opportunity_products').select('*').eq('opp_id',oppId);
        const tgts=await getTargetsForUrun(urunAdi,prods);
        const{data:cust}=await sb.from('opportunities').select('ncst').eq('opp_id',oppId).single();
        for(const t of tgts){
          await sb.from('sales_declarations').insert({user_id:myId,target_id:t.target_id,ay,
            declared_value:t.value,adet:t.adet,tutar:t.tutar,urun_adi:urunAdi,ncst:cust?.ncst,opp_id:oppId,durum:'Beyan'});
        }
      }
    }else if(yeni==='Gerçekleşen'){
      const gT=tahminiTarih||new Date().toISOString().split('T')[0];
      const{data:prods}=await sb.from('opportunity_products').select('*').eq('opp_id',oppId);
      const tgts=await getTargetsForUrun(urunAdi,prods);
      await sb.from('sales_declarations').delete().eq('opp_id',oppId);
      const{data:cust}=await sb.from('opportunities').select('ncst').eq('opp_id',oppId).single();
      for(const t of tgts){
        await sb.from('sales_declarations').insert({user_id:myId,target_id:t.target_id,ay,
          declared_value:t.value,adet:t.adet,tutar:t.tutar,urun_adi:urunAdi,ncst:cust?.ncst,
          opp_id:oppId,durum:'Gerçekleşen',gerceklesme_tarihi:gT});
        const{data:ut}=await sb.from('user_targets').select('ut_id,actual_value').eq('user_id',myId).eq('target_id',t.target_id).eq('ay',ay).maybeSingle();
        if(ut)await sb.from('user_targets').update({actual_value:(ut.actual_value||0)+t.value}).eq('ut_id',ut.ut_id);
      }
    }else if(yeni==='İptal'){
      const{data:decls}=await sb.from('sales_declarations').select('durum').eq('opp_id',oppId);
      const gerRec=(decls||[]).some(d=>d.durum==='Gerçekleşen');
      if(gerRec){
        try{
          await sb.from('opportunities').update({iptal_onay_durumu:'Bekliyor',adim:'İptal Bekliyor',durum:'İptal Bekliyor'}).eq('opp_id',oppId);
        }catch(e){console.warn('iptal_onay_durumu kolonu yok, SQL çalıştırılmalı:',e);}
        toast('Gerçekleşen fırsat iptal talebi yöneticiye gönderildi.','info');
        return false;
      }
      await sb.from('sales_declarations').delete().eq('opp_id',oppId);
    }
    await addLog('opportunities',oppId,'Statü Değişti',eskiAdim+' → '+yeniAdim);
    return true;
  }catch(e){console.error('processOppAdimChange:',e);return true;}
}

async function getTargetsForUrun(urunAdi,oppProds){
  const results=[];
  try{
    const{data:prod}=await sb.from('products').select('product_id,unit_type').eq('urun_adi',urunAdi).maybeSingle();
    if(prod?.product_id){
      const{data:maps}=await sb.from('product_target_map').select('target_id,carpan').eq('product_id',prod.product_id);
      if(maps?.length){
        const pr=oppProds?.find(p=>p.urun_adi===urunAdi);
        maps.forEach(m=>{
          const adet=pr?.adet||1;const tutar=pr?.tutar||0;const carpan=m.carpan||1;
          results.push({target_id:m.target_id,value:(tutar||adet)*carpan,adet,tutar});
        });
        return results;
      }
      // Fallback: products.target_id
      const{data:pF}=await sb.from('products').select('target_id,unit_type').eq('product_id',prod.product_id).maybeSingle();
      if(pF?.target_id){
        const pr=oppProds?.find(p=>p.urun_adi===urunAdi);
        const adet=pr?.adet||1;const tutar=pr?.tutar||0;
        results.push({target_id:pF.target_id,value:pF.unit_type==='TL'?tutar:adet,adet,tutar});
      }
    }
  }catch(e){console.warn('getTargetsForUrun:',e);}
  return results;
}

