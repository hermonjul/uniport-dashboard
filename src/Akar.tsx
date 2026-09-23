import { useEffect, useState } from 'react';
import App from './App';
import { NASIONAL } from './logika/agregasi';
import { periksaAkses, type Akses, type HasilAkses } from './logika/akses';
import { AksesGagal, MemeriksaAkses } from './pages/Akses';

/**
 * Akses lewat tautan terenkripsi (?akses=…) SEMENTARA DIMATIKAN: URL dibuka seperti biasa dan
 * langsung masuk sebagai portal Direksi. Nyalakan lagi dengan VITE_AKSES_TAUTAN=aktif di .env
 * (lalu jalankan `npm run api`); seluruh alurnya masih ada di logika/akses.ts & tools/.
 */
const PAKAI_TAUTAN = import.meta.env.VITE_AKSES_TAUTAN === 'aktif';
const AKSES_BAWAAN: Akses = { peran: 'direksi', unitId: NASIONAL.id, akar: NASIONAL };

export function Akar() {
  return PAKAI_TAUTAN ? <AkarTautan /> : <App akses={AKSES_BAWAAN} />;
}

/** Memeriksa tautan akses ke API, lalu membuka portal sesuai hasil decrypt-nya. */
function AkarTautan() {
  const [hasil, setHasil] = useState<HasilAkses | null>(null);

  useEffect(() => {
    let aktif = true;
    periksaAkses().then((h) => { if (aktif) setHasil(h); });
    return () => { aktif = false; };
  }, []);

  if (!hasil) return <MemeriksaAkses />;
  if (!hasil.ok) return <AksesGagal alasan={hasil.alasan} />;
  return <App akses={hasil.akses} />;
}
