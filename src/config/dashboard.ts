// Parameter publik dashboard. Berkas ini ikut ter-inline ke HTML hasil build —
// JANGAN taruh rahasia (kredensial, token, alamat server internal) di sini.

// ── Periode ────────────────────────────────────────────────────────────────
export const TAHUN_BERJALAN = 2026;
export const TAHUN_LALU = 2025;
/** Jumlah bulan yang dicakup berkas produksi tahun lalu (12 bulan penuh). */
export const BULAN_P25 = 12;
/** Jumlah bulan yang dicakup berkas produksi tahun berjalan (Januari–Juli). */
export const BULAN_P26 = 7;

/** Tanggal acuan simulasi prospek & effort (jatuh tempo dan jendela ritme dihitung dari sini). */
export const TANGGAL_ACUAN = '2026-09-23T00:00:00';

export const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const NAMA_BULAN_PANJANG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// ── Total acuan (dari PRD; angka agregat nasional) ──────────────────────────
// Generator data contoh diskalakan agar total nasionalnya sama persis dengan angka ini.
export const TOTAL_NWP_2025 = 583.0e9;
export const TOTAL_NWP_2026 = 298.8e9;
export const TOTAL_TARGET_2026 = 740.0e9;

export const JUMLAH_KANWIL = 3;
export const JUMLAH_CABANG = 118;
export const JUMLAH_MO = 744;

// ── Channel ────────────────────────────────────────────────────────────────
// Pengelompokan sengaja berbeda dari taksonomi pelatihan resmi (lihat README).
export const KELOMPOK_KANAL = {
  Direct: ['Direct', 'Corporate', 'Agency'],
  Captive: ['Banking', 'Multifinance', 'Broker', 'Sinar Mas Group'],
} as const;
export type Kelompok = keyof typeof KELOMPOK_KANAL;
export type SubKanal = (typeof KELOMPOK_KANAL)[Kelompok][number];
export const SEMUA_SUB_KANAL: SubKanal[] = [...KELOMPOK_KANAL.Direct, ...KELOMPOK_KANAL.Captive];

// ── Prospek (taksonomi Matrix Distribution per 2026-09-10) ──────────────────
export const STATUS_PROSPEK = ['Cold', 'Warm', 'Hot', 'Terbit Polis', 'Pending', 'Batal'] as const;
export type StatusProspek = (typeof STATUS_PROSPEK)[number];
export const STATUS_TERBUKA: StatusProspek[] = ['Hot', 'Warm', 'Cold', 'Pending'];

/** Batas waktu tindak lanjut per status (hari). ASUMSI — perlu disepakati tim data. */
export const SLA_STATUS: Record<string, number> = { Hot: 3, Warm: 7, Cold: 14, Pending: 7 };

/** Bobot peluang jadi polis, dipakai untuk pipeline berbobot. ASUMSI. */
export const BOBOT_STATUS: Record<string, number> = { Hot: 0.6, Warm: 0.3, Cold: 0.1, Pending: 0.2 };

/** Bobot kategori status pada skor prioritas. ASUMSI. */
export const BOBOT_PRIORITAS: Record<string, number> = { Hot: 3, Warm: 2, Pending: 1.5, Cold: 1 };

/** Rata-rata estimasi premi per prospek (dari estimasi NPW Kanwil 1) — jangkar skala simulasi. */
export const RATA_PREMI_PROSPEK = 24.6e6;

// ── Effort ─────────────────────────────────────────────────────────────────
/** Bobot indeks effort. ASUMSI — perlu disepakati sebelum dipakai menilai perorangan. */
export const BOBOT_EFFORT = { kunjungan: 3, penawaran: 2.5, followUp: 1.5, telepon: 1 } as const;
export const HARI_RITME = 30;

// ── Ambang risiko ──────────────────────────────────────────────────────────
/** Cabang di bawah NWP ini tidak dinilai konsentrasinya (supaya cabang kecil tidak selalu tampak berisiko). */
export const AMBANG_CABANG_KONSENTRASI = 2e9;
/** Porsi satu MO terhadap produksi cabang yang dianggap ketergantungan tinggi. */
export const PORSI_KONSENTRASI = 0.4;
/** MO yang tahun lalu di atas nilai ini lalu kini nol/minus masuk "Perlu Ditanyakan". */
export const AMBANG_MO_TURUN = 100e6;

/** Jumlah temuan AI Insight yang ditampilkan. */
export const JUMLAH_INSIGHT = 7;
