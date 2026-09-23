import { useEffect, useRef, useState } from 'react';
import { BULAN_P26, NAMA_BULAN_PANJANG } from '../config/dashboard';
import { labelPeriode, PERIODE_PENUH, type Periode } from '../logika/agregasi';
import { Ikon } from './Ikon';

const akhir = BULAN_P26 - 1;
const PRESET: { label: string; p: Periode }[] = [
  { label: 'Tahun berjalan', p: PERIODE_PENUH },
  { label: 'Bulan terakhir', p: { dari: akhir, sampai: akhir } },
  { label: '3 bulan terakhir', p: { dari: akhir - 2, sampai: akhir } },
  { label: 'Kuartal I', p: { dari: 0, sampai: 2 } },
  { label: 'Kuartal II', p: { dari: 3, sampai: 5 } },
];
const sama = (a: Periode, b: Periode) => a.dari === b.dari && a.sampai === b.sampai;

/** Filter tanggal per bulan (Januari s.d. bulan terakhir data 2026). */
export function PilihPeriode({ periode, onUbah }: { periode: Periode; onUbah: (p: Periode) => void }) {
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const klik = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setBuka(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false); };
    document.addEventListener('mousedown', klik);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', klik); document.removeEventListener('keydown', esc); };
  }, [buka]);

  // Jaga dari ≤ sampai: menggeser salah satu ujung ikut menggeser ujung lainnya bila perlu.
  const ubahDari = (dari: number) => onUbah({ dari, sampai: Math.max(dari, periode.sampai) });
  const ubahSampai = (sampai: number) => onUbah({ dari: Math.min(sampai, periode.dari), sampai });
  const bulan = NAMA_BULAN_PANJANG.slice(0, BULAN_P26);

  return (
    <div className="periode" ref={ref}>
      <button type="button" className="chip-tanggal tombol-periode" onClick={() => setBuka(!buka)} aria-haspopup="dialog" aria-expanded={buka}>
        <Ikon nama="calendar" ukuran={18} />
        <span><small className="teks-redup">Periode</small> {labelPeriode(periode)}</span>
        <Ikon nama="chevronDown" ukuran={16} />
      </button>
      {buka && (
        <div className="menu-tarik menu-periode" role="dialog" aria-label="Pilih periode">
          <div className="preset-periode">
            {PRESET.map((x) => (
              <button
                type="button" key={x.label} className={`chip-filter ${sama(x.p, periode) ? 'aktif' : ''}`}
                aria-pressed={sama(x.p, periode)} onClick={() => { onUbah(x.p); setBuka(false); }}
              >
                {x.label}<small>{labelPeriode(x.p).replace(/ \d{4}$/, '')}</small>
              </button>
            ))}
          </div>
          <div className="rentang-periode">
            <label className="pilih-filter">
              <span>Dari</span>
              <select value={periode.dari} onChange={(e) => ubahDari(Number(e.target.value))}>
                {bulan.map((b, i) => <option key={b} value={i}>{b}</option>)}
              </select>
            </label>
            <label className="pilih-filter">
              <span>Sampai</span>
              <select value={periode.sampai} onChange={(e) => ubahSampai(Number(e.target.value))}>
                {bulan.map((b, i) => <option key={b} value={i}>{b}</option>)}
              </select>
            </label>
          </div>
          <p className="catatan">
            Per bulan, {NAMA_BULAN_PANJANG[0]}–{NAMA_BULAN_PANJANG[akhir]} 2026. Sebaran bulanan masih simulasi.
            Prospek &amp; effort selalu posisi hari ini.
          </p>
        </div>
      )}
    </div>
  );
}
