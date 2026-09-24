import { useEffect, useState } from 'react';
import { daftarkanMOApi, kodeCabangApi } from '../logika/agregasi';
import { ambilMarketing } from './matrix';

export type StatusMarketing =
  | { status: 'tanpa-cabang' }
  /** Cabang dari data lokal (tidak punya kode API) → pakai daftar MO lokal. */
  | { status: 'lokal' }
  | { status: 'memuat' }
  | { status: 'ok'; data: { id: string; nama: string }[] }
  | { status: 'galat'; pesan: string };

const tembolok = new Map<string, Promise<{ id: string; nama: string }[]>>();

/** Daftar Marketing Officer untuk cabang terpilih, dari API matrix/marketings (kode cabang dari matrix/branches). */
export function useMarketing(cabangId: string | undefined): StatusMarketing {
  const [s, setS] = useState<StatusMarketing>({ status: 'tanpa-cabang' });
  useEffect(() => {
    if (!cabangId) { setS({ status: 'tanpa-cabang' }); return; }
    const kode = kodeCabangApi(cabangId);
    if (!kode) { setS({ status: 'lokal' }); return; }
    let aktif = true;
    setS({ status: 'memuat' });
    let janji = tembolok.get(cabangId);
    if (!janji) {
      janji = ambilMarketing(kode).then((d) => daftarkanMOApi(cabangId, d));
      janji.catch(() => tembolok.delete(cabangId));
      tembolok.set(cabangId, janji);
    }
    janji
      .then((data) => { if (aktif) setS({ status: 'ok', data }); })
      .catch((e: Error) => { if (aktif) setS({ status: 'galat', pesan: e.message }); });
    return () => { aktif = false; };
  }, [cabangId]);
  return s;
}
