import { useEffect, useState } from 'react';
import { daftarkanLabelWilayah } from '../logika/agregasi';
import { ambilKanwil, idUnitDariKodeApi, type KanwilApi } from './matrix';

export type StatusKanwil =
  | { status: 'memuat' }
  | { status: 'ok'; data: KanwilApi[] }
  | { status: 'galat'; pesan: string };

// Dimuat sekali per sesi halaman lalu dipakai ulang (daftar wilayah jarang berubah).
let tembolok: Promise<KanwilApi[]> | null = null;

export function useKanwil(): StatusKanwil {
  const [s, setS] = useState<StatusKanwil>({ status: 'memuat' });
  useEffect(() => {
    let aktif = true;
    tembolok ??= ambilKanwil()
      .then((data) => {
        // Supaya breadcrumb & judul bisa menamai wilayah yang hanya ada di API.
        daftarkanLabelWilayah(data.map((k) => ({ id: idUnitDariKodeApi(k.code), nama: k.label?.trim() || k.code })));
        return data;
      })
      .catch((e) => { tembolok = null; throw e; });
    tembolok
      .then((data) => { if (aktif) setS({ status: 'ok', data }); })
      .catch((e: Error) => { if (aktif) setS({ status: 'galat', pesan: e.message }); });
    return () => { aktif = false; };
  }, []);
  return s;
}
