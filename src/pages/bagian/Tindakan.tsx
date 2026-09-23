import { useState } from 'react';
import { BatangMendatar } from '../../components/grafik/Grafik';
import { Ikon } from '../../components/Ikon';
import { Bagian, Kartu, KepalaKartu, PilStatus } from '../../components/Kartu';
import { LABEL_JT, type Cakupan, type Kelompok_JT, type ProspekPrioritas } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { bilangan, rp } from '../../logika/format';

function teksJatuhTempo(sisa: number | null) {
  if (sisa === null) return '–';
  if (sisa < 0) return <span className="teks-turun"><Ikon nama="clock" ukuran={14} /> lewat {-sisa} hari</span>;
  if (sisa === 0) return <span className="teks-waspada">hari ini</span>;
  return `${sisa} hari lagi`;
}

export function TabelPrioritas({ daftar, tampilMO, tampilCabang, onBuka, batas = 8 }: {
  daftar: ProspekPrioritas[]; tampilMO: boolean; tampilCabang: boolean; onBuka?: (c: Cakupan) => void; batas?: number;
}) {
  const [semua, setSemua] = useState(false);
  const baris = semua ? daftar.slice(0, 100) : daftar.slice(0, batas);
  if (!daftar.length) return <p className="kosong-isi">Tidak ada prospek terbuka pada cakupan & filter ini.</p>;
  return (
    <>
      <div className="tabel-bungkus">
        <table className="tabel">
          <thead>
            <tr>
              <th>#</th><th>ID Prospek</th><th>Status</th><th>Tahap</th>
              <th className="kanan">Estimasi premi</th><th>Batas tindak lanjut</th>
              {tampilMO && <th>MO</th>}{tampilCabang && <th>Cabang</th>}
              <th className="kanan">Skor</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((p, i) => (
              <tr key={p.id}>
                <td className="teks-redup">{i + 1}</td>
                <td className="mono">{p.id}</td>
                <td><PilStatus status={p.status} /></td>
                <td>{p.tahap}</td>
                <td className="kanan">{rp(p.premi)}</td>
                <td>{teksJatuhTempo(p.sisaHari)}</td>
                {tampilMO && <td>{onBuka ? <button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'mo', id: p.moId })}>{p.moKode}</button> : p.moKode}</td>}
                {tampilCabang && <td>{p.cabangNama}</td>}
                <td className="kanan"><strong>{p.skor.toFixed(1).replace('.', ',')}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {daftar.length > batas && (
        <button type="button" className="tombol sekunder lebar" onClick={() => setSemua(!semua)}>
          {semua ? 'Tampilkan lebih sedikit' : `Tampilkan ${Math.min(100, daftar.length)} teratas dari ${bilangan(daftar.length)}`}
        </button>
      )}
    </>
  );
}

const IKON_JT: Record<Kelompok_JT, 'alert' | 'clock' | 'calendar'> = { lewat: 'alert', hariIni: 'clock', h1_3: 'calendar', h4_7: 'calendar' };

export function PerluTindakan({ d, onBuka, onEkspor }: { d: Dasbor; onBuka: (c: Cakupan) => void; onEkspor: () => void }) {
  	return (
		<Bagian
			id="tindakan" judul="Perlu Tindakan"
		>
			<div className="grid-4">
				{(Object.keys(LABEL_JT) as Kelompok_JT[]).map((k) => (
				<Kartu key={k} className={`ubin-jt jt-${k}`}>
					<span className="jt-label"><Ikon nama={IKON_JT[k]} ukuran={18} /> {LABEL_JT[k]}</span>
					<strong className="angka-kpi">{bilangan(d.jt[k].jumlah)}</strong>
					<span className="teks-redup">estimasi premi {rp(d.jt[k].premi)}</span>
				</Kartu>
				))}
			</div>

			<div className="grid-2-1">
				<Kartu>
					<KepalaKartu
						ikon="list" judul="Prioritas Tindak Lanjut" sub="Tanpa nama nasabah/prospek — hanya ID (Aturan Emas)."
						aksi={<button type="button" className="tombol kecil sekunder" onClick={onEkspor}><Ikon nama="download" ukuran={16} /> CSV</button>}
					/>
					<TabelPrioritas daftar={d.prioritas} tampilMO tampilCabang={d.cakupan.tingkat !== 'cabang'} onBuka={onBuka} />
				</Kartu>
				<Kartu>
					<KepalaKartu ikon="layers" judul="Sebaran Beban" sub={`Lewat + hari ini, per ${d.labelAnak}`} />
					{d.beban.length ? (
						<BatangMendatar
						data={d.beban.slice(0, 10).map((b) => ({ label: b.nama, nilai: b.jumlah, ket: rp(b.premi) }))}
						format={(n) => `${bilangan(n)}`} onPilih={(i) => onBuka(d.beban[i].unit)}
						/>
					) : <p className="kosong-isi">Tidak ada beban mendesak.</p>}
					{d.beban.length > 10 && <p className="catatan">Menampilkan 10 dari {d.beban.length} unit dengan beban terbanyak.</p>}
				</Kartu>
			</div>
    	</Bagian>
  	);
}
