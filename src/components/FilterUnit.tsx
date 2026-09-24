import { idUnitDariKodeApi } from '../api/matrix';
import { useCabang } from '../api/useCabang';
import { useKanwil, type StatusKanwil } from '../api/useKanwil';
import { useMarketing } from '../api/useMarketing';
import {
  pilihanCabang, pilihanKanwil, pilihanMO, posisiCakupan, type Cakupan,
} from '../logika/agregasi';
import { Ikon } from './Ikon';
import { PilihCari } from './PilihCari';

/**
 * Pilihan Pemimpin Wilayah = SELURUH isi respons API matrix/kanwils, urutan & label apa adanya
 * (label kosong → kode). Semua bisa dipilih: datanya nanti diambil lagi dari API sesuai filter.
 * Kode API "1" dipetakan ke unit dashboard "KW1". Daftar lokal hanya dipakai bila API gagal.
 */
function pilihanWilayah(api: StatusKanwil): { nilai: string; nama: string }[] {
  if (api.status === 'galat') return pilihanKanwil().map((k) => ({ nilai: k.id, nama: k.nama }));
  if (api.status !== 'ok') return [];
  return api.data.map((k) => ({ nilai: idUnitDariKodeApi(k.code), nama: k.label?.trim() || k.code }));
}

/**
 * Filter per peran sesuai hierarki portal (dari tautan akses):
 * Direksi → Pemimpin Wilayah, Pimpinan Cabang, Marketing Officer ·
 * Pemimpin Wilayah → Pimpinan Cabang & MO di wilayahnya · Pimpinan Cabang → MO di cabangnya ·
 * Marketing Officer → tidak ada filter. Tiap pilihan membuka portal unit yang dipimpin
 * peran tersebut; memilih "Semua" pada satu tingkat kembali ke tingkat di atasnya.
 */
export function FilterUnit({ akar, cakupan, onBuka }: { akar: Cakupan; cakupan: Cakupan; onBuka: (c: Cakupan) => void }) {
  const kanwilApi = useKanwil();
  const pos = posisiCakupan(cakupan);
  const kanwilId = akar.tingkat === 'nasional' ? pos.kanwilId : posisiCakupan(akar).kanwilId;
  // Pimpinan Cabang diambil dari API berdasarkan kode wilayah terpilih.
  const cabangApi = useCabang(akar.tingkat === 'nasional' || akar.tingkat === 'kanwil' ? kanwilId : undefined);
  const cabangId = akar.tingkat === 'cabang' ? akar.id : pos.cabangId;
  // Marketing Officer diambil dari API berdasarkan kode cabang terpilih.
  const moApi = useMarketing(akar.tingkat === 'mo' ? undefined : cabangId);
  if (akar.tingkat === 'mo') return null;

  const tampilKanwil = akar.tingkat === 'nasional';
  const tampilCabang = akar.tingkat === 'nasional' || akar.tingkat === 'kanwil';
  const diAkar = cakupan.tingkat === akar.tingkat && cakupan.id === akar.id;

  return (
    <div className="filter-unit" role="group" aria-label="Filter unit">
      <span className="teks-redup"><Ikon nama="users" ukuran={16} /> Filter</span>
      {tampilKanwil && (
        <PilihCari
          label="Pemimpin Wilayah" labelSemua="Semua Pemimpin Wilayah"
          keterangan={kanwilApi.status === 'galat' && (
            <small className="sumber-lokal" title={`API matrix/kanwils tidak terjangkau (${kanwilApi.pesan})`}> · data lokal</small>
          )}
          nilai={kanwilId ?? ''} memuat={kanwilApi.status === 'memuat'} pesanMemuat="Memuat daftar wilayah…"
          opsi={pilihanWilayah(kanwilApi)}
          onPilih={(v) => onBuka(v ? { tingkat: 'kanwil', id: v } : akar)}
        />
      )}
      {tampilCabang && (
        <PilihCari
          label="Pimpinan Cabang" labelSemua="Semua Pimpinan Cabang"
          keterangan={cabangApi.status === 'galat' && (
            <small className="sumber-lokal" title={`API matrix/branches tidak terjangkau (${cabangApi.pesan})`}> · data lokal</small>
          )}
          nilai={cabangId ?? ''} nonaktif={!kanwilId} pesanNonaktif="Pilih Pemimpin Wilayah dulu"
          pesanKosong="Belum ada cabang di wilayah ini"
          memuat={!!kanwilId && cabangApi.status === 'memuat'} pesanMemuat="Memuat daftar cabang…"
          opsi={(kanwilId ? (cabangApi.status === 'ok' ? cabangApi.data : cabangApi.status === 'galat' ? pilihanCabang(kanwilId) : []) : [])
            .map((c) => ({ nilai: c.id, nama: c.nama }))}
          onPilih={(v) => onBuka(v ? { tingkat: 'cabang', id: v } : kanwilId ? { tingkat: 'kanwil', id: kanwilId } : akar)}
        />
      )}
      <PilihCari
        label="Marketing Officer" labelSemua="Semua Marketing Officer"
        keterangan={moApi.status === 'galat' && (
          <small className="sumber-lokal" title={`API matrix/marketings tidak terjangkau (${moApi.pesan})`}> · data lokal</small>
        )}
        nilai={pos.moId ?? ''} nonaktif={!cabangId} pesanNonaktif="Pilih Pimpinan Cabang dulu"
        memuat={moApi.status === 'memuat'} pesanMemuat="Memuat daftar marketing…"
        pesanKosong="Belum ada Marketing Officer di cabang ini"
        opsi={(moApi.status === 'ok' ? moApi.data : cabangId && (moApi.status === 'lokal' || moApi.status === 'galat') ? pilihanMO(cabangId) : [])
          .map((m) => ({ nilai: m.id, nama: m.nama }))}
        onPilih={(v) => onBuka(v ? { tingkat: 'mo', id: v } : cabangId ? { tingkat: 'cabang', id: cabangId } : akar)}
      />
      {!diAkar && (
        <button type="button" className="tombol kecil sekunder" onClick={() => onBuka(akar)}>
          <Ikon nama="x" ukuran={14} /> Atur ulang
        </button>
      )}
    </div>
  );
}
