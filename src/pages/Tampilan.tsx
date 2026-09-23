import { Bagian, Kartu, KepalaKartu } from '../components/Kartu';
import { Ikon } from '../components/Ikon';
import type { Cakupan, FilterKanal } from '../logika/agregasi';
import type { Dasbor } from '../logika/dasbor';
import { DetailLatar } from './bagian/Detail';
import { AIInsight } from './bagian/Insight';
import { Kinerja } from './bagian/Kinerja';
import { OrangKunci, PerluDitanyakan } from './bagian/Orang';
import { ProyeksiTarget } from './bagian/Proyeksi';
import { Ringkasan } from './bagian/Ringkasan';
import { RitmeKerja } from './bagian/Ritme';
import { PerluTindakan, TabelPrioritas } from './bagian/Tindakan';

export interface PropsTampilan {
  halaman: string;
  /** true bila ini portal MO sendiri (bukan pimpinan yang memfilter ke satu MO). */
  sendiri: boolean;
  d: Dasbor; filter: FilterKanal; onFilter: (f: FilterKanal) => void; onBuka: (c: Cakupan) => void;
  onKe: (id: string) => void; onEkspor: () => void; onEksporPosisi: () => void;
}

/** Direksi, Pemimpin Wilayah, Pimpinan Cabang: susunan lengkap, satu halaman per menu. */
export function TampilanPimpinan(p: PropsTampilan) {
  switch (p.halaman) {
    case 'tindakan': return <PerluTindakan d={p.d} onBuka={p.onBuka} onEkspor={p.onEkspor} />;
    case 'proyeksi': return <ProyeksiTarget d={p.d} />;
    case 'kinerja': return <Kinerja d={p.d} onBuka={p.onBuka} onEksporPosisi={p.onEksporPosisi} />;
    case 'insight': return <AIInsight d={p.d} />;
    case 'orang-kunci': return <OrangKunci d={p.d} onBuka={p.onBuka} />;
    case 'ditanyakan': return <PerluDitanyakan d={p.d} onBuka={p.onBuka} />;
    case 'detail': return <DetailLatar />;
    default:
      return (
        <section className="bagian" id="ringkasan">
          <Ringkasan d={p.d} filter={p.filter} onFilter={p.onFilter} onKe={p.onKe} onEkspor={p.onEkspor} />
        </section>
      );
  }
}

/**
 * Marketing Officer: susunan ringkas. Halaman yang menyebut nama rekan kerja
 * (Ketergantungan Orang Kunci, Perlu Ditanyakan) sengaja tidak tersedia di sini.
 */
export function TampilanMO(p: PropsTampilan) {
  switch (p.halaman) {
    case 'tindakan':
      return (
        <Bagian id="tindakan" judul={p.sendiri ? 'Daftar Kerja Saya' : 'Daftar Kerja'} sub="Prospek terbuka, diurutkan menurut skor prioritas.">
          <Kartu>
            <KepalaKartu
              ikon="list" judul={`${p.d.prioritas.length} prospek terbuka`} sub="Tanpa nama nasabah/prospek — hanya ID (Aturan Emas)."
              aksi={<button type="button" className="tombol kecil sekunder" onClick={p.onEkspor}><Ikon nama="download" ukuran={16} /> CSV</button>}
            />
            <TabelPrioritas daftar={p.d.prioritas} tampilMO={false} tampilCabang={false} batas={12} />
          </Kartu>
        </Bagian>
      );
    case 'ritme': return <RitmeKerja d={p.d} />;
    case 'detail': return <DetailLatar />;
    default:
      return (
        <section className="bagian" id="ringkasan">
          <Ringkasan d={p.d} filter={p.filter} onFilter={p.onFilter} onKe={p.onKe} onEkspor={p.onEkspor} judulHero={p.sendiri ? 'Produksi Saya' : 'Produksi Tahun Berjalan'} />
        </section>
      );
  }
}
