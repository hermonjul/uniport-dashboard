// Enkripsi/dekripsi token akses portal — HANYA untuk sisi server (Node).
// Jangan pernah di-import dari src/: kuncinya tidak boleh ikut ke browser.
//
// Format token: base64url( iv[12] | ciphertext | authTag[16] ), AES-256-GCM.
// Isi token (JSON): { p: peran, u: unitId, exp: detik-epoch }.
// GCM sekaligus menjamin keaslian: token yang diubah satu karakter pun gagal didekrip.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PERAN_SAH = ['direksi', 'pemimpin-wilayah', 'pimpinan-cabang', 'marketing-officer'];

/** Muat .env sederhana (Node 18 belum punya --env-file). Variabel yang sudah ada di environment menang. */
export function muatEnv() {
  const berkas = fileURLToPath(new URL('../.env', import.meta.url));
  if (!existsSync(berkas)) return;
  for (const baris of readFileSync(berkas, 'utf8').split(/\r?\n/)) {
    const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

export function ambilKunci() {
  muatEnv();
  const k = process.env.AKSES_KUNCI;
  if (!k) throw new Error('AKSES_KUNCI belum diisi di .env — buat dengan: npm run kunci');
  const kunci = Buffer.from(k, 'base64url');
  if (kunci.length !== 32) throw new Error('AKSES_KUNCI harus 32 byte (base64url)');
  return kunci;
}

export function kunciBaru() {
  return randomBytes(32).toString('base64url');
}

export function enkrip(isi, kunci) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', kunci, iv);
  const data = Buffer.concat([c.update(JSON.stringify(isi), 'utf8'), c.final()]);
  return Buffer.concat([iv, data, c.getAuthTag()]).toString('base64url');
}

/** Mengembalikan { peran, unitId, exp } atau melempar Error bila token rusak/palsu/kedaluwarsa. */
export function dekrip(token, kunci) {
  const buf = Buffer.from(String(token), 'base64url');
  if (buf.length < 12 + 16 + 2) throw new Error('token rusak');
  const iv = buf.subarray(0, 12), tag = buf.subarray(buf.length - 16), data = buf.subarray(12, buf.length - 16);
  const d = createDecipheriv('aes-256-gcm', kunci, iv);
  d.setAuthTag(tag);
  const isi = JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8'));
  if (!PERAN_SAH.includes(isi.p) || typeof isi.u !== 'string') throw new Error('isi token tidak sah');
  if (typeof isi.exp !== 'number' || isi.exp * 1000 < Date.now()) throw new Error('token kedaluwarsa');
  return { peran: isi.p, unitId: isi.u, exp: isi.exp };
}
