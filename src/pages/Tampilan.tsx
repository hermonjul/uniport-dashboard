import type { Cakupan, FilterKanal } from '../logika/agregasi';
import type { Dasbor } from '../logika/dasbor';
import { DetailLatar } from './bagian/Detail';
import { AIInsight } from './bagian/Insight';
import { Kinerja } from './bagian/Kinerja';
import { OrangKunci, PerluDitanyakan } from './bagian/Orang';
import { ProyeksiTarget } from './bagian/Proyeksi';
import { Ringkasan } from './bagian/Ringkasan';
import { RitmeKerja } from './bagian/Ritme';
import { PerluTindakan } from './bagian/Tindakan';

export interface PropsTampilan {
  halaman: string;
  d: Dasbor; filter: FilterKanal; onFilter: (f: FilterKanal) => void; onBuka: (c: Cakupan) => void;
  onKe: (id: string) => void; onEkspor: () => void; onEksporPosisi: () => void;
}

/**
 * Satu susunan halaman untuk semua portal & semua tingkat filter (Nasional s.d. satu MO).
 * Akses halaman tidak lagi dibedakan per peran karena portal tidak lagi dibuka lewat tautan terenkripsi.
 */
export function Tampilan(p: PropsTampilan) {
  switch (p.halaman) {
    case 'tindakan': return <PerluTindakan d={p.d} onBuka={p.onBuka} onEkspor={p.onEkspor} />;
    case 'proyeksi': return <ProyeksiTarget d={p.d} />;
    case 'kinerja': return <Kinerja d={p.d} onBuka={p.onBuka} onEksporPosisi={p.onEksporPosisi} />;
    case 'ritme': return <RitmeKerja d={p.d} />;
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
