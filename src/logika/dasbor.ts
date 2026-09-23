// Merangkai seluruh olahan untuk satu cakupan + filter channel menjadi satu model tampilan.
import {
  daftarPrioritas, hitungJatuhTempo, hitungProduksi, hitungProyeksi, ketergantunganOrangKunci,
  kinerjaAnak, moDalam, namaCakupan, perluDitanyakan, prospekDalam, ritmeKerja, sebaranBeban,
  labelPeriode, PERIODE_PENUH, type Cakupan, type FilterKanal, type Periode,
} from './agregasi';
import { susunInsight } from './insight';

const LABEL_ANAK = { nasional: 'Kantor Wilayah', kanwil: 'cabang', cabang: 'Marketing Officer', mo: '' } as const;

export function hitungDasbor(cakupan: Cakupan, filter: FilterKanal, periode: Periode = PERIODE_PENUH) {
  const nama = namaCakupan(cakupan);
  const mos = moDalam(cakupan, filter);
  const prospek = prospekDalam(cakupan, filter);
  const prod = hitungProduksi(mos, periode);
  const prioritas = daftarPrioritas(prospek);
  const jt = hitungJatuhTempo(prospek);
  const proyeksi = hitungProyeksi(prod, prospek);
  const beban = sebaranBeban(cakupan, filter);
  const konsentrasi = ketergantunganOrangKunci(cakupan, filter, periode);
  const ditanyakan = perluDitanyakan(cakupan, filter, periode);
  const anak = kinerjaAnak(cakupan, filter, periode);
  const ritme = ritmeKerja(mos);
  const labelAnak = LABEL_ANAK[cakupan.tingkat];

  const lewatHot = prioritas.filter((p) => p.status === 'Hot' && (p.sisaHari ?? 0) < 0);
  const insight = susunInsight({
    namaUnit: nama, prod, proyeksi,
    lewatHot: { jumlah: lewatHot.length, premi: lewatHot.reduce((s, p) => s + p.premi, 0) },
    mendesak: jt.lewat.jumlah + jt.hariIni.jumlah,
    konsentrasi, ditanyakan: ditanyakan.length, anak, labelAnak, labelPeriode: labelPeriode(periode),
  });

  return { cakupan, periode, nama, mos, prospek, prod, prioritas, jt, proyeksi, beban, konsentrasi, ditanyakan, anak, ritme, labelAnak, insight };
}

export type Dasbor = ReturnType<typeof hitungDasbor>;
