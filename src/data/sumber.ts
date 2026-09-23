// ─────────────────────────────────────────────────────────────────────────────
// DATA CONTOH — BUKAN DATA ASLI.
//
// Repo ini belum memuat ekspor eReport / HCQ / Matrix Distribution, jadi seluruh
// rincian di bawah dibangkitkan dengan PRNG ber-seed (hasil selalu sama tiap dimuat).
// Hanya TOTAL nasional yang dijangkarkan ke angka PRD (config/dashboard.ts).
// Nama cabang & MO sengaja berupa kode, bukan nama sungguhan, supaya angka contoh
// tidak bisa disangka kinerja orang/cabang yang nyata. Nama nasabah & prospek
// tidak pernah ada di model data ini (Aturan Emas).
//
// Saat ekspor asli tersedia, ganti isi `bangkitkanData()` dengan pemuat data asli
// yang mengembalikan bentuk `SumberData` yang sama — lapisan lain tidak perlu diubah.
// ─────────────────────────────────────────────────────────────────────────────
import {
  BULAN_P25, BULAN_P26, HARI_RITME, JUMLAH_CABANG, JUMLAH_KANWIL, JUMLAH_MO,
  RATA_PREMI_PROSPEK, SLA_STATUS, TANGGAL_ACUAN, SEMUA_SUB_KANAL, TOTAL_NWP_2025, TOTAL_NWP_2026,
  TOTAL_TARGET_2026, type StatusProspek, type SubKanal,
} from '../config/dashboard';

export interface Kanwil { id: string; nama: string }
export interface Cabang { id: string; nama: string; kanwilId: string; target: number; rasioProfit: number }
export interface MO {
  id: string; kode: string; cabangId: string; kanwilId: string; subKanal: SubKanal;
  nwp25: number; nwp26: number; bulan25: number[]; bulan26: number[];
  target: number; baruBergabung: boolean;
}
export type Tahap =
  | 'Prospek Baru' | 'Tahap Awal' | 'Follow Up' | 'Negosiasi' | 'Proposal' | 'Terbit Polis' | 'Pending' | 'Close';
export interface Prospek {
  id: string; moId: string; cabangId: string; kanwilId: string; subKanal: SubKanal;
  status: StatusProspek; tahap: Tahap; premi: number;
  /** Hari tersisa sampai batas tindak lanjut; negatif = lewat jatuh tempo. null untuk status tertutup. */
  sisaHari: number | null;
}
/** Aktivitas harian satu MO, indeks 0 = hari tertua dari jendela HARI_RITME. */
export interface EffortHarian { kunjungan: number; penawaran: number; followUp: number; telepon: number }

export interface SumberData {
  kanwil: Kanwil[]; cabang: Cabang[]; mo: MO[]; prospek: Prospek[];
  effort: Map<string, EffortHarian[]>;
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260923;

/**
 * Persona peragaan untuk pilihan "Lihat sebagai" Pimpinan Cabang & Marketing Officer.
 * Hanya NAMA yang diganti; angkanya tetap data contoh hasil generator (bukan kinerja asli).
 * Dipilih unit yang tidak masuk daftar Ketergantungan Orang Kunci / Perlu Ditanyakan.
 */
export const PERSONA = {
  cabang: { id: 'KW3-C04', nama: 'Cabang Samarinda' },
  mo: { id: 'MO0561', nama: 'Novita Lubis' },
} as const;

export function bangkitkanData(): SumberData {
  const acak = mulberry32(SEED);
  const normal = () => {
    const u = 1 - acak(), v = acak();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pilihBerbobot = <T,>(item: readonly T[], bobot: readonly number[]): T => {
    const total = bobot.reduce((s, b) => s + b, 0);
    let r = acak() * total;
    for (let i = 0; i < item.length; i++) { r -= bobot[i]; if (r <= 0) return item[i]; }
    return item[item.length - 1];
  };
  const pecahBulanan = (total: number, n: number) => {
    const w = Array.from({ length: n }, (_, i) => Math.max(0.2, 1 + 0.22 * normal() + 0.015 * i));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => (total * x) / s);
  };

  // ── Kantor Wilayah & cabang ──
  const kanwil: Kanwil[] = Array.from({ length: JUMLAH_KANWIL }, (_, i) => ({
    id: `KW${i + 1}`, nama: `Kantor Wilayah ${i + 1}`,
  }));
  const jumlahCabangPerKanwil = [42, 40, JUMLAH_CABANG - 82];
  const skalaKanwil = [1.25, 1.0, 0.8];
  const cabang: Cabang[] = [];
  const ukuranCabang: number[] = [];
  kanwil.forEach((kw, k) => {
    for (let j = 0; j < jumlahCabangPerKanwil[k]; j++) {
      cabang.push({
        id: `${kw.id}-C${String(j + 1).padStart(2, '0')}`,
        nama: `Cabang ${k + 1}.${String(j + 1).padStart(2, '0')}`,
        kanwilId: kw.id, target: 0, rasioProfit: 0.08 + acak() * 0.14,
      });
      ukuranCabang.push(Math.exp(0.75 * normal()) * skalaKanwil[k]);
    }
  });

  // ── Marketing Officer: 2 per cabang, sisanya disebar menurut ukuran cabang ──
  const cabangMO: number[] = [];
  cabang.forEach((_, i) => cabangMO.push(i, i));
  while (cabangMO.length < JUMLAH_MO) cabangMO.push(pilihBerbobot(cabang.map((_, i) => i), ukuranCabang));
  cabangMO.sort((a, b) => a - b);

  const bobotKanal = [0.18, 0.12, 0.15, 0.22, 0.1, 0.15, 0.08];
  const cabangBertumpu = new Set(cabang.map((_, i) => i).filter(() => acak() < 0.16));
  const sudahBintang = new Set<number>();

  const mo: MO[] = cabangMO.map((ci, n) => {
    const c = cabang[ci];
    const baru = acak() < 0.05;
    let nwp25 = baru ? 0 : Math.exp(1.05 * normal()) * ukuranCabang[ci];
    if (cabangBertumpu.has(ci) && !sudahBintang.has(ci)) { nwp25 *= 7; sudahBintang.add(ci); }
    let pertumbuhan = Math.exp(0.027 + 0.33 * normal());
    if (baru) pertumbuhan = 0;
    let nwp26 = baru ? Math.exp(normal()) * ukuranCabang[ci] * 0.25 : (nwp25 * BULAN_P26 / BULAN_P25) * pertumbuhan;
    // Sebagian kecil MO berhenti berproduksi / minus karena pembatalan.
    if (!baru && acak() < 0.06) nwp26 = acak() < 0.5 ? 0 : -acak() * 0.02 * nwp25;
    return {
      id: `MO${String(n + 1).padStart(4, '0')}`, kode: `MO-${String(n + 1).padStart(4, '0')}`,
      cabangId: c.id, kanwilId: c.kanwilId, subKanal: pilihBerbobot(SEMUA_SUB_KANAL, bobotKanal),
      nwp25, nwp26, bulan25: [], bulan26: [], target: 0, baruBergabung: baru,
    };
  });

  // Skalakan agar total nasional sama persis dengan angka acuan.
  const s25 = mo.reduce((s, m) => s + m.nwp25, 0);
  mo.forEach((m) => { m.nwp25 *= TOTAL_NWP_2025 / s25; });
  // Ambang "turun drastis" diukur sesudah skala; nilai minus ikut diskalakan relatif nwp25 barunya.
  const negatif = mo.filter((m) => m.nwp26 < 0);
  negatif.forEach((m) => { m.nwp26 = -Math.min(8e6, m.nwp25 * 0.02) * (0.3 + acak()); });
  const sNeg = negatif.reduce((s, m) => s + m.nwp26, 0);
  const sPos = mo.reduce((s, m) => s + (m.nwp26 > 0 ? m.nwp26 : 0), 0);
  mo.forEach((m) => { if (m.nwp26 > 0) m.nwp26 *= (TOTAL_NWP_2026 - sNeg) / sPos; });
  mo.forEach((m) => {
    m.bulan25 = pecahBulanan(m.nwp25, BULAN_P25);
    m.bulan26 = pecahBulanan(m.nwp26, BULAN_P26);
  });

  // Target cabang: produksi tahun lalu × faktor tumbuh, diskalakan ke target nasional.
  const prod25Cabang = new Map<string, number>();
  mo.forEach((m) => prod25Cabang.set(m.cabangId, (prod25Cabang.get(m.cabangId) ?? 0) + m.nwp25));
  cabang.forEach((c) => { c.target = (prod25Cabang.get(c.id) ?? 0) * Math.exp(0.2 + 0.15 * normal()) + 5e8; });
  const sTarget = cabang.reduce((s, c) => s + c.target, 0);
  cabang.forEach((c) => { c.target *= TOTAL_TARGET_2026 / sTarget; });
  // Target MO dibagi dari target cabang sesuai porsi produksi tahun lalu (rata jika cabang nol).
  const petaCabang = new Map(cabang.map((c) => [c.id, c]));
  const moPerCabang = new Map<string, MO[]>();
  mo.forEach((m) => moPerCabang.set(m.cabangId, [...(moPerCabang.get(m.cabangId) ?? []), m]));
  moPerCabang.forEach((daftar, cid) => {
    const c = petaCabang.get(cid)!;
    const total = daftar.reduce((s, m) => s + m.nwp25, 0);
    daftar.forEach((m) => { m.target = total > 0 ? (c.target * m.nwp25) / total : c.target / daftar.length; });
    // MO baru tanpa histori tetap diberi porsi kecil agar tidak nol.
    const baru = daftar.filter((m) => m.target === 0);
    if (baru.length) {
      const jatah = c.target * 0.03;
      daftar.forEach((m) => { m.target *= 1 - (jatah * baru.length) / c.target; });
      baru.forEach((m) => { m.target = jatah; });
    }
  });

  // ── Prospek (SIMULASI — ekspor Matrix Distribution belum tersedia) ──
  const statusBobot: [StatusProspek, number][] = [
    ['Cold', 0.4], ['Warm', 0.25], ['Hot', 0.12], ['Terbit Polis', 0.1], ['Pending', 0.08], ['Batal', 0.05],
  ];
  const tahapUntuk = (s: StatusProspek): Tahap => {
    switch (s) {
      case 'Cold': return acak() < 0.55 ? 'Prospek Baru' : 'Tahap Awal';
      case 'Warm': return acak() < 0.6 ? 'Follow Up' : 'Negosiasi';
      case 'Hot': return 'Proposal';
      case 'Pending': return 'Pending';
      case 'Terbit Polis': return 'Terbit Polis';
      default: return 'Close';
    }
  };
  const sigma = 0.9;
  const prospek: Prospek[] = [];
  let nomor = 0;
  mo.forEach((m) => {
    const n = Math.floor(acak() * 10) + (m.baruBergabung ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const status = pilihBerbobot(statusBobot.map((x) => x[0]), statusBobot.map((x) => x[1]));
      const sla = SLA_STATUS[status];
      const sejak = sla ? Math.floor(acak() * sla * 2.1) : 0;
      prospek.push({
        id: `P${String(++nomor).padStart(5, '0')}`, moId: m.id, cabangId: m.cabangId, kanwilId: m.kanwilId,
        subKanal: m.subKanal, status, tahap: tahapUntuk(status),
        premi: Math.exp(Math.log(RATA_PREMI_PROSPEK) - (sigma * sigma) / 2 + sigma * normal()),
        sisaHari: sla ? sla - sejak : null,
      });
    }
  });

  // ── Effort harian (SIMULASI) ──
  const hariIni = new Date(TANGGAL_ACUAN);
  const effort = new Map<string, EffortHarian[]>();
  mo.forEach((m) => {
    const giat = Math.exp(0.45 * normal());
    const hari: EffortHarian[] = [];
    for (let d = HARI_RITME - 1; d >= 0; d--) {
      const tgl = new Date(hariIni); tgl.setDate(tgl.getDate() - d);
      const libur = tgl.getDay() === 0 || tgl.getDay() === 6 ? 0.15 : 1;
      const f = giat * libur;
      hari.push({
        kunjungan: Math.round(acak() * 2.2 * f), penawaran: Math.round(acak() * 1.3 * f),
        followUp: Math.round(acak() * 3 * f), telepon: Math.round(acak() * 5 * f),
      });
    }
    effort.set(m.id, hari);
  });

  // Nama persona dipasang terakhir supaya urutan angka acak (dan seluruh angka) tidak berubah.
  const cp = cabang.find((c) => c.id === PERSONA.cabang.id);
  if (cp) cp.nama = PERSONA.cabang.nama;
  const mp = mo.find((m) => m.id === PERSONA.mo.id);
  if (mp) mp.kode = PERSONA.mo.nama;

  return { kanwil, cabang, mo, prospek, effort };
}

export const DATA: SumberData = bangkitkanData();
