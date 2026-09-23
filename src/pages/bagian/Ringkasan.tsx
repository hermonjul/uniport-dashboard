import { useState } from 'react';
import { BULAN_P26, NAMA_BULAN, NAMA_BULAN_PANJANG, TAHUN_BERJALAN, TAHUN_LALU } from '../../config/dashboard';
import { BatangBulanan, Donut } from '../../components/grafik/Grafik';
import { ChipDelta, Kartu, KepalaKartu, Progres } from '../../components/Kartu';
import { Ikon } from '../../components/Ikon';
import { labelPeriode, periodePenuh, type FilterKanal } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { bilangan, delta, persen, rp, rpMiliar } from '../../logika/format';

export function Ringkasan({ d, filter, onFilter, onKe, onEkspor, judulHero = 'Produksi Tahun Berjalan' }: {
  d: Dasbor; filter: FilterKanal; onFilter: (f: FilterKanal) => void; onKe: (id: string) => void; onEkspor: () => void; judulHero?: string;
}) {
  const [tahun, setTahun] = useState(TAHUN_BERJALAN);
  const { prod, jt } = d;
  // Kartu bulan = bulan terakhir periode terpilih, dibanding bulan sebelumnya.
  const akhir = prod.periode.sampai;
  const bln = prod.bulan26[akhir], sblm = akhir > 0 ? prod.bulan26[akhir - 1] : NaN;
  const label = labelPeriode(prod.periode);
  const penuh = periodePenuh(prod.periode);
  const mendesak = jt.lewat.jumlah + jt.hariIni.jumlah;
  const totalKanal = prod.perKelompok.Direct.nwp26 + prod.perKelompok.Captive.nwp26;
  const nilaiBulan = tahun === TAHUN_BERJALAN
    ? NAMA_BULAN.map((_, i) => (i < BULAN_P26 ? prod.bulan26[i] : null))
    : prod.bulan25;

  const ubin = (['Direct', 'Captive'] as const).map((k) => {
    const x = prod.perKelompok[k];
    return { k, nilai: x.nwp26, porsi: totalKanal > 0 ? x.nwp26 / totalKanal : 0, tumbuh: x.laju25 > 0 ? x.laju26 / x.laju25 - 1 : NaN };
  });

  return (
    <div className="grid-ringkasan">
      <Kartu className="kartu-hero">
        <KepalaKartu ikon="wallet" judul={penuh || judulHero === 'Produksi Saya' ? judulHero : 'Produksi Periode Terpilih'} sub={label} />
        <p className="angka-besar">{Math.abs(prod.nwp26) >= 1e9 ? rpMiliar(prod.nwp26) : rp(prod.nwp26)}</p>
        <ChipDelta nilai={prod.pertumbuhanLaju} teks={delta(prod.pertumbuhanLaju)} label={`laju per bulan vs ${TAHUN_LALU}`} />
        <div className="capaian">
          <div className="capaian-teks">
            {/* Periode sebagian = sumbangan periode itu ke target setahun, bukan capaian tahun berjalan. */}
            <span>{penuh ? `Capaian target ${TAHUN_BERJALAN}` : `Sumbangan ke target ${TAHUN_BERJALAN}`}</span>
            <strong>{persen(prod.capaianTahun)}</strong>
          </div>
          <Progres nilai={prod.capaianTahun} label="Capaian target tahunan" />
          <p className="teks-redup kecil">dari target {rp(prod.target)} · target berjalan {label.replace(/ \d{4}$/, '')} {persen(prod.capaianBerjalan, 0)} tercapai</p>
        </div>
        <div className="baris-tombol">
          <button type="button" className="tombol utama" onClick={() => onKe('tindakan')}><Ikon nama="alert" ukuran={18} /> Perlu tindakan</button>
          <button type="button" className="tombol sekunder" onClick={onEkspor}><Ikon nama="download" ukuran={18} /> Unduh CSV</button>
        </div>

        <div className="sub-kepala">
          <h4>Komposisi Channel</h4>
          {filter !== 'Semua' && <button type="button" className="tombol kecil sekunder" onClick={() => onFilter('Semua')}><Ikon nama="x" ukuran={14} /> Semua channel</button>}
        </div>
        <div className="kanal-baris">
          <Donut
            data={[
              { label: 'Direct', nilai: prod.perKelompok.Direct.nwp26, warna: 'var(--seri-1)' },
              { label: 'Captive', nilai: prod.perKelompok.Captive.nwp26, warna: 'var(--seri-2)' },
            ]}
            tengah={rp(totalKanal)} subTengah={label.replace(/ \d{4}$/, '')}
          />
          <div className="ubin-grid">
            {ubin.map((u) => (
              <button type="button" key={u.k} className={`ubin ${filter === u.k ? 'aktif' : ''}`} onClick={() => onFilter(filter === u.k ? 'Semua' : u.k)} aria-pressed={filter === u.k}>
                <span className="ubin-kepala"><i className="titik" style={{ background: u.k === 'Direct' ? 'var(--seri-1)' : 'var(--seri-2)' }} />{u.k}<b>{persen(u.porsi, 0)}</b></span>
                <strong>{rp(u.nilai)}</strong>
                <span className={`kecil ${u.tumbuh < 0 ? 'teks-turun' : 'teks-naik'}`}>{delta(u.tumbuh)} laju/bulan</span>
              </button>
            ))}
          </div>
        </div>
      </Kartu>

      <Kartu className="kartu-kpi">
        <KepalaKartu
          ikon="calendar" judul={akhir === BULAN_P26 - 1 ? 'Produksi Bulan Berjalan' : `Produksi ${NAMA_BULAN_PANJANG[akhir]}`}
          sub={`${NAMA_BULAN_PANJANG[akhir]} ${TAHUN_BERJALAN}`}
        />
        <p className="angka-kpi">{rp(bln)}</p>
        {akhir > 0
          ? <ChipDelta nilai={bln / sblm - 1} teks={delta(bln / sblm - 1)} label={`dari ${NAMA_BULAN_PANJANG[akhir - 1]}`} />
          : <span className="teks-redup kecil">Bulan pertama tahun ini</span>}
      </Kartu>

      <Kartu className="kartu-kpi">
        <KepalaKartu ikon="alert" judul="Perlu Tindakan Hari Ini" sub="Lewat & jatuh tempo hari ini" />
        <p className="angka-kpi">{bilangan(mendesak)} <small>prospek</small></p>
        <span className="baris-delta">
          <span className="chip-delta turun">{bilangan(jt.lewat.jumlah)} lewat</span>
          <span className="teks-redup">estimasi premi {rp(jt.lewat.premi + jt.hariIni.premi)}</span>
        </span>
      </Kartu>

      <Kartu className="kartu-tren">
        <KepalaKartu
          ikon="chart" judul="Tren Produksi Bulanan"
          aksi={
            <div className="aksi-grafik">
              <span className="legenda sembunyi-mobile"><i className="titik-batang" /> NWP</span>
              <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} aria-label="Pilih tahun">
                <option value={TAHUN_BERJALAN}>{TAHUN_BERJALAN}</option>
                <option value={TAHUN_LALU}>{TAHUN_LALU}</option>
              </select>
            </div>
          }
        />
        <BatangBulanan
          label={NAMA_BULAN} nilai={nilaiBulan} namaSeri={`NWP ${tahun}`}
          acuan={tahun === TAHUN_BERJALAN ? prod.target / 12 : prod.laju25}
          labelAcuan={tahun === TAHUN_BERJALAN ? 'Target/bulan' : 'Rata-rata/bulan'}
          sorotAwal={tahun === TAHUN_BERJALAN ? akhir : 11}
          rentang={tahun === TAHUN_BERJALAN ? [prod.periode.dari, prod.periode.sampai] : undefined}
          formatNilai={rp} formatSumbu={(n) => rp(n).replace('Rp ', '')}
        />
        <p className="catatan">Total bulanan simulasi (berkas sumber hanya memuat total periode). {tahun === TAHUN_BERJALAN ? 'Agu–Des belum berjalan. Target per bulan diasumsikan merata.' : ''}</p>
      </Kartu>
    </div>
  );
}
