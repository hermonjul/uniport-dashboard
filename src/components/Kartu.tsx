import type { ReactNode } from 'react';
import { Ikon, type NamaIkon } from './Ikon';

export function Kartu({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section className={`kartu ${className}`} id={id}>{children}</section>;
}

export function KepalaKartu({ ikon, judul, sub, aksi }: { ikon: NamaIkon; judul: string; sub?: ReactNode; aksi?: ReactNode }) {
  return (
    <header className="kepala-kartu">
      <span className="ikon-kotak"><Ikon nama={ikon} /></span>
      <div className="kepala-teks">
        <h3>{judul}</h3>
        {sub && <p className="teks-redup">{sub}</p>}
      </div>
      {aksi && <div className="kepala-aksi">{aksi}</div>}
    </header>
  );
}

/** Chip perubahan: selalu menampilkan angka + panah, tidak mengandalkan warna saja. */
export function ChipDelta({ nilai, label, teks }: { nilai: number; label?: string; teks: string }) {
  const arah = nilai > 0 ? 'naik' : nilai < 0 ? 'turun' : 'datar';
  return (
    <span className="baris-delta">
      <span className={`chip-delta ${arah}`}>
        {teks}
        {arah !== 'datar' && <Ikon nama={arah === 'naik' ? 'arrowUp' : 'arrowDown'} ukuran={14} />}
      </span>
      {label && <span className="teks-redup">{label}</span>}
    </span>
  );
}

// export function LencanaSifat({ sifat }: { sifat: 'produksi' | 'simulasi' }) {
//   return sifat === 'produksi'
//     ? <span className="lencana lencana-contoh" title="Rincian dibangkitkan; total nasional dijangkarkan ke angka PRD">Produksi: data contoh</span>
//     : <span className="lencana lencana-simulasi" title="Ekspor Matrix Distribution belum tersedia">Effort: simulasi</span>;
// }

export function Bagian({ id, judul, sub, children, aksi }: { id: string; judul: string; sub?: ReactNode; children: ReactNode; aksi?: ReactNode }) {
  return (
    <section className="bagian" id={id} aria-label={judul}>
      <div className="bagian-kepala">
        <div>
          {sub && <p className="teks-redup">{sub}</p>}
        </div>
        {aksi}
      </div>
      {children}
    </section>
  );
}

export function PilStatus({ status }: { status: string }) {
  return <span className={`pil pil-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

export function Progres({ nilai, label }: { nilai: number; label: string }) {
  const lebar = Math.max(0, Math.min(1, isFinite(nilai) ? nilai : 0)) * 100;
  return (
    <div className="progres" role="progressbar" aria-label={label} aria-valuenow={Math.round(lebar)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progres-isi" style={{ width: `${lebar}%` }} />
    </div>
  );
}
