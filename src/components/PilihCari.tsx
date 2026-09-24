import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Ikon } from './Ikon';

export interface OpsiCari { nilai: string; nama: string }

const pecahKata = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Dropdown berpencarian (combobox): tombol pemicu + panel berisi kolom cari dan daftar
 * yang bisa di-scroll dengan tinggi terbatas — pengganti <select> untuk daftar panjang
 * (mis. 107 cabang Agency Network Development).
 * Keyboard: ↑/↓ pindah sorotan, Enter memilih, Esc menutup, ketik untuk menyaring.
 */
export function PilihCari({
  label, keterangan, nilai, opsi, labelSemua, onPilih, nonaktif, pesanNonaktif, memuat, pesanMemuat = 'Memuat…', pesanKosong,
}: {
  label: string; keterangan?: ReactNode; nilai: string; opsi: OpsiCari[]; labelSemua: string;
  onPilih: (nilai: string) => void; nonaktif?: boolean; pesanNonaktif?: string; memuat?: boolean; pesanMemuat?: string;
  /** Ditampilkan di daftar bila tidak ada pilihan sama sekali (bukan karena pencarian). */
  pesanKosong?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [q, setQ] = useState('');
  const [sorot, setSorot] = useState(0);
  const akar = useRef<HTMLDivElement>(null);
  const daftar = useRef<HTMLUListElement>(null);
  const cari = useRef<HTMLInputElement>(null);
  const id = useId();

  // Opsi "Semua …" (nilai '') selalu di urutan pertama selama tidak sedang menyaring.
  const semua = useMemo<OpsiCari[]>(() => [{ nilai: '', nama: labelSemua }, ...opsi], [labelSemua, opsi]);
  // Tiap kata yang diketik harus cocok dengan AWAL salah satu kata di nama, tanpa peduli tanda
  // baca & urutan: "jak glo" → "MPA JAKARTA - GLODOK", "sawah" → "MPA JAKARTA - SAWAH BESAR".
  const tersaring = useMemo(() => {
    const kataCari = pecahKata(q);
    if (!kataCari.length) return semua;
    return opsi.filter((o) => {
      const kataNama = pecahKata(o.nama);
      return kataCari.every((k) => kataNama.some((n) => n.startsWith(k)));
    });
  }, [q, opsi, semua]);

  const terpilih = semua.find((o) => o.nilai === nilai);
  const teksTombol = nonaktif ? pesanNonaktif ?? labelSemua : memuat ? pesanMemuat : terpilih?.nama ?? labelSemua;

  const tutup = () => { setBuka(false); setQ(''); };
  const pilih = (o: OpsiCari) => { tutup(); if (o.nilai !== nilai) onPilih(o.nilai); };

  // Saat dibuka: fokus ke kolom cari & sorot opsi yang sedang terpilih.
  useEffect(() => {
    if (!buka) return;
    setSorot(Math.max(0, semua.findIndex((o) => o.nilai === nilai)));
    requestAnimationFrame(() => cari.current?.focus());
    const klik = (e: MouseEvent) => { if (!akar.current?.contains(e.target as Node)) tutup(); };
    document.addEventListener('mousedown', klik);
    return () => document.removeEventListener('mousedown', klik);
  }, [buka]);

  useEffect(() => { setSorot(0); }, [q]);
  // Jaga opsi yang disorot tetap terlihat di area scroll.
  useEffect(() => {
    daftar.current?.querySelector<HTMLElement>(`[data-i="${sorot}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sorot, buka]);

  const tombolKeyboard = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSorot((i) => Math.min(tersaring.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSorot((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (tersaring[sorot]) pilih(tersaring[sorot]); }
    else if (e.key === 'Escape') { e.preventDefault(); tutup(); }
  };

  return (
    <div className="pilih-filter pilih-cari" ref={akar}>
      <span id={`${id}-label`}>{label}{keterangan}</span>
      <button
        type="button" className="pemicu-cari" disabled={nonaktif || memuat} aria-busy={memuat}
        aria-haspopup="listbox" aria-expanded={buka} aria-labelledby={`${id}-label ${id}-nilai`}
        title={nonaktif ? pesanNonaktif : teksTombol}
        onClick={() => setBuka(!buka)}
        onKeyDown={(e) => { if (!buka && (e.key === 'ArrowDown' || e.key === 'Enter')) { e.preventDefault(); setBuka(true); } }}
      >
        <span id={`${id}-nilai`} className="pemicu-teks">{teksTombol}</span>
        <Ikon nama="chevronDown" ukuran={16} />
      </button>

      {buka && (
        <div className="panel-cari" onKeyDown={tombolKeyboard}>
          <div className="kolom-cari">
            <Ikon nama="search" ukuran={16} />
            <input
              ref={cari} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Cari ${label.toLowerCase()}…`}
              role="combobox" aria-expanded aria-controls={`${id}-daftar`} aria-activedescendant={`${id}-opsi-${sorot}`}
              aria-label={`Cari ${label}`}
            />
            {q && <button type="button" className="hapus-cari" onClick={() => { setQ(''); cari.current?.focus(); }} aria-label="Hapus pencarian"><Ikon nama="x" ukuran={14} /></button>}
          </div>
          <ul className="daftar-cari" role="listbox" id={`${id}-daftar`} ref={daftar} aria-labelledby={`${id}-label`}>
            {tersaring.map((o, i) => (
              <li
                key={o.nilai || '__semua'} id={`${id}-opsi-${i}`} data-i={i} role="option" aria-selected={o.nilai === nilai}
                className={`${i === sorot ? 'disorot' : ''} ${o.nilai === nilai ? 'terpilih' : ''} ${o.nilai === '' ? 'opsi-semua' : ''}`}
                onMouseEnter={() => setSorot(i)} onMouseDown={(e) => { e.preventDefault(); pilih(o); }}
              >
                <span>{o.nama}</span>
                {o.nilai === nilai && <Ikon nama="check" ukuran={16} />}
              </li>
            ))}
            {tersaring.length === 0 && <li className="kosong-cari" role="presentation">Tidak ada yang cocok dengan “{q}”</li>}
            {!q && opsi.length === 0 && pesanKosong && <li className="kosong-cari" role="presentation">{pesanKosong}</li>}
          </ul>
          <p className="jumlah-cari">{q ? `${tersaring.length} dari ${opsi.length}` : `${opsi.length} pilihan`}</p>
        </div>
      )}
    </div>
  );
}
