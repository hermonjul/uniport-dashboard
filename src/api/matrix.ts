// Klien API backend Go (Matrix Distribution). Dipanggil lewat '/api-go' — proxy dev server
// meneruskannya ke URL_GO di .env, jadi alamat server internal tidak tertulis di kode browser.
const DASAR = (import.meta.env.VITE_API_GO ?? '/api-go').replace(/\/$/, '');

const BATAS_WAKTU_MS = 8000;

/** Bentuk balasan umum backend: { success, data }. */
interface Balasan<T> { success: boolean; data: T; message?: string }

/** Wilayah hasil normalisasi dari matrix/kanwils. `code` = kode yang dikirim ke endpoint lain. */
export interface KanwilApi { code: string; label: string | null }

/** Pilihan dropdown dari backend: { value, label }. */
interface OpsiMentah { value?: unknown; label?: unknown }

async function ambil<T>(endpoint: string, opsi: { sinyal?: AbortSignal; body?: unknown } = {}): Promise<T> {
  // Batas waktu supaya filter tidak tertahan "Memuat…" bila backend tidak terjangkau.
  const batas = AbortSignal.timeout(BATAS_WAKTU_MS);
  const { sinyal, body } = opsi;
  const res = await fetch(`${DASAR}/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Accept: 'application/json', ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: sinyal ? AbortSignal.any?.([sinyal, batas]) ?? batas : batas,
  });
  // Pesan galat backend ({ success:false, message }) diteruskan bila ada.
  const isi = (await res.json().catch(() => null)) as Balasan<T> | null;
  if (!res.ok || !isi?.success) throw new Error(`${endpoint}: ${isi?.message ?? `HTTP ${res.status}`}`);
  return isi.data;
}

/** Normalisasi { value, label } → { kode, nama }; label kosong → kode, spasi ganda dirapikan. */
function normalOpsi(data: unknown, endpoint: string): { kode: string; nama: string | null }[] {
  if (!Array.isArray(data)) throw new Error(`${endpoint}: data bukan array`);
  return (data as OpsiMentah[]).flatMap((x) => {
    const kode = typeof x?.value === 'string' || typeof x?.value === 'number' ? String(x.value).trim() : '';
    if (!kode) return [];
    const nama = typeof x.label === 'string' ? x.label.replace(/\s+/g, ' ').trim() || null : null;
    return [{ kode, nama }];
  });
}

/** GET matrix/kanwils → daftar wilayah (termasuk unit non-wilayah seperti Agency Development). */
export async function ambilKanwil(sinyal?: AbortSignal): Promise<KanwilApi[]> {
  const data = await ambil<unknown>('matrix/kanwils', { sinyal });
  return normalOpsi(data, 'matrix/kanwils').map((x) => ({ code: x.kode, label: x.nama }));
}

/** Cabang hasil normalisasi dari matrix/branches. */
export interface CabangApi { kodeApi: string; nama: string }

/**
 * POST matrix/branches, body { "kanwil": "<kode dari matrix/kanwils>" }.
 * Backend menolak field lain ("invalid JSON body") dan kode di luar daftar kanwils.
 */
export async function ambilCabang(kodeKanwil: string, sinyal?: AbortSignal): Promise<CabangApi[]> {
  const data = await ambil<unknown>('matrix/branches', { sinyal, body: { kanwil: kodeKanwil } });
  return normalOpsi(data, 'matrix/branches').map((x) => ({ kodeApi: x.kode, nama: x.nama ?? x.kode }));
}

/** Marketing Officer hasil normalisasi dari matrix/marketings. */
export interface MarketingApi { kodeApi: string; nama: string }

/** POST matrix/marketings, body { "branch": "<value dari matrix/branches>" }. Cabang tanpa MO → []. */
export async function ambilMarketing(kodeCabang: string, sinyal?: AbortSignal): Promise<MarketingApi[]> {
  const data = await ambil<unknown>('matrix/marketings', { sinyal, body: { branch: kodeCabang } });
  return normalOpsi(data, 'matrix/marketings').map((x) => ({ kodeApi: x.kode, nama: x.nama ?? x.kode }));
}

// ── Parameter filter untuk permintaan data berikutnya ──────────────────────
// Setiap perubahan filter (wilayah, cabang, MO, channel, periode) nantinya memicu permintaan
// data ke backend. Endpoint datanya belum tersedia; fungsi ini menyiapkan parameternya
// supaya pemanggilan tinggal disambungkan di satu tempat (lihat App.tsx, `parameterApi`).

/** Unit dashboard "KW2" ↔ kode API "2"; "KWAD" ↔ "AD". */
export const kodeKanwilApi = (idUnit: string) => idUnit.replace(/^KW/, '');
export const idUnitDariKodeApi = (kode: string) => `KW${kode}`;

export interface ParameterFilterApi {
  kanwil?: string;   // kode dari matrix/kanwils
  cabang?: string;
  mo?: string;      // value dari matrix/marketings
  channel?: string;  // 'Direct' | 'Captive' | nama sub-channel
  bulanDari: number; // 1–12
  bulanSampai: number;
  tahun: number;
}
