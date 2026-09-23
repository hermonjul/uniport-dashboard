import { useCallback, useEffect, useMemo, useState } from 'react';
import { KELOMPOK_KANAL, TAHUN_BERJALAN } from './config/dashboard';
import { FilterUnit } from './components/FilterUnit';
import { kodeKanwilApi, type ParameterFilterApi } from './api/matrix';
import { Kartu } from './components/Kartu';
import { Ikon } from './components/Ikon';
import { PilihPeriode } from './components/PilihPeriode';
import { Sidebar, type GrupMenu } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import {
  cabangAdaData, dalamAkar, jalur, kodeCabangApi, labelFilter, posisiCakupan, wilayahAdaData, labelPeriode, namaCakupan, PERAN, PERIODE_PENUH, type Cakupan, type FilterKanal, type Periode,
} from './logika/agregasi';
import type { Akses } from './logika/akses';
import { eksporDaftarKerja, eksporPosisi } from './logika/csv';
import { hitungDasbor } from './logika/dasbor';
import { tanggalPanjang } from './logika/format';
import { TampilanMO, TampilanPimpinan } from './pages/Tampilan';

type Tema = 'terang' | 'gelap';

// localStorage bisa diblokir (mode privat, file://) — selalu dibungkus try/catch.
const simpan = {
	baca: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
	tulis: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* abaikan */ } },
};

// Setiap menu = satu halaman, dialamatkan lewat hash (#/kinerja) supaya tombol Back
// browser berfungsi dan tetap jalan saat dibuka lewat file:// tanpa server.
const JUDUL_HALAMAN: Record<string, string> = {
	ringkasan: 'Ringkasan',
	tindakan: 'Perlu Tindakan',
	proyeksi: 'Proyeksi Pencapaian Target',
	kinerja: 'Kinerja',
	insight: 'AI Insight', 'orang-kunci': 'Ketergantungan Orang Kunci',
	ditanyakan: 'Perlu Ditanyakan',
	ritme: 'Ritme Kerja',
	detail: 'Detail & Latar Belakang',
};
const HALAMAN_PIMPINAN = ['ringkasan', 'tindakan', 'proyeksi', 'kinerja', 'insight', 'orang-kunci', 'ditanyakan', 'detail'];
const HALAMAN_MO = ['ringkasan', 'tindakan', 'ritme', 'detail'];
const halamanDariHash = () => window.location.hash.replace(/^#\/?/, '') || 'ringkasan';

const PILIHAN_FILTER: FilterKanal[] = [
  'Semua', 'Direct', ...KELOMPOK_KANAL.Direct.map((s) => `sub:${s}` as const),
  'Captive', ...KELOMPOK_KANAL.Captive.map((s) => `sub:${s}` as const),
];

export default function App({ akses }: { akses: Akses }) {
  // Tema dipilih manual, tidak mengikuti setelan sistem (kondisi layar ruang rapat beragam).
  const [tema, setTema] = useState<Tema>(() => (simpan.baca('uniport-tema') === 'gelap' ? 'gelap' : 'terang'));
  // Peran & unit ditentukan tautan akses (hasil decrypt API) — tidak bisa diganti dari tampilan.
  const { peran, akar } = akses;
  const [cakupan, setCakupan] = useState<Cakupan>(akar);
  const [filter, setFilter] = useState<FilterKanal>('Semua');
  const [ciut, setCiut] = useState(() => simpan.baca('uniport-ciut') === '1');
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [halamanHash, setHalamanHash] = useState(halamanDariHash);
  const [menuEkspor, setMenuEkspor] = useState(false);
  const [periode, setPeriode] = useState<Periode>(PERIODE_PENUH);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'gelap' ? 'dark' : 'light';
    simpan.tulis('uniport-tema', tema);
  }, [tema]);
  useEffect(() => simpan.tulis('uniport-ciut', ciut ? '1' : '0'), [ciut]);

  const d = useMemo(() => hitungDasbor(cakupan, filter, periode), [cakupan, filter, periode]);
  const modeMO = cakupan.tingkat === 'mo';
  // Wilayah yang hanya ada di API (mis. Agency Development) belum punya data lokal.
  const belumAdaData = (cakupan.tingkat === 'kanwil' && !wilayahAdaData(cakupan.id))
    || (cakupan.tingkat === 'cabang' && !cabangAdaData(cakupan.id));

  // Parameter filter yang nanti dikirim ke API data setiap kali filter berubah.
  // TODO: sambungkan ke endpoint data backend Go begitu tersedia.
  const parameterApi = useMemo<ParameterFilterApi>(() => {
    const pos = posisiCakupan(cakupan);
    return {
      kanwil: pos.kanwilId ? kodeKanwilApi(pos.kanwilId) : undefined,
      cabang: pos.cabangId ? kodeCabangApi(pos.cabangId) ?? pos.cabangId : undefined, mo: pos.moId,
      channel: filter === 'Semua' ? undefined : labelFilter(filter).replace(/^Semua /, ''),
      bulanDari: periode.dari + 1, bulanSampai: periode.sampai + 1, tahun: TAHUN_BERJALAN,
    };
  }, [cakupan, filter, periode]);
  useEffect(() => { if (import.meta.env.DEV) console.debug('[filter → API]', parameterApi); }, [parameterApi]);
  // Halaman Detail & Latar berisi dokumentasi statis — filter, ekspor, dan pita sifat data tidak relevan di sana.
  const halamanDetail = halamanHash === 'detail';
  // Halaman yang tidak ada untuk peran/cakupan aktif (mis. Kinerja di tampilan MO) kembali ke Ringkasan.
  const halaman = (modeMO ? HALAMAN_MO : HALAMAN_PIMPINAN).includes(halamanHash) ? halamanHash : 'ringkasan';

  useEffect(() => {
    const f = () => setHalamanHash(halamanDariHash());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [halaman, cakupan]);

  // Turun/naik jenjang tetap di halaman yang sama (mis. Kinerja Kanwil → Kinerja Cabang).
  // Unit di luar hierarki portal ini (mis. cabang lain bagi Pimpinan Cabang) ditolak.
  const buka = useCallback((c: Cakupan) => { if (dalamAkar(akar, c)) setCakupan(c); }, [akar]);

  const ke = useCallback((id: string) => {
    setMenuTerbuka(false);
    if (halamanDariHash() === id) return;
    window.location.hash = `/${id}`;
    setHalamanHash(id);
  }, []);

  // "Saya" hanya untuk portal MO sendiri — bukan saat pimpinan memfilter ke satu MO.
  const sendiri = akar.tingkat === 'mo';
  const mendesak = d.jt.lewat.jumlah + d.jt.hariIni.jumlah;
  const grup: GrupMenu[] = modeMO
    ? [
        { judul: 'Menu utama', item: [
          { id: 'ringkasan', label: 'Dashboard', ikon: 'grid' },
          { id: 'tindakan', label: sendiri ? 'Daftar Kerja Saya' : 'Daftar Kerja', ikon: 'list', lencana: d.prioritas.length },
          { id: 'ritme', label: 'Ritme Kerja', ikon: 'activity' },
        ] },
        { judul: 'Umum', item: [{ id: 'detail', label: 'Detail & Latar', ikon: 'help' }] },
      ]
    : [
        { judul: 'Menu utama', item: [
          { id: 'ringkasan', label: 'Dashboard', ikon: 'grid' },
          { id: 'tindakan', label: 'Perlu Tindakan', ikon: 'alert', lencana: mendesak },
          { id: 'proyeksi', label: 'Proyeksi Target', ikon: 'target' },
          { id: 'kinerja', label: 'Kinerja', ikon: 'chart' },
          { id: 'insight', label: 'AI Insight', ikon: 'sparkle', lencana: d.insight.length },
        ] },
        { judul: 'Orang', item: [
          { id: 'orang-kunci', label: 'Orang Kunci', ikon: 'users', lencana: d.konsentrasi.length },
          { id: 'ditanyakan', label: 'Perlu Ditanyakan', ikon: 'userQ', lencana: d.ditanyakan.length },
        ] },
        { judul: 'Umum', item: [{ id: 'detail', label: 'Detail & Latar', ikon: 'help' }] },
      ];

  const ekspor = () => { eksporDaftarKerja(d.nama, d.prioritas); setMenuEkspor(false); };
  const eksporPos = () => { eksporPosisi(d.nama, d.anak, labelPeriode(periode)); setMenuEkspor(false); };
  const remah = jalur(cakupan, akar);

  const props = {
    halaman, sendiri, d, filter, onFilter: setFilter, onBuka: buka, onKe: ke, onEkspor: ekspor, onEksporPosisi: eksporPos,
  };

  return (
    <div className={`kerangka ${ciut ? 'menu-ciut' : ''}`}>
      <Sidebar
        grup={grup} aktif={halaman} onPilih={ke} ciut={ciut} onCiut={() => setCiut(!ciut)}
        terbuka={menuTerbuka} onTutup={() => setMenuTerbuka(false)} onSumberData={() => ke('detail')}
      />
      <div className="kolom-utama">
        <Topbar
          peran={peran} namaUnit={namaCakupan(akar)} akar={akar} onBuka={buka}
          tema={tema} onTema={() => setTema(tema === 'terang' ? 'gelap' : 'terang')}
          mendesak={mendesak} onMendesak={() => ke('tindakan')} onBantuan={() => ke('detail')} onMenu={() => setMenuTerbuka(true)}
        />
        <main className="panel-isi">
          <div className="kepala-halaman">
            <div>
              <nav className="remah" aria-label="Jenjang">
                {remah.map((c, i) => (
                  <span key={c.tingkat + c.id}>
                    {i > 0 && <Ikon nama="chevronRight" ukuran={14} />}
                    {i < remah.length - 1
                      ? <button type="button" className="tautan" onClick={() => buka(c)}>{namaCakupan(c)}</button>
                      : <span aria-current="page">{namaCakupan(c)}</span>}
                  </span>
                ))}
              </nav>
              <h1>{modeMO && halaman === 'tindakan' ? (sendiri ? 'Daftar Kerja Saya' : 'Daftar Kerja') : halaman !== 'ringkasan' ? JUDUL_HALAMAN[halaman] : cakupan.tingkat === akar.tingkat ? `Selamat datang kembali, ${peran === 'marketing-officer' ? namaCakupan(akar) : PERAN[peran].label}` : d.nama}</h1>
              <p className="teks-redup">
                {halamanDetail ? 'Sumber data, koreksi periode, asumsi, dan kepatuhan.' : <>
                  Posisi {d.nama} · produksi {labelPeriode(periode, true)}
                  {filter !== 'Semua' && <> · channel <strong>{labelFilter(filter)}</strong></>}
                </>}
              </p>
            </div>
            <div className="kepala-aksi-halaman">
              {halamanDetail
                ? <span className="chip-tanggal"><Ikon nama="calendar" ukuran={18} /> {tanggalPanjang(new Date())}</span>
                : <PilihPeriode periode={periode} onUbah={setPeriode} />}
              {!halamanDetail && <div className="ekspor">
                <button type="button" className="tombol gelap" onClick={() => setMenuEkspor(!menuEkspor)} aria-expanded={menuEkspor}>
                  <Ikon nama="upload" ukuran={18} /> Export <Ikon nama="chevronDown" ukuran={16} />
                </button>
                {menuEkspor && (
                  <div className="menu-tarik" role="menu">
                    <button type="button" role="menuitem" onClick={ekspor}>Daftar kerja (CSV)</button>
                    {!modeMO && <button type="button" role="menuitem" onClick={eksporPos}>Posisi {d.labelAnak} (CSV)</button>}
                  </div>
                )}
              </div>}
            </div>
          </div>

          {!halamanDetail && <FilterUnit akar={akar} cakupan={cakupan} onBuka={buka} />}

          {!modeMO && !halamanDetail && (
            <div className="filter-kanal" role="toolbar" aria-label="Filter channel">
              <span className="teks-redup"><Ikon nama="filter" ukuran={16} /> Channel</span>
              {PILIHAN_FILTER.map((f) => (
                <button
                  type="button" key={f} aria-pressed={filter === f}
                  className={`chip-filter ${filter === f ? 'aktif' : ''} ${f === 'Direct' || f === 'Captive' || f === 'Semua' ? 'induk' : ''}`}
                  onClick={() => setFilter(f)}
                >{labelFilter(f)}</button>
              ))}
            </div>
          )}

          {belumAdaData && !halamanDetail ? (
            <Kartu className="data-kosong">
              <span className="akses-ikon waspada"><Ikon nama="info" ukuran={26} /></span>
              <h2>Data {d.nama} belum tersedia</h2>
              <p className="teks-redup">
                Unit ini terdaftar di API <code>{cakupan.tingkat === 'cabang' ? 'matrix/branches' : 'matrix/kanwils'}</code>, tetapi datanya belum dimuat ke dashboard.
                Data akan diambil dari API sesuai filter begitu endpoint datanya tersedia.
              </p>
              <button type="button" className="tombol sekunder" onClick={() => buka(akar)}>Kembali ke {namaCakupan(akar)}</button>
            </Kartu>
          ) : modeMO ? <TampilanMO {...props} /> : <TampilanPimpinan {...props} />}

          <footer className="kaki">Uniport Executive Dashboard · prototipe peragaan · Asuransi Sinar Mas</footer>
        </main>
      </div>
    </div>
  );
}
