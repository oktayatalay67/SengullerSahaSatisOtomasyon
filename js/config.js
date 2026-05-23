/* ===== YARDIMCILAR ===== */
function escapeHTML(s){if(!s)return '';return String(s).replace(/[&<>'"]/g,t=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));}

function csvCell(v){const s=String(v||'').replace(/"/g,'""');return(s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s+'"':s;}
function fmtTL(n){if(!n&&n!==0)return '—';return new Intl.NumberFormat('tr-TR',{minimumFractionDigits:0}).format(n)+' ₺';}
function fmtDate(d){if(!d)return '—';try{return new Date(d).toLocaleDateString('tr-TR');}catch{return d;}}

/* ===== STATE ===== */
let sb=null, currentUser=null, selectedCustomer=null;
let selectedPurposes=[], selectedProducts=[], selectedActions=[], selectedResult='';
let selectedContactsMap=new Map();
let selectedTemasYontemiStr='Ziyaret', selectedTemasDurumuStr='Gerçekleşti';
let activeBasket=[], currentEditingCustNcst=null;
let currentEditPlanId=null;
let isOpportunityConfirmed=false;
let listTimeFilter='tumu', listStatusArr=['Gerçekleşti','Planlandı'];
let repStatusArr=['Gerçekleşti','Planlandı'], repTypeArr=['Ziyaret','Online Toplantı','Telefon','Email','SMS/Whatsapp'];
let editToggleState={it:null,sube:null,fw:null,sunucu:null};
let ppTimeFilter='tumu', ppStatusFilter='tumu';
let currentEditingOppId=null, oppSelectedNcst=null, oppSelectedUnvan=null;

/* ===== SABITLER ===== */
const DEFAULT_PURPOSES=["Kontrat Yenileme","Yeni Tesis (YT) / Aktivasyon","MNT","Devir","Esnek Devir","Sim Kart Değişimi","Hat İptal","E-SIM","Şikayet Görüşmesi","Evrak/İmza İşlemleri","ÖŞY","Tanışma / Rutin Ziyaret","Teklif Değerlendirme"];
// ============ YETKİ MATRİSİ ============
// Bu obje doğrudan yetki_matrisi.xlsx'ten üretilmiştir.
// Değişiklik için Excel'i güncelleyin.

const PERM = {
  // Görüntüleme kapsamı: 'TÜM' | 'KÇM' | 'PRT'
  scope: {
    musteri: {
      'ADMIN': 'TÜM',
      'SATIŞ KOORDİNATÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'TAKIM LİDERİ': 'KÇM',
      'SATIŞ DESTEK': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'ÇÖZÜM SATIŞ UZMANI': 'KÇM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'KÇM',
      'MY': 'KÇM',
    },
    temas: {
      'ADMIN': 'TÜM',
      'SATIŞ KOORDİNATÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'TAKIM LİDERİ': 'KÇM',
      'SATIŞ DESTEK': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'ÇÖZÜM SATIŞ UZMANI': 'KÇM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'KÇM',
      'MY': 'PRT',
    },
    firsat: {
      'ADMIN': 'TÜM',
      'SATIŞ KOORDİNATÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'TAKIM LİDERİ': 'KÇM',
      'SATIŞ DESTEK': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'ÇÖZÜM SATIŞ UZMANI': 'KÇM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'KÇM',
      'MY': 'PRT',
    },
    rapor_temas: {
      'ADMIN': 'TÜM',
      'SATIŞ KOORDİNATÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'TAKIM LİDERİ': 'KÇM',
      'SATIŞ DESTEK': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'ÇÖZÜM SATIŞ UZMANI': 'KÇM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'KÇM',
      'MY': 'PRT',
    },
    rapor_firsat: {
      'ADMIN': 'TÜM',
      'SATIŞ KOORDİNATÖRÜ': 'TÜM',
      'ÇÖZÜM SATIŞ MÜDÜRÜ': 'TÜM',
      'KÇM MÜDÜRÜ': 'KÇM',
      'TAKIM LİDERİ': 'KÇM',
      'SATIŞ DESTEK': 'KÇM',
      'OPERASYON MÜDÜRÜ': 'KÇM',
      'ÇÖZÜM SATIŞ UZMANI': 'KÇM',
      'ÇÖZÜM SATIŞ TEMSİLCİSİ': 'KÇM',
      'MY': 'PRT',
    },
  },

  // Boolean izinler: rol listesindeyse ✅
  admin_panel: ['ADMIN'],
  firsat_adim: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ', 'ÇÖZÜM SATIŞ UZMANI', 'ÇÖZÜM SATIŞ TEMSİLCİSİ', 'MY'],
  firsat_baskasi_duzenle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ'],
  firsat_ekle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ', 'ÇÖZÜM SATIŞ UZMANI', 'ÇÖZÜM SATIŞ TEMSİLCİSİ', 'MY'],
  firsat_iptal_onayla: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ'],
  firsat_iptal_talep: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'ÇÖZÜM SATIŞ UZMANI', 'ÇÖZÜM SATIŞ TEMSİLCİSİ', 'MY'],
  hedef_excel: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ'],
  hedef_giris: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ'],
  hedef_kalem_yonet: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ'],
  kontak_yonet: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ', 'ÇÖZÜM SATIŞ UZMANI', 'ÇÖZÜM SATIŞ TEMSİLCİSİ', 'MY'],
  kullanici_yonet: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ'],
  musteri_duzenle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ'],
  musteri_ekle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ', 'MY'],
  musteri_sil: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ'],
  ncst_guncelle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'SATIŞ DESTEK'],
  sifre_sifirla: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ'],
  temas_baskasi_duzenle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'OPERASYON MÜDÜRÜ'],
  temas_duzenle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ', 'ÇÖZÜM SATIŞ UZMANI', 'ÇÖZÜM SATIŞ TEMSİLCİSİ', 'MY'],
  temas_ekle: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'SATIŞ DESTEK', 'OPERASYON MÜDÜRÜ', 'ÇÖZÜM SATIŞ UZMANI', 'ÇÖZÜM SATIŞ TEMSİLCİSİ', 'MY'],
  temas_sil: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ'],
  urun_hedef_map: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ'],
  urun_yonet: ['ADMIN'],
  yonetici_panel: ['ADMIN', 'SATIŞ KOORDİNATÖRÜ', 'ÇÖZÜM SATIŞ MÜDÜRÜ', 'KÇM MÜDÜRÜ', 'TAKIM LİDERİ', 'OPERASYON MÜDÜRÜ'],
};

// Yetki kontrol fonksiyonları
function hasPerm(perm){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const allowed=PERM[perm]||[];
  return allowed.includes(r)||allowed.includes('ADMIN')&&r==='ADMIN';
}

function getScope(module){
  const r=(currentUser.yetki_seviyesi||currentUser.role||'').toUpperCase();
  const scopeMap=PERM.scope[module]||{};
  return scopeMap[r]||'PRT'; // varsayılan: kendi portföyü
}

function applyScope(q, module, prefix=''){
  const scope=getScope(module);
  if(scope==='TÜM') return q;
  if(scope==='KÇM'&&currentUser.kcm_id){
    if(module==='musteri') return q.eq('kcm_id', currentUser.kcm_id);
    if(kcmMyIds.length>0) return q.in(`${prefix}my_id`, kcmMyIds);
    return q.eq(`${prefix}my_id`, currentUser.my_id);
  }
  return q.eq(`${prefix}my_id`, currentUser.my_id);
}

let FALLBACK_PRODUCTS=[
  {cat:'Mobil',items:[{n:'Ses / Data Hatları',t:'Adet'},{n:'YT (Yeni Tesis)',t:'Adet'},{n:'MNT',t:'Adet'},{n:'Asansör Hattı',t:'Adet'},{n:'e-SIM / Yedek SIM',t:'Adet'}]},
  {cat:'Cihaz & Kampanya',items:[{n:'iPhone (Pro / Pro Max)',t:'Adet'},{n:'Samsung (A-Serisi / S-Serisi)',t:'Adet'},{n:'Aksesuar',t:'Adet'}]},
  {cat:'SOL',items:[{n:'Superbox',t:'Adet'},{n:'XDSL / Fiber',t:'Tutar'}]},
  {cat:'DBS',items:[{n:'Metro Ethernet',t:'Tutar'},{n:'Radio Link',t:'Tutar'},{n:'Sanal Sunucu',t:'Tutar'},{n:'Yedekleme',t:'Tutar'},{n:'Güvenlik',t:'Tutar'},{n:'Loglama',t:'Tutar'},{n:'VoIP',t:'Tutar'},{n:'Tekofis',t:'Tutar'}]},
  {cat:'M2M / IoT',items:[{n:'IoT',t:'Adet'},{n:'Araç Takip',t:'Adet'}]},
  {cat:'DSS',items:[{n:'E-Şirket',t:'Tutar'},{n:'E-Platform',t:'Tutar'}]}
];

let allProductsLoaded=false;

async function loadProductsFromDB(){
  try{
    // Kategori sıralarını al
    const {data:cats} = await sb.from('product_categories').select('*').order('sira');
    const catOrder = (cats||[]).map(c=>c.kategori);

    const{data,error}=await sb.from('products').select('*').eq('aktif',true).order('sira');
    if(error||!data||data.length===0){console.warn('Ürünler DB\'den alınamadı, fallback kullanılıyor.');return;}
    const groupedAll={};
    const groupedUrun={};
    data.forEach(p=>{
      const cat=p.kategori||'Diğer';
      const t=p.unit_type||'Adet';
      if(!groupedAll[cat])groupedAll[cat]={cat,items:[],sira:0};
      groupedAll[cat].items.push({n:p.urun_adi,t,product_id:p.product_id});
      if(p.is_urun!==false){
        if(!groupedUrun[cat])groupedUrun[cat]={cat,items:[],sira:0};
        groupedUrun[cat].items.push({n:p.urun_adi,t,product_id:p.product_id});
      }
    });

    // Kategori sırasına göre sırala
    const sortByOrder = (obj) => {
      const sorted = [
        ...catOrder.filter(k=>obj[k]).map(k=>obj[k]),
        ...Object.values(obj).filter(v=>!catOrder.includes(v.cat))
      ];
      return sorted;
    };

    FALLBACK_PRODUCTS = sortByOrder(groupedAll);
    window.FIRSAT_PRODUCTS = sortByOrder(groupedUrun);
    allProductsLoaded=true;
    console.log(`Ürünler DB'den yüklendi: ${data.length} ürün, ${FALLBACK_PRODUCTS.length} kategori`);
    await buildTemasUI();
    buildUrunSelects();
  }catch(e){console.warn('loadProductsFromDB hata:',e);}
}
const DEFAULT_RESULTS=["Planlanan İşlemler Tamamlandı","Tekrar Ziyaret Edilecek","Teklif Gönderilecek","Ürün Sorumlusu/Uzmanı ile Toplantı Yapılacak","Ziyaret Yapılamadı"];
const DEFAULT_ACTIONS=["İşlem Tamamlandı","Evrak Alındı","Kontrat Yenilendi","Hat / Cihaz Teslim Edildi","Teklif Verildi"];
const OPP_ADIMLAR=['Fırsat','Teklif','Beyan','Evrak','Gerçekleşen','İptal'];
const OPP_DURUMLAR=['Fırsat','Teklif','Beyan','Evrak','Gerçekleşen','İptal']; // legacy compat
const OPP_ADIM_COLORS={
  'Fırsat':'blue','Teklif':'amber','Beyan':'purple',
  'Evrak':'blue','Gerçekleşen':'green','İptal':'red'
};
const OPP_ADIM_OLASILIK={
  'F\u0131rsat':10,'Teklif':25,'Beyan':50,'Evrak':90,'Ger\u00e7ekle\u015fen':100,'\u0130ptal':0
};
function selectOppAdim(adim){
  var GERCEKLESEN='Ger\u00e7ekle\u015fen', IPTAL='\u0130ptal';
  document.querySelectorAll('.opp-adim-btn').forEach(function(b){
    var isSelected = b.dataset.adim===adim;
    b.classList.toggle('selected',isSelected);
    var bAdim = b.dataset.adim;
    if(isSelected){
      if(adim===GERCEKLESEN){
        b.style.background='rgba(0,214,143,0.2)';
        b.style.borderColor='var(--green)';
        b.style.color='var(--green)';
      } else if(adim===IPTAL){
        b.style.background='rgba(224,4,42,0.2)';
        b.style.borderColor='var(--red)';
        b.style.color='var(--red)';
      } else {
        b.style.background='';
        b.style.borderColor='';
        b.style.color='';
      }
    } else {
      if(bAdim===GERCEKLESEN){
        b.style.background='';
        b.style.borderColor='var(--green)';
        b.style.color='var(--green)';
      } else if(bAdim===IPTAL){
        b.style.background='';
        b.style.borderColor='var(--red)';
        b.style.color='var(--red)';
      } else {
        b.style.background='';
        b.style.borderColor='';
        b.style.color='';
      }
    }
  });
  document.getElementById('oppDurum').value=adim;
  var olas=OPP_ADIM_OLASILIK[adim]||10;
  selectOppOlasilik(olas);
}

// ===== ÇOKLU ÜRÜN GİRİŞİ (Madde 5) =====
let oppUrunRows = [];

// ===== ORTAK ÜRÜN SATIRI FABRİKASI =====
function _urunSatiriEkle(opts){
  // opts: {prefix, containerId, rowsArr, removeFn, updateFn, urunAdi, adet, tutar, sayac}
  const id = opts.prefix + Date.now() + (opts.sayac||'');
  if(opts.rowsArr) opts.rowsArr.push(id);
  const prods = window.FIRSAT_PRODUCTS || FALLBACK_PRODUCTS || [];
  let optHtml = '<option value="">-- Ürün Seçin --</option>';
  prods.forEach(c=>{
    optHtml += `<optgroup label="${escapeHTML(c.cat)}">` +
      (c.items||[]).map(i=>`<option value="${escapeHTML(i.n)}" data-type="${escapeHTML(i.t||'Adet')}" ${i.n===opts.urunAdi?'selected':''}>${escapeHTML(i.n)}</option>`).join('') +
      '</optgroup>';
  });
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;position:relative;';
  const removeBtn = opts.removeFn
    ? `<button type="button" onclick="${opts.removeFn}('${id}')" style="position:absolute;top:6px;right:8px;background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;">✕</button>`
    : `<button type="button" onclick="document.getElementById('${id}').remove()" style="position:absolute;top:6px;right:8px;background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;">✕</button>`;
  div.innerHTML = `
    ${removeBtn}
    <div class="field" style="margin-bottom:6px;">
      <label style="font-size:11px;">Ürün</label>
      <select id="${id}_urun" onchange="${opts.updateFn}('${id}')" style="width:100%;">${optHtml}</select>
    </div>
    <div style="display:flex;gap:8px;">
      <div id="${id}_adetBox" class="field" style="flex:1;margin-bottom:0;">
        <label style="font-size:11px;">Adet</label>
        <input type="number" id="${id}_adet" value="${opts.adet||1}" min="1" style="width:100%;">
      </div>
      <div id="${id}_tutarBox" class="field hide" style="flex:2;margin-bottom:0;">
        <label style="font-size:11px;">Tutar (₺)</label>
        <input type="number" id="${id}_tutar" value="${opts.tutar||0}" style="width:100%;">
      </div>
    </div>`;
  const container = document.getElementById(opts.containerId);
  if(container) container.appendChild(div);
  // Tip güncelle
  _urunSatiriTipGuncelle(id);
  return id;
}

function _urunSatiriTipGuncelle(id){
  const sel = document.getElementById(id+'_urun');
  if(!sel) return;
  const type = sel.options[sel.selectedIndex]?.getAttribute('data-type')||'Adet';
  const adetBox = document.getElementById(id+'_adetBox');
  const tutarBox = document.getElementById(id+'_tutarBox');
  if(adetBox) adetBox.classList.toggle('hide', type==='Tutar');
  if(tutarBox) tutarBox.classList.toggle('hide', type!=='Tutar');
}

function _urunSatiriGetData(rowsArrOrContainerId, useArr){
  const rows = useArr
    ? rowsArrOrContainerId
    : Array.from(document.querySelectorAll(`#${rowsArrOrContainerId} [id]`)).map(el=>el.id);
  return rows.map(id=>{
    const urun = document.getElementById(id+'_urun')?.value||'';
    const sel = document.getElementById(id+'_urun');
    const type = sel?.options[sel.selectedIndex]?.getAttribute('data-type')||'Adet';
    const adet = parseInt(document.getElementById(id+'_adet')?.value)||1;
    const tutar = parseFloat(document.getElementById(id+'_tutar')?.value)||0;
    return {urun, type, adet, tutar};
  }).filter(r=>r.urun);
}

function addOppUrunRow(urunAdi='',adet=1,tutar=''){_urunSatiriEkle({prefix:'oppUrunRow_',containerId:'oppUrunListesi',rowsArr:oppUrunRows,removeFn:'removeOppUrunRow',updateFn:'_urunSatiriTipGuncelle',urunAdi,adet,tutar});}

function updateOppUrunRow(id){_urunSatiriTipGuncelle(id);}

function removeOppUrunRow(id){oppUrunRows=oppUrunRows.filter(r=>r!==id);document.getElementById(id)?.remove();}

function clearOppUrunRows(){oppUrunRows=[];const el=document.getElementById('oppUrunListesi');if(el)el.innerHTML='';}

function getOppUrunData(){return _urunSatiriGetData(oppUrunRows,true);}

// Temas ekranı çoklu ürün (ayrı liste)
let tmsOppUrunRows = [];

function addTmsOppUrunRow(urunAdi='',adet=1,tutar=''){_urunSatiriEkle({prefix:'tmsOppRow_',containerId:'tmsOppUrunListesi',rowsArr:tmsOppUrunRows,removeFn:'removeTmsOppUrunRow',updateFn:'_urunSatiriTipGuncelle',urunAdi,adet,tutar});}

function updateTmsOppRow(id){_urunSatiriTipGuncelle(id);}

function removeTmsOppUrunRow(id){tmsOppUrunRows=tmsOppUrunRows.filter(r=>r!==id);document.getElementById(id)?.remove();}

function clearTmsOppUrunRows(){tmsOppUrunRows=[];const el=document.getElementById('tmsOppUrunListesi');if(el)el.innerHTML='';}

function getTmsOppUrunData(){return _urunSatiriGetData(tmsOppUrunRows,true);}
function selectOppOlasilik(val){
  // v30.31: oppOlasilik div içindeki chip-btn'ler — text içeriğine göre eşleştir
  const container=document.getElementById('oppOlasilik');
  if(!container) return;
  container.querySelectorAll('.chip-btn').forEach(b=>{
    const btnVal=parseInt(b.textContent.replace('%','').trim());
    b.classList.toggle('selected', btnVal===val);
  });
  // Hidden input'a yaz
  let hiddenInp=document.getElementById('oppOlasilikVal');
  if(!hiddenInp){
    hiddenInp=document.createElement('input');
    hiddenInp.type='hidden';
    hiddenInp.id='oppOlasilikVal';
    container.parentElement.appendChild(hiddenInp);
  }
  hiddenInp.value=val;
}
const OPP_ADIM_TAGS={
  'Fırsat':'tag-blue','Teklif':'tag-amber','Beyan':'tag-purple',
  'Evrak':'tag-blue','Gerçekleşen':'tag-green','İptal':'tag-red'
};

/* ===== BOOT ===== */
// ============ SUPABASE CONFIG ============
// Global hata yakalayıcı — q.eq is not a function gibi hataları konsola yaz
window.addEventListener('unhandledrejection', function(e){
  console.error('[HATA DETAY]', e.reason?.stack || e.reason?.message || e.reason);
});

// ============================================================
// v30.40: TIMEZONE YARDIMCıLARI — Türkiye UTC+3
// DB'de timestamptz, filtreler İstanbul saatine göre hesaplanmalı
// ============================================================
function trNow() {
  // Şu anki zamanı UTC+3 offset ile döndür
  return new Date();
}

function trDateStr(date) {
  // Date → 'YYYY-MM-DD' (İstanbul tarihine göre)
  const d = date || new Date();
  const tr = new Date(d.getTime() + 3 * 60 * 60 * 1000); // UTC+3
  return tr.toISOString().slice(0, 10);
}

function trStartOfDay(dateStr) {
  // 'YYYY-MM-DD' → UTC karşılığı gün başı (İstanbul 00:00 = UTC 21:00 önceki gün)
  return dateStr + 'T00:00:00+03:00';
}

function trEndOfDay(dateStr) {
  // 'YYYY-MM-DD' → UTC karşılığı gün sonu (İstanbul 23:59 = UTC 20:59)
  return dateStr + 'T23:59:59+03:00';
}

function trStartOfMonth(year, month) {
  // Ay başı İstanbul saati
  const m = String(month).padStart(2,'0');
  return year + '-' + m + '-01T00:00:00+03:00';
}

function trToISO(localDatetimeStr) {
  // Form'dan gelen 'YYYY-MM-DDTHH:MM' → UTC ISO string
  // Kullanıcı İstanbul saatinde giriyor, +03:00 ekle
  if (!localDatetimeStr) return null;
  return localDatetimeStr + ':00+03:00';
}
// ============================================================

// v30.10: Durum sabitleri — 'Gerçekleşti' (visits.durum) vs 'Gerçekleşen' (opportunities.adim) karışıklığını önler
const VISIT_DURUM_GERCEKLESTI = 'Gerçekleşti';
const VISIT_DURUM_PLANLANDI = 'Planlandı';
const OPP_ADIM_GERCEKLESEN = 'Gerçekleşen';
const _HARDCODED_URL = 'https://iqehsplmbokptbauabyb.supabase.co';
const _HARDCODED_KEY = 'sb_publishable_sVNi_JhlHdeM60hIprbDJA_jOLEozOv';
// ==========================================

