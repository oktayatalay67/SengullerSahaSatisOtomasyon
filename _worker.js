/**
 * _worker.js — Şengüller Saha Satış
 * Cloudflare Workers Static Assets serving
 */
export default {
  async fetch(request, env, ctx) {
    // Static assets varsa serve et
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    // Fallback: doğrudan fetch
    return fetch(request);
  }
};
