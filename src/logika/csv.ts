// Ekspor CSV (pemisah titik koma agar langsung terbaca Excel berlokal Indonesia).
// Tidak pernah memuat nama nasabah/prospek — kolomnya memang tidak ada di model data.
import type { BarisKinerja, ProspekPrioritas } from './agregasi';

function sel(v: string | number): string {
  const s = typeof v === 'number' ? String(Math.round(v)) : v;
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function unduh(namaBerkas: string, baris: (string | number)[][]) {
  const isi = '﻿' + baris.map((r) => r.map(sel).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([isi], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = namaBerkas;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function eksporDaftarKerja(unit: string, daftar: ProspekPrioritas[]) {
  unduh(`daftar-kerja-${unit.toLowerCase().replace(/\s+/g, '-')}.csv`, [
    ['ID Prospek', 'Status', 'Tahap', 'Estimasi Premi (Rp)', 'Sisa Hari', 'Skor Prioritas', 'MO', 'Cabang', 'Sub-channel', 'Sifat Data'],
    ...daftar.map((p) => [p.id, p.status, p.tahap, p.premi, p.sisaHari ?? '', p.skor.toFixed(1), p.moKode, p.cabangNama, p.subKanal, 'Simulasi']),
  ]);
}

export function eksporPosisi(unit: string, baris: BarisKinerja[], periode: string) {
  unduh(`posisi-${unit.toLowerCase().replace(/\s+/g, '-')}.csv`, [
    ['Unit', 'NWP 2025 (Rp)', `NWP ${periode} (Rp)`, 'Target 2026 (Rp)', 'Capaian Berjalan', 'Pertumbuhan Laju/Bulan', 'Sifat Data'],
    ...baris.map((b) => [
      b.nama, b.prod.nwp25, b.prod.nwp26, b.prod.target,
      (b.prod.capaianBerjalan * 100).toFixed(1) + '%', (b.prod.pertumbuhanLaju * 100).toFixed(1) + '%', 'Contoh',
    ]),
  ]);
}
