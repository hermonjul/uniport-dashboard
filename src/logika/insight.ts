// Mesin narasi AI Insight — BERBASIS ATURAN, bukan LLM. Deterministik supaya
// hasilnya tidak berubah antar-peragaan. Lapisan inilah yang kelak diganti LLM
// + alur review manusia. Tidak boleh menyebut nama nasabah/prospek (Aturan Emas).
import { AMBANG_MO_TURUN, JUMLAH_INSIGHT, NAMA_BULAN_PANJANG, PORSI_KONSENTRASI } from '../config/dashboard';
import type { BarisKinerja, Konsentrasi, Produksi, Proyeksi } from './agregasi';
import { delta, persen, rp } from './format';

export type Kegentingan = 'kritis' | 'perhatian' | 'info';
export interface Temuan {
  kegentingan: Kegentingan;
  judul: string;
  isi: string;
  /** Sifat angka yang mendasari temuan — supaya simulasi tidak tampak seperti hasil ukur. */
  sifat: 'produksi' | 'simulasi';
  bobot: number;
}

const URUT: Record<Kegentingan, number> = { kritis: 0, perhatian: 1, info: 2 };

interface Masukan {
  namaUnit: string;
  prod: Produksi;
  proyeksi: Proyeksi;
  lewatHot: { jumlah: number; premi: number };
  mendesak: number;
  konsentrasi: Konsentrasi[];
  ditanyakan: number;
  anak: BarisKinerja[];
  labelAnak: string;
  labelPeriode: string;
}

export function susunInsight(m: Masukan): Temuan[] {
  const t: Temuan[] = [];
  const { prod, proyeksi } = m;

  const rasioLaju = proyeksi.dariLaju / proyeksi.target;
  if (isFinite(rasioLaju)) {
    const kurang = proyeksi.target - proyeksi.dariLaju;
    t.push({
      kegentingan: rasioLaju < 0.8 ? 'kritis' : rasioLaju < 0.95 ? 'perhatian' : 'info',
      judul: rasioLaju < 1 ? `Laju saat ini baru menuju ${persen(rasioLaju, 0)} target` : `Laju saat ini melampaui target (${persen(rasioLaju, 0)})`,
      isi: rasioLaju < 1
        ? `Bila laju ${rp(prod.laju26)}/bulan bertahan, ${m.namaUnit} menutup tahun di ${rp(proyeksi.dariLaju)} — kurang ${rp(kurang)} dari target ${rp(proyeksi.target)}.`
        : `Dengan laju ${rp(prod.laju26)}/bulan, proyeksi akhir tahun ${rp(proyeksi.dariLaju)} dari target ${rp(proyeksi.target)}.`,
      sifat: 'produksi', bobot: 1 - rasioLaju,
    });
  }

  if (isFinite(proyeksi.kecukupanPipeline) && proyeksi.kecukupanPipeline < 0.5) {
    t.push({
      kegentingan: 'perhatian',
      judul: `Pipeline berbobot hanya menutup ${persen(proyeksi.kecukupanPipeline)} sisa target`,
      isi: `Pipeline berbobot ${rp(proyeksi.pipelineBerbobot)} terhadap sisa target ${rp(proyeksi.sisaTarget)}. Angka rendah terutama karena Matrix Distribution belum merekam sebagian besar aliran bisnis — bukan berarti bisnis akan berhenti.`,
      sifat: 'simulasi', bobot: 0.5 - proyeksi.kecukupanPipeline,
    });
  }

  if (m.lewatHot.jumlah > 0) {
    t.push({
      kegentingan: 'kritis',
      judul: `${m.lewatHot.jumlah} prospek Hot lewat batas tindak lanjut`,
      isi: `Estimasi premi tertahan ${rp(m.lewatHot.premi)}. Prospek Hot punya batas 3 hari; semakin lama tertunda, peluang terbit polis turun.`,
      sifat: 'simulasi', bobot: m.lewatHot.premi / 1e9,
    });
  }

  if (m.mendesak > 0) {
    t.push({
      kegentingan: 'perhatian',
      judul: `${m.mendesak} tindak lanjut jatuh tempo hari ini atau sudah lewat`,
      isi: `Buka bagian Perlu Tindakan untuk urutan kerja berdasarkan skor gabungan status × nilai premi × keterlambatan.`,
      sifat: 'simulasi', bobot: m.mendesak / 100,
    });
  }

  if (m.konsentrasi.length > 0) {
    const top = m.konsentrasi[0];
    t.push({
      kegentingan: 'perhatian',
      judul: `${m.konsentrasi.length} cabang bertumpu ≥ ${persen(PORSI_KONSENTRASI, 0)} pada satu MO`,
      isi: `Paling tinggi ${top.cabang.nama}: ${persen(top.porsi, 0)} produksinya dari satu orang. Bahan percakapan tentang regenerasi portofolio, bukan penilaian kinerja.`,
      sifat: 'produksi', bobot: m.konsentrasi.length / 10,
    });
  }

  if (m.ditanyakan > 0) {
    t.push({
      kegentingan: 'perhatian',
      judul: `${m.ditanyakan} MO turun ke nol dari di atas ${rp(AMBANG_MO_TURUN)}`,
      isi: `Tahun lalu produktif, kini nol atau minus. Bisa karena alasan wajar (pindah peran, cuti, portofolio dialihkan) — perlu ditanyakan, bukan dinilai.`,
      sifat: 'produksi', bobot: m.ditanyakan / 20,
    });
  }

  const dg = prod.perKelompok.Direct, cp = prod.perKelompok.Captive;
  const gD = dg.laju25 > 0 ? dg.laju26 / dg.laju25 - 1 : NaN;
  const gC = cp.laju25 > 0 ? cp.laju26 / cp.laju25 - 1 : NaN;
  if (isFinite(gD) && isFinite(gC)) {
    const [kuat, lemah, gk, gl] = gD >= gC ? ['Direct', 'Captive', gD, gC] as const : ['Captive', 'Direct', gC, gD] as const;
    t.push({
      kegentingan: gl < -0.1 ? 'perhatian' : 'info',
      judul: `Laju per bulan: ${kuat} ${delta(gk)}, ${lemah} ${delta(gl)}`,
      isi: `Dibandingkan sebagai rata-rata per bulan (${m.labelPeriode} vs 12 bulan 2025), bukan total mentah yang akan memunculkan penurunan semu.`,
      sifat: 'produksi', bobot: Math.abs(gk - gl),
    });
  }

  // Bulan terakhir periode dibanding bulan sebelumnya.
  const b = prod.bulan26, akhir = prod.periode.sampai;
  const bln = b[akhir], sblm = akhir > 0 ? b[akhir - 1] : 0;
  if (sblm > 0 && bln / sblm - 1 < -0.1) {
    t.push({
      kegentingan: 'perhatian',
      judul: `Produksi ${NAMA_BULAN_PANJANG[akhir]} turun ${delta(bln / sblm - 1)} dari ${NAMA_BULAN_PANJANG[akhir - 1]}`,
      isi: `${rp(bln)} di ${NAMA_BULAN_PANJANG[akhir]} dibanding ${rp(sblm)} di ${NAMA_BULAN_PANJANG[akhir - 1]}. Sebaran bulanan masih simulasi.`,
      sifat: 'simulasi', bobot: sblm / bln - 1,
    });
  }

  const denganTarget = m.anak.filter((a) => isFinite(a.prod.capaianBerjalan));
  if (denganTarget.length >= 2) {
    const urut = [...denganTarget].sort((a, c) => a.prod.capaianBerjalan - c.prod.capaianBerjalan);
    const rendah = urut[0], tinggi = urut[urut.length - 1];
    t.push({
      kegentingan: rendah.prod.capaianBerjalan < 0.6 ? 'perhatian' : 'info',
      judul: `Capaian ${m.labelAnak} terendah: ${rendah.nama} (${persen(rendah.prod.capaianBerjalan, 0)})`,
      isi: `Tertinggi ${tinggi.nama} di ${persen(tinggi.prod.capaianBerjalan, 0)} dari target berjalan ${m.labelPeriode} (target tahunan dibagi rata per bulan).`,
      sifat: 'produksi', bobot: tinggi.prod.capaianBerjalan - rendah.prod.capaianBerjalan,
    });
  }

  return t.sort((a, c) => URUT[a.kegentingan] - URUT[c.kegentingan] || c.bobot - a.bobot).slice(0, JUMLAH_INSIGHT);
}
