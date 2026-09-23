// Klien API backend Go (Matrix Distribution). Dipanggil lewat '/api-go' — proxy dev server
// meneruskannya ke URL_GO di .env, jadi alamat server internal tidak tertulis di kode browser.
const DASAR = (import.meta.env.VITE_API_GO ?? '/api-go').replace(/\/$/, '');

const BATAS_WAKTU_MS = 8000;

/** Bentuk balasan umum backend: { success, data }. */
interface Balasan<T> { success: boolean; data: T; message?: string }

export interface KanwilApi { code: string; label: string | null }

async function ambil<T>(endpoint: string, sinyal?: AbortSignal): Promise<T> {
  // Batas waktu supaya filter tidak tertahan "Memuat…" bila backend tidak terjangkau.
  const batas = AbortSignal.timeout(BATAS_WAKTU_MS);
  const res = await fetch(`${DASAR}/${endpoint}`, {
    headers: { Accept: 'application/json' }, signal: sinyal ? AbortSignal.any?.([sinyal, batas]) ?? batas : batas,
  });
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
  const isi = (await res.json()) as Balasan<T>;
  if (!isi?.success) throw new Error(`${endpoint}: ${isi?.message ?? 'success=false'}`);
  return isi.data;
}

/** GET matrix/kanwils → daftar Kantor Wilayah (termasuk unit non-wilayah seperti Agency Development). */
export async function ambilKanwil(sinyal?: AbortSignal): Promise<KanwilApi[]> {
  const data = await ambil<KanwilApi[]>('matrix/kanwils', sinyal);
  if (!Array.isArray(data)) throw new Error('matrix/kanwils: data bukan array');
  return data.filter((k) => k && typeof k.code === 'string');
}

/** Item respons matrix/branches (bentuk asli dari backend). */
interface CabangMentah { branchCode: string; branchName: string | null; branchMatrixDistribution: string }

/** Cabang hasil normalisasi dari matrix/branches. */
export interface CabangApi { kodeApi: string; nama: string }

/** GET matrix/branches?branchMatrixDistribution={kode wilayah dari matrix/kanwils}. */
export async function ambilCabang(kodeKanwil: string, sinyal?: AbortSignal): Promise<CabangApi[]> {
  const data = await ambil<CabangMentah[]>(
    `matrix/branches?branchMatrixDistribution=${encodeURIComponent(kodeKanwil)}`, sinyal,
  );
  if (!Array.isArray(data)) throw new Error('matrix/branches: data bukan array');
  return data
    .filter((x) => x && typeof x.branchCode === 'string' && x.branchCode)
    // Rapikan spasi ganda di nama (mis. "AGENCY  X"); nama kosong → kode cabang.
    .map((x) => ({ kodeApi: x.branchCode, nama: x.branchName?.replace(/\s+/g, ' ').trim() || x.branchCode }));
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
  mo?: string;
  channel?: string;  // 'Direct' | 'Captive' | nama sub-channel
  bulanDari: number; // 1–12
  bulanSampai: number;
  tahun: number;
}
