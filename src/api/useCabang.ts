import { useEffect, useState } from 'react';
import { daftarkanCabangApi } from '../logika/agregasi';
import { ambilCabang, kodeKanwilApi } from './matrix';

export type StatusCabang =
  | { status: 'tanpa-wilayah' }
  | { status: 'memuat' }
  | { status: 'ok'; data: { id: string; nama: string }[] }
  | { status: 'galat'; pesan: string };

// Satu permintaan per wilayah per sesi halaman; dipakai ulang saat wilayah dipilih lagi.
const tembolok = new Map<string, Promise<{ id: string; nama: string }[]>>();

/** Daftar Pimpinan Cabang untuk wilayah terpilih, dari API matrix/branches. */
export function useCabang(kanwilId: string | undefined): StatusCabang {
  const [s, setS] = useState<StatusCabang>({ status: kanwilId ? 'memuat' : 'tanpa-wilayah' });
  useEffect(() => {
    if (!kanwilId) { setS({ status: 'tanpa-wilayah' }); return; }
    let aktif = true;
    setS({ status: 'memuat' });
    let janji = tembolok.get(kanwilId);
    if (!janji) {
      janji = ambilCabang(kodeKanwilApi(kanwilId)).then((d) => daftarkanCabangApi(kanwilId, d));
      janji.catch(() => tembolok.delete(kanwilId)); // gagal → coba lagi saat wilayah dipilih ulang
      tembolok.set(kanwilId, janji);
    }
    janji
      .then((data) => { if (aktif) setS({ status: 'ok', data }); })
      .catch((e: Error) => { if (aktif) setS({ status: 'galat', pesan: e.message }); });
    return () => { aktif = false; };
  }, [kanwilId]);
  return s;
}
