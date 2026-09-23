import { AMBANG_CABANG_KONSENTRASI, AMBANG_MO_TURUN, BULAN_P26, PORSI_KONSENTRASI } from '../../config/dashboard';
import { Ikon } from '../../components/Ikon';
import { Bagian, Kartu, KepalaKartu, Progres } from '../../components/Kartu';
import { jumlahBulan, labelPeriode, type Cakupan } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { persen, rp } from '../../logika/format';

function Penegas() {
  return (
    <p className="penegas">
      <Ikon nama="info" ukuran={18} />
      <span><strong>Bahan percakapan, bukan penilaian kinerja.</strong> Produksi bisa turun atau terkonsentrasi karena alasan wajar — pindah peran, cuti, portofolio dialihkan.</span>
    </p>
  );
}

export function OrangKunci({ d, onBuka }: { d: Dasbor; onBuka: (c: Cakupan) => void }) {
  return (
    <Bagian id="orang-kunci" judul="Ketergantungan Orang Kunci" sub="Cabang mana yang berisiko kalau satu orang berhenti?">
      <Penegas />
      <Kartu>
        <KepalaKartu
          ikon="users" judul={`${d.konsentrasi.length} cabang bertumpu pada satu MO`}
          sub={`Porsi MO terbesar ≥ ${persen(PORSI_KONSENTRASI, 0)} · hanya cabang dengan produksi ≥ ${rp((AMBANG_CABANG_KONSENTRASI * jumlahBulan(d.periode)) / BULAN_P26)} dalam periode`}
        />
        {d.konsentrasi.length ? (
          <div className="tabel-bungkus">
            <table className="tabel">
              <thead><tr><th>Cabang</th><th>MO terbesar</th><th className="kanan">Produksi {labelPeriode(d.periode)}</th><th>Porsi MO terbesar</th></tr></thead>
              <tbody>
                {d.konsentrasi.slice(0, 12).map((k) => (
                  <tr key={k.cabang.id}>
                    <td><button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'cabang', id: k.cabang.id })}>{k.cabang.nama}</button></td>
                    <td><button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'mo', id: k.moTeratas.id })}>{k.moTeratas.kode}</button></td>
                    <td className="kanan">{rp(k.nwp26)}</td>
                    <td><div className="sel-progres"><Progres nilai={k.porsi} label={`Porsi ${persen(k.porsi, 0)}`} /><strong>{persen(k.porsi, 0)}</strong></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="kosong-isi">Tidak ada cabang yang melewati ambang pada cakupan ini.</p>}
      </Kartu>
    </Bagian>
  );
}

export function PerluDitanyakan({ d, onBuka }: { d: Dasbor; onBuka: (c: Cakupan) => void }) {
  return (
    <Bagian id="ditanyakan" judul="Perlu Ditanyakan" sub="Siapa yang produksinya jatuh drastis dan perlu ditanyakan — bukan dinilai?">
      <Penegas />
      <Kartu>
        <KepalaKartu
          ikon="userQ" judul={`${d.ditanyakan.length} MO turun ke nol atau minus`}
          sub={`Tahun lalu di atas ${rp(AMBANG_MO_TURUN)}. MO yang baru bergabung tidak diikutkan.`}
        />
        {d.ditanyakan.length ? (
          <div className="tabel-bungkus">
            <table className="tabel">
              <thead><tr><th>MO</th><th>Cabang</th><th>Sub-channel</th><th className="kanan">NWP 2025</th><th className="kanan">NWP {labelPeriode(d.periode)}</th></tr></thead>
              <tbody>
                {d.ditanyakan.slice(0, 12).map((m) => (
                  <tr key={m.id}>
                    <td><button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'mo', id: m.id })}>{m.kode}</button></td>
                    <td>{m.cabangNama}</td>
                    <td>{m.subKanal}</td>
                    <td className="kanan">{rp(m.nwp25)}</td>
                    <td className="kanan teks-turun">{rp(m.nwp26)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="kosong-isi">Tidak ada MO yang memenuhi kriteria pada cakupan ini.</p>}
        {d.ditanyakan.length > 12 && <p className="catatan">Menampilkan 12 dari {d.ditanyakan.length} MO, diurutkan dari produksi tahun lalu terbesar.</p>}
      </Kartu>
    </Bagian>
  );
}
