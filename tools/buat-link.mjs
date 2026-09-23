// Membuat tautan portal terenkripsi.
//   npm run link                         → tautan contoh untuk keempat portal
//   npm run link -- <peran> <unitId> [hari] [urlDasar]
// Contoh: npm run link -- pemimpin-wilayah KW2 7
import { ambilKunci, enkrip, PERAN_SAH } from './lib-akses.mjs';

const kunci = ambilKunci();
const [peran, unitId, hari = '30', dasar = process.env.PORTAL_URL || 'http://127.0.0.1:5175/'] = process.argv.slice(2);

const tautan = (p, u, h) => {
  const token = enkrip({ p, u, exp: Math.floor(Date.now() / 1000) + Number(h) * 86400 }, kunci);
  const url = new URL(dasar);
  url.searchParams.set('akses', token);
  return url.toString();
};

if (peran) {
  if (!PERAN_SAH.includes(peran) || !unitId) {
    console.error(`Peran harus salah satu dari: ${PERAN_SAH.join(', ')}, dan unitId wajib diisi.`);
    process.exit(1);
  }
  console.log(tautan(peran, unitId, hari));
} else {
  // Unit contoh: Nasional, Kantor Wilayah 1, Cabang Samarinda, Novita Lubis (lihat PERSONA di src/data/sumber.ts).
  const contoh = [
    ['Direksi (Nasional)', 'direksi', 'NAS'],
    ['Pemimpin Wilayah (Kantor Wilayah 1)', 'pemimpin-wilayah', 'KW1'],
    ['Pimpinan Cabang (Cabang Samarinda)', 'pimpinan-cabang', 'KW3-C04'],
    ['Marketing Officer (Novita Lubis)', 'marketing-officer', 'MO0561'],
  ];
  for (const [label, p, u] of contoh) console.log(`\n${label}\n${tautan(p, u, hari)}`);
  console.log(`\nBerlaku ${hari} hari.`);
}
