import { BOBOT_EFFORT, HARI_RITME, TANGGAL_ACUAN } from '../../config/dashboard';
import { BatangHarian } from '../../components/grafik/Grafik';
import { Bagian, Kartu, KepalaKartu } from '../../components/Kartu';
import type { Dasbor } from '../../logika/dasbor';
import { bilangan, tanggalPendek } from '../../logika/format';

const AKTIVITAS = [
  ['kunjungan', 'Kunjungan'], ['penawaran', 'Penawaran'], ['followUp', 'Follow up'], ['telepon', 'Telepon'],
] as const;

export function RitmeKerja({ d }: { d: Dasbor }) {
  const acuan = new Date(TANGGAL_ACUAN);
  const label = d.ritme.map((_, i) => {
    const t = new Date(acuan); t.setDate(t.getDate() - (HARI_RITME - 1 - i));
    return tanggalPendek(t);
  });
  const total = AKTIVITAS.map(([k, l]) => ({ l, k, n: d.ritme.reduce((s, h) => s + h[k], 0) }));
  return (
    <Bagian id="ritme" judul="Ritme Kerja" sub={`Indeks effort ${HARI_RITME} hari terakhir — batang, bukan gradasi warna, supaya mudah dibaca.`}>
      <div className="grid-2-1">
        <Kartu>
          <KepalaKartu ikon="activity" judul="Indeks effort harian" sub={`Bobot: kunjungan ${BOBOT_EFFORT.kunjungan} · penawaran ${String(BOBOT_EFFORT.penawaran).replace('.', ',')} · follow up ${String(BOBOT_EFFORT.followUp).replace('.', ',')} · telepon ${BOBOT_EFFORT.telepon}`} />
          <BatangHarian
            label={label} nilai={d.ritme.map((h) => h.indeks)} namaSeri="Indeks effort"
            rincian={(i) => (
              <span className="teks-redup kecil">
                {AKTIVITAS.map(([k, l]) => `${l} ${d.ritme[i][k]}`).join(' · ')}
              </span>
            )}
          />
        </Kartu>
        <Kartu>
          <KepalaKartu ikon="list" judul="Total aktivitas" sub={`${HARI_RITME} hari`} />
          <ul className="daftar-sub besar">
            {total.map((t) => <li key={t.k}><span>{t.l}</span><b>{bilangan(t.n)}</b></li>)}
          </ul>
        </Kartu>
      </div>
    </Bagian>
  );
}
