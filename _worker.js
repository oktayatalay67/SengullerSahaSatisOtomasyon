/**
 * _worker.js — Şengüller Saha Satış
 * Cloudflare Workers Static Assets serving
 * V31.155: /api/send-mail eklendi — Resend üzerinden sunucu taraflı email
 * gönderimi (Şengüller-360/functions/api/lib/leave-mail.js ile aynı desen).
 */

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

function jsonYanit(obj, status){
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {'Content-Type':'application/json; charset=utf-8'}
  });
}

async function handleSendMail(request, env){
  if(!env.RESEND_API_KEY || !env.MAIL_FROM){
    return jsonYanit({error:'RESEND_API_KEY veya MAIL_FROM tanımlı değil (wrangler secret put)'}, 500);
  }
  // İsteğe bağlı paylaşılan secret — tanımlıysa header ile doğrulanır.
  if(env.MAIL_API_SECRET){
    const gelen = request.headers.get('X-Mail-Secret');
    if(gelen !== env.MAIL_API_SECRET){
      return jsonYanit({error:'Yetkisiz'}, 401);
    }
  }

  let body;
  try{ body = await request.json(); }catch{ return jsonYanit({error:'Geçersiz JSON gövde'}, 400); }

  const to = Array.isArray(body.to) ? body.to.filter(Boolean) : [body.to].filter(Boolean);
  if(!to.length || !body.subject){
    return jsonYanit({error:'to ve subject zorunlu'}, 400);
  }

  try{
    const resp = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to,
        subject: body.subject,
        text: body.text || '',
        html: body.html || undefined
      })
    });
    const raw = await resp.text();
    if(!resp.ok){
      return jsonYanit({error:`Resend gönderimi başarısız: ${resp.status} ${raw.slice(0,300)}`}, 502);
    }
    let data = {};
    try{ data = JSON.parse(raw); }catch{}
    return jsonYanit({ok:true, ...data});
  }catch(err){
    return jsonYanit({error: err && err.message ? err.message : String(err)}, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if(url.pathname === '/api/send-mail' && request.method === 'POST'){
      return handleSendMail(request, env);
    }

    // Static assets varsa serve et
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    // Fallback: doğrudan fetch
    return fetch(request);
  }
};
