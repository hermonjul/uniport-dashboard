import { BOBOT_EFFORT, SLA_STATUS } from '../../config/dashboard';
import { Kartu } from '../../components/Kartu';

const SUMBER = [
  ['eReport', 'NWP, profit, beban; NWP per tanggal; NWP per sumber bisnis; produksi per MO', 'Belum terhubung — memakai data contoh'],
  ['eTarget (lewat HCC/ASMPro)', 'Target NWP setahun dan bulanan', 'Belum terhubung — memakai data contoh'],
  ['Matrix Distribution (Pega ASMPro)', 'Prospek, status, jatuh tempo, estimasi premi, aktivitas effort', 'Simulasi — ekspor belum tersedia'],
  ['HCQ / Organization Master Data Area', 'Cabang dan Kantor Wilayah; MO dan Pimpinan Cabang aktif', 'Belum terhubung — kode unit contoh'],
  ['Uniport', 'Login dan peran', 'Belum diimplementasi (single sign-on)'],
  ['Olahan dashboard', 'Capaian, proyeksi, kecukupan pipeline, tindakan disarankan, AI Insight', 'Dihitung dari data di atas'],
];

export function DetailLatar() {
  return (
    <section className="bagian" id="detail">
      <Kartu>
          <div className="detail-isi">
            <h3>Sumber data</h3>
            <div className="tabel-bungkus">
              <table className="tabel">
                <thead><tr><th>Sistem asal</th><th>Data yang diambil</th><th>Status di prototipe ini</th></tr></thead>
                <tbody>{SUMBER.map((r) => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
              </table>
            </div>
            <p>
              <strong>Data pada build ini adalah data contoh.</strong> Rincian cabang dan MO dibangkitkan dengan PRNG ber-seed; hanya total
              nasional yang dijangkarkan ke angka PRD (NWP 2025 Rp 583,0 miliar, Jan–Jul 2026 Rp 298,8 miliar, target 2026 Rp 740,0 miliar).
              Nama cabang dan MO berupa kode. Ganti <code>src/data/sumber.ts</code> dengan pemuat ekspor asli.
            </p>
            <h3>Koreksi periode</h3>
            <p>Berkas 2025 mencakup 12 bulan, berkas 2026 baru 7 bulan. Seluruh perbandingan tahun memakai laju per bulan, bukan total mentah.</p>
            <h3>Asumsi yang perlu dikoreksi tim data</h3>
            <ol>
              <li>Batas waktu tindak lanjut — Hot {SLA_STATUS.Hot} hari, Warm {SLA_STATUS.Warm} hari, Cold {SLA_STATUS.Cold} hari, Pending {SLA_STATUS.Pending} hari.</li>
              <li>Skor prioritas — gabungan kategori status, nilai premi (skala logaritma), dan lama keterlambatan.</li>
              <li>Bobot indeks effort — kunjungan {BOBOT_EFFORT.kunjungan}, penawaran 2,5, follow up 1,5, telepon {BOBOT_EFFORT.telepon}.</li>
              <li>Pembagian target bulanan diasumsikan merata.</li>
              <li>Skala pipeline — nilai prospek dijangkarkan ke rata-rata Rp 24,6 juta per prospek, bukan hasil pengukuran.</li>
              <li>Divisi (MBU, Health, Commercial Lines, Financial, Agency, ASNET) belum tercakup.</li>
            </ol>
            <h3>Kepatuhan &amp; privasi</h3>
            <p>
              Rahasia internal. Nama nasabah dan prospek tidak pernah ada di model data (Aturan Emas). Bagian yang menyebut perorangan
              disembunyikan dari tampilan Marketing Officer. Pembatasan peran saat ini <strong>hanya di sisi tampilan</strong> — belum ada
              autentikasi maupun penegakan hak akses di sisi peladen (UU No. 27/2022 tentang Pelindungan Data Pribadi).
            </p>
          </div>
      </Kartu>
    </section>
  );
}
