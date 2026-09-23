import { useEffect, useRef, useState } from 'react';
import { cari, PERAN, type Cakupan, type Peran } from '../logika/agregasi';
import { Ikon } from './Ikon';

/** Inisial dari nama unit: "Novita Lubis" → NL, "Kantor Wilayah 1" → K1, "Nasional" → NA. */
function inisial(nama: string): string {
  const kata = nama.replace(/^(Cabang|Kantor Wilayah)\s+/i, (m) => m[0] + ' ').split(/\s+/).filter(Boolean);
  return (kata.length > 1 ? kata[0][0] + kata[kata.length - 1][0] : nama.slice(0, 2)).toUpperCase();
}

const CAKUPAN_PORTAL: Record<Peran, string> = {
  direksi: 'Melihat seluruh data: Kantor Wilayah, cabang, dan Marketing Officer.',
  'pemimpin-wilayah': 'Melihat data cabang dan Marketing Officer di wilayah ini.',
  'pimpinan-cabang': 'Melihat data Marketing Officer di cabang ini.',
  'marketing-officer': 'Melihat data milik sendiri.',
};

export function Topbar({
  peran, namaUnit, akar, onBuka, tema, onTema, mendesak, onMendesak, onBantuan, onMenu,
}: {
  peran: Peran; namaUnit: string;
  akar: Cakupan; onBuka: (c: Cakupan) => void; tema: 'terang' | 'gelap'; onTema: () => void;
  mendesak: number; onMendesak: () => void; onBantuan: () => void; onMenu: () => void;
}) {
  const [q, setQ] = useState('');
  const [fokus, setFokus] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [profilTerbuka, setProfilTerbuka] = useState(false);
  const profil = useRef<HTMLDivElement>(null);

  // Tutup menu profil saat klik di luar atau menekan Esc.
  useEffect(() => {
    if (!profilTerbuka) return;
    const klik = (e: MouseEvent) => { if (!profil.current?.contains(e.target as Node)) setProfilTerbuka(false); };
    const tombol = (e: KeyboardEvent) => { if (e.key === 'Escape') setProfilTerbuka(false); };
    document.addEventListener('mousedown', klik);
    document.addEventListener('keydown', tombol);
    return () => { document.removeEventListener('mousedown', klik); document.removeEventListener('keydown', tombol); };
  }, [profilTerbuka]);
  const hasil = fokus ? cari(q, akar) : [];
  const bisaCari = akar.tingkat !== 'mo';

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); }
      if (e.key === 'Escape') input.current?.blur();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  return (
    <header className="topbar">
      <button type="button" className="tombol-ikon hanya-mobile" onClick={onMenu} aria-label="Buka menu"><Ikon nama="menu" /></button>

      {bisaCari ? (
        <div className="cari">
          <Ikon nama="search" ukuran={18} />
          <input
            ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari cabang atau MO"
            onFocus={() => setFokus(true)} onBlur={() => setTimeout(() => setFokus(false), 150)}
            aria-label="Cari cabang atau Marketing Officer"
          />
          <kbd className="sembunyi-mobile">⌘ K</kbd>
          {fokus && q.trim().length >= 2 && (
            <ul className="hasil-cari" role="listbox">
              {hasil.length === 0 && <li className="kosong">Tidak ada yang cocok dalam cakupan Anda</li>}
              {hasil.map((h) => (
                <li key={h.cakupan.id}>
                  <button type="button" onMouseDown={() => { onBuka(h.cakupan); setQ(''); }}>
                    <Ikon nama={h.cakupan.tingkat === 'mo' ? 'users' : 'layers'} ukuran={18} />
                    <span><strong>{h.nama}</strong><small className="teks-redup">{h.ket}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : <div className="cari-kosong" />}

      <div className="topbar-kanan">
        {/* Portal ditentukan tautan akses — hanya ditampilkan, tidak bisa diganti. */}
        <span className="chip-portal sembunyi-mobile" title="Ditentukan oleh tautan akses Anda">
          <Ikon nama="shield" ukuran={16} /> Portal {PERAN[peran].label}
        </span>
        <button type="button" className="tombol-ikon sembunyi-mobile" onClick={onBantuan} aria-label="Sumber data & bantuan"><Ikon nama="help" /></button>
        <button type="button" className="tombol-ikon" onClick={onTema} aria-label={tema === 'terang' ? 'Pakai tema gelap' : 'Pakai tema terang'}>
          <Ikon nama={tema === 'terang' ? 'moon' : 'sun'} />
        </button>
        <button type="button" className="tombol-ikon bel" onClick={onMendesak} aria-label={`${mendesak} tindak lanjut mendesak`}>
          <Ikon nama="bell" />
          {mendesak > 0 && <span className="bel-titik">{mendesak > 99 ? '99+' : mendesak}</span>}
        </button>
        <div className="profil" ref={profil}>
          <button
            type="button" className="avatar" onClick={() => setProfilTerbuka(!profilTerbuka)}
            aria-haspopup="dialog" aria-expanded={profilTerbuka} aria-label={`Profil portal ${namaUnit}`}
          >{inisial(namaUnit)}</button>
          {profilTerbuka && (
            <div className="menu-tarik menu-profil" role="dialog" aria-label="Profil portal">
              <div className="profil-info">
                <span className="avatar kecil" aria-hidden="true">{inisial(namaUnit)}</span>
                <span><strong>{namaUnit}</strong><small className="teks-redup">Portal {PERAN[peran].label}</small></span>
              </div>
              <p className="profil-cakupan teks-redup">{CAKUPAN_PORTAL[peran]}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
