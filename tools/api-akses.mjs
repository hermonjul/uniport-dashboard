// Layanan API akses portal (contoh acuan untuk tim TI) — tanpa dependensi.
//   POST /api/akses/dekrip   body: { "token": "<token dari tautan>" }
//   200 → { "peran": "...", "unitId": "...", "exp": 1790000000 }
//   401 → { "galat": "..." } bila token rusak, palsu, atau kedaluwarsa.
//
// Jalankan: npm run api   (port dari AKSES_PORT, bawaan 8787)
// Dev server Vite meneruskan /api ke sini (lihat vite.config.ts).
import { createServer } from 'node:http';
import { ambilKunci, dekrip, muatEnv } from './lib-akses.mjs';

muatEnv();
const kunci = ambilKunci();
const PORT = Number(process.env.AKSES_PORT || 8787);
// Asal yang boleh memanggil API (untuk build yang dibuka dari domain lain). Kosong = hanya lewat proxy.
const ASAL = (process.env.AKSES_ASAL_DIIZINKAN || '').split(',').map((s) => s.trim()).filter(Boolean);

function kirim(res, kode, isi, asal) {
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (asal && ASAL.includes(asal)) Object.assign(h, { 'Access-Control-Allow-Origin': asal, Vary: 'Origin' });
  res.writeHead(kode, h);
  res.end(JSON.stringify(isi));
}

createServer((req, res) => {
  const asal = req.headers.origin;
  if (req.method === 'OPTIONS') {
    res.writeHead(204, ASAL.includes(asal) ? {
      'Access-Control-Allow-Origin': asal, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin',
    } : {});
    return res.end();
  }
  if (req.method !== 'POST' || req.url !== '/api/akses/dekrip') return kirim(res, 404, { galat: 'tidak ditemukan' }, asal);

  let isi = '';
  req.on('data', (c) => { isi += c; if (isi.length > 4096) req.destroy(); });
  req.on('end', () => {
    try {
      const { token } = JSON.parse(isi || '{}');
      if (!token) return kirim(res, 400, { galat: 'token wajib diisi' }, asal);
      kirim(res, 200, dekrip(token, kunci), asal);
    } catch (e) {
      // Alasan rinci hanya di log server; klien cukup tahu tautannya tidak berlaku.
      const t = (() => { try { return String(JSON.parse(isi).token ?? ''); } catch { return ''; } })();
      console.warn(`[akses] ${new Date().toLocaleTimeString('id-ID')} ditolak: ${e.message} (panjang token ${t.length}, awal ${t.slice(0, 6)}…)`);
      kirim(res, 401, { galat: 'tautan tidak valid atau sudah kedaluwarsa' }, asal);
    }
  });
}).listen(PORT, () => console.log(`API akses portal berjalan di http://localhost:${PORT}/api/akses/dekrip`));
