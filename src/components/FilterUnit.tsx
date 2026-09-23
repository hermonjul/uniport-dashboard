import { idUnitDariKodeApi } from '../api/matrix';
import { useCabang } from '../api/useCabang';
import { useKanwil, type StatusKanwil } from '../api/useKanwil';
import {
  pilihanCabang, pilihanKanwil, pilihanMO, posisiCakupan, type Cakupan,
} from '../logika/agregasi';
import { Ikon } from './Ikon';

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
  if (akar.tingkat === 'mo') return null;
  const cabangId = akar.tingkat === 'cabang' ? akar.id : pos.cabangId;

  const tampilKanwil = akar.tingkat === 'nasional';
  const tampilCabang = akar.tingkat === 'nasional' || akar.tingkat === 'kanwil';
  const diAkar = cakupan.tingkat === akar.tingkat && cakupan.id === akar.id;

  return (
    <div className="filter-unit" role="group" aria-label="Filter unit">
      <span className="teks-redup"><Ikon nama="users" ukuran={16} /> Filter</span>
      {tampilKanwil && (
        <label className="pilih-filter">
          <span>
            Pemimpin Wilayah
            {kanwilApi.status === 'galat' && (
              <small className="sumber-lokal" title={`API matrix/kanwils tidak terjangkau (${kanwilApi.pesan})`}> · data lokal</small>
            )}
          </span>
          <select
            value={kanwilId ?? ''} aria-busy={kanwilApi.status === 'memuat'}
            onChange={(e) => onBuka(e.target.value ? { tingkat: 'kanwil', id: e.target.value } : akar)}
          >
            {kanwilApi.status === 'memuat'
              ? <option value={kanwilId ?? ''}>Memuat daftar wilayah…</option>
              : <option value="">Semua Pemimpin Wilayah</option>}
            {pilihanWilayah(kanwilApi).map((k) => <option key={k.nilai} value={k.nilai}>{k.nama}</option>)}
          </select>
        </label>
      )}
      {tampilCabang && (
        <label className="pilih-filter">
          <span>
            Pimpinan Cabang
            {cabangApi.status === 'galat' && (
              <small className="sumber-lokal" title={`API matrix/branches tidak terjangkau (${cabangApi.pesan})`}> · data lokal</small>
            )}
          </span>
          <select
            value={cabangId ?? ''} disabled={!kanwilId} aria-busy={cabangApi.status === 'memuat'}
            title={!kanwilId ? 'Pilih Pemimpin Wilayah dulu' : undefined}
            onChange={(e) => onBuka(e.target.value ? { tingkat: 'cabang', id: e.target.value } : kanwilId ? { tingkat: 'kanwil', id: kanwilId } : akar)}
          >
            {!kanwilId && <option value="">Pilih Pemimpin Wilayah dulu</option>}
            {kanwilId && cabangApi.status === 'memuat' && <option value={cabangId ?? ''}>Memuat daftar cabang…</option>}
            {kanwilId && cabangApi.status !== 'memuat' && <option value="">Semua Pimpinan Cabang</option>}
            {kanwilId && (cabangApi.status === 'ok' ? cabangApi.data : cabangApi.status === 'galat' ? pilihanCabang(kanwilId) : [])
              .map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </label>
      )}
      <label className="pilih-filter">
        <span>Marketing Officer</span>
        <select
          value={pos.moId ?? ''} disabled={!cabangId}
          title={!cabangId ? 'Pilih Pimpinan Cabang dulu' : undefined}
          onChange={(e) => onBuka(e.target.value ? { tingkat: 'mo', id: e.target.value } : cabangId ? { tingkat: 'cabang', id: cabangId } : akar)}
        >
          <option value="">{cabangId ? 'Semua Marketing Officer' : 'Pilih Pimpinan Cabang dulu'}</option>
          {cabangId && pilihanMO(cabangId).map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
      </label>
      {!diAkar && (
        <button type="button" className="tombol kecil sekunder" onClick={() => onBuka(akar)}>
          <Ikon nama="x" ukuran={14} /> Atur ulang
        </button>
      )}
    </div>
  );
}
