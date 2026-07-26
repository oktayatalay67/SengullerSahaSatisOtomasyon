// ============================================================
// yetki.js — v1.2.0
// Son güncelleme: 2026-07-22
// Değişiklikler:
//   v1.1.0 — EKRAN YENİDEN TASARLANDI: yatay taşan dev matris kaldırıldı.
//            Artık "önce rol seç → o rolün ayarlarını dikey listede düzenle"
//            akışı var; mobilde de okunur. Kapsam seçenekleri açıklamalı.
//            Yeni scope kodu PRT+ desteği (çapraz görünürlük).
//   v1.0.0 — İlk sürüm (yatay matris — kullanışsızdı)
// ------------------------------------------------------------
// YETKİ KATMANI — TEK NOKTA: DATABASE
//   • Rol listesi           → public.roles
//   • Rol → yetki eşlemesi  → public.role_permissions
//   • Kod içinde SABİT rol/yetki listesi YOKTUR.
// Bağımlılık: sb, currentUser, toast, escapeHTML, hasPerm, addLog
// ============================================================
'use strict';

window.PERM  = window.PERM  || { scope: {} };
window.ROLES = window.ROLES || [];

// Scope kodları — insan diliyle
const YETKI_SCOPE_TANIM = [
  { kod:'',      etiket:'Yetki yok',        aciklama:'Bu modülde hiçbir kayıt görmez' },
  { kod:'TÜM',   etiket:'Tüm veri',         aciklama:'Şirketteki bütün kayıtlar' },
  { kod:'KÇM',   etiket:'Kendi KÇM',        aciklama:'Kendi KÇM bölgesindeki kayıtlar' },
  { kod:'BAĞLI', etiket:'Kendi ekibi',      aciklama:'Kendine bağlı MY/FMY kayıtları' },
  { kod:'PRT+',  etiket:'Portföy + çapraz', aciklama:'Kendi girdiği + kendi müşterisine başkasının girdiği kayıtlar' },
  { kod:'PRT',   etiket:'Sadece kendi',     aciklama:'Yalnızca kendi girdiği kayıtlar' }
];

const YETKI_MODUL_ADLARI = {
  musteri:'Müşteri', temas:'Temas / Ziyaret', firsat:'Fırsat',
  gorev:'Görev', rapor_temas:'Temas Raporu', rapor_firsat:'Fırsat Raporu'
};

const YETKI_ACTION_GRUP = [
  { grup:'Yönetim', items:{
      admin_panel:'Admin paneline girebilir',
      yonetici_panel:'Yönetici paneline girebilir',
      kullanici_yonet:'Kullanıcı ekler / düzenler',
      yetki_yonet:'Rol ve yetkileri yönetir',
      urun_yonet:'Ürünleri yönetir',
      duyuru_yonet:'Duyuru yayınlar',
      talep_yonet:'Talepleri yönetir',
      yonetici_tam:'Tam yönetici işlemleri (Admin/Direktör)',
      gorev_tumunu_gor:'Tüm görevleri görür',
      portfoy_yukle:'Portföy dosyası yükler' } },
  { grup:'Müşteri', items:{
      musteri_ekle:'Müşteri ekler',
      musteri_duzenle:'Müşteri düzenler',
      musteri_sil:'Müşteri siler',
      portfoy_devri:'Portföy devreder (MY değiştirir)',
      ncst_guncelle:'NCST günceller',
      kontak_yonet:'Kontak ekler / düzenler' } },
  { grup:'Temas', items:{
      temas_ekle:'Temas ekler',
      temas_duzenle:'Kendi temasını düzenler',
      temas_baskasi_duzenle:'Başkasının temasını düzenler',
      temas_yonetici_duzenle:'Yönetici olarak her teması düzenler',
      temas_sil:'Temas siler' } },
  { grup:'Fırsat', items:{
      firsat_ekle:'Fırsat ekler',
      firsat_adim:'Fırsat adımını değiştirir',
      firsat_baskasi_duzenle:'Başkasının fırsatını düzenler',
      firsat_gerceklesen:'Gerçekleşen adımına taşır',
      firsat_iptal_talep:'İptal talebi oluşturur',
      firsat_iptal_onayla:'İptal talebini onaylar',
      firsat_iptal_onay:'Fırsat iptalini onaylar/reddeder (buton)',
      evrak_onayla:'Evrak onaylar',
      mudur_onay:'Müdür onayı verir (hedef ataması)',
      firsat_sil:'Fırsat siler',
      firsat_max_adim_evrak:'Evrak adımından ileri GİDEMEZ (kısıt)' } },
  { grup:'Hedef & Diğer', items:{
      hedef_giris:'Hedef girer',
      hedef_excel:'Hedef Excel yükler',
      hedef_kalem_yonet:'Hedef kalemlerini yönetir',
      urun_hedef_map:'Ürün-hedef eşleştirir',
      sifre_sifirla:'Şifre sıfırlar' } }
];

/* ============================================================
   1) LOGIN'DE YETKİYİ DB'DEN YÜKLE
   ============================================================ */
async function loadPermFromDB(){
  try{
    const [{data:roles, error:rErr}, {data:perms, error:pErr}] = await Promise.all([
      sb.from('roles').select('role_id,role_adi,gorunen_ad,sira,aktif,aciklama').order('sira',{ascending:true}),
      sb.from('role_permissions').select('role_kod,perm_tip,perm_key,deger')
    ]);
    if(rErr){ console.error('roles yüklenemedi:', rErr); return false; }
    if(pErr){ console.error('role_permissions yüklenemedi:', pErr); return false; }
    window.ROLES = roles || [];
    const P = { scope: {} };
    (perms||[]).forEach(p=>{
      if(p.perm_tip==='scope'){
        if(!P.scope[p.perm_key]) P.scope[p.perm_key] = {};
        P.scope[p.perm_key][p.role_kod] = p.deger;
      } else if(p.perm_tip==='action'){
        if(!P[p.perm_key]) P[p.perm_key] = [];
        if(p.deger==='1') P[p.perm_key].push(p.role_kod);
      }
    });
    window.PERM = P;
    return true;
  }catch(e){ console.error('loadPermFromDB hata:', e); return false; }
}

/* ============================================================
   2) ROL DROPDOWN'INI DB'DEN DOLDUR
   ============================================================ */
function populateRoleDropdown(selectEl, selectedVal){
  if(!selectEl) return;
  const roller = (window.ROLES||[]).filter(r=>r.aktif);
  selectEl.innerHTML = '';
  if(!roller.length){ selectEl.innerHTML='<option value="">(rol listesi yüklenemedi)</option>'; return; }
  roller.forEach(r=>{
    const o=document.createElement('option');
    o.value=r.role_adi;
    o.textContent=r.gorunen_ad||r.role_adi;
    if(selectedVal && r.role_adi===selectedVal) o.selected=true;
    selectEl.appendChild(o);
  });
}

/* ============================================================
   3) ROL & YETKİ YÖNETİMİ EKRANI (dikey, mobil uyumlu)
   ============================================================ */
let _yRoller=[], _yIzinler=[], _yModuller=[], _ySeciliRol=null, _ySekme='kapsam';

async function initYetkiYonetim(){
  const el=document.getElementById('yetkiIcerik');
  if(!el) return;
  if(!hasPerm('yetki_yonet')){
    el.innerHTML='<div class="empty" style="color:var(--red);">Bu ekran için yetkiniz yok.</div>';
    return;
  }
  el.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  if(!await _yVeriYukle()){ el.innerHTML='<div class="empty" style="color:var(--red);">Veri yüklenemedi.</div>'; return; }
  if(!_ySeciliRol && _yRoller.length) _ySeciliRol=_yRoller[0].role_adi;
  _yRender();
}

async function _yVeriYukle(){
  try{
    const [{data:roles,error:rE},{data:perms,error:pE}]=await Promise.all([
      sb.from('roles').select('role_id,role_adi,gorunen_ad,sira,aktif,aciklama').order('sira',{ascending:true}),
      sb.from('role_permissions').select('role_kod,perm_tip,perm_key,deger')
    ]);
    if(rE||pE){ console.error(rE||pE); return false; }
    _yRoller=roles||[]; _yIzinler=perms||[];
    const modSet=new Set(_yIzinler.filter(p=>p.perm_tip==='scope').map(p=>p.perm_key));
    Object.keys(YETKI_MODUL_ADLARI).forEach(m=>modSet.add(m));
    _yModuller=[...modSet];
    return true;
  }catch(e){ console.error('_yVeriYukle:',e); return false; }
}

function _yScope(rol,modul){
  const r=_yIzinler.find(p=>p.perm_tip==='scope'&&p.role_kod===rol&&p.perm_key===modul);
  return r?r.deger:'';
}
function _yAction(rol,action){
  const r=_yIzinler.find(p=>p.perm_tip==='action'&&p.role_kod===rol&&p.perm_key===action);
  return !!(r&&r.deger==='1');
}
function _esc(s){ return String(s).replace(/'/g,"\\'"); }

function yetkiRolSec(rol){ _ySeciliRol=rol; _yRender(); }
function yetkiSekme(s){ _ySekme=s; _yRender(); }

function _yRender(){
  const el=document.getElementById('yetkiIcerik');
  if(!el) return;

  const aktifRoller=_yRoller.filter(r=>r.aktif);
  let h='<div style="margin-bottom:12px;">'
    + '<label style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;">Rol Seçin</label>'
    + '<select onchange="yetkiRolSec(this.value)" style="width:100%;margin-top:5px;background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:11px;font-size:14px;font-weight:600;">'
    + aktifRoller.map(r=>'<option value="'+escapeHTML(r.role_adi)+'"'+(r.role_adi===_ySeciliRol?' selected':'')+'>'+escapeHTML(r.gorunen_ad||r.role_adi)+'</option>').join('')
    + '</select></div>';

  const tab=(k,a)=>'<button class="btn btn-sm'+(_ySekme===k?' btn-blue':'')+'" onclick="yetkiSekme(\''+k+'\')" style="flex:1;padding:8px 4px;font-size:12px;'+(_ySekme===k?'':'background:var(--navy3);color:var(--text2);')+'">'+a+'</button>';
  h+='<div style="display:flex;gap:6px;margin-bottom:12px;">'+tab('kapsam','Görüntüleme')+tab('eylem','Eylemler')+tab('roller','Roller')+'</div>';

  if(_ySekme==='kapsam')      h+=_yKapsamKartlari();
  else if(_ySekme==='eylem')  h+=_yEylemKartlari();
  else                        h+=_yRollerListesi();

  el.innerHTML=h;
}

function _yKapsamKartlari(){
  if(!_ySeciliRol) return '';
  const rolAd=(_yRoller.find(r=>r.role_adi===_ySeciliRol)||{}).gorunen_ad||_ySeciliRol;
  let h='<div style="font-size:11px;color:var(--text3);margin-bottom:10px;line-height:1.5;"><b>'
    + escapeHTML(rolAd)+'</b> rolündeki kullanıcı her modülde hangi kayıtları görecek?</div>';
  _yModuller.forEach(m=>{
    const cur=_yScope(_ySeciliRol,m);
    const tanim=YETKI_SCOPE_TANIM.find(t=>t.kod===cur)||YETKI_SCOPE_TANIM[0];
    const opts=YETKI_SCOPE_TANIM.map(t=>'<option value="'+t.kod+'"'+(cur===t.kod?' selected':'')+'>'+t.etiket+'</option>').join('');
    h+='<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:11px 12px;margin-bottom:8px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">'
      + '<div style="font-size:13px;font-weight:600;">'+escapeHTML(YETKI_MODUL_ADLARI[m]||m)+'</div>'
      + '<select onchange="yetkiScopeDegistir(\''+_esc(_ySeciliRol)+'\',\''+_esc(m)+'\',this.value)" '
      + 'style="background:var(--navy3);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:7px 9px;font-size:12px;min-width:150px;">'+opts+'</select>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--text3);">'+escapeHTML(tanim.aciklama)+'</div>'
      + '</div>';
  });
  return h;
}

function _yEylemKartlari(){
  if(!_ySeciliRol) return '';
  const rolAd=(_yRoller.find(r=>r.role_adi===_ySeciliRol)||{}).gorunen_ad||_ySeciliRol;
  let h='<div style="font-size:11px;color:var(--text3);margin-bottom:10px;line-height:1.5;"><b>'
    + escapeHTML(rolAd)+'</b> rolünün yapabilecekleri. Değişiklik anında kaydedilir; '
    + 'kullanıcılar bir sonraki girişte yeni yetkiyle gelir.</div>';
  YETKI_ACTION_GRUP.forEach(g=>{
    h+='<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px;">'+escapeHTML(g.grup)+'</div>';
    Object.keys(g.items).forEach(a=>{
      const on=_yAction(_ySeciliRol,a);
      const kilitli=(a==='yetki_yonet'&&_ySeciliRol==='ADMIN');
      const click=kilitli?'':'yetkiActionDegistir(\''+_esc(_ySeciliRol)+'\',\''+_esc(a)+'\','+(on?'false':'true')+')';
      h+='<div onclick="'+click+'" style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:10px;'+(kilitli?'opacity:.55;':'cursor:pointer;')+'">'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:13px;">'+escapeHTML(g.items[a])+'</div>'
        + '<div style="font-size:10px;color:var(--text3);">'+escapeHTML(a)+(kilitli?' · kilitli':'')+'</div>'
        + '</div>'
        + '<div style="width:42px;height:24px;border-radius:12px;flex-shrink:0;position:relative;transition:.2s;background:'+(on?'var(--green)':'var(--navy3)')+';border:1px solid var(--border);">'
        + '<div style="width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:2px;left:'+(on?'20px':'2px')+';transition:.2s;"></div>'
        + '</div></div>';
    });
  });
  return h;
}

function _yRollerListesi(){
  let h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
    + '<div style="font-size:11px;color:var(--text3);">Pasif roller kullanıcı formunda görünmez.</div>'
    + '<button class="btn btn-green btn-sm" onclick="yetkiRolEkleModal()" style="width:auto;padding:8px 14px;">+ Yeni Rol</button></div>';
  _yRoller.forEach(r=>{
    h+='<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:10px;">'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:600;">'+escapeHTML(r.gorunen_ad||r.role_adi)
      + (r.aktif?'':' <span class="tag tag-gray" style="font-size:10px;">Pasif</span>')+'</div>'
      + '<div style="font-size:11px;color:var(--text3);">'+escapeHTML(r.role_adi)+' · sıra '+(r.sira||999)+'</div>'
      + '</div><div style="display:flex;gap:6px;flex-shrink:0;">'
      + '<button class="icon-btn" title="Düzenle" onclick="yetkiRolDuzenleModal('+r.role_id+')">✏️</button>'
      + '<button class="icon-btn" title="'+(r.aktif?'Pasif Yap':'Aktif Yap')+'" onclick="yetkiRolAktifToggle('+r.role_id+','+(r.aktif?'false':'true')+')">'+(r.aktif?'🔴':'🟢')+'</button>'
      + '</div></div>';
  });
  return h;
}

/* ---------------- YAZMA ---------------- */
async function yetkiScopeDegistir(rol,modul,deger){
  if(!hasPerm('yetki_yonet')){ toast('Yetkiniz yok','error'); return; }
  try{
    if(!deger){
      const{error}=await sb.from('role_permissions').delete()
        .eq('role_kod',rol).eq('perm_tip','scope').eq('perm_key',modul);
      if(error) throw error;
      _yIzinler=_yIzinler.filter(p=>!(p.perm_tip==='scope'&&p.role_kod===rol&&p.perm_key===modul));
    }else{
      const{error}=await sb.from('role_permissions')
        .upsert({role_kod:rol,perm_tip:'scope',perm_key:modul,deger},{onConflict:'role_kod,perm_tip,perm_key'});
      if(error) throw error;
      const ex=_yIzinler.find(p=>p.perm_tip==='scope'&&p.role_kod===rol&&p.perm_key===modul);
      if(ex) ex.deger=deger; else _yIzinler.push({role_kod:rol,perm_tip:'scope',perm_key:modul,deger});
    }
    await addLog('role_permissions',rol,'Kapsam Değişti',modul+' → '+(deger||'yetki yok'));
    toast('Kaydedildi','success');
    _yRender();
  }catch(e){ toast('Hata: '+e.message,'error'); console.error(e); }
}

async function yetkiActionDegistir(rol,action,yeni){
  if(!hasPerm('yetki_yonet')){ toast('Yetkiniz yok','error'); return; }
  if(action==='yetki_yonet'&&rol==='ADMIN'&&!yeni){ toast('Admin bu yetkiyi kaybedemez','error'); return; }
  try{
    if(yeni){
      const{error}=await sb.from('role_permissions')
        .upsert({role_kod:rol,perm_tip:'action',perm_key:action,deger:'1'},{onConflict:'role_kod,perm_tip,perm_key'});
      if(error) throw error;
      const ex=_yIzinler.find(p=>p.perm_tip==='action'&&p.role_kod===rol&&p.perm_key===action);
      if(ex) ex.deger='1'; else _yIzinler.push({role_kod:rol,perm_tip:'action',perm_key:action,deger:'1'});
    }else{
      const{error}=await sb.from('role_permissions').delete()
        .eq('role_kod',rol).eq('perm_tip','action').eq('perm_key',action);
      if(error) throw error;
      _yIzinler=_yIzinler.filter(p=>!(p.perm_tip==='action'&&p.role_kod===rol&&p.perm_key===action));
    }
    await addLog('role_permissions',rol,'Yetki Değişti',action+' → '+(yeni?'AÇIK':'KAPALI'));
    _yRender();
  }catch(e){ toast('Hata: '+e.message,'error'); console.error(e); }
}

/* ---------------- ROL CRUD ---------------- */
let _yDuzenlenenRolId=null;

function yetkiRolEkleModal(){
  _yDuzenlenenRolId=null;
  document.getElementById('yetkiRolModalTitle').textContent='Yeni Rol';
  document.getElementById('yrRoleAdi').value='';
  document.getElementById('yrRoleAdi').disabled=false;
  document.getElementById('yrGorunenAd').value='';
  document.getElementById('yrSira').value=999;
  document.getElementById('yrAciklama').value='';
  openModal('yetkiRolModal');
}

function yetkiRolDuzenleModal(roleId){
  const r=_yRoller.find(x=>x.role_id===roleId);
  if(!r) return;
  _yDuzenlenenRolId=roleId;
  document.getElementById('yetkiRolModalTitle').textContent='Rolü Düzenle';
  document.getElementById('yrRoleAdi').value=r.role_adi;
  document.getElementById('yrRoleAdi').disabled=true;
  document.getElementById('yrGorunenAd').value=r.gorunen_ad||'';
  document.getElementById('yrSira').value=r.sira||999;
  document.getElementById('yrAciklama').value=r.aciklama||'';
  openModal('yetkiRolModal');
}

async function yetkiRolKaydet(){
  if(!hasPerm('yetki_yonet')){ toast('Yetkiniz yok','error'); return; }
  const roleAdi=document.getElementById('yrRoleAdi').value.trim().toUpperCase();
  const gorunenAd=document.getElementById('yrGorunenAd').value.trim();
  const sira=parseInt(document.getElementById('yrSira').value)||999;
  const aciklama=document.getElementById('yrAciklama').value.trim();
  if(!roleAdi){ toast('Rol kodu zorunlu','error'); return; }
  if(!gorunenAd){ toast('Görünen ad zorunlu','error'); return; }
  try{
    if(_yDuzenlenenRolId){
      const{error}=await sb.from('roles').update({gorunen_ad:gorunenAd,sira,aciklama}).eq('role_id',_yDuzenlenenRolId);
      if(error) throw error;
      await addLog('roles',_yDuzenlenenRolId,'Rol Güncellendi',roleAdi);
    }else{
      const{error}=await sb.from('roles').insert({role_adi:roleAdi,gorunen_ad:gorunenAd,sira,aciklama,aktif:true});
      if(error) throw error;
      await addLog('roles',roleAdi,'Rol Eklendi',gorunenAd);
    }
    closeModal('yetkiRolModal');
    toast('Kaydedildi','success');
    await _yVeriYukle(); _yRender();
  }catch(e){ toast('Hata: '+e.message,'error'); console.error(e); }
}

async function yetkiRolAktifToggle(roleId,yeni){
  if(!hasPerm('yetki_yonet')){ toast('Yetkiniz yok','error'); return; }
  const r=_yRoller.find(x=>x.role_id===roleId);
  if(!r) return;
  if(r.role_adi==='ADMIN'&&!yeni){ toast('ADMIN rolü pasife alınamaz','error'); return; }
  if(!yeni){
    const{count}=await sb.from('users').select('*',{count:'exact',head:true})
      .eq('yetki_seviyesi',r.role_adi).eq('aktif',true);
    if(count>0&&!confirm(count+' aktif kullanıcı bu role sahip. Yine de pasife alınsın mı?\n(Yetkileri değişmez, sadece yeni atamalarda listede çıkmaz.)')) return;
  }
  try{
    const{error}=await sb.from('roles').update({aktif:yeni}).eq('role_id',roleId);
    if(error) throw error;
    await addLog('roles',roleId,yeni?'Rol Aktif Edildi':'Rol Pasife Alındı',r.role_adi);
    toast('Güncellendi','success');
    await _yVeriYukle(); _yRender();
  }catch(e){ toast('Hata: '+e.message,'error'); console.error(e); }
}
