/**
 * _worker.js — Şengüller Saha Satış
 * Statik dosyaları serve eder.
 * Cloudflare Workers + Static Assets (wrangler assets) ile çalışır.
 */
export default {
  async fetch(request, env) {
    // env.ASSETS: Cloudflare'in static asset binding'i
    // Tüm istekleri statik klasöre yönlendir
    return env.ASSETS.fetch(request);
  }
};
