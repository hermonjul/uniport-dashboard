// Lapisan olahan: cakupan per peran, filter channel, agregasi produksi,
// prioritas tindak lanjut, proyeksi target, dan risiko orang kunci.
import {
  AMBANG_CABANG_KONSENTRASI, AMBANG_MO_TURUN, BOBOT_EFFORT, BOBOT_PRIORITAS, BOBOT_STATUS,
  BULAN_P25, BULAN_P26, KELOMPOK_KANAL, NAMA_BULAN, NAMA_BULAN_PANJANG, PORSI_KONSENTRASI, STATUS_TERBUKA, TAHUN_BERJALAN,
  type Kelompok, type StatusProspek, type SubKanal,
} from '../config/dashboard';
import { DATA, type Cabang, type EffortHarian, type MO, type Prospek } from '../data/sumber';

// ── Cakupan & peran ─────────────────────────────────────────────────────────
export type Tingkat = 'nasional' | 'kanwil' | 'cabang' | 'mo';
export interface Cakupan { tingkat: Tingkat; id: string }
export const NASIONAL: Cakupan = { tingkat: 'nasional', id: 'NAS' };

export type Peran = 'direksi' | 'pemimpin-wilayah' | 'pimpinan-cabang' | 'marketing-officer';
export const PERAN: Record<Peran, { label: string; tingkat: Tingkat }> = {
  direksi: { label: 'Direksi', tingkat: 'nasional' },
  'pemimpin-wilayah': { label: 'Pemimpin Wilayah', tingkat: 'kanwil' },
  'pimpinan-cabang': { label: 'Pimpinan Cabang', tingkat: 'cabang' },
  'marketing-officer': { label: 'Marketing Officer', tingkat: 'mo' },
};

const petaKanwil = new Map(DATA.kanwil.map((k) => [k.id, k]));
const petaCabang = new Map(DATA.cabang.map((c) => [c.id, c]));
const petaMO = new Map(DATA.mo.map((m) => [m.id, m]));

/**
 * Akar cakupan dari hasil decrypt tautan akses. null bila peran tidak dikenal, unit
 * tidak ada, atau tingkat unit tidak cocok dengan perannya (mis. Direksi dengan unit cabang).
 */
export function akarAkses(peran: string, unitId: string): Cakupan | null {
  if (!(peran in PERAN)) return null;
  const tingkat = PERAN[peran as Peran].tingkat;
  const ada = tingkat === 'nasional' ? unitId === NASIONAL.id
    : tingkat === 'kanwil' ? petaKanwil.has(unitId)
    : tingkat === 'cabang' ? petaCabang.has(unitId)
    : petaMO.has(unitId);
  return ada ? (tingkat === 'nasional' ? NASIONAL : { tingkat, id: unitId }) : null;
}

/**
 * Hierarki akses portal: Direksi → semua; Pemimpin Wilayah → cabang & MO di wilayahnya;
 * Pimpinan Cabang → MO di cabangnya; Marketing Officer → dirinya sendiri.
 */
// ── Cabang dari API matrix/branches ─────────────────────────────────────────
// Cabang yang dimuat dari API didaftarkan di sini supaya nama & induk wilayahnya dikenal.
// Bila namanya cocok dengan cabang lokal (yang sudah punya data), id lokal yang dipakai.
interface CabangTerdaftar { nama: string; kanwilId: string; kodeApi: string }
const cabangApi = new Map<string, CabangTerdaftar>();
const normalNama = (s: string) => s.toLowerCase().replace(/\b(cabang|kc|kantor cabang)\b/g, '').replace(/[^a-z0-9]/g, '');

/** Mendaftarkan hasil API untuk satu wilayah; mengembalikan pilihan filter { id, nama }. */
export function daftarkanCabangApi(kanwilId: string, daftar: { kodeApi: string; nama: string }[]) {
  const lokalPerNama = new Map(DATA.cabang.filter((c) => c.kanwilId === kanwilId).map((c) => [normalNama(c.nama), c.id]));
  return daftar.map((x) => {
    const id = lokalPerNama.get(normalNama(x.nama)) ?? `API:${kanwilId}:${x.kodeApi}`;
    cabangApi.set(id, { nama: x.nama, kanwilId, kodeApi: x.kodeApi });
    return { id, nama: x.nama };
  });
}
export const kodeCabangApi = (id: string) => cabangApi.get(id)?.kodeApi;
/** true bila cabang ini sudah punya data di dashboard (bukan hanya terdaftar di API). */
export const cabangAdaData = (id: string) => petaCabang.has(id);
const kanwilDariCabang = (id: string) => petaCabang.get(id)?.kanwilId ?? cabangApi.get(id)?.kanwilId;

export function dalamAkar(akar: Cakupan, c: Cakupan): boolean {
  if (akar.tingkat === 'nasional') return true;
  if (akar.tingkat === c.tingkat) return akar.id === c.id;
  if (akar.tingkat === 'kanwil') {
    if (c.tingkat === 'cabang') return kanwilDariCabang(c.id) === akar.id;
    if (c.tingkat === 'mo') return petaMO.get(c.id)?.kanwilId === akar.id;
  }
  if (akar.tingkat === 'cabang' && c.tingkat === 'mo') return petaMO.get(c.id)?.cabangId === akar.id;
  return false;
}

/** Posisi sebuah cakupan dalam hierarki: Kantor Wilayah, cabang, dan MO yang sedang terpilih. */
export function posisiCakupan(c: Cakupan): { kanwilId?: string; cabangId?: string; moId?: string } {
  switch (c.tingkat) {
    case 'kanwil': return { kanwilId: c.id };
    case 'cabang': return { kanwilId: kanwilDariCabang(c.id), cabangId: c.id };
    case 'mo': { const m = petaMO.get(c.id); return { kanwilId: m?.kanwilId, cabangId: m?.cabangId, moId: c.id }; }
    default: return {};
  }
}

/** Pilihan filter unit per tingkat, urut nama. */
export const pilihanKanwil = () => DATA.kanwil.map((k) => ({ id: k.id, nama: k.nama }));
export const pilihanCabang = (kanwilId: string) =>
  DATA.cabang.filter((c) => c.kanwilId === kanwilId).map((c) => ({ id: c.id, nama: c.nama }))
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { numeric: true }));
export const pilihanMO = (cabangId: string) =>
  DATA.mo.filter((m) => m.cabangId === cabangId).map((m) => ({ id: m.id, nama: m.kode }))
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { numeric: true }));

// Label wilayah dari API matrix/kanwils untuk unit yang belum ada di data lokal (mis. Agency Development).
const labelWilayahApi = new Map<string, string>();
export function daftarkanLabelWilayah(daftar: { id: string; nama: string }[]) {
  daftar.forEach((k) => labelWilayahApi.set(k.id, k.nama));
}
/** true bila unit wilayah ini sudah punya data di dashboard (bukan hanya terdaftar di API). */
export const wilayahAdaData = (id: string) => petaKanwil.has(id);

export function namaCakupan(c: Cakupan): string {
  switch (c.tingkat) {
    case 'nasional': return 'Nasional';
    case 'kanwil': return petaKanwil.get(c.id)?.nama ?? labelWilayahApi.get(c.id) ?? c.id;
    case 'cabang': return petaCabang.get(c.id)?.nama ?? cabangApi.get(c.id)?.nama ?? c.id;
    default: return petaMO.get(c.id)?.kode ?? c.id;
  }
}

/** Jalur dari akar peran sampai cakupan aktif — untuk breadcrumb. */
export function jalur(c: Cakupan, akar: Cakupan): Cakupan[] {
  const semua: Cakupan[] = [NASIONAL];
  if (c.tingkat === 'kanwil') semua.push(c);
  if (c.tingkat === 'cabang') {
    const kw = kanwilDariCabang(c.id);
    semua.push(...(kw ? [{ tingkat: 'kanwil' as const, id: kw }] : []), c);
  }
  if (c.tingkat === 'mo') {
    const m = petaMO.get(c.id)!;
    semua.push({ tingkat: 'kanwil', id: m.kanwilId }, { tingkat: 'cabang', id: m.cabangId }, c);
  }
  const i = semua.findIndex((x) => x.tingkat === akar.tingkat && x.id === akar.id);
  return semua.slice(Math.max(0, i));
}

export function anakCakupan(c: Cakupan): Cakupan[] {
  switch (c.tingkat) {
    case 'nasional': return DATA.kanwil.map((k) => ({ tingkat: 'kanwil' as const, id: k.id }));
    case 'kanwil': return DATA.cabang.filter((x) => x.kanwilId === c.id).map((x) => ({ tingkat: 'cabang' as const, id: x.id }));
    case 'cabang': return DATA.mo.filter((x) => x.cabangId === c.id).map((x) => ({ tingkat: 'mo' as const, id: x.id }));
    default: return [];
  }
}

// ── Filter channel ──────────────────────────────────────────────────────────
/** Sub-channel diberi awalan `sub:` karena ada sub-channel yang namanya sama dengan grupnya (Direct). */
export type FilterKanal = 'Semua' | Kelompok | `sub:${SubKanal}`;
export const labelFilter = (f: FilterKanal) => (f.startsWith('sub:') ? f.slice(4) : f === 'Semua' ? 'Semua' : `Semua ${f}`);
export const kelompokDari = (s: SubKanal): Kelompok =>
  (KELOMPOK_KANAL.Direct as readonly string[]).includes(s) ? 'Direct' : 'Captive';

function lolosKanal(s: SubKanal, f: FilterKanal): boolean {
  if (f === 'Semua') return true;
  if (f === 'Direct' || f === 'Captive') return kelompokDari(s) === f;
  return `sub:${s}` === f;
}

function dalamCakupan(x: { kanwilId: string; cabangId: string; id?: string; moId?: string }, c: Cakupan): boolean {
  switch (c.tingkat) {
    case 'nasional': return true;
    case 'kanwil': return x.kanwilId === c.id;
    case 'cabang': return x.cabangId === c.id;
    default: return (x.moId ?? x.id) === c.id;
  }
}

export function moDalam(c: Cakupan, f: FilterKanal): MO[] {
  return DATA.mo.filter((m) => dalamCakupan(m, c) && lolosKanal(m.subKanal, f));
}
export function prospekDalam(c: Cakupan, f: FilterKanal): Prospek[] {
  return DATA.prospek.filter((p) => dalamCakupan(p, c) && lolosKanal(p.subKanal, f));
}

// ── Periode (filter tanggal) ────────────────────────────────────────────────
/**
 * Rentang bulan 2026 (indeks 0 = Januari). Butirannya BULAN, bukan hari: berkas produksi
 * sumber hanya memuat total per periode, jadi filter harian akan memberi kesan presisi palsu.
 */
export interface Periode { dari: number; sampai: number }
export const PERIODE_PENUH: Periode = { dari: 0, sampai: BULAN_P26 - 1 };
export const jumlahBulan = (p: Periode) => p.sampai - p.dari + 1;
export const periodePenuh = (p: Periode) => p.dari === PERIODE_PENUH.dari && p.sampai === PERIODE_PENUH.sampai;

/** "Jan–Jul 2026", "Mei 2026" · panjang: "Januari–Juli 2026". */
export function labelPeriode(p: Periode, panjang = false): string {
  const n = panjang ? NAMA_BULAN_PANJANG : NAMA_BULAN;
  return p.dari === p.sampai ? `${n[p.dari]} ${TAHUN_BERJALAN}` : `${n[p.dari]}–${n[p.sampai]} ${TAHUN_BERJALAN}`;
}

/** NWP satu MO dalam periode. */
export const nwpPeriode = (m: MO, p: Periode) => m.bulan26.slice(p.dari, p.sampai + 1).reduce((s, v) => s + v, 0);

// ── Produksi ────────────────────────────────────────────────────────────────
export interface Produksi {
  /** nwp26 = NWP dalam periode terpilih; nwpYTD = realisasi Jan–Jul penuh (dasar proyeksi). */
  nwp25: number; nwp26: number; nwpYTD: number; target: number; profit: number; periode: Periode;
  bulan25: number[]; bulan26: number[];
  /** Laju rata-rata per bulan — perbandingan tahun WAJIB memakai ini, bukan total mentah. */
  laju25: number; laju26: number; pertumbuhanLaju: number;
  targetBerjalan: number; capaianBerjalan: number; capaianTahun: number;
  perKelompok: Record<Kelompok, { nwp26: number; laju25: number; laju26: number }>;
  perSubKanal: { nama: SubKanal; nwp26: number }[];
  jumlahMO: number;
}

export function hitungProduksi(daftar: MO[], periode: Periode = PERIODE_PENUH): Produksi {
  const bulan25 = Array(BULAN_P25).fill(0), bulan26 = Array(BULAN_P26).fill(0);
  let nwp25 = 0, nwp26 = 0, nwpYTD = 0, target = 0, profit = 0;
  const n = jumlahBulan(periode);
  const kel: Record<Kelompok, { a25: number; a26: number }> = { Direct: { a25: 0, a26: 0 }, Captive: { a25: 0, a26: 0 } };
  const sub = new Map<SubKanal, number>();
  for (const m of daftar) {
    const nilai = nwpPeriode(m, periode);
    nwp25 += m.nwp25; nwp26 += nilai; nwpYTD += m.nwp26; target += m.target;
    profit += nilai * petaCabang.get(m.cabangId)!.rasioProfit;
    m.bulan25.forEach((v, i) => (bulan25[i] += v));
    m.bulan26.forEach((v, i) => (bulan26[i] += v));
    const k = kelompokDari(m.subKanal);
    kel[k].a25 += m.nwp25; kel[k].a26 += nilai;
    sub.set(m.subKanal, (sub.get(m.subKanal) ?? 0) + nilai);
  }
  // Laju 2026 = rata-rata per bulan dalam periode; pembanding tetap rata-rata 12 bulan 2025 (run-rate).
  const laju25 = nwp25 / BULAN_P25, laju26 = nwp26 / n;
  const targetBerjalan = (target * n) / 12; // ASUMSI: target bulanan merata
  return {
    nwp25, nwp26, nwpYTD, target, profit, periode, bulan25, bulan26, laju25, laju26,
    pertumbuhanLaju: laju25 > 0 ? laju26 / laju25 - 1 : NaN,
    targetBerjalan, capaianBerjalan: targetBerjalan > 0 ? nwp26 / targetBerjalan : NaN,
    capaianTahun: target > 0 ? nwp26 / target : NaN,
    perKelompok: {
      Direct: { nwp26: kel.Direct.a26, laju25: kel.Direct.a25 / BULAN_P25, laju26: kel.Direct.a26 / n },
      Captive: { nwp26: kel.Captive.a26, laju25: kel.Captive.a25 / BULAN_P25, laju26: kel.Captive.a26 / n },
    },
    perSubKanal: [...sub.entries()].map(([nama, v]) => ({ nama, nwp26: v })).sort((a, b) => b.nwp26 - a.nwp26),
    jumlahMO: daftar.length,
  };
}

// ── Prioritas tindak lanjut ─────────────────────────────────────────────────
export interface ProspekPrioritas extends Prospek { skor: number; moKode: string; cabangNama: string }
export type Kelompok_JT = 'lewat' | 'hariIni' | 'h1_3' | 'h4_7';
export const LABEL_JT: Record<Kelompok_JT, string> = {
  lewat: 'Lewat jatuh tempo', hariIni: 'Jatuh tempo hari ini', h1_3: '1-3 hari lagi', h4_7: '4-7 hari lagi',
};

export function kelompokJatuhTempo(sisa: number): Kelompok_JT | null {
  if (sisa < 0) return 'lewat';
  if (sisa === 0) return 'hariIni';
  if (sisa <= 3) return 'h1_3';
  if (sisa <= 7) return 'h4_7';
  return null;
}

/** Skor gabungan: kategori status × nilai premi (log) × keterlambatan. ASUMSI — lihat Batasan & Asumsi. */
export function skorPrioritas(p: Prospek): number {
  const telat = Math.max(0, -(p.sisaHari ?? 0));
  const dekat = p.sisaHari !== null && p.sisaHari >= 0 ? 1 / (1 + p.sisaHari * 0.15) : 1;
  return (BOBOT_PRIORITAS[p.status] ?? 0) * Math.log10(p.premi / 1e6 + 1) * (1 + telat / 7) * dekat * 10;
}

export function daftarPrioritas(ps: Prospek[]): ProspekPrioritas[] {
  return ps
    .filter((p) => STATUS_TERBUKA.includes(p.status) && p.sisaHari !== null)
    .map((p) => ({
      ...p, skor: skorPrioritas(p), moKode: petaMO.get(p.moId)!.kode, cabangNama: petaCabang.get(p.cabangId)!.nama,
    }))
    .sort((a, b) => b.skor - a.skor);
}

export function hitungJatuhTempo(ps: Prospek[]): Record<Kelompok_JT, { jumlah: number; premi: number }> {
  const r: Record<Kelompok_JT, { jumlah: number; premi: number }> = {
    lewat: { jumlah: 0, premi: 0 }, hariIni: { jumlah: 0, premi: 0 }, h1_3: { jumlah: 0, premi: 0 }, h4_7: { jumlah: 0, premi: 0 },
  };
  for (const p of ps) {
    if (!STATUS_TERBUKA.includes(p.status) || p.sisaHari === null) continue;
    const k = kelompokJatuhTempo(p.sisaHari);
    if (k) { r[k].jumlah++; r[k].premi += p.premi; }
  }
  return r;
}

/** Beban tindak lanjut mendesak (lewat + hari ini) per unit anak. */
export function sebaranBeban(c: Cakupan, f: FilterKanal): { unit: Cakupan; nama: string; jumlah: number; premi: number }[] {
  return anakCakupan(c)
    .map((u) => {
      const jt = hitungJatuhTempo(prospekDalam(u, f));
      return { unit: u, nama: namaCakupan(u), jumlah: jt.lewat.jumlah + jt.hariIni.jumlah, premi: jt.lewat.premi + jt.hariIni.premi };
    })
    .filter((x) => x.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);
}

// ── Proyeksi pencapaian target ──────────────────────────────────────────────
export interface Proyeksi {
  dariLaju: number; dariPipeline: number; target: number; sisaTarget: number;
  pipelineBerbobot: number; kecukupanPipeline: number;
  sumbangan: { status: StatusProspek; mentah: number; berbobot: number; jumlah: number }[];
}

export function hitungProyeksi(prod: Produksi, ps: Prospek[]): Proyeksi {
  const sumbangan = STATUS_TERBUKA.map((status) => {
    const x = ps.filter((p) => p.status === status);
    const mentah = x.reduce((s, p) => s + p.premi, 0);
    return { status, mentah, berbobot: mentah * (BOBOT_STATUS[status] ?? 0), jumlah: x.length };
  });
  const pipelineBerbobot = sumbangan.reduce((s, x) => s + x.berbobot, 0);
  // Proyeksi selalu berangkat dari realisasi Jan–Jul penuh; periode terpilih hanya menentukan laju
  // untuk sisa bulan. Pada periode penuh hasilnya sama dengan laju × 12.
  const sisaTarget = Math.max(0, prod.target - prod.nwpYTD);
  return {
    dariLaju: prod.nwpYTD + prod.laju26 * (12 - BULAN_P26),
    // Sengaja TIDAK dijumlahkan dengan proyeksi laju: keduanya perkiraan terpisah.
    dariPipeline: prod.nwpYTD + pipelineBerbobot,
    target: prod.target, sisaTarget, pipelineBerbobot,
    kecukupanPipeline: sisaTarget > 0 ? pipelineBerbobot / sisaTarget : NaN,
    sumbangan,
  };
}

// ── Ketergantungan orang kunci & perlu ditanyakan ───────────────────────────
export interface Konsentrasi { cabang: Cabang; nwp26: number; moTeratas: MO; porsi: number }

export function ketergantunganOrangKunci(c: Cakupan, f: FilterKanal, p: Periode = PERIODE_PENUH): Konsentrasi[] {
  // Ambang Rp 2 M ditetapkan untuk 7 bulan; disetarakan dengan panjang periode.
  const ambang = (AMBANG_CABANG_KONSENTRASI * jumlahBulan(p)) / BULAN_P26;
  const cabangList = c.tingkat === 'nasional' ? DATA.cabang
    : c.tingkat === 'kanwil' ? DATA.cabang.filter((x) => x.kanwilId === c.id)
    : c.tingkat === 'cabang' ? DATA.cabang.filter((x) => x.id === c.id) : [];
  const hasil: Konsentrasi[] = [];
  for (const cb of cabangList) {
    const mos = moDalam({ tingkat: 'cabang', id: cb.id }, f);
    const total = mos.reduce((s, m) => s + nwpPeriode(m, p), 0);
    if (total < ambang || !mos.length) continue;
    const top = mos.reduce((a, b) => (nwpPeriode(b, p) > nwpPeriode(a, p) ? b : a));
    const porsi = nwpPeriode(top, p) / total;
    if (porsi >= PORSI_KONSENTRASI) hasil.push({ cabang: cb, nwp26: total, moTeratas: top, porsi });
  }
  return hasil.sort((a, b) => b.porsi - a.porsi);
}

/** nwp26 pada hasil = NWP dalam periode terpilih. */
export function perluDitanyakan(c: Cakupan, f: FilterKanal, p: Periode = PERIODE_PENUH): (MO & { cabangNama: string })[] {
  return moDalam(c, f)
    .filter((m) => !m.baruBergabung && m.nwp25 > AMBANG_MO_TURUN && nwpPeriode(m, p) <= 0)
    .map((m) => ({ ...m, nwp26: nwpPeriode(m, p), cabangNama: petaCabang.get(m.cabangId)!.nama }))
    .sort((a, b) => b.nwp25 - a.nwp25);
}

// ── Kinerja per unit anak ───────────────────────────────────────────────────
export interface BarisKinerja { unit: Cakupan; nama: string; prod: Produksi }

export function kinerjaAnak(c: Cakupan, f: FilterKanal, p: Periode = PERIODE_PENUH): BarisKinerja[] {
  return anakCakupan(c)
    .map((u) => ({ unit: u, nama: namaCakupan(u), prod: hitungProduksi(moDalam(u, f), p) }))
    .filter((b) => b.prod.jumlahMO > 0)
    .sort((a, b) => b.prod.nwp26 - a.prod.nwp26);
}

// ── Ritme kerja (effort) ────────────────────────────────────────────────────
export interface HariEffort extends EffortHarian { indeks: number }

export function ritmeKerja(daftar: MO[]): HariEffort[] {
  const n = DATA.effort.values().next().value?.length ?? 0;
  const hasil: HariEffort[] = Array.from({ length: n }, () => ({ kunjungan: 0, penawaran: 0, followUp: 0, telepon: 0, indeks: 0 }));
  for (const m of daftar) {
    DATA.effort.get(m.id)!.forEach((h, i) => {
      hasil[i].kunjungan += h.kunjungan; hasil[i].penawaran += h.penawaran;
      hasil[i].followUp += h.followUp; hasil[i].telepon += h.telepon;
    });
  }
  hasil.forEach((h) => {
    h.indeks = h.kunjungan * BOBOT_EFFORT.kunjungan + h.penawaran * BOBOT_EFFORT.penawaran
      + h.followUp * BOBOT_EFFORT.followUp + h.telepon * BOBOT_EFFORT.telepon;
  });
  return hasil;
}

// ── Pencarian ───────────────────────────────────────────────────────────────
export function cari(teks: string, akar: Cakupan): { cakupan: Cakupan; nama: string; ket: string }[] {
  const q = teks.trim().toLowerCase();
  if (q.length < 2) return [];
  const hasil: { cakupan: Cakupan; nama: string; ket: string }[] = [];
  const bolehCabang = (cb: Cabang) =>
    akar.tingkat === 'nasional' || (akar.tingkat === 'kanwil' && cb.kanwilId === akar.id) || (akar.tingkat === 'cabang' && cb.id === akar.id);
  for (const cb of DATA.cabang) {
    if (bolehCabang(cb) && (cb.nama.toLowerCase().includes(q) || cb.id.toLowerCase().includes(q)))
      hasil.push({ cakupan: { tingkat: 'cabang', id: cb.id }, nama: cb.nama, ket: petaKanwil.get(cb.kanwilId)!.nama });
  }
  for (const m of DATA.mo) {
    if (bolehCabang(petaCabang.get(m.cabangId)!) && m.kode.toLowerCase().includes(q))
      hasil.push({ cakupan: { tingkat: 'mo', id: m.id }, nama: m.kode, ket: petaCabang.get(m.cabangId)!.nama });
  }
  return hasil.slice(0, 8);
}

export const infoMO = (id: string) => petaMO.get(id);
export const infoCabang = (id: string) => petaCabang.get(id);
