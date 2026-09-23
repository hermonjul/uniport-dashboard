import { BOBOT_STATUS } from '../../config/dashboard';
import { BatangMendatar } from '../../components/grafik/Grafik';
import { Bagian, Kartu, KepalaKartu, Progres } from '../../components/Kartu';
import { labelPeriode } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { bilangan, persen, rp } from '../../logika/format';

export function ProyeksiTarget({ d }: { d: Dasbor }) {
  const p = d.proyeksi;
  const perkiraan = [
    {
      judul: 'Dari laju bulanan', ikon: 'trend' as const, nilai: p.dariLaju, sifat: 'produksi' as const,
      ket: `Realisasi Jan–Jul ${rp(d.prod.nwpYTD)} + laju ${rp(d.prod.laju26)}/bulan (${labelPeriode(d.periode)}) × 5 bulan sisa`,
    },
    {
      judul: 'Dari pipeline berbobot', ikon: 'layers' as const, nilai: p.dariPipeline, sifat: 'simulasi' as const,
      ket: `Realisasi Jan–Jul ${rp(d.prod.nwpYTD)} + pipeline berbobot ${rp(p.pipelineBerbobot)}`,
    },
  ];
  return (
    <Bagian id="proyeksi" judul="Proyeksi Pencapaian Target">
      <div className="grid-2">
        <Kartu>
          <KepalaKartu ikon="target" judul="Dua perkiraan berdampingan" sub="Sengaja tidak dijumlahkan — keduanya cara berbeda membaca hal yang sama." />
          <div className="daftar-rencana">
            {perkiraan.map((x) => {
              const r = x.nilai / p.target;
              return (
                <div className="rencana" key={x.judul}>
                  <div className="rencana-kepala">
                    <strong>{x.judul}</strong>
                  </div>
                  <div className="rencana-angka">
                    <span><b>{rp(x.nilai)}</b><span className="teks-redup">/{rp(p.target)}</span></span>
                    <strong>{persen(r, 0)}</strong>
                  </div>
                  <Progres nilai={r} label={`${x.judul}: ${persen(r, 0)} dari target`} />
                  <p className="teks-redup kecil">{x.ket}</p>
                </div>
              );
            })}
          </div>
        </Kartu>
        <Kartu>
          <KepalaKartu ikon="chart" judul="Sumbangan tiap status prospek" sub="Nilai berbobot = estimasi premi × peluang status." />
          <BatangMendatar
            data={p.sumbangan.map((s) => ({ label: s.status, nilai: s.berbobot, ket: `${bilangan(s.jumlah)} prospek · bobot ${persen(BOBOT_STATUS[s.status], 0)}` }))}
            format={rp}
          />
          <div className="stat-inline">
            <span>Kecukupan pipeline</span>
            <strong>{persen(p.kecukupanPipeline)}</strong>
            <span className="teks-redup">dari sisa target {rp(p.sisaTarget)}</span>
          </div>
          <p className="catatan">Rendah terutama karena Matrix Distribution belum merekam sebagian besar aliran bisnis — bukan berarti bisnis akan berhenti.</p>
        </Kartu>
      </div>
    </Bagian>
  );
}
