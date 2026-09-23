import { useState } from 'react';
import { TAHUN_LALU } from '../../config/dashboard';
import { Ikon } from '../../components/Ikon';
import { Bagian, ChipDelta, Kartu, KepalaKartu, Progres } from '../../components/Kartu';
import { labelPeriode, periodePenuh, type BarisKinerja, type Cakupan } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { delta, persen, rp } from '../../logika/format';

type Kunci = 'nwp26' | 'capaianBerjalan' | 'pertumbuhanLaju' | 'profit';

export function Kinerja({ d, onBuka, onEksporPosisi }: { d: Dasbor; onBuka: (c: Cakupan) => void; onEksporPosisi: () => void }) {
  const [urut, setUrut] = useState<Kunci>('nwp26');
  const [semua, setSemua] = useState(false);
  const baris: BarisKinerja[] = [...d.anak].sort((a, b) => (b.prod[urut] || -Infinity) - (a.prod[urut] || -Infinity));
  const tampil = semua ? baris : baris.slice(0, 10);
  const th = (k: Kunci, label: string) => (
    <th className="kanan">
      <button type="button" className={`urut ${urut === k ? 'aktif' : ''}`} onClick={() => setUrut(k)} aria-pressed={urut === k}>
        {label}{urut === k && <Ikon nama="arrowDown" ukuran={14} />}
      </button>
    </th>
  );
  const kel = d.prod.perKelompok;

  return (
    <Bagian id="kinerja" judul="Kinerja">
      <div className="tumpuk">
        <Kartu>
          <KepalaKartu
            ikon="chart" judul={`Peringkat ${d.labelAnak}`} sub="Klik nama untuk turun satu tingkat."
            aksi={<button type="button" className="tombol kecil sekunder" onClick={onEksporPosisi}><Ikon nama="download" ukuran={16} /> CSV</button>}
          />
          <div className="tabel-bungkus">
            <table className="tabel">
              <thead>
                <tr>
                  <th>#</th><th>Unit</th>
                  {th('nwp26', `NWP ${labelPeriode(d.periode).replace(/ \d{4}$/, '')}`)}
                  {th('capaianBerjalan', 'Capaian berjalan')}
                  {th('pertumbuhanLaju', `Laju vs ${TAHUN_LALU}`)}
                  {th('profit', 'Profit')}
                </tr>
              </thead>
              <tbody>
                {tampil.map((b, i) => (
                  <tr key={b.unit.id}>
                    <td className="teks-redup">{i + 1}</td>
                    <td><button type="button" className="tautan" onClick={() => onBuka(b.unit)}>{b.nama}</button></td>
                    <td className="kanan">{rp(b.prod.nwp26)}</td>
                    <td className="kanan"><div className="sel-progres kanan"><Progres nilai={b.prod.capaianBerjalan} label={`Capaian ${persen(b.prod.capaianBerjalan, 0)}`} /><strong>{persen(b.prod.capaianBerjalan, 0)}</strong></div></td>
                    <td className="kanan"><ChipDelta nilai={b.prod.pertumbuhanLaju} teks={delta(b.prod.pertumbuhanLaju)} /></td>
                    <td className="kanan">{rp(b.prod.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {baris.length > 10 && (
            <button type="button" className="tombol sekunder lebar" onClick={() => setSemua(!semua)}>
              {semua ? 'Tampilkan 10 teratas' : `Tampilkan semua ${baris.length} ${d.labelAnak}`}
            </button>
          )}
        </Kartu>
        <Kartu className="kartu-banding">
          <div>
          <KepalaKartu ikon="trend" judul="Tahun berjalan vs tahun lalu" sub="Rata-rata per bulan, bukan total mentah." />
          <div className="banding">
            {(['Direct', 'Captive'] as const).map((k) => {
              const g = kel[k].laju25 > 0 ? kel[k].laju26 / kel[k].laju25 - 1 : NaN;
              return (
                <div className="banding-baris" key={k}>
                  <span className="ubin-kepala"><i className="titik" style={{ background: k === 'Direct' ? 'var(--seri-1)' : 'var(--seri-2)' }} />{k}</span>
                  <div className="banding-angka">
                    <span><small className="teks-redup">{TAHUN_LALU}</small>{rp(kel[k].laju25)}</span>
                    <span><small className="teks-redup">2026</small><b>{rp(kel[k].laju26)}</b></span>
                    <ChipDelta nilai={g} teks={delta(g)} />
                  </div>
                </div>
              );
            })}
            <div className="banding-baris total">
              <span className="ubin-kepala">Total</span>
              <div className="banding-angka">
                <span><small className="teks-redup">{TAHUN_LALU}</small>{rp(d.prod.laju25)}</span>
                <span><small className="teks-redup">2026</small><b>{rp(d.prod.laju26)}</b></span>
                <ChipDelta nilai={d.prod.pertumbuhanLaju} teks={delta(d.prod.pertumbuhanLaju)} />
              </div>
            </div>
          </div>
          <p className="catatan">
            {periodePenuh(d.periode) ? <>
              Berkas 2025 mencakup 12 bulan, 2026 baru 7 bulan. Total mentah akan tampak turun{' '}
              {delta(d.prod.nwp26 / d.prod.nwp25 - 1)}; laju per bulan menunjukkan {delta(d.prod.pertumbuhanLaju)}.
            </> : <>Laju 2026 = rata-rata per bulan {labelPeriode(d.periode)}; pembanding = rata-rata 12 bulan 2025.</>}
          </p>
          </div>
          <div>
          <KepalaKartu ikon="layers" judul="Sub-channel" sub={`NWP ${labelPeriode(d.periode)}`} />
          <ul className="daftar-sub">
            {d.prod.perSubKanal.map((s) => (
              <li key={s.nama}><span>{s.nama}</span><b>{rp(s.nwp26)}</b></li>
            ))}
          </ul>
          </div>
        </Kartu>
      </div>
    </Bagian>
  );
}
